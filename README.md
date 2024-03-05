# LeetFriends

LeetFriends is a browser extension that allows you to add "friends" on LeetCode. LeetFriends functions as more of a "following" list, since the users you add will not be notified, nor do they have to add you back.

This extension is not affiliated with LeetCode.

![example](https://raw.githubusercontent.com/ericanderson2/leet-friends/main/example.png)

## Installation Instructions

Firefox: LeetFriends is available in the [Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/leetfriends/)

Chromium browsers: Currently, LeetFriends is only available for Firefox. This code should currently work on Chromium browsers; however, the CSS is not showing correctly.

## How to use

After you install the extension, you must grant permissions to allow it to access the LeetCode API. Open LeetFriends, and click "Enable Permissions", then "Allow", and then reopen the extension.

- Click the extension icon to open the graphical panel.
- Add friends by typing their name in the input box, and clicking the "Add Friend" button.
- Remove friends by clicking on the red delete button in the top right corner of the friend box.
- Edit a friend's nickname by clicking the ✎ button and entering an alias.
- Toggle push notifications for a friend by clicking the 🔔 button.

Each time you open the panel or add a friend, it will take about a second to fetch the data from the LeetCode API.

Once you add a friend, they will remain in your friends list until they are removed.

## Necessary Permissions
- Host access to https://leetcode.com (for API calls)
- Storage (to store friend usernames)
- Notifications (to show notifications for a friend, if toggled)
- Tabs (allows notifications to link to user profile)
- Alarms (to keep background script loaded for push notifications)
