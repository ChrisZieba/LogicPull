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

Editor.debug = (function () {

	"use strict";

	// this is the question that is currently being shown in the viewer
	// use it to edit a certain question when looking at the viewer
	var active_question = null;

	// local events
	var eventListeners = function () {

		var socket = Editor.socket.getSocket();

		socket.on('question', function (pack) {
			Editor.debug.addData(pack.data.debug);
			active_question = pack.qid;
		});	
	};

	return {
		init: function () {
			eventListeners();
		},

		getActiveQuestion: function () {
			return active_question;
		},

		// this is called when the preview is closed with a null 
		setActiveQuestion: function (id) {
			active_question = id;
		},

		buildDebug: function () {
			Editor.thumbnail.hideThumbnail();	
			$("#debug").html('');	
		},

		showDebug: function () {
			$("#debug").removeClass('none');	
		},

		hideDebug: function () {
			$("#debug").addClass('none');
		},

		addData: function (data) {
			var d = $("#debug");
			d.append(data);
			d.scrollTop(d.get(0).scrollHeight);
		}
	};
}());