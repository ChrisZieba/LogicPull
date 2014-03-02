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

Editor.details.contents.fields.numberDropdown = (function () {

	"use strict";

	var fieldDefault = function (default_value, index) {
		var output = [];

		if ( !default_value) {
			default_value = '';
		}

		output.push('<div class="field-property">');
		output.push('<div class="b-label">Default: </div>');
		output.push('<input type="text" value="' + default_value.replace(/"/g, '&quot;') +'" class="field-textbox ac" data-field-textbox-id="default_number" data-field-index="' + index + '"/>');
		output.push('</div>');

		return output.join('');			
	};

	var fieldStart = function (start, index) {
		var output = [];

		output.push('<div class="field-property">');
		output.push('<div class="b-label">Start: </div>');
		output.push('<input type="text" value="' + start +'" class="field-textbox ac" data-field-textbox-id="start" data-field-index="' + index + '"/>');
		output.push('</div>');

		return output.join('');			
	};

	var fieldEnd = function (end, index) {
		var output = [];

		output.push('<div class="field-property">');
		output.push('<div class="b-label">End: </div>');
		output.push('<input type="text" value="' + end +'" class="field-textbox ac" data-field-textbox-id="end" data-field-index="' + index + '"/>');
		output.push('</div>');

		return output.join('');			
	};

	return {
		buildNumberDropdownField: function (field, index) {

			var output = [];
			var type = "number_dropdown";
			var common = Editor.details.contents.fields.common;
			
			output.push(common.fieldType(type));
			output.push(common.fieldName(field.name, index));
			output.push(common.fieldLabel(field.label, index));

			// use this default not the common one
			output.push(fieldDefault(field.def, index));
			output.push(fieldStart(field.start, index));
			output.push(fieldEnd(field.end, index));
			output.push(common.fieldValidation(field.validation, type, index));

			return output.join('');	
		},

		defaultNumberDropdownField: function () {
			return {
				"name": 'var',
				"label": '',
				"type": 'number_dropdown',
				"def": '',
				"start": 0,
				"end": 10,
				"validation": {
					"required": 'no'
				}
			};
		}
	};
}());