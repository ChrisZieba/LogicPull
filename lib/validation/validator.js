/*  Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var validators = {
  condition: function (input) {
    if (input.length !== 0) {
      return input.match(/^[a-zA-Z0-9_#%&!=+.?;<>|\,\$\:\[\]\'\"\-\/\)\(\*\s]*$/);
    }

    return true;
  },

  // true for valid email, or empty string
  email: function (input) {
    if (input.length !== 0) {
      return input.match(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/);
    } 
    return true;
  },

  password: function (input) {
    if (input.length !== 0) {
      return input.match(/^[a-zA-Z0-9\^!@#\$%\&\*\(\)\-\_\.\,\~]+$/);
    } 
    return true;
  },

  minlength: function (input, val) {
    val = parseInt(val,10);

    if (input.length !== 0) {
      return input.length >= val;
    } 
    return true;
  },

  maxlength: function (input, val) {
    val = parseInt(val,10);

    if (input.length !== 0) {
      return input.length <= val;
    } 
    return true;
  },

  min: function (input, val) {
    var number;

    if (input.length !== 0) {
      number = parseFloat(input);
      return isNaN(number) || number >= val;
    } 
    return true;
  },

  max: function (input, val) {
    var number;

    if (input.length !== 0) {
      number = parseFloat(input);
      return isNaN(number) || number <= val;
    } 
    return true;
  },

  number: function (input) {
    // from the start of the string to the end, only contains number
    if (input.length !== 0) {
      return input.match(/^(?:[1-9]\d*|0)?(?:\.\d+)?$/);
    } 
    return true;
  },

  integer: function (input) {
    if (input.length !== 0) {
      return input.match(/^\d+$/);
    }

    return true;
  },

  alphanum: function (input) {
    // from the start of the string to the end, only contains letters, at least once
    if (input.length !== 0) {
      return input.match(/^[a-zA-ZA-ÿ0-9]+$/);
    } 
    return true;
  },

  // this is used mostly for labels
  label: function (input) {
    // from the start of the string to the end, only contains letters, numbers and a few special characters
    if (input.length !== 0) {
      return input.match(/^[a-zA-ZA-ÿ0-9,:._#'"?$<>\-%&\\\/\)\(\*\s]*$/);
    } 
    return true;
  },

  alphadash: function (input) {
    // from the start of the string to the end, only contains letters, numbers and a few special characters
    if (input.length !== 0) {
      return input.match(/^[a-zA-ZA-ÿ\-]*$/);
    } 
    return true;
  },

  variable: function (input) {
    if (input.length !== 0) {
      return input.match(/^[a-zA-Z][a-zA-Z0-9_\[\]]+$/);
    } 
    return true;
  },

  // Allowed: letters, numbers, underscores, square brackets, periods and dashes.
  filename: function (input) {
    if (input.length !== 0) {
      return input.match(/^[a-zA-Z0-9_\.\-\[\]]+$/);
    } 
    return true;
  },

  required: function (input) {
    if (input.length === 0) {
      return false;
    }

    return true;
  }
};

/**
 * Run the validation.
 *
 * @requirements {array} An array containing all the validation requiremnts, each array element can be a sring or object
 *
 */
exports.check = function (input, requirements) {
  "use strict";
  
  var val;
  
  // If the input is still valid afer running through this loop, we return true
  for (var i = 0; i < requirements.length; i+=1) {
    // If the element is an object it must contain a value
    if (typeof requirements[i] === 'object') {
      if (validators[Object.keys(requirements[i])[0]]) {
        // This will get the value of the property without knowing its name
        val = requirements[i][Object.keys(requirements[i])[0]];

        // Run the valiation with the optional val input
        if ( !validators[Object.keys(requirements[i])[0]](input, val)) {
          return false;
        }
      }
    } else {
      if (validators[requirements[i]]) {
        // Run the valiation with the optional val input
        if ( !validators[requirements[i]](input)) {
          return false;
        } 
      }   
    }
  }

  // If we make it here the input is valid
  return true;
};