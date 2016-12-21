#Changelog

##Version 0.9.12 (2016-12-20)

- Add route for processing a saved interview with its deliverables

##Version 0.9.11 (2016-09-01)

- Use unique state id's to prevent data leakage into other interviews

##Version 0.9.6 (2015-10-28)

- Fix #27: Multiple continue buttons not working

##Version 0.9.5 (2015-07-15)

- Feature: Ability to control whether the output deliverable filename contains the interview name

##Version 0.9.4 (2015-07-15)

- Feature: Ability to assign partial interviews to other users
- Feature: Show the number of characters left in textareas
- Add user name and email to list of saved interview
- Update the default selected text in dropdowns

##Version 0.9.3 (2015-05-31)

- Text-drop down displaying underscores in output deliverables ([#25](https://github.com/ChrisZieba/LogicPull/issues/26))

##Version 0.9.2 (2015-05-27)

###Editor
- Feature: Save current question data on save ([#25](https://github.com/ChrisZieba/LogicPull/issues/25))

##Version 0.9.1 (2015-03-15)

###Editor
- Add the size option to number fields
- Update the thumbnail preview to show number dropdown defaults
- Bug Fix: Correct issue with number dropdowns (#23)
- Bug Fix: Make sure values do not get cut off in the editor (#24)

###Viewer
- Add boostrap shim and support for Internet Explorer < 9

###Misc
- Prevent interviews from crashing if the graph distance errors out

##Version 0.9.0 (2015-02-18)

###Editor

- New size option for fields (small, medium, large, x-large)
- Add a "new line" option to keep fields on their own line, pushing other fields to the next line
  - this is for use when, for example, you want to use two small fields on a single line and instead of a third small field on the same line, you can place it one the next one
- Button text can now be customized instead of always displaying "Continue", "Exit", "Finish", etc.
  - This option is located in the buttons tab of the question being worked on in the editor

###Admin

 - New admin area for registered users who are not managers
   - This section is available at `/admin`. Users who register when completing an interview can view their completed documents in the `admin` area. Users who are "Managers" will automatically have access to the admin area, but admin users do not have access to the manager unless their account is upgraded by a manager user. 

###Manager

- New layout and design using Twitter Bootstrap 3.2
- Add the ability to reset user passwords
- Add the ability to update admin (non-manager) users to manager users
- Add a search bar to look for completed interviews by clients
- Show the last login date for a user on the users page
- Add the ability to update user privileges
- Add the ability to remove users
- Allow dashes and other special characters in deliverable and interview names (#19)
- Add the ability to update interview descriptions (#17)
- All bypassing email verification when creating new users
- Allow a password to be given when creating users in the manager
  - The password is only applied if "Disable email verification" is used, otherwise the user is emailed a link where they can set their own password
- Allow uploaded PDF forms to be downloaded from the manager (#18)
- Display recently completed and saved interviews on the interview page

###Viewer

- New layout and design using Twitter Bootstrap 3.2
- Keep the learn more fixed on the right side of the screen
- Use modals for tool tips
- Display the interview name and description in the sidebar
- Use answers already given to prepopulate questions being answered again (#2)

###Misc

- Remove node_modules from repository (#22)

**Release Notes**

- This release added some new privileges (`reset_user_passwords`, `view_saved_interviews`, `remove_users`), and in order to use them they need to be applied by a user who has `edit_user` and `edit_privledges` privledges. This can be done on the users page and clicking the edit user button, which is a gear icon.
- If you run into any conflict with `node_modules` when pulling in changes, the easiest way to fix this is by removing the `node_modules` directory, merging the latest code and then installing `node_modules` again.

  ```
  rm -rf node_modules/
  git pull origin master
  npm install
  ```
