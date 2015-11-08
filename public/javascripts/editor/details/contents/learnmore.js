/*  Copyright 2015 Chris Zieba <zieba.chris@gmail.com>

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

Editor.details.contents.learnmore = (function () {

  "use strict";

  var eventListeners = function () {
    // when we leave a textbox, save the data
    $(".lm-textbox").live("change", function () {
      var input = $(this).val().trim();
      var qid = Editor.main.getCurrentQuestion();
      var type = $(this).data('lm-textbox-id');

      // run the validation when a textbox changes, and save it if it passes
      switch (type) {
        case 'title':
          // if the input is valid, store it and change the input box, otherwise alert the user
          if (Editor.validation.check(input, ['label'])) {
            questions[qid].learn_more.title = input;
            // update the textbox
            $(this).val(input);
          } else {
            // put the old value back in
            $(this).val(questions[qid].learn_more.title);
            alert("This field allows only spaces, letters, and numbers, #, $, -, %, &, *, /, \\, (, )");
          }
          break;
      }
    });
  };

  return {
    init: function () {
      eventListeners();
    },
        
    saveLearnmore: function () {
      var qid = Editor.main.getCurrentQuestion();
      questions[qid].learn_more.title = $('#q-d-lm-title').val();
      questions[qid].learn_more.body = $('.q-d-lm-wysihtml5').contents().find('.q-d-lm-wysihtml5').html();
    },

    buildLearnmore: function (qid) {
      $('#q-d-lm-title').val(questions[qid].learn_more.title);
      $('.q-d-lm-wysihtml5').contents().find('.wysihtml5-editor').html(questions[qid].learn_more.body);
    },

    emptyLearnmore: function () {
      $('#q-d-lm-title').html('');
      $('.q-d-lm-wysihtml5').contents().find('.q-d-lm-wysihtml5').html('');
    }
  };
}());