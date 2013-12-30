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

var Editor = Editor || {};

Editor.validation = (function () {
	"use strict";

	return {
		condition: function (input) {
			if (input.length !== 0) {
				return input.match(/^[a-zA-Z0-9_#%&!=+.?;<>|\,\$\:\[\]\'\"\-\/\)\(\*\s]*$/);
			} 
			return true;
		},

		// this checks that a date is entered in a format like mm/dd/yyyy, or -10y ...used when adding a validation for a date, like mindata
		date: function (input) {
			return true;
		},

		number: function (input) {
			// from the start of the string to the end, only contains number
			if (input.length !== 0) {
				return input.match(/^(?:[1-9]\d*|0)?(?:\.\d+)?$/);
			} 
			return true;
		},

		integer: function (input) {
			if (input.length !== 0) {
				return input.match(/^\d+$/);
			}

			return true;
		},

		alphanum: function (input) {
			// from the start of the string to the end, only contains letters, numbers and a few special characters
			if (input.length !== 0) {
				return input.match(/^[a-zA-ZA-ÿ0-9]+$/);
			} 
			return true;
		},

		// this is used mostly for labels
		label: function (input) { 
			// from the start of the string to the end, only contains letters, numbers and a few special characters
			if (input.length !== 0) {
				//return input.match(/^[a-zA-ZA-ÿ0-9,:._#'"?$\-%&\\\/\)\(\*\s]*$/);
				return input.match(/^[a-zA-ZA-ÿ0-9,:._#'"?$<>\-%&\\\/\)\(\*\s]*$/);
			} 
			return true;
		},

		alphadash: function (input) {
			// from the start of the string to the end, only contains letters, numbers and a few special characters
			if (input.length !== 0) {
				return input.match(/^[a-zA-ZA-ÿ\-]*$/);
			} 
			return true;
		},

		variable: function (input) {
			if (input.length !== 0) {
				return input.match(/^[a-zA-Z][a-zA-Z0-9_\[\]]+$/);
			} 
			return true;
		},

		required: function (input) {
			if (input.length === 0) {
				return false;
			}
			return true;
		},

		// @requirements is an array containing all the validation requirements
		// possible array elements are as follows:
		// required
		// textbox_integer : the value in the textbox has to be a integer
		// textbox_date: a valid date must be entered , ex. dd/mm/yyyy, or d/m/yyyy, works for m/d/yyyy as well
		// variable: make sure the input is a valid JavaScript variable name
		// textbox_alphanum: only alpha numeric character, including spaces
		check: function (input, requirements) {
			var val;
			
			// if the input is still valid after running through this loop, we return true
			for (var i = 0; i < requirements.length; i+=1) {
				// if the element is an object it must contain a value
				if (typeof requirements[i] === 'object') {
					if (Editor.validation[Object.keys(requirements[i])[0]]) {
						// this will get the value of the property without knowing its name
						val = requirements[i][Object.keys(requirements[i])[0]];

						// run the validation with the optional val input
						if ( ! Editor.validation[Object.keys(requirements[i])[0]](input, val)) {
							return false;
						}
					}
				} else {
					if (Editor.validation[requirements[i]]) {
						if ( ! Editor.validation[requirements[i]](input)) {
							return false;
						}
					}		
				}
			}

			// if we make it here the input is valid
			return true;
		}
	};
}());