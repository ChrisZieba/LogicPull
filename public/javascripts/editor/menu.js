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

Editor.menu = (function () {

  "use strict";

  // this lists all the menu commands available
  var menu = {
    graph: {
      main: [
        'save',
        'add',
        'remove',
        'clone',
        'sort-a',
        'sort-b',
        'sort-c',
        //'view-graph',
        'preview',
        'settings',
        'scale-up',
        'scale-down',
        'order'
      ],
      sub: [
        'home',
        'save',
        'tools',
        'add',
        'remove',
        'sort-a',
        'sort-b',
        'sort-c',
        'clone',
        'preview',
        'scale-up',
        'scale-down',
        'order'
      ]
    },
    question: {
      main: [
        'save',
        //'add',
        //'remove',
        //'clone',
        //'sort-a',
        //'sort-b',
        //'sort-c',
        'graph',
        'preview',
        'settings'
        //'scale-up',
        //'scale-down',
        //'order'
      ],
      sub: [
        'home',
        'save',
        'tools',
        'preview',
        // this is used to preview an interview at a certain question
        'preview-q' 
      ]     
    },
    settings: {
      main: [
        'save',
        //'add',
        //'remove',
        //'clone',
        //'sort-a',
        //'sort-b',
        //'sort-c',
        'graph',
        'preview'
        //'view-settings',
        //'scale-up',
        //'scale-down',
        //'order'
      ],
      sub: [
        'preview'
      ]     
    },
    preview: {
      main: [
        //'save',
        //'add',
        //'remove',
        //'clone',
        //'sort-a',
        //'sort-b',
        //'sort-c',
        'graph',
        //'preview',
        'settings',
        //'scale-up',
        //'scale-down',
        'edit-q'
      ],
      sub: [
        // this is used to preview an interview at a certain question
        'edit-q' 
      ]     
    }
  };


  // this function takes a type of window as a string, and closes that window
  var closeWindows = function (type) {
    // make a copy of the array
    var last;
    var ww = Editor.main.getWindow().slice();

    // this will loop until the only open window is the graph
    for (var i = ww.length; i > 0; i-=1) {
      // the last open window
      last = ww[i-1];
      if (last !== 'graph') {
        // close whatever is open in front on the graph
        switch (last) {
          case 'question':
            Editor.details.manager.closeQuestion();
            break;
          case 'preview':
            Editor.interview.closePreview();
            break;
          case 'settings':
            Editor.settings.closeSettings();
            break;
          default:
            break;
        }
      }
    }
  };

  var eventListeners = function () {
    // when a sub-menu item is clicked 
    $(".fli").live("click", function () {
      var command = $(this).data('sub-menu-command');
      var active_v_q, active_l_i, qid, question;
      
      switch (command) {
        case 'settings':
          closeWindows();
          Editor.settings.openSettings();
          break;
        case 'preview':
          Editor.interview.preview();
          break;
        case 'preview-q':
          qid = Editor.main.getCurrentQuestion();
          Editor.interview.preview(qid);
          break;
        case 'edit-q':
          active_v_q = Editor.debug.getActiveQuestion();
          qid = Editor.main.getCurrentQuestion();
          Editor.interview.closePreview();
          Editor.details.manager.showQuestionDetails(active_v_q || qid);
          break;
        case 'add':
          question = Editor.graph.createQuestion();
          qid = Editor.graph.addQuestion(question);
          Editor.list.orderList(null, qid);
          break;
        case 'remove':
          // get the item in the list with the active class
          qid = Editor.list.getActiveItem();

          if (qid) {
            Editor.graph.removeQuestion(qid);
            Editor.list.removeItem(qid);
          }

          break;
        // fall through
        case 'sort-a':
        case 'sort-b':
        case 'sort-c':
          Editor.list.orderList(command, qid);
          break;
        case 'clone':
          active_l_i = Editor.list.getActiveItem();

          if (active_l_i) {
            qid = Editor.graph.cloneQuestion(active_l_i);

            Editor.list.orderList(null, qid);
          }

          break;
        case 'save':
          Editor.interview.save();
          break;
        case 'scale-up':
        case 'scale-down':
          Editor.graph.scaleGraph(command);
          break;
        case 'order':
          Editor.interview.graph();
          break;
        default:
          break;
      }
        
    });

    // when a main-menu item is clicked 
    $(".mmli").live("click", function () {
      var command = $(this).data('main-menu-command');
      var active_v_q, active_l_i,  qid, question; 

      // hide the drop
      $("#main-menu-nav ul").css('display','none');
      
      switch (command) {
        case 'settings':
          closeWindows();
          Editor.settings.openSettings();
          break;
        case 'graph':
          // close all windows and the graph shows by default
          closeWindows();
          break;
        case 'preview':
          closeWindows();
          Editor.interview.preview();
          break;
        case 'save':
          Editor.interview.save();
          break;
        case 'scale-up':
        case 'scale-down':
          Editor.graph.scaleGraph(command);
          break;
        case 'order':
          Editor.interview.graph();
          break;
        case 'edit-q':
          active_v_q = Editor.debug.getActiveQuestion();
          Editor.interview.closePreview();
          Editor.details.manager.showQuestionDetails(active_v_q);
          break;
        case 'add':
          question = Editor.graph.createQuestion();
          qid = Editor.graph.addQuestion(question);
          Editor.list.orderList(null, qid);
          break;
        case 'remove':
          // get the item in the list with the active class
          qid = Editor.list.getActiveItem();

          if (qid) {
            Editor.graph.removeQuestion(qid);
            Editor.list.removeItem(qid);
          }

          break;
        // fall through
        case 'sort-a':
        case 'sort-b':
        case 'sort-c':
          Editor.list.orderList(command, qid);
          break;
        case 'clone':
          active_l_i = Editor.list.getActiveItem();

          if (active_l_i) {
            qid = Editor.graph.cloneQuestion(active_l_i);

            Editor.list.orderList(null, qid);
          }

          break;
        default:
          break;
      }
    });

    $("#main-menu-nav > li").mouseenter(function () {
      $("#main-menu-nav ul").css('display','none');
      $(this).find('ul').show();
    });

    $("#main-menu-nav ul, #main-menu-nav > li").not().mouseleave(function (e) {
      $("#main-menu-nav ul").hide();
    });

    // use this to capture the ctrl-s and save the interview
    document.addEventListener("keydown", function(e) {
      if (e.keyCode === 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        Editor.interview.save();
      }
    }, false);
  };

  // this will make every menu item active
  var reset = function () {
    // the main menu
    $('.main-menu').each(function() {
      if ($(this).hasClass('disabled')) {
        // add on the disabled looping class
        $(this).removeClass('disabled'); 
        $(this).addClass('mmli');
      }
    });

    // the sub menu
    $('.sub-menu').each(function() {
      var command = $(this).data('sub-menu-command');

      if ($(this).hasClass(command + '-disabled')) {
        // add on the disabled looping class
        $(this).removeClass(command + '-disabled'); 
        $(this).addClass('fli ' + command);
      }
    });
  };

  return {      
    init: function () {
      // put the text into the question object
      eventListeners();
    },

    // this will activate/deactivate all the appropriate items in the menu for the question defaults window
    set: function () {
      var ww = Editor.main.getWindow();
      // get the last window on the stack
      var type = ww[ww.length-1]; 

      reset();

      // go through each main menu item and only activate those items in the question_menu array
      $('.main-menu').each(function() {
        var command = $(this).data('main-menu-command');

        // if the command is not in the array it needs to be deactivated
        if (menu[type].main.indexOf(command) === -1) {
          // this takes away the event listener
          $(this).removeClass('mmli'); 
          // add on the disabled looping class
          $(this).addClass('disabled'); 
        }
      });

      // go through each sub menu item and only activate those items in the question_menu array
      $('.sub-menu').each(function() {
        var command = $(this).data('sub-menu-command');

        // if the command is not in the array it needs to be deactivated
        if (menu[type].sub.indexOf(command) === -1) {
          // this takes away the event listener, and the active icon
          $(this).removeClass('fli ' + command); 
          // add on the disabled looping class
          $(this).addClass(command + '-disabled'); 
        }
      });
    }
  };
}());