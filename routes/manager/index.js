/*  Copyright 2014 Chris Zieba <zieba.chris@gmail.com>

  This program is free software: you can redistribute it and/or modify it under the terms of the GNU
  Affero General Public License as published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.
  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
  PURPOSE. See the GNU Affero General Public License for more details. You should have received a
  copy of the GNU Affero General Public License along with this program. If not, see
  <http://www.gnu.org/licenses/>.
*/

var bcrypt = require('bcrypt'),
  fs = require('fs'),
  sanitizor = require('../../lib/validation/sanitizor'),
  validator = require('../../lib/validation/validator'),
  utils = require('../../lib/utils'),
  models = require('../../models/models'),
  nodemailer = require("nodemailer"),
  auth = require('../../middleware/manager/auth');
 
module.exports = function (app) {
  "use strict";

  // admin section
  app.get('/manager', auth.validated, function (req, res) {
    // the group id of the user.. so we can show only the relevant interviews
    var group_id = req.session.user.group;
    var user_id = req.session.user.id;
    var interviews = models.Interviews.find({});
    var outputs = models.Outputs.find({});

    // make sure the group id of the logged in user matches that from the URL
    interviews = interviews.where('group').equals(group_id).where('disabled').equals(false);
    outputs = outputs.where('interview.group').equals(group_id);
    outputs = outputs.limit(10).sort('-date');

    interviews.exec(function(err, interviews) {
      if (err) {
        console.log(err);
        throw err;
      }

      outputs.exec(function (err, outputs) {
        if (err) {
          console.log(err);
          throw err;
        } 
        // send the output to the view
        res.render('manager/layout', { 
          title: 'LogicPull Manager | Dashboard',
          name: req.session.user.name,
          layout: 'dashboard',
          interviews: interviews,
          outputs: outputs,
          user: req.session.user
        });
      });
    });
  });

  // Send the user a password
  app.all('/manager/reset', function (req, res) {
    var clean_email;

    function view (data) { 
      var load = {
        msg : data.msg,
        valid: data.valid,
        info: req.flash('valid')
      };

      res.render('manager/auth/forgot', load);
    }

    if (req.method == 'POST') {
      clean_email = sanitizor.clean(req.body.email);

      // make sure the input is valid and then sanitize it
      if (validator.check(clean_email, ['required', 'email'])) {  
        models.Users.findOne({ 'email': clean_email }, function (err, user) {
          if (err) {
            console.log(err);
            throw err;
          } 

          if (user) {
            // build a reset token
            var token = require('crypto').createHash('md5').update(user.email + new Date().getTime()).digest("hex");

            // update the user reset info
            models.Users.update({id:user.id}, {
              reset_date: new Date(), 
              reset_token: token
            }, function (err) {
              if (err) {
                console.log(err);
                throw err;
              } 

              // only send the email if supported
              if ( !app.get('disable_email_password_reset')) {
                var transport_options = {
                  host: app.get('email_host')
                };

                // check if smtp auth is required
                if (app.get('email_enable_auth')) {
                  transport_options.auth = {
                    user: app.get('email_auth_user'),
                    pass: app.get('email_auth_pass')
                  };
                }

                var transport = nodemailer.createTransport("SMTP", transport_options);

                var message = {
                  from: app.get('email_from'),
                  to: clean_email,
                  subject: 'LogicPull Password Reset',
                  text: "Someone, hopefully you, has requested that your LogicPull account password be reset, or your password has expired and requires updating. If you did not request a password reset than please ignore this email and nothing will change. To reset your password please copy the following url into your browser to complete the password reset process." + app.get('base_url') + "/manager/reset/" + token + ".",
                  html: "<div><p>Someone, hopefully you, has requested that your LogicPull account password be reset, or your password has expired and requires updating. If you <span style=\"font-weight:bold\">did not</span> request a password reset than please ignore this email and nothing will change. To reset your password please copy the following url into your browser to complete the password reset process.</p><a href=\"" + app.get('base_url') + "/manager/reset/" + token + "\">" + app.get('base_url') + "/manager/reset/" + token + "</a><br><br></div>"
                };

                // send mail with defined transport object
                transport.sendMail(message, function(err, response) {
                  if (err) {
                    console.log(err);
                    view({msg: "There was a problem sending your email. Please try again.", valid: false});
                  } 
                  req.flash('valid', true);
                  res.redirect('/manager/reset');
                });
              }
            }); 
          } else {
            // the password is not in the database or is wrong
            view({msg: "The email you entered is not valid. Please try again.", valid: false});
          }
        });
      } else {
        view({msg: "Please enter the email address that you used when you registered.", valid: false});
      }
    } else {
      view({msg:null, valid: false});
    }
  });

  // Send the user a password
  app.all('/manager/reset/:reset_token', [auth.validateResetToken], function (req, res) {
    function view (data) { 
      var load = {
        msg : data.msg,
        valid: data.valid
      };

      res.render('manager/auth/reset', load);
    }

    // now that we have confirmed the token is in the database for some user we can check if it still valid
    if (req.method == 'POST') {
      var clean_password = sanitizor.clean(req.body.password);
      var clean_verify_password = sanitizor.clean(req.body.verify_password);

      // make sure the input is valid and then sanitize it
      if (validator.check(clean_password, ['required', {'minlength':6}, {'maxlength':15}]) && validator.check(clean_verify_password, ['required', {'minlength':6}, {'maxlength':15}])) {  
        if (clean_password === clean_verify_password) {
          bcrypt.hash(clean_password, 10, function(err, hash) {
            if (err) {
              console.log(err);
              throw err;
            } 
            // update the password and remove the token from the table
            models.Users.findOneAndUpdate({id:res.locals.user.id}, {
              password: hash, 
              reset_token: null, 
              reset_data: null
            }, function (err, user) {
              if (err) {
                console.log(err);
                throw err;
              }
              // log the user in
              req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                group: user.group,
                privledges: user.privledges,
                authenticated: true
              };
              res.redirect('/manager');
            });                     
          });
        } else {
          view({msg: "Please make sure your passwords match.", valid: false});
        }
      } else {
        view({msg: "Both fields are required to reset your password, which must be between 6 and 15 characters.", valid: false});
      }
    } else {
      view({msg:null, valid: false});
    }
  });

  app.get('/manager/account', [auth.validated], function (req, res) {
    var group_id = req.session.user.group;
    var user_id = req.session.user.id;

    // send the output to the view
    res.render('manager/layout', { 
      title: 'LogicPull Manager | Account',
      name: req.session.user.name,
      layout: 'account',
      user: req.session.user
    });
  });

  app.get('/manager/search', [auth.validated], function (req, res) {
    if (!req.query.q) {
      // find any comlpeted interviews where the name matches
      res.render('manager/layout', { 
        title: 'LogicPull Manager | Search Results',
        name: req.session.user.name,
        layout: 'search',
        interviews: [],
        outputs: [],
        user: req.session.user
      });
    } else {
      var query = req.query.q;
      var group_id = req.session.user.group;
      
      // What the user typed into the search bar
      var regex = new RegExp('.*' + query + '.*', 'i');
      var interviews = models.Interviews.find( { $or: [ { "name": regex } , { "description": regex } ] });
      var outputs = models.Outputs.find({"client_fullname": regex});

      // make sure the group id of the logged in user matches that from the URL
      interviews = interviews.where('group').equals(group_id);
      //outputs = outputs.where('interview.group').equals(group_id);
      outputs = outputs.limit(100).sort('-date');

      interviews.exec(function (err, interviews) {
        if (err) {
          console.log(err);
          throw err;
        }

        outputs.exec(function (err, outputs) {
          if (err) {
            console.log(err);
            throw err;
          } 

          // find any comlpeted interviews where the name matches
          res.render('manager/layout', { 
            title: 'LogicPull Manager | Search Results',
            name: req.session.user.name,
            layout: 'search',
            interviews: interviews,
            outputs: outputs,
            user: req.session.user
          });
        });
      });
    }
  });

  // keep this last!
  app.get('*', function(req, res) {
    res.status(404).render('manager/404',{
      title: '404'
    }); 
  });
};
