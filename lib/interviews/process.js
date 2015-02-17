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

var utils = require('../utils'),
	helpers = require('../helpers'),
	ejs = require('ejs'),
	fs = require('fs'),
	async = require('async'),
	spawn = require('child_process').spawn,
	nodemailer = require("nodemailer"),
	func = require('../func'),
	models = require('../../models/models');

/**
 * Returns the filename for a tmp file (.fo)
 *
 * @input_type {string} The file extension of the file we are trying to save
 *
 */
function tmpFilename (input_type) {
	"use strict";

	// Since some .fo files are generated at the exact same time, just choose random names
	// to avoid collision, since these files don't matter
	var time = new Date().getTime();
	time = time * Math.random();
	time = Math.round(time).toString();
	return time + "." + input_type;
}

/**
 * Returns the filename for the final output for the deliverable
 *
 * @interview {array}
 * @name {string} The name given to the deliverable when uploading it in the manager
 * @type {string} The output type of the deliverable set when adding a deliverable
 * @client {string} If given the name of the person completing the interview, use it in the filename
 * @date {object} The interview completion date
 * @count {string} Optional index used when looping through documents 
 *
 */
function outFilename (interview, name ,type, client, date, count) {
	"use strict";

	var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
	var FILE_LIMIT = 200;

	if (type === 'pdf_form') {
		type = 'pdf';
	}

	interview = (typeof interview !== 'undefined' && interview !== null && interview !== '') ? interview + '_' : '';
	name = (typeof name !== 'undefined' && name !== null && name !== '') ? name + '_' : '';
	count = count || '0';

	var filename = interview.toUpperCase() + name.toUpperCase() + monthNames[date.getMonth()].toUpperCase() + '_' + date.getDate() + '_' + date.getFullYear() + '_' + count + '_' + Date.now() + '.' + type;

	if (filename.length > FILE_LIMIT) {
		var tag = '_' + count + '_' + Date.now() + '.' + type;
		var name_length = FILE_LIMIT-tag.length;
		filename = (name_length > 0) ? name.substr(0, name_length) + tag : tag;
	}

	return filename;
}


/**
 * Takes an array of filenames and zips the contents
 *
 * @base {string} The base folder
 * @name {string} The name of the output deliverable
 * @folder {string} The folder to save the zipped file in
 * @email_callback {function} Callback that gets run after zipping the folder
 *
 */
function zipFiles (base, name, folder, email_callback) {
	"use strict";
	
	var file_path = base + 'generated/tmp/' + name;
	var zip = spawn('zip', ['-r', '-j', file_path, base + folder]);

	// End the response on zip exit
	zip.on('exit', function (code) {
		if(code !== 0) {
			console.log('zip process exited with code ' + code);
			email_callback('zip process exited with code ' + code);
		} else {
			email_callback(null, file_path);
		}
	});
}

// takes all the variables and tries to find the clients name

/**
 * Build a string of the clients (user completing the interview) name
 *
 * @first {object} The first name of the client given as an answer object from the interview
 * @last {object} The last name of the client given as an answer object from the interview
 * @full {object} The full name of the client given as an answer object from the interview
 *
 */
function clientName (first, last, full) {
	"use strict";

	// default
	var name = {
		first: 'Unknown',
		last: 'Unknown',
		full: 'Unknown_Name'
	};

	// if the first and last name are not given use the full name,
	// if its an array just ignore 
	if (first && last && !Array.isArray(first.values)) {
		name.first = first.values.Client_first_name_TE.toString().replace(/\s/g,"_");
		name.last = last.values.Client_last_name_TE.toString().replace(/\s/g,"_");
		name.full = name.last + '_' + name.first;			
	} else if (full && !Array.isArray(first.values)) {
		name.full = full.values.Client_full_name_TE.replace(/\s/g,"_");
	} 

	return name;
}

/**
 * Called when the finish button is clicked in the interview
 * Handles all the deliverables plus any miscellaneous functions after the interview completes
 *
 * @doc {object} The interview object from the database
 * @master {object} All the answers collected so far
 * @progress {array} The array of the order in which question are answered
 * @base_location {string} The base folder of the application
 * @app {object} The LogicPull application object that contains settings we need
 * @user {integer} The user ID if a registered user is performing the interview. Null if not logged in.
 * @socket_callback {function} Callback that gets run after completion
 *
 */
exports.output = function (doc, master, progress, base_location, app, user, socket_callback) {
	"use strict";

	// use the microtime to create a temp directory to hold all the files generated
	var deliverables = doc.deliverables, 
		datetime = new Date(),
		microtime = Math.round(datetime.getTime()).toString(),
		json_answer_file = "generated/answers/" + microtime + ".json",
		// this is for the intermediate files...inserted data into templates and before we render the final output
		tmp_directory = "generated/tmp/",
		// this is the directory where users upload interview specific deliverables
		uploads_directory = "uploads/deliverables/" + doc.name + "-" + doc.id + "/",
		// this will be the directory that holds all the final output files...use this folder to create a zip later
		out_directory = "generated/output/" + doc.name + "-" + doc.id + "/" + microtime + "/",
		// holds the deliverables for insertion into the database
		db_delivs = [];

	var user_id = user;
	if (!user) {
		user_id = 0;
	}

	// This waterfall will run through each function until they are all complete
	// The first function creates a master object that can be passed into the stylesheet
	async.waterfall([function (callback) {

		var type, section, label, tmpvalue, values, value, index, subindex,name,qid, getLabel, getAnswer, isLoop;

		/**
		 * Retrieve the label for a field. If no argument is supplied, the main label is returned
		 *
		 * @id {string} The optional id of the radio, checkbox, or dropdown label that we want to retrieve
		 *
		 */
		getLabel = function (id) {
			if (typeof id === 'undefined') {
				return this.label;
			} 
			if (Array.isArray(this.values[this.name])) {
				return this.values.label[id];
			} else {
				return this.values.label[id];
			}
		};

		/**
		 * A helper function to get the answer of a question
		 *
		 */
		getAnswer = function () {
			return this.values[this.name];
		};

		/**
		 * A helper function to see if the question is part of a loop
		 *
		 */
		isLoop = function () {
			return this.loop;
		};

		// go through each variable and attach a few other properties
		for (name in master) {
			if (master.hasOwnProperty(name)) {
				if (typeof master[name].values !== 'undefined') {
					type = master[name].type;
					// this will be 'advanced' or 'field'
					section = master[name].section;
					qid = master[name].qid;
					// this will only be stringified array for a check-box
					value = (typeof master[name].values[name] !== 'undefined') ? master[name].values[name]: '';
					// initialize the label object inside the values
					master[name].values.label = {};
					master[name].question = {};

					// Set the main label (check-box,radios and drop-downs have labels for each selection, and possibly a label for the question itself)
					switch (section) {
						case 'advanced':
							// there are no labels for advanced variables
							label = null;
							break;
						case 'field':
							// get the index of where the variable resides in the fields array, returns -1 if not found
							index = utils.findIndex('name', name, doc.data[qid].fields); 

							// attach the field label if it exists
							label = (index >= 0) ? doc.data[qid].fields[index].label : label = null;

							// checkbox, radio, and text_dropdowns have labels attached to each id
							if (type === 'radio' || type === 'text_dropdown') {
								if (Array.isArray(value)) {
									for (var i = 0; i < value.length; i+=1) {
										subindex = utils.findIndex('id', value[i], doc.data[qid].fields[index].values);
										if (subindex >= 0) {
											master[name].values.label[value[i]] = doc.data[qid].fields[index].values[subindex].label;
										} 
									}
								} else {
									if (index >= 0) {
										subindex = utils.findIndex('id', value, doc.data[qid].fields[index].values);
										if (subindex >= 0) {
											master[name].values.label[value] = doc.data[qid].fields[index].values[subindex].label;
										}
									}
								}
							} else if (type === 'checkbox') {
								// if the question is a loop, value will be an array of stringified arrays, so we need to parse each one
								if (Array.isArray(value)) {
									// make sure all the labels are added for looped checkboxes
									// this will only add the labels for the checkboxes selected on the first loop iteration
									value = value[0];
								}

								// a checkbox stores a stringified array as the value so first parse it
								value = JSON.parse(value);

								if (value) {
									// go through each answer and look up its label
									for (var j = 0; j < value.length; j+=1) {
										subindex = utils.findIndex('id', value[j], doc.data[qid].fields[index].values);
										if (subindex >= 0) {
											master[name].values.label[value[j]] = doc.data[qid].fields[index].values[subindex].label;
										} else if (value[j] === 'nota') {
											master[name].values.label.nota = "None of the above";
										}
									}
								}
							}
							break;
					}

					master[name].label = label;
					master[name].getLabel = getLabel;
					master[name].getAnswer = getAnswer;
					master[name].isLoop = isLoop;
				} else {
					delete master[name];
				}
			}
		}
		callback(null, master);		
	},

	// This function will take the master that was created and attach it to 
	// another object along with the progress from the interview
	function (master, callback) {
		var answers = {};

		// go through the progress array and attach some extra properties to each object, like the answers from that question
		for (var i = 0; i < progress.length; i+=1) {
			// store each questions answers as an array of objects
			progress[i].answers = [];
			
			var qid = progress[i].qid;

			// look through the fields array from the database for the question and match each variable name to the master 
			var fields = doc.data[qid].fields;
			
			for (var j = 0; j < fields.length; j+=1) {
				var name = fields[j].name;
				progress[i].answers.push(master[name]);
			}
		}

		// go through each variable and attach a few other properties
		for (var prop in master) {
			if (master.hasOwnProperty(prop)) {
				if (typeof master[prop].values !== 'undefined') {
					answers[prop] = master[prop].values[prop];
				}
			}
		}

		// This object will contain all the answers as well as the progress
		var outcome = {
			meta: {
				date: {
					day: datetime.getDate(),
					month: (parseInt(datetime.getMonth(),10)+1),
					year: datetime.getFullYear(),
					time: datetime.toTimeString(),
					raw: datetime
				}
			},
			interview: {
				name: doc.name
			},
			master: master,
			progress: progress,
			answers: answers
		};

		callback(null, outcome);	
	},

	// This function takes the result from the last function in the waterfall
	function (outcome, callback) {
		var client = clientName(outcome.master.Client_first_name_TE, outcome.master.Client_last_name_TE, outcome.master.Client_full_name_TE);

		// Save the outcome to disk
		// We do not need to wait for this to complete because it is independent of any other operations
		fs.writeFile(base_location + json_answer_file, JSON.stringify(outcome,null,4), function (err) {
			if (err) {
				console.log(err);
				callback(err);
			} 
		});

		// Before we start creating all the output files, store them in a temp directory, for easy zip up later
		fs.mkdir(base_location + out_directory, 511, function (err) {
			if (err) {
				console.log(err);
				throw err;
			}

			// The master count refers to the how many total deliverables we are processing
			var master_count = 0;

			// The loop count refers to an individual deliverable which many be processed more than once
			var looper_count = 0;

			// Loop through each deliverable, creating a temp filename to store the (.fo|.fdf) and then write the file
			// and use that temp file to generate the final output, but running Apache FOP, or docx4j, and store in correct directory.
			// 
			// If there is a problem generating any document, none are generated and a message is returned to the user
			async.forEachSeries(deliverables, function (deliverable, callback) { 
				var input_name = deliverable.input.name,
					input_type = deliverable.input.type || 'fo',
					output_name = deliverable.output.name,
					// this will be pdf_form for a fillable pdf
					output_type = deliverable.output.type,
					//this will create the temp file (to be passed for output generation) using the input type selected when adding a deliverable
					tmp = tmpFilename(input_type),
					// pass in the name of the output, and the type collected from th admin section...add deliverable
					out = outFilename(doc.name, output_name, output_type, client, datetime, master_count),
					looper = deliverable.input.looper,
					current_deliverable = utils.deepCopy(deliverable);

				// this is where we read in the style sheet given to us
				fs.readFile(base_location + uploads_directory + input_name, 'utf8', function (err, data) { 
					// Any errors get passed to the final callback function
					if (err) {
						callback(err);
					} 
						
					// since this will be error prone (user given style sheet), wrap it in a try block
					try {
						// stylesheet will be an .fo string, or a fdf string for a fillable form, with all the data 
						// replaced, ready to be sent to the fop or fdf processor

						var locals = { 
							master:outcome.master,
							progress:outcome.progress,
							answers: outcome.answers,
							count: looper_count
						};

						// Attach all the common functions for the stylesheet and interview
						for (var fnCommon in func.common) {
							locals[fnCommon] = func.common[fnCommon];
						}

						// Attach all the functions for the stylesheet
						for (var fnLocal in func.stylesheet) {
							locals[fnLocal] = func.stylesheet[fnLocal];
						}

						var stylesheet = ejs.render(data, { 
							locals: locals
						});

						// This is where we write the temp file. A generated .fo or .fdf file is created. 
						// Only do this if the style sheet was generated at all
						fs.writeFile(base_location + tmp_directory + tmp, stylesheet, function (err) {
							if (err) {
								console.log(err);
								throw err;
							} 

							var cmd;

							// check to see what the output is and use the corresponding doc processor
							if (output_type === 'pdf_form') {
								// this will use pdftk to create a pdf that is filled
								cmd = spawn('pdftk', [base_location + deliverable.input.form.path, 'fill_form', base_location + tmp_directory + tmp, 'output', base_location + out_directory  + out]);
							} else {
								// this runs the fop build command with the location specific to either prod or dev
								cmd = spawn(app.get('fop_location') + 'fop', ['-' + input_type, base_location + tmp_directory + tmp, '-' + output_type, base_location + out_directory  + out]);
							}

							cmd.stderr.on('data', function (data) {
								console.log('stderr: ' + data);
								// A calback with the error can be called here because FOP wil thrown warnings
								// for things like fonts not being found, and we do not want to send error
								// messages for things like that and there is no way to distinguish 
								// between errors an warnings.
							});

							cmd.on('exit', function (code) {
								if (code !== 0) {
									callback('The stylesheet [' + input_name + '] could not be processed. There might be an error with one or more of your stylesheets. Also, check that Apache FOP is installed correctly and that the path to the binary (located in config.js) is correct.');
								} else {
									//if we get here the process exited successfully
									db_delivs.push({
										id: require('crypto').createHash('md5').update(tmp + output_type).digest("hex"),
										name: out,
										path: out_directory + out,
										description: deliverable.description,
										type: output_type
									});


									// if this a stylesheet that is looped, add on the same deliverable, to the 
									// array and run the same thing again with an incremented counter
									if (looper) {
										// the next deliverable should be right after the one we just did
										deliverables.splice(master_count+1, 0, current_deliverable);

										// goes to the next loop iteration
										master_count+=1;
										looper_count+=1;
										callback();
									} else {
										// goes to the next loop iteration
										master_count+=1;
										looper_count = 0;
										callback();
									}
								}
							});
						});
					// if there was a problem with generating the form, none of the documents are generated and the main callback below gets called
					} catch (e) {
						// if the error was a call to exit
						if (e === 'exit') {
							// go to the next iteration
							master_count+=1;
							looper_count = 0;
							callback();
						} else {
							// any other case
							callback(e);
						}

					}
				});

			// the main callback when we are done looping through the deliverables, called as soon as an error bubbles up
			}, function (err) {
				// if there was an error with a style sheet this gets called
				if (err) {
					callback(err);
				} else {
					// this is the success callback
					callback(null,{
						dir: out_directory, 
						col: db_delivs, 
						client: client
					});
				}
			});
		});

	},

	// This will save the output results to the database
	function (data, callback) {
		// look up the counter of the outputs
		models.Counters.findOne({}, function (err, counter) {
			var output = new models.Outputs();
			// get the current count from the database and increment by to get the next interview
			var count = counter.output_count + 1;

			output.id = count;
			// This will be 0 for a non-registered user (guest)
			output.user_id = user_id;
			output.client_lastname = data.client.last;
			output.client_firstname = data.client.first;
			output.client_fullname = data.client.full;
			output.interview = {
				id: doc.id,
				name: doc.name,
				group: doc.group
			};
			output.deliverables = data.col;
			output.answers = {
				id: require('crypto').createHash('md5').update(data.client.last + count).digest("hex"),
				name: microtime + ".json",
				path: json_answer_file,
				type: 'json'
			};
			output.date = datetime;

			// save to the database
			output.save(function(err) {
				if (err) {
					callback(err);
				} else {
					//update the counter in the database
					models.Counters.update({output_count: count}, function (err) {
						if (err) {
							callback(err);
						} else {
							callback(null, data);
						}
					});	
				}
			});
		});
	}],
	// When all functions are done this gets run, or if an error comes up
	function (err, result) {
		if (err) {
			// return with an error, which will alert the end-user
			socket_callback(err);
		} else {
			// this returns to the socket function
			socket_callback(null, result);
		}
	});
};

/**
 * This gets called before the absolute final output question gets shown to the client, 
 * and we process the email notifications and send out any deliverables.
 *
 * @email {string} The id of the question
 * @interview_name {string} The name of the interview being processed
 * @base {string} The base_location setting in the config file
 * @data {object} The interview object
 * @complete {object} Contains the settings for what to do after an interview is completed (set in the manager)
 * @deliverables {object} Contains all the deliverable data that has been processed
 * @client {object} Contains the name of the end-user completing the interview
 * @app {object} The LogicPull application object that contains settings we need
 * @socket_callback {function} Callback that gets run after completion
 *
 */
exports.email = function (email, interview_name, base, data, complete, deliverables, client, app, socket_callback) {
	"use strict";

	var date = new Date(); 
	var datetime = date.toLocaleDateString() + " " + date.toTimeString();
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

	async.waterfall([function (callback) {
		var message;

		// check to see if we want to email notifications out, and its not disabled in configuration
		if (!app.get('disable_email_notifications') && complete.email_notification) {
			message = {
				from: app.get('email_from'),
				to: app.get('email_notifications_to'),
				bcc: complete.email_notification,
				subject: "LogicPull Event Notification",
				text: "The following activity has recently occurred: " + interview_name + " - Completed " + datetime + " by " + client.full + ".",
				html: "<div>The following activity has recently occurred:<br><br><p><strong>" + interview_name + "</strong> - Completed " + datetime + " by <strong>" + client.full + "</strong></p>.</div>"
			};

			// send mail with defined transport object
			transport.sendMail(message, function(err, response) {
				if (err) {
					console.log(err);
					callback(err);
				} else {
					console.log("Message sent: " + response.message);
					callback(null, response.message);	
				}
			});
		} else {
			callback(null, null);
		}
	},
	/**
	 * Email deliverables to client
	 *
	 */
	function (response, callback) {
		// check to see if we want to email deliverables to a user-defined list set in the manager
		if (!app.get('disable_email_deliverables') && complete.email_deliverables) {
			var out = outFilename(interview_name, '', 'zip', client, date, null);
			// gzip the folder with the deliverables
			zipFiles(base, out, data.deliverables, function (err, attach_file_path) {
				var message;

				if (err) {
					console.log(err);
					callback(err);
				} else {
					message = {
						from: app.get('email_from'),
						to: app.get('email_deliverables_to'),
						bcc: complete.email_deliverables,
						subject: "LogicPull Interview Deliverables",
						text: "The following activity has recently occurred: " + interview_name + " - Completed " + datetime + " by " + client.full + ".",
						html: "<div>The following activity has recently occurred:<br><br><p><strong>" + interview_name + "</strong> - Completed " + datetime + " by <strong>" + client.full + "</strong><br>All deliverables produced are attached below in the zip file <strong>"+out+"</strong></p>.</div>",
						attachments: [{
							filePath: attach_file_path,
						}]
					};

					// send mail with defined transport object
					transport.sendMail(message, function(err, response) {
						if (err) {
							console.log(err);
							// return the error to the socket and show the error question
							callback(err);
						} else {
							callback(null, attach_file_path);
						}
					});				
				}
			});
		} else {
			callback(null, null);
		}
	},

	/**
	 * Email deliverables to users defined in the manager. 
	 *
	 * @path_to_zip {string} The complete file path of where the zip is located
	 *
	 */
	function (path_to_zip, callback) {
		var out, message;

		// check to see if we want to email notifications to he client. the email is given to us at the end
		if (!app.get('disable_email_deliverables') && complete.email_deliverables_to_client) {
			message = {
				from: app.get('email_from'),
				to: email,
				subject: "LogicPull Deliverables",
				text: "The following activity has recently occurred: " + interview_name + " - Completed " + datetime + " by " + client.full + ".",
				html: "<div>Your documents have been prepared for you!<br><br><p><strong>" + interview_name + "</strong> - Completed " + datetime + "<br>All deliverables produced are attached below in the zip file below.</p>.</div>"
			};

			// if path_to_zip is null that means the zip has not been generated yet
			if (path_to_zip) {

				message.attachments = [{filePath: path_to_zip}];

				// send mail with defined transport object
				transport.sendMail(message, function(err, response) {
					if (err) {
						console.log(err);
						// return the error to the socket and show the error question
						callback(err);
					} else {
						callback(null, path_to_zip);
					}
				});	

			} else {
				out = outFilename(interview_name, '', 'zip', client, date, null);

				// gzip the folder with the deliverables
				zipFiles(base, out, data.deliverables, function (err, attach_file_path) {

					if (err) {
						console.log(err);
						callback(err);
					} 

					message.attachments = [{filePath: attach_file_path}];

					// send mail with defined transport object
					transport.sendMail(message, function(err, response) {
						if (err) {
							console.log(err);
							// return the error to the socket and show the error question
							callback(err);
						} else {
							callback(null, path_to_zip);
						}
					});				
				});
			}

		} else {
			callback(null, null);
		}
	}],

	/**
	 * When all functions in the waterfall have completed, or an error has occurred.
	 *
	 */
	function (err, result) {
		if (err) {
			socket_callback(err);
		} else {
			// this returns to the socket function
			socket_callback(null, result);
		}
	});
};