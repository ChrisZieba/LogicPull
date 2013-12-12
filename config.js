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

exports.development = {

	// GENERAL

		// The port that nodeJS will listen on. This will be used in your Varnish and nginx configuration.
		server_port: "3000",

		// The home folder for the application. Must have a trailing slash!
		base_location: "/home/zieba/Projects/LP/",

		// The URL that will be used by the application.
		base_url: "http://logicpull.local:3000",

		// If using virtual hosts, set a default/base. This used as the cookie domain to 
		// allow the user to stay logged in over multiple subdomains.
		base_vhost: "logicpull.local",

		// The server mongodb is on. If ;127.0.0.1' does not work, try 'localhost'.
		mongo_host: "127.0.0.1",

		// The name of the database.
		mongo_db: "LogicPull",

		// The server port mongodb is using
		mongo_port: "27017",

		// The folder location of the Apache FOP binary. Make sure there is a trailing slash!
		fop_location: "/home/zieba/Documents/fop-1.1/",

	// EMAIL 

		// this is the default email where notifications are sent. The manager allows you to set the BCC field
		email_notifications_to: "info@logicpull.com",

		// this is the default email where deliverables are sent. The manager allows you to set the BCC field
		email_deliverables_to: "info@logicpull.com",

		// The email address for the administrator of the application. 
		email_admin: "zieba.chris@gmail.com",

		// emails sent by LogicPull (notifications, deliverables, etc.) will be from this email address
		email_from: "Support <support@logicpull.com>",
		
		// The user to authenticate when connecting to the email server
		email_auth_user: "info@logicpull.com",

		// The user to authenticate when connecting to the email server
		email_host: "mail.server.com",
		
		// The password to authenticate when connecting to the email server
		email_auth_pass: "some_password",

		// If this is set to true then this will override the setting in the
		// manager to ask the client for an email that will receive the processed documents
		disable_email_on_complete: false,

		// this will disable any emails that get sent after an interview is completed
		disable_email_notifications: false,

		// This will disable any emails that get sent out when a new user is registered.
		// You will have to manually activate a new user by checking the inactives database table.
		disable_email_new_users: false,

		// this will disable any emails with deliverables attached
		disable_email_deliverables: false,

		// this will disable any emails sent out when a password reset is requested
		disable_email_password_reset: false,


	// GRAPHVIZ

		// Graphviz is used in the editor to tidy the graph, 
		disable_graphviz_tidy: false,

		// Display a fraction of the progress through the interview (i.e 1 of 219)
		disable_graphviz_progress: false,

	// SOCKET

		// 24h time out
		socket_close_timeout: 60*60*24, 

		// send minified client
		socket_browser_client_minification: true,

		// apply etag caching logic based on version number
		socket_browser_client_etag: true,

		// gzip the file
		socket_browser_client_gzip: true,

		// reduce logging
		socket_log_level: 2,

		// ssl support
		socket_match_origin_protocol: true,

		socket_sync_disconnect_on_unload: true,

		// enable all transports (optional if you want flashsocket)
		socket_transports: ['websocket','xhr-polling','htmlfile','jsonp-polling','flashsocket'],

		// this is the default port used for the flash socket transport. 
		// change if you are running multiple socket servers with flash socket transport enabled
		socket_flash_policy_port: 10843
};

exports.production = {
	// GENERAL

		// The port that nodeJS will listen on. This will be used in your Varnish and nginx configuration.
		server_port: "3000",

		// The home folder for the application. Must have a trailing slash!
		base_location: "/srv/www/LogicPull/",

		// The URL that will be used by the application.
		base_url: "http://www.yoursite.com",

		// If using virtual hosts, set a default/base. This used as the cookie domain to 
		// allow the user to stay logged in over multiple subdomains.
		base_vhost: "yoursite.com",

		// The server mongodb is on. If ;127.0.0.1' does not work, try 'localhost'.
		mongo_host: "127.0.0.1",

		// The name of the database.
		mongo_db: "LogicPull",

		// The server port mongodb is using
		mongo_port: "27017",

		// The folder location of the Apache FOP binary. Make sure there is a trailing slash!
		fop_location: "/opt/fop-1.1/",

	// EMAIL 

		// this is the default email where notifications are sent. The manager allows you to set the BCC field
		// e.g. info@comcast.com
		email_notifications_to: "",

		// this is the default email where deliverables are sent. The manager allows you to set the BCC field
		// e.g. info@comcast.com
		email_deliverables_to: "",

		// The email address for the administrator of the application, e.g. info@comcast.com
		email_admin: "",

		// emails sent by LogicPull (notifications, deliverables, etc.) will be from this email address
		// e.g. Support <support@comcast.com>
		email_from: "",
		
		// The user to authenticate when connecting to the email server, e.g. info@comcast.com
		email_auth_user: "",

		// The user to authenticate when connecting to the email server, e.g. mail.comcast.com
		email_host: "",
		
		// The password to authenticate when connecting to the email server
		email_auth_pass: "",

		// If this is set to true then this will override the setting in the
		// manager to ask the client for an email that will receive the processed documents
		disable_email_on_complete: false,

		// this will disable any emails that get sent after an interview is completed
		disable_email_notifications: false,

		// This will disable any emails that get sent out when a new user is registered.
		// You will have to manually activate a new user by checking the inactives database table.
		disable_email_new_users: false,

		// this will disable any emails with deliverables attached
		disable_email_deliverables: false,

		// this will disable any emails sent out when a password reset is requested
		disable_email_password_reset: false,


	// GRAPHVIZ

		// Graphviz is used in the editor to tidy the graph, 
		disable_graphviz_tidy: false,

		// Display a fraction of the progress through the interview (i.e 1 of 219)
		disable_graphviz_progress: false,

	// SOCKET

		// 24h time out
		socket_close_timeout: 60*60*24, 

		// send minified client
		socket_browser_client_minification: true,

		// apply etag caching logic based on version number
		socket_browser_client_etag: true,

		// gzip the file
		socket_browser_client_gzip: true,

		// reduce logging
		socket_log_level: 2,

		// ssl support
		socket_match_origin_protocol: true,

		socket_sync_disconnect_on_unload: true,

		// enable all transports (optional if you want flashsocket)
		socket_transports: ['websocket','xhr-polling','htmlfile','jsonp-polling','flashsocket'],

		// this is the default port used for the flash socket transport. 
		// change if you are running multiple socket servers with flash socket transport enabled
		socket_flash_policy_port: 10843
};