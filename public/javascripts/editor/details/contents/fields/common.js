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

Editor.details.contents.fields.common = (function () {

	"use strict";

	// the array index value of the field
	var active_field = null;

	var eventListeners = function () {
		// listen for clicks on the list of fields (to open a fields contents)
		$(".field-item").live("click", function () {
			var index = $(this).data('field-index');	

			// if we click the currently active item just ignore it
			if (index !== active_field) {
				var qid = Editor.main.getCurrentQuestion();
				var type = questions[qid].fields[index].type;

				if (active_field !== null) {
					$("#cf-list").find("[data-field-index='" + active_field + "']").removeClass("active");
				}

				active_field = index;
				$(this).addClass("active");
				$('#field-item').html(Editor.details.contents.fields.common.field(qid, type, index));
			}
		});

		// When we leave a textbox, save the data.
		// We need this because some of the fields are added in later, plus its easier to save data this way
		$(".field-textbox").live("change", function (e) {

			var input = $(this).val().trim();
			var qid = Editor.main.getCurrentQuestion();
			var index = Editor.details.contents.fields.common.getActiveField();
			var field_id_type = $(this).data('field-textbox-id');	
			var list;

			// run the validation when a textbox changes, and save it if it passes
			switch (field_id_type) {
				case 'name':
					// if the input is valid, store it and change the input box, otherwise alert the user
					if (Editor.validation.check(input, ['required','variable'])) {
						questions[qid].fields[index].name = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].name);
						alert("This field is required.");
						e.preventDefault();
					}
					break;
				// A label is not required, but it must only be alphadash
				case 'label':
					if (Editor.validation.check(input, ['label'])) {
						questions[qid].fields[index].label = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].label);
						alert("Only letters and numbers are allowed.");
						e.preventDefault();
					}
					break;
				case 'default':
					if (Editor.validation.check(input, ['alphnum'])) {
						questions[qid].fields[index].def = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].def);
						alert("Only letter and numbers allowed.");
						e.preventDefault();
					}
					break;
				case 'default_date':
					if (Editor.validation.check(input, ['label'])) {
						questions[qid].fields[index].def = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].def);
						alert("The default only allows alphanumeric and some special characters like dash, and forward slash.");
						e.preventDefault();
					}
					break;
				case 'start':
					if (Editor.validation.check(input, ['required','integer'])) {
						questions[qid].fields[index].start = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].start);
						alert("Must be an integer.");
						e.preventDefault();
					}
					break;
				case 'end':
					if (Editor.validation.check(input, ['required','integer'])) {
						questions[qid].fields[index].end = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].end);
						alert("Must be an integer.");
						e.preventDefault();
					}
					break;
				case 'default_number':
					if (Editor.validation.check(input, ['number'])) {
						questions[qid].fields[index].def = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].def);
						alert("Number only.");
						e.preventDefault();
					}
					break;
				case 'default_textdropdown':
					if (Editor.validation.check(input, ['variable'])) {
						questions[qid].fields[index]['default'] = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].def);
						alert("Letters and numbers only. First character must be a letter.");
						e.preventDefault();
					}
					break;
				case 'less_than':
					if (Editor.validation.check(input, ['number'])) {
						questions[qid].fields[index].validation.less_than = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].validation.less_than);
						alert("Number only.");
						e.preventDefault();
					}
					break;
				case 'greater_than':
					if (Editor.validation.check(input, ['number'])) {
						questions[qid].fields[index].validation.greater_than = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].validation.greater_than);
						alert("Number only.");
						e.preventDefault();
					}
					break;
				case 'min_length':
					if (Editor.validation.check(input, ['integer'])) {
						questions[qid].fields[index].validation.min_length = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].validation.min_length);
						alert("The min length refers to the minimum number of characters the field must contain. This must be a whole number.");
						e.preventDefault();
					}
					break;
				case 'max_length':
					if (Editor.validation.check(input, ['integer'])) {
						questions[qid].fields[index].validation.max_length = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].validation.max_length);
						alert("The max length refers to the maximum number of characters the field must contain. This must be a whole number.");
						e.preventDefault();
					}
					break;
				case 'min_date':
					if (Editor.validation.check(input, ['date'])) {
						questions[qid].fields[index].validation.min_date = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].validation.min_date);
						alert("The date can only contain numbers and slashes.");
						e.preventDefault();
					}
					break;
				case 'max_date':
					if (Editor.validation.check(input, ['date'])) {
						questions[qid].fields[index].validation.max_date = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].validation.max_date);
						alert("The date can only contain numbers and slashes.");
						e.preventDefault();
					}
					break;
				case 'validate_message':
					if (Editor.validation.check(input, ['label'])) {
						questions[qid].fields[index].validation.message = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].fields[index].validation.message);
						alert("Only text, numbers, and a few special characters are allowed here.");
						e.preventDefault();
					}
					break;
			}

			// if the field is a name or label, we need to update the list on the left
			if (field_id_type === 'name' || field_id_type === 'label') {
				list = $('#cf-list');
				list.html(fieldsList(questions[qid].fields));
				list.find("[data-field-index='" + index + "']").addClass("active");
			}

			Editor.thumbnail.buildThumbnail(qid);
		});

		$(".cfia").live("click", function () {

			var qid = Editor.main.getCurrentQuestion();
			var cmd = $(this).data('field-cmd');
			var list, field, default_field, tmp, i, length; 
			
			if (cmd === 'add') {
				list = $('#cf-list');
				field = $('#field-item');
				default_field = Editor.details.contents.fields.common.defaultField('text');

				active_field = questions[qid].fields.push(default_field) - 1;

				//change the varname to have the qid in it
				questions[qid].fields[active_field].name = qid + '_'+ active_field;

				list.html(fieldsList(questions[qid].fields));	
				list.find("[data-field-index='" + active_field + "']").addClass("active");
				field.html(Editor.details.contents.fields.common.field(qid, 'text', active_field));

			} else if (cmd === 'remove') {
				if (active_field !== null) {
					tmp = questions[qid].fields;
					delete questions[qid].fields[active_field];
					active_field = null;
					questions[qid].fields = Editor.utils.rebuildArray(tmp);
					$('#cf-list').html(fieldsList(questions[qid].fields));	
					$('#field-item').html('');
				}
			} else if (cmd === 'up') {
				// make sure a field is active and it is within bounds, i.e not zero
				if (active_field !== null && active_field !== 0) {
					// TODO - logic to check if we are swapping with a deletes (undefined) array element
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[active_field];
					list = $('#cf-list');
					i = 1;

					questions[qid].fields[active_field] = questions[qid].fields[active_field - i];
					questions[qid].fields[active_field - i] = tmp;

					// update the display
					$('#cf-list').html(fieldsList(questions[qid].fields));	

					active_field = active_field - i;
					list.find("[data-field-index='" + active_field + "']").addClass("active");

					$('#field-item').html(Editor.details.contents.fields.common.field(qid, questions[qid].fields[active_field].type, active_field));
				}
			} else if (cmd === 'down') {
				// make sure a field is active and it is within bounds, ie not zero
				length = questions[qid].fields.length - 1;

				if (active_field !== null && active_field !== length) {
					// swap the array elements, so the active one gets moved up once
					tmp = questions[qid].fields[active_field];
					list = $('#cf-list');
					i = 1;

					questions[qid].fields[active_field] = questions[qid].fields[active_field + i];
					questions[qid].fields[active_field + i] = tmp;
					list.html(fieldsList(questions[qid].fields));	
					active_field = active_field + i;
					list.find("[data-field-index='" + active_field + "']").addClass("active");
					$('#field-item').html(Editor.details.contents.fields.common.field(qid, questions[qid].fields[active_field].type, active_field));
				}
			}

			Editor.thumbnail.buildThumbnail(qid);
		});

		// When the type dropdown changes.
		// 1. get the default field for the type changed to
		// 2. copy the name and label, and set everything else to default
		// 3. rebuild field
		$("#field-type-dd").live("change", function () {
			var qid = Editor.main.getCurrentQuestion();
			// the new type
			var type = $("#field-type-dd option:selected").text(); 
			var field = $('#field-item');
			var name = questions[qid].fields[active_field].name;
			var label = questions[qid].fields[active_field].label;
			var defaultField = Editor.details.contents.fields.common.defaultField(type);

			questions[qid].fields[active_field] = defaultField;
			questions[qid].fields[active_field].name = name;
			questions[qid].fields[active_field].label = label;
			field.html(Editor.details.contents.fields.common.field(qid, type, active_field));

			//reload the thumbnail
			Editor.thumbnail.buildThumbnail(qid);
		});

		// when a checkbox changed its value, change it in the questions object
		$(".field-validation-checkbox").live("change", function () {
			var qid = Editor.main.getCurrentQuestion();
			var index = $(this).data('field-index');	
			var field_id_type = $(this).data('field-checkbox-id');	

			//save the value to the questions object
			//TODO : validation
			if ($(this).is(":checked")) {
				questions[qid].fields[index].validation[field_id_type] = 'yes';
			} else {
				questions[qid].fields[index].validation[field_id_type] = 'no';
			}
			//reload the thumbnail
			Editor.thumbnail.buildThumbnail(qid);
		});
	};

	var fieldsList = function (fields_array) {
		var output = [];

		output.push('<ul>');

		for (var i = 0; i < fields_array.length; i+=1) {

			if (fields_array[i]) {
				output.push('<li data-field-index="' + i + '" class="field-item">');
				// some fields do not have labels
				if (fields_array[i].label) {
					output.push('<span>' + fields_array[i].label + ' </span><span class="a-label">(' + fields_array[i].name + ')</span>');
				} else {
					output.push('<span class="a-label">' + fields_array[i].name + '</span>');
				}
				output.push('</li>');
			}
		}

		output.push('</ul>');
		return output.join('');
	};

	return {
		init: function () {
			eventListeners();
			Editor.details.contents.fields.radio.init();
			Editor.details.contents.fields.checkbox.init();
			Editor.details.contents.fields.date.init();
			Editor.details.contents.fields.textDropdown.init();
		},

		fieldType: function (type) {
			var output = []; 
			var types = [
				'text', 
				'textarea', 
				'number', 
				'radio', 
				'date', 
				'checkbox', 
				'text_dropdown', 
				'number_dropdown'
			];

			output.push('<div class="field-property">');
			output.push('<div class="b-label">Type: </div>');	
			output.push('<select id="field-type-dd" class="large-dropdown">');

			for (var i = 0; i < types.length; i+=1) {
				if (types[i] === type) {
					output.push('<option selected="selected">' + types[i] + '</option>');
				} else {
					output.push('<option>' + types[i] + '</option>');
				} 
			}

			output.push('</select>');	
			output.push('</div>');	
			return output.join('');	
		},

		fieldName: function (name, index) {
			var output = [];

			output.push('<div class="field-property">');
			output.push('<div class="b-label">Name: </div>'); 
			output.push('<input type="text" value="' + name +'" class="field-textbox ac" data-field-textbox-id="name" data-field-index="' + index + '" />');
			output.push('</div>');
			return output.join('');		
		},

		fieldLabel: function (label, index) {
			var output = [];

			if ( !label) {
				label = '';
			}

			output.push('<div class="field-property">');
			output.push('<div class="b-label">Label: </div>');
			output.push('<input type="text" value="' + label +'" class="field-textbox ac" data-field-textbox-id="label" data-field-index="' + index + '" />');
			output.push('</div>');

			return output.join('');		
		},		

		fieldDefault: function (default_value, index) {
			var output = [];

			if ( ! default_value) {
				default_value = '';
			}

			output.push('<div class="field-property">');
			output.push('<div class="b-label">Default: </div>');
			output.push('<input type="text" value="' + default_value +'" class="field-textbox ac" data-field-textbox-id="default" data-field-index="' + index + '"/>');
			output.push('</div>');

			return output.join('');			
		},		

		fieldValidation: function (validation, type, index) {
			var output = [];
			var validations = Editor.details.contents.fields.common.defaultField(type);

			output.push('<div class="clear"></div>');
			output.push('<div class="field-validations">');

			for (var p in validations.validation) {
				if (validations.validation.hasOwnProperty(p)) {
					switch (p) {
						case 'required':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">Required: </div>');

							if (validation[p] === 'yes') {
								output.push('<input type="checkbox" checked="yes" class="field-validation-checkbox" data-field-checkbox-id="required" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="checkbox" class="field-validation-checkbox" data-field-checkbox-id="required" data-field-index="' + index + '" />');
							}

							output.push('</div>');
							break;
						case 'nota':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">None of the above: </div>');

							if (validation[p] === 'yes') {
								output.push('<input type="checkbox" checked="yes" class="field-validation-checkbox" data-field-checkbox-id="nota" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="checkbox" class="field-validation-checkbox" data-field-checkbox-id="nota" data-field-index="' + index + '" />');
							}

							output.push('</div>');
							break;
						case 'min_length':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">Minimun length: </div>');

							if (validation[p] !== null) {
								output.push('<input type="text" value="' + validation[p] + '" class="field-textbox ac" data-field-textbox-id="min_length" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="text" value="" class="field-textbox ac" data-field-textbox-id="min_length" data-field-index="' + index + '"/>');
							}

							output.push('</div>');
							break;
						case 'max_length':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">Maximum length: </div>');

							if (validation[p] !== null) {
								output.push('<input type="text" value="' + validation[p] + '" class="field-textbox ac" data-field-textbox-id="max_length" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="text" value="" class="field-textbox ac" data-field-textbox-id="max_length" data-field-index="' + index + '"/>');
							}

							output.push('</div>');
							break;
						case 'less_than':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">Less than: </div>');

							if (validation[p] !== null) {
								output.push('<input type="text" value="' + validation[p] + '" class="field-textbox ac" data-field-textbox-id="less_than" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="text" value="" class="field-textbox ac" data-field-textbox-id="less_than" data-field-index="' + index + '"/>');  
							}

							output.push('</div>');
							break;
						case 'greater_than':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">Greater than: </div>');

							if (validation[p] !== null) {
								output.push('<input type="text" value="' + validation[p] + '" class="field-textbox ac" data-field-textbox-id="greater_than" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="text" value="" class="field-textbox ac" data-field-textbox-id="greater_than" data-field-index="' + index + '"/>');  
							}

							output.push('</div>');
							break;
						case 'min_date':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">Minimum date: </div>');

							if (validation[p] !== null) {
								output.push('<input type="text" value="' + validation[p] + '" class="field-textbox ac" data-field-textbox-id="min_date" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="text" value="" class="field-textbox ac" data-field-textbox-id="min_date" data-field-index="' + index + '"/>');  
							}

							output.push('</div>');
							break;
						case 'max_date':
							output.push('<div class="field-validation">');
							output.push('<div class="b-label">Maximum date: </div>');

							if (validation[p] !== null) {
								output.push('<input type="text" value="' + validation[p] + '" class="field-textbox ac" data-field-textbox-id="max_date" data-field-index="' + index + '"/>');
							} else {
								output.push('<input type="text" value="" class="field-textbox ac" data-field-textbox-id="max_date" data-field-index="' + index + '"/>');  
							}

							output.push('</div>');
							break;
						default:
							break;
					}
				}
			}
			output.push('</div>');
			return output.join('');		
		},

		defaultField: function (type) {
			switch (type) {
				case 'text':
					return Editor.details.contents.fields.text.defaultTextField();
				case 'textarea':
					return Editor.details.contents.fields.textarea.defaultTextareaField();
				case 'number':
					return Editor.details.contents.fields.number.defaultNumberField();
				case 'radio':
					return Editor.details.contents.fields.radio.defaultRadioField();
				case 'date':
					return Editor.details.contents.fields.date.defaultDateField();
				case 'checkbox':
					return Editor.details.contents.fields.checkbox.defaultCheckboxField();
				case 'text_dropdown':
					return Editor.details.contents.fields.textDropdown.defaultTextDropdownField();
				case 'number_dropdown':
					return Editor.details.contents.fields.numberDropdown.defaultNumberDropdownField();
			}
		},


		buildFields: function (qid) {
			$('#cf-list').html(fieldsList(questions[qid].fields));
		},

		field: function (qid, type, index) {
			var output = '';
			var field = Editor.details.contents.fields;

			switch (type) {
				case 'text':
					output = field.text.buildTextField(questions[qid].fields[index], index);
					break;
				case 'textarea':
					output = field.textarea.buildTextareaField(questions[qid].fields[index], index);
					break;
				case 'number':
					output = field.number.buildNumberField(questions[qid].fields[index], index);
					break;
				case 'radio':
					output = field.radio.buildRadioField(questions[qid].fields[index], index);
					break;
				case 'date':
					output = field.date.buildDateField(questions[qid].fields[index], index);
					break;
				case 'checkbox':
					output = field.checkbox.buildCheckboxField(questions[qid].fields[index], index);
					break;
				case 'text_dropdown':
					output = field.textDropdown.buildTextDropdownField(questions[qid].fields[index], index);
					break;
				case 'number_dropdown':
					output = field.numberDropdown.buildNumberDropdownField(questions[qid].fields[index], index);
					break;
			}

			return output;
		},

		emptyFields: function (qid) {

			active_field = null;
			Editor.details.contents.fields.radio.setActiveRadioField(null);
			Editor.details.contents.fields.checkbox.setActiveCheckboxField(null);

			$('#cf-list').html('');
			$('#field-item').html('');
		},

		getActiveField: function () {
			return active_field;
		}
	};
}());