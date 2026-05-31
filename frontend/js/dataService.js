/**
 * DataService — single data-access layer for Smart Outdoor Planner.
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  USE_API = false  →  mock data (no server needed)   │
 * │  USE_API = true   →  local Express server on :3000  │
 * │  Change API_URL for AWS after deploying Lambda      │
 * └─────────────────────────────────────────────────────┘
 */

const DataService = (() => {

  // ── Config: flip this to switch modes ────────────────────────────────────
  const USE_API = true;
  //const API_URL = "http://localhost:3000";
  const API_URL = "https://wgt7bau8t2.execute-api.us-east-1.amazonaws.com/prod";

  // ── Helpers ───────────────────────────────────────────────────────────────

  async function _fetch(path, method = "GET", body = null) {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${path}`, opts);
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
  }

  // ── Local mock state (used when USE_API = false) ──────────────────────────

  let _parks = null;

  function _init() {
    if (_parks) return;
    try {
      const stored = sessionStorage.getItem("parksData");
      _parks = stored ? JSON.parse(stored) : mockParks.map(p => ({ ...p }));
    } catch {
      _parks = mockParks.map(p => ({ ...p }));
    }
  }

  function _persist() {
    sessionStorage.setItem("parksData", JSON.stringify(_parks));
  }

  function _park(parkId)        { return _parks.find(p => String(p.id) === String(parkId)); }
  function _post(park, postId)  { return park?.posts.find(p => p.id === postId); }
  function _cmt(post, cId)      { return post?.comments.find(c => c.id === cId); }

  // ── Parks ─────────────────────────────────────────────────────────────────

  // Normalize DynamoDB response: add id field from parkId / postId
  function _normalize(park) {
    return park ? { ...park, id: park.id ?? park.parkId } : null;
  }
  function _normalizePost(post) {
    return post ? { ...post, id: post.id ?? post.postId } : null;
  }

  async function getParks() {
    if (USE_API) {
      const data = await _fetch("/parks");
      return data.map(_normalize);
    }
    _init(); return _parks;
  }

  async function getPark(parkId) {
    if (USE_API) {
      const [park, posts] = await Promise.all([
        _fetch(`/parks/${parkId}`),
        _fetch(`/parks/${parkId}/posts`)
      ]);
      return _normalize({ ...park, posts: (posts || []).map(_normalizePost) });
    }
    _init(); return _park(parkId) || null;
  }

  async function getParkByName(name) {
    if (USE_API) {
      const parks = await _fetch("/parks");
      const park  = parks.find(p => p.name === name);
      if (!park) return null;
      const parkId = park.parkId || park.id;
      const posts  = await _fetch(`/parks/${parkId}/posts`);
      return _normalize({ ...park, posts: (posts || []).map(_normalizePost) });
    }
    _init(); return _parks.find(p => p.name === name) || null;
  }

  async function updateParkWeather(parkId, weather) {
    if (USE_API) return _fetch(`/parks/${parkId}/weather`, "PATCH", weather);
    _init();
    const park = _park(parkId);
    if (park) { park.weather = weather; _persist(); }
  }

  // ── Posts ─────────────────────────────────────────────────────────────────

  async function addPost(parkId, text, user) {
    if (USE_API) {
      const post = await _fetch(`/parks/${parkId}/posts`, "POST", { text, user });
      return _normalizePost(post);
    }
    _init();
    const park = _park(parkId);
    if (!park) return null;
    const post = { id: `post_${Date.now()}`, user, text, likes: 0, liked: false, comments: [], timestamp: Date.now() };
    park.posts.unshift(post);
    _persist();
    return post;
  }

  async function getUserLikes(userId) {
    if (USE_API) return _fetch(`/likes/${userId}`);
    return [];
  }

  async function getLocation(locationId) {
    if (USE_API) return _fetch(`/locations/${locationId}`);
    return null;
  }

  async function toggleLikePost(parkId, postId, delta = 1, userId = null) {
    if (USE_API) return _fetch(`/parks/${parkId}/posts/${postId}/like`, "PATCH", { delta, userId });
    _init();
    const post = _post(_park(parkId), postId);
    if (!post) return;
    post.liked ? (post.likes--, post.liked = false) : (post.likes++, post.liked = true);
    _persist();
  }

  async function showAllComments(parkId, postId) {
    if (USE_API) return _fetch(`/parks/${parkId}/posts/${postId}/show-all-comments`, "PATCH");
    _init();
    const post = _post(_park(parkId), postId);
    if (post) { post.showAllComments = true; _persist(); }
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  async function addComment(parkId, postId, text, user) {
    if (USE_API) return _fetch(`/parks/${parkId}/posts/${postId}/comments`, "POST", { text, user });
    _init();
    const post = _post(_park(parkId), postId);
    if (!post) return null;
    const comment = { id: `comment_${Date.now()}`, user, text, likes: 0, liked: false, replies: [], repliesVisible: false };
    post.comments.push(comment);
    _persist();
    return comment;
  }

  async function toggleLikeComment(parkId, postId, commentId, delta = 1, userId = null) {
    if (USE_API) return _fetch(`/parks/${parkId}/posts/${postId}/comments/${commentId}/like`, "PATCH", { delta, userId });
    _init();
    const comment = _cmt(_post(_park(parkId), postId), commentId);
    if (!comment) return;
    comment.liked ? (comment.likes--, comment.liked = false) : (comment.likes++, comment.liked = true);
    _persist();
  }

  async function toggleRepliesVisible(parkId, postId, commentId) {
    if (USE_API) return _fetch(`/parks/${parkId}/posts/${postId}/comments/${commentId}/toggle-replies`, "PATCH");
    _init();
    const comment = _cmt(_post(_park(parkId), postId), commentId);
    if (comment) { comment.repliesVisible = !comment.repliesVisible; _persist(); }
  }

  async function toggleReplyInput(parkId, postId, commentId) {
    // UI-only state, no API call needed
    _init();
    const comment = _cmt(_post(_park(parkId), postId), commentId);
    if (comment) { comment.showReplyInput = !comment.showReplyInput; _persist(); }
  }

  // ── Replies ───────────────────────────────────────────────────────────────

  async function addReply(parkId, postId, commentId, text, user) {
    if (USE_API) return _fetch(`/parks/${parkId}/posts/${postId}/comments/${commentId}/replies`, "POST", { text, user });
    _init();
    const comment = _cmt(_post(_park(parkId), postId), commentId);
    if (!comment) return null;
    const reply = { id: `reply_${Date.now()}`, user, text, likes: 0, liked: false };
    comment.replies.push(reply);
    comment.repliesVisible = true;
    comment.showReplyInput = false;
    _persist();
    return reply;
  }

  async function toggleLikeReply(parkId, postId, commentId, replyId, delta = 1, userId = null) {
    if (USE_API) return _fetch(`/parks/${parkId}/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, "PATCH", { delta, userId });
    _init();
    const comment = _cmt(_post(_park(parkId), postId), commentId);
    const reply = comment?.replies.find(r => r.id === replyId);
    if (!reply) return;
    reply.liked ? (reply.likes--, reply.liked = false) : (reply.likes++, reply.liked = true);
    _persist();
  }

  // ── Ratings ───────────────────────────────────────────────────────────────

  async function submitRating(parkId, userId, rating) {
    if (USE_API) return _fetch(`/parks/${parkId}/ratings`, "POST", { userId, rating });
    _init();
    const park = _park(parkId);
    if (!park) return;
    if (!park.ratings) park.ratings = [];
    const existing = park.ratings.find(r => r.userId === userId);
    if (existing) { existing.rating = rating; } else { park.ratings.push({ userId, rating }); }
    _persist();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function login(username, password) {
    if (USE_API) {
      const user = await _fetch("/auth/login", "POST", { username, password });
      // DynamoDB returns userId; normalize to id so the rest of the app works
      return user ? { ...user, id: user.id ?? user.userId } : null;
    }
    const user = mockUsers.find(u => u.username === username && u.password === password);
    if (!user) return null;
    return { id: user.id, username: user.username, displayName: user.displayName, email: user.email, avatar: user.avatar, role: user.role };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    getParks, getPark, getParkByName, updateParkWeather,
    getLocation,
    getUserLikes,
    addPost, toggleLikePost, showAllComments,
    addComment, toggleLikeComment, toggleRepliesVisible, toggleReplyInput,
    addReply, toggleLikeReply,
    submitRating,
    login
  };

})();
