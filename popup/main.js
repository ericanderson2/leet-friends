"use strict";

// TODO
// Notifications for daily

if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

const version = "1.8";
const checkbox_settings = ["easter_eggs", "stars", "nickname", "pin_notify", "show_daily", "badges", "daily_notifications"];
const value_settings = ["sort_method", "poll_time"];

const friends_list = document.getElementById("friend-list");
const no_friends = document.getElementById("no-friends");
const main_spinner = document.getElementById("main-spinner");
const searching_friend = document.getElementById("searching-friend");
const add_friend_bar = document.getElementById("add-friend");
const settings_panel = document.getElementById("settings");
const footer = document.getElementById("footer");

const defaults = {
  "easter_eggs": true,
  "stars": false,
  "nickname": true,
  "pin_notify": true,
  "sort_method": "submitted",
  "poll_time": "30000",
  "show_daily": true,
  "badges": true,
  "daily_notifications": false
}

const required = {
  origins: ["https://leetcode.com/graphql"]
};

const emojis = {
  "10": "🔟",
  "69": "😏",
  "100": "💯",
  "314": "🥧",
  "365": "📅",
  "420": "🌿",
  "500": "🔥",
  "555": "📞",
  "666": "😈",
  "777": "🍀",
  "1000": "🤓",
  "1337": "💻"
}

let isSignedIn = false;
let friends = [];
let aliases = {};
let watching = [];
let settings = {};
let last_version = "1.0";

document.getElementById("add-button").addEventListener("click", () => add_friend());
document.getElementById("enter-settings").addEventListener("click", () => toggle_settings());
document.getElementById("exit-settings").addEventListener("click", () => toggle_settings());
document.getElementById("user-input").addEventListener("input", filterField);

document.getElementById("enable-perms").addEventListener("click", () => {
  browser.permissions.request(required);
  window.close();
});

for (let element of checkbox_settings.concat(value_settings)) {
  document.getElementById(element).addEventListener("input", settings_changed);
}

browser.storage.sync.get("version").then(res => {
  last_version = res.version ?? "1.0";
  if (last_version != version) {
      browser.storage.sync.set({
        "version": version
      });
  }
}).then(
browser.storage.sync.get("settings").then(res => {
  settings = res.settings || {};

  Object.entries(defaults).forEach(([key, val]) => {
    settings[key] = settings[key] ?? val;

    if (last_version == "1.0") {
      // This can be used to reset settings to default for given versions
      settings[key] = val;
    }
  });

  for (let element of checkbox_settings) {
    document.getElementById(element).checked = settings[element];
  }

  for (let element of value_settings) {
    document.getElementById(element).value = settings[element];
  }

  whoami();
  daily();
}));

// Check permissions and load data from storage
browser.permissions.contains(required).then(has_perms => {
  if (has_perms) {
    browser.storage.sync.get("aliases").then(res => {
      aliases = res.aliases || {};
    }).then(
    browser.storage.sync.get("watching").then(res => {
      watching = res.watching || [];
    })).then(
    browser.storage.sync.get("friends").then(res => {
        friends = res.friends || [];
        for (let i in friends) {
          get_user(friends[i]);
        }

        if (friends.length == 0) {
          no_friends.classList.remove("hidden");
        } else {
          main_spinner.classList.remove("hidden");
        }

    }));
  } else {
    footer.classList.add("hidden");
    document.getElementById("enter-settings").classList.add("hidden");
    document.getElementById("perms").classList.remove("hidden");
  }
});

async function whoami() {
  let url = `https://leetcode.com/graphql/?query=query {
    userStatus {
        username
        isSignedIn
    }
  }`;
  browser.runtime.sendMessage(url, data => {
    if (data["userStatus"]["isSignedIn"] == true) {
      isSignedIn = true
      document.getElementById("signed-in-name").innerText = data["userStatus"]["username"];

      if (settings["show_daily"]) {
        document.getElementById("daily-link").classList.remove("hidden");
      }
    }
  });
}

async function daily() {
  let url = `https://leetcode.com/graphql/?query=query {
    activeDailyCodingChallengeQuestion {
        date
        userStatus
        link
        question {
            questionFrontendId
            challengeQuestion {
                incompleteChallengeCount
                streakCount
            }
        }
    }
}`;
  browser.runtime.sendMessage(url, data => {
    let question = data["activeDailyCodingChallengeQuestion"];
    if (question["userStatus"] == "Finish") {
      document.getElementById("daily-image").src = "../images/daily_complete.png";
    }
    document.getElementById("daily-link").href = "https://leetcode.com" + escape(question["link"]);
  });
}

// Retrieves a user's profile information
async function get_user(username, callback = data => received_user(data)) {
  let url = `https://leetcode.com/graphql/?query=query{
  matchedUser(username: "${username}") {
      username
      contributions {
          points
      }
      profile {
          realName
          starRating
          userAvatar
          ranking
      }
      submitStats {
          acSubmissionNum {
              difficulty
              count
              submissions
          }
          totalSubmissionNum {
              difficulty
              count
              submissions
          }
      }
      badges {
          id
          icon
      }
      activeBadge {
          id
      }
  }
  recentSubmissionList(username: "${username}", limit: 1) {
      timestamp
  }
}`;
  browser.runtime.sendMessage(url, callback);
}

function toggle_settings() {
  if (settings_panel.classList.contains("hidden")) {
    settings_panel.classList.remove("hidden");
    no_friends.classList.add("hidden");
    friends_list.classList.add("hidden");
    main_spinner.classList.add("hidden");
    footer.classList.add("hidden");
    return;
  }

  settings_panel.classList.add("hidden");
  friends_list.classList.remove("hidden");
  footer.classList.remove("hidden");
  if (friends.length == 0) {
    no_friends.classList.remove("hidden");
  }
}

function settings_changed(e) {
  if (e.target.type == "checkbox") {
    settings[e.target.id] = e.target.checked;
  } else {
    settings[e.target.id] = e.target.value;
  }

  browser.storage.sync.set({
    "settings": settings
  });

  switch (e.target.id) {
    case "stars":
      let stars_list = document.getElementsByClassName("stars");
      if (settings["stars"]) {
        [].forEach.call(stars_list, e => e.classList.remove("hidden"));
      } else {
        [].forEach.call(stars_list, e => e.classList.add("hidden"));
      }
      break;

    case "easter_eggs":
      let emoji_all = document.getElementsByClassName("emoji-all");
      let plain_all = document.getElementsByClassName("plain-all");

      if (settings["easter_eggs"]) {
        [].forEach.call(emoji_all, e => e.classList.remove("hidden"));
        [].forEach.call(plain_all, e => e.classList.add("hidden"));
      } else {
        [].forEach.call(emoji_all, e => e.classList.add("hidden"));
        [].forEach.call(plain_all, e => e.classList.remove("hidden"));
      }
      break;

    case "nickname":
      if (settings["nickname"]) {
        friends.forEach(username => {
          document.getElementById("headline-" + username).innerText = (username in aliases) ? aliases[username] : username;
        });
      } else {
        friends.forEach(username => {
          document.getElementById("headline-" + username).innerText = (username in aliases) ? aliases[username] + " (" + username + ")" : username;
        });
      }
      break;

    case "show_daily":
      if (settings["show_daily"] && isSignedIn) {
        document.getElementById("daily-link").classList.remove("hidden");
      } else {
        document.getElementById("daily-link").classList.add("hidden");
      }
      break;

    case "badges":
      let badge_list = document.getElementsByClassName("badge-container");
      if (settings["badges"]) {
        [].forEach.call(badge_list, e => e.classList.remove("hidden"));
      } else {
        [].forEach.call(badge_list, e => e.classList.add("hidden"));
      }
      break;
  }

  sort_friends();
}

function received_user(data) {
  if (data["matchedUser"] != null) {
    create_friend_box(data);
  }
}

function filterField(e) {
  let t = e.target;
  let badValues = /[^\w\d]/gi;
  t.value = t.value.replace(badValues, '');
}

function add_friend() {
  let user = document.getElementById("user-input").value;
  if (user.length > 0) {
    if (friend_in_list(user)) {
        flash_error("User already exists in friends list");
        return
    }

    get_user(document.getElementById("user-input").value, data => validate_new_friend(data));
    document.getElementById("added-username").innerText = user;
    searching_friend.classList.remove("hidden");
    add_friend_bar.classList.add("hidden");
  }
}

function friend_in_list(user) {
  user = user.toLowerCase();
  for (let i in friends) {
    if (friends[i].toLowerCase() === user) {
      return true;
    }
  }
  return false
}

function validate_new_friend(data) {
  searching_friend.classList.add("hidden");
  add_friend_bar.classList.remove("hidden");

  if (data["matchedUser"] != null) {
    document.getElementById("user-input").value = "";
    let user = data["matchedUser"]["username"];
    if (document.getElementById(user) == null) {
      friends.push(user);
      browser.storage.sync.set({
        "friends": friends
      });
      if (friends.length == 1) {
          no_friends.classList.add("hidden");
      }
      create_friend_box(data);
    } else {
      flash_error("User already exists in friends list");
    }
  } else {
    flash_error("Could not find user");
  }
}

function flash_error(message) {
  let element = document.getElementById("err-message");
  element.innerText = message;

  element.classList.remove("hidden");
  setTimeout(() => {
    element.classList.add("hidden");
  }, "2500");
}

function toggle_notifications(username) {
  if (watching.includes(username)) {
    watching = watching.filter(x => x !== username);
    document.getElementById("notify-" + username).classList.add("greyscale");
  } else {
    watching.push(username);
    document.getElementById("notify-" + username).classList.remove("greyscale");
  }
  browser.storage.sync.set({
    "watching": watching
  });

  sort_friends();
}

function remove_friend(username) {
  friends = friends.filter(x => x !== username);
  browser.storage.sync.set({
    "friends": friends
  });

  if (username in aliases) {
    delete aliases[username];
    browser.storage.sync.set({
      "aliases": aliases
    });
  }

  if (watching.includes(username)) {
    watching = watching.filter(x => x !== username);
    browser.storage.sync.set({
      "watching": watching
    });
  }

  document.getElementById(username).remove();
  if (friends.length == 0) {
      no_friends.classList.remove("hidden");
  }
}

function edit_friend(username) {
  document.getElementById("eoa-" + username).classList.add("hidden");
  document.getElementById("edit-alias-" + username).classList.remove("hidden");
}

function back_friend(username) {
  document.getElementById("eoa-" + username).classList.remove("hidden");
  document.getElementById("edit-alias-" + username).classList.add("hidden");
}

function change_alias(username) {
  let alias = document.getElementById("alias-input-" + username).value;
  if (alias == username || alias == "") {
    if (username in aliases) {
      delete aliases[username];
    }
    document.getElementById("headline-" + username).innerText = username;
  } else {
    aliases[username] = alias;
    if (settings["nickname"]) {
       document.getElementById("headline-" + username).innerText = alias;
    } else {
      document.getElementById("headline-" + username).innerText = `${alias} (${username})`;
    }
  }

  browser.storage.sync.set({
    "aliases": aliases
  });

  document.getElementById("eoa-" + username).classList.remove("hidden");
  document.getElementById("edit-alias-" + username).classList.add("hidden");
}

function sort_friends() {
  [...friends_list.children]
  .sort((a, b) => {
    if (settings["pin_notify"] && watching.includes(a.getAttribute("caps_user")) !== watching.includes(b.getAttribute("caps_user"))) {
      return watching.includes(a.getAttribute("caps_user")) ? -1 : 1;
    } else {
      if (settings["sort_method"] == "username") {
        return a.getAttribute("user") > b.getAttribute("user") ? 1 : -1;
      } else if (settings["sort_method"] == "rank") {
        return Number(a.getAttribute("rank")) > Number(b.getAttribute("rank")) ? 1 : -1;
      } else {
        return Number(a.getAttribute("submitted")) > Number(b.getAttribute("submitted")) ? 1 : -1;
      }
    }
  }).forEach(node => friends_list.appendChild(node));
}

// Remove all characters that are not letters or digits
function sanitize(value) {
  let badValues = /[^\w\d]/gi;
  return String(value).replace(badValues, '');
}

function escape(value) {
  return String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
}

function create_friend_box(data) {
  let user = sanitize(data["matchedUser"]["username"]);
  if (document.getElementById(user) != null) {
    return
  }
  main_spinner.classList.add("hidden");

  let points = sanitize(data["matchedUser"]["contributions"]["points"]);
  let avatar = escape(data["matchedUser"]["profile"]["userAvatar"]);
  let rank = parseInt(sanitize(data["matchedUser"]["profile"]["ranking"]), 10);
  let ranking = rank.toLocaleString();
  let all = sanitize(data["matchedUser"]["submitStats"]["acSubmissionNum"][0]["count"]);
  let easy = sanitize(data["matchedUser"]["submitStats"]["acSubmissionNum"][1]["count"]);
  let medium = sanitize(data["matchedUser"]["submitStats"]["acSubmissionNum"][2]["count"]);
  let hard = sanitize(data["matchedUser"]["submitStats"]["acSubmissionNum"][3]["count"]);
  let submission_percent = (data["matchedUser"]["submitStats"]["totalSubmissionNum"][0]["submissions"] == 0) ? 0 : Math.round(100 * data["matchedUser"]["submitStats"]["acSubmissionNum"][0]["submissions"] / data["matchedUser"]["submitStats"]["totalSubmissionNum"][0]["submissions"]);
  submission_percent = sanitize(submission_percent);

  // Calculate number of days since last submission
  let days = -1
  let now = new Date;
  let utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() ,
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());

  let hours = false;
  let minutes = false;
  let milliseconds = 0;
  if (data["recentSubmissionList"].length > 0) {
    milliseconds = (utc_timestamp / 1000) - data["recentSubmissionList"][0]["timestamp"];
    if (milliseconds >= 60 * 60 * 24) {
      days = Math.floor(milliseconds / (60 * 60 * 24));
    } else if (milliseconds >= 60 * 60) {
      hours = true;
      days = Math.ceil(milliseconds / (60 * 60));
    } else {
      minutes = true;
      days = Math.ceil(milliseconds / 60);
    }
    days = Number(days);
  }

  let stars = "";
  for (let i = 0; i < data["matchedUser"]["profile"]["starRating"]; i++) {
    stars += "⭐";
  }

  let emoji = "⬛";
  if (all in emojis) {
    emoji = emojis[all];
  }
  let headline = (user in aliases) ? `${aliases[user]} <span>(${user})</span>` : user;
  if (settings["nickname"]) {
    headline = (user in aliases) ? `${aliases[user]}` : user;
  }

  let badge_icon = "";
  if (data["matchedUser"]["activeBadge"] !== null) {
    for (let badge of data["matchedUser"]["badges"]) {
      if (badge["id"] == data["matchedUser"]["activeBadge"]["id"]) {
        badge_icon = badge["icon"];
        break;
      }
    }
    if (!badge_icon.startsWith("http")) {
      badge_icon = "https://leetcode.com" + badge_icon;
    }
    badge_icon = escape(badge_icon);
  }

  var div = document.createElement("div");
  // All values have been sanitized
  div.innerHTML = `<img src="${avatar}" class="avatar" alt="avatar" />
    <div class="badge-container ${settings["badges"] ? "" : "hidden"}"><img src="${badge_icon}" class="badge ${badge_icon.length == 0 ? "hidden" : ""}" alt="badge"/></div>
    <div class="east-of-avatar flex" id="eoa-${user}">
      <div class="flex user-row">
        <h3><a target="_blank" href="https://leetcode.com/${user}" id="headline-${user}">${headline}</a></h3>
        <p class="last-online">Submitted ${(days > -1) ? days : "∞"} ${(minutes) ? "Minute" : ((hours) ? "Hour" : "Day")}${(days == 1) ? "" : "s"} Ago</p>
        <div class="flex-fill">
          <button class="friend-button remove-button" id="rm-${user}">x</button>
          <button class="friend-button edit-button greyscale" id="notify-${user}">🔔</button>
          <button class="friend-button edit-button" id="ed-${user}">✎</button>
        </div>
      </div>
      <div class="flex user-row">
        <p>Rank: ${ranking} <span class="stars ${settings["stars"] ? "" : "hidden"}">${stars}</span></p>
        <div class="flex-fill">
          <p style="float:right;">🪙 ${points}</p>
        </div>
      </div>
      <div class="flex user-row">
        <p><span class="emoji-all ${settings["easter_eggs"] ? "" : "hidden"}">${emoji}</span><span class="plain-all ${settings["easter_eggs"] ? "hidden" : ""}">⬛</span>${all} 🟩${easy} 🟨${medium} 🟥${hard}</p>
        <div class="flex-fill">
          <p style="float:right;">${submission_percent}% AC</p>
        </div>
      </div>
    </div>
    <div class="change-alias flex hidden" id="edit-alias-${user}">
      <div class="alias-col">
        <p>Change nickname for <span class="bold">${user}</span>:</p>
        <input type="text" placeholder="${user}" id="alias-input-${user}"></input>
      </div>
      <div class="alias-col">
        <button type="button" class="alias-button red-button" id="bk-${user}">Back</button>
        <button type="button" class="alias-button" id="ch-${user}">Change</button>
      </div>
    </div>`;

    div.classList.add("friend-box");
    div.classList.add("flex");
    document.getElementById("friend-list").appendChild(div);

    div.id = user;

    // Attributes are used for sorting
    div.setAttribute("user", user.toLowerCase());
    div.setAttribute("caps_user", user);
    div.setAttribute("rank", rank);
    div.setAttribute("submitted", milliseconds > 0 ? milliseconds : Infinity);

    document.getElementById("rm-" + user).addEventListener("click", () => remove_friend(user));
    document.getElementById("ed-" + user).addEventListener("click", () => edit_friend(user));
    document.getElementById("bk-" + user).addEventListener("click", () => back_friend(user));
    document.getElementById("ch-" + user).addEventListener("click", () => change_alias(user));
    document.getElementById("notify-" + user).addEventListener("click", () => toggle_notifications(user));
    document.getElementById("alias-input-" + user).addEventListener("input", filterField);

    if (watching.includes(user)) {
      document.getElementById("notify-" + user).classList.remove("greyscale");
    }

    sort_friends();
}
