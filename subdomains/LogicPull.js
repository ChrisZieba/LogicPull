/*  Copyright 2012-2016 Chris Zieba

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
  version = require('../package.json').version,
  logicpull = module.exports = express(),
  config = require('../config');

// set the development variables
logicpull.configure('development', function () {
  logicpull.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));

  for (var setting in config.development) {
    logicpull.set(setting, config.development[setting]);
  }
});

// set the production variables
logicpull.configure('production', function () {
  logicpull.use(express.errorHandler()); 
  for (var setting in config.production) {
    logicpull.set(setting, config.production[setting]);
  }
});

// These settings are common to both environments
logicpull.configure(function () {
  logicpull.use(express.static(logicpull.get('base_location') + 'public/'));
  logicpull.engine('.html', require('ejs').__express);
  logicpull.set('views', logicpull.get('base_location') + 'views/logicpull');
  logicpull.set('view engine', 'ejs');
  logicpull.set('version', version);
});

require('../routes/index')(logicpull);
require('../routes/interviews/index')(logicpull);

// Non manager admin users (clients completing interviews)
require('../routes/admin/login')(logicpull);
require('../routes/admin/index')(logicpull);

// Manager users
require('../routes/manager/login')(logicpull);
require('../routes/manager/interviews')(logicpull);
require('../routes/manager/deliverables')(logicpull);
require('../routes/manager/users')(logicpull);
require('../routes/manager/index')(logicpull);