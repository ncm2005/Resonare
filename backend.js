// tinker.js
const express = require('express');
const app = express();

app.use(express.json());

// Admin credentials
const admin = {
    username: "admin",
    password: "resonare123"
};

// In-memory storage
let loggedInUsers = [];
let feedbackList = [];

// Helper function: Determine sentiment
function getSentiment(message) {
    const msg = message.toLowerCase();
    if (msg.includes("bad") || msg.includes("poor") || msg.includes("worst")) return "Negative";
    if (msg.includes("good") || msg.includes("excellent") || msg.includes("great")) return "Positive";
    return "Neutral";
}

// ---------------- ROUTES ---------------- //

// Home route
app.get('/', (req, res) => {
    res.send("Anonymous Feedback Portal Backend 🚀");
});


// Submit feedback
app.post('/submit-feedback', (req, res) => {
    const { category, message, email, urgency } = req.body;

    // Validate category and urgency
    const validCategories = ["academics", "facilities", "teaching", "events", "solutions"];
    const validUrgency = ["low", "medium", "high"];

    if (!validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({ message: "Invalid category ❌" });
    }

    if (!validUrgency.includes(urgency.toLowerCase())) {
        return res.status(400).json({ message: "Invalid urgency ❌" });
    }

    // Create feedback object
    const feedback = {
        id: feedbackList.length + 1,
        email,
        category: category.toLowerCase(),
        message,
        sentiment: getSentiment(message),
        urgency: urgency.toLowerCase(),  // <-- added for writing filter
        likes: 0,
        dislikes: 0,
        emojis: {
            "👍":0,
            "👎":0,
            "❤️":0, 
            "😂":0,
            "😮":0
            },
        reactedUsers: [],
        replies: [],
        date: new Date()
    };

    feedbackList.push(feedback);
    console.log(feedbackList);
    res.json({ message: "Feedback submitted successfully ✅", feedback });
});

// Admin login
let isAdminLoggedIn = false;
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;

    if (username === admin.username && password === admin.password) {
        isAdminLoggedIn = true;
        res.json({ message: "Admin logged in successfully ✅" });
    } else {
        res.status(401).json({ message: "Invalid credentials ❌" });
    }
});

// View all feedback
app.get('/all-feedback', (req, res) => {
    const email = req.headers.email;
    
    let result = [...feedbackList];  // copy all feedback

    // Reading filters
    const { category, sortBy } = req.query;

    // Filter by category if provided
    if (category) {
        result = result.filter(f => f.category === category.toLowerCase());
    }

    // Sort by likes or dislikes if provided
    if (sortBy === "likes") {
        result.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === "dislikes") {
        result.sort((a, b) => b.dislikes - a.dislikes);
    }

    res.json(result);
});

// Analytics
app.get('/analytics', (req, res) => {
    let summary = {
        total: feedbackList.length,
        positive: 0,
        negative: 0,
        neutral: 0,
        categories: {}
    };

    feedbackList.forEach(f => {
        if (f.sentiment === "Positive") summary.positive++;
        else if (f.sentiment === "Negative") summary.negative++;
        else summary.neutral++;

        if (!summary.categories[f.category]) summary.categories[f.category] = 1;
        else summary.categories[f.category]++;
    });

    summary.positivePercent = ((summary.positive / summary.total) * 100 || 0).toFixed(2);
    summary.negativePercent = ((summary.negative / summary.total) * 100 || 0).toFixed(2);
    summary.neutralPercent = ((summary.neutral / summary.total) * 100 || 0).toFixed(2);

    res.json(summary);
});

// Like or dislike feedback
app.post('/feedback-react', (req, res) => {
    const { feedbackId, email, type } = req.body;

    const feedback = feedbackList.find(f => f.id === feedbackId);
    if (!feedback) return res.status(404).json({ message: "Feedback not found ❌" });
    if (feedback.reactedUsers.includes(email)) return res.status(403).json({ message: "Already reacted ❌" });

    if (type === "like") feedback.likes++;
    else if (type === "dislike") feedback.dislikes++;
    else return res.status(400).json({ message: "Invalid reaction type ❌" });

    feedback.reactedUsers.push(email);
    res.json({ message: "Reaction recorded ✅", feedback });
});
//reply for the feedback
app.post('/reply-feedback', (req, res) => {
    const { feedbackId, email, replyMessage } = req.body;

    

    // Find the feedback
    const feedback = feedbackList.find(f => f.id === feedbackId);
    if (!feedback) return res.status(404).json({ message: "Feedback not found ❌" });

    // Add reply to the feedback's replies array
    feedback.replies.push({
        email,
        message: replyMessage,
        date: new Date()
    });

    res.json({ message: "Reply added successfully ✅", feedback });
});

app.post('/feedback-emoji', (req, res) => {
    const { feedbackId, email, emoji } = req.body;

    // Find feedback
    const feedback = feedbackList.find(f => f.id === feedbackId);
    if (!feedback) return res.status(404).json({ message: "Feedback not found ❌" });

    // Initialize emojis object if not present
    if (!feedback.emojis) feedback.emojis = {"👍":0,"👎":0,"❤️":0, "😂":0, "😮":0};

    // Track if user already reacted with this emoji
    if (!feedback.reactedUsers) feedback.reactedUsers = [];
    const reactionKey = `${email}-${emoji}`;
    if (feedback.reactedUsers.includes(reactionKey)) {
        return res.status(403).json({ message: "Already reacted with this emoji ❌" });
    }

    // Increment emoji count
    if (feedback.emojis[emoji] !== undefined) {
        feedback.emojis[emoji]++;
    } else {
        feedback.emojis[emoji] = 1; // allow new emojis dynamically
    }

    // Add to reactedUsers to prevent duplicate reaction
    feedback.reactedUsers.push(reactionKey);

    res.json({ message: "Emoji reaction recorded ✅", feedback });
});

// ---------------- START SERVER ---------------- //
const PORT = 3000;
const HOST = '0.0.0.0';  // listen on all network interfaces

app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT} 🚀`);
});