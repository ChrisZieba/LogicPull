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

var bcrypt = require('bcrypt'),
  fs = require('fs'),
  sanitizor = require('../../lib/validation/sanitizor'),
  validator = require('../../lib/validation/validator'),
  models = require('../../models/models'),
  utils = require('../../lib/utils'),
  auth = require('../../middleware/manager/auth');

module.exports = function (app) {
  "use strict";

  // Add a new deliverable to an interview
  app.all('/manager/interview/:interview/deliverables/add',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('add_deliverable')], function (req, res) {
    var form = null;

    function view (template, msg) { 
      var data = {
        title: 'LogicPull | Add a Deliverable',
        name: req.session.user.name,
        layout:'add-deliverable',
        msg: msg
      };

      res.render(template, data);
    }

    if (req.method === 'POST') {
      // This is the interview attached in the auth.validateInterview middleware
      var interview = res.locals.interview;

      // Validate the input that came from the form, and make sure a file was chosen for upload
      if (validator.check(sanitizor.clean(req.body.description), ['required',{'maxlength': 100}]) && validator.check(sanitizor.clean(req.body.outname), ['required','filename',{'maxlength': 35}]) && req.files.file ) {
        // have to do another check here for the filename 
        if (req.files.file.name !== '' && req.files.file.size !== 0) {
          // this will move the uploaded file from the tmp folder to the uploads folder
          fs.rename(req.files.file.path, app.get('base_location') +  "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + req.files.file.name, function (err) {
            if (err) {
              console.log(err);
              throw err;
            } 

            // TODO: check if the output is pdf_form, and make sure we are given an fdf stylesheet, and make sure the blank pdf form is given
            if (req.body.output === 'pdf_form') {
              // check to make sure a blank pdf was given 
              if (req.files.pdf_form_file.name !== '' && req.files.pdf_form_file.size !== 0) {

                // this will move the blank form to the appropriate folder
                fs.renameSync(req.files.pdf_form_file.path, app.get('base_location') +  "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + req.files.pdf_form_file.name);

                form = {
                  name: req.files.pdf_form_file.name,
                  path: "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + req.files.pdf_form_file.name
                };

              } else {
                view('manager/layout', '<ul><li>You must include a blank pdf form for the output type "pdf (fillable)"</li></ul>');
              }
            }

            var deliverable = {
              // Use this when downloading a style sheet from the server
              id: require('crypto').createHash('md5').update(req.files.file.name + interview.id + interview.deliverables.length).digest("hex"),
              input : {
                // the type refers to what is being produced
                type: (req.body.output === 'pdf_form') ? 'fdf' : 'fo',
                name: req.files.file.name,
                path: "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + req.files.file.name,
                creator: {
                  id: req.session.user.id,
                  name: req.session.user.name
                },
                modified: new Date(),
                form: form,
                looper: (req.body.looper === 'yes') ? true : false
              },
              output: {
                type: req.body.output,
                name: req.body.outname,
                file: {
                  prepend_interview: (req.body.filename_prepend_interview === 'yes') ? true : false
                }
              },
              description: req.body.description
            };

            // save the new deliverable and redirect back to the interview
            interview.deliverables.push(deliverable);

            //update the interview in the database
            models.Interviews.update({id: interview.id}, {'deliverables': interview.deliverables}, function (err) {
              if(err) {
                console.log(err);
                throw err;
              } 
              res.redirect('manager/interview/' + interview.id);
            }); 
          });
        } else {
          view('manager/layout', '<ul><li>The input file must be a valid template file.</li><li>The Name of the output must be letters, numbers and/or underscores.</li><li>Please make sure the input type you selected matches the template language of the file uploaded.</li><li>The Description field is required.</li><li>The output type will be what format the final document will be created in, so you must make sure your template file is correct.</li></ul>');
        }
      } else {
        view('manager/layout', '<ul><li>The input file must be a valid template file.</li><li>Please make sure the input type you selected matches the template language of the file uploaded.</li><li>The Description field is required.</li><li>The output type will be what format the final document will be created in, so you must make sure your template file is correct.</li></ul>');
      }
    } else {
      // this is a get request...just show the form
      view('manager/layout', null);
    }
  });

  // Remove a deliverable
  app.all('/manager/interview/:interview/deliverables/remove/:deliverable', [auth.validated, auth.validateInterview, auth.validateUserGroup, auth.validateDeliverable, auth.privledges('remove_deliverable')], function (req, res) {
    if (req.method === 'POST') {
      // this is the interview id
      var interview = req.body.interview;
      // this is the index of the array which holds the deliverable we ant to delete
      var deliverable = req.body.deliverable;
      var deliverables = res.locals.interview.deliverables;

      // get rid of the last array element
      res.locals.interview.deliverables.splice(deliverable,1);

      // update the database
      models.Interviews.update({id: interview}, { deliverables: deliverables }, function (err) {
        if (err){
          console.log(err);
          throw err;
        } 
        // go back to the interview page on success
        res.redirect('manager/interview/' + interview);
      }); 
    } else {
      // the logic to see if an interview was valid is done in the middleware
      var data = {
        title: 'LogicPull | Remove an Interview',
        name: req.session.user.name,
        layout:'remove-deliverable',
      };

      res.render('manager/layout', data); 
    }
  });

  // This is the link we go to when we want to download a file
  app.get('/manager/download/deliverable/output/:id/:interview/:hash', auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('download_deliverable'), function (req, res) {
    // this is the id of the output 
    var id = req.params.id;
    var index; 
    // the hash that identifies which deliverable
    var hash = req.params.hash;

    if (validator.check(sanitizor.clean(id), ['required','integer']) && validator.check(sanitizor.clean(hash), ['required','alphanum'])) {
      // first check if the file requested even exists
      models.Outputs.findOne({ 'id': id }, 'deliverables', function (err, doc) {
        // TODO: sanitize input, store session data, handle errors
        if(err) {
          console.log(err);
          throw err;
        } 

        if (doc) {
          // look to see if the hash request matches with any of the deliverables
          index = utils.findIndex('id', hash, doc.deliverables);

          if (index >= 0) {
            res.download(app.get('base_location') + doc.deliverables[index].path, doc.deliverables[index].name, function(err){
              if (err) {
                console.log(err);
                throw err;
              } 
              res.end('success', 'UTF-8');
            });
          } else {
            // the hash is not in the array
            res.status(404).render('manager/404', {name: req.session.user.name});             
          }
        } else {
          // if the database does not return a document for the output
          res.status(404).render('manager/404', {name: req.session.user.name}); 
        }
      });
    } else {
      // if the inputs are not valid
      res.status(404).render('manager/404', {name: req.session.user.name}); 
    }
    return null;
  });

  // This is the link we go to when we want to download a file
  // the index is the array index the input file is at
  app.get('/manager/download/deliverable/stylesheet/:index/:interview/:hash', auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('download_stylesheet'), function (req, res) {
    // this is the array index of the deliverable
    var index = req.params.index;
      // the hash that identifies which deliverable...check if it matches the one in the database before a user can download the file
    var hash = req.params.hash;
      // the interview attached in the middleware check
    var interview = res.locals.interview;

    // the interview id gets cleaned and checked in the middleware
    if (validator.check(sanitizor.clean(index), ['required','integer']) && validator.check(sanitizor.clean(hash), ['required','alphanum'])) {
      // the deliverables will already be attached to the locals variable once getting here
      // just check to make sure the hash given to us in the parameter matches that from the database
      if (interview.deliverables[index].id === hash) {
        res.download(app.get('base_location') + interview.deliverables[index].input.path, interview.deliverables[index].input.name, function(err) {
          if (err) {
            console.log(err);
            throw err;
          } 
          res.end('success', 'UTF-8');
        });
      } else {
        // the hash is not in the database
        res.status(404).render('manager/404', {name: req.session.user.name}); 
      }
    } else {
      // if the inputs are not valid
      res.status(404).render('manager/404', {name: req.session.user.name}); 
    }

    return null;
  });

  // Download a form from a deliverable (if it has one)
  app.get('/manager/download/deliverable/form/:index/:interview/:hash', auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('download_stylesheet'), function (req, res) {
    // this is the array index of the deliverable
    var index = req.params.index;
      // the hash that identifies which deliverable...check if it matches the one in the database before a user can download the file
    var hash = req.params.hash;
      // the interview attached in the middleware check
    var interview = res.locals.interview;

    // the interview id gets cleaned and checked in the middleware
    if (validator.check(sanitizor.clean(index), ['required','integer']) && validator.check(sanitizor.clean(hash), ['required','alphanum'])) {
      // the deliverables will already be attached to the locals variable once getting here
      // just check to make sure the hash given to us in the parameter matches that from the database
      if (interview.deliverables[index].id === hash) {
        // form is null if not a PDF_FORM
      if (interview.deliverables[index].input.form) {
          res.download(app.get('base_location') + interview.deliverables[index].input.form.path, interview.deliverables[index].input.form.name, function(err) {
            if (err) {
              console.log(err);
              throw err;
            } 
            res.end('success', 'UTF-8');
          });
        } else {
          res.status(404).render('manager/404', {name: req.session.user.name});
        }
      } else {
        // the hash is not in the database
        res.status(404).render('manager/404', {name: req.session.user.name}); 
      }
    } else {
      // if the inputs are not valid
      res.status(404).render('manager/404', {name: req.session.user.name}); 
    }

    return null;
  });

  // Update a deliverable
  app.all('/manager/interview/:interview/deliverables/update/:deliverable',[auth.validated, auth.validateInterview, auth.validateUserGroup, auth.privledges('update_deliverable')], function (req, res) {
    // this is the interview attached in the auth.validateInterview middleware
    var interview = res.locals.interview;
    var old_deliverable;

    function view (template, msg) { 
      var data = {
        title: 'LogicPull | Update a Deliverable',
        name: req.session.user.name,
        layout:'update-deliverable',
        deliverable: interview.deliverables[req.params.deliverable],
        msg: msg
      };
      res.render(template, data);
    }

    // If the deliverable given to use is not good, go to admin
    if (! interview.deliverables[req.params.deliverable]) {
      res.redirect('/manager/interview/' + interview.id);
      return null;
    }
    
    old_deliverable = interview.deliverables[req.params.deliverable];
    
    // Take the file entered and replace it with the new one
    if (req.method === 'POST') {
      // Validate the input that came from the form, and make sure a file was chosen for upload, and that the deliverable exists
      if (req.files.file) {
        // Have to do another check for the filename 
        if (req.files.file.name !== '' && req.files.file.size !== 0 && req.files.file.size !== 'application/octet-stream') {
          // Ignore the name of the file entered and use the name from the deliverable
          // this will move the uploaded file from the tmp folder to the uploads folder
          fs.rename(req.files.file.path, app.get('base_location') + "uploads/deliverables/" + interview.name + "-" + interview.id + "/" + old_deliverable.input.name, function (err) {
            if (err) {
              console.log(err);
              throw err;
            }

            // Replace the old deliverable
            interview.deliverables[req.params.deliverable] = {
              // use this when downloading  a style sheet from the server
              id: old_deliverable.id,
              input : {
                type: old_deliverable.input.type,
                name: old_deliverable.input.name,
                path: old_deliverable.input.path,
                // update
                creator: {
                  id: req.session.user.id,
                  name: req.session.user.name
                },
                modified: new Date(),
                form: old_deliverable.input.form,
                looper: old_deliverable.input.looper
              },
              output: {
                type: old_deliverable.output.type,
                // Keep this an empty string since we wont know the name until we are done the interview (use input)
                name: old_deliverable.output.name,
                file: {
                  prepend_interview: (req.body.filename_prepend_interview === 'yes') ? true : false 
                }
              },
              description: old_deliverable.description
            };

            // Update the interview in the database
            models.Interviews.update({id: interview.id}, {'deliverables': interview.deliverables}, function (err) {
              if(err){
                console.log(err);
                throw err;
              }
              res.redirect('manager/interview/' + interview.id);
            }); 
          });
        } else {
          view('manager/layout', '<ul><li>The input file must have an <strong>extenstion of .ejs</strong> and be a valid template file.</li><li>Please make sure the input type you selected matches the template language of the file uploaded.</li><li>The Description field is required.</li><li>The output type will be what format the final document will be created in, so you must make sure your template file is correct.</li></ul>');
        }
      } else {
        view('manager/layout', '<ul><li>The input file must have an <strong>extenstion of .ejs</strong> and be a valid template file.</li><li>Please make sure the input type you selected matches the template language of the file uploaded.</li><li>The Description field is required.</li><li>The output type will be what format the final document will be created in, so you must make sure your template file is correct.</li></ul>');
      }
    } else {
      // This is a get request...just show the form
      view('manager/layout', null);
    }
  }); 
};