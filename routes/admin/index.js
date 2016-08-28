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

var mongoose = require('mongoose'),
  bcrypt = require('bcryptjs'),
  auth = require('../../middleware/interviews/auth'),
  fs = require('fs'),
  nodemailer = require("nodemailer"),
  models = require('../../models/models'),
  sanitizor = require('../../lib/validation/sanitizor'),
  validator = require('../../lib/validation/validator');

module.exports = function (app) {
  "use strict";

  // Admin section
  app.get('/admin', auth.validated, function (req, res) {
    // the group id of the user.. so we can show only the relevant interviews
    var group_id = req.session.user.group;
    var user_id = req.session.user.id;

    models.Saves.find({}).where('user_id').equals(user_id).exec(function(err, saved) {
      if (err) {
        console.log(err);
        throw err;
      } 
      // send the output to the view
      res.render('admin/layout', { 
        title: 'LogicPull Interviews | Dashboard',
        name: req.session.user.name,
        layout: 'dashboard',
        saved: saved
      });
    });
  });

  app.get('/admin/interviews', function (req, res) {
    var user_id = req.session.user.id;
    var outputs = models.Outputs.find({});

    // make sure the group id of the logged in user matches that from the URL
    outputs = outputs.where('user_id').equals(user_id);
    outputs.exec(function(err, outputs) {
      if (err) {
        console.log(err);
        throw err;
      }

      // send the output to the view
      res.render('admin/layout', { 
        title: 'LogicPull',
        name: req.session.user.name,
        layout: 'interviews',
        outputs: outputs,
        user: req.session.user
      });
    });
  });

  app.get('/admin/account', function (req, res) {
    var group_id = req.session.user.group;
    var user_id = req.session.user.id;

    // send the output to the view
    res.render('admin/layout', { 
      title: 'LogicPull Manager | Account',
      name: req.session.user.name,
      layout: 'account',
      user: req.session.user
    });
  });

  // This gets called when we are trying to login the user while they are completing an interview
  app.post('/admin/ltf_login', function (req, res) {
    if (req.method === 'POST') {
      // sanitize the inputs from the form
      var email = sanitizor.clean(req.body.email);
      var password = sanitizor.clean(req.body.password);

      // make sure the input is valid and then sanitize it
      if (validator.check(email, ['required', 'email']) && validator.check(password, ['required'])) { 
        models.Users.findOne({ 'email': email }, function (err, doc) {
          if (err) {
            console.log(err);
            throw err;
          } 

          if (doc) {
            bcrypt.compare(password, doc.password, function(err, found) {
              if (err) {
                console.log(err);
                throw err;
              } 
              if (found) {
                // the password was found!
                req.session.user = {
                  id: doc.id,
                  name: doc.name,
                  email: doc.email,
                  group: doc.group,
                  privledges: doc.privledges,
                  authenticated: true
                };

                // update the user login date
                doc.last_login = new Date();
                doc.save(function(err) {
                  if (err) {
                    console.log(err);
                    throw err;
                  } 

                  res.json({
                    error: false,
                    msg: "You are now logged in."
                  }); 
                });

              } else {
                // the password is not in the database or is wrong
                res.json({
                  error: true,
                  msg: "The password you entered is incorrect."
                });
              }
            });
          } else {
            // the password is not in the database or is wrong
            res.json({
              error: true,
              msg: "The user could not be found."
            });
          }
        });
      } else {
        res.json({
          error: true,
          msg: "A valid email and a password is required."
        });
      }
    }
  });

  // Only post to this URL
  app.post('/admin/ltf_register', function (req, res) {
    // sanitize the inputs from the form
    var clean_email = sanitizor.clean(req.body.email);
    var clean_password = sanitizor.clean(req.body.password);
    var clean_verify_password = sanitizor.clean(req.body.verify_password);

    // make sure the input is valid and then sanitize it
    if (validator.check(clean_email, ['required', 'email']) && validator.check(clean_password, ['required', {'minlength':6}, {'maxlength':15}, 'password']) && validator.check(clean_verify_password, ['required', {'minlength':6}, {'maxlength':15}, 'password'])) { 
      if (clean_password === clean_verify_password) {
        models.Users.findOne({ 'email': clean_email }, function (err, user) {
          if (err) {
            console.log(err);
            throw err;
          }
          // We need to see if the email given to use is already in the database. 
          // If it is, return with an error message telling them to pick a new one
          if (!user) {
            models.Counters.findOne({}, function (err, counter) {
              // hash  a new password for the new user
              bcrypt.hash(clean_password, 10, function(err, hash) {
                if (err) {
                  console.log(err);
                  throw err;
                } 

                var new_user = new models.Users();
                var count = counter.user_count + 1;

                new_user.id = count;
                new_user.name = 'user_' + count;
                new_user.email = clean_email;
                new_user.password = hash;
                new_user.group = 0;
                new_user.privledges = {
                  "add_interview": false
                };
                new_user.created = new Date();
                new_user.last_login = new Date();

                new_user.save(function(err) {
                  if (err) {
                    console.log(err);
                    throw err;
                  } 
                  // send a success!
                  req.session.user = {
                    id: count,
                    name: 'user_' + count,
                    email: clean_email,
                    group: 0,
                    privledges: {
                      "add_interview": false
                    },
                    // this blocks logging into the manager with this account 
                    authenticated: true
                  };
                  res.json({
                    error: false,
                    msg: "Your registration was successful"
                  }); 

                  //update the counter in the database
                  models.Counters.update({user_count: count}, function (err) {
                    if (err) {
                      console.log(err);
                      throw err;
                    } 
                  });
                });
              });
            });

          } else {
            // the user already exits in the database
            res.json({
              error: true,
              msg: "The email you entered is already registered."
            });
          }
        });
      } else {
        // the user already exits in the database
        res.json({
          error: true,
          msg: "Your passwords must match."
        });         
      }
    } else {
      // the user already exits in the database
      res.json({
        error: true,
        msg: "All fields are required. Your password must be between 6 and 15 characters."
      });
    }
  });

  // send the user a password
  app.all('/admin/reset', function (req, res) {
    var view = function (data) { 
      var load = {
        msg : data.msg,
        valid: data.valid,
        info: req.flash('valid')
      };

      res.render('admin/auth/forgot', load);
    };

    if (req.method === 'POST') {
      var clean_email = sanitizor.clean(req.body.email);
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
            models.Users.update({id:user.id}, {reset_date: new Date(), reset_token: token}, function (err) {
              if (err) {
                console.log(err);
                throw err;
              } 

              if ( !app.get('disable_email_password_reset')) {
                // send out the email
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
                  text: "To reset you password, paste the following link into your browser:" + app.get('base_url') + "/interviews/reset/" + token ,
                  html: "<div><p>Someone, hopefully you, has requested that your LogicPull account password be reset, or your password has expired and requires updating. If you <span style=\"font-weight:bold\">did not</span> request a password reset than please ignore this email and nothing will change. To reset your password please copy the following url into your browser to complete the password reset process.</p><a href=\"" + app.get('base_url') + "/interviews/reset/" + token + "\">" + app.get('base_url') + "/interviews/reset/" + token + "</a><br></div>"
                };

                // send mail with defined transport object
                transport.sendMail(message, function(err, response) {
                  if(err) {
                    console.log(err);
                    view({msg: "There was a problem sending your email. Please try again.", valid: false});
                  } 

                  req.flash('valid', true);
                  res.redirect('/interviews/reset');
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

  // send the user a password
  app.all('/admin/reset/:reset_token', [auth.validateResetToken], function (req, res) {

    function view (data) { 
      var load = {
        msg : data.msg,
        valid: data.valid
      };

      res.render('admin/auth/reset', load);
    }

    // now that we have confirmed the token is in the database for some user we can check if it still valid
    if (req.method === 'POST') {
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
            models.Users.findOneAndUpdate({id:res.locals.user.id}, {password: hash, reset_token: null, reset_data: null}, function (err, user) {
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
              res.redirect(app.get('interviews_url'));
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

  // use this to check whether a user is still logged in
  app.get('/admin/post/status',  function (req, res) {
    if (req.session.user) {
      if (req.session.user.authenticated) {
        res.json({logged_in: true});  
      } else {
        res.json({logged_in: false}); 
      }
    } else {
      res.json({logged_in: false}); 
    }
  });

  app.get('/admin/post/id',  function (req, res) {
    if (req.session.user) {
      res.json({id: req.session.user.id});  
    } else {
      res.json({id: null}); 
    }
  });

  // execute when a user logs out
  app.get('/admin/logout', auth.validated, function (req, res) {
    req.session.user = {};
    res.redirect('/admin');
  });
};
