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

Editor.details.contents.fields.date = (function () {

	"use strict";

	var eventListeners = function () {
		$("#date-field-format-dd").live("change", function () {
			var field_index = Editor.details.contents.fields.common.getActiveField();
			var qid = Editor.main.getCurrentQuestion();
			var format = $("#date-field-format-dd option:selected").text();

			questions[qid].fields[field_index].format = format;
		});

		$("#validation-condition-textarea").live("change", function () {
			var field_index = Editor.details.contents.fields.common.getActiveField();
			var condition = $(this).val().trim(); 
			var qid = Editor.main.getCurrentQuestion();

			if (Editor.validation.check(condition, ['condition'])) {
				questions[qid].fields[field_index].validation.condition = condition;
				$(this).val(condition);
			} else {
				// put the old value back in
				$(this).val(questions[qid].fields[field_index].validation.condition);
				alert("This field is required.");
				e.preventDefault();
			}
		});
	};

	var fieldDefault = function (default_value, index) {
		var output = [];

		if ( !default_value) {
			default_value = '';
		}

		output.push('<div class="field-property">');
		output.push('<div class="b-label">Default: </div>');
		output.push('<input type="text" value="' + default_value.replace(/"/g, '&quot;') +'" class="field-textbox ac" data-field-textbox-id="default_date" data-field-index="' + index + '"/>');
		output.push('</div>');

		return output.join('');			
	};

	var fieldFormat = function (format, index) {
		var output = [];
		var formats = ['dd/mm/yy', 'mm/dd/yy'];

		output.push('<div class="field-property">');
		output.push('<div class="b-label">Format: </div>');	
		output.push('<select class="large-dropdown" id="date-field-format-dd">');

		for (var i = 0; i < formats.length; i+=1) {
			if (formats[i] === format) {
				output.push('<option selected="selected">' + formats[i] + '</option>');
			} else {
				output.push('<option>' + formats[i] + '</option>');
			} 
		}

		output.push('</select>');	
		output.push('</div>');	

		return output.join('');						
	};

	var fieldValidation = function (condition, message, index) {
		var output = [];

		condition = (typeof condition !== 'undefined' && condition !== null) ? condition : '';
		message = (typeof message !== 'undefined' && message !== null) ? message : '';

		output.push('<div class="field-property">');
		output.push('<div class="b-label">Condition: </div>');
		output.push('<textarea id="validation-condition-textarea" class="text-area-def-3">' + condition + '</textarea>');
		output.push('</div>');
		output.push('<div class="field-property">');
		output.push('<div class="b-label">Message: </div>');
		output.push('<input type="text" value="' + message.replace(/"/g, '&quot;') +'" class="field-textbox ac" data-field-textbox-id="validate_message" data-field-index="' + index + '"/>');
		output.push('</div>');

		return output.join('');					
	};

	return {

		init: function () {
			eventListeners();
		},

		buildDateField: function (field, index) {

			var output = [];
			var type = "date";
			var common = Editor.details.contents.fields.common;
			
			output.push(common.fieldType(type));
			output.push(common.fieldName(field.name, index));
			output.push(common.fieldLabel(field.label, index));
			output.push(common.fieldSize(field.size, index));
			output.push(common.fieldLine(field.line, index));
			output.push(fieldDefault(field.def, index));
			output.push(fieldFormat(field.format, index));
			output.push(common.fieldValidation(field.validation, type, index));
			output.push(fieldValidation(field.validation.condition, field.validation.message, index));

			return output.join('');	
		},

		defaultDateField: function () {

			return {
				"name": 'var',
				"label": '',
				"type": 'date',
				"def": '',
				"format": 'mm/dd/yy',
				"validation": {
					"required": 'no',
					//can also be -1y, -30d ...
					"min_date": '', 
					"max_date": '',
					// user defined conidtion
					"condition": '', 
					// the message
					"message": '' 
				}
			};
		}
	};
}());