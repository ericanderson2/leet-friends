"use strict";

let last_submission_time = {};
let question_cache = {};

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
});

keep_alive();
get_friend_updates();

function keep_alive() {
  let getting = browser.runtime.getPlatformInfo();
  setTimeout(keep_alive, "20000");
}

// Check if a user has made a recent submission, and send a notification if so
async function check_last_submission(username, aliases) {
  let url = `https://leetcode.com/graphql/?query=query{
    recentSubmissionList(username: "${username}", limit: 1) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
    }
  }`;

  let response = await fetch(url);
  let json = await response.json();

  if (json["data"]["recentSubmissionList"].length == 0) {
    return;
  }

  let submission = json["data"]["recentSubmissionList"][0];
  let last_time = last_submission_time[username] ?? -1;

  if (submission["timestamp"] != last_time) {
    if (last_time > -1) {
      let id = await get_question_num(submission["titleSlug"]);

      let content = `${id}. ${submission["title"]} (${submission["statusDisplay"]})`;
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
    } // else: restarted script or new user in watchlist
    last_submission_time[username] = submission["timestamp"];
  }
}

// Check if any friends on the watchlist have made a recent submission
function get_friend_updates() {
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

// Return the frontend id of the given question
async function get_question_num(title_slug) {
  if (title_slug in question_cache) {
    return question_cache[title_slug];
  }

  let url = `https://leetcode.com/graphql/?query=query{
    question(titleSlug: "${title_slug}") {
        questionId
        questionFrontendId
    }
  }`;
  let response = await fetch(url);
  let json = await response.json();

  let id = json["data"]["question"]["questionFrontendId"];
  question_cache[title_slug] = id;

  return id;
}
