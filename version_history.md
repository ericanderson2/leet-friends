# Version History

## 1.7
Firefox: 03/17/2024

Chrome: 03/18/2024

- Added setting to change the poll frequency for notifications

## 1.6
Firefox: 03/17/2024

- Added settings menu
- Added ability to change friend ordering method
- Added ability to toggle different elements of the display
- Remove console spam

## 1.5
Firefox: 03/12/2024

Chrome: 03/13/2024

- Remove tabs permission: Apparently this is not required to open a new tab.

## 1.4
Firefox: 03/05/2024

Edge: 03/11/2024

- Added support for Chromium browsers!
- Notifications now show the question number
- Fix CSS to give the same appearance on Firefox and Chrome
- Remove alarms permission: use runtime.getPlatformInfo() to keep the script alive instead

## 1.3
Firefox: 02/28/2024

- Added push notifications on friend submission. Notifications are off by default. Toggle the bell button on a friend in order to be notified whenever they make a submission.
- Require notifications permission: Used to send notifications when a friend makes a submission
- Require alarms permission: Used to keep background script loaded
- Require tabs permission: Allows notification bubbles to link to user profile

## 1.2
Firefox: 02/27/2024

- Added granularity to last submitted time (minutes, hours)
- Rounded avatar corners

## 1.1
Firefox: 02/25/2024

- Remove aliases from browser storage when friend is deleted
- Properly display "submitted x days ago" text when friend has never submitted
- Change alias -> nickname (front-end only)

## 1.0
Firefox: 02/24/2024

- Initial Release
