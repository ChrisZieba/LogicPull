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

var bcrypt = require('bcryptjs'),
  fs = require('fs'),
  sanitizor = require('../../lib/validation/sanitizor'),
  validator = require('../../lib/validation/validator'),
  models = require('../../models/models'),
  utils = require('../../lib/utils'),
  auth = require('../../middleware/manager/auth'),
  process = require('../../lib/interviews/process');

module.exports = function (app) {
  "use strict";

  // This is editor
  app.get('/manager/interview/:interview/edit', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {
    var interview = res.locals.interview;
    // write the data to a file first, seems to be faster this way
    var filename = 'data_' + interview.id + '.js';
    var path = app.get('base_location') +  'public/javascripts/preload/' + filename;
    // this gets the current data from the database and writes it to a file
    var write = 'function data(){return ' + JSON.stringify(interview.data) + '};';

    fs.writeFile(path, write, function (err) {
      if (err) {
        console.log(err);
        throw err;
      } 

      // the steps and the description nned to be encoded to prevent character errors when loading
      for (var i = 0; i < interview.steps.length; i+=1) {
        interview.steps[i] = interview.steps[i].replace(/'/g, "&apos;").replace(/"/g, "&quot;");
      }

      var data = {
        interview: interview.id,
        data: filename,
        env: app.settings.env,
        interview_settings: {
          name: interview.name,
          description: interview.description.replace(/'/g, "&apos;").replace(/"/g, "&quot;").replace(/(\r\n|\n|\r)/gm, ""),
          start: interview.start,
          steps: JSON.stringify(interview.steps)
        }
      };
      res.render('manager/interviews/editor', data);
    });
  });

  app.post('/manager/interview/:interview/edit/save', [
    auth.validated, 
    auth.validateInterview, 
    auth.validateUserGroup, 
    auth.privledges('editor_save')], function (req, res) {
    var doc = res.locals.interview;
    var data = req.body;

    if (!doc) {
      return res.json({
        name: 'srv_error', 
        error: interview.error("The interview could not be found.").error.content, 
        valid: false
      });
    }

    doc.description = data.settings.description;
    doc.steps = data.settings.steps;
    doc.start = data.settings.start;
    doc.data = data.data;
    doc.distance = {
      update: true,
      graph: {}
    };
    doc.save(function(err) {
      res.json({ valid: true });
    });
  });

  app.post('/manager/interview/:interview/edit/graph', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {

  });

  app.post('/manager/interview/:interview/edit/graph_reorder', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {

  });

  app.post('/manager/interview/:interview/edit/get_saved_note', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {

  });

  app.post('/manager/interview/:interview/edit/get_saved_note', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('edit_interviews')], function (req, res) {

  });
};