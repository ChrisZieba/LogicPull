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

var Editor = Editor || {};

Editor.thumbnail = (function () {
	"use strict";

	var buildThumbnail = function (data) {
		var output = [];
		var field, label_class, input_name, input_label, input_type, input_default, input_validation, input_values, value, button, button_type, min, max;

		output.push('<div class="aux-thumb-xtra"><span class="bold">[' + data.qid + '] </span><span class="">' + data.name +'</span></div><div class="clear"></div><br>');
		output.push('<div class="aux-thumb-xtra"><table class="thumbnail-table"><thead><tr><th>Question</th></tr></thead><tr><td style="background:#f0f0f0">');
		output.push('<div class="contents">');
		output.push('<div class="prompt">'); 
		output.push('<div class="text">' + data.question_text + '</div>'); 
			
		if (data.fields) {
			for (var i = 0; i < data.fields.length; i+=1) {
				field = data.fields[i];
				label_class = 'var-label';
				input_name = field.name;
				input_label = field.label;
				input_type = field.type;
				input_default = field.def;
				input_validation = field.validation;
				input_values = field.values;
				value = ""; 

				//use this to attach error class
				output.push('<div class="var-container">');
				
				if (input_label) {
					if (input_validation.required === 'yes' || input_validation.nota === 'yes') {
						label_class = "var-label required"; 
					} else {
						label_class = "var-label"; 
					}
					output.push('<div class="' + label_class + '">' + input_label + '</div>');
				}

				switch (input_type) {
					case 'text':
						if (input_default !== null && typeof input_default !== undefined && input_default !== '') {
							output.push('<ul><li><input type="text" value="' + input_default + '" size="40" class="textbox" readonly="readonly" /></li></ul>');
						} else {
							output.push('<ul><li><input type="text" size="40" class="textbox" readonly="readonly" /></li></ul>');
						}
						break;
					case 'textarea':
						if (input_default !== null && typeof input_default !== undefined && input_default !== '') {
							output.push('<ul><li><textarea cols="34" rows="5" class="textarea" readonly="readonly" >'+ input_default + '</textarea></li></ul>');
						} else {
							output.push('<ul><li><textarea cols="34" rows="5" class="textarea" readonly="readonly" ></textarea></li></ul>');
						}
						break;
					case 'number':
						if (input_default !== null && typeof input_default !== undefined && input_default !== '') {
							output.push('<ul><li><input type="text" value="' + input_default + '" size="40" class="textbox" readonly="readonly" /></li></ul>');
						} else {
							output.push('<ul><li><input type="text" size="40" class="textbox" readonly="readonly" /></li></ul>');
						}
						break;
					case 'radio':
						if (input_values) {
							output.push('<ul class="radio-list">');

							for (var j = 0; j < input_values.length; j+=1) {
								output.push('<li>');

								if (value === input_values[j].id) {
									output.push('<input type="radio" name="' + input_name + '" checked="checked" />');
								} else {
									output.push('<input type="radio" name="' + input_name + '" />');
								}
								
								output.push('<label>' + input_values[j].label + '</label>');
								output.push('</li>');
							}
							output.push('</ul>');								
						}
						break;
					case 'date':
						output.push('<ul>');
						output.push('<li><input type="text" size="14" class="datepicker-textbox" readonly="readonly" /></li>');
						output.push('</ul>');
						break;
					case 'checkbox':
						if (input_values) {
							output.push('<ul id="' + input_name + ':' + input_type + '" class="id-field checkbox-list">');

							for (var k = 0; k < input_values.length; k+=1) {
								output.push('<li>');

								if (input_validation.nota === 'yes') {
									if (value === input_values[k].id) {
										output.push('<input type="checkbox" checked="checked" class="id-cb" />');
									} else {
										output.push('<input type="checkbox" class="id-cb" />');
									}
								} else {
									if (value === input_values[k].id) {
										output.push('<input type="checkbox" checked="checked" class="id-test" />');
									} else {
										output.push('<input type="checkbox" class="id-test" />');
									}
								}
								output.push('<label>' + input_values[k].label + '</label>');
								output.push('</li>');
							}

							if (input_validation.nota === 'yes') {
								output.push('<li><input type="checkbox" id="id-nota" class="id-cb" /><label>None of the above</label></li>');
							}

							output.push('</ul>');	
						}
						break;
					case 'text_dropdown':
						if (input_values) {
							output.push('<ul class="dropdown-list">');
							output.push('<li>');
							output.push('<select class="dropdown">');

							// if we are going back, the value is the previous answer, if going forward, it is just the default
							if (input_default !== null && input_default !==  undefined && input_default !== '') {
								output.push('<option value="">none</option>');
								for (var l = 0; l < input_values.length; l+=1) {
									if (input_default === input_values[l].id) {
										output.push('<option selected="selected">' + input_values[l].label + '</option>');									
									} else {
										output.push('<option>' + input_values[l].label + '</option>');	
									}
								}
							// no default set
							} else {
								// set the first item to selected...one needs to be selected for validation purposes
								output.push('<option value="" selected="selected">none</option>');
								for (var r = 0; r < input_values.length; r+=1) {
									output.push('<option value="' + input_values[r].id + '">' + input_values[r].label + '</option>');
								}
							}
							
							output.push('</select>');
							output.push('</li>');
							output.push('</ul>');	
						}
						break;
					case 'number_dropdown':
						// zero is valid! therefore we need to check for these scenarios instead of doing if (field.start) {}
						if (field.start !== null && typeof field.start !== 'undefined' && field.start !== '' && field.end !== null && typeof field.end !== 'undefined' && field.end !== '' ) {
							output.push('<ul class="dropdown-list">');
							output.push('<li>');
							output.push('<select class="dropdown">');

							max = Math.max(field.start, field.end);
							min = Math.min(field.start, field.end);

							if (input_default !== null && typeof input_default !== 'undefined' && input_default !== '') {
								output.push('<option value="">none</option>');
								for (var m = min; m <= max; m+=1) {
									if (input_default === m) {
										output.push('<option selected="selected">' + m + '</option>');									
									} else {
										output.push('<option >' + m + '</option>');	
									}
								}
							} else {
								// set the first item to selected...one needs to be selected for validation purposes
								output.push('<option value="" selected="selected">none</option>');
								for (var s = min; s <= max; s+=1) {
									output.push('<option >' + s + '</option>');	
								}
							}

							output.push('</select>');
							output.push('</li>');
							output.push('</ul>');	
						}
						break;
				}
				output.push('</div>'); //var-container

			}
		}

		output.push('</div>');
		output.push('<div class="clear"></div>');
		output.push('</div>'); // contents
		output.push('</td></tr></table></div>');
		output.push('<div class="clear"></div>');
		output.push('<div class="aux-thumb-xtra">');

		if (data.buttons) {
			output.push('<table class="thumbnail-table"><thead><tr><th colspan="2">Buttons</th></tr></thead>');
			for (var p = 0; p < data.buttons.length; p+=1) {
				output.push('<tr><td><span class="bold">' + data.buttons[p].type + '</span></td><td>' + data.buttons[p].destination + '</td></tr>');
			}
			output.push('</table>');
		}

		if (data.loop1) {
			output.push('<table class="thumbnail-table"><thead><tr><th>Loop</th></tr></thead><tr><td><span class="bold">' + data.loop1 + '</span></td></tr></table>');
		}

		if (data.fields.length !== 0) {
			output.push('<table class="thumbnail-table"><thead><tr><th>Fields</th></tr></thead>');

			for (var t = 0; t < data.fields.length; t+=1) {
				if (data.fields[t].validation.required === 'yes') {
					output.push('<tr><td><code class="red"><strong>' + data.fields[t].name + '</strong></code></td></tr>');
				} else {
					output.push('<tr><td><code>' + data.fields[t].name + '</code></td></tr>');
				}
				
			}
			output.push('</table>');
		}

		if (data.advanced.length !== 0) {
			output.push('<table class="thumbnail-table"><thead><tr><th>Advanced</th></tr></thead>');

			for (var u = 0; u < data.advanced.length; u+=1) {
				output.push('<tr><td><div class="thumb-adv-c">' + data.advanced[u].event + '</div><code>' + data.advanced[u].condition + '</code>');

				if (data.advanced[u].actions) {
					for (var v = 0; v < data.advanced[u].actions.length; v+=1) {
						// if its a goto
						if (data.advanced[u].actions[v].action === 'goto') {
							output.push('<div class="thumb-adv-action-' + data.advanced[u].actions[v].if.toString() + '">goto ' + data.advanced[u].actions[v].value + '</div>');
						} else { 
							// otherwise we set a variable
							output.push('<div class="thumb-adv-action-' + data.advanced[u].actions[v].if.toString() + '">set ' + data.advanced[u].actions[v].name + ' = ' + data.advanced[u].actions[v].value + '</div>');
						}
					}
					output.push('</td></tr>');
				}
			}
			output.push('</table>');
		}
		output.push('</div>');

		return output.join("");
	};

	return {	
		buildThumbnail: function (qid) {
			$('#thumbnail').html(buildThumbnail(questions[qid]));
		},

		showThumbnail: function (qid) {
			$('#thumbnail').removeClass('none');
		},

		hideThumbnail: function () {
			$('#thumbnail').addClass('none');
		}
	};
}());