// ==========================
// SCRIPT FOR FEEDBACK SYSTEM
// ==========================

// --- GLOBAL VARIABLES ---
let feedbackData = JSON.parse(localStorage.getItem("feedbacks")) || [];
let reacted = JSON.parse(localStorage.getItem("reactedFeedbacks")) || {};

// Get elements
const list = document.getElementById("feedbackList");
const filter = document.getElementById("filterCategory");
const sort = document.getElementById("sortType");
const form = document.getElementById("feedbackForm");
const msg = document.getElementById("msg");

// ==========================
// WRITE PAGE: SUBMIT FEEDBACK
// ==========================
if (form) {
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const category = document.getElementById("category").value;
    const text = document.getElementById("text").value;
    const urgency = document.getElementById("urgency").value;

    if (!category || !text) {
      msg.textContent = "Please fill all required fields!";
      msg.style.color = "red";
      return;
    }

    const newFeedback = {
      id: Date.now(),
      category,
      text,
      urgency,
      reactions: {}, // now all reactions including 👍 and 👎 are here
      replies: []
    };

    feedbackData.push(newFeedback);
    localStorage.setItem("feedbacks", JSON.stringify(feedbackData));

    form.reset();
    msg.textContent = "✔ Your feedback has been submitted anonymously!";
    msg.style.color = "green";
  });
}

// ==========================
// DISPLAY FEEDBACKS
// ==========================
function displayFeedbacks() {
  if (!list) return;

  list.innerHTML = "";

  let filtered = feedbackData.filter(f => {
    if (!filter || filter.value === "all") return true;
    return f.category === filter.value;
  });

  if (sort && sort.value === "likes") {
    // Sort by 👍 count
    filtered.sort((a, b) => (b.reactions['👍'] || 0) - (a.reactions['👍'] || 0));
  } else {
    filtered.sort((a, b) => b.id - a.id);
  }

  filtered.forEach(f => {
    const div = document.createElement("div");
    div.className = "card";

    // Replies
    let repliesHTML = "";
    if (f.replies && f.replies.length) {
      f.replies.forEach(r => {
        repliesHTML += `<div class="reply-item">${r}</div>`;
      });
    }

    // --- ALL EMOJIS INCLUDING 👍 AND 👎 ---
    const emojis = ["👍", "👎", "❤️", "😂", "😮"];
    let emojiHTML = "";
    emojis.forEach(e => {
      const count = f.reactions[e] || 0;
      const disabled = reacted[f.id] && reacted[f.id][e] ? "disabled" : "";
      emojiHTML += `<button onclick="react('${f.id}', '${e}')" ${disabled}>${e} ${count}</button>`;
    });

    div.innerHTML = `
      <p><strong>${f.category}</strong> (${f.urgency || 'Normal'})</p>
      <p>${f.text}</p>
      <div class="reactions">${emojiHTML}</div>
      <div class="replies">
        <div class="reply-list">${repliesHTML}</div>
        <textarea id="replyInput-${f.id}" placeholder="Write a reply..." rows="2"></textarea>
        <button onclick="addReply('${f.id}')">Reply</button>
      </div>
    `;

    list.appendChild(div);
  });
}

// ==========================
// ADD REPLY
// ==========================
function addReply(id) {
  const input = document.getElementById(`replyInput-${id}`);
  const replyText = input.value.trim();
  if (!replyText) return;

  const index = feedbackData.findIndex(f => f.id == id);
  if (index === -1) return;

  if (!feedbackData[index].replies) feedbackData[index].replies = [];
  feedbackData[index].replies.push(replyText);

  localStorage.setItem("feedbacks", JSON.stringify(feedbackData));
  input.value = "";
  displayFeedbacks();
}

// ==========================
// REACT FUNCTION
// ==========================
function react(id, emoji) {
  const index = feedbackData.findIndex(f => f.id == id);
  if (index === -1) return;

  if (!reacted[id]) reacted[id] = {};

  if (reacted[id][emoji]) {
    alert(`You already reacted with ${emoji}!`);
    return;
  }

  feedbackData[index].reactions[emoji] = (feedbackData[index].reactions[emoji] || 0) + 1;
  reacted[id][emoji] = true;

  localStorage.setItem("feedbacks", JSON.stringify(feedbackData));
  localStorage.setItem("reactedFeedbacks", JSON.stringify(reacted));

  displayFeedbacks();
}

// ==========================
// FILTER & SORT
// ==========================
if (filter) filter.addEventListener("change", displayFeedbacks);
if (sort) sort.addEventListener("change", displayFeedbacks);

// INITIAL DISPLAY
displayFeedbacks();