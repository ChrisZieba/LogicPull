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

Editor.settings = (function () {
  "use strict";

  var active_step = null;
  var id = '';
  var prop; 
  var name = '';
  var description = '';
  var start = '';
  var steps = [];
  var colors = [
    "#18C27A",
    "#FA0530",
    "#D3C015",
    "#FAE79F",
    "#0B5B70",
    "#4FADD3",
    "#FD6B0E",
    "#C1D7E1",
    "#FE548F",
    "#9061C2",
    "#1A20BA",
    "#0C3F4E",
    "#A8D26E",
    "#A74143",
    "#F6F31B"
  ];

  var buildStart = function (start) {
    var output = [];

    output.push('<select id="settings-start-dd">');

    for (var prop in questions) {
      if (questions.hasOwnProperty(prop)) {
        if (questions[prop].qid === start) {
          output.push('<option selected="selected">' + questions[prop].qid + '</option>');
        } else {
          output.push('<option>' + questions[prop].qid + '</option>');
        }
      }   
    }

    output.push('</select>');

    return output.join(''); 
  };

  var buildStepsList = function (steps) {
    var output = [];
    var n;

    for (var i = 0; i < steps.length; i+=1) {
      if (steps[i]) {
        n = i + 1;
        output.push('<div data-step-index="' + i + '" style="color:' + colors[i%15] + '" class="settings-steps-list-i">' + n + ': ' + steps[i] + '</div>');
      }
    }

    return output.join(''); 
  };

  var buildSteps = function (steps) {
    var output = [];

    output.push('<div id="settings-steps-list">');
    output.push(buildStepsList(steps));
    output.push('</div>');
    output.push('<div class="clear"></div>');
    output.push('<ul class="s-list-controls">');
    output.push('<li data-s-cmd="add" class="add unselectable sia">Add</li>');
    output.push('<li data-s-cmd="remove" class="remove unselectable sia">Remove</li>');
    output.push('</ul>');
    output.push('<div class="clear"></div>');
    output.push('<div id="settings-steps-list-item-new"></div>');

    return output.join(''); 
  };

  // this is shown when a plus icon is clicked for a new step
  var stepsNewItem = function () {
    var output = [];

    output.push('<textarea id="settings-s-item-ta" class=""text-area-def></textarea>');
    output.push('<div class="clear"></div>');
    output.push('<ul class="s-item-controls">');
    output.push('<li data-s-item-cmd="checkmark" class="checkmark unselectable siia">OK</li>');
    output.push('<li data-s-item-cmd="delete" class="delete unselectable siia">Cancel</li>');
    output.push('</ul>');
    output.push('<div class="clear"></div>');

    return output.join(''); 
  };

  var settingsClose = function () {
    $('#m-settings').addClass('none');
    Editor.main.closeWindow('settings'); 
    Editor.menu.set();
  };

  var eventListeners = function () {
    // listen when the 'x' on he settings is clicked
    $("#m-settings-close").live("click", function () {
      settingsClose();
    });

    $(".sia").live("click", function () {
      var cmd = $(this).data('s-cmd');
      var list;

      if (cmd === 'add') {
        $('.s-list-controls').hide();
        $('#settings-steps-list-item-new').html(stepsNewItem());

      } else if (cmd === 'remove') {
        // only do anything if something is selected (active)
        if (active_step !== null) {
          // when we delete a step, we need to go through every question and remove the reference
          for (var qid in questions) {
            if (questions.hasOwnProperty(qid)) {
              if (questions[qid].step === steps[active_step]) {
                questions[qid].step = 'none';
              }
            }
          }

          list = $('#settings-steps-list');
          Editor.settings.deleteStep(active_step);
          list.html(buildStepsList(steps));
          // deselected the list item
          active_step = null;
        }
      }
    });

    // listen for when an OK or Cancel icon is clicked when adding a new 
    $(".siia").live("click", function () {
      var cmd = $(this).data('s-item-cmd');
      var new_step;

      if (cmd === 'checkmark') {
        new_step = $('#settings-s-item-ta').val();
        new_step = $.trim(new_step);
        // check that something was entered
        if (new_step) {
          Editor.settings.insertStep(new_step);
          // rebuild the steps
          $('#settings-steps-container').html(buildSteps(steps));         
        }
      } else if (cmd === 'delete') {
        // only do anything if something is selected (active)
        $('#settings-steps-container').html(buildSteps(steps));
      }
    });

    $(".settings-steps-list-i").live("click", function () {
      var index = $(this).data('step-index'); 

      if (active_step !== null) {
        $("#settings-steps-list").find("[data-step-index='" + active_step + "']").removeClass("active");
      }
      
      active_step = index;
      $(this).addClass("active");
    });

    // when the action goto changes for 'goto'
    $("#settings-start-dd").live("change", function () {
      var qid = Editor.main.getCurrentQuestion();
      // this is the value that gets selected in the drop down
      start = $(this).val(); 
    });
  };

  return {
    init: function () {
      eventListeners();
    },

    set: function (interview, nam, desc, strt, step) {
      id = interview;
      name = nam;
      description = desc;
      start = strt;
      steps = JSON.parse(step);
    },

    get: function () {
      return {
        id: id,
        name: name,
        description: description,
        start: start,
        steps: steps
      };
    },

    getID: function () {
      return id;
    },

    getStart: function () {
      return start;
    },

    setStart: function (st) {
      start = st;
    },

    getSteps: function () {
      return steps;
    },

    insertStep: function (step) {
      steps.push(step);
    },

    deleteStep: function (i) {
      var tmp = [];

      delete steps[i];
      
      // rebuild the array so there are no undefined elements in it
      for (var j = 0; j < steps.length; j+=1) {
        if (steps[j]) {
          tmp.push(steps[j]);
        }
      }

      steps = tmp;
    },

    buildSettings: function () {
      $('#settings-name').html(name);
      $('#settings-description').html(description);
      $('#settings-start-container').html(buildStart(start));
      $('#settings-steps-container').html(buildSteps(steps));
    },

    closeSettings: function () {
      settingsClose();
    },

    openSettings: function () {
      Editor.settings.buildSettings();
      $('#m-settings').removeClass('none');
      Editor.main.openWindow('settings');
      Editor.menu.set();      
    }
  };
}());