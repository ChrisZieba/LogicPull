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
Editor.details.contents.fields = Editor.details.contents.fields || {};

Editor.details.contents.fields.radio = (function () {

	"use strict";

	var active_radio_field = null;

	var eventListeners = function () {
		// listen for clicks on the list of radio values
		// 1. set the active class (highlight)
		// 2. open the radio block for editing he label and id
		$(".radio-field-value").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();

			if (active_radio_field !== null) {
				$("#radio-field-values").find("[data-radio-item-index='" + active_radio_field + "']").removeClass("active");
			}

			var field_index = Editor.details.contents.fields.common.getActiveField();
			var radio_index = $(this).data('radio-item-index');

			active_radio_field = radio_index;
			$(this).addClass("active");

			// hide the controls for add/del/up/down while working on a specific radio 
			// this is where we create the block for editing he radio value (label and its id)
			$('#radio-field-block').html(radioValue(questions[qid].fields[field_index].values[active_radio_field]));
		});

		$(".radio-field-textbox").live("change", function (e) {

			var input = $(this).val().trim();
			var qid = Editor.main.getCurrentQuestion();
			var index = Editor.details.contents.fields.common.getActiveField();
			var field_id_type = $(this).data('field-textbox-id');
			var radio_index, list;

			// run the validation when a textbox changes, and save it if it passes
			switch (field_id_type) {
				case 'radio_id':
					radio_index = Editor.details.contents.fields.radio.getActiveRadioField();

					if (Editor.validation.check(input, ['required','variable'])) {
						questions[qid].fields[index].values[radio_index].id = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].values[radio_index].id);
						alert("Letter and numbers only. The first character must be a letter.");
						e.preventDefault();
					}
					break;
				case 'radio_label':
					radio_index = Editor.details.contents.fields.radio.getActiveRadioField();
					
					if (Editor.validation.check(input, ['label'])) {
						questions[qid].fields[index].values[radio_index].label = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].values[radio_index].label);
						alert("Letter and numbers only.");
						e.preventDefault();
					}
					break;
			}

			//if the field is a radio name or label, we need to update the list
			if (field_id_type === 'radio_id' || field_id_type === 'radio_label') {
				list = $('#radio-field-values');
				list.html(radioValuesList(questions[qid].fields[index].values));
				list.find("[data-radio-item-index='" + active_radio_field + "']").addClass("active");
			}

			Editor.thumbnail.buildThumbnail(qid);

		});

		// listen for clicks on the remove button of the radio buttons
		$(".cfria").live("click", function () {

			var qid = Editor.main.getCurrentQuestion();
			var field_index = Editor.details.contents.fields.common.getActiveField();
			var cmd = $(this).data('r-field-cmd'), list, field, tmp, i, length, radio_item;

			if (cmd === 'add') {
				list = $('#radio-field-values');
				field = $('#field-item');
				radio_item = {
					"id": "rid",
					"label": "New Radio Label"
				};

				active_radio_field = questions[qid].fields[field_index].values.push(radio_item) - 1;
				list.html(radioValuesList(questions[qid].fields[field_index].values));	
				list.find("[data-radio-item-index='" + active_radio_field + "']").addClass("active");
				$('#radio-field-block').html(radioValue(questions[qid].fields[field_index].values[active_radio_field]));

			} else if (cmd === 'remove') {
				// only do something id one of the fields is highlighted
				if (active_radio_field !== null) {
					list = $('#radio-field-values');
					tmp = questions[qid].fields[field_index].values;

					delete questions[qid].fields[field_index].values[active_radio_field];
					questions[qid].fields[field_index].values = Editor.utils.rebuildArray(tmp);
					active_radio_field = null;
					list.html(radioValuesList(questions[qid].fields[field_index].values));
					$('#radio-field-block').html('');
				}
			} else if (cmd === 'up') {
				// make sure a field is active and it is within bounds, i.e not zero
				if (active_radio_field !== null && active_radio_field !== 0) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[field_index].values[active_radio_field];
					list = $('#radio-field-values');
					i = 1;

					questions[qid].fields[field_index].values[active_radio_field] = questions[qid].fields[field_index].values[active_radio_field - i];
					questions[qid].fields[field_index].values[active_radio_field - i] = tmp;

					// update the display
					list.html(radioValuesList(questions[qid].fields[field_index].values));	
					active_radio_field = active_radio_field - i;
					list.find("[data-radio-item-index='" + active_radio_field + "']").addClass("active");

				}
			} else if (cmd === 'down') {
				// make sure a field is active and it is within bounds, ie not zero
				length = questions[qid].fields[field_index].values.length - 1;

				if (active_radio_field !== null && active_radio_field !== length) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[field_index].values[active_radio_field];
					list = $('#radio-field-values');
					i = 1;

					questions[qid].fields[field_index].values[active_radio_field] = questions[qid].fields[field_index].values[active_radio_field + i];
					questions[qid].fields[field_index].values[active_radio_field + i] = tmp;
					list.html(radioValuesList(questions[qid].fields[field_index].values));	
					active_radio_field = active_radio_field + i;
					list.find("[data-radio-item-index='" + active_radio_field + "']").addClass("active");
				}
			}
			Editor.thumbnail.buildThumbnail(qid);
		});
	};

	var radioValue = function (value) {
		var output = [];

		output.push('<div class="field-radio-value-property">');
		output.push('<div class="d-label">ID: </div>');
		output.push('<input type="text" value="' + value.id +'" class="radio-field-textbox ae" data-field-textbox-id="radio_id" />');
		output.push('</div>');
		output.push('<div class="field-radio-value-property">');
		output.push('<div class="d-label">Label: </div>');
		output.push('<input type="text" value="' + value.label +'" class="radio-field-textbox ae" data-field-textbox-id="radio_label" />');
		output.push('</div>');

		return output.join('');		
	};

	var radioValuesList = function (values) {
		var output = [];

		for (var i = 0; i < values.length; i+=1) {
			if (values[i]) {
				output.push('<div data-radio-item-index="' + i + '" class="radio-field-value">');	
					output.push(values[i].label + ' (' + values[i].id + ')');
				output.push('</div>');
			}
		}

		return output.join('');		
	};

	// this builds the list of values below the validation
	var buildRadioValues = function (values) {
		var output = [];

		output.push('<div class="clear"></div>');
		output.push('<div class="c-label">Values: </div>');
		output.push('<div class="radio-field-values-container">');
		output.push('<div id="radio-field-values">');	
		output.push(radioValuesList(values));
		output.push('</div>');	
		output.push('<ul class="cf-r-list-controls">');
		output.push('<li data-r-field-cmd="add" class="add unselectable cfria">Add</li>');
		output.push('<li data-r-field-cmd="up" class="up unselectable cfria">Up</li>');
		output.push('<li data-r-field-cmd="down" class="down unselectable cfria">Down</li>');
		output.push('<li data-r-field-cmd="remove" class="remove unselectable cfria">Remove</li>'); 
		output.push('</ul>');
		// this is to load in the id and label of a selected radio field
		output.push('<div id="radio-field-block"></div>'); 
		output.push('</div>');

		return output.join('');	
	};

	return {
		init: function () {
			eventListeners();
		},

		buildRadioField: function (field, index) {
			var output = [];
			var type = "radio";
			var common = Editor.details.contents.fields.common;
			
			output.push(common.fieldType(type));
			output.push(common.fieldName(field.name, index));
			output.push(common.fieldLabel(field.label, index));
			output.push(common.fieldValidation(field.validation, type, index));

			// this is specific only to the radio fields
			output.push(buildRadioValues(field.values));

			return output.join('');	
		},

		defaultRadioField: function () {
			return {
				"name": 'var',
				"label": '',
				"type": 'radio',
				"def": null,
				"values": [{
					"id": "yes",
					"label": "Yes"
				},
				{
					"id": "no",
					"label": "No"						
				}],
				"validation": {
					"required": 'yes',
				}
			};
		},

		setActiveRadioField: function (active) {
			active_radio_field = active;
		},

		getActiveRadioField: function () {
			return active_radio_field;
		}
	};
}());