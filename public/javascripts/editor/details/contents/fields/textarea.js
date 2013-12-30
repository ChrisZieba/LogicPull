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

Editor.details.contents.fields.textarea = (function () {

	"use strict";

	return {
		buildTextareaField: function (field, index) {
			var output = [];
			var type = "textarea";
			var common = Editor.details.contents.fields.common;
			
			output.push(common.fieldType(type));
			output.push(common.fieldName(field.name, index));
			output.push(common.fieldLabel(field.label, index));
			output.push(common.fieldDefault(field.def, index));
			output.push(common.fieldValidation(field.validation, type, index));

			return output.join('');	
		},

		defaultTextareaField: function () {
			return {
				"name": '',
				"label": '',
				"type": 'textarea',
				"def": null,
				"validation": {
					"required": 'no',
					"min_length" : null,
					"max_length": null
				}
			};
		}
	};
}());