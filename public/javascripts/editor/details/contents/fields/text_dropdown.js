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

Editor.details.contents.fields.textDropdown = (function () {

	"use strict";

	var active_textdropdown_field = null;

	var eventListeners = function () {
		// listen for clicks on the list of text dropdown values
		// 1. set the active class (highlight)
		// 2. open the radio block for editing he label and id
		$(".textdropdown-field-value").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();

			if (active_textdropdown_field !== null) {
				$("#textdropdown-field-values").find("[data-textdropdown-item-index='" + active_textdropdown_field + "']").removeClass("active");
			}

			var field_index = Editor.details.contents.fields.common.getActiveField();
			var textdropdown_index = $(this).data('textdropdown-item-index');
			active_textdropdown_field = textdropdown_index;
			$(this).addClass("active");

			// hide the controls for add/del/up/down while working on a specific text dropdown 
			// this is where we create the block for editing the text dropdown value (label and its id)
			$('#textdropdown-field-block').html(textDropdownValue(questions[qid].fields[field_index].values[active_textdropdown_field]));
		});

		$(".textdropdown-field-textbox").live("change", function (e) {
			var input = $(this).val().trim();
			var qid = Editor.main.getCurrentQuestion();
			var index = Editor.details.contents.fields.common.getActiveField();
			var field_id_type = $(this).data('field-textbox-id');
			var textdropdown_index, list;

			// run the validation when a textbox changes, and save it if it passes
			switch (field_id_type) {
				case 'textdropdown_id':
					textdropdown_index = Editor.details.contents.fields.textDropdown.getActiveTextDropdownField();

					if (Editor.validation.check(input, ['required','variable'])) {
						questions[qid].fields[index].values[textdropdown_index].id = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].values[textdropdown_index].id);
						alert("Letter and numbers only. The first character must be a letter.");
						e.preventDefault();
					}
					break;
				case 'textdropdown_label':
					textdropdown_index = Editor.details.contents.fields.textDropdown.getActiveTextDropdownField();
					
					if (Editor.validation.check(input, ['label'])) {
						questions[qid].fields[index].values[textdropdown_index].label = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].values[textdropdown_index].label);
						alert("Letter and numbers only.");
						e.preventDefault();
					}
					break;
			}

			//if the field is a text dropdown name or label, we need to update the list
			if (field_id_type === 'textdropdown_id' || field_id_type === 'textdropdown_label') {
				list = $('#textdropdown-field-values');
				list.html(textDropdownValuesList(questions[qid].fields[index].values));
				list.find("[data-textdropdown-item-index='" + active_textdropdown_field + "']").addClass("active");
			}

		});

		// listen for clicks on the remove button of the text dropdown buttons
		$(".cftdia").live("click", function () {
			var qid = Editor.main.getCurrentQuestion();
			var field_index = Editor.details.contents.fields.common.getActiveField();
			var list, field, textdropdown_item, tmp, i, length; 
			var cmd = $(this).data('td-field-cmd');

			if (cmd === 'add') {
				list = $('#textdropdown-field-values');
				field = $('#field-item');
				textdropdown_item = {
					"id": "rid",
					"label": "New text dropdown Label"
				};

				active_textdropdown_field = questions[qid].fields[field_index].values.push(textdropdown_item) - 1;

				list.html(textDropdownValuesList(questions[qid].fields[field_index].values));	
				list.find("[data-textdropdown-item-index='" + active_textdropdown_field + "']").addClass("active");
				$('#textdropdown-field-block').html(textDropdownValue(questions[qid].fields[field_index].values[active_textdropdown_field]));

			} else if (cmd === 'remove') {
				// only do something id one of the fields is highlighted
				if (active_textdropdown_field !== null) {
					list = $('#textdropdown-field-values');
					tmp = questions[qid].fields[field_index].values;

					delete questions[qid].fields[field_index].values[active_textdropdown_field];
					// take out the undefined and/or nulls from the array
					active_textdropdown_field = null;
					questions[qid].fields[field_index].values = Editor.utils.rebuildArray(tmp);

					list.html(textDropdownValuesList(questions[qid].fields[field_index].values));
					$('#textdropdown-field-block').html('');
				}
			} else if (cmd === 'up') {
				// make sure a field is active and it is within bounds, ie not zero
				if (active_textdropdown_field !== null && active_textdropdown_field !== 0) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[field_index].values[active_textdropdown_field];
					list = $('#textdropdown-field-values');
					i = 1;

					// swap
					questions[qid].fields[field_index].values[active_textdropdown_field] = questions[qid].fields[field_index].values[active_textdropdown_field - i];
					questions[qid].fields[field_index].values[active_textdropdown_field - i] = tmp;

					// update the display
					list.html(textDropdownValuesList(questions[qid].fields[field_index].values));	
					active_textdropdown_field = active_textdropdown_field - i;
					list.find("[data-textdropdown-item-index='" + active_textdropdown_field + "']").addClass("active");

				}
			} else if (cmd === 'down') {
				// make sure a field is active and it is within bounds, ie not zero
				length = questions[qid].fields[field_index].values.length - 1;

				if (active_textdropdown_field !== null && active_textdropdown_field !== length ) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[field_index].values[active_textdropdown_field];
					list = $('#textdropdown-field-values');
					i = 1;

					questions[qid].fields[field_index].values[active_textdropdown_field] = questions[qid].fields[field_index].values[active_textdropdown_field + i];
					questions[qid].fields[field_index].values[active_textdropdown_field + i] = tmp;

					list.html(textDropdownValuesList(questions[qid].fields[field_index].values));	
					active_textdropdown_field = active_textdropdown_field + i;
					list.find("[data-textdropdown-item-index='" + active_textdropdown_field + "']").addClass("active");
				}
			}
		});
	};

	var textDropdownValue = function (value) {
		var output = [];

		output.push('<div class="field-textdropdown-value-property">');
		output.push('<div class="d-label">ID: </div>');
		output.push('<input type="text" value="' + value.id +'" class="textdropdown-field-textbox ae" data-field-textbox-id="textdropdown_id" />');
		output.push('</div>');
		output.push('<div class="field-textdropdown-value-property">');
		output.push('<div class="d-label">Label: </div>');
		output.push('<input type="text" value="' + value.label +'" class="textdropdown-field-textbox ae" data-field-textbox-id="textdropdown_label" />');
		output.push('</div>');

		return output.join('');		
	};

	var textDropdownValuesList = function (values) {
		var output = [];

		for (var i = 0; i < values.length; i+=1) {
			if (values[i]) {
				output.push('<div data-textdropdown-item-index="' + i + '" class="textdropdown-field-value">');	
					output.push(values[i].label);
				output.push('</div>');
			}
		}

		return output.join('');		
	};

	// this builds the list of values below the validation
	var buildTextDropdownValues = function (values) {
		var output = [];

		output.push('<div class="clear"></div>');
		output.push('<div class="c-label">Values: </div>');
		output.push('<div class="textdropdown-field-values-container">');
		output.push('<div id="textdropdown-field-values">');	
		output.push(textDropdownValuesList(values));
		output.push('</div>');	
		output.push('<ul class="cf-td-list-controls">');
		output.push('<li data-td-field-cmd="add" class="add unselectable cftdia">Add</li>');
		output.push('<li data-td-field-cmd="up" class="up unselectable cftdia">Up</li>');
		output.push('<li data-td-field-cmd="down" class="down unselectable cftdia">Down</li>');
		output.push('<li data-td-field-cmd="remove" class="remove unselectable cftdia">Remove</li>');
		output.push('</ul>');
		// this is to load in the id and label of a selected text dropdown field
		output.push('<div id="textdropdown-field-block"></div>'); 
		output.push('</div>');

		return output.join('');	
	};

	var fieldDefault = function (default_value, index) {
		var output = [];

		if ( !default_value) {
			default_value = '';
		}

		output.push('<div class="field-property">');
		output.push('<div class="b-label">Default: </div>');
		output.push('<input type="text" value="' + default_value +'" class="field-textbox ac" data-field-textbox-id="default" data-field-index="' + index + '"/>');
		output.push('</div>');

		return output.join('');			
	};

	return {

		init: function () {
			eventListeners();
		},

		buildTextDropdownField: function (field, index) {
			var output = [];
			var type = "text_dropdown";
			var common = Editor.details.contents.fields.common;
			
			output.push(common.fieldType(type));
			output.push(common.fieldName(field.name, index));
			output.push(common.fieldLabel(field.label, index));
			output.push(common.fieldDefault(field.def, index));
			output.push(common.fieldValidation(field.validation, type, index));
			// this is specific only to the text dropdown fields
			output.push(buildTextDropdownValues(field.values));

			return output.join('');	
		},

		defaultTextDropdownField: function () {
			return {
				"name": 'var',
				"label": '',
				"type": 'text_dropdown',
				"def": '',
				"values": [{
					"id": "di1",
					"label": "Dropdown Item 1"
				},
				{
					"id": "di2",
					"label": "Dropdown Item 2"						
				}],
				"validation": {
					"required": 'yes',
				}
			};
		},

		setActiveTextDropdownField: function (active) {
			active_textdropdown_field = active;
		},

		getActiveTextDropdownField: function () {
			return active_textdropdown_field;
		}
	};
}());