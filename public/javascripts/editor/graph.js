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

Editor.graph = (function() {
	"use strict";

	var scale_factor = 1;

	// Depth first search
	var dfs = function (qid, visited) {
		var node;
		var ret;
		var edges;

		visited.push(qid);

		if (questions[qid].source_paths) {
			edges = questions[qid].source_paths;
		}
		
		if (edges) {
			for (var j = 0; j < edges.length; j+=1) {
				// since deleted paths remain in the array as undefined this needs a check
				if (edges[j]) { 
					// if a node has NOT been visited
					if (visited.indexOf(edges[j].d) === -1) { 
						dfs(edges[j].d, visited);
					}				
				}
			}
		}

		ret = visited;
		return ret;
	};

	// Breadth first search
	var bfs = function (qid, tree) {
		var edges = questions[qid].source_paths;
		var children = [];

		tree.push(qid);
		
		for (var j = 0; j < edges.length; j+=1) {
			// put the child node in the array
			children.push(edges[j].d); 
		}

		return children;
	};

	var pathInfo = function (s,d) {
		var pathinfo, interpolate, d3path;
		// SOURCE
		// the width of the source node
		var w1 = parseInt(s.node.width,10), 
			// height of source
			h1 = parseInt(s.node.height,10), 
			// where the x-cord of the path should originate from
			x1 = parseInt(s.node.x,10) + Math.round(w1/2,10), 
			// where the y-cord of the path should originate from
			y1 = parseInt(s.node.y,10) + h1, 

		// DESTINATION
			w2 = parseInt(d.node.width,10),
			h2 = parseInt(d.node.height,10),
			x2 = parseInt(d.node.x,10) + Math.round(w2/2,10),
			y2 = parseInt(d.node.y,10);
			
		// If the source q is below the destination ,draw a curve path going up
		// means the destination is above the source
		if (y2 - y1 < 0) { 
			pathinfo = points(
				{ x:x1, y:y1, w:w1, h:h1 },
				{ x:x2, y:y2, w:w2, h:h2 }
			);
			interpolate = 'bundle';
		} else {
			pathinfo = [{ x:x1, y:y1 },{ x:x2, y:y2 }];
			interpolate = 'linear';
		}

		return {
			pathinfo: pathinfo,
			interpolate: interpolate
		};
	};

	// Use this to return an array of points for drawing a bezier curve
	// @s the source node object
	// @d is the destination object
	var points = function (s,d) {
		// this is the stating point
		var p1;
		var p2, p3, p4, p5;
		var pathinfo;
		// this is the horizontal distance between the two questions
		var x_between; 
		// vertical distance
		var y_between = Math.abs(d.y-s.y); 

		// the start of the source - bottom and centered from node
		p1 = {
			x: s.x,
			y: s.y
		}; 

		p2 = {
			x: Math.round(s.x + s.w*2),
			y: s.y + s.h*2
		}; 

		p3 = {
			x: Math.round(d.x + d.w*4),
			y: s.y
		}; 

		p4 = {
			x: Math.round(d.x + d.w*2),
			y: d.y - d.h*2
		}; 

		// this is just the destination - top and centered
		p5 = {
			x: d.x,
			y: d.y
		}; 

		pathinfo = [p1,p2,p3,p4,p5];
		return pathinfo;
	};


	var dragMove = function (d) {
		var qid = this.id;
		var spid, dest, sinfo, d3path, dpid, s, dinfo, len1, len2,dx, dy;
		// use this to position the text 
		var xoffset = 2; 
		var yoffset = 10;
		var source = questions[qid];
		var textid = source.text_id;
		var sourcepaths = source.source_paths;
		var destpaths = source.destination_paths;
		var w = source.node.width;
		var h = source.node.height;
		var xcanvas = d3.select("#canvas").attr("width");
		var ycanvas = d3.select("#canvas").attr("height");

		// check to make sure we don't drag a node off the canvas
		if (d.x < 0) {
			// subtract the width since the top left corner is where the node position is
			// this freezes the x at the edge of the canvas so it doesn't pass over
			d.x = 0;
		} else if ((d.x + w) >= xcanvas) {
			d.x = xcanvas - w;
		}

		// check to make sure we don't drag a node off the canvas
		if (d.y < 0) {
			// subtract the width since the top left corner is where the node position is
			// this freezes the x at the edge of the canvas so it doesn't pass over
			d.y = 0;
		} else if ((d.y + h) >= ycanvas) {
			d.y = ycanvas - h;
		}

		d.x += d3.event.dx;
		d.y += d3.event.dy;

		// this updates the dom svg rect
		d3.select(this).attr("x",d.x);
		d3.select(this).attr("y",d.y);
	
		// update the node x and y values in the question object
		questions[qid].node.x = d.x;
		questions[qid].node.y = d.y;

		// move the text id with the node
		d3.select("#"+ textid).attr("x",d.x + xoffset);
		d3.select("#"+ textid).attr("y",d.y + yoffset);

		dx = function(d) { return d.x; };
		dy = function(d) { return d.y; };

		len1 = sourcepaths.length;

		// TODO: make this more efficient
		for (var i = 0; i < len1; i+=1) {
			// update the positions of the paths
			if (sourcepaths[i] !== null && typeof sourcepaths[i] !== 'undefined') {
				spid = sourcepaths[i].pid; 
				dest = questions[sourcepaths[i].d]; 
				sinfo = pathInfo(source, dest);

				d3path = d3.svg.line()
					.x(dx)
					.y(dy)
					.interpolate(sinfo.interpolate); 

				d3.select("#"+spid).attr("d", d3path(sinfo.pathinfo));
			}
		}

		len2 = destpaths.length;

		for (var j = 0; j < len2; j+=1) {
			// update the positions of the paths
			if (destpaths[j] !== null && typeof destpaths[j] !== 'undefined') {
				
				dpid = destpaths[j].pid; 
				s = questions[destpaths[j].s]; 
				// use source here because the destination is the item we are dragging
				dinfo = pathInfo(s, source); 

				d3path = d3.svg.line()
					.x(dx)
					.y(dy)
					.interpolate(dinfo.interpolate); 

				d3.select("#"+dpid).attr("d", d3path(dinfo.pathinfo));
			}
		}
	};
		
	return {
		populate: function (nodes) {
			var count, question;
			var x = 100;
			var y = 20;
			var offset = 100;

			for (var i = 0; i < nodes; i+=1) {
				count = Editor.graph.getCounter();
				question = {
					_id: count,
					qid: 'q'+count,
					// this is the step
					step: "0", 
					text_id: 'qt'+count,
					//this is the question text
					question_text: "some question text", 
					learn_more: {
						title: "what is my postal code", 
						body: "look here for more info"
					}, // only one learn more object with a title and a body
					buttons: [],
					//the help objects each contain an id and a body (iframe) -- array of objects
					help: [], 
					// these are the path names that originate from the question (source)
					source_paths: [], 
					destination_paths: [],
					// this hold all the field (variable) objects
					fields: [], 
					node: {
						x: x,
						y: y,
						width: 40,
						height: 40,
						fill: '#c6d5b0'
					}
				};

				y = y + 100;
				Editor.graph.addQuestion(question);
			}
		},

		init: function () {
			// data is from the preload in editor, which returns the all the date for the interview
			var len,qid;
			var qids = []; 
			var questions = data(); 

			// first sort out the qids in ascending order..
			// this is because when adding a question after the load it is sequential, and not qid of 200 when the last qid is only 100
			for (var h in questions) {
				if (questions.hasOwnProperty(h)) {
					qids.push(questions[h]._id);
				}
			}

			// this sorts the qids in ascending order , q1,q2,q6...
			qids.sort(function (a,b) { 
				return a - b;
			});

			// now we can go through and add each question
			for (var i = 0; i < qids.length; i+=1) {
				qid = 'q' + qids[i];
				Editor.graph.addQuestion(questions[qid]);
			}

			// the reason i am looping again here is because the nodes need to be drawn first in order to draw the paths..TODO: make more efficient
			for (var j in questions) {
				if (questions.hasOwnProperty(j)) {
					if (questions[j].source_paths) {
						len = questions[j].source_paths.length;

						for (var k=0; k<len; k+=1) {
							if (questions[j].source_paths[k]) {
								Editor.graph.addPath(questions[j].source_paths[k]);
							}
						}
					}
				}
			}
		},

		convertJSON: function (str) {
			var q = JSON.parse(str);
			Editor.graph.addQuestion(q);
		},
		
		// @data take the object
		addQuestion: function (data) {
			// this is used for regenerating the graph
			var qid = data.qid; 
			var id = data._id;
			// this is the question text id (i.e. Shows up inside the rectangle)
			var qtid = data.text_id; 
			var drag = d3.behavior.drag().origin(Object).on("drag", dragMove);
			var x = data.node.x;
			var y = data.node.y;
			var w = data.node.width;
			var h = data.node.height;
			var fill = data.node.fill;
			// used in the text position
			var xoffset = 2; 
			var yoffset = 10;
 
			questions[qid] = {
				"_id": id,
				"qid": qid,
				"name": data.name,
				"step": data.step,
				// this is textid
				"text_id": qtid, 
				"question_text": data.question_text,
				"loop1": data.loop1,
				"loop2": null,
				// the learn more object contains a title and a body (iframe data)
				"learn_more": data.learn_more, 
				"buttons": data.buttons,
				"help": data.help,
				// THE PATHS ARE LEFT BLANK BECUASE THEY GET ADDED IN AFTER .. or there would be problems with paths being generated when the question is not drawn yet
				// these are the path names that originate from the question (source)
				"source_paths": [], 
				// these are paths that come into the question (destination)
				"destination_paths": [], 
				// array
				"fields": data.fields, 
				"advanced": data.advanced,
				"node": {
					"x": x,
					"y": y,
					"width": w,
					"height": h,
					"fill": fill
				}
			};

			canvas.append("rect")
				.data([{qid: qid, x: x, y: y, w: w, h: h}])
				.style("fill", fill)
				.attr("width", w)
				.attr("id", qid)
				.attr("height", h)
				.attr("x", x)
				.attr("y", y)
				.call(drag)
				.on("mousedown", function() {
					Editor.list.activateItem(qid, false, true);
					Editor.thumbnail.buildThumbnail(qid);
				})
				.on("dblclick", function() {
					Editor.list.activateItem(qid, false, true);
					Editor.details.manager.showQuestionDetails(qid);
					
				});

			canvas.append("text")
				.data([{qtid: qtid, x: x, y: y}])
				.attr("class", "label")
				.attr("id", qtid)
				.attr("x", x+xoffset)
				.attr("y", y+yoffset)
				.attr("text-anchor", "left")
				.style("fill", "#32382C")
				.text(qid);
	
			Editor.main.updateCurrentQuestion(qid);
			Editor.main.setQuestionCount(id);

			return qid;
		},

		// this gets called when the add button is clicked, not when we are initializing the graph
		createQuestion: function () {
			var count = Editor.main.getQuestionCount();
			var prev_id = Editor.list.getActiveItem();
			var prev_question;
			var data;

			// if there is not currently active list item clicked, then just use the last ID added as the position 
			if ( !prev_id) {
				prev_id = Editor.main.getLastID();
			}

			prev_question = questions[prev_id];

			data = {
				_id: count,
				qid: 'q'+count,
				name: 'Question Name ' + count,
				step: prev_question.step,
				text_id: 'qt'+count,
				question_text: "",
				loop1: prev_question.loop1,
				loop2: null,
				learn_more: {
					title: "", 
					body: ""
				},
				buttons: [{
					"type": 'continue',
					"destination": 'none',
					"pid": null
				}],
				// the help objects each contain an id and a body (iframe) -- array of objects
				help: [], 
				// these are the path names that originate from the question (source)
				source_paths: [],
				destination_paths: [],
				// this hold all the field (variable) objects
				fields: [], 
				advanced: [],
				node: {
					x: prev_question.node.x,
					y: prev_question.node.y + prev_question.node.height + 5,
					width: 40,
					height: 40,
					fill: '#c6d5b0'
				}
			};

			return data;
		},

		/* Get rid of a question... this involves
			1. removing all paths (s,d)
			2. removing all instances of the question from other questions...like logic, 
			3. remove the node and text from the graph
			4. if the start is the question we deleted, change the start
		*/
		removeQuestion: function (qid) {
			var len1, len2, sqid, dqid, spid, dpid;
			var sourcepaths = questions[qid].source_paths;
			var destpaths = questions[qid].destination_paths;
			var qtid = questions[qid].text_id;
			var start = Editor.settings.getStart();

			len1 = sourcepaths.length;
			
			for (var i = 0; i < len1; i+=1) {
				if (sourcepaths[i] !== null && typeof sourcepaths[i] !== 'undefined') {
					sqid = sourcepaths[i].s;
					spid = sourcepaths[i].pid; 
					Editor.graph.deletePath(sqid, spid);
				}
			}

			// go through each path that comes into the question we are deleting, and remove it from the source of that question
			// also remove any logic referencing the question we are deleting
			len2 = destpaths.length;

			for (var j = 0; j < len2; j+=1) {
				if (destpaths[j] !== null && typeof destpaths[j] !== 'undefined') {
					dqid = destpaths[j].s; // this is the source of the question deleing the path
					Editor.details.contents.buttons.removeOldRefs(dqid, qid);
					// pass the qid of the source that created the path, and go to that question, and remove any references of the qid we are deleting
					Editor.details.contents.advanced.removeOldRefs(dqid, qid);
					dpid = destpaths[j].pid; 
					Editor.graph.deletePath(dqid, dpid);
				}
			}	

			d3.select("#"+qid).remove();
			d3.select("#"+qtid).remove();
			delete questions[qid];

			// this has to be after we delete the question from the master list
			if (start === qid) {
				// change the start to the first node in questions
				for (var q in questions) {
					if (questions.hasOwnProperty(q)) {
						Editor.settings.setStart(q);
						break;
					}
				}
			}

			Editor.main.removeIDFromList(qid);
		},

		// @data is a path 
		addPath: function (data) {
			// this could be null...if it is we are creating a new path (from button or advanced) and not loading one in
			var pid = data.pid;
			var source = data.s, path, d3path;
			var dest = data.d;
			var stroke = data.stroke;
			var stroke_width = data.stroke_width;
			var stroke_dasharray = data.stroke_dasharray;
			var info = pathInfo(questions[source], questions[dest]);

			// Specify the function for generating path data             
			d3path = d3.svg.line()
				.x(function(d){return d.x;})
				.y(function(d){return d.y;})
				.interpolate(info.interpolate); 

			path = Editor.graph.createPath(source, dest, stroke, stroke_width, pid);

			// Creating path using data in pathinfo and path data generator
			canvas.append("path")
				.attr("d", d3path(info.pathinfo))
				.attr("id", path.pid)
				.style("stroke", stroke)
				.style("stroke-width", stroke_width)
				.style("fill", "none");		

			// attach the path to the source question
			questions[source].source_paths.push(path);
			questions[dest].destination_paths.push(path);

			// since some paths get deleted we need to make sure we are not reusing the count...i.e.. if p0 was deleted, 
			// and there were paths p1,p2, then the count would be 2 after initiating everything, and when we wanted to add
			// a new path it would overwrite p2
			Editor.main.setPathCount(path.pid);

			return path.pid;
		},

		// if a new path is getting is created, the pid will not be set
		// but if we are rebuilding after a refresh the pid and all the data will just be copied
		createPath: function (source, destination, stroke, stroke_width, pid) {
			var count, path;

			// pid is null if we are creating a new one from advanced or button section
			if (pid === null || typeof pid === "undefined") {
				count = Editor.main.getPathCount();
				pid = 'p'+count;
			} 

			path = {
				pid: pid,
				// this is where the path originates from
				s: source, 
				d: destination,
				stroke: stroke,
				stroke_width: stroke_width
			};

			return path;
		},

		// qid is the source node of the path
		deletePath: function (qid, pid) {
			var source_path_index, dqid, destination_path_index;
			// get the index of the paths array, which holds the path object we want to remove
			source_path_index = Editor.utils.findIndex('pid', pid, questions[qid].source_paths);
			// this is the destination qid of the path - we need this to remove the path object from the array in the destination question
			dqid = questions[qid].source_paths[source_path_index].d;
			// now we can look up what index of the array holds the path object in the destination_paths array of the question with the end point of the path
			destination_path_index = Editor.utils.findIndex('pid', pid, questions[dqid].destination_paths);

			d3.select("#"+pid).remove();
			delete questions[qid].source_paths[source_path_index];
			delete questions[dqid].destination_paths[destination_path_index];
		},

		moveNode: function (qid, x,y) { 
			var nodeid = qid,
				textid = questions[qid].text_id,
				// use this to position the text 
				xoffset = 2, 
				yoffset = 10;

			d3.select("#"+ nodeid).data([{x: x, y: y}]);
			// this updates the doms svg rect
			d3.select("#"+ nodeid).attr("x",x);
			d3.select("#"+ nodeid).attr("y",y);

			//move the text id with the node
			d3.select("#"+ textid).attr("x",x + xoffset);
			d3.select("#"+ textid).attr("y",y + yoffset);

			// update the node x and y values in the question object
			questions[qid].node.x = x;
			questions[qid].node.y = y;

		},

		// this function just moves the paths around after graph reorder...none of the destinations re changing
		movePaths: function (qid) {
			var source = questions[qid], dest, info, pid, dx, dy, d3path;

			dx = function(d) { return d.x; };
			dy = function(d) { return d.y; };

			// check if the question has any source paths
			if (source.source_paths.length !== 0) {
				for (var i = 0; i < source.source_paths.length; i+=1) {
					if (source.source_paths[i] !== null && typeof source.source_paths[i] !== 'undefined') {
						dest = questions[source.source_paths[i].d];
						info = pathInfo(source, dest);
						// this is the path id that connects the source and destination
						pid = source.source_paths[i].pid; 

						// Specify the function for generating path data             
						d3path = d3.svg.line()
							.x(dx)
							.y(dy)
							.interpolate(info.interpolate); 

						d3.select("#"+pid).attr("d", d3path(info.pathinfo));
					}
				}
			}
		},

		// This function changes a path from one destination to another
		// @id is the path to change
		// @qid is of the source
		// @new_destination is the question we changed to in the drop down
		// @old_destinatio is what th drop down was set to before
		changePathDestination: function (pid, qid, new_destination, old_destination) { 
			var source = questions[qid];
			var d3path, new_path, destination_path_index, source_path_index;
			var dest = questions[new_destination];
			var info = pathInfo(source, dest);

			// Specify the function for generating path data             
			d3path = d3.svg.line()
				.x(function(d){return d.x;})
				.y(function(d){return d.y;})
				.interpolate(info.interpolate); 

			d3.select("#"+pid).attr("d", d3path(info.pathinfo));

			// get the path from the source object
			source_path_index = Editor.utils.findIndex('pid', pid, questions[qid].source_paths);
			// this var gets the array index of the path we need
			destination_path_index = Editor.utils.findIndex('pid', pid, questions[old_destination].destination_paths);

			// update the question object with the new destination
			questions[qid].source_paths[source_path_index].d = new_destination;
			new_path = questions[qid].source_paths[source_path_index];

			// remove the path from the destination_paths array in the old destination question 
			// since we no longer have a path end at this question it needs to be removed from the destination paths array
			delete questions[old_destination].destination_paths[destination_path_index];

			// add the path to the destination_paths in the new destination question
			questions[new_destination].destination_paths.push(new_path);
		},

		moveTo: function (qid) {
			var x = parseInt(d3.select("#"+ qid).data()[0].x * (scale_factor), 10);
			var y  = parseInt(d3.select("#"+ qid).data()[0].y * (scale_factor), 10);

			// when the scale factor is not 1, we need to offset the scrolling
			$('#container').scrollLeft(x-100).scrollTop(y-100);
			//$('#container').scrollTop(y);		
		},

		scaleGraph: function (type) {
			var increment = 0.2;
			var zoom;

			if (type === 'scale-up') {
				// there is no need to scale the graph larger
				if (scale_factor <= 1) { 
					zoom = (parseFloat(scale_factor,10) + parseFloat(increment,10)).toFixed(2);
					canvas.attr("transform", " scale(" + zoom + ")");
					scale_factor = zoom;
				}
			} else if (type === 'scale-down') {
				if (scale_factor > 0.2) {
					zoom = (scale_factor - parseFloat(increment,10)).toFixed(2);
					canvas.attr("transform", " scale(" + zoom + ")");
					scale_factor = zoom;
				}
			}
		}, 

		// prepare the data to be sent over to the server and have a graph generated by graphviz
		orderGraph: function () {
			var nodes = {};
			var qid;
			var start = Editor.settings.getStart();
			// array of ordered nodes...use this so graphs are consistent 
			var ordered = dfs(start, []); 

			for (var i = 0; i < ordered.length; i+=1) {
				qid = ordered[i];
				nodes[qid] = [];
				// if there are source paths push them onto the new obj
				if (questions[qid].source_paths.length !== 0) { 
					for (var j = 0; j < questions[qid].source_paths.length; j+=1) {
						if (questions[qid].source_paths[j] !== null && typeof questions[qid].source_paths[j] !== 'undefined') {
							nodes[qid].push(questions[qid].source_paths[j].d);
						}
					}
				}
			}

			// we need to add any elements that are not attached...dfs will not find these
			for (var q in questions) {
				if (questions.hasOwnProperty(q)) {
					if (nodes[q] === null || typeof nodes[q] === 'undefined') {
						nodes[q] = [];

						if (questions[q].source_paths) {
							for (var k = 0; k < questions[q].source_paths.length; k+=1) {
								if (questions[q].source_paths[k]) {
									nodes[q].push(questions[q].source_paths[k].d);
								}
							}
						}
					} 
				}
			}

			return {
				nodes: nodes,
				start: start
			};
		},

		// Clone a question and all its contents, except for the paths (change to none)
		// @qid is the active qid when we click the clone button...it is what we are going to clone
		cloneQuestion: function (qid) {
			var count = Editor.main.getQuestionCount();
			var clone = $.extend(true, {}, questions[qid]);

			clone._id = count;
			clone.qid = 'q'+count;
			clone.text_id = 'qt'+count;

			// we don't want to copy any of the paths when we clone
			clone.source_paths = [];
			clone.destination_paths = [];

			//move the the left a little bit
			clone.node.x = clone.node.x + 80;

			// go through each button and make sure we set all the path destination and pids to none and null
			if (clone.buttons.length !== 0) {
				for (var i = 0; i < clone.buttons.length; i+=1) {
					if (clone.buttons[i].pid !== null || clone.buttons[i].pid !== '' ) {
						clone.buttons[i].destination = 'none';
						clone.buttons[i].pid = null;
					}	
				}
			}

			// go through each advanced action and if there is a goto, change the path to none
			if (clone.advanced.length !== 0) {
				for (var j = 0; j < clone.advanced.length; j+=1) {
					if (clone.advanced[j].actions !== null && typeof clone.advanced[j].actions !== 'undefined') {
						for (var k = 0; k < clone.advanced[j].actions.length; k+=1) {
							if (clone.advanced[j].actions[k].action === 'goto') {
								clone.advanced[j].actions[k].value = 'none';
								clone.advanced[j].actions[k].pid = null;
							}
						}
					}
				}
			}
			return Editor.graph.addQuestion(clone);
		}
	};
}());