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

Editor.utils = (function () {
  "use strict";

  return {
    // given an array of objects, and an object property value, return the array index which has the value 
    // used to find a path object in an array of objects
    findIndex: function (prop, value, arr) {
      for (var i = 0; i < arr.length; i+=1) {
        if (arr[i] !== null && typeof arr[i] !== 'undefined') {
          if (arr[i][prop] === value) {
            return i;
          }
        }
      }

      return -1;
    },

    cleanInput: function (str) {
      var out = str.trim();
    },

    rebuildArray: function (arr) {
      // rebuild the array so there are no undefined elements in it
      var tmp = [];

      for (var i = 0; i < arr.length; i+=1) {
        if (arr[i] !== null && typeof arr[i] !== 'undefined') {
          tmp.push(arr[i]);
        }
      }

      return tmp;
    },

    // this function will return an array containing all the question _ids in ascending order
    // return : [0,1,2,3,4] where the elements correspond to _id property in each question
    sort: function (prop, func) {
      var ids = [];

      // put all the ids in an array, and then sort them 
      for (var key in questions) {
        if (questions.hasOwnProperty(key)) {
          ids.push({
            "id": questions[key]._id,
            "value": questions[key][prop]
          });
        }
      }

      if (func) {
        ids.sort(func);
      } else {
        ids.sort();
      }
      
      return ids;
    },

    deepCopy: function (obj) {
      var ret = {};
      var val;

      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          val = obj[key];
          if (typeof val === 'object' && val !== null) {
            ret[key] = Editor.utils.deepCopy(val);
          } else {
            ret[key] = val;
          }
        }
      }
      return ret;
    }
  };
}());