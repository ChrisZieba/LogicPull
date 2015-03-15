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

var graphviz = require('graphviz'),
	fs = require('fs'),
	utils = require('./utils'),
	sanitizor = require('../lib/validation/sanitizor'),
	validator = require('../lib/validation/validator'),
	interview = require('./interviews/interview'),
	process = require('./interviews/process'),
	helpers = require('./helpers'),
	models = require('../models/models'),
	// stores all the information about the client, including the variables in the interview, and sockets (1 or 2 depending if editing)
	connected_clients = {};

// the app parameter is used for retrieving vars via app.get()
exports.listen = function (server, sessionStore, app) {
	"use strict";

	var io = require('socket.io').listen(server);

	io.set('close timeout', app.get('socket_close_timeout'));
	io.set('log level', app.get('socket_log_level'));
	io.set('match origin protocol',  app.get('socket_match_origin_protocol'));
	io.set('sync disconnect on unload',  app.get('socket_sync_disconnect_on_unload'));
	io.set('transports', app.get('socket_transports'));
	io.set('flash policy port', app.get('socket_flash_policy_port'));

	if (app.get('socket_browser_client_minification')) {
		io.enable('browser client minification');
	}

	if (app.get('socket_browser_client_etag')) {
		io.enable('browser client etag'); 
	}

	if (app.get('socket_browser_client_gzip')) {
		io.enable('browser client gzip');
	}

	// This is what runs on an incoming socket request
	// If there is already a session established, accept the socket, otherwise deny it
	io.set('authorization', function (data, accept) {
		// Check if the person connecting is logged in. 
		// If they are, store there user is and check it again when they are trying to save the interview
		if (data.headers.cookie) {
			data.cookie = utils.parseCookie(data.headers.cookie);

			if (data.cookie) {
				if (data.cookie['connect.sid']) {
					data.sessionID = data.cookie['connect.sid'].split('.')[0].substring(2);
					// create a new connection to the LogicPul database, so we can compare the _id field to the cookie sid field
					// these must match in order for a connection to go through
					// (literally) get the session data from the session store
					sessionStore.get(data.sessionID, function (err, session) {
						// these are urls we don't need to authorize a logged in user for the /interviews
						var no_auth_required = new RegExp(app.get('base_url') + '/interviews/', "g");

						if (err || ! session) {
							// don't accept the socket request if the user is not logged in
							// don't authorize the user on the demo or interviews
							if ( ! no_auth_required.test(data.headers.referer)) {
								// if we get he the URL is from inside the manager
								return accept('Session not found in database', false);
							}
							// this means the URL is from the demo, or the interview subdomain
							console.log('   debug - ' + 'no socket authorization needed');
							return accept(null, true);
						}

						// save the session data and accept the connection if the user is logged in
						if (session.user.authenticated) {
							data.session = session;
							data.session.url = data.headers.referer;
							console.log('   debug - ' + 'authorized - session id: ' + data.sessionID);
							return accept(null, true);
						}

						if ( ! no_auth_required.test(data.headers.referer)) {
							return accept('User is not authenticated', false);
						}

						console.log('   debug - ' + 'no socket authorization needed');
						return accept(null, true);									
					});                     
				} else {
					return accept('No cookie transmitted.', false);
				}               
			} else {
				return accept('No cookie transmitted.', false);
			}
		} else {
			return accept('No cookie transmitted.', false);
		}
	});

	// client is the socket
	io.sockets.on('connection', function (client) {
		// keep track of all the connected_clients
		var id = client.id;

		// @type {string} kind of message..i.e question, error...
		function emitData (id, type, data) {
			var socket_id;

			connected_clients[id].socket.emit(type, data);

			// if this socket has an editor id set, than check if any other socket shares that id, and send the data to that socket as well
			if (connected_clients[id].editor) {
				// go through each socket to see if we can get the editor socket
				for (socket_id in connected_clients) {
					if (connected_clients.hasOwnProperty(socket_id)) {
						// check that we are not checking the same socket
						if (socket_id !== id) {
							if (connected_clients[socket_id].editor) {
								// check if they match
								if (connected_clients[socket_id].editor === connected_clients[id].editor) {
									connected_clients[socket_id].socket.emit(type, data);
									break;
								}
							}
						}
					}
				}
			}
		}

		// if the session is NOT already open, create the new object
		if (!connected_clients.hasOwnProperty(client.id)) {
			connected_clients[id] = {
				editor:null,
				session: client.handshake.sessionID || null,
				user: null,
				socket: client,
				data: {
					interview: {},
					//progress: [],
					// this is a map of what each question is in terms of distance from the end
					distance: {},
					// master will now contain the variables from each question 
					master: {},
					deliverables: {},
					client: null
				}
			};

			// if the user is logged in the, there will be a session saved for them, otherwise there wont be, and the user is using a socket without being logged in (demo)
			if (connected_clients[id].session) {
				// if there is a session (logged in user socket) then save some session info to the socket
				sessionStore.get(connected_clients[id].session, function (err, session) {
					if (session && !err) {
						connected_clients[id].user = session.user;
					} 
				});  
			}
		} 

		// after the editor client connects, send an id
		client.on('editor_id', function (editor_id) {
			connected_clients[id].editor = editor_id;
		}); 

		// When the viewer starts
		client.on('start', function (data) {
			var run;
			var progress;
			var send_data;
			var preview = data.preview;
			var start = data.start;

			models.Interviews.findOne({id: data.interview_id}, function (err, doc) {
				if (err) {
					console.log(err);
					throw err;
				} 
				
				if (!doc) {
					emitData(id, 'srv_error', { id: null, error: interview.error("The interview could not be found.").error.content, valid: false });
					return;
				}

				var qid = doc.start;

				// When an interview starts save the set to the database (new record)
				// get the current count of the interview
				models.Counters.findOne({}, function (err, counter) {
					// get the current count from the database and increment by to get the next interview
					var tmp_count = counter.tmp_count + 1;
					// this gets set to zero because each state is sequential and this will be the first state
					var state_id = counter.state_count + 1;
					var tmp_progress = [];
					var tmp_history = [];
					var tmp = new models.Tmps();
					var state = new models.States();

					// update the counter right away
					models.Counters.update({tmp_count: tmp_count, state_count: state_id}, function (err) {
						if (err) {
							console.log(err);
							throw err;
						} 

						// check if a value was passed as the start (preview)
						if (start) {
							// check to make sure the start passed is actually used in the interview
							if (doc.data[start]) {
								qid = start;
							}
						}
						
						// initialize the progress
						tmp_progress.push(state_id);

						var startInterview = function (graph) {
							// In case the window is closed while the graph is being generated
							if (typeof connected_clients[id] === 'undefined' || !connected_clients[id].hasOwnProperty('data')) {
								return;
							}

							// now we can use the distance object mapping to find how many questions are in front of the current one
							var fraction = graph[qid] || '';

							// turn the start question of the interview, completing any before logic in the question
							run = interview.start(qid, doc.data[qid], doc.data, {}, [], state_id); 

							// build the history for the drop down menu
							progress = interview.progress(run.progress); 

							// cache the graph data 
							console.log(connected_clients[id] + id);
							connected_clients[id].data.distance = graph;

							// the first question does not run helpers.merge, which adds the fields
							connected_clients[id].data.master.fields = [];

							// we don't need to rerun the helpers.merge function because any vars that are set at the beginning will be returned with run
							// this is the master vars after all the logic is run, including the before logic of the question we are showing
							connected_clients[id].data.master.vars = run.master;

							connected_clients[id].data.interview = {
								id: doc.id,
								name: doc.name,
								description: doc.description
							};

							send_data = {
								// send the id (count) that corresponds to the database record of the tmp record, which corresponds to the save_id if we save
								id: tmp_count,
								qid: run.qid,
								data: {
									question: run.question, 
									progress: progress,
									debug: run.debug,
									fraction: fraction
								},
								valid: true
							};

							// create the new database record for the interview being worked on
							tmp.id = tmp_count;
							// a reference to where the last state is
							tmp.current = state_id;
							tmp.history = run.progress;
							tmp.created = new Date();
							tmp.last_modified = new Date();
							// the progress will record the state id after each question
							tmp.progress = tmp_progress;

							tmp.save(function(err) {
								if (err) {
									console.log(err);
									throw err;
								} 

								// create a new state record 
								state.id = state_id;
								//state.tmp_id = tmp_count,
								state.created = new Date();
								state.last_modified = new Date();
								state.data = connected_clients[id].data;

								state.save(function(err) {
									if (err) {
										console.log(err);
										throw err;
									}

									// update the interview in the database to cache the distance graph, if NOT in preview mode
									if ( !preview && doc.distance.update) {
										doc.distance = {
											update: false,
											graph: graph
										};

										doc.save(function () {
											if (err) {
												console.log(err);
												throw err;
											}
											emitData(id, 'question', send_data);
										});
									} else {
										emitData(id, 'question', send_data);
									}
								});

							});
						};

						// check if grahpviz progress is disabled
						if (app.get('disable_graphviz_progress')) {
							startInterview({});
						} else {
							// we might not need to update the progress fraction if the interview has been modified
							if (doc.distance.update) {
								interview.distance(doc.data, qid, startInterview);
							} else {
								startInterview(doc.distance.graph);
							}
						}
					});
				});
			});
		});

		// When the continue button on the viewer is clicked, or when back is clicked, or when the progress dropdown is changed
		client.on('question', function (data) { 
			var loop;
			var query;
			var validate;
			var send_data;
			var run;
			var next;
			var progress;
			var fraction;
			var qid = data.qid;
			var loop_index = null;
			// this is the array of objects with the answers
			var fields = data.fields; 

			//TODO: sanitize the inputs, not dry, don't query the database every time for this interview ... store the variable
			models.Interviews.findOne({id: data.interview}, function (err, doc) {
				if (err) {
					console.log(err);
					throw err;
				} 

				if (!doc) {
					emitData(id, 'srv_error', { id: null, error: interview.error("The interview could not be found.").error.content, valid: false });
					return;
				}

				models.Tmps.findOne({id: data.id}, function (err, tmp) {
					if (err) {
						console.log(err);
						throw err;
					} 

					// look up the current state using the current id
					models.States.findOne({id: tmp.current}, function (err, state) {
						if (err) {
							console.log(err);
							throw err;
						} 
						models.Counters.findOne({}, function (err, counter) {
							if (err) {
								console.log(err);
								throw err;
							} 

							var tmp_progress = tmp.progress;
							var new_state = new models.States();
							var new_state_id = counter.state_count +=1;

							// update the counter in the database
							models.Counters.update({state_count: new_state_id}, function (err) {
								if (err) {
									console.log(err);
									throw err;
								} 

								// save the database interview information to the clients socket object
								connected_clients[id].data = state.data;

								// the validate function will evaluate the answers sent when the user clicks next
								// pass the answers, and the fields for this question...so we can compare to the validation object
								// validate will return either true, or false and an error message
								validate = interview.validate(fields, doc.data[qid], connected_clients[id].data.master.vars, doc.data);

								// check all the fields for their validation 
								if (validate.error) {
									// prepare the error data for the client
									send_data = {
										id: tmp.id,
										qid: null,
										// this is an object with the error message, name of the field that caused the error and a truth value
										data: validate,
										valid: false
									};

									emitData(id, 'question', send_data);
								} else {

									if (err) {
										console.log(err);
										throw err;
									} 

									// This tests to see of the loop variable is set in the question, activating the loop.
									// When a question is in a loop, its answers are stored differently.
									loop = (doc.data[qid].loop1 !== null && typeof doc.data[qid].loop1 !== 'undefined' && doc.data[qid].loop1 !== '') ? true : false;

									connected_clients[id].data.master.fields = fields;

									// We need to get the loop_index before the fields are merged into the master set
									if (loop) {
										for (var prop1 in connected_clients[id].data.master.vars) {
											if (connected_clients[id].data.master.vars.hasOwnProperty(prop1)) {
												if (connected_clients[id].data.master.vars[prop1].loop) {
													if (connected_clients[id].data.master.vars[prop1].qid === qid) {
														if (Array.isArray(connected_clients[id].data.master.vars[prop1].values[prop1])) {
															loop_index = connected_clients[id].data.master.vars[prop1].values[prop1].length;
															break;
														}
													}
												}
											}
										}
										// set the loop index to 0 if it wasnt set since its in a loop
										if (loop_index === null) {
											loop_index = 0;
										}
									}

									// merge the variables into the master set
									connected_clients[id].data.master.vars = helpers.merge(connected_clients[id].data.master.vars, fields, loop, doc.data[qid]);

									// get the before_logic
									next = interview.next(qid, doc.data[qid], doc.data, connected_clients[id].data.master.vars, fields, tmp.history, new_state_id);

									// check if the next question is in a loop
									var next_loop = (doc.data[next.qid].loop1 !== null && typeof doc.data[next.qid].loop1 !== 'undefined' && doc.data[next.qid].loop1 !== '') ? true : false;

									// we need to get the loop length so
									// we can get the correct state based on the loop index, which will
									// be incremented and saved in the state when it's saved
									if (next_loop) {
										var next_loop_index = null;
										for (var prop2 in connected_clients[id].data.master.vars) {
											if (connected_clients[id].data.master.vars.hasOwnProperty(prop2)) {
												if (connected_clients[id].data.master.vars[prop2].loop) {
													if (connected_clients[id].data.master.vars[prop2].qid === next.qid) {
														if (Array.isArray(connected_clients[id].data.master.vars[prop2].values[prop2])) {
															next_loop_index = connected_clients[id].data.master.vars[prop2].values[prop2].length;
															break;
														}
													}
												}
											}
										}

										// set the loop index to 0 if it wasnt set since its in a loop
										if (next_loop_index === null) {
											next_loop_index = 0;
										}
									
										query = {
											tmp_id: tmp.id, 
											base_qid: next.qid,
											loop_id: next_loop_index
										};
									} else {
										query = {
											tmp_id: tmp.id, 
											base_qid: next.qid
										};
									}

									// Look for any states that have run this question already
									models.States.find(query).sort({created: 1}).exec(function (err, states) {
										// Build the queston using any previously answerd questions
										run = interview.build(next, doc.data, fields, tmp.history, new_state_id, states);

										// build the history for the progress bar
										progress = interview.progress(run.progress); 

										// find out the fractional progress of the interview
										console.log(connected_clients[id]);
										fraction = (connected_clients[id].data.distance && connected_clients[id].data.distance.hasOwnProperty(run.qid)) ? connected_clients[id].data.distance[run.qid] : '';

										// update master vars list, since new answers could be created in the logic
										connected_clients[id].data.master.vars = run.master; 

										// This is the data that gets sent back to the client. 
										// It involves the HTML of the question to show the user,
										// and debug info for the editor (if edit mode)
										send_data = {
											id: tmp.id,
											qid: run.qid,
											data: {
												question: run.question, 
												progress: progress,
												debug: run.debug,
												fraction: fraction
											},
											valid: true
										};  

										// create a new state record 
										new_state.id = new_state_id;
										new_state.tmp_id = tmp.id;
										new_state.loop_id = loop_index;
										new_state.base_qid = qid;
										new_state.created = new Date();
										new_state.last_modified = new Date();
										new_state.data = connected_clients[id].data;
										
										new_state.save(function(err) {
											if (err) {
												console.log(err);
												throw err;
											} 

											tmp_progress.push(new_state_id);

											// update the interview data in the database corresponding the socket ID
											models.Tmps.update({id:tmp.id}, {current: new_state_id, progress: tmp_progress, history: run.progress, last_modified: new Date().getTime()}, function (err) {
												if (err) {
													console.log(err);
													throw err;
												} 

												// send the data back to the client
												emitData(id, 'question', send_data);
											});	
										});
									});
								}
							});
						});
					});
				});
			});
		});

		// when back is clicked, or when the progress dropdown is changed
		client.on('back', function (data) { 
			models.Interviews.findOne({ id: data.interview }, function (err, doc) {
				if (err) {
					console.log(err);
					throw err;
				} 

				if (!doc) {
					emitData(id, 'srv_error', { id: null, error: interview.error("The interview could not be found.").error.content, valid: false });
					return;
				}

				var send_data, back, history, fraction;

				// look up the data for the users interview from the database
				models.Tmps.findOne({ id: data.id }, function (err, tmp) {
					if (err) {
						console.log(err);
						throw err;
					}

					if (!tmp) {
						emitData(id, 'srv_error', { id: null, error: interview.error("A record could not be found for this interview.").error.content, valid: false });
						return;
					}

					var tmp_progress = tmp.progress;
					var tmp_history = tmp.history;

					// get the updated history and the id of the state we want to load
					history = interview.history(tmp_progress, tmp_history, data.backid, data.previd);

					tmp_progress = history.progress;
					tmp_history = history.history;

					// We need two states since the latest has the fields to repopulate, and the second has the state we want to revert to
					models.States.find({id: { $in: [history.new_current_state, history.removed_state]} }).sort({id: -1}).exec(function (err, states) {
						if (err) {
							console.log(err);
							throw err;
						} 
						// this will be set to the current state
						var new_current_state = states[1];

						// use the fields from this state to repopulate
						var removed_state = states[0];

						back = interview.back(doc.data, new_current_state.data.master.vars, removed_state.data.master.fields, history.qid);

						// find out the fractional progress of the interview			
						fraction = (connected_clients[id].data.distance && connected_clients[id].data.distance.hasOwnProperty(back.qid)) ? connected_clients[id].data.distance[back.qid] : '';

						send_data = {
							id: tmp.id,
							qid: back.qid,
							data: {
								question: back.question, 
								progress: interview.progress(tmp_history),
								debug: back.debug,
								fraction: fraction
							},
							valid: true
						};    

						//update the interview data in the database corresponding the socket ID
						models.Tmps.update({id:tmp.id}, {current: new_current_state.id, progress: tmp_progress, history: tmp_history, last_modified: new Date().getTime()}, function (err) {
							if (err) {
								console.log(err);
								throw err;
							} 
							// send the data back to the client
							emitData(id, 'question', send_data);
						});	
					});
				});
			});
		});

		// this is for the editor..not the viewer
		client.on('save', function (data) {
			var save = false;

			// if theres a session here (not null) than the user is logged in while connecting to a socket
			if (connected_clients[id].session && connected_clients[id].user) {
				if (connected_clients[id].user.privledges.editor_save) {
					save = true;
				}
			}

			// only save to the database if the user has privileges
			if (save) {
				//TODO: sanitize the inputs
				models.Interviews.findOne({ id: data.id }, function (err, doc) {
					if (err) {
						console.log(err);
						throw err;
					} 

					if (!doc) {
						emitData(id, 'srv_error', { id: null, error: interview.error("The interview could not be found.").error.content, valid: false });
						return;
					}

					//doc.name = data.settings.name;
					doc.description = data.settings.description;
					doc.steps = data.settings.steps;
					doc.start = data.settings.start;
					doc.data = data.data;
					doc.distance = {
						update: true,
						graph: {}
					};
					doc.save();
					connected_clients[id].socket.emit('saved', true);
					
				});
			} else {

				connected_clients[id].socket.emit('saved', false);
			}
		});

		// when a client clicks the button to reorder the graph this fires
		// TODO send this only to the client that is the editor
		client.on('graph', function (data) {
			if (app.get('disable_graphviz_tidy')) {
				emitData(id, 'graph', {});
			} else {
				var g = graphviz.digraph("G");
				var options = {
					type: "dot",
					G: {
						splines: false,
						rankdir: "BT",
						nodesep: "0.2"
					}
				};

				// this creates the initial dot file to be rendered
				for (var prop in data.nodes) {
					if (data.nodes.hasOwnProperty(prop)) {
						g.addNode(prop);
						if (data.nodes[prop]) {
							for (var i = 0; i < data.nodes[prop].length; i+=1) {
								g.addEdge(prop, data.nodes[prop][i]);
							}                   
						}                   
					}
				}

				// this takes the dote graph generated above and creates a dot file with all the postions
				g.output(options, function (out) { 
					var dot = out.toString('utf-8');
					var regex = /(q\d+)\s\[pos="(\d+),(\d+)",/gmi;
					var graph = {};
					var match;

					while ((match = regex.exec(dot)) !== null) {
						graph[match[1].toString()] = {
							x: parseInt(match[2],10),
							y: parseInt(match[3],10)
						};
					}

					emitData(id, 'graph', graph);               
				});
			}
		});

		// this gets called when the save button in the viewer is clicked. 
		// We need the note (if any) to populate the text area on the save pop up
		client.on('get_saved_note', function (data) {
			//sanitize all the data sent over
			var clean_id = sanitizor.clean(data.id.toString());

			// look to see if there is already a saved interview with the same ID being sent from the client
			models.Saves.findOne({ id: clean_id }).select("note").exec(function (err, doc) {
				var note = "";

				if (err) {
					console.log(err);
					throw err;
				} 

				if (doc) {
					note = doc.note;
				} 

				// let the user know there was an error
				emitData(id, 'insert_saved_note', { note:note }); 
			});
		});

		// when the client clicks the save button
		// if we get here that mean the user is logged in (this is checked via Ajax in viewer.js)
		client.on('save_progress', function (data) {
			//sanitize all the date sent over
			var clean_id = sanitizor.clean(data.id.toString());
			var clean_qid = sanitizor.clean(data.qid);
			var clean_note = sanitizor.clean(data.note).substring(0,200);
			var clean_interview = sanitizor.clean(data.interview);

			// check if a user is logged in , there will be a sessionID from the database saved form them
			if (connected_clients[id].session) {
				// revalidates that the user is still logged in, since we only checked when the socket connected
				sessionStore.get(connected_clients[id].session, function (err, session) {
					if (err) {
						console.log(err);
						throw err;
					} 

					if (session && session.user) {
						// look up the data for the users interview from the database
						models.Tmps.findOne({ id: clean_id }, function (err, tmp) {
							if (err) {
								console.log(err);
								throw err;
							} 
							// look up the current state
							models.States.findOne({id: tmp.current }, function (err, state) {
								if (err) {
									console.log(err);
									throw err;
								} 

								// if we get here the user is still logged in and we can get all their saved interviews
								// look to see if there is already a saved interview with the same ID being sent from the client
								models.Saves.findOne({ id: clean_id }, function (err, doc) {
									if (err) {
										// let the user know there was an error
										emitData(id, 'saved_progress', { valid:false }); 
										return;
									}

									// if doc is not empty than there is already a record saved for that interview
									if (doc) {
										// update
										models.Saves.update({id:clean_id}, {
											data: {
												current: tmp.current,
												history: tmp.history,
												progress: tmp.progress,
												state: state.data
											}, 
											qid: clean_qid, 
											note: clean_note, 
											last_modified: new Date()
										}, function (err) {
											if (err) {
												console.log(err);
												throw err;
											} 
											emitData(id, 'saved_progress', {valid:true}); 
										});	
									} else {
										var save = new models.Saves();
										// the tmp id gets incremented every time an interview is started so we don't have to worry about collisions
										save.id = tmp.id;
										save.user_id = session.user.id;
										save.interview_id = clean_interview;
										save.qid = clean_qid;
										save.socket_id = id;
										save.note = clean_note;
										save.interview = connected_clients[id].data.interview;
										save.created = new Date();
										save.last_modified = new Date();
										save.data = {
											current: tmp.current,
											history: tmp.history,
											progress: tmp.progress,
											state: state.data
										};

										save.save(function(err) {
											if (err) {
												console.log(err);
												throw err;
											} 

											emitData(id, 'saved_progress', {valid:true}); 
										});
									}
								});
							});
						});
					} else {
						emitData(id, 'saved_progress', {valid:false}); 
					}
				});
			} else {
				// the user is not logged in and we can ask them to login first
				emitData(id, 'saved_progress', {valid:false}); 
			}
		}); 

		// when the client clicks the open button on the viewer
		client.on('open_saves', function (data) {
			// check if a user is logged in ,there will be a sessionID from the database saved for them
			if (connected_clients[id].session) {
				// revalidate that the user is still logged in, since we only checked when the socket connected
				sessionStore.get(connected_clients[id].session, function (err, session) {
					if (err) {
						console.log(err);
						throw err;
					} 

					if (session && session.user) {
						// if we get here the user is still logged in and we can get all their saved interviews
						// look up the saved progress and attach the user name to the database record
						// now we can add the users name to the record in the database for later retrieval
						models.Saves.find({}).where('user_id').equals(session.user.id).where('interview_id').equals(data.interview).sort('-created').exec(function(err, saves) {
							if (err) {
								console.log(err);
								throw err;
							} 
							// send back all the saved interviews for the particular interview, corresponding to that user
							emitData(id, 'open_saved', {
								valid: true,
								data: interview.saves(saves)
							});
						});
					} else {
						emitData(id, 'open_saved', {valid:false}); 
					}
				});
			} else {
				// the user is not logged in and we can ask them to login first
				emitData(id, 'open_saved', { valid:false }); 
			}
		}); 

		// when the client clicks the open button on the viewer
		client.on('load_saved', function (data) {
			// first we need to get the id from the data which is sent in the format "partial-55"
			var full_partial_id = data.partial_id;
			var partial_id = full_partial_id.split('-')[1];

			// so now we have the id of the partial interview we want to load into the viewer
			models.Saves.findOne({}).where('id').equals(partial_id).exec(function(err, partial) {
				if (err) {
					console.log(err);
					throw err;
				} 

				if (partial) {
					// get the interview 
					models.Interviews.findOne({id: partial.interview_id}, function (err, doc) {
						if (err) {
							console.log(err);
							throw err;
						} 

						models.Counters.findOne({}, function (err, counter) {
							var tmp = new models.Tmps();
							var tmp_count = counter.tmp_count + 1;

							// update the counter in the database
							models.Counters.update({tmp_count: tmp_count}, function (err) {
								if (err) {
									console.log(err);
									throw err;
								} 

								var run = interview.load(doc.data[partial.qid], doc.data, partial.data.state.master.vars); 
								var send_data = {
									// send the id (count) that corresponds to the database record of the tmp record, which corresponds to the save_id if we save
									id: tmp_count,
									qid: partial.qid,
									data: {
										question: run.question, 
										progress: interview.progress(partial.data.history),
										// there is no debug info...you cant load a partial interview when in preview mode, i.e. the editor
										debug: null,
										fraction: (partial.data.state.distance.hasOwnProperty(partial.qid)) ? partial.data.state.distance[partial.qid] : ''
									},
									valid: true,
									partial:true
								};

								// create the new database record for the interview being worked on
								tmp.id = tmp_count;
								// a reference to where the last state is
								tmp.current = partial.data.current;
								tmp.history = partial.data.history;
								tmp.created = new Date();
								tmp.last_modified = new Date();
								// the progress will record the state id after each question
								tmp.progress = partial.data.progress;

								tmp.save(function (err) {
									if (err) {
										console.log(err);
										throw err;
									}

									// load in the states for answer pre-population
									models.States.find({id: {$in: tmp.progress }}, function (err, states) {
										if (err) {
											console.log(err);
											throw err;
										}

										//create a new duplicate state with the new tmp_id
										for (var i = 0; i < states.length; i+=1) {
											var state = new models.States();
											state.id = counter.state_count + i + 1;
											state.tmp_id = tmp.id;
											state.loop_id = states[i].loop_id;
											state.base_qid = states[i].base_qid;
											state.created = new Date();
											state.last_modified = new Date();
											state.data = states[i].data;
											state.save();
										}

										var state_count = counter.state_count + states.length;

										// update the counter in the database
										models.Counters.update({state_count: state_count}, function (err) {
											if (err) {
												console.log(err);
												throw err;
											}
											emitData(id, 'question', send_data);
										});
									});
								});
							});
						});
					});
				} else {
					// for some reason we could not find the partial interview we are trying to load
					console.log('The saved record was not found when trying to load a saved interview.');
					throw err;
				}
			});
		}); 

		// when a finish button is clicked in the interview
		client.on('finish', function (data) {
			var validate, emit, deliverables, run, progress, on_complete, send_data;
			var base_location = app.get('base_location');
			// this is the array of objects with the answers
			var fields = data.fields;
			var qid = data.qid;

			//TODO: sanitize the inputs, not dry, don't query the database every time for this interview ... store the variable
			models.Interviews.findOne({ id: data.interview }, function (err, doc) {
				if (err) {
					console.log(err);
					throw err;
				} 

				if (!doc) {
					emitData(id, 'srv_error', { id: null, error: interview.error("The interview could not be found.").error.content, valid: false });
					return;
				}

				models.Tmps.findOne({ id: data.id }, function (err, tmp) {
					if (err) {
						console.log(err);
						throw err;
					}

					// look up the current state using the current id
					models.States.findOne({id: tmp.current }, function (err, state) {
						if (err) {
							console.log(err);
							throw err;
						} 

						models.Counters.findOne({}, function (err, counter) {
							if (err) {
								console.log(err);
								throw err;
							} 

							var tmp_progress = tmp.progress;
							var tmp_history = tmp.history;
							var new_state = new models.States();
							var new_state_id = counter.state_count +=1;

							// save the database interview information to the clients socket object
							connected_clients[id].data = state.data;

							// the validate function will evaluate the answers sent when the user clicks next
							// pass the answers, and the fields for this question...so we can compare to the validation object
							// validate will return either true, or false and an error message
							validate = interview.validate(fields, doc.data[qid], connected_clients[id].data.master.vars, doc.data);

							// check all the fields for their validation 
							if (validate.error) {
								// send the error back to the client
								send_data = {
									id: tmp.id,
									qid: null,
									data: validate,
									valid: false
								};
								// inform the client of whats happening
								emitData(id, 'question', send_data);

							} else {
								var loop = (doc.data[qid].loop1 !== null && typeof doc.data[qid].loop1 !== 'undefined' && doc.data[qid].loop1 !== '') ? true : false;

								connected_clients[id].data.master.fields = fields;
								connected_clients[id].data.master.vars = helpers.merge(connected_clients[id].data.master.vars, fields, loop, doc.data[qid]);

								// this has all the info for what to do when the finish button is completed
								on_complete = doc.on_complete;
								deliverables = doc.deliverables;

								// handle all the deliverables, if there are any
								// TODO add a default deliverable! NOTHING HAPPENS WHEN there are no deliverables
								if (deliverables.length !== 0) {

									// This callback gets fired when all the deliverables have been created. It is passed into the process,output function
									var callback = function (err, data) {
										if (err) {
											// if any stylesheet was not procure send back some error to the client
											console.log(err);
											send_data = {
												id: tmp.id,
												error: interview.error(err).error.content,
												valid: false
											};  

											emitData(id, 'srv_error', send_data);   
										} else {
											// now we have the folder where all the stores deliverables 
											connected_clients[id].data.deliverables = data.dir;
											// store the client info onto the master object
											connected_clients[id].data.client = data.client;

											// check to see if we want to allow the client to receive the deliverables via email
											// if this is true we send a question to the client asking for an email
											if (on_complete.email_deliverables_to_client) {

												// create the final question of the interview, asking for an email
												run = interview.final(qid, doc.data[qid], doc.data, connected_clients[id].data.master.vars, fields, tmp_progress, deliverables);

												// build the history 
												progress = interview.progress(tmp_history); 
												// update master vars list
												connected_clients[id].data.master.vars = run.master; 
												connected_clients[id].data.progress = run.progress;

												// this is the data that gets sent back to the client. It involves the HTML of the question to 
												// show the user, and debug info for the editor (if edit mode)
												send_data = {
													id: tmp.id,
													qid: run.qid,
													data: {
														question: run.question, 
														progress: progress,
														debug: run.debug
													},
													valid: true
												};

												emitData(id, 'question', send_data);
											} else {
												// just handle the emails and output the done question
												// base_location - this is the server base so we can find out where to put the zip
												// on_complete - this is the settings for what to do at the end
												// the first null is the email of the client
												process.email(null, doc.name, base_location, connected_clients[id].data, on_complete, deliverables, data.client, app, function (err, response) {
													if (err) {
														// if there was any problems with emails, or zipping folders
														console.log(err);
														emit = 'srv_error';
														send_data = {
															id: null,
															error: interview.error(err).error.content,
															valid: false
														};  
														emitData(id, emit, send_data);   
													} else {
														// this will put together the final success question after everything is done
														run = interview.done();
														emit = 'question';
														send_data = {
															id: null,
															qid: null,
															data: {
																question: run.question, 
																progress: run.progress,
																debug: run.debug
															},
															valid: true
														};                                                  

														// create a new state record 
														new_state.id = new_state_id;
														new_state.created = new Date();
														new_state.last_modified = new Date();
														new_state.data = connected_clients[id].data;

														new_state.save(function(err) {
															if (err) {
																console.log(err);
																throw err;
															} 

															tmp_progress.push(new_state_id);

															//update the interview data in the database corresponding the socket ID
															models.Tmps.update({id:tmp.id}, {current: new_state_id, progress: tmp_progress, history: run.progress, last_modified: new Date().getTime()}, function (err) {
																if (err) {
																	console.log(err);
																	throw err;
																} 
																// inform the client of whats happening...either the docs were produced or there was an error
																emitData(id, emit, send_data);

															});	
														});
													}
												});
											}
										}
									};

									if (connected_clients[id].session) {
										// check if the user is logged in
										sessionStore.get(connected_clients[id].session, function (err, session) {
											if (err) {
												console.log(err);
												throw err;
											} 

											if (session && session.user) {
												process.output(doc, connected_clients[id].data.master.vars, tmp_history, base_location, app, session.user.id, callback);
											}
										});
									} else {
										// An unregistered user is completing the interview
										process.output(doc, connected_clients[id].data.master.vars, tmp_history, base_location, app, null, callback);
									}
								} else {
									send_data = {
										id: null,
										error: interview.error("The interview does not have any deliverables.").error.content,
										valid: false
									};  
									emitData(id, 'srv_error', send_data);
								}
							}
						});
					});
				});
			});
		});

		// When the user clicks the send button at the very end, this is the very last button
		client.on('send', function (data) { 
			var email = sanitizor.clean(data.email); 
			var base_location = app.get('base_location');
			var path = connected_clients[id].data.deliverables;
			var send_data;

			// if no email is entered or the format is not an email send them back
			if (validator.check(email, ['required','email']) ) {
				//if the email is valid we can email the user the deliverables
				models.Interviews.findOne({ id: data.interview }, function (err, doc) {
					var emit, run;
					var on_complete = doc.on_complete;
					var deliverables = doc.deliverables;

					if (err) {
						console.log(err);
						throw err;
					} 

					if (!doc) {
						emitData(id, 'srv_error', { id: null, error: interview.error("The interview could not be found.").error.content, valid: false });
						return;
					}

					// send out all the emails and finish up
					process.email(email, doc.name, base_location, connected_clients[id].data, on_complete, deliverables, connected_clients[id].data.client, app, function (err, response) {
						if (err) {
							// if there was any problems with emails, or zipping folders
							console.log(err);
							emit = 'srv_error';
							send_data = {
								id: null,
								error: interview.error(err).error.content,
								valid: false
							};  
						} else {
							// this will put together the final success question after everything is done
							run = interview.done();
							emit = 'question';

							send_data = {
								id: null,
								qid: null,
								data: {
									question: run.question, 
									progress: run.progress,
									debug: run.debug
								},
								valid: true
							};                                                  
						}
						// inform the client of whats happening...either the docs were produced or there was an error
						emitData(id, emit, send_data);
					});
				});
			} else {
				send_data = {
					id: null,
					qid: null,
					data: { 
						error: true, 
						message: 'The email is required and must be valid.', 
						name: 'q-final'
					},
					valid: false
				};                 
				emitData(id, 'question', send_data);            
			}
		});

		// when a client disconnects from the viewer, or editor
		client.on('disconnect', function () {
			if (connected_clients[id]) {
				delete connected_clients[id];
				console.log('   debug - ' + 'client ' + client.id + 'is disconnected');
				console.log('   debug - ' + 'total number of connected clients is ' + Object.keys(connected_clients).length);               
			}
		});
	});

	return io;
};