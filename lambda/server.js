const express = require("express");
const cors    = require("cors");
const app     = express();

app.use(cors());
app.use(express.json());

// Load same mock data as frontend (no duplication)
const { mockParks } = require("../frontend/js/mockData.js");
const { mockUsers } = require("../frontend/js/mockUsers.js");
let parks = JSON.parse(JSON.stringify(mockParks));
let users = JSON.parse(JSON.stringify(mockUsers));

// ── Parks ─────────────────────────────────────────────────────────────────────

app.get("/parks", (req, res) => {
  res.json(parks);
});

app.get("/parks/:id", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  if (!park) return res.status(404).json({ error: "Park not found" });
  res.json(park);
});

app.patch("/parks/:id/weather", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  if (!park) return res.status(404).json({ error: "Park not found" });
  park.weather = req.body;
  res.json({ ok: true });
});

// ── Posts ─────────────────────────────────────────────────────────────────────

app.post("/parks/:id/posts", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  if (!park) return res.status(404).json({ error: "Park not found" });
  const post = {
    id:        `post_${Date.now()}`,
    user:      req.body.user,
    text:      req.body.text,
    likes:     0,
    liked:     false,
    comments:  [],
    timestamp: Date.now()
  };
  park.posts.unshift(post);
  res.json(post);
});

app.patch("/parks/:id/posts/:postId/like", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  const post = park?.posts.find(p => p.id === req.params.postId);
  if (!post) return res.status(404).json({ error: "Post not found" });
  post.liked ? (post.likes--, post.liked = false) : (post.likes++, post.liked = true);
  res.json(post);
});

app.patch("/parks/:id/posts/:postId/show-all-comments", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  const post = park?.posts.find(p => p.id === req.params.postId);
  if (!post) return res.status(404).json({ error: "Post not found" });
  post.showAllComments = true;
  res.json({ ok: true });
});

// ── Comments ──────────────────────────────────────────────────────────────────

app.post("/parks/:id/posts/:postId/comments", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  const post = park?.posts.find(p => p.id === req.params.postId);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const comment = {
    id:             `comment_${Date.now()}`,
    user:           req.body.user,
    text:           req.body.text,
    likes:          0,
    liked:          false,
    replies:        [],
    repliesVisible: false
  };
  post.comments.push(comment);
  res.json(comment);
});

app.patch("/parks/:id/posts/:postId/comments/:commentId/like", (req, res) => {
  const park    = parks.find(p => p.id === req.params.id);
  const post    = park?.posts.find(p => p.id === req.params.postId);
  const comment = post?.comments.find(c => c.id === req.params.commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  comment.liked ? (comment.likes--, comment.liked = false) : (comment.likes++, comment.liked = true);
  res.json(comment);
});

app.patch("/parks/:id/posts/:postId/comments/:commentId/toggle-replies", (req, res) => {
  const park    = parks.find(p => p.id === req.params.id);
  const post    = park?.posts.find(p => p.id === req.params.postId);
  const comment = post?.comments.find(c => c.id === req.params.commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  comment.repliesVisible = !comment.repliesVisible;
  res.json({ repliesVisible: comment.repliesVisible });
});

// ── Replies ───────────────────────────────────────────────────────────────────

app.post("/parks/:id/posts/:postId/comments/:commentId/replies", (req, res) => {
  const park    = parks.find(p => p.id === req.params.id);
  const post    = park?.posts.find(p => p.id === req.params.postId);
  const comment = post?.comments.find(c => c.id === req.params.commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  const reply = {
    id:    `reply_${Date.now()}`,
    user:  req.body.user,
    text:  req.body.text,
    likes: 0,
    liked: false
  };
  comment.replies.push(reply);
  comment.repliesVisible  = true;
  comment.showReplyInput  = false;
  res.json(reply);
});

app.patch("/parks/:id/posts/:postId/comments/:commentId/replies/:replyId/like", (req, res) => {
  const park    = parks.find(p => p.id === req.params.id);
  const post    = park?.posts.find(p => p.id === req.params.postId);
  const comment = post?.comments.find(c => c.id === req.params.commentId);
  const reply   = comment?.replies.find(r => r.id === req.params.replyId);
  if (!reply) return res.status(404).json({ error: "Reply not found" });
  reply.liked ? (reply.likes--, reply.liked = false) : (reply.likes++, reply.liked = true);
  res.json(reply);
});

// ── Ratings ───────────────────────────────────────────────────────────────────

app.get("/parks/:id/ratings", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  if (!park) return res.status(404).json({ error: "Park not found" });
  const ratings = park.ratings ?? [];
  const avg = ratings.length
    ? Number((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1))
    : 0;
  res.json({ ratings, average: avg, count: ratings.length });
});

app.post("/parks/:id/ratings", (req, res) => {
  const park = parks.find(p => p.id === req.params.id);
  if (!park) return res.status(404).json({ error: "Park not found" });
  if (!park.ratings) park.ratings = [];
  const existing = park.ratings.find(r => r.userId === req.body.userId);
  if (existing) { existing.rating = req.body.rating; }
  else { park.ratings.push({ userId: req.body.userId, rating: req.body.rating }); }
  res.json({ message: "Rating saved" });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ─────────────────────────────────────────────────────────────────────────────

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Local API running at http://localhost:${PORT}`);
  console.log("Routes ready:");
  console.log("  GET    /parks");
  console.log("  GET    /parks/:id");
  console.log("  POST   /parks/:id/posts");
  console.log("  POST   /parks/:id/posts/:postId/comments");
  console.log("  POST   /parks/:id/posts/:postId/comments/:commentId/replies");
  console.log("  POST   /parks/:id/ratings");
  console.log("  POST   /auth/login");
});
