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
	validator = require('../validation/validator'),
	graphviz = require('graphviz'),
	moment = require('moment'),
	async = require('async');

/**
 * Builds the output question displayed to the user
 *
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @master {object} All the answers collected so far
 * @logic_debug {string} A string of all the logic that has been run so far
 * @type {string} The action used when building the question (back, prev, next)
 * @fields {array} The fields from the question
 * @data {object} From the database so we can use it in user defined functions in the interview
 * @answers {array} Contains the master object from a state which had the answers we will prepopulate with
 *
 */
function build (question, master, logic_debug, type, fields, data, answers) {
	"use strict";

	var output = [];
	var lm = [];
	var debug = [];
	var dbug_loop_offset = 1;
	// here is where we use any variables to rebuild the question 
	var text = helpers.parseText(question.question_text, master, data);
	var date_pickers = [];
	var max, min, values, field, label_class, input_name, input_type, input_label, input_default, input_validation, input_values, value, button, button_type, descending;

	// starts the question
	output.push('<div class="col-lg-12 contents">'); 
	output.push('<div class="text">' + text + '</div>'); 

	if (type === 'next') {
		debug.push('<div class="dbug-next">Continue Button was clicked</div>');
		// if the last question was a back question, and now we are going next, and we are on a loop question, add 1 to the debug index 
		debug.push(helpers.parseFields(fields, master, 0));
	} else if (type === 'back') {
		// this is used to make sure the right index is used i the debug window, when showing looped answers
		dbug_loop_offset = 0;
		debug.push('<div class="dbug-next">Back Button was clicked</div>');
		debug.push('<div class="dbug-name">[' + question.qid + '] ' + question.name + '</div>');
	}

	debug.push(logic_debug); 

	if (question.fields) {
		for (var i = 0; i < question.fields.length; i+=1) {
			field = question.fields[i];
			label_class = 'var-label';

			input_name = field.name;
			input_type = field.type;

			// we can only add a field in if it as a name and type
			if (input_name && input_type) {
				// a label can have a tool tip, or even variables inside it, so it needs to be run through the text parser to replace any tokens
				input_label = (field.label !== null && typeof field.label !== 'undefined') ? helpers.parseText(field.label, master, data) : '';

				// check to see if the default is null, since its inserted into the value
				input_default = (field.def !== null && typeof field.def !== 'undefined') ? helpers.parseText(field.def, master, data) : '';
				input_validation = field.validation;
				input_values = field.values;
				value = "";

				//use this to attach error class
				output.push('<div id="' + input_name + '-var-container" class="form-group">');
				
				if (input_label) {
					if (input_validation.required === 'yes' || input_validation.nota === 'yes') {
						label_class = "var-label required"; 
					} else {
						label_class = "var-label"; 
					}

					output.push('<div class="' + label_class + '">' + input_label);
					output.push('</div>');
				}

				switch (input_type) {
					case 'text':
						// if we go back to a question, re populate the answers
						//value = (type === 'back') ? helpers.getAnswer(input_name, fields) : input_default;
						value = helpers.getAnswer(input_name, fields, type, input_default, answers);
						output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field">');
						output.push('<li>');

						if (value !== null && typeof value !== undefined && value !== '') {
							output.push('<input type="text" value="' + value + '" name="' + input_name + '" size="40" class="textbox notranslate" />');
						} else {
							output.push('<input type="text" value="" name="' + input_name + '" size="40" class="textbox notranslate" />');
						}
						
						output.push('</li>');
						output.push('</ul>');
						break;
					case 'textarea':
						value = helpers.getAnswer(input_name, fields, type, input_default, answers);
						output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field">');
						output.push('<li>');
						output.push('<textarea name="' + input_name + '" cols="34" rows="5" class="textarea notranslate">' + value + '</textarea>');
						output.push('</li>');
						output.push('</ul>');
						break;
					case 'number':
						value = helpers.getAnswer(input_name, fields, type, input_default, answers);
						output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field">');
						output.push('<li>');
						output.push('<input type="text" value="' + value + '" name="' + input_name + '" size="40" class="textbox notranslate" />');
						output.push('</li>');
						output.push('</ul>');
						break;
					case 'radio':
						if (input_values) {
							value = helpers.getAnswer(input_name, fields, type, "", answers);
							output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field radio-list">');

							for (var j = 0; j < input_values.length; j+=1) {
								output.push('<li>');
								if (value === input_values[j].id) {
									output.push('<input type="radio" id="' + input_name + '-' + j + '" name="' + input_name + '" value="'+ input_values[j].id + '" checked="checked" />');
								} else {
									output.push('<input type="radio" id="' + input_name + '-' + j + '" name="' + input_name + '" value="'+ input_values[j].id + '" />');
								}
								
								// a radio label an have a variable
								output.push('<label for="' + input_name + '-' + j + '">' + helpers.parseText(input_values[j].label, master, data) + '</label>');
								output.push('</li>');
							}
							output.push('</ul>');								
						}
						break;
					case 'date':
						// if we are going back set the default to the previous answer
						value = helpers.getAnswer(input_name, fields, type, null, answers);

						output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field">');
						// the id is used to generate a date-picker in viewer.js,  which is client side
						output.push('<li><input type="text" id="' + input_name + '_picker" name="' + input_name + '" size="14" class="datepicker-textbox notranslate" readonly="readonly" /></li>');
						output.push('</ul>');

						date_pickers.push({
							name: input_name,
							validation: input_validation,
							def: input_default,
							format: field.format,
							// use this to actually set a date in the text box...default only highlights the date when the pop up is opened
							set: value 
						});
						break;
					case 'checkbox':
						if (input_values) {
							value = "";
							// if we are repopulating a question, we need to parse the check box array of values to search for which ones are checked
							values = helpers.getAnswer(input_name, fields, type, [], answers);

							output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field checkbox-list">');
							// since we have special function for nota, we need to add a class for event listening, and a special id on the none of the above check boix
							for (var k = 0; k < input_values.length; k+=1) {
								output.push('<li>');

								// if the nota check is marked, add a class to each radio for event listening when they change
								if (input_validation.nota === 'yes') {
									if (value === input_values[k].id || values.indexOf(input_values[k].id) >= 0) {
										output.push('<input type="checkbox" id="' + input_name + '-' + k + '" name="' + input_name + '" value="'+ input_values[k].id + '" checked="checked" class="id-test id-cb" />');
									} else {
										output.push('<input type="checkbox" id="' + input_name + '-' + k + '" name="' + input_name + '" value="'+ input_values[k].id + '" class="id-test id-cb" />');
									}

								} else {
									if (value === input_values[k].id || values.indexOf(input_values[k].id) >= 0) {
										output.push('<input type="checkbox" id="' + input_name + '-' + k + '" name="' + input_name + '" value="'+ input_values[k].id + '" checked="checked" class="id-test" />');
									} else {
										output.push('<input type="checkbox" id="' + input_name + '-' + k + '" name="' + input_name + '" value="'+ input_values[k].id + '" class="id-test" />');
									}
								}

								output.push('<label for="' + input_name + '-' + k + '">' + helpers.parseText(input_values[k].label, master, data) + '</label>');
								output.push('</li>');
							}

							// here is we add on the NOTA check box
							if (input_validation.nota === 'yes') {
								output.push('<li>');
								// if the value in nota, mark it as checked...this is for when going back...re-population
								if (value === 'nota' || values.indexOf('nota') >= 0) {
									output.push('<input type="checkbox" id="' + input_name + '-nota" name="' + input_name + '" value="nota" checked="checked" class="id-test id-cb" />');
									output.push('<label for="' + input_name + '-nota">None of the Above</label>');
								} else {
									output.push('<input type="checkbox" id="' + input_name + '-nota" name="' + input_name + '" value="nota" class="id-test id-cb" />');
									output.push('<label for="' + input_name + '-nota">None of the Above</label>');
								}
								output.push('</li>');
							}
							output.push('</ul>');	
						}
						break;
					case 'text_dropdown':
						if (input_values) {
							output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field dropdown-list">');
							output.push('<li>');
							output.push('<select name="' + input_name + '" class="dropdown">');

							value = helpers.getAnswer(input_name, fields, type, input_default, answers);

							// if we are going back, the value is the previous answer, if going forward, it is just the default
							if (value !== null && typeof value !== undefined && value !== '') {
								output.push('<option value="" class="notranslate">none</option>');
								for (var l = 0; l < input_values.length; l+=1) {
									if (value === input_values[l].id) {
										output.push('<option value="' + input_values[l].id + '" selected="selected" class="notranslate">' + input_values[l].label + '</option>');									
									} else {
										output.push('<option value="' + input_values[l].id + '" class="notranslate">' + input_values[l].label + '</option>');	
									}
								}
							// no default set
							} else {
								// set the first item to selceted...one needs to be selected for validaiton purpises
								output.push('<option value="" selected="selected" class="notranslate">none</option>');
								for (var p = 0; p < input_values.length; p+=1) {
									output.push('<option value="' + input_values[p].id + '" class="notranslate">' + input_values[p].label + '</option>');
								}
							}
							output.push('</select>');
							output.push('</li>');
							output.push('</ul>');	
						}
						break;
					case 'number_dropdown':
						// zero is valid! Therefore we need to check for these scenarios instead of doing if (field.start) {}
						if (field.start !== null && typeof field.start !== 'undefined' && field.start !== '' && field.end !== null && typeof field.end !== 'undefined' && field.end !== '' ) {
							output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field dropdown-list">');
							output.push('<li>');
							output.push('<select name="' + input_name + '" class="dropdown">');

							max = Math.max(field.start, field.end);
							min = Math.min(field.start, field.end);
							descending = field.descending;

							value = helpers.getAnswer(input_name, fields, type, input_default, answers);

							if (value !== null && typeof value !== 'undefined' && value !== '') {
								output.push('<option value="" class="notranslate">none</option>');

								var m;
								if (descending === 'yes') {
									for (m = max; m >= min; m-=1) {
										if (parseInt(value,10) === m) {
											output.push('<option value="' + m + '" selected="selected" class="notranslate">' + m + '</option>');									
										} else {
											output.push('<option value="' + m + '" class="notranslate">' + m + '</option>');	
										}
									}
								} else {
									for (m = min; m <= max; m+=1) {
										if (parseInt(value,10) === m) {
											output.push('<option value="' + m + '" selected="selected" class="notranslate">' + m + '</option>');									
										} else {
											output.push('<option value="' + m + '" class="notranslate">' + m + '</option>');	
										}
									}
								}
	
							} else {
								// set the first item to selected...one needs to be selected for validaiton purpises
								output.push('<option value="" selected="selected" class="notranslate">none</option>');

								var q;
								if (descending === 'yes') {
									for (q = max; q >= min; q-=1) {
										output.push('<option value="' + q + '" class="notranslate">' + q + '</option>');	
									}
								} else {
									for (q = min; q <= max; q+=1) {
										output.push('<option value="' + q + '" class="notranslate">' + q + '</option>');	
									}
								}
							}
							output.push('</select>');
							output.push('</li>');
							output.push('</ul>');
							
						}
						break;
				}

				// this will put the index of the loop in the debug window
				// check to see if the loop variable ids defined
				if (question.loop1) {
					// we have to add 1 to this because the value has not been pushed onto the array yet! Therefore, we add one to get the index in the debug window right
					debug.push('<div class="dbug-field"><span class="bold">[' + input_type + '] </span> ' + input_name + '[' + helpers.getLength(input_name, master ,dbug_loop_offset) + '] =</div>');
				} else {
					debug.push('<div class="dbug-field"><span class="bold">[' + input_type + '] </span> ' + input_name + ' =</div>');
				}

				output.push('</div>'); //var-container
			}
		}
	}

	output.push('</div>');
	output.push('<div class="clear"></div>');

	if (question.buttons) {
		for (var r = 0; r < question.buttons.length; r+=1) {
			button =  question.buttons[r];
			button_type = button.type;

			if (button_type === "exit") {
				// removes the button event listener
				output.push('<div id="exit-interview" class="' + button_type + '-button notranslate">' + question.qid + '</div>'); 
			} else if (button_type === "finish") {
				// removes the button event listener
				output.push('<div id="finish-interview" class="' + button_type + '-button notranslate">' + question.qid + '</div>'); 
			} else {
				output.push('<div class="' + button_type + '-button button notranslate" data-qid="' + question.qid + '">' + button_type + '</div>');
			}
		}
		output.push('<div class="clear"></div>');
	}

	output.push('</div>');

	if (question.learn_more) {
		if (question.learn_more.body) {
			lm.push('<div class="contents">');
				lm.push('<div class="lm-data">');

					if (question.learn_more.title) {
						lm.push('<div class="lm-title-sm">'); 
						lm.push(helpers.parseText(question.learn_more.title, master, data));
						lm.push('</div>'); 
					}

					lm.push('<div class="lm-body-sm">'); 
					lm.push(helpers.parseText(question.learn_more.body, master, data));
					lm.push('</div>'); 
				lm.push('</div>');
			lm.push('</div>');
		}
	}

	return {
		question: {
			qid: question.qid,
			learnmore: lm.join(""),
			step: question.step,
			content: output.join(""),
			// this is the text of the content, with the values substituted in
			text: text, 
			date_pickers: date_pickers
		},
		debug: debug.join("")
	};		
}

/**
 * Builds the output question for the final question in the interview (before processing)
 *
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @master {object} All the answers collected so far
 * @logic_debug {string} A string of all the logic that has been run so far
 * @fields {array} The fields from the question
 * @deliverables {array} The array of deliverables containing style sheets
 *
 */
function buildFinal (master, logic_debug, fields, deliverables) {
	"use strict";

	var output = [];
	var debug = [];

	// starts the question
	output.push('<div class="contents"><div class="top-corners"></div><div class="prompt">');

	if (deliverables.length !== 0) {
		output.push('<div class="text"><h1>Success!</h1><br><p>Your documents were created successfully. Enter your email to get your documents.</p><br><p><i>We will <strong>not</strong> store your email or use it for anything other than sending you these documents.</i></p></div>'); 
	} else {
		output.push('<div class="text"><h1>Oops!</h1><br><p>We weren\'t able to generate any documents for you. There are no deliverables set!</p><br><br></div>'); 
	}
	
	debug.push('<div class="dbug-next">The Finish button was clicked</div>');
	debug.push(logic_debug);
	debug.push(helpers.parseFields(fields, master, 0));

	output.push('<div id="q-final-var-container" class="var-container">');
	output.push('<div class="var-label required">Email</div>');
	output.push('<ul id="q-final:text" class="id-field">');
	output.push('<li>');
	output.push('<input type="text" value="" name="q-final" size="40" class="textbox" />');
	output.push('</li>');
	output.push('</ul>');
	output.push('</div>');
	output.push('</div>');
	output.push('<div class="bottom-corners"></div>');
	output.push('<div class="clear"></div>');
	output.push('<div id="complete-interview" class="send-button">q-final</div>');
	output.push('<div class="clear"></div>');
	output.push('</div>');
	output.push('</div>');

	return {
		question: {
			content: output.join("")
		},
		debug: debug.join("")
	};	
}

/**
 * Runs the logic section of a question
 *
 * @qid {string} The id of the question
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @data {object} The interview data
 * @event {string} This is either 'before' or 'after' and refers to the type of logic
 * @master {object} All the answers collected so far
 * @debug {string} A string of all the logic that has been run so far
 * @show_name {boolean} Flag to show the question name in the debug window
 * @progress {array} The fields from the question
 * @skip_goto {boolean} Used to pass over any GOTO's in the last question of the interview
 *
 */
function logic (qid, question, data, event, master, debug, show_name, progress, skip_goto) {
	"use strict";

	// since this functions is recursive, save the first qid that comes in to it
	// compare after all the logic is done...to see if we need to check the button for a destination
	var old_qid = qid; 
	var actgoto = "false";
	var item, act, loop_index, get_logic, name, answer, loop, check_type, check_var, dbug_name, ad_var, condition;

	// open new item for the question we are going to
	if (show_name) {
		debug.push('<div class="dbug-name">[' + qid + '] ' + question.name + '</div>'); 
	}

	// this function will keep running until the advanced actions are all done, or a goto is finally reached
	if (question.advanced) {
		// go through each advanced block
		for (var i = 0; i < question.advanced.length; i+=1) {
			item = question.advanced[i];

			if (item.event === event) {
				condition = helpers.evalCondition(item.condition, master, 'condition', data);
				debug.push('<div class="dbug-condition-' + condition.toString() + '">[' + event + '] ' + item.condition + '</div>');

				// check if there are any actions to perform for the logic block
				if (item.actions) {
					// each advanced block has a number of actions that can be executed for the condition
					for (var j = 0; j < item.actions.length; j+=1) {
						act = item.actions[j];
						// goto acts on the first found...so if the first action is goto return all 
						// the vars that have been set and return
						// skip goto is only set to true on the final question
						if (act.action === 'goto' && !skip_goto) {
							if (act.value !== 'none') {
								if (act.if === condition) {
									actgoto = 'true';
								}
								debug.push('<div class="dbug-action-' + actgoto + '">goto ' + act.value + '</div>');

								if (act.if === condition) {
									qid = act.value;
									// if the action is goto and the logic is before, we need to go that question and run its logic, until there  are no ore befores/with goto
									// if its after, than just return the qid that we need to go to
									if (event === 'before') {
										// this will check to see if this question has been seen yet
										loop_index = (question.loop1 !== null && question.loop1 !== '') ? helpers.loopIndex(old_qid, progress) : null;

										progress.push({
											index: loop_index, 
											qid:old_qid, 
											show:false, 
											text: null,
											state: null
										});
										
										get_logic = logic(qid, data[qid], data, event, master, debug, true, progress);

										return {
											qid: get_logic.qid,
											vars: get_logic.vars,
											debug: get_logic.debug,
											progress: get_logic.progress
										};
									}
									// for after logic- return on the first goto that passes
									// this will return the question to go to, and any vars set in the advanced section of the current question 
									return {
										qid: qid,
										vars: master,
										debug: debug,
										progress: progress
									};
								} 
							} else {
								debug.push('<div class="dbug-action-' + actgoto + '">goto [none]</div>');
							}
						} else if (act.action === 'set') {
							// use this to set the name in the debug action
							dbug_name = act.name; 
							if (act.if === condition) {
								// TODO validation on this section, and parse the value..it may be and expression so we have to evaluate it to get the answer
								answer = helpers.evalCondition(act.value, master, 'value', data);// this could be an expression, so it needs to be evaluated
								
								// this will check to see if the answer is a number or text, and save it accordingly, returning the type and answer (as a number or string)
								check_type = helpers.numberCheck(answer);

								// is the variable already defined in the interview?
								check_var = helpers.checkVar(act.name);

								// only add the variable to the list if a name is returned .. which means it was valid
								if (check_var.name) {
									// check if the set var name is an array name[loop] or just name
									loop = ((data[qid].loop1 !== null && typeof data[qid].loop1 !== 'undefined' && data[qid].loop1 !== '') || check_var.type === 'Array') ? true : false;

									// the condition is true, so we need to merge the variable onto the master list
									ad_var = {
										qid: qid,
										//TODO check this to make sure there is no bad code in the name property
										name: check_var.name, 
										section: 'advanced',
										type: check_type.type,
										answer: check_type.value // if the answer was a number, this will be stored as a number						
									};

									// the merge function needs to know if its a loop because of how we store the variables. 
									master = helpers.merge(master, [ad_var], loop, data[qid]);

									// debugging..this will add the brackets if its an array
									dbug_name = (Array.isArray(master[check_var.name].values[check_var.name])) ? check_var.name + '[' + helpers.getLength(check_var.name, master, 0) + ']' : act.name;

									// add quotes to strings
									if (check_type.type === 'text') {
										debug.push('<div class="wrappage dbug-action-true">set ' + dbug_name + ' = \"' + answer + '\"</div>');
									} else {
										debug.push('<div class="wrappage dbug-action-true">set ' + dbug_name + ' = ' + answer + '</div>');
									}
								} else {
									// this will be red since it doesnt get set
									debug.push('<div class="wrappage dbug-action-false">set ' + dbug_name + ' = ' + act.value + '</div>');	
								}

							} else {
								// this will be red since it doesnt get set
								debug.push('<div class="wrappage dbug-action-false">set ' + dbug_name + ' = ' + act.value + '</div>');
							}
						}
					}
				}
			}
		}
	} 

	// if the qid has not changed, than check the buttons to see if there is a destination. We don't want to run this for 'before' logic
	if (event === 'after') {
		if (old_qid === qid) {
			if (question.buttons) {
				for (var p = 0; p < question.buttons.length; p+=1) {
					if (question.buttons[p].type === 'continue') {
						if (question.buttons[p].destination !== 'none') {
							qid = question.buttons[p].destination;
							debug.push('<div class="dbug-button"><span class="bold">[continue]</span> ' + qid + '</div>');
						}
					}
				}
			}
		}
	} 

	return {
		qid: qid,
		vars: master,
		debug: debug,
		progress: progress
	};
}

/**
 * Attach some default variables to the interview master set, like TODAY
 *
 * @master {object} All the answers collected so far
 *
 */
function defaultVars (master) {
	"use strict";

	var defvars = [{
		qid: null,
		name: 'TODAY',
		section: 'default',
		type: 'text',
		answer: moment().format("MM/DD/YYYY")				
	}];

	// these variables are not part of a loop so pass in false, and en empty string
	return helpers.merge(master, defvars, false, {});
}

/**
 * Depth First Search
 *
 * @qid {string} The question ID
 * @visited {array} The nodes visited so far
 * @questions {object} Contains the data for each question
 *
 */
function dfs (qid, visited, questions) {
	"use strict";

	var ret, edges;

	visited.push(qid);
	
	if (questions[qid].source_paths) {
		edges = questions[qid].source_paths;
	}

	// first sort out all of the edges
	if (edges) {
		for (var j = 0; j < edges.length; j+=1) {
			// since deleted paths remain in the array as undefined this needs a check
			if (edges[j]) { 
				// if a node has NOT been visited
				if (visited.indexOf(edges[j].d) === -1) { 
					dfs(edges[j].d, visited, questions);
				}				
			}
		}
	}

	ret = visited;
	return ret;
}

/**
 * Takes a collection of states and returns the answers from the latest question answered.
 * In the future we might need all states to for looped question.
 *
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @master {object} All the answers collected so far
 * @states {array} 
 *
 */
function previous_answers (states) {
	"use strict";

	// If no states matched we do not care about pre-populating old answer data
	if (states.length === 0) {
		return null;
	}

	// default
	var answers = {};
	var state = states[states.length - 1];
	var vars = state.data.master.vars;

	// Get all the questions where the qid matches 
	for (var q_var in vars) {
		if (vars.hasOwnProperty(q_var)) {
			var item = vars[q_var];
			if (item.qid === state.base_qid) {
				answers[q_var] = item;
			}
		}
	}

	return answers;
}

/**
 * This gets called once, when the interview gets started. 
 * We do not need to run any after logic since we are starting on a question.
 *
 * @qid {string} The id of the question
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @data {object} The interview data
 * @master {object} All the answers collected so far
 * @progress {array} The array of the order in which question are answered
 * @state {string} The ID of the state corresponding to the states database table
 *
 */
exports.start = function (qid, question, data, master, progress, state) {
	"use strict";

	// attach the defaults to the master
	master = defaultVars(master);

	// this runs the before logic of the question we are about to show, which is defined as the start question
	// the empty array is for the debug, it is empty when we start, but the recursive logic calls will add logic onto it
	var before_logic = logic(qid, question, data, 'before', master, [], true, progress);
	
	// this will build the question and the debug string
	var run_build = build(data[before_logic.qid], before_logic.vars, before_logic.debug.join(""), 'start', null, data);
	
	// this will push the question we display to the user onto the progress array, which may contain questions that have been visited, but now shown to the user
	var loop_index = (data[run_build.question.qid].loop1 !== null && data[run_build.question.qid].loop1 !== '') ? helpers.loopIndex(run_build.question.qid, progress) : null;

	before_logic.progress.push({
		index: loop_index,
		qid: run_build.question.qid, 
		step: run_build.question.step, 
		show: true, 
		text: helpers.removeHTML(run_build.question.text),
		state: state
	});

	return {
		// this contains the question, date-pickers, and text without HTML
		question: run_build.question,
		debug: run_build.debug,
		// this returns the new complete set of Master variables fore the interview
		master: before_logic.vars,  
		// the progress is used for building the drop down list
		progress: before_logic.progress,
		qid: run_build.question.qid
	};
};

/**
 * This gets called when we are loading a partially saved interview.
 * There is no logic to run. Just build the output of the question
 *
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @data {object} The interview data
 * @master {object} All the answers collected so far
 *
 */
exports.load = function (question, data, master) {
	"use strict";

	var run_build = build(question, master, "", 'load', null, data);

	return {
		question: run_build.question
	};

};

/**
 * Build the next question in an interview. This happens when a user clicks the "Continue" button
 *
 * @qid {string} The id of the question
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @data {object} The interview data
 * @master {object} All the answers collected so far
 * @fields {array} The answers to the question
 * @progress {array} The array of the order in which question are answered
 * @state {string} The ID of the state corresponding to the states database table. We use the state to attach it to the history so we can look it up when we use the progress bar.
 * @states {array} A collection of states for this question. Will contain answers previously answered for the same question.
 *
 */
exports.build = function (before_logic, data, fields, progress, state, states) {
	"use strict";

	// This is the set of answers from the last time this question was answered, null if there are none
	var answers = previous_answers(states);

	// put the question and the debug together
	var run_build = build(data[before_logic.qid], before_logic.vars, before_logic.debug.join(""), 'next', fields, data, answers);
	
	// this will push the question we display to the user onto the progress array, which may contain questions that have been visited, but now shown to the user
	var loop_index = (data[run_build.question.qid].loop1 !== null && data[run_build.question.qid].loop1 !== '') ? helpers.loopIndex(run_build.question.qid, progress) : null;

	// this will push the question that will be shown to the user
	before_logic.progress.push({
		index: loop_index,
		qid: run_build.question.qid, 
		step: run_build.question.step, 
		show: true, 
		text: helpers.removeHTML(run_build.question.text),
		state: state
	});

	return {
		question: run_build.question,
		debug: run_build.debug,
		// this returns the new complete set of Master variables fore the interview
		master: before_logic.vars, 
		progress: before_logic.progress,
		qid: run_build.question.qid
	};
};

/**
 * Run the next question in an interview. This happens when a user clicks the "Continue" button
 *
 * @qid {string} The id of the question
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @data {object} The interview data
 * @master {object} All the answers collected so far
 * @fields {array} The answers to the question
 * @progress {array} The array of the order in which question are answered
 * @state {string} The ID of the state corresponding to the states database table. We use the state to attach it to the history so we can look it up when we use the progress bar.
 *
 */
exports.next = function (qid, question, data, master, fields, progress, state) {
	"use strict";

	// if we hit a 'GOTO in the before logic, exit the logic and return the qid of the new question
	var after_logic = logic(qid, question, data, 'after', master, [], false, progress, false);
	
	// this is the new qid for the question once the after logic is completed. It could be the same, if there is no logic
	// this will run the before logic for the new question we are going to
	var before_logic = logic(after_logic.qid, data[after_logic.qid], data, 'before', after_logic.vars, after_logic.debug, true, after_logic.progress);

	return before_logic;
};

/**
 * Validate each fields condition, as well as any user defined conditions as well
 *
 * @fields {array} The answers to the question
 * @questions {object} is the array of fields for the question from the database for the particular question
 * @master {object} All the answers collected so far
 * @data {object} The interview data
 *
 */
exports.validate = function (fields, question, master, data) {
	"use strict";

	var label;
	var copy = utils.deepCopy(master);
	var result = { 
		error: false, 
		message: null, 
		name: null 
	};

	// go through each field
	for (var i = 0; i < question.fields.length; i+=1) {
		var name = question.fields[i].name;
		var validation = question.fields[i].validation;
		var type = question.fields[i].type;

		if (question.fields[i].label !== null && typeof question.fields[i].label !== 'undefined' && question.fields[i].label !== false) {
			label = question.fields[i].label;
		} else {
			label = '';
		}
		
		// find where in the array the field is so we can reference it
		var index = utils.findIndex('name', name, fields); 

		if (index >= 0 ) {
			// this contains the answer to the question we are trying to validate
			var answer = fields[index].answer; 

			// before we go into the validation string, do some preliminary checks. For example, number only requires numbers no letters
			switch (type) {
				case 'number':
					if ( ! validator.check(answer, ['number']) ) {
						result = { 
							error: true, 
							message: 'The highlighted field expects a number only.', 
							name: name
						};
						return result;
					}
					break;
				default:
					break;
			}

			// go through each validation property of the field
			// required is different for each field so need to run a switch on that case, e.g - required for radios only need to see if :checked
			for (var p in validation) {
				if (validation.hasOwnProperty(p)) {
					switch (p) {
						case 'required':
							if (validation[p] === 'yes') {
								if (answer.length === 0) {
									result = { 
										error: true, 
										message: 'The highlighted field is required.', 
										name: name 
									}; 
									return result; 
								}
							} 
							break;
						case 'nota':
							if (validation[p] === 'yes') {
								if (answer.length === 0) {
									result = { 
										error: true, 
										message: 'You must select one of the check boxes for the highlighted field.', 
										name: name
									};
									return result;
								}
							} 
							break;
						case 'min_length':
							if (validation[p]) {
								if ( !validator.check(answer, [{'minlength': validation.min_length}]) ) {
									result = { 
										error: true, 
										message: 'You must enter at least ' + validation.min_length + ' characters for the highlighted field.', 
										name: name
									};
									return result;
								}		
							}
							break;
						case 'max_length':
							if (validation[p]) {
								if ( !validator.check(answer, [{'maxlength': validation.max_length}]) ) {
									result = { 
										error: true, 
										message: 'You can only enter at most ' + validation.max_length + ' characters for the highlighted field.', 
										name: name
									};
									return result;
								}		
							}
							break;
						case 'less_than':
							if (validation[p]) {
								if ( !validator.check(answer, [{'max': validation.less_than}]) ) {
									result = { 
										error: true, 
										message: 'The number must be less than ' + validation.less_than + '.', 
										name: name
									};
									return result;
								}		
							}
							break;
						case 'greater_than':
							if (validation[p]) {
								if ( !validator.check(answer, [{'min': validation.greater_than}]) ) {
									result = { 
										error: true, 
										message: 'The number must be greater than ' + validation.greater_than + '.', 
										name: name
									};
									return result;
								}		
							}
							break;
						case 'min_date':
							// TODO
							break;
						case 'max_date':
							// TODO
							break;
						default:
							break;
					}
				}
			}

			// if we get here the input is still valid, and we can attach it to the master copy
			// check if the set var name is an array name[loop] or just name
			var loop = (question.loop1 !== null && typeof question.loop1 !== 'undefined' && question.loop1 !== '') ? true : false;

			// the condition is true, so we need to merge the variable onto the master list
			var ad_var = {
				qid: question.qid,
				name: name, 
				section: 'field',
				type: type,
				answer: answer					
			};

			copy = helpers.merge(copy, [ad_var], loop, question);

			// now check to see if the user defined condition fails
			if (validation.hasOwnProperty('condition')) {
				// parse the condition
				if (validation.condition !== null && validation.condition !== '') {
					var condition = helpers.evalCondition(validation.condition, copy, 'condition', data);
					var message = (typeof validation.message !== 'undefined' && validation.message !== '') ? validation.message : 'The input is not valid.';

					if (condition) {
						result = { 
							error: true, 
							message: message, 
							name: name
						};
						return result;
					}	
				}
			}
		}

	}

	return result;
};

/**
 * Call this function when the back button gets clicked, or when the progress bar gets changed to find where to go next.
 *
 * @data {object} The interview data
 * @master {object} All the answers collected so far
 * @fields {array} The answers to the question
 * @qid {string} The id of the question
 *
 */
exports.back = function (data, master, fields, qid) {
	"use strict";

	// this will pass the master list to the build, and get rid of the populated answers
	var run_build = build(data[qid], master, '', 'back', fields, data);

	return {
		// this contains the question, date-pickers, and text without HTML
		question: run_build.question,
		debug: run_build.debug,
		qid: run_build.question.qid
	};

};

/**
 * Call this function when the back button gets clicked, to rebuild the history and progress.
 *
 * @progress {array} Used to record the state of the interview
 * @history {array} The array of objects containing the history of the users progress through the interview
 * @value {object} The id of the drop down that was currently selected in the interview..contains qid:i:{index||null} where i is the index of the progress array
 * @prev {string} NULL when we click the back button, and contains the id of the drop down when we started changing it
 *
 */
exports.history = function  (progress, history, value, prev) {
	"use strict";

	var split, run_build, qid, new_i, new_current_state , removed_state, last_state;
	var index = 2;

	// a null here means that the back button was clicked..not a change in the progress drop down
	if (prev === null) {

		// we need to get the first question that is a 'visible' question
		while (history[history.length-index].show !== true) {
			// this will be the index of the first question that was visible to the user
			index+=1;
		}

		new_i = history.length-index;

		// this is the qid of what we want to go back to.. 
		qid = history[new_i].qid;

		// this state will have the fields from the previous question
		removed_state = progress.pop();
		//removed.push(removed_state);

		// this will reset the interview to when the question is being displayed
		new_current_state = progress[progress.length-1];

		// this will remove the unwanted history elements
		history = history.slice(0,new_i+1);
		
	} else {
		// this is the id of the select that we changed to
		split = value.split(":"); 

		// this is the id of the select before we changed (question we were on)
		new_i = parseInt(split[1],10);

		// this is the qid of the select we changed to
		qid = split[0];

		// this will remove the unwanted history elements
		history = history.slice(0,new_i+1);

		last_state = history[history.length-1].state;

		var progress_length = progress.length - 1;

		// the last element
		var progress_last = progress[progress.length - 1];

		while (progress_last !== last_state) {
			removed_state = progress.pop();
			progress_last = progress[progress.length - 1];
		}

		new_current_state = progress[progress.length-1];
	}

	return {
		// use the state to grab the data master we need
		removed_state: removed_state,
		new_current_state : new_current_state,
		qid: qid,
		progress: progress,
		history: history
	};
};

/**
 * This function builds the progress drop down in the interview
 *
 * @history {array} Use the history of the users progress through the interview to build the drop down
 *
 */
exports.progress = function (history) {
	"use strict";

	var output = [];
	var length = history.length;

	for (var i = 0; i < length; i+=1) {
		// this will make sure we only add questions to the history that have been viewed, not skipped over in before logic
		if (history[i].show) {
			// this means it is the last one
			if (i === length - 1) { 
				// if the question is from a loop, show the index in the value
				if (history[i].index !== null) {
					// the reason i am using i in the select, is to make slicing the array easier if we go back (user chooses to bo to a previous question)
					output.push('<option value="' + history[i].qid + ':' + i + ':' + history[i].index + '" selected="selected">' + history[i].step + ' - [' + history[i].index + '] ' + history[i].text  + '</option>');
				} else {
					output.push('<option value="' + history[i].qid + ':' + i + ':null" selected="selected">' + history[i].step + ' - ' + history[i].text  + '</option>');
				}
			} else {
				// if the question is from a loop, show the index in the value
				if (history[i].index !== null) { // a null means that the question is not from an array, where as an index will let us know the array index
					output.push('<option value="' + history[i].qid + ':' + i + ':' + history[i].index + '">' + history[i].step  + ' - [' + history[i].index  + '] ' + history[i].text  + '</option>');
				} else {
					output.push('<option value="' + history[i].qid + ':' + i + ':null">' + history[i].step + ' - ' + history[i].text  + '</option>');
				}				
			}
		}
	}

	return output.join("");
};

/**
 * Calculates the fractional progress .ie. 1 of 34
 *
 * @questions {object} is the array of fields for the question from the database for the particular question
 * @start {string} The qid of the question to start building the graph from
 * @callback {function} A callback function to run after the graph has been generated
 *
 */
exports.distance = function (questions, start, callback) {
	"use strict";

	var qid;
	var nodes = {};
	var g = graphviz.digraph("G");
	var graph = {};
	var ordered = dfs(start,[], questions);
	var options = {
		type: "dot",
		G: {
			splines: false,
			rankdir: "BT",
			nodesep: "0.2"
		}
	};

	for (var i = 0; i < ordered.length; i+=1) {
		qid = ordered[i];
		nodes[qid] = [];
		// if there are source paths push them onto the new obj
		if (questions[qid].source_paths.length !== 0) { 
			for (var j = 0; j < questions[qid].source_paths.length; j+=1) {
				if (questions[qid].source_paths[j] !== null && typeof questions[qid].source_paths[j] !== 'undefined') {
					nodes[qid].push(questions[qid].source_paths[j].d);
				}
			}
		}
	}

	// this creates the initial dot file to be rendered
	for (var prop in nodes) {
		if (nodes.hasOwnProperty(prop)) {
			g.addNode(prop);
			if (nodes[prop]) {
				for (var k = 0; k < nodes[prop].length; k+=1) {
					g.addEdge(prop, nodes[prop][k]);
				}                   
			}                   
		}
	}

	// this takes the dote graph generated above and creates a dot file with tall the positions
	g.output(options, function (out) { 
		var dot = out.toString('utf-8');
		var y = 0;
		var y_match;
		var regex = /(q\d+)\s\[pos="(\d+),(\d+)",/gmi;
		var match;

		while ((match = regex.exec(dot)) !== null) {
			y_match = parseInt(match[3],10);

			// this will figure out where the bottom of the graph is in terms of a y-cord
			if (y_match > y) {
				y = y_match;
			}
			// each level in the graph is separated by 74, so if we divided by 74 we get what level the question is on
			graph[match[1].toString()] = Math.floor(y_match / 74) + 1;
		}

		// this is how many questions there are in total (longest path)
		y = Math.floor(y / 74) + 1;

		// go through each node and append the total number of questions so we have a final string we can use
		for (var node in graph) {
			if (graph.hasOwnProperty(node)) {
				graph[node] = graph[node] + ' of ' + y;
			}
		}		

		// now the graph is ordered from top to bottom and we can assign each qid to a 'level'
		callback(graph);
	});
};

/**
 * This gets called only when a finish button button is clicked. Run the logic (if any) for after the question is clicked, IGNORE ANY GOTO's
 *
 * @qid {string} The id of the question
 * @question {object} The data from the database regarding the qid we are going to output to the user
 * @data {object} The interview data
 * @master {object} All the answers collected so far
 * @fields {array} The answers to the question
 * @progress {array} The array of the order in which question are answered
 * @deliverables {array} The length of the array
 *
 */
exports.final = function (qid, question, data, master, fields, progress, deliverables) {
	"use strict";

	// this will return the question to build 
	var after_logic = logic(qid, question, data, 'after', master, [], false, progress, true);
	
	// put the question and the debug together
	var run_build = buildFinal(after_logic.vars, after_logic.debug.join(""), fields, deliverables);

	return {
		question: run_build.question,
		debug: run_build.debug,
		master: after_logic.vars, // this returns the new complete set of Master variables fore the interview
		progress: after_logic.progress,
		qid: run_build.question.qid
	};
};

/**
 * The final output question that the user sees
 *
 */
exports.done = function () {
	"use strict";

	var output = [];
	var debug = [];

	output.push('<div class="contents"><div class="top-corners"></div><div class="prompt">');
	output.push('<div class="text"><h1>Finished!</h1><br><p>The interview is now complete, and all documents have been processed successfully.</div>'); 
	output.push('</div>');
	output.push('<div class="bottom-corners"></div>');
	output.push('<div class="clear"></div>');
	output.push('</div>');
	output.push('</div>');

	return {
		question: {
			content: output.join("")
		},
		debug: "",
		progress: ""
	};
};

/**
 * Show the user all their saved interviews
 *
 * @saved {array} Array of objects containing all the interviews for a particular user that have been saved for a specific interviews
 *
 */
exports.saves = function (saved) {
	"use strict";

	var date;
	var output = [];

	if (saved.length === 0) {
		output.push('<div class="no-saves">You have no saved interviews.</div>');
	} else {
		output.push('<div id="partial-loading-msg">Loading Interview ... </div>');
		output.push('<table class="saved-interviews-table">');
		output.push('<thead>');
			output.push('<tr><th colspan="4">'+saved[0].interview.name.toUpperCase()+'</th></tr>');
				output.push('<th>Date Started</th>');
				output.push('<th>Note</th>');
				output.push('<th>Progress</th>');
				output.push('<th>Options</th>');
			output.push('</tr>');
		output.push('</thead>');
		output.push('<tbody>');

		for (var i = 0; i < saved.length; i+=1) {
			date = moment(saved[i].created);
			output.push('<tr>');
			output.push('<td>' + date.format("ddd, MMM Do YYYY, h:mm:ss a")  + '</td>');
			output.push('<td><div class="saved-i-t-note">' + saved[i].note + '</div></td>');

			if (saved[i].data.state.distance) {
				output.push('<td>' + saved[i].data.state.distance[saved[i].qid] + '</td>');
			} else {
				output.push('<td>n/a</td>');
			}

			output.push('<td><ul class="options-menu"><li id="partial-'+ saved[i].id +'" title="Continue this interview" class="edit partial-sav-int">Continue</li></td>');
			output.push('</td>');
			output.push('</tr>');
		}

		output.push('</tbody>');
		output.push('</table>');

	}
	return output.join("");
};

/**
 * This gets called when something in the interview goes wrong and we want to show the user an error message.
 *
 */
exports.error = function () {
	"use strict";

	var output = [];

	output.push('<div class="contents"><div class="prompt">'); 
	output.push('<div class="text"><h1>Oops!</h1><br><p>Sorry, but something seems to have gone wrong.</p></div>'); 
	output.push('</div>'); 
	output.push('<div class="clear"></div>');
	output.push('</div>'); 
	output.push('</div>');

	return {
		error: {
			content: output.join("")
		}
	};
};