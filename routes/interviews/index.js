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

var mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  auth = require('../../middleware/interviews/auth'),
  fs = require('fs'),
  nodemailer = require("nodemailer"),
  models = require('../../models/models'),
  sanitizor = require('../../lib/validation/sanitizor'),
  validator = require('../../lib/validation/validator');

module.exports = function (app) {
  "use strict";

  // This is the live interview available to anyone
  app.get('/interviews/active/:interview', [auth.validateInterview], function (req, res) {
    var interview = res.locals.interview;

    // This checks to see if the interview is live
    if (interview.live) {
      res.render('interviews/viewer', {
        title: 'LogicPull - Interview ' + interview.name,
        id: interview.id,
        description: interview.description,
        name: interview.name,
        env: app.settings.env,
        user: (req.session.user && req.session.user.name) ? req.session.user.name : null
      });
    } else {
      res.status(404).render('interviews/404', {name: ''}); 
    }
  });
};
