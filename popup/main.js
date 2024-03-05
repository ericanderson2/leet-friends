"use strict";

if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

document.getElementById("add-button").addEventListener("click", () => add_friend());
document.getElementById("user-input").addEventListener("input", filterField);

document.getElementById("enable-perms").addEventListener("click", () => {
  browser.permissions.request(required);
  window.close();
});

const friends_list = document.getElementById("friend-list");
const no_friends = document.getElementById("no-friends");
const main_spinner = document.getElementById("main-spinner");
const searching_friend = document.getElementById("searching-friend");
const add_friend_bar = document.getElementById("add-friend");

let required = {
  origins: ["https://leetcode.com/graphql"]
};

let friends = [];
let aliases = {};
let watching = [];

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
    document.getElementById("footer").classList.add("hidden");
    document.getElementById("perms").classList.remove("hidden");
  }
});

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
  }
  recentSubmissionList(username: "${username}", limit: 1) {
      timestamp
  }
}`;
  browser.runtime.sendMessage(url, callback);
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
    document.getElementById("headline-" + username).innerText = `${alias} (${username})`;
  }

  browser.storage.sync.set({
    "aliases": aliases
  });

  document.getElementById("eoa-" + username).classList.remove("hidden");
  document.getElementById("edit-alias-" + username).classList.add("hidden");
}

function sort_friends() {
  [...friends_list.children]
  .sort((a, b) => a.getAttribute("user") > b.getAttribute("user") ? 1 : -1)
  .forEach(node => friends_list.appendChild(node));
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
  let ranking = parseInt(sanitize(data["matchedUser"]["profile"]["ranking"]), 10).toLocaleString();
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
  if (data["recentSubmissionList"].length > 0) {
    let milliseconds = (utc_timestamp / 1000) - data["recentSubmissionList"][0]["timestamp"];
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

  let headline = (user in aliases) ? `${aliases[user]} <span>(${user})</span>` : user;

  var div = document.createElement("div");
  // All values have been sanitized
  div.innerHTML = `<img src="${avatar}" class="avatar" alt="avatar"/>
    <div class="flex-fill" class="east-of-avatar" id="eoa-${user}">
      <div class="flex user-row">
        <h3><a href="https://leetcode.com/${user}" id="headline-${user}">${headline}</a></h3>
        <p class="last-online">Submitted ${(days > -1) ? days : "∞"} ${(minutes) ? "Minute" : ((hours) ? "Hour" : "Day")}${(days == 1) ? "" : "s"} Ago</p>
        <div class="flex-fill">
          <button class="friend-button remove-button" id="rm-${user}">x</button>
          <button class="friend-button edit-button greyscale" id="notify-${user}">🔔</button>
          <button class="friend-button edit-button" id="ed-${user}">✎</button>
        </div>
      </div>
      <div class="flex user-row">
        <p>Rank: ${ranking} ${stars}</p>
        <div class="flex-fill">
          <p style="float:right;">🪙 ${points}</p>
        </div>
      </div>
      <div class="flex user-row">
        <p>⬛${all} 🟩${easy} 🟨${medium} 🟥${hard}</p>
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
    div.setAttribute("user", user.toLowerCase()); // used for sorting friends list alphabetically

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
