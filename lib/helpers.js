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

var esprima = require('esprima'),
	escodegen = require('escodegen'),
	vm = require('vm'),
	async = require('async'),
	func = require('./func'),
	graphviz = require('graphviz');

/**
 * Check the length of a values array. Returns 0 if not an array or not found.
 *
 * @name {string} The name of the variable we are checking
 * @master {object} All the answers collected so far
 * @nm {int} Used to add 1 for the debug display before the answer gets added to the master list
 *
 */
function length (name, master, nm) {
	"use strict";
	var len = 0;
	// if the name is not defined return 0
	if (master[name] ) {
		len = master[name].values[name].length-1 + nm;
	}
	
	return len.toString();
}

/**
 * Evaluates a raw expression in a VM
 *
 * @condition {array} The given expression we are going to evaluate
 * @vars {object} The variables collected so far during the interview
 * @type {string} Either 'condition' or 'value'. A condition will return true or false, but a value may return a value back.
 * @data {object} The interview object
 *
 */
function evaluate (condition, vars, type, data) {
	"use strict";

	var fn = {};
	var raw_condition, formatted_condition, esco, context, src;
	var var_names = []; 
	var var_values = [];

	// Attach all the common functions for the stylesheet and interview
	for (var fnCommon in func.common) {
		fn[fnCommon] = func.common[fnCommon];
	}

	// Attach all the functions for the interview
	for (var fnLocal in func.interview) {
		fn[fnLocal] = func.interview[fnLocal];
	}

	// the condition is parsed into a syntax tree
	try {
		raw_condition = JSON.stringify(esprima.parse(condition));
	} catch (e1) {
		// If there is an error parsing the condition return false to the interview
		return false;
	}

	// This gets the condition ready to be turned back into JavaScript. 
	// It goes through the generated syntax tree and pulls out the vars we need to evaluate the condition.
	// This also handles loop indexes, by storing the key so loop[hello], 
	// will put the value hello in the values array, and will also stringify then enter loop.
	formatted_condition = JSON.parse(raw_condition, function (key, value) {
		// This is substituting the actual value in the condition to evaluate.
		// Check to see if the name is a function name, if it is we do not 
		// want to pass it as a parameter to be evaluated by the VM.
		if (key === 'name' && !fn.hasOwnProperty(value)) {
			// This puts the name of the var into an array for input into the function that evaluates the condition.
			var_names.push(value); 

			if (vars[value] !== null && typeof vars[value] !== 'undefined') {
				// a checkbox has a stringified array, so don't re-stringify it 
				if (vars[value].type === 'checkbox') {
					// this passes an array of stringified arrays if in a loop
					var_values.push(JSON.stringify(vars[value].values[value]));  
				} else {
					// arrays are stringified and used just fine
					var_values.push(JSON.stringify(vars[value].values[value]));                   
				}
			} else {
				// this means this var is not yet defined in the interview
				var_values.push('null'); 
			}
		} 
		return value;
	});

	// this will format the condition back into JavaScript 
	try {
		esco = escodegen.generate(formatted_condition);
		esco = esco.replace(';','');
	} catch (e2) {
		return false;
	}

	// A condition will return true or false, but a value may return a value back
	switch (type) {
		case 'condition':
			src = '(function (' + var_names.join(",") + ') { if(' + esco + '){ result = true; } else { result = false; } return result; } )(' + var_values.join(",") + ')';
			break;
		case 'value':
			src = '(function (' + var_names.join(",") + ') { result = ' + esco + ';return result; } )(' + var_values.join(",") + ')';
			break;
	}

	// This attaches all the functions for use in the interview.
	// Any variables declared in the source, will be returned as a property of context.
	context = vm.createContext(fn); 

	// Run the code in a node virtual machine, and return the result
	try {
		vm.runInContext(src, context);
		return context.result;
	} catch (e3) {
		return false;
	} 
}


/**
 * Takes in the master object to add to, and the array of objects we are going to add to the master list.
 *
 * @master {array} The variables collected in the interview so far
 * @vars {array} An array of objects { qid,name,type,answer }, containing all the field/var data to merge
 * @loop {boolean} Is the question in a loop
 * @question {object} The question from the database
 *
 */
exports.merge = function (master, vars, loop, question) {
	"use strict";

	var data, k;
	var loop_name = question.loop1 || "";

	// this loops through the vars given
	for (var i = 0; i < vars.length; i+=1) {
		var qid = vars[i].qid;
		var name = vars[i].name;
		var type = vars[i].type;
		var section = vars[i].section;
		// if this is a checkbox, it will be an array
		var value = vars[i].answer;

		// This is the same as checking if the type is checkbox.
		// If it's an array, go through and check if each answer is a number, 
		// and parse it as if it is, otherwise leave it as a string.
		if (Array.isArray(value)) {
			for (var j = 0; j < value.length; j+=1) {
				// this just converts the number to an actual JavaScript Number
				value[j] = (type === 'number' || type === 'number_dropdown') ? exports.numberCheck(value[j]).value : value[j];
			}
			// store the value as a JSON string, so it doesn't get confused with arrays of loops
			value = JSON.stringify(value);
		} else {
			value = (type === 'number' || type === 'number_dropdown') ? exports.numberCheck(value).value : value;
		}        

		// Check if the var is defined yet (seen in the interview)
		if (master[name] !== null && typeof master[name] !== 'undefined') {  
			// If it's a loop, we push the answer onto the values array
			if (Array.isArray(master[name].values[name])) {
				if (master[name].values !== null && typeof master[name].values !== 'undefined') {
					// We need to check if any indexes have been missed (questions skipped over in a loop).
					// Check the loop_name value and compare it to the length of the array.
					k = master[name].values[name].length;

					// Check that the loop counter is defined.
					if (loop) {
						if (master[loop_name] !== null && typeof master[loop_name] !== 'undefined') {
							if (k < master[loop_name].values[loop_name]) {
								// pad with null
								// The reason for this is so when referencing array values they match up.
								while (k < master[loop_name].values[loop_name]) {
									master[name].values[name].push(null);
									k+=1;
								}
							}
						}
						master[name].values[name].push(value);
					} 
				}
			} else {
				// If its not a loop, we can just store the value.
				master[name].values[name] = value;
			}
		} else { 
			// This block should only get run once when the var has not been seen yet in the interview.
			master[name] = {
				qid: qid,
				loop: loop,
				loop_name: loop_name,
				name: name,
				section: section,
				type: type,
				values: {}
			};

			if (loop) {
				master[name].values[name] = [];

				k = master[name].values[name].length;

				// check that the loop counter is defined
				if (loop && (master[loop_name] !== null && typeof master[loop_name] !== 'undefined' && master[loop_name] !== '')) {
					if (k < master[loop_name].values[loop_name]) {
						// pad
						while (k < master[loop_name].values[loop_name]) {
							master[name].values[name].push(null);
							k+=1;
						}
					} 
					// if the field was a checkbox, this will be a stringified array
					master[name].values[name].push(value);
				} else if (loop) {
					// if no loop counter is defined then the array var was defined outside of a looped question
					// e.g tracker[outer] = 1
					// In this case we just push onto the array
					master[name].values[name].push(value);
				}
			} else {
				// if its not a loop, we can just store the value in it
				master[name].values[name] = value;
			}
		}
	}

	// this will return the new object we got as input, but with the new objects added onto it
	return master;

};

/**
 * Returns a number, or string, along with its type.
 *
 * @val {number}
 *
 */
exports.numberCheck = function (val) {
	"use strict";

	// default
	var type = 'text';

	// check if the input is valid, and not an empty string
	if (val !== null && typeof val !== 'undefined' && val !== '') {
		var isnum = /^(?:[1-9]\d*|0)?(?:\.\d+)?$/.test(val);
		// If the answer is a number (contains only digits) than parse the integer
		if (isnum) {
			val = parseFloat(val);
			type = 'number';
		}      
	}

	return {
		value: val,
		type: type
	};
};


 /**
 * This function will loop through the question text, and 
 * replace any occurrences of <% %> and replace whatever is inside with the corresponding variable.
 *
 * @text {string} The question text contents, which is in HTML
 * @vars {object} The variables collected so far
 * @data {object} The optional interview object from the database 
 *
 */
exports.parseText = function (text, vars, data) {
	"use strict";

	var re = /(?:&lt;|<)%(.+?)%(?:&gt;|>)/gmi,
		hre = /(?:&lt;|<)\[([a-zA-Z0-9_<>\n\=\?\:\?\+\-\%\s\/\'\"\,\.\(\)\[\]]+?):(.+?)\](?:&gt;|>)/gmi,
		yre = /(?:&lt;|<)\!([a-zA-Z0-9_<>\+\-\%\s\/\'\"\,\.\(\)\[\]]+?):([a-zA-Z0-9_<>\=\?\:\/\?\:\+\-\%\.\(\)\[\]]+?)\!(?:&gt;|>)/gmi;
	
	var answer, sub;

	data = data || null;
	text = text.toString();

	// for every match, evaluate whats in the braces
	text = text.replace(re, function (match, capture) {
		// this will evaluate the condition and return a single answer 
		answer = evaluate(capture, vars, 'value', data);
		// if nothing was returned, or there was an error evaluation the condition we return undefined
		if (answer !== null && typeof answer !== 'undefined') {
			sub = answer;
		} else {
			sub = 'undefined';
		}
		return sub;
	});

	// look for any help boxes
	text = text.replace(hre, function (match, identifier, hidden) {
		return '<div class="help-tooltip"><div class="display">' + identifier + '</div><div class="pointer"></div><div class="body">' + hidden + '</div></div>';
	});

	// look for any youtube videos
	text = text.replace(yre, function (match, identifier, hidden) {
		return '<div class="youtube-popout"><div class="display">' + identifier + '</div><div class="video-link"><a href="' + hidden + '">link</a></div></div>';
	});

	return text;
};


/**
 * Takes the fields (valid) and returns a string for debug purposes. If the user went back on a loop question, 
 * and than forward, the last values are popped off the array so we need to add one to the index so it appears correct.
 *
 * @fields {array} Array of objects containing the fields in a question; could be empty
 * @master {object} All the variables collected so far
 * @offset {int} the offset is used to keep the debug loop indexes correct. 
 *
 */
exports.parseFields = function (fields, master, offset) {
	"use strict";

	var output = [];
	var type, name;

	if (fields) {
		for (var i = 0; i < fields.length; i+=1) {

			name = fields[i].name;
			type = fields[i].type;

			if (master[name]) {
				// add quotes to strings
				if (Array.isArray(master[name].values[name])) {
					if (type === 'number' || type === 'number_dropdown') {
						output.push('<div class="dbug-field"><span class="bold">[' + fields[i].type + '] </span> ' + fields[i].name + '[' + length(name, master, offset) + '] = ' + fields[i].answer + '</div>');
					} else {
						output.push('<div class="dbug-field"><span class="bold">[' + fields[i].type + '] </span> ' + fields[i].name + '[' + length(name, master, offset) + '] = \"' + fields[i].answer + '\"</div>');
					}
				} else {
					if (type === 'number' || type === 'number_dropdown') {
						output.push('<div class="dbug-field"><span class="bold">[' + fields[i].type + '] </span> ' + fields[i].name + ' = ' + fields[i].answer + '</div>');
					} else {
						output.push('<div class="dbug-field"><span class="bold">[' + fields[i].type + '] </span> ' + fields[i].name + ' = \"' + fields[i].answer + '\"</div>');
					} 
					
				}
			}
		}
	}

	return output.join("");
};


/**
 * Remove any HTML fragments in a text string
 *
 * @text {string}
 *
 */
exports.removeHTML = function (text) {
	"use strict";

	if (text) {
		text = text.replace(/<(?:\.|\n)*?>/gm, ' ');
	}

	return text;
};


/**
 * Count how many times a qid appears in an array of objects.
 *
 * @qid {string} The question ID 
 * @progress {array} An array of objects of each question that has been visited so far
 *
 */
exports.loopIndex = function (qid, progress) {
	"use strict";

	var index = 0;

	for (var i = 0; i < progress.length; i+=1) {
		if (progress[i].qid === qid) {
			index+=1;
		}
	}
	return index;
};


/**
 * Check if a collected variable is part of a loop.
 *
 * @name {string} The name of the variable we are checking
 * @master {object} All the variables collected so far
 *
 */
exports.loopCheck = function (name, master) {
	"use strict";

	var loop = false;

	if (master[name]) {
		if (Array.isArray(master[name].values[name])) {
			loop = true;
		} 
	}

	return loop;
};


/**
 * Check the length of a values array.
 *
 * @name {string} The name of the variable we are checking
 * @master {object} All the variables collected so far
 * @nm {object} Optional index for checking the debug index
 *
 */
exports.getLength = function (name, master, nm) {
	"use strict";

	return length(name, master, nm);
};

/**
 * Returns an object containing information regarding the type of the variable, i.e., array, identifier.
 *
 * @src {string} A JavaScript expression
 *
 */
exports.checkVar = function (src) {
	"use strict";

	var raw, prog, name, value, type;
	var data = {
		name: null,
		elem: null,
		iden: false,
		type: null      
	};

	// this turns the condition into a syntax tree
	try {
		raw = esprima.parse(src);
		prog = raw.body[0].expression;

		if (prog.type === 'Identifier' && prog.name !== null && typeof prog.name !== 'undefined') {
			// this means the var name in the advanced section does not contain an array and is just a simple name
			data.name = prog.name;
			data.elem = null;
			data.type = "Identifier";
		} else if (prog.type === 'MemberExpression' && prog.computed && prog.object.type === "Identifier" && (prog.property.type === 'Identifier' || prog.property.type === 'Literal')) {
			data.name = prog.object.name;
			
			// if the element is a variable...like x[loop], otherwise it is like x[0]
			if (prog.property.type === 'Identifier') { 
				data.elem = prog.property.name;
				data.iden = true;
			} else {
				data.elem = prog.property.value;
				data.iden = false;
			}
			data.type = "Array";
		} 
		return data;
	} catch (e) {
		return data;
	}
};

/**
 * This function is used to repopulate a question when the back button is clicked.
 *
 * @name {string} The name of the field to retrieve the answer for
 * @fields {array} An array of objects containing the form data from the interview
 *
 */
exports.getAnswer = function (name, fields) {
	"use strict";

	var answer = "";

	for (var i = 0; i < fields.length; i+=1) {
		if (name === fields[i].name) {
			answer = fields[i].answer;
		}
	}
	return answer;
};


/**
 * This function is used to evaluate a raw JavaScript expression.
 *
 * @condition {string} The raw condition from the user
 * @vars {array} These are all the collected vars for the current interview
 * @type {string} Used to run different checks between a condition and just a value for a set
 * @data {object} The optional interview object from the database 
 *
 */
exports.evalCondition = function (condition, vars, type, data) {
	"use strict";

	return evaluate(condition, vars, type, data);
};