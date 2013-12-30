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

Editor.interview = (function () {

	"use strict";

	var eventListeners = function () {
		var socket = Editor.socket.getSocket();

		socket.on('graph', function (data) {

			var qid;

			// the nodes need to be drawn first, because the paths are bases on their positions
			for (qid in data) {
				if (data.hasOwnProperty(qid)) {
					Editor.graph.moveNode(qid, data[qid].x, data[qid].y);
				}
			}
			// read above comment for why this loop is run again
			for (qid in data) {
				if (data.hasOwnProperty(qid)) {
					Editor.graph.movePaths(qid);
				}
			}

			$('#container').scrollLeft(0).scrollTop(0);
		});	

		socket.on('saved', function (data) {
			$('.nf-pnd').remove();
			// this is when the user does not have privileges to save an interview in the editor 
			if (!data) {
				alert('Saving is currently disabled. All changes have been discarded.');
			}
		});	

		// Dom listeners
		$("#m-preview-close").live("click", function () {
			previewClose();
		});
	};

	var previewClose = function () {
		$('#w-preview').html('');
		$('#m-preview').addClass('none');

		Editor.debug.hideDebug();
		// this makes sure the edit-q button on the menu will pull the right question if we reopen the preview
		Editor.debug.setActiveQuestion(null);
		Editor.thumbnail.showThumbnail();
		// this updates the menu
		Editor.main.closeWindow('preview'); 
		Editor.menu.set();
	}; 

	// show the notification that the interview is saving and then save it
	var saveInterview = function () {
		var socket = Editor.socket.getSocket();
		var interview = {
			id: Editor.settings.getID(), 
			data: questions,
			settings: Editor.settings.get()
		};

		$("body").prepend('<div class="nf-pnd">Saving ...</div>');
		// push the changes to the server
		socket.emit('save', interview);
	};

	return {
		init: function () {
			eventListeners();
		},

		// @qid is an optional parameter, that is used to start an interview at a specific question
		// if qid is not entered, he defined start will be used for where to begin the interview
		preview: function (qid) {
			var preview = $("#w-preview");
			// the interview id number is an integer
			var id = Editor.settings.getID();
			var editor_id = Editor.socket.getEditorID();

			saveInterview();

			if (qid !== null && typeof qid !== 'undefined') {
				preview.html('<iframe src="/manager/interview/' + id + '/stage?preview=true&id='+ editor_id +'&start=' + qid + '"></iframe>');
			} else {
				preview.html('<iframe src="/manager/interview/' + id + '/stage?preview=true&id='+ editor_id +'"></iframe>');
			}

			Editor.thumbnail.hideThumbnail();
			Editor.debug.buildDebug();
			Editor.debug.showDebug();
			$("#m-preview").removeClass('none');	
			Editor.main.openWindow('preview');
			Editor.menu.set();		
		},

		graph: function () {
			var socket = Editor.socket.getSocket();
			var graph = Editor.graph.orderGraph();
			socket.emit('graph', graph);
		},

		save: function () {
			saveInterview();
		},

		closePreview: function () {
			previewClose();
		}
	};
}());