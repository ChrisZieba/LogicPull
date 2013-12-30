/*	Copyright 2014 Chris Zieba <zieba.chris@gmail.com>

	This program is free software: you can redistribute it and/or modify it under the terms of the GNU
	Affero General Public License as published by the Free Software Foundation, either version 3 of the
	License, or (at your option) any later version.
	This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
	without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
	PURPOSE. See the GNU Affero General Public License for more details. You should have received a
	copy of the GNU Affero General Public License along with this program. If not, see
	<http://www.gnu.org/licenses/>.
*/

/**
 * Given an array of objects, and an object property value, return the array index which has the value.
 *
 * @prop {string} The property we want to match
 * @value {string} Needle
 * @arr {string} Haystack
 *
 */
exports.findIndex = function (prop, value, arr) {
	"use strict";

	for (var i = 0; i < arr.length; i+=1) {
		if (arr[i] !== null && typeof arr[i] !== 'undefined') {
			if (arr[i][prop] === value) {
				return i;
			}
		}
	}

	return -1;
};

/**
 * Deep Copy all the elements and properties of an object
 *
 * @object {object} The object to copy
 *
 */
exports.deepCopy = function (obj) {
	"use strict";

	var out = [];
	var ret = {};

	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			var val = obj[key];

			if (Object.prototype.toString.call(val) === '[object Array]') {
				for (var i = 0; i < val.length; i+=1) {
					out[i] = val[i];
				}
				ret[key] = out;

			} else if (typeof val === 'object' && val !== null) {
				ret[key] = exports.deepCopy(val);
			} else {
				ret[key] = val;
				
			}
		}
	}

	return ret;
};

/**
 * Parse a Cookie
 *
 * @str {string} The string to parse
 *
 */
exports.parseCookie = function(str) {
	"use strict";

	var obj = {},
		pairs = str.split(/[;,] */),
		encode = encodeURIComponent,
		decode = decodeURIComponent;

	pairs.forEach(function(pair) {
		var eq_idx = pair.indexOf('='),
			key = pair.substr(0, eq_idx).trim(),
			val = pair.substr(eq_idx+=1, pair.length).trim();

		// quoted values
		if ('"' === val[0]) {
			val = val.slice(1, -1);
		}

		// only assign once
		if (typeof obj[key] === 'undefined') {
			obj[key] = decode(val);
		}
	});

	return obj;
};


/**
 * Depth First Search
 *
 * @qid {string} The question ID
 * @questions {object} Contains the data for each question
 * @visited {array} The nodes visited so far
 *
 */
exports.dfs = function (qid, questions, visited) {
	"use strict";

	var node, edges;

	visited.push(qid);
	
	if (questions[qid].source_paths) {
		edges = questions[qid].source_paths;
	}

	// first sort out all of the edges
	if (edges) {
		for (var j = 0; j < edges.length; j+=1) {
			if (edges[j]) { 
				// since deleted paths remain in the array as undefined this needs a check
				if (visited.indexOf(edges[j].d) === -1) { // if a node has NOT been visited
					exports.dfs(edges[j].d, questions, visited);
				}               
			}
		}
	}

	return visited;
};