"use strict";

document.getElementById("add-button").addEventListener("click", () => add_friend());

let friends = ["lee215"];
for (let i in friends) {
  get_user(friends[i]);
}

let aliases = {
  "lee215": "Lee"
}

async function get_user(username, callback = data => received_user(data)) {
  let url = `https://leetcode.com/graphql/?query=query{
  allQuestionsCount {
      difficulty
      count
  }
  matchedUser(username: "${username}") {
      username
      contributions {
          points
      }
      profile {
          realName
          countryName
          starRating
          aboutMe
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

function add_friend() {
  let user = document.getElementById("user-input").value;
  get_user(document.getElementById("user-input").value, data => validate_new_friend(data));
}

function validate_new_friend(data) {
  if (data["matchedUser"] != null) {
    document.getElementById("user-input").value = ""
    create_friend_box(data);
  } else {
    let err = document.getElementById("err-message");
    err.classList.remove("hidden");
    setTimeout(() => {
      err.classList.add("hidden");
    }, "2500");
  }
}

function remove_friend(username) {
  document.getElementById(username).remove();
}

function received_user(data) {
  if (data["matchedUser"] != null) {
    create_friend_box(data);
  }
}

function sort_friends() {
  const friends = document.getElementById("friend-list");

  [...friends.children]
  .sort((a, b) => a.getAttribute("user") > b.getAttribute("user") ? 1 : -1)
  .forEach(node => friends.appendChild(node));
}

function create_friend_box(data) {
  let user = data["matchedUser"]["username"];
  let points = data["matchedUser"]["contributions"]["points"];
  let avatar = data["matchedUser"]["profile"]["userAvatar"];
  let ranking = data["matchedUser"]["profile"]["ranking"].toLocaleString();
  let all = data["matchedUser"]["submitStats"]["acSubmissionNum"][0]["count"];
  let easy = data["matchedUser"]["submitStats"]["acSubmissionNum"][1]["count"];
  let medium = data["matchedUser"]["submitStats"]["acSubmissionNum"][2]["count"];
  let hard = data["matchedUser"]["submitStats"]["acSubmissionNum"][3]["count"];
  let submission_percent = (data["matchedUser"]["submitStats"]["totalSubmissionNum"][0]["submissions"] == 0) ? 0 : Math.round(100 * data["matchedUser"]["submitStats"]["acSubmissionNum"][0]["submissions"] / data["matchedUser"]["submitStats"]["totalSubmissionNum"][0]["submissions"]);
  let days = -1
  var now = new Date;
  var utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() ,
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
  if (data["recentSubmissionList"].length > 0) {
    days = Math.floor(((utc_timestamp / 1000) - data["recentSubmissionList"][0]["timestamp"]) / (60 * 60 * 24));
  }
  let stars = "";
  for (let i = 0; i < data["matchedUser"]["profile"]["starRating"]; i++) {
    stars += "⭐";
  }
  let headline = (user in aliases) ? `${aliases[user]} <span>(${user})</span>` : user;

  var div = document.createElement("div");
  div.innerHTML = `<img src="${avatar}" class="avatar" alt="avatar"/>
  <div class="flex-fill" style="margin-top:5px;margin-bottom:5px;">
    <div class="flex user-row">
      <h3><a href="https://leetcode.com/${user}">${headline}</a></h3>
      <p class="last-online">Submitted ${(days > -1) ? days : "∞"} Day${(days == 1) ? "" : "s"} Ago</p>
      <div class="flex-fill">
        <button style="float:right;" class="remove-button" id="rm-${user}">x</button>
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
    </div>`

    div.classList.add("friend-box");
    div.classList.add("flex");
    document.getElementById("friend-list").appendChild(div);

    div.id = user;
    div.setAttribute("user", user.toLowerCase());
    document.getElementById("rm-" + user).addEventListener("click", () => remove_friend(user));

    sort_friends();
}
