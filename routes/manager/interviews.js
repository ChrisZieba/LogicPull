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
	models = require('../../models/models'),
	utils = require('../../lib/utils'),
	auth = require('../../middleware/manager/auth');

/*	The reason for this function is performance related
	Using JSON.stringify has shown to be significant slower than 
	creating a file and writing the object to it, rather than including
	it with the HTML 
*/
function writeData (data) {
	var out = [];
	out.push('function data(){return');

	out.push(JSON.stringify(data));
	out.push('};');
	return out.join("");
}

// this is used to check a semi-colon delimited list for valid emails
function validateEmails (input) {
	if (input.length === 0) {
		return '';
	}

	// run each email through validation
	var emails = input.split(',');

	for (var i = 0; i < emails.length; i+=1) {
		if ( ! validator.check(emails[i].trim(), ['email'])) {
			return false;
		}
	}
	return input;
}

module.exports = function (app) {
	"use strict";

	app.get('/manager/interviews', [auth.validated], function (req, res) {
		// The group id of the user.. so we can show only the relevant interviews
		var group_id = req.session.user.group;
		var user_id = req.session.user.id;
		var interviews = models.Interviews.find({});
		var outputs = models.Outputs.find({});

		// make sure the group id of the logged in user matches that from the URL
		interviews = interviews.where('group').equals(group_id).where('disabled').equals(false);
		outputs = outputs.where('interview.group').equals(group_id);
		outputs = outputs.limit(100).sort('-date');

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
					title: 'LogicPull Manager | Interviews',
					name: req.session.user.name,
					layout: 'interviews',
					interviews: interviews,
					outputs: outputs,
					user: req.session.user
				});
			});
		});
	});

	// show an interview page
	app.get('/manager/interview/:interview', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {
		var group_id = req.session.user.group;
		var user_id = req.session.user.id;
		var interview = res.locals.interview.id
		var outputs = models.Outputs.find({});

		outputs = outputs.where('interview.group').equals(group_id).where('interview.id').equals(interview);
		outputs = outputs.limit(100).sort('-date');

		outputs.exec(function (err, outputs) {
			if (err) {
				console.log(err);
				throw err;
			} 

			var saved = models.Saves.find({});
			saved = saved.where('interview_id').equals(interview);
			saved = saved.limit(100).sort('-created');
			saved.exec(function (err, saved) {
				if (err) {
					console.log(err);
					throw err;
				} 

				// send the output to the view
				var data = {
					title: 'LogicPull',
					name: req.session.user.name,
					layout:'interview',
					env: app.settings.env,
					email_notification: res.locals.interview.on_complete.email_notification,
					email_deliverables: res.locals.interview.on_complete.email_deliverables,
					user: {
						name: req.session.user.name,
						email: req.session.user.email,
						privledges: req.session.user.privledges
					},
					outputs: outputs,
					saved: saved
				};

				res.render('manager/layout', data);	
			});
		});
	});

	// this is the stage URL, must be logged in to view the interview, available to all users from the group
	app.get('/manager/interview/:interview/stage', [auth.validated, auth.validateInterview, auth.validateUserGroup], function (req, res) {
		var interview = res.locals.interview;
		var data = {
			title: 'LogicPull - ' + interview.name,
			id: interview.id,
			env: app.settings.env
		};

		res.render('manager/interviews/viewer', data);
	});

	// This is editor
	app.get('/manager/interview/:interview/edit', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {
		var interview = res.locals.interview;
		// write the data to a file first, seems to be faster this way
		var filename = 'data_' + interview.id + '.js';
		var path = app.get('base_location') +  'public/javascripts/preload/' + filename;
		// this gets the current data from the database and writes it to a file
		var write = writeData(interview.data), data;

		fs.writeFile(path, write, function (err) {
			if (err) {
				console.log(err);
				throw err;
			} 

			// the steps and the description nned to be encoded to prevent character errors when loading
			for (var i = 0; i < interview.steps.length; i+=1) {
				interview.steps[i] = interview.steps[i].replace(/'/g, "&apos;").replace(/"/g, "&quot;");
			}

			data = {
				interview: interview.id,
				data: filename,
				env: app.settings.env,
				interview_settings: {
					name: interview.name,
					description: interview.description.replace(/'/g, "&apos;").replace(/"/g, "&quot;"),
					start: interview.start,
					steps: JSON.stringify(interview.steps)
				}
			};
			res.render('manager/interviews/editor', data);
		});
	});

	app.get('/manager/interview/:interview/completed', [auth.validated, auth.validateInterview, auth.privledges('view_completed_interviews')], function (req, res) {
		var group_id = req.session.user.group;
		var user_id = req.session.user.id;
		var interview = res.locals.interview.id
		var outputs = models.Outputs.find({});

		outputs = outputs.where('interview.group').equals(group_id).where('interview.id').equals(interview);
		outputs = outputs.limit(500).sort('-date');

		outputs.exec(function (err, outputs) {
			if (err) {
				console.log(err);
				throw err;
			} 
			// send the output to the view
			res.render('manager/layout', { 
				title: 'LogicPull - Completed Interviews',
				name: req.session.user.name,
				layout: 'completed-interviews',
				outputs: outputs
			});
		});
	});

	app.get('/manager/interview/:interview/saved', [auth.validated, auth.validateInterview, auth.privledges('view_saved_interviews')], function (req, res) {
		var group_id = req.session.user.group;
		var user_id = req.session.user.id;
		var interview = res.locals.interview.id
		var saved = models.Saves.find({});

		saved = saved.where('interview_id').equals(interview);
		saved = saved.limit(500).sort('-created');

		saved.exec(function (err, saved) {
			if (err) {
				console.log(err);
				throw err;
			} 
			// send the output to the view
			res.render('manager/layout', { 
				title: 'LogicPull - Saved Interviews',
				name: req.session.user.name,
				layout: 'saved-interviews',
				saved: saved
			});
		});
	});

	app.get('/manager/interviews/completed', [auth.validated, auth.privledges('view_completed_interviews')], function (req, res) {
		var group_id = req.session.user.group;
		var outputs = models.Outputs.find({});
		var user_id = req.session.user.id;

		outputs = outputs.where('interview.group').equals(group_id);
		outputs = outputs.limit(100).sort('-date');

		outputs.exec(function (err, outputs) {
			if (err) {
				console.log(err);
				throw err;
			} 
			// send the output to the view
			res.render('manager/layout', { 
				title: 'LogicPull - Completed Interviews',
				name: req.session.user.name,
				layout: 'completed-interviews',
				outputs: outputs
			});
		});
	});

	app.all('/manager/interviews/add', [auth.validated, auth.privledges('add_interview')], function (req, res) {
		// for a get request we don't need a message, but if the input is not valid we give an error message
		var message = null;
		var interview, count;

		function view (template, msg) {
			var data = {
				title: 'LogicPull | Add an Interview',
				name: req.session.user.name,
				layout:'add-interview',
				msg: msg
			};

			res.render(template, data);
			return;
		}

		if (req.method === 'POST') {
			// validate the input that came from the form
			if (validator.check(sanitizor.clean(req.body.name), ['required','filename']) && validator.check(sanitizor.clean(req.body.description), ['required','label'])) {
				// get the current count of the interview
				models.Counters.findOne({}, function (err, doc) {
					interview = new models.Interviews();
					// get the current count from the database and increment by to get the next interview
					count = doc.interview_count + 1;
					interview.id = count;
					interview.name = req.body.name;
					interview.disabled = false;
					interview.creator = req.session.user.id;
					interview.group = req.session.user.group;
					interview.locked = false;
					interview.description = req.body.description;
					interview.live = false;
					interview.creation_date = new Date().getTime();
					interview.edit_url = '/manager/interview/' + count + '/edit';
					interview.stage_url = '/manager/interview/' + count + '/stage';
					interview.live_url = '/interviews/active/' + count;
					interview.start = 'q0';
					interview.steps = ['Introduction'];
					interview.on_complete = {
						//when this is set to true the user will be allowed to add in an email at the end of the interview for there forms
						email_deliverables_to_client: true, 
						email_notification: "",
						email_deliverables: ""						
					};
					interview.deliverables = [];
					interview.distance = {
						update: true,
						graph: {}
					};
					interview.data = {
						"q0": {
							"_id": 0,
							"qid": 'q0',
							"name": 'First Question',
							"step": "Introduction", 
							"text_id": 'qt0',
							"question_text": '<strong>q0</strong>', //this is the question text
							"loop1": null,
							"loop2": null,
							"learn_more": {
								"title": "",
								"body": ""
							},
							"buttons": [{
									"type": 'continue',
									"destination": 'q1',
									"pid": 'p0'
								}],
							"help": [],
							"source_paths": [
								{
									"pid": 'p0',
									"s": 'q0',
									"d": 'q1',
									"stroke": '#FF9900',
									"stroke_width": "3"
									//"stroke_dasharray": "0"
								}
							], 
							// these are the path names that originate from the question (source)
							"destination_paths": [], 
							// this hold all the field (variable) objects
							"fields": [], 
							"advanced": [],
							"node": {
								"x": 193,
								"y": 25,
								"width": 40,
								"height": 40,
								"fill": '#c6d5b0'
							}
						},
						"q1": {
							"_id": 1,
							"qid": 'q1',
							"name": 'b100',
							"step": "none",
							"text_id": 'qt1',
							"question_text": 'q1',
							"loop1": null,
							"loop2": null,
							"learn_more": {
								"title": 'what is my postal code', 
								"body": 'look here for more info'
							},
							"buttons": [],
							"help": [],
							"source_paths": [],
							"destination_paths": [
								{
									"pid": 'p0',
									"s": 'q0',
									"d": 'q1',
									"stroke": '#FF9900',
									"stroke_width": "3"
									//"stroke_dasharray": "0"
								}
							],
							"fields": [],
							"advanced": [],
							"node": {
								"x": 193,
								"y": 125,
								"width": 40,
								"height": 40,
								"fill": '#c6d5b0'
							}
						}

					};

					interview.save(function(err) {
						if (err){
							console.log(err);
							throw err;
						} 
						//update the counter in the database
						models.Counters.update({interview_count: count}, function (err) {
							if (err){
								console.log(err);
								throw err;
							} 
							// make a dir for the interview, and where the output/tmp files will go
							fs.mkdir(app.get('base_location') + "uploads/deliverables/" + interview.name + "-" + interview.id, 511, function (err) {
								if (err) {
									console.log(err);
									throw err;
								} 

								fs.mkdir(app.get('base_location') + "generated/output/" + interview.name + "-" + interview.id, 511, function (err) {
									if (err) {
										console.log(err);
										throw err;
									}
									res.redirect('/manager');
								});
							});
						});	
					});
				});
			} else {
				view('manager/layout', '<ul><li>The name field is required and can only contain <strong>letters, numbers, underscores and dashes.</strong></li><li>The Description field is required.</li></ul>');
			}
		} else {
			// this is a get request...just show the form
			view('manager/layout', null);
		}
	});


	/* This gets run through a few middleware functions.
		1. check if the user is logged in
		2. check if the interview they are trying to go to exists, and is from the same group
		3. check to see if the user has privileges to do the operation
	*/
	app.all('/manager/interviews/remove/:interview', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('remove_interview')], function (req, res) {
		if (req.method === 'POST') {
			// this is the interview id
			var id = req.body.interview;
			// change disabled to true in the interview. This will make it invisible to users
			models.Interviews.update({id: id}, { disabled: true }, function (err) {
				if (err){
					console.log(err);
					throw err;
				} 
				// go back to the admin page
				res.redirect('/manager');
			});	
		} else {
			// the logic to see if an interview was valid is done in the middleware
			var data = {
				title: 'LogicPull | Remove an Interview',
				name: req.session.user.name,
				layout:'remove-interview',
			};
			res.render('manager/layout', data);	
		}
	});

	// clone the specified interview
	app.all('/manager/interviews/clone/:interview', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('clone_interview')], function (req, res) {
		// this is the interview based on the query string from the URL path
		var interview_to_clone = res.locals.interview;
		var interview, count, deliverables;
		var clean_name, clean_description;

		function view (template, msg) {
			// the logic to see if an interview was valid is done in the middleware
			var data = {
				title: 'LogicPull | Clone an Interview',
				name: req.session.user.name,
				layout:'clone-interview',
				msg: msg
			};

			res.render(template, data);	
			return;
		}

		function copyDeliverable (file, name) {
			fs.readFile(app.get('base_location') + "uploads/deliverables/" + interview_to_clone.name + "-" + interview_to_clone.id + "/" + name, function (err, data) {
				if (err) {
					throw err;
				} else {
					fs.writeFile(app.get('base_location') + "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + name, data, function (err) {
						if (err) {
							throw err;
						}
					});
				}
			});			
		}

		if (req.method === 'POST') {
			clean_name = sanitizor.clean(req.body.name);
			clean_description = sanitizor.clean(req.body.description);

			// validate the input that came from the form
			if (validator.check(clean_name, ['required','variable']) && validator.check(clean_description, ['required','label']) && clean_name !== interview_to_clone.name) {
				// get the current count of the interview
				models.Counters.findOne({}, function (err, doc) {
					interview = new models.Interviews();
					// get the current count from the database and increment by to get the next interview
					count = doc.interview_count + 1;
					interview.id = count;
					interview.name = clean_name;
					interview.disabled = false;
					interview.creator = req.session.user.id;
					interview.group = req.session.user.group;
					interview.locked = false;
					interview.description = clean_description;
					interview.live = false;
					interview.creation_date = new Date().getTime();
					interview.edit_url = '/manager/interview/' + count + '/edit';
					interview.stage_url = '/manager/interview/' + count + '/stage';
					interview.live_url = '/interviews/active/' + count;
					interview.start = interview_to_clone.start;
					interview.steps = interview_to_clone.steps;
					interview.deliverables = interview_to_clone.deliverables;
					interview.on_complete = interview_to_clone.on_complete;
					interview.distance = interview_to_clone.distance;
					interview.data = interview_to_clone.data;

					// The paths in the deliverables need to be updated
					if (interview.deliverables.length !== 0) {
						for (var k = 0; k < interview.deliverables.length; k+=1) {
							interview.deliverables[k].input.id = require('crypto').createHash('md5').update(interview.deliverables[k].input.name + interview.id + (k+1)).digest("hex");
							interview.deliverables[k].input.path = "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + interview.deliverables[k].input.name;

							if (interview.deliverables[k].input.form && interview.deliverables[k].input.form.name) {
								interview.deliverables[k].input.form.path = "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + interview.deliverables[k].input.form.name;
							}
						}
					} 

					interview.save(function(err){
						if (err) {
							console.log(err);
							throw err;
						} 

						//update the counter in the database
						models.Counters.update({interview_count: count}, function (err) {
							if (err) {
								console.log(err);
								throw err;
							}

							// make a dir for the interview, and where the output/tmp files will go
							fs.mkdir(app.get('base_location') + "uploads/deliverables/" + interview.name + "-" + interview.id, 511, function (err) {
								if (err) {
									console.log(err);
									throw err;
								}

								fs.mkdir(app.get('base_location') + "generated/output/" + interview.name + "-" + interview.id, 511, function (err) {
									if (err) {
										console.log(err);
										throw err;
									}

									if (interview.deliverables.length !== 0) {
										for (var k = 0; k < interview.deliverables.length; k+=1) {
											copyDeliverable(interview.deliverables[k], interview.deliverables[k].input.name);
											if (interview.deliverables[k].input.form && interview.deliverables[k].input.form.name) {
												copyDeliverable(interview.deliverables[k], interview.deliverables[k].input.form.name);
											}
										}
									} 
									res.redirect('/manager');
								});
							});
						});	
					});
				});
			} else {
				view('manager/layout', '<ul><li>The name of the interview <strong>cannot</strong> be ' + interview_to_clone.name +'.</li><li>The name field is required and can only contain <strong>letters, numbers, and underscores.</strong></li><li>The Description field is required.</li></ul>');			
			}
		} else {
			// this is a get request...just show the form
			view('manager/layout', null);
		}
	});

	// Edit the description of the interview
	app.all('/manager/interview/:interview/description',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {
		var interview = res.locals.interview.id;

		function view (template, msg) {
			// the logic to see if an interview was valid is done in the middleware
			var data = {
				title: 'LogicPull | Edit Interview Description',
				name: req.session.user.name,
				layout:'interview-description',
				msg: msg
			};

			res.render(template, data);	
			return;
		}

		if (req.method === 'POST') {
			if (validator.check(sanitizor.clean(req.body.description), ['required','label'])) {
				models.Interviews.update({id: interview}, { description: req.body.description }, function (err) {
					if (err) {
						console.log(err);
						throw err;
					} 

					// go back to the admin page
					res.redirect('/manager/interview/' + interview);
				});	
			} else {
				view('manager/layout', '<ul><li>The Description field is required.</li></ul>');
			}

		} else {
			view('manager/layout', null);
		}
	});


	// lock or unlock the interview
	app.all('/manager/interview/:interview/lock',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('lock_interview')], function (req, res) {
		var locked, interview, data;

		if (req.method === 'POST') {
			// toggle this value since the value that gets sent to use is the old value that we want to change
			if (req.body.locked === "true") {
				locked = false;
			} else {
				locked = true;
			}

			// this is the interview id
			interview = req.body.interview;
			models.Interviews.update({id: interview}, { locked: locked }, function (err) {
				if (err) {
					console.log(err);
					throw err;
				} 

				// go back to the admin page
				res.redirect('/manager/interview/' + interview);
			});	
		} else {
			// the logic to see if an interview was valid is done in the middleware
			data = {
				title: 'LogicPull | Remove an Interview',
				name: req.session.user.name,
				layout:'lock-interview'
			};
			res.render('manager/layout', data);	
		}
	});

	// Change the status of an interview
	app.all('/manager/interview/:interview/live',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('change_interview_status')], function (req, res) {
		var data, live, interview;

		if (req.method === 'POST') {
			// toggle this value since the value that gets sent to use is the old value that we want to change
			if (req.body.live === "true") {
				live = false;
			} else {
				live = true;
			}
				// this is the interview id
			interview = req.body.interview;

			models.Interviews.update({id: interview}, { live: live }, function (err) {
				if (err) {
					console.log(err);
					throw err;
				} 
				// go back to the admin page
				res.redirect('/manager/interview/' + interview);
			});	
		} else {
			// the logic to see if an interview was valid is done in the middleware
			data = {
				title: 'LogicPull | Change the status of an interview',
				name: req.session.user.name,
				layout:'live-interview'
			};
			res.render('manager/layout', data);	
		}
	});

	// Edit the settings that control what happens when an interview is completed
	app.all('/manager/interview/:interview/on_complete',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_on_complete')], function (req, res) {
		var on_complete, email_deliverables_to_client, email_notification, email_deliverables, interview, data;

		function view (template, msg) {
			// the logic to see if an interview was valid is done in the middleware
			var data = {
				title: 'LogicPull | On-Complete Settings',
				name: req.session.user.name,
				layout:'on-complete-interview',
				msg: msg
			};

			res.render(template, data);	
			return;
		}

		if (req.method === 'POST') {
			email_notification = validateEmails(sanitizor.clean(req.body.email_notification));
			email_deliverables = validateEmails(sanitizor.clean(req.body.email_deliverables));

			// validate the user input
			if (email_notification !== false && email_deliverables !== false) {
				// this is the interview id
				interview = req.body.interview;

				email_deliverables_to_client = (req.body.email_deliverables_to_client === "on") ? true : false;

				on_complete = {
					email_deliverables_to_client: email_deliverables_to_client, 
					email_notification: (email_notification !== '') ? email_notification : null,
					email_deliverables: (email_deliverables !== '') ? email_deliverables : null						
				};

				models.Interviews.update({id: interview}, {on_complete: on_complete}, function (err) {
					if (err) {
						console.log(err);
						throw err;
					} 
					// go back to the admin page
					res.redirect('/manager/interview/' + interview);
				});	
			} else {
				view('manager/layout', '<ul><li>Any emails you enter must be valid. <strong>If you enter more than one email, they must be seperated by a comma.</strong></li></ul>');			
			}
		} else {
			view('manager/layout', null);
		}
	});

	// This is the link we go to when we want to download a file
	app.get('/manager/download/completed/answers/:id/:interview/:hash', auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('download_answer_set'), function (req, res) {
		// this is the id of the output 
		var id = req.params.id;
		// the hash that identifies which deliverable
		var hash = req.params.hash;

		if (validator.check(sanitizor.clean(id), ['required','integer']) && validator.check(sanitizor.clean(hash), ['required','alphanum'])) {
			// first check if the file requested even exists
			models.Outputs.findOne({ 'id': id }, 'answers', function (err, doc) {
				// TODO: sanitize input, store session data, handle errors
				if (err) {
					console.log(err);
					throw err;
				} 

				if (doc) {
					// check if the hash given to us in the URL, matches from the database
					if (doc.answers.id === hash) {
						// all systems go for download
						res.download(app.get('base_location') + doc.answers.path, doc.answers.name, function(err){
							if (err) {
								console.log(err);
								throw err;
							} 
							res.end('success', 'UTF-8');
						});
					} else {
						res.status(404).render('404', {name: req.session.user.name});	
					}
				} else {
					// if the database does not return a document for the output
					res.status(404).render('404', {name: req.session.user.name});	
				}
			});
		} else {
			// if the inputs are not valid
			res.status(404).render('404', {name: req.session.user.name});	
		}

		return null;
	});

	// Export the interview data
	app.all('/manager/interview/:interview/export_interview',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('clone_interview')], function (req, res) {
		function view (template, msg) {
			// the logic to see if an interview was valid is done in the middleware
			var data = {
				title: 'LogicPull | Export Interview Data',
				name: req.session.user.name,
				layout:'export-interview',
				msg: msg
			};

			res.render(template, data);	
			return;
		}

		if (req.method === 'POST') {
			var id = req.body.interview;
			models.Interviews.findOne({ 'id': id }, {'data':1, 'description':1, 'steps':1, '_id':0}, function (err, doc) {
				if (err) {
					console.log(err);
					throw err;
				} 

				var filename = "interview_" + id + "_export.json";
				var file_location = app.get('base_location') + "generated/tmp/" + filename;

				fs.writeFile(file_location, JSON.stringify(doc,null,4), function (err) {
					if (err) {
						console.log(err);
						callback(err);
					} 
					res.download(file_location, filename, function (err) {
						if (err) {
							console.log(err);
							throw err;
						} 
						res.end('success', 'UTF-8');
					});
				});
			});
		} else {
			view('manager/layout', null);
		}
	});


	// lock or unlock the interview
	app.all('/manager/interview/:interview/import_interview',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {
		var form = null;

		function view (template, msg) { 
			var data = {
				title: 'LogicPull | Import Interview Data',
				name: req.session.user.name,
				layout:'import-interview',
				msg: msg
			};

			res.render(template, data);
		}

		if (req.method === 'POST') {
			// this is the interview attached in the auth.validateInterview middleware
			var interview = res.locals.interview;

			// validate the input that came from the form, and make sure a file was chosen for upload
			if (req.files.file) {
				// have to do another check here for the filename 
				if (req.files.file.name !== '' && req.files.file.size !== 0) {
					fs.readFile(req.files.file.path, 'utf-8', function(err, content) {
						if (err) {
							throw err;
						}

						var json_data = null;

						try {
							json_data = JSON.parse(content);
						} catch (e) {
							view('manager/layout', '<ul><li>The file you attempted to upload was not valid JSON.</li></ul>');
						}

						if (json_data) {
							//update the interview in the database
							models.Interviews.update({id: interview.id}, {'data': json_data.data, 'description': json_data.description, 'steps': json_data.steps}, function (err) {
								if (err) {
									console.log(err);
									throw err;
								} 
								res.redirect('manager/interview/' + interview.id);
							});	
						}
						
						
					});
				} else {
					view('manager/layout', '<ul><li>The input file must be a valid JSON file.</li></ul>');
				}
			} else {
				view('manager/layout', '<ul><li>The input file must be a valid JSON file.</li></ul>');
			}
		} else {
			// this is a get request...just show the form
			view('manager/layout', null);
		}
	});

	// this is the report for an interview
	app.get('/manager/interview/:interview/report',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('view_report')], function (req, res) {
		var ordered = utils.dfs(res.locals.interview.start, res.locals.interview.data, []);
		var data = {
			title: 'LogicPull | Report',
			name: req.session.user.name,
			layout:'report-interview',
			ordered: ordered
		};

		res.render('manager/layout', data);
	});
};