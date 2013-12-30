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

Editor.details.contents.question = (function () {

	"use strict";

	var eventListeners = function () {

		$("#q-d-step").live("change", function () {
			var qid = Editor.main.getCurrentQuestion();
			var step = $("#q-d-step option:selected").text();

			questions[qid].step = step;
			//refresh the side list item
			Editor.list.orderList(null, qid);
		});

		// when we leave a textbox, save the data
		$(".question-textbox").live("change", function () {

			var input = $(this).val().trim();
			var qid = Editor.main.getCurrentQuestion();
			var type = $(this).data('question-textbox-id');

			// run the validation when a textbox changes, and save it if it passes
			switch (type) {
				case 'name':
					// if the input is valid, store it and change the input box, otherwise alert the user
					if (Editor.validation.check(input, ['label'])) {
						questions[qid].name = input;
						// update the textbox
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].name);
						alert("This field allows only spaces, letters, numbers, #, $, -, %, &, *, /, \\, (, )");
					}
					break;
				case 'loop1':
					// if the input is valid, store it and change the input box, otherwise alert the user
					if (Editor.validation.check(input, ['variable'])) {
						questions[qid].loop1 = input;
						$(this).val(input);
					} else {
						// put the old value back in
						$(this).val(questions[qid].loop1);
						alert("This field can only contain letters, numbers, and underscores. The first character must be a letter.");
					}
					break;
			}

			// if the field is a name, we need to update the list on the left
			if (type === 'name') {
				Editor.list.orderList(null, qid);
			}

			Editor.thumbnail.buildThumbnail(qid);
		});
	};

	// put together the steps dropdown
	var buildStep = function (qid) {
		var output = [];
		var steps = Editor.settings.getSteps();

		output.push('<select id="q-d-step" class="large-dropdown"><option>none</option>');

		for (var i = 0; i < steps.length; i+=1) {
			if (steps[i]) {
				if (steps[i] === questions[qid].step) {
					output.push('<option selected="selected">' + steps[i] + '</option>');
				} else {
					output.push('<option>' + steps[i] + '</option>');
				} 
			}
		}

		output.push('</select>');

		return output.join('');	
	};

	return {

		init: function () {
			eventListeners();
		},
			
		saveQuestion: function () {
			var qid = Editor.main.getCurrentQuestion();

			questions[qid].step = $('#q-d-step').val();
			questions[qid].name = $('#q-d-name').val();
			questions[qid].loop1 = $('#q-d-loop1').val();
			questions[qid].question_text = $('.q-d-text-wysihtml5').contents().find('.wysihtml5-editor').html();
		},

		buildQuestion: function (qid) {
			$('#q-d-step-container').html(buildStep(qid));
			$('#q-d-name').val(questions[qid].name);
			$('#q-d-loop1').val(questions[qid].loop1);
			$('.q-d-text-wysihtml5').contents().find('.wysihtml5-editor').html(questions[qid].question_text);
		},

		emptyQuestion: function () {
			$('#q-d-step-container').html('');
			$('#q-d-name').val();
			$('#q-d-loop1').val();
			$('.q-d-text-wysihtml5').contents().find('.wysihtml5-editor').html('');
		}
	};
}());