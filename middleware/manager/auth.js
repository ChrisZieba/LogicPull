/*	Copyright 2013 Chris Zieba <zieba.chris@gmail.com>

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
		// groups with the val 0 are users who register during an interview
		if (req.session.user.authenticated) {
			if (req.session.user.group > 0) {
				next();
			} else {
				// the user is logged in but NOT an admin user
				res.redirect('/interviews');
			}
		} else {
			res.redirect('/manager/login');
		}
	} else {
		res.redirect('/manager/login');
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
			if (req.session.user.group > 0) {
				res.redirect('/manager');
			} else {
				// the user is logged in but NOT an admin user
				res.redirect('/interviews');
			}
		} else {
			// show the login form
			next();
		}
	} else {
		// show the login form
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
		res.status(404).render('404', { name: '' });	
		return;
	}

	// if the input is valid, get the data for the interview being requested
	models.Interviews.findOne({ 'id': interview, 'disabled': false }, function (err, doc) {
		if (err) {
			console.log(err);
			throw err;
		} 
		// check to see if anything was returned
		if (!doc) {
			res.redirect('/manager');
			return;
		}

		// attach the interview data to the locals object, so we don't have to query the database again
		res.locals.interview = doc;
		next();
	});

};

/**
 * This function checks to make sure that the interview a user is trying to view (in admin) is from the same group
 *
 */
exports.validateUserGroup = function (req, res, next) {
	// the res.locals var is populated in the validateInterview function and attaches there
	// allow userID 1 (admin) to see all interviews
	if ((req.session.user.group !== res.locals.interview.group) && req.session.user.id !== 1) {
		res.status(404).render('404', { name: req.session.user.name });	
	} else {
		// if we get here the interview is in the database and everything is OK (valid)
		next();
	}
};

/**
 * Check to see if the index of the deliverable is valid
 *
 */
exports.validateDeliverable = function (req, res, next) {
	// this is the array index id of the interview the user is trying to view
	var deliverable = req.params.deliverable;

	// if its not valid we don't even bother checking any further
	if (!validator.check(sanitizor.clean(deliverable), ['required','integer'])) {
		res.redirect('/manager/interview/' + res.locals.interview.id);	
		return;
	}

	// if the index is in the array then we are golden
	if (res.locals.interview.deliverables[deliverable] === null || typeof res.locals.interview.deliverables[deliverable] === 'undefined') {
		res.redirect('/manager/interview/' + res.locals.interview.id);
		return;
	}

	// if the index actually points to an element in the array, then we are validated
	res.locals.deliverable = {
		id: deliverable,
		name: res.locals.interview.deliverables[deliverable].input.name
	};
	next();
};


/**
 * Make sure a user has the rights to perform an action before continuing
 *
 */
exports.privledges = function (privledge) {
	return function (req, res, next) {
		// this is the users id
		var id = req.session.user.id;
		var back_link;
		// this is true if permission is granted, and false otherwise
		var granted = req.session.user.privledges[privledge];

		switch (privledge) {
			case 'add_interview':
			case 'clone_interview':
			case 'remove_interview':
			case 'edit_interviews':
			case 'view_users':
			case 'download_deliverable':
			case 'view_completed_interviews':
				back_link = '/manager';
				break;
			case 'change_interview_status':
			case 'add_deliverable':
			case 'remove_deliverable':
			case 'lock_interview':
			case 'view_report':
			case 'update_deliverable':
			case 'edit_on_complete':
				back_link = '/manager/interview/' + res.locals.interview.id;
				break;
			case 'edit_user':
			case 'add_user':
			case 'remove_user':
				back_link = '/manager/users';
				break;
		}

		req.session.back = back_link;

		// if the user is trying to edit their own interview, this is always allowed, regardless if edit_interviews is set to false
		if (privledge === 'edit_interviews') {
			// the creator gets attached in the previous middleware (validate) , if the interview is in the database and if the user is from the group
			if (id === res.locals.interview.creator) {
				next();
			} else {
				res.redirect('/manager/error');                    
			}
		}else {
			if (granted) {
				next();
			} else {
				res.redirect('/manager/error');                    
			}	
		}
	};
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
		res.status(404).render('404', { name: '' });
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
			res.status(404).render('404', { name: '' });
			return;
		}

		// now check to see the current date is not ahead of the token date by more than 2 hours
		// 2 hours = 7200000 ms
		if (user.reset_date.getTime() + 7200000 <= new Date().getTime()) {
			res.status(404).render('404', { name: '' });
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

// this gets called before showing the activate form 
// we need to see if the token is actually in the database, AND, it hasn't expired
exports.validateActivateToken = function (req, res, next) {
	// tis is the token from the URL
	var clean_token = sanitizor.clean(req.params.activate_token);

	// if the token is not in any users 
	if (!validator.check(clean_token, ['required'])) {
		res.status(404).render('404', { name: '' });
		return;
	}

	// look up the token in the user table
	models.Inactives.findOne({ 'activate_token': clean_token }, function (err, user) {
		if (err) {
			console.log(err);
			throw err;
		} 

		// check to see if anything was returned
		if (!user) {
			res.status(404).render('404', { name: '' });
			return;
		}

		// now check to see the current date is not ahead of the token date by more than 2 hours
		// 2 hours = 7200000 ms
		if (user.activate_date.getTime() + 7200000 <= new Date().getTime()) {
			res.status(404).render('404', { name: '' });
			return;
		}

		res.locals.inactive_user = {
			email: user.email,
			privledges: user.privledges,
			group: user.group,
			// this is new or existing
			type: user.type
		};

		next();
	});
};