/*  Copyright 2013 Chris Zieba <zieba.chris@gmail.com>

    This program is free software: you can redistribute it and/or modify it under the terms of the GNU
    Affero General Public License as published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.
    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
    PURPOSE. See the GNU Affero General Public License for more details. You should have received a
    copy of the GNU Affero General Public License along with this program. If not, see
    <http://www.gnu.org/licenses/>.
*/

var Viewer = Viewer || {};

Viewer.socket = (function() {

	"use strict";

	var socket;
	var editor_id = null;
	var interview_begin = true;

	var getParameterByName = function (name) {
		name = name.replace(/[\[]/, "\\\\[").replace(/[\]]/, "\\\\]");
		var s = "[\\?&]" + name + "=([^&#]*)";
		var regex = new RegExp(s);
		var results = regex.exec(window.location.search);

		if (results === null) {
			return "";
		} 

		return decodeURIComponent(results[1].replace(/\+/g, " "));
	};

	return {
		
		init: function() {
			socket = io.connect(BASE_URL);

			socket.on('connect', function () {
				// only let the interview start once
				if (interview_begin) {
					var preview = null; 
					var start = null;

					interview_begin = false;

					// check to see if we are in preview mode. If true, than get the editro_id from the query string, passed from the editor
					// check the query string
					if (window.location.search) {
						preview = getParameterByName('preview');
						editor_id = getParameterByName('id');
						start = getParameterByName('start');

						// send the id back to the server and attach it to the client socket 
						socket.emit('editor_id', editor_id);
					}

					var interview_id = $('#interview-id').html();

					// either we are starting from the middle somewhere or the beginning as defined in the settings
					if (interview_id) {
						socket.emit('start', {
							interview_id: interview_id,
							start: start,
							preview: preview
						});
					}
				}
			});

			// this is when the server returns with wither the question to display, or the error from the question that failed validate
			socket.on('question', function (packet) {
				Viewer.interview.setFinishGate(true);
				Viewer.interview.setCompleteGate(true);
				Viewer.interview.setContinueGate(true);
				Viewer.interview.setPartialGate(true);
				// set the id of the socket that corresponds to the database record for the saved data
				Viewer.interview.setInterviewID(packet.id);

				// get rid of the loader
				$('.continue-button').css('background-position','-298px -8px');
				$('.finish-button').css('background-position','-432px -8px');

				$('.loading').remove();
				//$('.loading-button').addClass('continue-button button');
				//$('button').removeClass('loading-button');
				// if the validation cleared for all the fields

				if (packet.valid) {
					// if the questions is being loaded from a partial hide the saves container
					if (packet.partial) {
						// hide the login incase it was shown
						if ($("#saves-container").is(":visible")) {
							$("#saves-container").hide();
						}
					}

					// this loads in the new question
					Viewer.interview.question(packet.data.question); 

					// load in the new progress status in the drop down
					Viewer.interview.progress(packet.data.progress); 

					// load in the fractional progress
					Viewer.interview.fraction(packet.data.fraction); 

					// set the current qID
					Viewer.interview.setCurrentQID(packet.qid); 
				} else {
					// handle the error
					if ( ! $("#" + packet.data.name + "-var-container").hasClass("var-error")) {
						$("#" + packet.data.name + "-var-container").addClass("var-error");
					}

					alert(packet.data.message);
				}
			});

			// this is when the server returns after the interview has been successfully saved
			socket.on('saved_progress', function (packet) {
				// this sets the save variable to true again and allows the save button to be clicked again
				Viewer.interview.saved(true);

				if (packet.valid) {
					// the progress was saved successfully
					$("#note-container").hide();
				} else {
					alert('Your interview could not be saved at this time. Please try again.');
				}
			});

			socket.on('open_saved', function (packet) {
				if (packet.valid) {
					// now we can show them the saved interviews
					$("#saves-container #data-payload").html(packet.data);
					$("#saves-container").show();
				} else {
					alert('There was a problem retrieving your saved interviews. Please try again.');
				}
			});

			socket.on('insert_saved_note', function (packet) {
				$("textarea[name=t-d-note]").val(packet.note);
			});

			// this is when the server returns with wither the question to display, or the error from the question that failed validate
			socket.on('srv_error', function (packet) {
				Viewer.interview.question({content: packet.error});
			});

			socket.on('reconnect', function () {
				//alert('reconnected');
			});

			socket.on('connect_failed', function () {
				//alert('reconnected');
			});

			socket.on('error', function () {
				//window.location.href = '/basket/clear';
			});

			socket.on('connect_failed', function () {
				//window.location.href = '/basket/clear';
			});

			socket.on('reconnect_failed', function () {
				//window.location.href = '/basket/clear';
				//alert('reconnec failed');
			});

			socket.on('disconnect', function () {
				//window.location.href = '/basket/clear';
				//socket.emit('client_disconnect', null);
			});
		},
		getSocket: function() {
			return socket;
		}
	};
}());

Viewer.interview = (function() {

	"use strict";

	// use this to prevent multiple back button clicks in a row//
	// only after the question is shown, is the block removed
	var back = true;
	var save = true;
	// each interview started gets an id that matches a record in the saves database table
	var id = null;
	var current_qid = null;
	var finish_interview_allowed = true;
	var complete_interview_allowed = true;
	var click_continue_allowed = true;
	var click_partial_allowed = true;

	var eventListeners = function () {
		// this is used to pass the the value of the drop down when it changes
		var previous, login_path;

		// the help tooltip
		$(".help-tooltip, .field-tooltip").live('click',function () {
			// we need to figure out the best position to show the learn more so its not off the screen
			var pointer = $(this).children(".pointer");
			var tooltip = $(this).children(".body");
			var container = $(".contents .prompt");
			var container_pos = container.offset();
			var tooltip_pos = Math.round($(this).offset().left + $(this).width()/2 - tooltip.width()/2);

			// subtract 10 for the width of the pointer div
			pointer.css('left', Math.round($(this).width()/2) - 14).toggle();

			// check to see if the left edge of the tooltip is outside the container and adjust accrodingly
			if (tooltip_pos < container_pos.left) {
				tooltip.css('left', '0px');
			// check the right edge
			} else if (parseInt(tooltip_pos + tooltip.width(),10) > parseInt(container_pos.left + container.width(),10)) {
				tooltip.css('left', '-' + Math.round(tooltip.width() - 65) + 'px');
			} else {
				tooltip.css('left', Math.round($(this).width()/2 - tooltip.width()/2));
			}

			if(tooltip.css("visibility") === "visible") { 
				tooltip.css({ 'visibility': 'hidden'}); 
			} else { 
				tooltip.css({ 'visibility': 'visible'}); 
			}
		});

		$(".lm-display, .lm-data").live('click',function () {
			var target = $('.lm-data');

			if (target.is(':hidden')) {
				target.show();
			} else {
				target.hide();
			}
		});

		// when youtube video links are clicked
		$(".youtube-popout").live('click',function () {
			var popup = $("#youtube-container .popup");
			var link = $(this).find('.video-link a:first').attr('href');
			var width = popup.width();
			var height = popup.height();

			if (width === '440') {
				height = '248';
			} else if (width === '280') {
				height = '158';
			}

			// create the embedded video
			popup.html('<iframe width="' + width + '" height="' + height + '" src="' + link + '" frameborder="0" allowfullscreen></iframe>');
			$("#youtube-container").show();
		});

		// this is when the save icon is clicked
		$('#save').click(function () {
			var socket = Viewer.socket.getSocket();

			if (save) {
				// set this so we know what pop up to show after the login happens
				login_path = 'save';

				// this will call the server for the note and put it in the HTML 
				// pass in the id of the tmp record (which is equivalent to the saved id)
				socket.emit('get_saved_note', {
					id: id
				});

				// check if the user is logged in
				$.ajax({
					type: 'GET',
					url: BASE_URL + '/interviews/post/status?d=' + new Date().getTime(),
					dataType: 'json',
					cache: false,
					success: function (res) {
						if (res.logged_in) {
							// if we get here the user is logged in and we can show the save popup and add in an optional note
							$("#note-container").show();
						} else {
							// the user is not logged in so show them the login form
							$("#login-container").show();
						}
					},
					error: function (jqXHR, textStatus, errorThrown) {
						alert(textStatus);
					}
				});
			}
		});

		$('#open').click(function () {
			// if the user is logged in fetch their id and then send it via socket to the server to retrieve the
			var socket = Viewer.socket.getSocket();

			if (save) {
				// set this so we know what pop up to show after the login happens
				login_path = 'open';
				// check if the user is logged in
				$.ajax({
					type: 'GET',
					url: BASE_URL + '/interviews/post/status?d=' + new Date().getTime(),
					dataType: 'json',
					cache: false,
					success: function (res) {
						if (res.logged_in) {
							// if we get here the user is logged in and we can show the saved interviews
							var socket;
							var data;
							var interview;

							socket = Viewer.socket.getSocket();
							interview = $('#interview-id').html();
							data = {
								id: id,
								interview: interview
							};
							socket.emit('open_saves', data);	
						} else {
							// the user is not logged in so show them the login form
							$("#login-container").show();
						}
					},
					error: function (jqXHR, textStatus, errorThrown) {
						alert(textStatus);
					}
				});
			}
		});

		$('#back').click(function () {

			var socket;
			// get the value of the progress dropdown..this will tell us what qid we are on, and what index the array is on
			var progress = document.getElementById('progress'); 
			var backid;
			var split;
			var interview;
			var data;

			// this checks to see if the block is enabled..i.e..we haven't just click the back button with the info not arriving first
			if (back) {
				// if there are no options in the progress the ID will be undefined
				if (progress.options) {
					if (progress.options[progress.selectedIndex]) {
						backid = progress.options[progress.selectedIndex].value;
						split = backid.split(":");
						// if the index is zero that means we are at the start of the interview and we cant go back any further
						if (split[1] !== '0') {	
							socket = Viewer.socket.getSocket();
							interview = $('#interview-id').html();
							data = {
								id: id,
								interview: interview,
								backid: backid,
								previd: null
							};

							socket.emit('back', data);
							// disable clicking the back button until the question is displayed
							back = false;
						}	
					}
				}
			}
		});

		// when the close button on a popup modal is clicked
		$("#l-d-close").live("click", function () {
			// hide the login incase it was shown
			if ($("#login-container").is(":visible")) {
				$("#login-container").hide();
			}
		});

		// when the close button on a popup modal is clicked
		$("#s-d-close").live("click", function () {
			// hide the login incase it was shown
			if ($("#saves-container").is(":visible")) {
				$("#saves-container").hide();
			}
		});

		// when the close button on a popup modal is clicked
		$("#t-d-close").live("click", function () {
			// hide the login incase it was shown
			if ($("#note-container").is(":visible")) {
				$("#note-container").hide();
			}
		});

		// when the close button on a popup modal is clicked
		$("#y-d-close").live("click", function () {
			// hide the login incase it was shown
			if ($("#youtube-container").is(":visible")) {
				// clear out the contents so the video stops playing..ie8 has a black screen so clear the iframe to fix it
				$("#youtube-container .popup iframe").hide();
				$("#youtube-container .popup").empty().html('<span></span>');
				$("#youtube-container").hide();
			}
		});

		// when the user clicks an options icon to load a previous 
		$(".partial-sav-int").live("click", function () {
			// get the id of the record that corresponds to the saved data in the databases
			if (click_partial_allowed) {
				var interview = $('#interview-id').html();
				var partial_id = this.id;
				var qid = $(this).html();
				var socket = Viewer.socket.getSocket();
				var data = {
					id: id,
					interview: interview, 
					qid: qid,
					partial_id: partial_id
				};

				socket.emit('load_saved', data);

				$('#partial-loading-msg').show();
				// this makes sure we don't try to load the interview multiple times
				click_partial_allowed = false;
			}
		});


		// listen for when the button to continue is clicked
		$(".button").live("click", function () {
			if (click_continue_allowed) {
				var text_selector = $('.text');
				var interview = $('#interview-id').html();
				var qid = $(this).html();
				var socket = Viewer.socket.getSocket();
				var data = {
					id: id,
					interview: interview, 
					qid: qid,
					fields: Viewer.interview.collectFieldData(qid)
				};
				
				$('.continue-button').css('background-position','-298px -47px');
				$(this).prepend('<span class="loading"></span>');

				click_continue_allowed = false;
				socket.emit('question', data);
			}
		});	

		// listen for when the login is clicked
		$("#ltf-login").live("submit", function (e) {
			// show the login spinner
			$("#ltf-loader").css('display','inline-block');

			// this will prevent the form from being uploaded to the server the conventional way
			e.preventDefault();

			// the form data
			var data = $(this).serialize();

			// this logs the user in 
			$.ajax({
				type: 'POST',
				url: BASE_URL + '/interviews/ltf_login?d=' + new Date().getTime(),
				data: data,
				dataType: 'json',
				cache: false,
				success: function (res) {
					// get rid of the loader
					$("#ltf-loader").hide();

					if (res.error) {
						// this means the server did not log us in
						$("#sf-g-error").html(res.msg).show();
					} else {
						// successful login..hide the login incase it was shown
						$("#login-container").hide();
						// hide any errors that may be showing
						$("#sf-g-error").hide();
						// clear the form
						$("#ltf-login").find('input:text, input:password').val('');

						// depending on how we got here (open or save) we want to show the correct popup window
						if (login_path === 'open') {
							// if we get here the user is logged in and we can show the saved interviews
							var socket = Viewer.socket.getSocket();
							var interview = $('#interview-id').html();
							var data = {
								id: id,
								interview: interview
							};

							socket.emit('open_saves', data);	
						} else {
							$("#note-container").show();
						}
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					alert(textStatus);
				}
			});

			return false; 
		});	

		// listen for when the register form is trying to be submitted
		$("#ltf-register").live("submit", function (e) {
			// show the login spinner
			$("#ltf-r-loader").css('display','inline-block');

			// this will prevent the form from being uploaded to the server the conventional way
			e.preventDefault();

			// the form data
			var data = $(this).serialize();

			// this logs the user in 
			$.ajax({
				type: 'POST',
				url: BASE_URL + '/interviews/ltf_register?d=' + new Date().getTime(),
				data: data,
				dataType: 'json',
				cache: false,
				success: function (res) {
					// get rid of the loader
					$("#ltf-r-loader").hide();

					if (res.error) {
						// this means the server did not log us in
						$("#sf-h-error").html(res.msg).show();
					} else {
						// successful login..hide the login incase it was shown
						$("#login-container").hide();
						// hide any errors that may be showing
						$("#sf-h-error").hide();
						// clear the form
						$("#ltf-register").find('input:text, input:password').val('');

						// depending on how we got here (open or save) we want to show the correct popup window
						if (login_path === 'open') {
							// if we get here the user is logged in and we can show the saved interviews
							var socket = Viewer.socket.getSocket();
							var interview = $('#interview-id').html();
							var data = {
								id: id,
								interview: interview
							};
							socket.emit('open_saves', data);	
						} else {
							$("#note-container").show();
						}
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					alert(textStatus);
				}
			});

			return false; 
		});	

		// when the user clicks the save button for an interview
		$("#vfh-save").live("click", function () {
			if (save) {
				var socket = Viewer.socket.getSocket();
				var interview = $('#interview-id').html();
				var data = {
					// this gets sent back to the server, it is the id of the tmp interview record
					id: id,
					qid: current_qid,
					note: $.trim($("textarea[name=t-d-note]").val()),
					// the id of the interview
					interview: interview
				};

				socket.emit('save_progress', data);	
				// disable clicking the save button until the server returns
				save = false;			
			}
		});	

		// listen for when the finish button is clicked
		$("#finish-interview").live("click", function () {
			if (finish_interview_allowed) {
				var interview = $('#interview-id').html();
				var qid = $(this).html();
				var socket = Viewer.socket.getSocket();
				var data = {
					id: id,
					interview: interview, 
					qid: qid,
					fields: Viewer.interview.collectFieldData(qid)
				};

				$('.finish-button').css('background-position','-432px -47px');
				$(this).prepend('<span class="loading"></span>');

				// make sure the user cant click the button more than once..when the server returns with a response this is set to true
				finish_interview_allowed = false;
				save = false;
				socket.emit('finish', data);				
			}
		});	

		// exit an interview without processing
		$("#exit-interview").live("click", function () {
			window.location.replace(BASE_URL);
		});	

		// when the very last question with the send button is clicked
		$("#complete-interview").live("click", function () {
			if (complete_interview_allowed) {
				var interview = $('#interview-id').html();
				var socket = Viewer.socket.getSocket();
				var data = {
					id: id,
					interview: interview, 
					email: $.trim($("input[name=q-final]").val())
				};

				$('.send-button').css('background-position','-566px -47px');
				$(this).prepend('<span class="loading"></span>');
				complete_interview_allowed = false;
				socket.emit('send', data);
			}
		});	

		// when the progress drop down changes
		$("#progress").focus(function () {
			// Store the current value on focus, before it changes
			var progress = document.getElementById('progress');
			// if there are no options in the progress the ID will be undefined
			if (progress.options) {
				if (progress.options[progress.selectedIndex]) {
					previous = progress.options[progress.selectedIndex].value;
				}
			}
		}).change(function() {
			// get the value of the progress dropdown..this will tell us what qid we are on, and what index the array is on
			var progress = document.getElementById('progress'); 

			// if there are no options in the progress the ID will be undefined
			if (progress.options) {
				if (progress.options[progress.selectedIndex]) {
					var backid = progress.options[progress.selectedIndex].value;
					var socket = Viewer.socket.getSocket();
					var interview = $('#interview-id').html();
					var data = {
						id: id,
						interview: interview,
						backid: backid,
						previd: previous
					};

					socket.emit('back', data);
					// disable clicking the back button until the question is displayed
					back = false;
				}
			}
		});

		// when we focus on a field with an answer
		$('.id-field').live('click', function () {
			var split = this.id.split(":");
			var name = split[0];
			var container = $("#" + name + "-var-container");

			if (container.hasClass("var-error")) {
				container.removeClass("var-error");
			}
		});

		// listen when a check box is clicked, which has a NOTA in the list
		$('.id-cb').live('click', function () {
			// get the name of the field by splitting before the dash (name-4)
			var name = this.id.split('-')[0];

			// when a checkbox is clicked, check to see if the nota is clicked, and if it is remove the check
			if ($("#" + name + "-nota").is(":checked")) {
				$("#" + name + "-nota").attr('checked', false);
			}
		});

		// listen when the nota check box is clicked
		$("input[id$='-nota']").live('click', function () {
			var name = this.id.split('-')[0];

			// when we click on the nota, we need to remove the check from every other box
			$(".id-cb[name='" + name + "']").each(function(index) {
				if ($(this).is(":checked")) {
					$(this).attr('checked', false);
				}
			});
			$(this).attr('checked', true);
		});

		$("#header .scale ul li").click(function () {
			var size = $(this).attr("class");

			if (size === "small") {
				$("#main").css("font-size", "1.0em");
			} else if (size === "medium") {
				$("#main").css("font-size", "1.5em");
			} else if (size === "large") {
				$("#main").css("font-size", "2.0em");
			}
		});	

		$(".learnmore-button").live('click', function () {
			if ($("#lmt").is(":visible")) {
				$(this).css('background-position','-700px -7px');
			} else {
				$(this).css('background-position','-700px -56px');
			}
			$("#lmt").slideToggle("fast");
		});	

		$(".prompt a, .helpbox a, .learnmore a").live('click', function (e) {
			var url = $(this).attr("href");
			window.open(url);
			e.preventDefault();
			return false;
		});	
	};

	return {
		
		init: function () {
			Viewer.socket.init();
			eventListeners();
		},

		collectFieldData: function (qid) {
			var fields = [];

			// go though each field a question had, storing its values in an array
			$('.id-field').each(function(index) {
				// split the id of the ul container to get the name of the field, and its type
				var split = this.id.split(":");
				var name = split[0];
				var type = split[1];
				// this object will store the answer, and the label from the field
				var value;

				// run a check on the type of field
				switch (type) {
					case 'text':
						// since a textbox can only have one anser we push this one value onto the array
						value = $.trim($("input[name=" + name + "]").val());
						break;
					case 'textarea':
						value = $.trim($("textarea[name=" + name + "]").val());
						break;
					case 'number':
						value = $.trim($("input[name=" + name + "]").val());
						break;
					case 'radio':
						value = $.trim($("input[name=" + name + "]:checked").val());
						break;
					case 'date':
						value = $.trim($( "#" + name + "_picker" ).datepicker().val());
						break;
					case 'checkbox':
						// checkboxes allow multiple answers to be sent back in an array
						// this is stringified when it gets to the server, to avoid conflicts with looping questions
						// stringify is no supported on all browsers, so just do it on the server
						value = [];
						$('.id-test').each(function(index) {
							if ($(this).is(":checked")) {
								value.push($.trim($(this).val()));
							}
						});
						break;
					case 'text_dropdown':
						value = $("select[name=" + name + "]").val();
						break;
					case 'number_dropdown':
						value = $("select[name=" + name + "]").val();
						break;
				}

				// prepare each field to be returned to the server
				fields.push({
					qid: qid,
					name: name,
					section: 'field',
					type: type,
					answer: value
				});

			});
			return fields;
		},

		question: function (question) {
			// ie8 hack
			$(".help-tooltip, .youtube-popout").each(function() {
				$(this).css('position','static');
			});

			$(".question").fadeOut("fast", function () {
				$(this).empty().html(question.content);
				$(this).fadeIn("fast",function () {
					// ie8 hack
					$(".help-tooltip, .youtube-popout").each(function() {
						$(this).css('position','relative');
					});
				});

				// if the question has a date, we need to add it to the DOM
				if (question.date_pickers) {
					Viewer.interview.datePicker(question.date_pickers);
				}

				// only when the question is displayed can we issue the back button
				back = true; 
			});
		},

		// this empties out the drop down progress, and inserts the new history
		progress: function (progress) {
			$("#progress").html(progress);
		},

		fraction: function (fraction) {
			$("#fraction").html(fraction);
		},

		// this gets called after the server returns, after a user has clicked the save button.
		// It is possible there was an error
		saved: function (valid) {
			save = true;
		},

		datePicker: function (pickers) {
			// if there is a date field, we need to build the picker and show it
			var dp;

			if (pickers) {
				for (var i = 0; i < pickers.length; i+=1) {
					dp = $( "#" + pickers[i].name + "_picker" );
					// this has to be initialized first 
					dp.datepicker();
					dp.datepicker('option', 'changeMonth', true);
					dp.datepicker('option', 'changeYear', true);
					dp.datepicker('option', 'yearRange', "1900:2100"); // these have to be set in order to sue monDate and MaxDate correctly

					// this sets the format to whatever is given
					if (pickers[i].format) {
						dp.datepicker('option', 'dateFormat', pickers[i].format);
					}

					for (var key in pickers[i].validation) {
						if (pickers[i].validation.hasOwnProperty(key)) {
							if (key === 'min_date') {
								dp.datepicker('option', 'minDate', pickers[i].validation[key]);
							} else if (key === 'max_date') {
								if (pickers[i].validation[key].toUpperCase() === 'TODAY') {
									dp.datepicker('option', 'maxDate', '0');
								} else {
									dp.datepicker('option', 'maxDate', pickers[i].validation[key]);
								}
							}
						}
					}

					// THE DEFAULT is for highlighting the date when the pop up opens...it does not set the date in the text field!
					if (pickers[i].def) {
						if (pickers[i].def.toUpperCase() === 'TODAY') {
							dp.datepicker('option', 'defaultDate', null);
						} else {
							dp.datepicker('option', 'defaultDate', pickers[i].def);
						}
					}

					if (pickers[i].set !== null) {
						dp.datepicker("setDate", pickers[i].set);
					}

					// so Google translate doesn't break the date-picker
					$('.ui-datepicker').addClass('notranslate');
				}
			}
		},

		setContinueGate: function (b) {
			click_continue_allowed = b;
		},
		setPartialGate: function (b) {
			click_partial_allowed = b;
		},
		setFinishGate: function (b) {
			finish_interview_allowed = b;
		},
		setCompleteGate: function (b) {
			complete_interview_allowed = b;
		},
		setInterviewID: function (interview_id) {
			id = interview_id;
		},
		setCurrentQID: function (qid) {
			current_qid = qid;
		}
	};
}());