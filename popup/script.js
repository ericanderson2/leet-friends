friends = ["btl5", "lee215"]

for (i in friends) {
  friend = friends[i]
  const div = document.createElement("div")
  const h3 = document.createElement("h3")
  h3.textContent = friend
  div.appendChild(h3)
  document.getElementById("friend-list").appendChild(div)
}
