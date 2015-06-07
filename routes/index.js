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

var mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  auth = require('../middleware/interviews/auth'),
  fs = require('fs'),
  nodemailer = require("nodemailer"),
  models = require('../models/models'),
  sanitizor = require('../lib/validation/sanitizor'),
  validator = require('../lib/validation/validator');


module.exports = function (app) {
  "use strict";

  app.get('/', function (req, res) {
    var interviews = models.Interviews.find({});

    // make sure the group id of the logged in user matches that from the URL
    interviews = interviews.where('disabled').equals(false).where('live').equals(true);
    interviews.exec(function(err, interviews) {
      if (err) {
        console.log(err);
        throw err;
      }

      // send the output to the view
      res.render('index', { 
        title: 'LogicPull',
        layout: 'interviews',
        interviews: interviews,
      });
    });
  });
};
