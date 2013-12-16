[LogicPull](https://www.logicpull.com/)
======================================

LogicPull gives you the tools to quickly create advanced question and answer interviews for end-users. The answers are then combined with templates to produce all the documents you need.

Features
--------

[LogicPull](http://www.logicpull.com/) was initially developed to save time and money creating the many legal documents needed for a court preceding. It has since expanded to handle the assembly of PDF, DocX, RTF and XML documents for any project. It is a cloud based automated document assembly service. We give you the tools to quickly create an advanced question and answer interview to be completed by an end user, which in turn creates an answer set to be combined with a template to produce documents.

Please visit [LogicPull](http://www.logicpull.com/) for more information.

[Installation](http://help.logicpull.com/portal/articles/installation)
------------

A full installation tutorial on a Ubuntu 12.04.3 64 bit server is available [here](http://help.logicpull.com/portal/articles/installation-server). To build LogicPull locally, please see this [article](http://help.logicpull.com/portal/articles/installation-local).

Demo
----

The viewer represents the intake system used by end-users, while the editor is the tool used to create them. 

* [Viewer](https://interviews.logicpull.com/active/2): The Résumé Builder is just one the endless guided interviews which can be built with LogicPull. A dynamic series of questions concludes with a fully generated [PDF résumé](http://logicpull.com/demo/sample).
* [Editor](https://logicpull.com/demo/editor/2): This is the tool used to create the Resume Builder. With our powerful editor it is fast and simple to create advanced interviews in the cloud for the purpose of automating document generation.

FAQ
---
* What exactly can I do with LogicPull?
> You can collect answers to dynamic questions through a form built with our editor, then combine those answers with a template to produce PDF, RTF or DocX documents.

System Requirements 
-------------------

The minimum memory requirement for LogicPull, and all its components is 256 MiB of memory. With only the minimum amount of memory available, the interviews will take longer to process than normal, but will complete successfully. This minimum requirement is dependent on the number of users connected to the server, and the complexity of the tasks being performed.

Software Requirements
------------

[LogicPull](http://www.logicpull.com/) uses the software packages listed below. For detailed instruction on how to install please see [here](http://help.logicpull.com/portal/articles/installation).

| Package | Description | License |
| --- | --- | --- |
| [MongoDB 2.0.4](http://www.mongodb.org/) | Database used to store all interviews, and answer sets. | AGPL |
| [nodeJS 0.8.8](http://nodejs.org/) | Server side JavaScript platform. | MIT |
| [stunnel 3.4.22](https://www.stunnel.org/index.html) | Decryption for SSL traffic. | GPL |
| [nginx 1.1.19](http://nginx.org/) | Server for static resources. | BSD |
| [varnish 3.0.2](https://www.varnish-cache.org/) | Used to cache resources. | BSD |
| [graphviz 2.26.3](http://www.graphviz.org/) | Open source graph visualization software, used in editor. | EPL |
| [Apache FOP 1.1](http://xmlgraphics.apache.org/fop/) | Document assembler. | Apache |
| [forever 0.10.0](https://github.com/nodejitsu/forever) | CLI tool to ensure scripts run continuously. | MIT |
| [jQuery 1.8.3](http://jquery.com/) | JavaScript library used on front end. | MIT |
| [jQuery DatePicker 1.6](http://jqueryui.com/datepicker/) | JavaScript date picker. | MIT |

The below node modules can be installed by running `npm install`.

| Package | Description | License |
| --- | --- | --- |
| [express](https://github.com/visionmedia/express) | Web application framework for nodeJS | MIT |
| [socket.io](https://github.com/learnboost/socket.io) | Real-time connection library. | MIT |
| [wysihtml5](https://github.com/xing/wysihtml5) | JavaScript text editor. | MIT |
| [d3](https://github.com/mbostock/d3) | JavaScript Library for manipulating documents. | MIT |
| [graphviz](https://github.com/glejeune/node-graphviz) | JavaScript Wrapper for Graphviz system. | MIT |
| [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/) | Password hashing. | MIT |
| [ejs](https://github.com/visionmedia/ejs) | JavaScript templating engine. | MIT |
| [mongoose](https://github.com/LearnBoost/mongoose) | Object modeling for mongodb. | MIT |
| [connect-mongo](https://github.com/kcbanner/connect-mongo) | Database driver. | MIT |
| [esprima](https://github.com/ariya/esprima) | JavaScript parser. | BSD |
| [escodegen](https://github.com/Constellation/escodegen) | Code generator for parsed JavaScript. | BSD |
| [async](https://github.com/caolan/async) | Asynchronous JavaScript library. | MIT |
| [nodemailer](https://github.com/andris9/Nodemailer) | Module for sending emails. | MIT |
| [moment](https://github.com/moment/moment/) | Date library for parsing, validating, manipulating, and formatting dates. | MIT |
| [accounting](https://github.com/josscrowcroft/accounting.js) | Library for number, money and currency formatting. | MIT |

Docs
----

* [Docs](http://help.logicpull.com/docs)
* [Help](http://help.logicpull.com)

TODO
----

__Manager__ 

* Add functionality to remove users from the manager
* Add functionality to update a users privileges

__Editor__ 

* Complete Validations. The following validations are not yet implemented.
  * min_date
  * max_date  
    To perform validation for these properties, use 'after logic' and check the date using dateDifference().
* Add descending order into number dropwdown in the editor
* Add drop down list of months as a default in the date field
* Create undo function
* Add a variable lookup/finder in the editor
* Select multiple nodes from graph and move
* Disallow duplicate field names

__Viewer__

* Allow users to change a past variable without having to go back to that question and start from there

Known Issues
------------

* The Settings button in the editor view does not work when the debug preview is running.
* Once a date is entered into the viewer, it cannot be cleared, only changed. 
* When adding question text in the editor, the 'Toggle HTML' button does not reset when the question is closed. To prevent any issues, make sure the default compiled view is visible when exiting the question. 
* Adding format in the editor may interfere with the parsers ability to recognize templates. For example, when bolding text, the editor may insert `<%<bold> someVar %></bold>`. This would prevent the parser to recognize the variable `someVar` since the `<bold>` tag was inserted in between the template tags `<% %>`. To prevent this, you can switch to 'HTML View' and move the bold tag to outside the template tag. This is a rare bug that seems to come up only when re-bolding text.

Possible Improvements
---------------------
* Replace ejs templating engine with more robust solution 
* Replace apache FOP with [XMLMind](http://www.xmlmind.com/foconverter/) 
* Use [Twitter BS 3](http://getbootstrap.com/)
* Use mardown instead of wysihtml5 in the editor

License
-------

The platform code for LogicPull is released under the Affero General Public License. This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

Your Content
------------

Any and all audio, text, photos, pictures, graphics, stylesheets, comments, and other content, data or information that you upload, store, transmit, submit, exchange or make available to or via the Platform (hereinafter "Your Content") is generated, owned and controlled solely by you, and not by LogicPull. LogicPull does not claim any ownership rights in Your Content, and you hereby expressly acknowledge and agree that Your Content remains your sole responsibility. 

Liability for Content 
---------------------

You are solely responsible for all of Your Content that you upload, post or distribute to, on or through the Platform, and to the extent permissible by law, LogicPull excludes all liability with respect to all Content (including Your Content) and the activities of its users with respect thereto. LogicPull and its subsidiaries, affiliates, successors, assigns, employees, agents, directors, officers and shareholders hereby exclude, to the fullest extent permitted by law, any and all liability which may arise from any Content uploaded to the Platform by users, including, but not limited to, any claims for infringement of intellectual property rights, rights of privacy or publicity rights, any claims relating to publication of defamatory, pornographic, obscene or offensive material, or any claims relating to the completeness, accuracy, currency or reliability of any information provided by users of the Platform. By using the Platform, you irrevocably waive the right to assert any claim with respect to any of the foregoing against LogicPull or any of its subsidiaries, affiliates, successors, assigns, employees, agents, directors, officers or shareholders.

Author
------
[@ChrisZieba](https://www.twitter.com/ChrisZieba)

Copyright 2013 Chris Zieba