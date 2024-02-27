"use strict";

browser.runtime.onMessage.addListener(
  function(url, sender, onSuccess) {
    fetch(url).then(response => response.json()).then(data => onSuccess(data["data"]));
    return true;
    }
);

function check_last_submission(username) {
  let last_time = 0;
  let url = `https://leetcode.com/graphql/?query=query{
  recentSubmissionList(username: "${username}", limit: 1) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
  }
}`;
  fetch(url).then(response => response.json()).then(data => {
    if (data["data"]["recentSubmissionList"].length == 0) {
      return
    }
    let submission = data["data"]["recentSubmissionList"][0];
    if (submission["timestamp"] != last_time) {
      let content = `${submission["title"]} (${submission["statusDisplay"]})`;
      let title = `${username} made a submission`
      browser.notifications.create({
        type: "basic",
        iconUrl: "../images/lf_logo.png",
        title,
        message: content,
      });
    }
  });
}
