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

Editor.socket = (function () {
	"use strict";

	var socket;
	var editor_id = null;

	return {
		init: function() {
			socket = io.connect(BASE_URL);
			socket.on('connect', function () {
				// when the client connects, send the server an id for the editor that will be shared with the preview
				editor_id = (Date.now() + (Math.floor(Math.random() * (100000)) + 2)).toString();
				// send the id back to the server and attach it to the client socket 
				socket.emit('editor_id', editor_id);
			});

			socket.on('connect_failed', function () {
				//window.location.href = '/basket/clear';
			});

			socket.on('disconnect', function () {
				//window.location.href = '/basket/clear';
			});
		},
		getEditorID: function () {
			return editor_id;
		},
		getSocket: function() {
			return socket;
		}
	};
}());