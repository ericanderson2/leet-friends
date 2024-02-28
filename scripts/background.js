"use strict";

let last_submission_time = {}

browser.alarms.create("keep-loaded-alarm", {
  periodInMinutes: 1
});
setTimeout(() => browser.alarms.create("keep-loaded-alarm-1", {
  periodInMinutes: 1
}), "20000");
setTimeout(() => browser.alarms.create("keep-loaded-alarm-2", {
  periodInMinutes: 1
}), "40000");

browser.alarms.onAlarm.addListener(() => {
  console.log("keeping extension alive - log for debug");
});

browser.runtime.onMessage.addListener(
  function(url, sender, onSuccess) {
    fetch(url).then(response => response.json()).then(data => onSuccess(data["data"]));
    return true;
  }
);

browser.notifications.onClicked.addListener((id, index) => {
  browser.tabs.create({
    url: "https://leetcode.com/" + id,
  });
})

get_friend_updates()

function check_last_submission(username, aliases) {
  let url = `https://leetcode.com/graphql/?query=query{
  recentSubmissionList(username: "${username}", limit: 1) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
  }
}`;
  let last_time = last_submission_time[username] ?? -1;

  fetch(url).then(response =>response.json()).then(data => {
    if (data["data"]["recentSubmissionList"].length == 0) {
      return
    }
    let submission = data["data"]["recentSubmissionList"][0];
    if (submission["timestamp"] != last_time) {
      if (last_time > -1) {
        let content = `${submission["title"]} (${submission["statusDisplay"]})`;
        let title = `${username} made a submission`;
        if (username in aliases) {
          title = `${aliases[username]} (${username}) made a submission`;
        }
        browser.notifications.create(username, {
          type: "basic",
          iconUrl: "../images/lf_logo.png",
          title,
          message: content,
        });
      } else {
        console.log("RESTARTED");
      }

      last_submission_time[username] = submission["timestamp"];
    }
  });
}

function get_friend_updates() {
  console.log("polling for updateas");
  let aliases = {};
  browser.storage.sync.get("aliases").then(res => {
    aliases = res.aliases || {};
  }).then(
  browser.storage.sync.get("watching").then(res => {
    let watching = res.watching || [];
    for (let i in watching) {
      check_last_submission(watching[i], aliases);
    }
  }));

  setTimeout(get_friend_updates, "30000");
}
