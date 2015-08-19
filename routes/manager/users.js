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

  // View the users page
  app.get('/manager/users', [auth.validated, auth.privledges('view_users')], function (req, res) {
    // Get all the interviews from the database and feed the info to the layout
    models.Users.find({}).exec(function (err, users) {
      if (err) {
        console.log(err);
        throw err;
      }

      res.render('manager/layout', { 
        title: 'LogicPull Manager | Users',
        name: req.session.user.name,
        layout: 'users',
        users: users
      });
    });
  });

  // Add a new user in the manager .. 
  // The user can either be added manually or needs to activate via email
  app.all('/manager/users/add', [auth.validated, auth.privledges('add_user')], function (req, res) {
    if (req.method == 'POST') {
      var group_id = req.session.user.group;
      var clean_email = sanitizor.clean(req.body.email);

      // validate the input that came from the form
      if (validator.check(clean_email, ['required','email'])) {
        // check that the email is not already in the database
        models.Users.findOne({ 'email': clean_email }, function (err, user) {
          if (err) {
            console.log(err);
            throw err;
          }

          // if there is no user for that email OR there is a user but there group is different
          if (!user || (user && user.group !== group_id)) {
            // look up the group id of the user who is trying to add a new user
            models.Groups.findOne({ 'id': group_id }, function (err, group) {
              if (err) {
                console.log(err);
                throw err;
              } 

              var privledges = {
                "add_interview":  (req.body.add_interview === 'on') ? true : false,
                "clone_interview": (req.body.clone_interview === 'on') ? true : false,
                "remove_interview": (req.body.remove_interview === 'on') ? true : false,
                "edit_interviews": (req.body.edit_interviews === 'on') ? true : false,
                "change_interview_status": (req.body.change_interview_status === 'on') ? true : false,
                "view_users": (req.body.view_users === 'on') ? true : false,
                "edit_user": (req.body.edit_user === 'on') ? true : false,
                "add_user": (req.body.add_user === 'on') ? true : false,
                "remove_user": (req.body.remove_user === 'on') ? true : false,
                "reset_user_password": (req.body.reset_user_password === 'on') ? true : false,
                "add_deliverable": (req.body.add_deliverable === 'on') ? true : false,
                "remove_deliverable": (req.body.remove_deliverable === 'on') ? true : false,
                "update_deliverable": (req.body.update_deliverable === 'on') ? true : false,
                "lock_interview": (req.body.lock_interview === 'on') ? true : false,
                "edit_privledges": (req.body.edit_privledges === 'on') ? true : false,
                "download_deliverable": (req.body.download_deliverable === 'on') ? true : false,
                "download_stylesheet": (req.body.download_stylesheet === 'on') ? true : false,
                "download_answer_set": (req.body.download_answer_set === 'on') ? true : false,
                "view_report": (req.body.view_report === 'on') ? true : false,
                "view_completed_interviews": (req.body.view_completed_interviews === 'on') ? true : false,
                "view_saved_interviews": (req.body.view_saved_interviews === 'on') ? true : false,
                "edit_on_complete": (req.body.edit_on_complete === 'on') ? true : false,
                "editor_save": (req.body.editor_save === 'on') ? true : false       
              };

              // this will let us know if we can bypass emailing the user
              var verification = (req.body.verification_email === 'on') ? true : false;
              if (verification) {
                // this gets used in the email URL, where to direct a user to activate their account
                var path = (user) ? 'existing' : 'new';
                var token = require('crypto').createHash('md5').update(new Date().getTime().toString()).digest("hex");
                var inactive_user = {};
                inactive_user.activate_token = token;
                inactive_user.activate_date = new Date();
                inactive_user.email = clean_email;
                inactive_user.type = path;
                inactive_user.group = group.id;
                inactive_user.created = new Date();
                inactive_user.privledges = privledges;
                inactive_user.activate_token = token;
                inactive_user.activate_date = new Date();

                models.Inactives.update({email:clean_email}, inactive_user, {upsert: true}, function (err) {
                  if (err) {
                    console.log(err);
                    throw err;
                  } 

                  // only send the email if supported
                  if (!app.get('disable_email_new_users')) {

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
                      subject: 'LogicPull Group Invitation',
                      text: "You have been invited to join the LogicPull group " + group.name + ". To complete your registration, please copy and paste the folowing link in your browser. " + app.get('base_url') + "/manager/activate/" + path + "/" + token + ".",
                      html: "<div><p>You have been invited to join the LogicPull group <span style=\"font-weight:bold;\">" + group.name + "</span>. To complete your registration, please copy and paste the folowing link in your browser.</p><a href=\"" + app.get('base_url') + "/manager/activate/" + path + "/" + token + "\">" + app.get('base_url') + "/manager/activate/" + path + "/" + token + "</a></div>"
                    };

                    // send mail with defined transport object
                    transport.sendMail(message, function(err, response) {
                      if (err) {
                        console.log(err);
                        view('<ul><li>There was a problem sending an email to this user. Make sure you type it correctly.</li></ul>');
                        return;
                      }
                      res.redirect('/manager/users');
                    });
                  } else {
                    res.redirect('/manager/users');
                  }
                });
              } else {
                var clean_name = sanitizor.clean(req.body.name);
                var clean_password = sanitizor.clean(req.body.password);
                var clean_verify_password = sanitizor.clean(req.body.verify_password);

                // make sure the input is valid and then sanitize it
                if (validator.check(clean_name, ['required', {'maxlength':55}]) && validator.check(clean_password, ['required', {'minlength':6}, {'maxlength':15}]) && validator.check(clean_verify_password, ['required', {'minlength':6}, {'maxlength':15}])) {
                  if (clean_password === clean_verify_password) {
                    bcrypt.hash(clean_password, 10, function(err, hash) {
                      if (err) {
                        console.log(err);
                        throw err;
                      } 
                      
                      models.Counters.findOne({}, function (err, doc) {
                        var user = new models.Users();
                        // get the current count from the database and increment by to get the next interview
                        var count = doc.user_count + 1; 

                        user.id = count;
                        user.name = clean_name;
                        user.email = clean_email;
                        user.password = hash;
                        user.group = group.id;
                        user.last_login = new Date();
                        user.created = new Date();
                        user.last_login = new Date();
                        user.privledges = privledges;

                        user.save(function(err) {
                          if (err) {
                            console.log(err);
                            throw err;
                          } 

                          //update the counter in the database
                          models.Counters.update({user_count: count}, function (err) {
                            if (err){
                              console.log(err);
                              throw err;
                            } 

                            res.redirect('/manager/users');
                          });
                        });
                      });
                    });
                  } else {
                    view("<ul><li>The passwords must match.</li></ul>");
                  }
                } else {
                  view("<ul><li>The name is required and the passwords must be between 6 and 15 characters.</li></ul>");
                }
              }
            });
          } else {
            // if there is already an email registered for the user we are trying to add, check if its part of the group already,
            view('<ul><li>The email is already part of this group. To update a users account information please use the <a href="/manager/users/update">update form</a></li></ul>');
          }
        });
      } else {
        view('<ul><li>The email field is required and must contain a valid email.</li></ul>');      
      }
    } else {
      view(null);
    }

    function view (msg) { 
      var data = {
        title: 'LogicPull Manager | Add a New User',
        name: req.session.user.name,
        layout: 'add-users',
        msg : msg
      };

      res.render('manager/layout', data);
      return;
    }
  });

  // Reset a user password
  app.all('/manager/users/reset_password/:user', [auth.validated, auth.validateUser, auth.privledges('reset_user_password')], function (req, res) {
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

              res.redirect('/manager/users');
            });                     
          });
        } else {
          view("Please make sure your passwords match.");
        }
      } else {
        view("Both fields are required to reset your password, which must be between 6 and 15 characters.");
      }
    } else {
      view(null);
    }

    function view (msg) { 
      var data = {
        title: 'LogicPull Manager | Reset User Password',
        name: req.session.user.name,
        layout: 'reset-user-password',
        msg : msg
      };

      res.render('manager/layout', data);
      return;
    }
  });

  app.all('/manager/users/remove/:user', [auth.validated, auth.validateUser, auth.privledges('remove_user')], function (req, res) {
    if (req.method === 'POST') {
      // this is the user id
      var id = res.locals.user.id;

      // Make sure the user is not deleting themeself
      if (req.session.user.id != id) {
        models.Users.remove({id: id}, 1);
        res.redirect('/manager/users');
      } else {
        view('<ul><li>You can not delete your own account.</li></ul>');
      }
    } else {
      view(null);
    }

    function view (msg) { 
      // the logic to see if an interview was valid is done in the middleware
      var data = {
        title: 'LogicPull | Remove a User',
        name: req.session.user.name,
        layout:'remove-user',
        msg : msg
      };

      res.render('manager/layout', data); 
      return;
    }
  });

  // Display all the saved interviews for a user
  app.all('/manager/users/saved/:user', [auth.validated, auth.validateUser, auth.privledges('view_saved_interviews')], function (req, res) {
    var saved = models.Saves.find({});
    saved = saved.where('user_id').equals(req.params.user).sort('-created');
    saved.exec(function (err, saved) {
      if (err) {
        console.log(err);
        throw err;
      }
      
      res.render('manager/layout', { 
        title: 'LogicPull Manager | Saved User Interviews',
        name: req.session.user.name,
        layout: 'view-saved-user-interviews',
        saved: saved,
        user: req.params.user
      });
    });
  });

  // Move a partially saved interview to a different user
  app.all('/manager/users/saved/:user/copy/:save', [auth.validated, auth.validateUser, auth.privledges('view_saved_interviews')], function (req, res) {
    // Make sure the partial exists and is attached to the user
    models.Users.findOne({id: req.params.user}, function (err, user) {
      if (err) {
        console.log(err);
        throw err;
      }

      models.Saves.findOne({id: req.params.save}, function (err, save) {
        if (err) {
          console.log(err);
          throw err;
        }

        if (!user || !save || save.user_id !== user.id) {
          res.status(404).render('404', {name: ''});
        } else {
          if (req.method === 'POST') {
            // Move the saved interview to a different user
            models.Saves.update({id: save.id}, {
              user_id: req.body.user_id,
              note: req.body.note
            }, function (err) {
              if (err) {
                console.log(err);
                throw err;
              } 

              res.redirect('/manager/users');
            });
          } else {
            models.Users.find({}).exec(function (err, users) {
              if (err) {
                console.log(err);
                throw err;
              }

              res.render('manager/layout', { 
                title: 'LogicPull Manager | Copy Saved User Interview',
                name: req.session.user.name,
                layout: 'copy-saved-user-interview',
                users: users,
                user: user,
                save: save
              });
            });
          }
        }
      });
    });
  });

  app.all('/manager/users/edit/:user', [auth.validated, auth.validateUser, auth.privledges('edit_user')], function (req, res) {
    if (req.method === 'POST') {
      // this is the user id
      var id = res.locals.user.id;

      models.Users.findOne({id: id}, function (err, user) {
        if (err) {
          console.log(err);
          throw err;
        }

        var clean_email = sanitizor.clean(req.body.email);
        var clean_name = sanitizor.clean(req.body.name);
        if (validator.check(clean_name, ['required', {'maxlength':55}]) && validator.check(clean_email, ['required','email'])) {  
          var privledges = {
            "add_interview":  (req.body.add_interview === 'on') ? true : false,
            "clone_interview": (req.body.clone_interview === 'on') ? true : false,
            "remove_interview": (req.body.remove_interview === 'on') ? true : false,
            "edit_interviews": (req.body.edit_interviews === 'on') ? true : false,
            "change_interview_status": (req.body.change_interview_status === 'on') ? true : false,
            "view_users": (req.body.view_users === 'on') ? true : false,
            "edit_user": (req.body.edit_user === 'on') ? true : false,
            "add_user": (req.body.add_user === 'on') ? true : false,
            "remove_user": (req.body.remove_user === 'on') ? true : false,
            "reset_user_password": (req.body.reset_user_password === 'on') ? true : false,
            "add_deliverable": (req.body.add_deliverable === 'on') ? true : false,
            "remove_deliverable": (req.body.remove_deliverable === 'on') ? true : false,
            "update_deliverable": (req.body.update_deliverable === 'on') ? true : false,
            "lock_interview": (req.body.lock_interview === 'on') ? true : false,
            "edit_privledges": (req.body.edit_privledges === 'on') ? true : false,
            "download_deliverable": (req.body.download_deliverable === 'on') ? true : false,
            "download_stylesheet": (req.body.download_stylesheet === 'on') ? true : false,
            "download_answer_set": (req.body.download_answer_set === 'on') ? true : false,
            "view_report": (req.body.view_report === 'on') ? true : false,
            "view_completed_interviews": (req.body.view_completed_interviews === 'on') ? true : false,
            "view_saved_interviews": (req.body.view_saved_interviews === 'on') ? true : false,
            "edit_on_complete": (req.body.edit_on_complete === 'on') ? true : false,
            "editor_save": (req.body.editor_save === 'on') ? true : false       
          };

          // The edit page has an option to give non-manager users access to the manager. 
          // Non-manager users are created when saving an interview.
          var group = (req.body.manager_access === 'on') ? req.session.user.group : 0;

          //update the counter in the database
          models.Users.update({id: user.id}, {
            name: clean_name,
            email: clean_email,
            group: group,
            privledges: privledges
          }, function (err) {
            if (err) {
              console.log(err);
              throw err;
            } 

            res.redirect('/manager/users');
          });
        } else {
          view("The name and a valid email is required.");
        }
      });

    } else {
      view(null);
    }

    function view (msg) { 
      // the logic to see if an interview was valid is done in the middleware
      var data = {
        title: 'LogicPull | Edit User',
        name: req.session.user.name,
        layout:'edit-user',
        msg : msg
      };

      res.render('manager/layout', data); 
      return;
    }
  });

  // Add a new user in the manager .. the user needs to activate via email.
  app.all('/manager/activate/new/:activate_token', [auth.validateActivateToken], function (req, res) {
    // if we get here the token was found in the inactive table and is still valid
    function view (data) { 
      var load = {
        msg : data.msg,
        valid: data.valid
      };
      res.render('manager/users/new', load);
      return;
    }

    // this form is only available if the user is new!
    if (res.locals.inactive_user.type === 'new') {
      // now that we have confirmed the token is in the database for some user we can check if it still valid
      if (req.method == 'POST') {
        var clean_name = sanitizor.clean(req.body.name);
        var clean_password = sanitizor.clean(req.body.password);
        var clean_verify_password = sanitizor.clean(req.body.verify_password);

        // make sure the input is valid and then sanitize it
        if (validator.check(clean_name, ['required', {'maxlength':55}]) && validator.check(clean_password, ['required', {'minlength':6}, {'maxlength':15}]) && validator.check(clean_verify_password, ['required', {'minlength':6}, {'maxlength':15}])) { 
          if (clean_password === clean_verify_password) {
            bcrypt.hash(clean_password, 10, function(err, hash) {
              if (err) {
                console.log(err);
                throw err;
              } 
              
              models.Counters.findOne({}, function (err, doc) {
                var user = new models.Users();
                // get the current count from the database and increment by to get the next interview
                var count = doc.user_count + 1; 

                user.id = count;
                user.name = clean_name;
                user.email = res.locals.inactive_user.email;
                user.password = hash;
                user.group = res.locals.inactive_user.group;
                user.last_login = new Date();
                user.created = new Date();
                user.privledges = res.locals.inactive_user.privledges;

                user.save(function(err){
                  if (err) {
                    console.log(err);
                    throw err;
                  } 
                  //update the counter in the database
                  models.Counters.update({user_count: count}, function (err) {
                    if (err){
                      console.log(err);
                      throw err;
                    } 
                    // delete the inactive from the table and log the user in
                    models.Inactives.remove({email: res.locals.inactive_user.email}, function (err) {
                      if (err){
                        console.log(err);
                        throw err;
                      } 
                      req.session.user = {
                        id: count,
                        name: clean_name,
                        email: res.locals.inactive_user.email,
                        group: res.locals.inactive_user.group,
                        privledges: res.locals.inactive_user.privledges,
                        authenticated: true
                      };
                      res.redirect('/manager');
                    });
                  }); 
                });
              });
            });
          } else {
            view({msg: "Please make sure your passwords match.", valid: false});
          }

        } else {
          view({msg: "All fields are required. Your passwords must be between 6 and 15 characters.", valid: false});
        }
      } else {
        view({msg:null, valid: false});
      }
    } else {
      res.status(404).render('404', {name: ''});
    }
  });

  // Add a new user in the manager .. the user clicks on this link in their email.
  // This link is only used if the user has a basic account already, but not a admin account.
  app.all('/manager/activate/existing/:activate_token', [auth.validateActivateToken], function (req, res) {
    // this form is only available if the user is existing!
    if (res.locals.inactive_user.type === 'existing') {
      var update = {
        group: res.locals.inactive_user.group,
        privledges: res.locals.inactive_user.privledges
      };

      models.Users.findOneAndUpdate({email: res.locals.inactive_user.email}, update, function (err, user) {
        if (err) {
          console.log(err);
          throw err;
        } 

        if (user) {
          models.Inactives.remove({email: user.email}, function (err) {
            if(err){
              console.log(err);
              throw err;
            } 
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
        } else {
          res.redirect('/manager');
        }
      }); 
    } else {
      res.status(404).render('404', {name: ''});
    }
  });
};