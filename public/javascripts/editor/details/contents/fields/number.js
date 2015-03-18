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

Editor.details.contents.fields.number = (function () {

	"use strict";

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

		buildNumberField: function (field, index) {
			var output = [];
			var type = "number";
			var common = Editor.details.contents.fields.common;
			
			output.push(common.fieldType(type));
			output.push(common.fieldName(field.name, index));
			output.push(common.fieldLabel(field.label, index));
			output.push(common.fieldSize(field.size, index));
			output.push(common.fieldLine(field.line, index));
			
			// use this default not the common one
			output.push(fieldDefault(field.def, index));
			output.push(common.fieldValidation(field.validation, type, index));

			return output.join('');	
		},

		defaultNumberField: function () {
			return {
				"name": 'var',
				"label": '',
				"type": 'number',
				"def": null,
				"validation": {
					"required": 'no',
					"less_than" : null,
					"greater_than": null
				}
			};
		}
	};
}());