/**
 * handler.js — Single Lambda function for Smart Outdoor Planner API
 * Handles all routes, triggered by API Gateway (HTTP API or REST API)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");
const https = require("https");

const db = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
);

// ── Weather update helpers ────────────────────────────────────────────────────

function fetchWeatherForUpdate(lat, lng) {
  return new Promise((resolve, reject) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    https.get(url, (res) => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try {
          const d = JSON.parse(raw);
          resolve({
            temperature:   d.current.temperature_2m,
            precipitation: d.current.precipitation,
            weatherCode:   d.current.weather_code,
            windSpeed:     d.current.wind_speed_10m,
            time:          d.current.time
          });
        } catch (e) { reject(e); }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

function calcScore(w) {
  let score = 100;
  const { temperature: t, precipitation: rain, windSpeed: wind, weatherCode: code } = w;
  if (t < 0 || t > 35) score -= 40;
  else if (t < 5 || t > 30) score -= 25;
  else if (t < 10 || t > 27) score -= 12;
  if (rain >= 5) score -= 45; else if (rain >= 1) score -= 25; else if (rain > 0) score -= 10;
  if (wind >= 35) score -= 30; else if (wind >= 22) score -= 15;
  if (code >= 95) score -= 40; else if (code >= 80) score -= 25;
  else if (code >= 61) score -= 20; else if (code >= 51) score -= 10; else if (code >= 45) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Home locations updated along with parks
const HOME_LOCATIONS = [
  { locationId: "seattle-default", name: "Seattle, WA", lat: 47.6062, lng: -122.3321 }
];

async function runWeatherUpdate() {
  console.log("[WeatherUpdate] Starting...");
  const errors = [];
  const now = Date.now();

  const parksResult = await db.send(new ScanCommand({ TableName: "Parks" }));

  // Fetch all weather in parallel — much faster than sequential
  await Promise.all([
    ...parksResult.Items.map(async (park) => {
      try {
        const weather = await fetchWeatherForUpdate(park.lat, park.lng);
        const score   = calcScore(weather);
        await db.send(new UpdateCommand({
          TableName: "Parks",
          Key: { parkId: park.parkId },
          UpdateExpression: "SET weather = :w, weatherScore = :s, weatherUpdatedAt = :t",
          ExpressionAttributeValues: { ":w": weather, ":s": score, ":t": now }
        }));
        console.log(`  ✓ ${park.name}: ${score}/100`);
      } catch (e) { errors.push(`Park ${park.name}: ${e.message}`); }
    }),
    ...HOME_LOCATIONS.map(async (loc) => {
      try {
        const weather = await fetchWeatherForUpdate(loc.lat, loc.lng);
        const score   = calcScore(weather);
        await db.send(new PutCommand({
          TableName: "Locations",
          Item: { locationId: loc.locationId, name: loc.name,
                  lat: loc.lat, lng: loc.lng, weather, score, updatedAt: now }
        }));
        console.log(`  ✓ ${loc.name}: ${score}/100`);
      } catch (e) { errors.push(`Location ${loc.locationId}: ${e.message}`); }
    })
  ]);

  console.log(`[WeatherUpdate] Done. ${errors.length} error(s).`);
  return { statusCode: 200, headers, body: JSON.stringify({ updated: true, errors }) };
}

// ── Response helpers ──────────────────────────────────────────────────────────

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS"
};

const res = (statusCode, body) => ({
  statusCode,
  headers,
  body: JSON.stringify(body)
});

const ok       = (data) => res(200, data);
const created  = (data) => res(201, data);
const notFound = (msg)  => res(404, { error: msg });
const badReq   = (msg)  => res(400, { error: msg });
const unauth   = (msg)  => res(401, { error: msg });
const err500   = (e)    => res(500, { error: e.message });

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // EventBridge scheduled trigger (daily weather update)
  if (event.source === "aws.events" || event["detail-type"] === "Scheduled Event") {
    return runWeatherUpdate();
  }

  const method   = event.httpMethod || event.requestContext?.http?.method;
  const rawPath  = event.path || event.rawPath || "";
  const stage    = event.requestContext?.stage || "";
  const path     = stage && rawPath.startsWith(`/${stage}`)
    ? rawPath.slice(stage.length + 1)
    : rawPath;
  // Parse IDs from path directly — reliable even with catch-all API Gateway routes
  const pathParts = path.split("/").filter(Boolean);
  // /parks/{id}/posts/{postId}/comments/{commentId}/replies/{replyId}
  const params = {
    id:        pathParts[1],
    postId:    pathParts[3],
    commentId: pathParts[5],
    replyId:   pathParts[7],
    ...(event.pathParameters || {})
  };
  const body   = event.body ? JSON.parse(event.body) : {};

  // CORS preflight
  if (method === "OPTIONS") return res(200, {});

  try {

    // ── POST /weather/refresh (manual trigger for testing) ──────────────────
    if (method === "POST" && path === "/weather/refresh") {
      return runWeatherUpdate();
    }

    // ── GET /locations/{id} ─────────────────────────────────────────────────
    if (method === "GET" && path.match(/^\/locations\/[^/]+$/)) {
      const result = await db.send(new GetCommand({
        TableName: "Locations",
        Key: { locationId: params.id }
      }));
      if (!result.Item) return notFound("Location not found");
      return ok(result.Item);
    }

    // ── GET /parks ──────────────────────────────────────────────────────────
    if (method === "GET" && path === "/parks") {
      const result = await db.send(new ScanCommand({ TableName: "Parks" }));
      return ok(result.Items);
    }

    // ── GET /likes/{userId} ─────────────────────────────────────────────────
    if (method === "GET" && path.match(/^\/likes\/[^/]+$/)) {
      const result = await db.send(new QueryCommand({
        TableName: "Likes",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": params.id }
      }));
      return ok(result.Items.map(item => item.itemId));
    }

    // ── GET /parks/{id} ─────────────────────────────────────────────────────
    if (method === "GET" && path.match(/^\/parks\/[^/]+$/)) {
      const result = await db.send(new GetCommand({
        TableName: "Parks",
        Key: { parkId: params.id }
      }));
      if (!result.Item) return notFound("Park not found");
      return ok(result.Item);
    }

    // ── PATCH /parks/{id}/weather ────────────────────────────────────────────
    if (method === "PATCH" && path.endsWith("/weather")) {
      await db.send(new UpdateCommand({
        TableName: "Parks",
        Key: { parkId: params.id },
        UpdateExpression: "SET weather = :w",
        ExpressionAttributeValues: { ":w": body }
      }));
      return ok({ ok: true });
    }

    // ── GET /parks/{id}/posts ────────────────────────────────────────────────
    if (method === "GET" && path.endsWith("/posts")) {
      const result = await db.send(new QueryCommand({
        TableName: "Posts",
        KeyConditionExpression: "parkId = :pid",
        ExpressionAttributeValues: { ":pid": params.id },
        ScanIndexForward: false
      }));
      return ok(result.Items);
    }

    // ── POST /parks/{id}/posts ───────────────────────────────────────────────
    if (method === "POST" && path.endsWith("/posts")) {
      if (!body.text || !body.user) return badReq("text and user required");
      const item = {
        parkId:    params.id,
        postId:    `post_${randomUUID()}`,
        user:      body.user,
        text:      body.text,
        likes:     0,
        liked:     false,
        comments:  [],
        timestamp: Date.now()
      };
      await db.send(new PutCommand({ TableName: "Posts", Item: item }));
      return created(item);
    }

    // ── PATCH /parks/{id}/posts/{postId}/like ────────────────────────────────
    if (method === "PATCH" && path.endsWith("/like") && params.postId && !params.commentId) {
      const delta = body.delta ?? 1;
      const [countResult] = await Promise.all([
        db.send(new UpdateCommand({
          TableName: "Posts",
          Key: { parkId: params.id, postId: params.postId },
          UpdateExpression: "SET likes = likes + :d",
          ExpressionAttributeValues: { ":d": delta },
          ReturnValues: "ALL_NEW"
        })),
        body.userId && (delta > 0
          ? db.send(new PutCommand({ TableName: "Likes", Item: { userId: String(body.userId), itemId: params.postId } }))
          : db.send(new DeleteCommand({ TableName: "Likes", Key: { userId: String(body.userId), itemId: params.postId } }))
        )
      ]);
      return ok(countResult.Attributes);
    }

    // ── POST /parks/{id}/posts/{postId}/comments ─────────────────────────────
    if (method === "POST" && path.endsWith("/comments")) {
      if (!body.text || !body.user) return badReq("text and user required");
      const comment = {
        id:             `comment_${randomUUID()}`,
        user:           body.user,
        text:           body.text,
        likes:          0,
        liked:          false,
        replies:        [],
        repliesVisible: false
      };
      await db.send(new UpdateCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId },
        UpdateExpression: "SET comments = list_append(if_not_exists(comments, :empty), :c)",
        ExpressionAttributeValues: { ":c": [comment], ":empty": [] }
      }));
      return created(comment);
    }

    // ── POST /parks/{id}/posts/{postId}/comments/{commentId}/replies ─────────
    if (method === "POST" && path.endsWith("/replies")) {
      if (!body.text || !body.user) return badReq("text and user required");
      const reply = {
        id:    `reply_${randomUUID()}`,
        user:  body.user,
        text:  body.text,
        likes: 0,
        liked: false
      };
      // Fetch post → find comment index → append reply
      const postResult = await db.send(new GetCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId }
      }));
      const post = postResult.Item;
      if (!post) return notFound("Post not found");
      const idx = post.comments.findIndex(c => c.id === params.commentId);
      if (idx === -1) return notFound("Comment not found");
      post.comments[idx].replies.push(reply);
      post.comments[idx].repliesVisible = true;
      await db.send(new UpdateCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId },
        UpdateExpression: "SET comments = :c",
        ExpressionAttributeValues: { ":c": post.comments }
      }));
      return created(reply);
    }

    // ── PATCH /parks/{id}/posts/{postId}/show-all-comments ──────────────────
    if (method === "PATCH" && path.endsWith("/show-all-comments")) {
      await db.send(new UpdateCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId },
        UpdateExpression: "SET showAllComments = :t",
        ExpressionAttributeValues: { ":t": true }
      }));
      return ok({ ok: true });
    }

    // ── PATCH /parks/{id}/posts/{postId}/comments/{commentId}/like ───────────
    if (method === "PATCH" && path.endsWith("/like") && params.commentId && !params.replyId) {
      const postResult = await db.send(new GetCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId }
      }));
      const post = postResult.Item;
      if (!post) return notFound("Post not found");
      const idx = post.comments.findIndex(c => c.id === params.commentId);
      if (idx === -1) return notFound("Comment not found");
      const delta = body.delta ?? 1;
      post.comments[idx].likes = (post.comments[idx].likes || 0) + delta;
      await Promise.all([
        db.send(new UpdateCommand({
          TableName: "Posts",
          Key: { parkId: params.id, postId: params.postId },
          UpdateExpression: "SET comments = :c",
          ExpressionAttributeValues: { ":c": post.comments }
        })),
        body.userId && (delta > 0
          ? db.send(new PutCommand({ TableName: "Likes", Item: { userId: String(body.userId), itemId: params.commentId } }))
          : db.send(new DeleteCommand({ TableName: "Likes", Key: { userId: String(body.userId), itemId: params.commentId } }))
        )
      ]);
      return ok(post.comments[idx]);
    }

    // ── PATCH /parks/{id}/posts/{postId}/comments/{commentId}/toggle-replies ─
    if (method === "PATCH" && path.endsWith("/toggle-replies")) {
      const postResult = await db.send(new GetCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId }
      }));
      const post = postResult.Item;
      if (!post) return notFound("Post not found");
      const idx = post.comments.findIndex(c => c.id === params.commentId);
      if (idx === -1) return notFound("Comment not found");
      post.comments[idx].repliesVisible = !post.comments[idx].repliesVisible;
      await db.send(new UpdateCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId },
        UpdateExpression: "SET comments = :c",
        ExpressionAttributeValues: { ":c": post.comments }
      }));
      return ok({ ok: true });
    }

    // ── PATCH /parks/{id}/posts/{postId}/comments/{commentId}/replies/{replyId}/like
    if (method === "PATCH" && path.endsWith("/like") && params.replyId) {
      const postResult = await db.send(new GetCommand({
        TableName: "Posts",
        Key: { parkId: params.id, postId: params.postId }
      }));
      const post = postResult.Item;
      if (!post) return notFound("Post not found");
      const cIdx = post.comments.findIndex(c => c.id === params.commentId);
      if (cIdx === -1) return notFound("Comment not found");
      const rIdx = post.comments[cIdx].replies.findIndex(r => r.id === params.replyId);
      if (rIdx === -1) return notFound("Reply not found");
      const delta = body.delta ?? 1;
      post.comments[cIdx].replies[rIdx].likes = (post.comments[cIdx].replies[rIdx].likes || 0) + delta;
      await Promise.all([
        db.send(new UpdateCommand({
          TableName: "Posts",
          Key: { parkId: params.id, postId: params.postId },
          UpdateExpression: "SET comments = :c",
          ExpressionAttributeValues: { ":c": post.comments }
        })),
        body.userId && (delta > 0
          ? db.send(new PutCommand({ TableName: "Likes", Item: { userId: String(body.userId), itemId: params.replyId } }))
          : db.send(new DeleteCommand({ TableName: "Likes", Key: { userId: String(body.userId), itemId: params.replyId } }))
        )
      ]);
      return ok(post.comments[cIdx].replies[rIdx]);
    }

    // ── GET /parks/{id}/ratings ──────────────────────────────────────────────
    if (method === "GET" && path.endsWith("/ratings")) {
      const result = await db.send(new QueryCommand({
        TableName: "Ratings",
        KeyConditionExpression: "parkId = :pid",
        ExpressionAttributeValues: { ":pid": params.id }
      }));
      const ratings = result.Items;
      const avg = ratings.length
        ? Number((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1))
        : 0;
      return ok({ ratings, average: avg, count: ratings.length });
    }

    // ── POST /parks/{id}/ratings ─────────────────────────────────────────────
    if (method === "POST" && path.endsWith("/ratings")) {
      if (!body.userId || !body.rating) return badReq("userId and rating required");
      await db.send(new PutCommand({
        TableName: "Ratings",
        Item: { parkId: params.id, userId: String(body.userId), rating: body.rating }
      }));
      return ok({ message: "Rating saved" });
    }

    // ── POST /auth/login ─────────────────────────────────────────────────────
    if (method === "POST" && path === "/auth/login") {
      if (!body.username || !body.password) return badReq("username and password required");
      const result = await db.send(new GetCommand({
        TableName: "Users",
        Key: { username: body.username }
      }));
      const user = result.Item;
      if (!user) return unauth("Invalid username or password");

      const crypto = require("crypto");
      const hash = crypto.createHash("sha256").update(body.password).digest("hex");
      if (user.passwordHash !== hash) return unauth("Invalid username or password");

      const { passwordHash: _, ...safeUser } = user;
      return ok(safeUser);
    }

    return res(404, { error: `Route not found: ${method} ${path}` });

  } catch (e) {
    console.error(e);
    return err500(e);
  }
};
