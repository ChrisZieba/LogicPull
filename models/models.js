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

var mongoose = require('mongoose'),
	config = require('../config'),
	Schema = mongoose.Schema;

// For interviews that are being working on
var tmps_schema = new Schema({
	id : { type: Number, required: true },
	current : { type: Number, required: true },
	created: { type: Date, default: Date.now },
	last_modified: { type: Date, default: Date.now },
	// this will hold an aray containing the id to each question_schema, which has the state of the interview after each question
	progress : { type: Schema.Types.Mixed, required: true },
	history : { type: Schema.Types.Mixed, required: true }
});

// Store each question in its own document to increas eperformacne while the intewview is being worked on
var states_schema = new Schema({
	id : { type: Number, required: true },
	// reference the master record, which hold
	//tmp_id : { type: Number, required: true },
	created: { type: Date, default: Date.now },
	last_modified: { type: Date, default: Date.now },
	// contains the mater object, which hold the the state of the interview
	data : { type: Schema.Types.Mixed, required: true }
});


// For interviews that are to be saved
var saves_schema = new Schema({
	id : { type: Number, required: true },
	user_id : { type: Number, required: true },
	interview_id : { type: Number, required: true },
	socket_id : { type: String, required: true },
	qid : { type: String, required: false },
	note : { type: String, required: false },
	created: { type: Date },
	last_modified: { type: Date },
	interview : { type: Schema.Types.Mixed, required: true },
	data : { type: Schema.Types.Mixed, required: true }
});


// The Counter model
var counter_schema = new Schema({
	tmp_count : { type: Number, required: true },
	saved_count : { type: Number, required: true },
	state_count : { type: Number, required: true },
	user_count : { type: Number, required: true },
	group_count : { type: Number, required: true },
	interview_count : { type: Number, required: true },
	output_count : { type: Number, required: true }
});

// The Group model
var group_schema = new Schema({
	id : { type: Number, required: true },
	name : { type: String, required: true },
	description : { type: String, required: true }
});

// The Interview model
var interview_schema = new Schema({
	id : { type: Number, required: true },
	name  : { type: String, required: true },
	// this is for internal use only, when an interview is deleted, dont remove it just disable it
	disabled : { type: Boolean, default: false, required: true },
	creator : { type: Number, required: true },
	group : { type: Number, required: true },
	locked : { type: Boolean, default: false, required: true },
	description : { type: String, required: true },
	live : { type: Boolean, default: false, required: true },
	creation_date: { type: Date, default: Date.now },
	edit_url : { type: String, required: true },
	stage_url : { type: String, required: true },
	live_url : { type: String, required: true },
	start : { type: String, required: true },
	steps : { type: [String], required: true },
	deliverables: { type: [Schema.Types.Mixed] },
	on_complete : { type: Schema.Types.Mixed },
	distance : { type: Schema.Types.Mixed, required: false },
	data : { type: Schema.Types.Mixed, required: true }
});

// The output model
var output_schema = new Schema({
	id : { type: Number, required: true },
	client_lastname : { type: String, required: true },
	client_firstname : { type: String, required: true },
	client_fullname : { type: String, required: true },
	interview : { type: Schema.Types.Mixed, required: true },
	deliverables: { type: [Schema.Types.Mixed], required: true },
	answers: { type: Schema.Types.Mixed },
	date: { type: Date, default: Date.now }
});

// The User model
var user_schema = new Schema({
	id : { type: Number, required: true },
	name : { type: String, required: true },
	email : { type: String, required: true },
	password : { type: String, required: true },
	group : { type: Number, required: true },
	privledges : { type: Schema.Types.Mixed, required: true },
	created: { type: Date, default: Date.now },
	reset_date: { type: Date, required: false },
	reset_token :  { type: String, required: false }
});

// Store users info who have been added via the manager and who must activate their account 
var inactive_schema = new Schema({
	type : { type: String, required: true },
	email : { type: String, required: true },
	group : { type: Number, required: true },
	privledges : { type: Schema.Types.Mixed, required: true },
	created: { type: Date, default: Date.now },
	activate_date: { type: Date, required: false },
	activate_token :  { type: String, required: false }
});

var db;

if (process.env.NODE_ENV === 'development') {
	db = mongoose.createConnection(config.development.mongo_host, config.development.mongo_db);
} else {
	db = mongoose.createConnection(config.production.mongo_host, config.production.mongo_db);
}

// MONGO APPENDS AN 'S' SO JUST MAKE NAMES THAT END IN 'S"' TO AVOID CONFUSION
var Inactives = db.model('Inactives', inactive_schema);
var Tmps = db.model('Tmps', tmps_schema);
var States = db.model('States', states_schema);
var Saves = db.model('Saves', saves_schema);
var Counters = db.model('Counters', counter_schema);
var Groups = db.model('Groups', group_schema);
var Interviews = db.model('Interviews', interview_schema);
var Outputs = db.model('Outputs', output_schema);
var Users = db.model('Users', user_schema);

exports.Inactives = Inactives;
exports.Tmps = Tmps;
exports.States = States;
exports.Saves = Saves;
exports.Counters = Counters;
exports.Groups = Groups;
exports.Interviews = Interviews;
exports.Outputs = Outputs;
exports.Users = Users;