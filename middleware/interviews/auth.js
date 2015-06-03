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

var models = require('../../models/models'),
  sanitizor = require('../../lib/validation/sanitizor'),
  validator = require('../../lib/validation/validator');

/**
 * Validate a user is logged in
 *
 */
exports.validated = function (req, res, next) {
  if (req.session.user) {
    if (req.session.user.authenticated) {
      next();
    } else {
      res.redirect('/admin/login');
    }
  } else {
    res.redirect('/admin/login');
  }
};

/**
 * If the user is already authenticated, skip the login screen, and 
 * go to the admin section...this gets called when visiting the login page
 *
 */
exports.login = function (req, res, next) {
  if (req.session.user) {
    if (req.session.user.authenticated) {
      res.redirect('/admin'); 
    } else {
      next();
    }
  } else {
    next();
  }
};

/**
 * This gets called before showing an interview to see if the URL parameter was valid
 * attach the interview data to the locals object so we don't have to query the database again later
 *
 */
exports.validateInterview = function (req, res, next) {
  // this is the id of the interview the user is trying to view
  var interview = req.params.interview;

  // validate the id, if its not valid we don't even bother checking the privileges
  if (!validator.check(sanitizor.clean(interview), ['required','integer'])) {
    res.status(404).render('admin/404', {name: ''});  
    return;
  }

  // if the input is valid, get the data for the interview being requested
  models.Interviews.findOne({ 'id': interview }, function (err, doc) {
    if (err) {
      console.log(err);
      throw err;
    }

    // check to see if anything was returned
    if (doc) {
      // attach the interview data to the locals object, so we don't have to query the database again
      res.locals.interview = doc;
      next();
    } else {
      res.redirect('/admin'); 
    }
  });

};


/**
 * This function checks to make sure that the interview a user is trying to view (in admin) is from the same group
 *
 */
exports.validateUserGroup = function (req, res, next) {
  // check to see if the user is trying to view an interview that is outside their group
  // allow userID 1 (admin) to see all interviews
  if ((req.session.user.group !== res.locals.interview.group) && req.session.user.id !== 1) {
    res.status(404).render('interviews/404', {name: req.session.user.name});  
  } else {
    // if we get here the interview is in the database and everything is OK (valid)
    next();
  }
};


/**
 * This gets called before showing the reset form we need to see
 * if the token is actually in the database, AND, it hasn't expired
 *
 */
exports.validateResetToken = function (req, res, next) {
  // this is the token from the URL
  var clean_token = sanitizor.clean(req.params.reset_token);

  // if the token is not in any users 
  if (!validator.check(clean_token, ['required'])) {
    res.status(404).render('interviews/404', {name: ''}); 
    return;
  }

  // look up the token in the user table
  models.Users.findOne({ 'reset_token': clean_token }, function (err, user) {
    if (err) {
      console.log(err);
      throw err;
    }
    // check to see if anything was returned
    if (!user) {
      res.status(404).render('interviews/404', {name: ''});
      return;
    }

    // now check to see the current date is not ahead of the token date by more than 2 hours
    // 2 hours = 7200000 ms
    if (user.reset_date.getTime() + 7200000 <= new Date().getTime()) {
      res.status(404).render('interviews/404', {name: ''});
      return;
    }

    res.locals.user = {
      id : user.id,
      email: user.email
    };
    res.locals.reset_token = user.reset_token;
    next();
  });
};