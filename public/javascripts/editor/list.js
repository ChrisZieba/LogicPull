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

Editor.list = (function () {

  "use strict";

  var active_item = null;
  var order = 'sort-a';

  var eventListeners = function () {
    $(".mli").live("click", function () {
      var qid;

      // If there is a question details open ,ignore single click events on the list
      if ( ! Editor.main.getDetailsStatus()) {
        qid = $(this).data('qid');  
        Editor.list.activateItem(qid, true, false);
        Editor.thumbnail.buildThumbnail(qid);
      }
    });

    $(".mli").live("dblclick", function () {
      var qid = $(this).data('qid');
      var curr = Editor.main.getCurrentQuestion();
      var status = Editor.main.getDetailsStatus();

      // if the item clicked is different that the current question, OR
      // they are the same and the details window is closed
      if (qid !== curr || (qid === curr && status === false )) {
        Editor.list.activateItem(qid, true);
        Editor.details.manager.showQuestionDetails(qid);
      }

      Editor.thumbnail.buildThumbnail(qid);
    });
  };

  var sortByID = function () {
    var output = [];
    var qid;
    var ids = Editor.utils.sort('_id', function(a,b) {return a.id - b.id;});

    for (var i = 0; i < ids.length; i+=1) {
      qid = 'q' + ids[i].id;

      output.push('<div data-qid="' + qid + '" class="mli">');
      output.push('<div class="list-qid">[' + qid + ']</div>');
      output.push('<div class="list-step">' + questions[qid].step + '</div>');
      output.push('<div class="list-name">' + questions[qid].name + '</div></div>');
    }

    return output.join("");
  };

  // Sort by step, and then sort each step by name
  var sortBySteps = function () {
    var output = [];
    var jo_flag;
    var steps = Editor.settings.getSteps();
    var bucket = [];
    //copy the array
    var arr2 = steps.slice(0);

    arr2.push('none');

    // we need to put each step in its own array, so we can sort each step by its name
    for (var j = 0; j < arr2.length; j+=1) {
      // a new array to hold all the questions from the step
      bucket.push([]);

      // go through eqach question
      for (var key in questions) {
        if (questions.hasOwnProperty(key)) {
          console.log(questions[key].step);
          console.log($('<div/>').html(arr2[j]).text());
          if (questions[key].step === $('<div/>').html(arr2[j]).text()) {
            // look for the right place to put the new question. If the array is empty we don't need to sort anything out
            if (bucket[j].length === 0) {
              bucket[j].push({
                name: questions[key].name,
                step: questions[key].step,
                qid: key
              });
            } else {
              // initialize this to false because we want to check if an item is inserted or not
              jo_flag = false;
              //look through the step array and find where to place the new question
              for (var k = 0; k < bucket[j].length; k+=1) {
                if (questions[key].name.toUpperCase() < bucket[j][k].name.toUpperCase()) {
                  bucket[j].splice(k, 0, {
                    name: questions[key].name,
                    step: questions[key].step,
                    qid: key
                  });
                  // this is used to check if we actually inserted an obj or reached the end of the array
                  jo_flag = true;
                  break;
                }
              }
              // if all the elements are sorted just push
              if (!jo_flag) {
                bucket[j].push({
                  name: questions[key].name,
                  step: questions[key].step,
                  qid: key                  
                });
              }
            }
          }
        }
      }
    }

    // this just goes through each step array
    for (var i = 0; i < bucket.length; i+=1) {
      for (var l = 0; l < bucket[i].length; l+=1) {
        output.push('<div data-qid="' + bucket[i][l].qid + '" class="mli">');
        output.push('<div class="list-step">' + bucket[i][l].step + '</div>');
        output.push('<div class="list-name">' + bucket[i][l].name + '</div>');
        output.push('<div class="list-qid">[' + bucket[i][l].qid + ']</div></div>');
      }
    }

    return output.join("");
  };

  var sortByName = function () {
    var output = [];
    var qid;

    var sort_func = function (a,b) {
      var textA = a.value.toUpperCase();
      var textB = b.value.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    };

    var ids = Editor.utils.sort('name', sort_func);

    for (var i = 0; i < ids.length; i+=1) {
      qid = 'q' + ids[i].id;
      output.push('<div data-qid="' + qid + '" class="mli">');
      output.push('<div class="list-name">' + questions[qid].name + '</div>');
      output.push('<div class="list-qid">[' + qid + ']</div>');
      output.push('<div class="list-step">' + questions[qid].step + '</div>');
      output.push('</div>');
    }

    return output.join("");
  };

  return {      
    init: function () {
      eventListeners();
      $('#q-d-list').html(sortByID());
    },

    getActiveItem: function () {
      return active_item;
    },

    // Order by option selected
    orderList: function (type, qid) {
      if (type) {
        order = type;
      } else {
        type = order;
      }
      
      switch (type) {
        case 'sort-a':
          $('#q-d-list').html(sortByID());
          break;
        case 'sort-b':
          $('#q-d-list').html(sortBySteps());
          break;
        case 'sort-c':
          $('#q-d-list').html(sortByName());
          break;

      }

      if (qid) {
        Editor.list.activateItem(qid, false, true);
      }
    },

    // all this does is add the active class and move to the graph node
    activateItem: function (qid, shift, move) {
      var list, new_active;

      if (qid) {
        list = $("#q-d-list");

        // remove the active class from the old item
        if (active_item !== null) { 
          list.find("[data-qid='" + active_item + "']").removeClass("active");
          // this handles the color highlighting of the graph node, along with its text
          d3.select("#"+ active_item).style("fill", '#c6d5b0');
          d3.select('#qt' + active_item.substr(1)).style('fill', '#32382C');
        }
        
        new_active = list.find("[data-qid='" + qid + "']").addClass("active");
        active_item = qid;
        d3.select("#"+ active_item).style("fill", '#02779E');
        d3.select('#qt' + active_item.substr(1)).style('fill', '#fff');

        // if we click on the graph node we do not want to shift around the graph, only from the list
        if (shift) {
          Editor.graph.moveTo(qid);     
        }
      }
    },

    removeItem: function (qid) {
      $("#q-d-list").find("[data-qid='" + qid + "']").remove();
      //after we remove the active element, there is no active element
      active_item = null;
    }
  };
}());