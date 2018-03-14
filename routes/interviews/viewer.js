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

var fs = require('fs'),
    sanitizor = require('../../lib/validation/sanitizor'),
    validator = require('../../lib/validation/validator'),
    models = require('../../models/models'),
    utils = require('../../lib/utils'),
    auth = require('../../middleware/manager/auth'),
    process = require('../../lib/interviews/process');

module.exports = function (app) {
  "use strict";

  app.post('/interviews/active/:interview/', [
    auth.validated, 
    auth.validateInterview, 
    auth.validateUserGroup, 
    auth.privledges('editor_save')], function (req, res) {
    var doc = res.locals.interview;
    var data = req.body;


  });
};