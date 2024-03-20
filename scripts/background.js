"use strict";

if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

let last_submission_time = {};
let question_cache = {};

let notification_counter = 0;
const default_poll_time = "30000";

const minute = 1000 * 60;
const hour = minute * 60;

browser.runtime.onMessage.addListener(
  function(url, sender, onSuccess) {
    fetch(url).then(response => response.json()).then(data => onSuccess(data["data"]));
    return true;
  }
);

browser.notifications.onClicked.addListener((id, index) => {
  browser.tabs.create({
    url: id.split("^^")[0],
  });
});

keep_alive();
get_friend_updates();
get_daily();

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

      notification_counter += 1;
      browser.notifications.create("https://leetcode.com/" + username + "^^" + notification_counter, {
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

  browser.storage.sync.get("settings").then(res => {
    let settings = res.settings || {};
    setTimeout(get_friend_updates, settings["poll_time"] ?? default_poll_time);
  });
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

// Once this is run, it will schedule itself to run again at the next relevant time
// < 1 hour remaining: schedule d+22 hours for next daily
// < 2 hour remaining: schedule at d-1 hours for 1 hour reminder
// > 2 hour remaining: schedule at d-2 hours for 2 hour reminder
async function get_daily() {
  let url = `https://leetcode.com/graphql/?query=query {
    activeDailyCodingChallengeQuestion {
        date
        userStatus
        link
        question {
            questionFrontendId
            title
            difficulty
        }
    }
    userStatus {
        isSignedIn
    }
}`;
  let response = await fetch(url);
  let json = await response.json();

  let signed_in = json["data"]["userStatus"]["isSignedIn"];

  let data = json["data"]["activeDailyCodingChallengeQuestion"];
  let date = data["date"].split("-");
  let due = new Date(Date.UTC(date[0], date[1] - 1, date[2], 23, 59, 59));
  let milliseconds = due - Date.now();

  if (milliseconds <= 2 * hour + minute * 5) {
    notification_counter += 1;

    let content = `${data["question"]["questionFrontendId"]}. ${data["question"]["title"]} (${data["question"]["difficulty"]})`;
    let link = data["link"];
    let title = "Daily due in les than an hour";

    if (milliseconds >= hour + minute * 5) {
      title = "Daily due in 2 hours";
      setTimeout(get_daily, milliseconds - (hour + 4 * minute));
    } else {
      // In case browser is open until the next day
      setTimeout(get_daily, Date.now() + 22 * hour);
    }

    let res = await browser.storage.sync.get("settings");
    let settings = res.settings || {};

    let daily_notifications = settings["daily_notifications"] ?? false;
    if (signed_in && daily_notifications && data["userStatus"] != "Finish") {
      console.log("notifying");
      browser.notifications.create("https://leetcode.com" + link + "^^" + notification_counter, {
        type: "basic",
        iconUrl: "../images/lf_logo.png",
        title,
        message: content,
      });
    }
  } else {
    setTimeout(get_daily, milliseconds - (2 * hour + 4 * minute));
  }
}
