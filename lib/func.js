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

// Functions passed into the stylesheet and used in the interview
exports.common = {
  /**
   * Return the multiplication of the two inputs
   *
   * @rent {number} The amount of rent per month
   * @months {number} The number of months
   *
   */
  abatement: function (rent, months) {
    return rent*months;
  },
  /**
   * Capitalize the first letter of a string
   *
   * @str {string} The string to capitalize
   *
   */
  capitalize: function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  /**
   * Round a number
   *
   * @val {number} The number to round
   *
   */
  round: function (val) {
    return Math.round(val);
  },
  /**
   * Return the ordinal of a given index up to 20
   *
   * @index {number} The index corresponding to the word we want
   *
   * Examples:
   *
   * numberWord(0) returns 'zero'
   * numberWord(20) returns 'twenty'
   *
   */
  numberWord: function (index) {
    var od = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
    
    if (arguments.length === 1) {
      if (od[index]) {
        return od[index];
      }
    } 

    return false;
    
  },
  /**
   * Return the ordinal of a given index up to 20
   *
   * @index {int} The number to turn into an ordinal
   * @num {boolean} Optional parameter that returns the numbered ordinal when set to true 
   *
   */
  ordinal: function (index, num) {
    var od = ['zeroeth','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth'],
      odn = ['0th','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th','13th','14th','15th','16th','17th','18th','19th','20th'];
    
    if (arguments.length === 2) {
      if (odn[index]) {
        return odn[index];
      }
    } else {
      if (od[index]) {
        return od[index];
      }
    }

    return false;
  },
  /**
   * The difference between two dates. The first two arguments are mandatory, and if the last two 
   * are not given we set the date d2 to today. If the second date parameter (d2) comes after the first, than the result will be positive.
   *
   * @date {string} Date string
   * @in_format {string} The format of the string given
   * @out_format {string} The format to convert the string to
   *
   * Examples
   *
   * dateDifference('12/24/1977', 'MM/DD/YYYY', 'days', '01/01/2012', 'MM/DD/YYYY') // 13504
   * dateDifference('01/01/2012', 'MM/DD/YYYY', 'days', '12/24/1977', 'MM/DD/YYYY') // -13504
   *
   */
  dateFormat : function (date, in_format, out_format) {
    var moment = require('moment');
      // the allowed formats is used to check against the date entered
    var formats = ['DD/MM/YYYY','MM/DD/YYYY', 'days'];

    // if no format for the date is given as an argument, use a default
    in_format = formats.indexOf(in_format) >= 0 ? in_format : 'MM/DD/YYYY';

    // if no format is given for the output date, use a default
    out_format = typeof out_format !== 'undefined' ? out_format : 'MM/DD/YYYY';

    // if the in_format is days and the date is a number (ie. days)
    if (in_format === 'days') {
      return moment("01/01/1900", "MM/DD/YYYY").add('days', date).format(out_format);
    } 

    // if no date is given as input, set it to today
    date = typeof date !== 'undefined' ? moment(date, in_format) : moment(new Date());
    
    return date.format(out_format);
  },
  
  /**
   * The difference between two dates. The first two arguments are mandatory, and if the last two 
   * are not given we set the date d2 to today. If the second date parameter (d2) comes after the first, than the result will be positive.
   *
   * @d1 {string} The date
   * @f1 {string} The format of d1
   * @m {string} The unit for the difference. Possible inputs are 'months', 'days', 'years'
   * @d2 {string} The string to capitalize
   * @f2 {string} The string to capitalize
   *
   * Examples
   *
   * dateDifference('12/24/1977', 'MM/DD/YYYY', 'days', '01/01/2012', 'MM/DD/YYYY') // 13504
   * dateDifference('01/01/2012', 'MM/DD/YYYY', 'days', '12/24/1977', 'MM/DD/YYYY') // -13504
   *
   */
  dateDifference : function (d1, f1, m, d2, f2) {
    var moment = require('moment'),
      allowed_in_formats = [
        'DD/MM/YYYY',
        'MM/DD/YYYY'
      ];

    var index1, index2, date1, date2;

    if (arguments.length === 3) {
      index1 = allowed_in_formats.indexOf(f1);
      date2 = moment(new Date());

      // check if the format is allowed
      if (index1 >= 0) {
        date1 = moment(d1, f1);

        return date2.diff(date1, m);
      }

    // 5 arguments means that two dates were given
    } else if (arguments.length === 5) {
      index1 = allowed_in_formats.indexOf(f1);
      index2 = allowed_in_formats.indexOf(f2);
      date1 = moment(d1, f1);
      date2 = moment(d2, f2);

      // check if the format is allowed
      if (index1 >= 0 && index2 >= 0) {
        date1 = moment(d1, f1);

        return date2.diff(date1, m);
      }
    }
    return false;
  },

  /**
   * Return the number of days since 1900
   *
   * @date {string, variable} The date can be a string, or the variable containing the date string.
   * @format {string} The format of date. If no format is given the default is "MM/DD/YYYY"
   *
   * Examples
   *
   * dateDays('12/24/1977') // 44504
   * dateDays(varname, 'MM/DD/YYYY') // 124423
   *
   */
  dateDays : function (date, format) {
    var moment = require('moment');
    // the allowed formats is used to check against the date entered
    var formats = ['DD/MM/YYYY','MM/DD/YYYY'];
    // this the date to start counting days from
    var date2 = moment("01/01/1900", "MM/DD/YYYY");

    // if not format is given as an argument, use a default
    format = formats.indexOf(format) >= 0 ? format : 'MM/DD/YYYY';
    // if no date is given as input, set it to today
    date = typeof date !== 'undefined' ? moment(date,format) : moment(new Date());

    return date.diff(date2, 'days');              
  },

  /**
   * Format a string into a currency string
   *
   * @input {string, number} The string to convert
   *
   * Examples
   * 
   * formatMoney(1234) // $1,234.00
   * formatMoney('34.239234') // $34.23
   *
   */
  formatMoney: function (input) {
    var accounting = require("accounting");
    return accounting.formatMoney(input);
  },
  /**
   * Format a string into a number
   *
   * @input {string, number} The string to convert
   * @p {int} The number of decimal places to use
   * @l {boolean} Use a comma
   *
   * Examples
   * 
   * formatNumber(1234) // 1,234.00
   * formatNumber(1234, 0) // 1,234
   * formatNumber(1234, 2, false) // 1234.00
   * formatNumber(1234, 5, true) // 1,234.00000
   *
   */
  formatNumber: function (input, p, l) {
    var accounting = require("accounting");
    p = parseInt(p,10) || 2;
    l = (l === "" || l === false) ? "" : (l || ",");

    return accounting.formatNumber(input,p,l);
  },
  /**
   * Returns the sum {float} of an array of numbers
   *
   * @input {array} An array of numbers
   *
   * Examples
   * 
   * sum([1,2,3]) // 6
   *
   */
  sum: function (datas) {
    // if the input is an array, look through each element and add to sum
    var num;
    var sum = 0;

    if (Array.isArray(datas)) {
      for (var i = 0; i < datas.length; i+=1) {
        num = parseFloat(datas[i]);
        if (!isNaN(num)) {
          sum = sum + num;
        } 
      }

      return sum;
    }

    return parseFloat(datas);
  },

};

// These are all the standard functions for use in the stylesheet
exports.stylesheet = {
  /**
   * Checks if a variable was answered and has a value (not empty string)
   *
   * @name {string, array} The name of the variable
   * @index {int} Optional loop index
   *
   */
  isAnswered: function (name, index) {
    if (Array.isArray(name)) {
      for (var i = 0; i < name.length; i+=1) {

        if (index !== null && typeof index !== 'undefined') {
          if (this.master[name[i]] !== null && typeof this.master[name[i]] !== 'undefined') {
            if (this.master[name].values[name[i]][index] !== null && typeof this.master[name[i]].values[name][index] !== 'undefined' && this.master[name[i]].values[name[i]][index] !== '') {
              return true;
            } 
          }
        } else {
          if (this.master[name[i]] !== null && typeof this.master[name[i]] !== 'undefined') {
            if (this.master[name[i]].values[name] !== '' && this.master[name[i]].values[name[i]].length !== 0) {
              return true;
            }
          }
        }
      }
    } else {
      if (index !== null && typeof index !== 'undefined') {
        if (this.master[name] !== null && typeof this.master[name] !== 'undefined') {
          if (this.master[name].values[name][index] !== null && typeof this.master[name].values[name][index] !== 'undefined' && this.master[name].values[name][index] !== '') {
            return true;
          } 
        }
      } else {
        if (this.master[name] !== null && typeof this.master[name] !== 'undefined') {
          if (this.master[name].values[name] !== '' && this.master[name].values[name].length !== 0) {
            return true;
          }
        } 
      }
    }

    return false;
  },
  /**
   * Takes the name and the id of the checkbox we want to evaluate. If the checkbox is
   * part of a loop the index needs to be passed in to correctly parse the checkbox. To check if
   * NOTA was checked, pass in 'nota' as the @id parameter.
   *
   * @name {string} The name of the checkbox field
   * @id {string, array} The ID given to the checkbox field option in the editor
   * @index {int} The optional loop index
   *
   * Examples
   *
   * isChecked('translator_needed', 'rid1')
   * isChecked('translator_needed', 'nota')
   * isChecked('translator_needed', 'rid1', 0)
   * isChecked('translator_needed', ['rid1','rid2', 'nota'], 0)
   *
   */
  isChecked: function (name, id, index) {
    var checkbox;

    index = (typeof index !== 'undefined') ? parseInt(index, 10) : null;

    // first check if the name is defined
    if (this.master[name] !== null && typeof this.master[name] !== 'undefined' && this.master[name].type === 'checkbox') {
      checkbox = (index !== null && !isNaN(index)) ? this.master[name].values[name][index] : this.master[name].values[name];

      if (typeof checkbox === 'undefined' || checkbox === null || checkbox === "" || checkbox === "[]" || checkbox === "[,]") {
        return false;
      }

      // checkbox to see if id is an array
      if (Array.isArray(id)) {
        // if we don't find the id on any iteration the function returns false
        for (var i = 0; i < id.length; i+=1) {
          if (JSON.parse(checkbox).indexOf(id[i]) === -1) {
            return false;
          } 
        }
        // if we get through the loop that means each id was OK 
        return true;
      } 

      // we need to parse the stringified array and check if the supplied id is in it
      if (JSON.parse(checkbox).indexOf(id) >= 0) {
        return true;
      }
      
    } 
    return false;
  },
  /**
   * Returns the value (or values, if array) of the given answer as a string.
   *
   * @name {string} The name of the variable to return the values for.
   * @index {int} Optional loop index
   *
   */
  get: function (name, index) {
    if (index !== null && typeof index !== 'undefined') {
      if (this.master[name] !== null && typeof this.master[name] !== 'undefined') {
        if (this.master[name].values[name][index] !== null && typeof this.master[name].values[name][index] !== 'undefined' && this.master[name].values[name][index] !== '') {
          return this.master[name].values[name][index].toString().trim();
        } 
      }
    } else {
      if (this.master[name] !== null && typeof this.master[name] !== 'undefined') {
        if (this.master[name].values[name] !== null && this.master[name].values[name] !== '' && this.master[name].values[name].length !== 0) {
          return this.master[name].values[name].toString().trim();
        }
      } 
    }
    
    return '';
  },
  /**
   * Exits a stylesheet. This function is used to determine if we want to add the stylesheet or not.
   * Sometimes a stylesheet depends on the value of a variable, so if this is called all processing
   * on the stylesheet is abandoned. It is best to check this at the beginning of a style sheet.
   *
   */
  exit: function () {
    throw "exit";
  }
};


// These are all the standard functions for use in the interview
exports.interview = {
  /**
   * Checks if a variable was answered and has a value (not empty string).
   * THIS IS DIFFERENT THAN THE STYLESHEET FUNCTION because we must pass the variable instead of a string.
   * When a variable in the form isAnswered(varname[counter]), both the array varname['one','two'] 
   * and the counter 0 get passed individually into the function.
   *
   * @name {answer} The variable we are checking
   *
   * Examples
   *
   * isAnswered(q16_1[counter1])
   * isAnswered(q16_1)
   *
   */
  isAnswered: function (answer) {
    if (answer !== null && answer !== '' && typeof answer !== 'undefined' && answer !== 'undefined') {
      return true;
    }
    return false;
  },
  // id can be an array of ids to check...they one of them is not checked false is returned
  // ischecked(varname[counter], 'id') - if this is usage than the answer will be stringified array of arrays
  // ischecked(varname, 'id') - if this is usage than the answer will be stringified array

  /**
   * Returns a boolean true/false whether or not a checkbox id is checked in the interview
   * To lookup if NOTA was checked, pass in 'nota' as the @id parameter.
   *
   * @answer {variable} The variable which stores the checkbox id's
   * @id {string, array} The ID to lookup
   *
   * Examples
   *
   * ischecked(varname[counter], 'id')
   * ischecked(varname[counter], ['id1','id2'])
   * ischecked(varname, 'id')
   *
   */
  isChecked: function (answer, id) {
    //first check if the answer is an array (normal checkbox), or an array of arrays (checkbox inside loop)
    answer = JSON.parse(answer);

    if (Array.isArray(answer)) {
      // now the answer is an array of id's
      // CHECK IF THE INPUT WAS AN Array
      if (Array.isArray(id)) {
        for (var i = 0; i < id.length; i+=1) {
          if (answer.indexOf(id[i]) === -1) {
            return false;
          } 
        }
        // if we get through the loop that means each id was OK 
        return true;
      }

      // the id is just a string
      if (answer.indexOf(id) >= 0) {
        return true;
      }
    }
    return false;
  }
};
