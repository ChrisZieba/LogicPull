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

// Global variable - less overhead to declare this as global, than use getters/setters everywhere. Just make sure it's loaded first.
var questions = {};

// The Editor Object
var Editor = Editor || {};
Editor.details = Editor.details || {};
Editor.details.contents = Editor.details.contents || {};
Editor.details.contents.fields = Editor.details.contents.fields || {};

window.onload = function() {
	Editor.socket.init();
	Editor.menu.init();
	Editor.graph.init();
	Editor.list.init();
	Editor.settings.init();
	Editor.interview.init();
	Editor.debug.init();
	Editor.details.manager.init();
	Editor.details.tabs.init();
	Editor.details.contents.question.init();
	Editor.details.contents.learnmore.init();
	Editor.details.contents.fields.common.init();
	Editor.details.contents.advanced.init();
	Editor.details.contents.buttons.init();
};

window.onbeforeunload = function() {
	var message = "Some data is not saved.";
	return null;
};