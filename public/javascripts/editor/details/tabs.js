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

// The Editor Object
var Editor = Editor || {};
Editor.details = Editor.details || {};

Editor.details.tabs = (function () {

  "use strict";
  
  var active_tab = null;
  var default_tab = 'tab-1';

  return {
    init: function () {
      active_tab = default_tab;
      Editor.details.tabs.showActive(active_tab);
      Editor.details.tabs.eventListeners();
    },
    eventListeners: function () {
      // listens for a click on any tab of the details pop out
      $(".tab-menu").live('click',function() {
        var tab = $(this).data('tab-command');
        var prev_tab;

        // check to make sure the tab we are clicking on is different than the one we are currently on
        if (tab !== active_tab) {
          // if we switch to a different tab, we need to save all the data from the old tab,  and build the new tab data
          // save the tab we are on before clicking on a new one 
          prev_tab = active_tab;

          Editor.details.manager.emptyTabContents(prev_tab); // empty out the contents of a tab before changing to  anew one
          $('.tab-menu').removeClass("open"); 
          $(this).addClass("open");
          Editor.details.tabs.showActive(tab);
        }
      });
    },
    
    showActive: function (target) {
      Editor.details.tabs.hideTabs();
      Editor.details.tabs.setActiveTab(target); // update the new active tab
      Editor.details.manager.buildTabContents(target);
      $("#tab-contents #" + target).show();
    },
    hideTabs: function () {
      $('.tab').hide();
    },
    getActiveTab: function () {
      return active_tab;
    },
    setActiveTab: function (tab) {
      active_tab = tab;
    },
    setDefaultTab: function () {
      Editor.details.tabs.hideTabs();
      $('.tab-menu').removeClass("open"); 
      $('#tabs-menu-list').find("[data-tab-command='" + default_tab + "']").addClass("open");
      Editor.details.tabs.setActiveTab(default_tab);
      $("#tab-contents #" + default_tab).show();
    }
  };
}());