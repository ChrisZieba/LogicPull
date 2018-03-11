/*  Copyright 2012-2018 Chris Zieba

  This program is free software: you can redistribute it and/or modify it under the terms of the GNU
  Affero General Public License as published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.
  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
  PURPOSE. See the GNU Affero General Public License for more details. You should have received a
  copy of the GNU Affero General Public License along with this program. If not, see
  <http://www.gnu.org/licenses/>.
*/

var express = require('express'),
  app = module.exports = express(),
  MongoStore = require('connect-mongo')(express),
  server = require('http').createServer(app),
  fs = require('fs'),
  socket = require('./lib/sockets'),
  flash = require('./middleware/flash'),
  version = require('./package.json').version,
  config = require('./config');


// Set the development variables
app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 

  // Add in all the config settings
  for(var setting in config.development) {
    app.set(setting, config.development[setting]);
  }
});

// Set the production variables
app.configure('production', function () {
  app.use(express.errorHandler()); 

  for(var setting in config.production) {
    app.set(setting, config.production[setting]);
  }
});

// set up the sessions to use the mongo database
var sessionStore = new MongoStore({
  url: 'mongodb://' + app.get('mongo_host') + ':' + app.get('mongo_port') + '/' + app.get('mongo_db'),
  autoReconnect: true
});

// These settings are common to both environments
app.configure(function () {
  app.use(express.static(__dirname + '/public/'));
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.engine('.html', require('ejs').__express);
  app.set('views', __dirname + '/views/logicpull');
  // Without this you would need to supply the extension to res.render()
  app.set('view engine', 'ejs');
  // used in CSS and JavaScript as query string
  app.set('version', version);

  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  
  // This attaches the session to the req object
  app.use(express.session({
    store: sessionStore,
    secret: app.get('session_secret'),
    cookie: {  
      path: app.get('cookie_path'),  
      httpOnly: app.get('cookie_http_only'),  
      maxAge: app.get('cookie_max_age'),
      secure: app.get('cookie_secure'),
      domain: app.get('domain')
    }
  }));
  
  app.use(express.csrf());

  // Generate a token for the form...the form input must be created
  app.use(function(req, res, next) {
    res.locals.token = req.csrfToken();
    next();
  });


  app.use(flash());
  app.use(app.router);

  require('./routes/index')(app);
  require('./routes/interviews/index')(app);

  // Non manager admin users (clients completing interviews)
  require('./routes/admin/login')(app);
  require('./routes/admin/index')(app);

  // Manager users
  require('./routes/manager/login')(app);
  require('./routes/manager/interviews')(app);
  require('./routes/manager/editor')(app);
  require('./routes/manager/deliverables')(app);
  require('./routes/manager/users')(app);
  require('./routes/manager/index')(app);

});

// run the server with websockets
server.listen(app.get('server_port'));
socket.listen(server, sessionStore, app);