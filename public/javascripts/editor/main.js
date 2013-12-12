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

var Editor = Editor || {};

Editor.main = (function () {
	"use strict";

	// current and previous refer to the question details, and focus is one click on a question in the graph
	var current = null;
	var previous = null;
	// is the details pop out visible
	var details_status = false; 
	var step = null;
	var qcount = 0;
	var pcount = 0;
	// use this to store each question that gets added to the interview
	var qids = []; 
	// this is the main window...it starts on the graph, since we can have multiple windows open on top of each other its an array
	var ww = ['graph']; 

	return {			
		getCurrentQuestion: function () {
			// put the text into the question object
			return current;
		},	
		getPreviousQuestion: function () {
			return previous;
		},
		getQuestionCount: function() {
			return qcount;
		},		
		getPathCount: function () {
			return pcount;
		},	
		getDetailsStatus: function () {
			return details_status;
		},	
		openWindow: function (type) {
			var index = ww.indexOf(type);

			// check if the window is already open (if the type is in the array)
			if (index < 0) {
				ww.push(type);
			}
		},
		closeWindow: function (type) {
			var index = ww.indexOf(type);

			if (index >= 0) {
				// this removes the window from the stack no matter where it is in the array
				ww.splice(index,1);
			}
		},
		getWindow: function () {
			return ww;
		},
		setQuestionCount: function (id) {
			// the input is sometimes a string
			id = parseInt(id,10);
			
			// this puts the number id onto the array, so we have a list of all the nodes in the order they arrive
			var qid = 'q' + id;
			qids.push(qid);

			if (id > qcount) {
				qcount = id + 1; 
			} else {
				qcount+=1;
			}
		},
		setPathCount: function (pid) {
			// strip out the p, and use that number for pcount
			// if the number is greater than the current count, set it as the new count, otherwise just ignore it
			// This has to be don't because we could have the paths p2,p3 when we initialize the graph, and
			// after these paths are drawn in, the count would be 2, and we would end up overwriting p2

			// now we have the number
			pid = parseInt(pid.substr(1),10); 

			if (pid > pcount) {
				pcount = pid + 1;
			} else {
				pcount+=1;
			}
		},
		updateCurrentQuestion: function (qid) {
			if (previous === null) {
				previous = qid;
			} else {
				previous = current;
			}
			current = qid;	
		},
		updateDetailsStatus: function (bool) {
			details_status = bool;
		},
		getIDList: function () {
			return qids;
		},
		getLastID: function () {
			return qids[qids.length - 1];
		},

		removeIDFromList: function (qid) {
			var index = qids.indexOf(qid);

			if (index !== -1) {
				qids.splice(index, 1);
			}
		}
	};
}());