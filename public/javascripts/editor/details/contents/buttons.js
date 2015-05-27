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

Editor.details.contents.buttons = (function () {

  "use strict";

  var active_button = null;

  var eventListeners = function () {

    $(".button-item").live("click", function () {
      var qid = Editor.main.getCurrentQuestion();

      if (active_button !== null) {
        $("#cb-list").find("[data-button-index='" + active_button + "']").removeClass("active");
      }

      var index = $(this).data('button-index'); 
      
      active_button = index;
      $(this).addClass("active");
      $('#button-item').html(buildButton(qid, questions[qid].buttons[index], index));
    });

    // when add button icon is clicked 
    $(".cbia").live("click", function () {
      var qid = Editor.main.getCurrentQuestion();
      var cmd = $(this).data('button-cmd');
      var list, pid, tmp, i, length, button;

      if (cmd === 'add') {
        list = $('#cb-list');
        button = $('#button-item');

        // the active one is the last on the array
        active_button = (questions[qid].buttons.push({
          "type": 'continue',
          "destination": 'none',
          "pid": null
        })) - 1;

        list.html(createButtonsList(questions[qid].buttons)); 
        list.find("[data-button-index='" + active_button + "']").addClass("active");
        button.html(buildButton(qid, questions[qid].buttons[active_button], active_button));

      } else if (cmd === 'remove') {
        if (active_button !== null) {
          pid = questions[qid].buttons[active_button].pid;
          tmp = questions[qid].buttons;
          delete questions[qid].buttons[active_button];
          active_button = null;
          questions[qid].buttons = Editor.utils.rebuildArray(tmp);
          $('#cb-list').html(createButtonsList(questions[qid].buttons));  
          $('#button-item').html('');

          if (pid) {
            Editor.graph.deletePath(qid, pid);
          }
        }

      } else if (cmd === 'up') {
        if (active_button !== null && active_button !== 0) {
          // TODO - logic to check if we are swapping with a deletes (undefined) array element
          // swap the array elements, so the active one gets moved up once
          tmp = questions[qid].buttons[active_button];
          list = $('#cb-list');
          i = 1;

          questions[qid].buttons[active_button] = questions[qid].buttons[active_button - i];
          questions[qid].buttons[active_button - i] = tmp;

          // update the display
          $('#cb-list').html(createButtonsList(questions[qid].buttons));    
          active_button = active_button - i;
          list.find("[data-button-index='" + active_button + "']").addClass("active");

        }
      } else if (cmd === 'down') {
        // make sure a field is active and it is within bounds, ie not zero
        length = questions[qid].buttons.length - 1;

        if (active_button !== null && active_button !== length) {
          // swap the array elements, so the active one gets moved up once
          tmp = questions[qid].buttons[active_button];
          list = $('#cb-list');
          i = 1;

          questions[qid].buttons[active_button] = questions[qid].buttons[active_button + i];
          questions[qid].buttons[active_button + i] = tmp;
          list.html(createButtonsList(questions[qid].buttons));   
          active_button = active_button + i;
          list.find("[data-button-index='" + active_button + "']").addClass("active");
        }
      }
    });

    // when the type of a button changes 
    $("#button-type-dd").live("change", function () {
      var qid = Editor.main.getCurrentQuestion();
      var new_type = $(this).val();

      questions[qid].buttons[active_button].type = new_type;
      questions[qid].buttons[active_button].destination = 'none';
      questions[qid].buttons[active_button].pid = null;

      var list = $('#cb-list');
      list.html(createButtonsList(questions[qid].buttons));
      list.find("[data-button-index='" + active_button + "']").addClass("active");
      Editor.thumbnail.buildThumbnail(qid);
    });

    $("#button-destination-dd").live("change", function () {
      var qid = Editor.main.getCurrentQuestion();
      var old_destination = questions[qid].buttons[active_button].destination;
      var new_destination = $(this).val();
      var new_pid;
      var source = qid; 
      var path;
      var pid = questions[qid].buttons[active_button].pid;

      // if there is no pid assigned we need to create a new path, but if a pid 
      // is assigned than we just need to change the existing one
      // if we switch to none, then we want to delete the path
      if (new_destination !== 'none') {
        if (pid) {
          Editor.graph.changePathDestination(pid, source, new_destination, old_destination);
          questions[qid].buttons[active_button].destination = new_destination;
        } else {
          path = {
            "s": source,
            "d": new_destination,
            "stroke": '#FF9900',
            "stroke_width": "3"
          };

          new_pid = Editor.graph.addPath(path);
          questions[qid].buttons[active_button].destination = new_destination;
          questions[qid].buttons[active_button].pid = new_pid;
        }
      } else {
        // delete the corresponding path
        Editor.graph.deletePath(qid, pid);
        questions[qid].buttons[active_button].destination = 'none';
        questions[qid].buttons[active_button].pid = null;
      }
    });

    $(".button-textbox").live("change", function (e) {
      var input = $(this).val().trim();
      var qid = Editor.main.getCurrentQuestion();
      var button_id_type = $(this).data('button-textbox-id'); 

      // run the validation when a textbox changes, and save it if it passes
      switch (button_id_type) {
        // A label is not required, but it must only be alphadash
        case 'label':
          if (Editor.validation.check(input, ['label'])) {
            questions[qid].buttons[active_button].text = input;
            $(this).val(input);
          } else {
            // put the old value back in
            $(this).val(questions[qid].buttons[active_button].text);
            alert("Only letters and numbers are allowed.");
            e.preventDefault();
          }
          break;
      }

      Editor.thumbnail.buildThumbnail(qid);
    });
  };

  var buildButton = function (qid, button, index) {
    var output = [];
    var types = ['continue','exit', 'finish'];

    if (!button.text) {
      button.text = "";
    }

    output.push('<div class="button-property">');
    output.push('<div class="b-label">Type: </div>');
    output.push('<select class="large-dropdown" id="button-type-dd">');

    for (var i = 0; i < types.length; i+=1) {
      if (types[i] === button.type) {
        output.push('<option selected="selected">' + types[i] + '</option>');
      } else {
        output.push('<option>' + types[i] + '</option>');
      } 
    }

    output.push('</select>'); 
    output.push('</div>');  
    output.push('<div class="clear"></div>');
    output.push('<div class="field-property">');
    output.push('<div class="b-label">Destination: </div>');
    output.push('<select class="large-dropdown" id="button-destination-dd"><option>none</option>');
    
    for (var prop in questions) {
      if (questions.hasOwnProperty(prop)) {
        // don't sure the current question in the drop list 
        if (questions[prop].qid !== qid) {
          if (questions[prop].qid === button.destination) {
            output.push('<option selected="selected">' + questions[prop].qid + '</option>');
          } else {
            output.push('<option>' + questions[prop].qid + '</option>');
          }
        }
      }
    }

    output.push('</select>'); 
    output.push('</div>');  
    output.push('<div class="clear"></div>');

    output.push('<div class="field-property">');
    output.push('<div class="b-label">Text: </div>');
    output.push('<input type="text" value="' + button.text + '" class="button-textbox ac" data-button-textbox-id="label">');
    output.push('</div>');

    return output.join(''); 
  };  

  var createButtonsList = function (buttons_array) {
    var output = [];

    if (buttons_array) {
      output.push('<ul>');
      for (var i = 0; i < buttons_array.length; i+=1) {
        if (buttons_array[i]) {
          output.push('<li data-button-index="' + i + '" class="button-item">');
          output.push('<span>' + buttons_array[i].type + ' </span>');
          output.push('</li>');
        }
      }
      output.push('</ul>');
    }
    return output.join('');
  };

  return {

    init: function () {
      eventListeners();
    },

    buildButtons: function (qid) {
      $('#cb-list').html(createButtonsList(questions[qid].buttons));
    },

    // this is used when a tab changes away from the buttons tab, so we can 'reset' it
    emptyButtons: function () {
      active_button = null;
      $('#button-item').html('');
      $('#cb-list').html('');
    },

    // Also remove the button destination if it the qid
    // @dqid is the question that is the source of the path to the question we are deleting
    // @qid is the question we are deleting
    removeOldRefs: function (dqid, qid) {
      for (var i = 0; i < questions[dqid].buttons.length; i+=1) {
        if (questions[dqid].buttons[i].destination === qid) {
          questions[dqid].buttons[i].destination = 'none';
          questions[dqid].buttons[i].pid = null;
        }
      }
    }
  };
}());