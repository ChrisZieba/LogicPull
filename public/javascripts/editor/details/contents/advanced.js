/*  Copyright 2013 Chris Zieba <zieba.chris@gmail.com>

    This program is free software: you can redistribute it and/or modify it under the terms of the GNU
    Affero General Public License as published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.
    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
    PURPOSE. See the GNU Affero General Public License for more details. You should have received a
    copy of the GNU Affero General Public License along with this program. If not, see
    <http://www.gnu.org/licenses/>.
*/

// The Editor Object
var Editor = Editor || {};
Editor.details = Editor.details || {};
Editor.details.contents = Editor.details.contents || {};

Editor.details.contents.advanced = (function () {

	"use strict";

	var active_advanced = null;
	var active_advanced_action = null;

	var eventListeners = function () {
		$(".advanced-item").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();
			var index = $(this).data('advanced-index');	

			// if we click the currently active item just ignore it
			if (index !== active_advanced) {
				if (active_advanced !== null) {
					$("#ca-list").find("[data-advanced-index='" + active_advanced + "']").removeClass("active");
				}

				active_advanced = index;
				$(this).addClass("active");
				$('#advanced-item').html(buildAdvancedBlock(questions[qid].advanced[index], index));
			}
		});	

		// listen for clicks on the list items inside the actions list
		$(".action-advanced-value").live("click", function () {
			var qid = Editor.main.getCurrentQuestion(),action_index;

			if (active_advanced_action !== null) {
				$("#advanced-actions-list").find("[data-action-item-index='" + active_advanced_action + "']").removeClass("active");
			}

			action_index = $(this).data('action-item-index');
			active_advanced_action = action_index;
			$(this).addClass("active");

			$('#advanced-action-block').html(advancedAction(questions[qid].advanced[active_advanced].actions[active_advanced_action], active_advanced_action));

			Editor.thumbnail.buildThumbnail(qid);
		});

		// when the action goto changes for 'goto'
		$("#advanced-event-dd").live("change", function () {
			var qid = Editor.main.getCurrentQuestion();
			// this is the value that gets selected in the drop down
			var event = $(this).val();

			questions[qid].advanced[active_advanced].event = event;
			var list = $('#ca-list');
			list.html(createAdvancedList(questions[qid].advanced));
			list.find("[data-advanced-index='" + active_advanced + "']").addClass("active");
			Editor.thumbnail.buildThumbnail(qid);
		});

		// when the action goto changes for 'goto'
		$("#action-goto-destination-dd").live("change", function () {
			var qid = Editor.main.getCurrentQuestion();
			// get the current destination
			var old_destination = questions[qid].advanced[active_advanced].actions[active_advanced_action].value;
			// this is the value that gets selected in the drop down
			var new_destination = $(this).val();
			// this is where the path originates
			var source = qid;
			// the pid is stored in the data of the select 
			var pid = $(this).data('action-goto-pid'); 

			Editor.graph.changePathDestination(pid, source, new_destination, old_destination);
			questions[qid].advanced[active_advanced].actions[active_advanced_action].value = new_destination;
			Editor.thumbnail.buildThumbnail(qid);
		});

		$(".caia").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();
			var cmd = $(this).data('button-cmd');
			var i, list, actions, pid, tmp, length;

			if (cmd === 'add') {
				list = $('#ca-list');
				// the active one is the last on the array
				active_advanced = (questions[qid].advanced.push({
					"event": 'after',
					"condition": 'true',
					"actions": [
						{
							'if': true,
							'action': 'goto',
							'name': null,
							'value': 'none',
							'pid': null

						}
					]
				})) - 1;

				list.html(createAdvancedList(questions[qid].advanced));
				list.find("[data-advanced-index='" + active_advanced + "']").addClass("active");
				$('#advanced-item').html(buildAdvancedBlock(questions[qid].advanced[active_advanced], active_advanced));

			} else if (cmd === 'remove') {
				if (active_advanced !== null) {
					// go through each action and delete the path...if it is not null
					actions = questions[qid].advanced[active_advanced].actions;

					for (i = 0; i < actions.length; i+=1) {
						if (actions[i]) {
							pid = actions[i].pid;
							if (pid) {
								Editor.graph.deletePath(qid, pid);
							}
						}
					}

					tmp = questions[qid].advanced;
					delete questions[qid].advanced[active_advanced];
					active_advanced = null;
					questions[qid].advanced = Editor.utils.rebuildArray(tmp);
					$('#ca-list').html(createAdvancedList(questions[qid].advanced));	
					$('#advanced-item').html('');
				}
			} else if (cmd === 'up') {
				if (active_advanced !== null && active_advanced !== 0) {
					// TODO - logic to check if we are swapping with a deletes (undefined) array element
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].advanced[active_advanced];
					list = $('#ca-list');
					i = 1;

					questions[qid].advanced[active_advanced] = questions[qid].advanced[active_advanced - i];
					questions[qid].advanced[active_advanced - i] = tmp;

					// update the display
					list.html(createAdvancedList(questions[qid].advanced));	
					active_advanced = active_advanced - i;
					list.find("[data-advanced-index='" + active_advanced + "']").addClass("active");
				}
			} else if (cmd === 'down') {
				// make sure a field is active and it is within bounds, i.e not zero
				length = questions[qid].advanced.length - 1;

				if (active_advanced !== null && active_advanced !== length) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].advanced[active_advanced];
					list = $('#ca-list');
					i = 1;

					questions[qid].advanced[active_advanced] = questions[qid].advanced[active_advanced + i];
					questions[qid].advanced[active_advanced + i] = tmp;
					list.html(createAdvancedList(questions[qid].advanced));	
					active_advanced = active_advanced + i;
					list.find("[data-advanced-index='" + active_advanced + "']").addClass("active");
				}
			}

			Editor.thumbnail.buildThumbnail(qid);
		});

		// listen when the menu for a action in the advanced section is clicked
		$(".caaia").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();
			var list, advanced, action_item, tmp, pid, i, length; 
			var cmd = $(this).data('a-advanced-cmd');

			if (cmd === 'add') {
				list = $('#advanced-actions-list');	
				advanced = $('#advanced-item');
				action_item = {
					'if': true,
					'action': 'goto',
					'name': null,
					'value': 'none',
					'pid': null
				};

				// this gets the index of the array of the newly added action
				active_advanced_action = questions[qid].advanced[active_advanced].actions.push(action_item) - 1;
				// build the actions list, passing in the actions array along with the array index of the advanced block we are currently working in
				list.html(advancedActionList(questions[qid].advanced[active_advanced].actions));	
				// set the active class to the newly added active_advanced_action
				list.find("[data-action-item-index='" + active_advanced_action + "']").addClass("active");
				$('#advanced-action-block').html(advancedAction(questions[qid].advanced[active_advanced].actions[active_advanced_action], active_advanced_action));
			} else if (cmd === 'remove') {
				// only do something id one of the advanced is highlighted
				if (active_advanced_action !== null) {

					list = $('#advanced-actions-list');
					tmp = questions[qid].advanced[active_advanced].actions;
					pid = questions[qid].advanced[active_advanced].actions[active_advanced_action].pid;

					delete questions[qid].advanced[active_advanced].actions[active_advanced_action];
					questions[qid].advanced[active_advanced].actions = Editor.utils.rebuildArray(tmp);
					active_advanced_action = null;
					list.html(advancedActionList(questions[qid].advanced[active_advanced].actions));
					$('#advanced-action-block').html('');

					if (pid) {
						Editor.graph.deletePath(qid, pid);
					}
				}
			} else if (cmd === 'up') {
				// make sure a field is active and it is within bounds, ie not zero
				if (active_advanced_action !== null && active_advanced_action !== 0) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].advanced[active_advanced].actions[active_advanced_action];
					list = $('#advanced-actions-list');	
					i = 1;

					questions[qid].advanced[active_advanced].actions[active_advanced_action] = questions[qid].advanced[active_advanced].actions[active_advanced_action - i];
					questions[qid].advanced[active_advanced].actions[active_advanced_action - i] = tmp;

					// update the display
					list.html(advancedActionList(questions[qid].advanced[active_advanced].actions));
					active_advanced_action = active_advanced_action - i;
					list.find("[data-action-item-index='" + active_advanced_action + "']").addClass("active");

				}
			} else if (cmd === 'down') {
				// make sure a field is active and it is within bounds, ie not zero
				length = questions[qid].advanced[active_advanced].actions.length - 1;

				if (active_advanced_action !== null && active_advanced_action !== length) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].advanced[active_advanced].actions[active_advanced_action];
					list = $('#advanced-actions-list');	
					i = 1;

					questions[qid].advanced[active_advanced].actions[active_advanced_action] = questions[qid].advanced[active_advanced].actions[active_advanced_action + i];
					questions[qid].advanced[active_advanced].actions[active_advanced_action + i] = tmp;

					list.html(advancedActionList(questions[qid].advanced[active_advanced].actions));
					active_advanced_action = active_advanced_action + i;
					list.find("[data-action-item-index='" + active_advanced_action + "']").addClass("active");
				}
			}
			Editor.thumbnail.buildThumbnail(qid);
		});

		$("#advanced-condition-textarea").live("change", function (e) {
			var condition = $(this).val().trim();
			var list; 
			var qid = Editor.main.getCurrentQuestion();

			if (Editor.validation.check(condition, ['condition'])) {
				questions[qid].advanced[active_advanced].condition = condition;
				$(this).val(condition);
				list = $('#ca-list');
				list.html(createAdvancedList(questions[qid].advanced));
				list.find("[data-advanced-index='" + active_advanced + "']").addClass("active");
			} else {
				// put the old value back in
				$(this).val(questions[qid].advanced[active_advanced].condition);
				alert("This field is required.");
				e.preventDefault();
			}

			Editor.thumbnail.buildThumbnail(qid);
		});

		$("#advanced-action-value-textarea").live("change", function (e) {
			var value = $(this).val().trim();
			var list;
			var qid = Editor.main.getCurrentQuestion();

			if (Editor.validation.check(value, ['condition'])) {
				questions[qid].advanced[active_advanced].actions[active_advanced_action].value = value;
				$(this).val(value);

				// redraw the list
				list = $('#advanced-actions-list');	
				list.html(advancedActionList(questions[qid].advanced[active_advanced].actions));
				list.find("[data-action-item-index='" + active_advanced_action + "']").addClass("active");
			} else {
				// put the old value back in
				$(this).val(questions[qid].advanced[active_advanced].actions[active_advanced_action].value);
				alert("This field is required\n\n\n");
				e.preventDefault();
			}
			Editor.thumbnail.buildThumbnail(qid);
		});

		$(".advanced-action-dd").live("change", function (e) {
			// this is the value that gets selected in the drop down
			var x = $(this).val(); 
			var cmd = $(this).data('advanced-action-dd'); 
			var qid = Editor.main.getCurrentQuestion();
			var acif, pid, old, path, new_pid, list;

			switch (cmd) {
				case 'if':
					if (x === 'true') {
						acif = true;
					} else {
						acif = false;
					}
					questions[qid].advanced[active_advanced].actions[active_advanced_action].if = acif;
					break;
				case 'action':
					// when we switch to set/goto we need to wither add/remove the textarea and add/remove the stop down
					if (x === 'set') {
						pid = questions[qid].advanced[active_advanced].actions[active_advanced_action].pid;
						if (pid) {
							Editor.graph.deletePath(qid, pid);
						}
						questions[qid].advanced[active_advanced].actions[active_advanced_action].name = qid + '_';
						questions[qid].advanced[active_advanced].actions[active_advanced_action].value = '';
						questions[qid].advanced[active_advanced].actions[active_advanced_action].pid = null;
						$('#advanced-action-action').html(advancedActionName(questions[qid].advanced[active_advanced].actions[active_advanced_action].name));
						$('#advanced-action-value').html(advancedActionValue(questions[qid].advanced[active_advanced].actions[active_advanced_action].value));

					} else { // we changed to goto
						questions[qid].advanced[active_advanced].actions[active_advanced_action].name = null;
						questions[qid].advanced[active_advanced].actions[active_advanced_action].value = 'none';
						questions[qid].advanced[active_advanced].actions[active_advanced_action].pid = null;
						$('#advanced-action-action').html(advancedActionAction(qid, questions[qid].advanced[active_advanced].actions[active_advanced_action]));
						$('#advanced-action-value').html('');
					}
					questions[qid].advanced[active_advanced].actions[active_advanced_action].action = x;
					break;
				case 'value':
					pid = questions[qid].advanced[active_advanced].actions[active_advanced_action].pid;
					old = questions[qid].advanced[active_advanced].actions[active_advanced_action].value;
					// if there is no pid assigned we need to create a new path, but if a pid 
					// is assigned than we just need to change the existing one
					// if we switch to none then we want to delete the path
					if (x !== 'none') {
						if (pid) {
							questions[qid].advanced[active_advanced].actions[active_advanced_action].value = x;
							Editor.graph.changePathDestination(pid, qid, x, old);
						} else {
							path = {
								"s": qid,
								"d": x,
								"stroke": '#A2122F',
								"stroke_width": "3"
							};

							new_pid = Editor.graph.addPath(path);
							questions[qid].advanced[active_advanced].actions[active_advanced_action].value = x;
							questions[qid].advanced[active_advanced].actions[active_advanced_action].pid = new_pid;
						}
					} else {
						// delete the corresponding path
						Editor.graph.deletePath(qid, pid);
						questions[qid].advanced[active_advanced].actions[active_advanced_action].value = 'none';
						questions[qid].advanced[active_advanced].actions[active_advanced_action].pid = null;
					}
					break;
			}

			// redraw the list
			list = $('#advanced-actions-list');	
			list.html(advancedActionList(questions[qid].advanced[active_advanced].actions));
			list.find("[data-action-item-index='" + active_advanced_action + "']").addClass("active");
			Editor.thumbnail.buildThumbnail(qid);
		});

		// when we leave a textbox, save the data - we need this because some of the fields are added in later, plus its easier to save data this way
		$(".action-name-textbox").live("change", function (e) {
			var input = $(this).val().trim();
			var list;
			var qid = Editor.main.getCurrentQuestion();

			if (Editor.validation.check(input, ['variable'])) {
				questions[qid].advanced[active_advanced].actions[active_advanced_action].name = input;
				$(this).val(input);
				// redraw the list
				list = $('#advanced-actions-list');	
				list.html(advancedActionList(questions[qid].advanced[active_advanced].actions));
				list.find("[data-action-item-index='" + active_advanced_action + "']").addClass("active");
			} else {
				// put the old value back in
				$(this).val(questions[qid].advanced[active_advanced].actions[active_advanced_action].name);
				alert("action name value");
				e.preventDefault();
			}
			Editor.thumbnail.buildThumbnail(qid);
		});
	};

	var createAdvancedList = function (advanced_array) {
		var output = [];

		output.push('<ul>');

		for (var i = 0; i < advanced_array.length; i+=1) {
			if (advanced_array[i]) {
				output.push('<li data-advanced-index="' + i + '" class="advanced-item">');
				output.push('<span class="bold">[' + advanced_array[i].event + '] </span>');
				if (advanced_array[i].condition) {
					output.push('<span>' + advanced_array[i].condition + '</span>');
				} else {
					output.push('<span>null</span>');
				}
				output.push('</li>');
			}
		}
		output.push('</ul>');
		return output.join('');
	};

	var advancedEvent = function (event, index) {
		var output = [];
		var events = ['before', 'after'];

		output.push('<div class="advanced-property">');
		output.push('<div class="b-label">Event: </div>');
		output.push('<select class="large-dropdown" id="advanced-event-dd">');

		for (var i = 0; i < events.length; i+=1) {
			if (events[i] === event) {
				output.push('<option selected="selected">' + events[i] + '</option>');
			} else {
				output.push('<option>' + events[i] + '</option>');
			} 
		}

		output.push('</select>');
		output.push('</div>');	
		return output.join('');		
	};

	var advancedCondition = function (condition) {
		var output = [];

		output.push('<div class="advanced-property">');
		output.push('<div class="b-label">Condition: </div>');
		output.push('<textarea id="advanced-condition-textarea" class="text-area-def">' + condition + '</textarea>');
		output.push('</div>');

		return output.join('');	
	};

	var advancedAction = function (action_item, index) {
		var output = [];
		var qid = Editor.main.getCurrentQuestion();
		var bif = ['true', 'false'];
		var actions = ['set', 'goto'];
		var val;

		output.push('<div class="advanced-action-value-property">');
		output.push('<div class="e-label">IF: </div>');
		output.push('<div class="advanced-action-d-container">');
		output.push('<select class="fair-dropdown advanced-action-dd" data-advanced-action-dd="if">');

		for (var i = 0; i < bif.length; i+=1) {
			val = (bif[i] === "true");

			if (val === action_item.if) {
				output.push('<option selected="selected">' + bif[i] + '</option>');
			} else {
				output.push('<option>' + bif[i] + '</option>');
			} 
		}

		output.push('</select>');	
		output.push('</div>');
		output.push('<div class="advanced-action-d-container">');
		output.push('<select class="fair-dropdown advanced-action-dd" data-advanced-action-dd="action">');

		for (var j = 0; j < actions.length; j+=1) {
			if (actions[j] === action_item.action) {
				output.push('<option selected="selected">' + actions[j] + '</option>');
			} else {
				output.push('<option>' + actions[j] + '</option>');
			} 
		}

		output.push('</select>');	
		output.push('</div>');	
		
		if (action_item.action === 'goto') {
			output.push('<div class="advanced-action-e-container" id="advanced-action-action">');
			output.push(advancedActionAction(qid, action_item));
			// advanced-actiopn-action id
			output.push('</div>'); 
			// close off the advanced-action-value-property div
			output.push('</div>');	
			output.push('<div id="advanced-action-value"></div>');
		} else {
			output.push('<div class="advanced-action-e-container" id="advanced-action-action">');
			output.push(advancedActionName(action_item.name));
			output.push('</div>'); // advanced-actiopn-action id
			output.push('</div>');	// close off the advanced-action-value-property div
			output.push('<div id="advanced-action-value">');
			output.push(advancedActionValue(action_item.value));
			output.push('</div>');
		}
		
		return output.join('');		
	};

	var advancedActionAction = function (qid, action_item) {
		var output = [];
		
		qid = Editor.main.getCurrentQuestion();
			
		output.push('<select class="medium-dropdown advanced-action-dd" data-advanced-action-dd="value"><option>none</option>');
		
		for (var prop in questions) {
			if (questions.hasOwnProperty(prop)) {
				// make sure the current question in the drop list 
				if (questions[prop].qid !== qid) {
					if (questions[prop].qid === action_item.value) {
						output.push('<option selected="selected">' + questions[prop].qid + '</option>');
					} else {
						output.push('<option>' + questions[prop].qid + '</option>');
					}
				}
			}
		}

		output.push('</select>');	

		return output.join('');		
	};

	var advancedActionName = function (name) {
		var output = [];
		output.push('<input type="text" class="ah action-name-textbox" value="' + name + '" />');

		return output.join('');		
	};

	var advancedActionValue = function (value) {
		var output = [];
		output.push('<textarea id="advanced-action-value-textarea" class="text-area-def-2">' + value + '</textarea>');

		return output.join('');		
	};

	var advancedActionList = function (actions) {

		var output = [];

		for (var i = 0; i < actions.length; i+=1) {
			if (actions[i]) {
				if (actions[i].action === 'goto') {
					output.push('<div data-action-item-index="' + i + '" class="action-advanced-value">IF <span class="bold">' + actions[i].if  + '</span> <span class="uppercase">' + actions[i].action + '</span> <span class="bold">' + actions[i].value + '</span></div>');
				} else {
					output.push('<div data-action-item-index="' + i + '" class="action-advanced-value">IF <span class="bold">' + actions[i].if  + '</span> <span class="uppercase">' + actions[i].action + '</span> <span class="bold">' + actions[i].name + '</span> TO <span class="bold">' + actions[i].value + '</span></div>');
				}
			}
		}

		return output.join('');		
	};

	var buildActionsList = function (actions, index) {
		var output = [];

		output.push('<div class="clear"></div>');
		output.push('<div class="c-label">Actions: </div>');
		output.push('<div class="advanced-actions-list-container">');
		output.push('<div id="advanced-actions-list">');	
		// put the radio values in
		output.push(advancedActionList(actions));
		output.push('</div>');	
		output.push('<ul class="ca-a-list-controls">');
		output.push('<li data-a-advanced-cmd="add" class="add unselectable caaia">Add</li>');
		output.push('<li data-a-advanced-cmd="up" class="up unselectable caaia">Up</li>');
		output.push('<li data-a-advanced-cmd="down" class="down unselectable caaia">Down</li>');
		output.push('<li data-a-advanced-cmd="remove" class="remove unselectable caaia">Remove</li>');
		output.push('</ul>');
		output.push('<div id="advanced-action-block"></div>');
		output.push('</div>');

		return output.join('');	
	};

	// This is the entire right side item..containing all the data for a logic block (i.e. actions, condition, logic)
	var buildAdvancedBlock = function (advanced, index) {
		var output = [];

		output.push(advancedEvent(advanced.event, index)); 
		output.push(advancedCondition(advanced.condition, index));
		output.push(buildActionsList(advanced.actions, index));

		return output.join('');	
	};	

	return {
		init: function () {
			eventListeners();
		},

		buildAdvanced: function (qid) {
			$('#ca-list').html(createAdvancedList(questions[qid].advanced));
		},

		// this is used when a tab changes away from the buttons tab, so we can 'reset' it
		emptyAdvanced: function () {
			active_advanced = null;
			active_advanced_action = null;

			$('#advanced-item').html('');
			$('#ca-list').html('');
		},

		// Go through each advanced logic action, and check if the destination is the one we are removing, if it is, change it to none
		// @dqid is the question that is the source of the path to the question we are deleting
		// @qid is the question we are deleting
		removeOldRefs: function (dqid, qid) {
			for (var j = 0; j < questions[dqid].advanced.length; j+=1) {
				if (questions[dqid].advanced[j].actions !== null && typeof questions[dqid].advanced[j].actions !== 'undefined') {
					for (var k = 0; k < questions[dqid].advanced[j].actions.length; k+=1) {
						if (questions[dqid].advanced[j].actions[k].action === 'goto' && questions[dqid].advanced[j].actions[k].value === qid) {
							questions[dqid].advanced[j].actions[k].value = 'none';
							questions[dqid].advanced[j].actions[k].pid = null;
						}
					}
				}
			}
		}
	};
}());