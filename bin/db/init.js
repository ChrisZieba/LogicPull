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

db.inactives.remove();
db.tmps.remove();
db.states.remove();
db.saves.remove();
db.users.remove();
db.groups.remove();
db.interviews.remove();
db.outputs.remove();
db.counters.remove();
db.sessions.remove();
db.dropDatabase();

db.groups.insert({
    "id" : 1,
    "name": "Admin",
    "description": "Admin"
});

db.users.insert({
    "id" : 1,
    "name": "Admin",
    // the username is admin
    "email": "admin@fake.com",
    // the password is admin
    "password": "$2a$10$3kMpzJvLoXuhfH.e5ovJCuULLpawqUXkZYTYi/AYO2TLDSDWPW3ra",
    "group": 1,
    "privledges": {
        "add_interview": true,
        "clone_interview": true,
        "remove_interview": true,
        "edit_interviews": true,
        "change_interview_status": true,
        "view_users": true,
        "edit_user": true,
        "add_user": true,
        "reset_user_password": true,
        "remove_user": true,
        "add_deliverable": true,
        "remove_deliverable": true,
        "update_deliverable": true,
        "lock_interview": true,
        "edit_privledges": true,
        "download_deliverable": true,
        "download_stylesheet": true,
        "download_answer_set": true,
        "view_report": true,
        "view_completed_interviews": true,
        "view_saved_interviews": true,
        "edit_on_complete": true,
        "editor_save": true
    },
    "created": new ISODate("2013-12-01T22:00:00.000Z")
});

// Keep track of counts
db.counters.insert({
    "inactives": 0,
    "tmp_count":0,
    "state_count": 0,
    "saved_count":0,
    "user_count": 1,
    "group_count": 1,
    "interview_count": 0, 
    "output_count": 0
});