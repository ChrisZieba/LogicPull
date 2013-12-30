/*	Copyright 2014 Chris Zieba <zieba.chris@gmail.com>

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
		// we need the group so we an gather all the users from the same group
		var group_id = req.session.user.group;

		// get all the interviews from the database and feed the info to the layout
		models.Users.find({}).where('group').equals(group_id).exec(function (err, users) {
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

	// Add a new user in the manager .. the user needs to activate via email
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
					if ( !user || (user && user.group !== group_id)) {
						// look up the group id of the user who is trying to add a new user
						models.Groups.findOne({ 'id': group_id }, function (err, group) {
							if (err) {
								console.log(err);
								throw err;
							} 

							var inactive_user = {};
							// this gets used in the email URL, where to direct a user to activate their account
							var path = (user) ? 'existing' : 'new';
							var token = require('crypto').createHash('md5').update(new Date().getTime().toString()).digest("hex");

							inactive_user.activate_token = token;
							inactive_user.activate_date = new Date();
							inactive_user.email = clean_email;
							inactive_user.type = path;
							inactive_user.group = group.id;
							inactive_user.created = new Date();
							inactive_user.privledges = {
								"add_interview":  (req.body.add_interview === 'on') ? true : false,
								"clone_interview": (req.body.clone_interview === 'on') ? true : false,
								"remove_interview": (req.body.remove_interview === 'on') ? true : false,
								"edit_interviews": (req.body.edit_interviews === 'on') ? true : false,
								"change_interview_status": (req.body.change_interview_status === 'on') ? true : false,
								"view_users": (req.body.view_users === 'on') ? true : false,
								"edit_user": (req.body.edit_user === 'on') ? true : false,
								// KEEP THIS FALSE 
								"add_user": false,
								"remove_user": false,
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
								"edit_on_complete": (req.body.edit_on_complete === 'on') ? true : false,
								"editor_save": (req.body.editor_save === 'on') ? true : false				
							};

							models.Inactives.update({email:clean_email}, inactive_user, {upsert: true}, function (err) {
								if (err){
									console.log(err);
									throw err;
								} 

								// only send the email if supported
								if ( !app.get('disable_email_new_users')) {
									var transport = nodemailer.createTransport("SMTP", {
										host: app.get('email_host'),
										auth: {
											user: app.get('email_auth_user'),
											pass: app.get('email_auth_pass')
										}
									});

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

						});
					} else {
						// if there is already an email registered for the user we are trying to add, check if its part of the group already,
						view('<ul><li>The email is already part of this group. To update a users account information please use the <a href="/manager/users/update">update form</a></li></ul>');
					}
				});
			} else {
				view('<ul><li>The email field is required and must contain a valid email.</li><li>The password fields must be between 6 and 15 characters, and match.</li></ul>');			
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
								user.creation_date = new Date();
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
											if(err){
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