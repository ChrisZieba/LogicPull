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
    "email": "admin",
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
        "edit_on_complete": true,
        "editor_save": true
    },
    "created": new ISODate("2013-12-01T22:00:00.000Z")
});

// Keep track of counts (how many in database currently)
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

/*
db.interviews.insert({
    "id" : 1,
    "name"  : 'Test',
    "disabled": false,
    "creator" : 1,
    // am interview can only belong to one group
    "group": 1,
    // a locked interview cannot be edited, but it can be viewed in the editor
    "locked": false,
    "description" : 'Test Interview',
    // a true here means the interview can be viewed publically
    "live" : true,
    "creation_date": new ISODate("2013-12-01T22:00:00.000Z"),
    "edit_url" : '/manager/interview/1/edit',
    "stage_url" : '/manager/interview/1/stage',
    "live_url" : '/interviews/active/1',
    "start": 'q1',
    "steps": [
        "Introduction"
    ],
    "on_complete": {
        "email_deliverables_to_client": false,
        "email_notification": "",
        "email_deliverables": ""
    },
    "deliverables": [],
    "distance": {
        "update": true,
        "graph": {}
    },

    "data": {
        "q0": {
            "_id": 0,
            "qid": 'q0',
            "name": 'First Question', // this is an optional user defined name
            "step": "Introduction", // this is the step
            "text_id": 'qt0', //this is textid
            "question_text": '<strong>q0</strong>', //this is the question text
            "loop1": null,
            "loop2": null,
            "learn_more": {
                "title": "",
                "body": ""
            }, //the learn more object contains a title and a body (iframe data)
            "buttons": [{
                    "type": 'continue',
                    "destination": 'q1',
                    "pid": 'p0'
                }],
            "help": [], //the help objects each contain an id and a body (iframe)
            "source_paths": [
                {
                    "pid": 'p0',
                    "s": 'q0',
                    "d": 'q1',
                    "stroke": '#FF9900',
                    "stroke_width": "3"
                    //"stroke_dasharray": "0"
                }
            ], // these are the path names that originiate from the question (source)
            "destination_paths": [], // these are paths that come into the question (destination)
            "fields": [], // this hold all the field (variable) objects
            "advanced": [],
            "node": {
                "x": 193,
                "y": 25,
                "width": 40,
                "height": 40,
                "fill": '#c6d5b0'
            }
        },
        "q1": {
            "_id": 1,
            "qid": 'q1',
            "name": 'b100',
            "step": "none",
            "text_id": 'qt1',
            "question_text": 'q1',
            "loop1": null,
            "loop2": null,
            "learn_more": {
                "title": 'what is my postal code', 
                "body": 'look here for mroe info'
            },
            "buttons": [],
            "help": [],
            "source_paths": [],
            "destination_paths": [
                {
                    "pid": 'p0',
                    "s": 'q0',
                    "d": 'q1',
                    "stroke": '#FF9900',
                    "stroke_width": "3"
                    //"stroke_dasharray": "0"
                }
            ],
            "fields": [],
            "advanced": [],
            "node": {
                "x": 193,
                "y": 125,
                "width": 40,
                "height": 40,
                "fill": '#c6d5b0'
            }
        }
    }
});
*/