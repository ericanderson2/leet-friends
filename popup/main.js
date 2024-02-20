async function get_user(username) {
  let url = `https://leetcode.com/graphql/?query=query{
    allQuestionsCount {
        difficulty
        count
    }
    matchedUser(username: "` + username + `") {
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
    recentSubmissionList(username: "` + username + `", limit: 1) {
        timestamp
    }
}`;
  const response = await fetch(url);
  var data = await response.json();
  return data
}

async function get_multiple(users) {
  promises = []
  for (i in users) {
    promises.push(get_user(users[i]))
  }
  const results = await Promise.allSettled(promises);
  return results
}

get_multiple(["lee215", "btl5", "ericanderson"]).then(result => {
  for (i in result) {
    create_friend_box(result[i]["value"]["data"]);
  }
});

function create_friend_box(data) {
  //var header = document.getElementById("header");
  //var h1 = document.createElement("h1");
  //h1.innerHTML = data["matchedUser"]["contributions"]["points"];
  //header.appendChild(h1);
}
