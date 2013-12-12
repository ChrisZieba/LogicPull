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

// The Editor Object
var Editor = Editor || {};
Editor.details = Editor.details || {};
 
Editor.details.manager = (function () {

	"use strict";

	var eventListeners = function () {
		$("#q-d-close").live("click", function () {
			questionClose();
		});
	};

	var questionClose = function () {
		$('#q-d').addClass('none');
		Editor.main.updateDetailsStatus(false);
		Editor.main.closeWindow('question'); 
		Editor.menu.set();
		Editor.details.manager.emptyQuestionDetails();
	};

	return {
		init: function (qid) {
			eventListeners();
			Editor.details.manager.wysihtml5();
		},

		wysihtml5: function () {
			var question_text_editor = new wysihtml5.Editor("q-d-text-frame", {
				name: 'q-d-text-wysihtml5',
				toolbar: "q-d-text-toolbar",
				stylesheets: ["/stylesheets/wysihtml5-text.css"],
				// this is getting read in from the var in javascripts/plugins/wysihtml5-rules.js
				parserRules: wysihtml5ParserRulesText 
			});

			question_text_editor.on("blur", function () { 
				var qid = Editor.main.getCurrentQuestion();
				Editor.details.contents.question.saveQuestion(); 
				Editor.thumbnail.buildThumbnail(qid);
			});

			var learn_more_text_editor = new wysihtml5.Editor("q-d-lm-frame", {
				name: 'q-d-lm-wysihtml5',
				toolbar: "q-d-lm-toolbar",
				stylesheets: ["/stylesheets/wysihtml5-lm.css"],
				// this is getting read in from the var in javascripts/plugins/wysihtml5-rules.js
				parserRules: wysihtml5ParserRulesLM
			});

			learn_more_text_editor.on("blur", function () { 
				Editor.details.contents.learnmore.saveLearnmore(); 
			});
		},

		showQuestionDetails: function (qid) {
			// if there is a question open ,close it
			if (Editor.main.getDetailsStatus()) {
				Editor.details.manager.emptyQuestionDetails();
				$('#q-d').addClass('none');
				Editor.main.updateDetailsStatus(false);
				// we only want one question open at a time
				Editor.main.closeWindow('question'); 
			}

			// the reason i AM setting the first tab is active is because we want it to open to this question every time
			Editor.details.tabs.setDefaultTab();
			// only build the questions tab at first, and build each tab when it gets clicked on
			Editor.details.manager.buildTabContents('tab-1', qid);

			$('#q-d').removeClass('none'); // show the div for the question we double clicked

			Editor.main.updateCurrentQuestion(qid); 
			// this sets the details status to true
			Editor.main.updateDetailsStatus(true); 
			// show the correct menu
			Editor.main.openWindow('question');
			Editor.menu.set();
		},

		emptyQuestionDetails: function () {
			Editor.details.contents.question.emptyQuestion();
			Editor.details.contents.learnmore.emptyLearnmore();
			Editor.details.contents.fields.common.emptyFields();
			Editor.details.contents.buttons.emptyButtons();
			Editor.details.contents.advanced.emptyAdvanced();
		},

		// this gets called from the tabs module, when a new tab is clicked
		buildTabContents: function (tab, qid) {
			if (typeof qid === 'undefined' || qid === null) {
				qid = Editor.main.getCurrentQuestion();
			}

			switch (tab) {
				case 'tab-1':
					Editor.details.contents.question.buildQuestion(qid);
					break;
				case 'tab-2':
					Editor.details.contents.learnmore.buildLearnmore(qid);
					break;
				case 'tab-3':
					Editor.details.contents.fields.common.buildFields(qid);
					break;
				case 'tab-4':
					Editor.details.contents.buttons.buildButtons(qid);
					break;
				case 'tab-5':
					Editor.details.contents.advanced.buildAdvanced(qid);
					break;
			}
		},

		// this gets called from the tabs module, when a new tab is clicked, empty out the tab before it changes
		emptyTabContents: function (tab) {
			switch (tab) {
				case 'tab-1':
					Editor.details.contents.question.emptyQuestion();
					break;
				case 'tab-2':
					Editor.details.contents.learnmore.emptyLearnmore();
					break;
				case 'tab-3':
					Editor.details.contents.fields.common.emptyFields();
					break;
				case 'tab-4':
					Editor.details.contents.buttons.emptyButtons();
					break;
				case 'tab-5':
					Editor.details.contents.advanced.emptyAdvanced();
					break;
			}
		},

		closeQuestion: function () {
			questionClose();
		}
	};
}());