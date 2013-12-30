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

// The Editor Object
var Editor = Editor || {};
Editor.details = Editor.details || {};
Editor.details.contents = Editor.details.contents || {};
Editor.details.contents.fields = Editor.details.contents.fields || {};

Editor.details.contents.fields.checkbox = (function () {

	"use strict";

	var active_checkbox_field = null;

	var eventListeners = function () {
		// listen for clicks on the list of checkbox values
		// 1. set the active class (highlight)
		// 2. open the radio block for editing he label and id
		$(".checkbox-field-value").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();

			if (active_checkbox_field !== null) {
				$("#checkbox-field-values").find("[data-checkbox-item-index='" + active_checkbox_field + "']").removeClass("active");
			}

			var field_index = Editor.details.contents.fields.common.getActiveField();
			var checkbox_index = $(this).data('checkbox-item-index');

			active_checkbox_field = checkbox_index;
			$(this).addClass("active");

			// this is where we create the block for editing he checkbox value (label and its id)
			$('#checkbox-field-block').html(checkboxValue(questions[qid].fields[field_index].values[active_checkbox_field]));
		});

		$(".checkbox-field-textbox").live("change", function (e) {
			var input = $(this).val().trim();
			var qid = Editor.main.getCurrentQuestion();
			var index = Editor.details.contents.fields.common.getActiveField();
			var field_id_type = $(this).data('field-textbox-id');
			var checkbox_index,	list;

			// run the validation when a textbox changes, and save it if it passes
			switch (field_id_type) {
				case 'checkbox_id':
					checkbox_index = Editor.details.contents.fields.checkbox.getActiveCheckboxField();

					if (Editor.validation.check(input, ['required','variable'])) {
						questions[qid].fields[index].values[checkbox_index].id = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].values[checkbox_index].id);
						alert("Did not pass validation.");
						e.preventDefault();
					}
					break;
				case 'checkbox_label':
					checkbox_index = Editor.details.contents.fields.checkbox.getActiveCheckboxField();
					
					if (Editor.validation.check(input, ['label'])) {
						questions[qid].fields[index].values[checkbox_index].label = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].values[checkbox_index].label);
						alert("Did not pass validation!");
						e.preventDefault();
					}
					break;
			}

			// if the field is a checkbox name or label, we need to update the list
			if (field_id_type === 'checkbox_id' || field_id_type === 'checkbox_label') {
				list = $('#checkbox-field-values');
				list.html(checkboxValuesList(questions[qid].fields[index].values));
				list.find("[data-checkbox-item-index='" + active_checkbox_field + "']").addClass("active");
			}

			Editor.thumbnail.buildThumbnail(qid);
		});

		// listen for clicks on the remove button of the checkbox buttons
		$(".cfcia").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();
			var field_index = Editor.details.contents.fields.common.getActiveField();
			var cmd = $(this).data('c-field-cmd');
			var list, field, tmp, checkbox_item, i, length;


			if (cmd === 'add') {
				list = $('#checkbox-field-values');
				field = $('#field-item');
				checkbox_item = {
					"id": "rid",
					"label": "New checkbox Label"
				};

				active_checkbox_field = questions[qid].fields[field_index].values.push(checkbox_item) - 1;
				list.html(checkboxValuesList(questions[qid].fields[field_index].values));	
				list.find("[data-checkbox-item-index='" + active_checkbox_field + "']").addClass("active");
				$('#checkbox-field-block').html(checkboxValue(questions[qid].fields[field_index].values[active_checkbox_field]));

			} else if (cmd === 'remove') {
				// only do something id one of the fields is highlighted
				if (active_checkbox_field !== null) {

					list = $('#checkbox-field-values');
					tmp = questions[qid].fields[field_index].values;

					delete questions[qid].fields[field_index].values[active_checkbox_field];

					// take out the undefined and/or nulls from the array
					active_checkbox_field = null;
					questions[qid].fields[field_index].values = Editor.utils.rebuildArray(tmp);

					list.html(checkboxValuesList(questions[qid].fields[field_index].values));
					$('#checkbox-field-block').html('');
				}
			} else if (cmd === 'up') {
				// make sure a field is active and it is within bounds, i.e not zero
				if (active_checkbox_field !== null && active_checkbox_field !== 0) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[field_index].values[active_checkbox_field];
					list = $('#checkbox-field-values');
					i = 1;

					// swap
					questions[qid].fields[field_index].values[active_checkbox_field] = questions[qid].fields[field_index].values[active_checkbox_field - i];
					questions[qid].fields[field_index].values[active_checkbox_field - i] = tmp;

					// update the display
					list.html(checkboxValuesList(questions[qid].fields[field_index].values));	
					active_checkbox_field = active_checkbox_field - i;
					list.find("[data-checkbox-item-index='" + active_checkbox_field + "']").addClass("active");
				}
			} else if (cmd === 'down') {
				// make sure a field is active and it is within bounds, ie not zero
				length = questions[qid].fields[field_index].values.length - 1;

				if (active_checkbox_field !== null && active_checkbox_field !== length ) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[field_index].values[active_checkbox_field];
					list = $('#checkbox-field-values');
					i = 1;

					questions[qid].fields[field_index].values[active_checkbox_field] = questions[qid].fields[field_index].values[active_checkbox_field + i];
					questions[qid].fields[field_index].values[active_checkbox_field + i] = tmp;
					list.html(checkboxValuesList(questions[qid].fields[field_index].values));	
					active_checkbox_field = active_checkbox_field + i;
					list.find("[data-checkbox-item-index='" + active_checkbox_field + "']").addClass("active");
				}
			}
			Editor.thumbnail.buildThumbnail(qid);
		});
	};

	// Create an input box to collect a checkbox value
	var checkboxValue = function (value) {
		var output = [];

		output.push('<div class="field-checkbox-value-property">');
		output.push('<div class="d-label">ID: </div>');
		output.push('<input type="text" value="' + value.id +'" class="checkbox-field-textbox ae" data-field-textbox-id="checkbox_id" />');
		output.push('</div>');
		output.push('<div class="field-checkbox-value-property">');
		output.push('<div class="d-label">Label: </div>');
		output.push('<input type="text" value="' + value.label +'" class="checkbox-field-textbox ae" data-field-textbox-id="checkbox_label" />');
		output.push('</div>');

		return output.join('');		
	};

	var checkboxValuesList = function (values) {
		var output = [];

		for (var i = 0; i < values.length; i+=1) {
			if (values[i]) {
				output.push('<div data-checkbox-item-index="' + i + '" class="checkbox-field-value">');	
				output.push(values[i].label);
				output.push('</div>');
			}
		}

		return output.join('');		
	};

	// this builds the list of values below the validation
	var buildCheckboxValues = function (values) {
		var output = [];

		output.push('<div class="clear"></div>');
		output.push('<div class="c-label">Values: </div>');
		output.push('<div class="checkbox-field-values-container">');
		output.push('<div id="checkbox-field-values">');	
		output.push(checkboxValuesList(values));
		output.push('</div>');	
		output.push('<ul class="cf-c-list-controls">');
		output.push('<li data-c-field-cmd="add" class="add unselectable cfcia">Add</li>');
		output.push('<li data-c-field-cmd="up" class="up unselectable cfcia">Up</li>');
		output.push('<li data-c-field-cmd="down" class="down unselectable cfcia">Down</li>');
		output.push('<li data-c-field-cmd="remove" class="remove unselectable cfcia">Remove</li>');
		output.push('</ul>');
		// this is to load in the id and label of a selected checkbox field
		output.push('<div id="checkbox-field-block"></div>'); 
		output.push('</div>'); 

		return output.join('');	
	};

	return {

		init: function () {
			eventListeners();
		},

		buildCheckboxField: function (field, index) {

			var output = [];
			var type = "checkbox";
			var common = Editor.details.contents.fields.common;
			
			output.push(common.fieldType(type));
			output.push(common.fieldName(field.name, index));
			output.push(common.fieldLabel(field.label, index));
			output.push(common.fieldValidation(field.validation, type, index));

			// this is specific only to the checkbox fields
			output.push(buildCheckboxValues(field.values));

			return output.join('');	
		},

		defaultCheckboxField: function () {

			return {
				"name": 'var',
				"label": '',
				"type": 'checkbox',
				"values": [{
					"id": "c1",
					"label": "Checkbox 1"
				},
				{
					"id": "c2",
					"label": "Checkbox 2"						
				}],
				"validation": {
					"nota": 'no'
				}
			};
		},

		setActiveCheckboxField: function (active) {
			active_checkbox_field = active;
		},

		getActiveCheckboxField: function () {
			return active_checkbox_field;
		}
	};
}());