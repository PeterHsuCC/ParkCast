/**
 * seed.js — 把 mockData 一次性匯入 DynamoDB
 * 執行方式：npm run seed
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

// Auto-detect path: works locally AND in CloudShell (same folder)
const fs = require("fs");
const mockDataPath =
  fs.existsSync(__dirname + "/mockData.js")           ? __dirname + "/mockData.js" :
  fs.existsSync(__dirname + "/mockData_close.js")     ? __dirname + "/mockData_close.js" :
  fs.existsSync(__dirname + "/../frontend/js/mockData.js") ? __dirname + "/../frontend/js/mockData.js" :
  __dirname + "/../frontend/js/mockData_close.js";

const mockUsersPath =
  fs.existsSync(__dirname + "/mockUsers.js")          ? __dirname + "/mockUsers.js" :
  fs.existsSync(__dirname + "/mockUsers_close.js")    ? __dirname + "/mockUsers_close.js" :
  fs.existsSync(__dirname + "/../frontend/js/mockUsers.js") ? __dirname + "/../frontend/js/mockUsers.js" :
  __dirname + "/../frontend/js/mockUsers_close.js";
const { mockParks } = require(mockDataPath);
const { mockUsers }  = require(mockUsersPath);

// ── 設定 Region（改成你 AWS 用的 region）────────────────────────────────────
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: "us-east-1" })
);

async function put(table, item) {
  await client.send(new PutCommand({ TableName: table, Item: item }));
}

// ── 匯入 Parks ────────────────────────────────────────────────────────────────
async function seedParks() {
  console.log("Seeding Parks...");
  for (const park of mockParks) {
    await put("Parks", {
      parkId:      String(park.id),
      name:        park.name,
      lat:         park.lat,
      lng:         park.lng,
      image:       park.image,
      description: park.description,
      score:       park.score,
      ratings:     park.ratings ?? []
    });
    console.log(`  ✓ ${park.name}`);
  }
}

// ── 匯入 Posts（從 parks 裡拆出來）──────────────────────────────────────────
async function seedPosts() {
  console.log("Seeding Posts...");
  for (const park of mockParks) {
    for (const post of park.posts ?? []) {
      await put("Posts", {
        parkId:    String(park.id),
        postId:    post.id,
        user:      post.user,
        text:      post.text,
        likes:     post.likes ?? 0,
        liked:     post.liked ?? false,
        comments:  post.comments ?? [],
        timestamp: post.timestamp ?? Date.now()
      });
      console.log(`  ✓ [${park.name}] ${post.text.slice(0, 40)}...`);
    }
  }
}

// ── 匯入 Ratings ─────────────────────────────────────────────────────────────
async function seedRatings() {
  console.log("Seeding Ratings...");
  for (const park of mockParks) {
    for (const r of park.ratings ?? []) {
      await put("Ratings", {
        parkId: String(park.id),
        userId: String(r.userId),
        rating: r.rating
      });
    }
    console.log(`  ✓ ${park.name} (${park.ratings?.length ?? 0} ratings)`);
  }
}

// ── 匯入 Likes ────────────────────────────────────────────────────────────────
async function seedLikes() {
  console.log("Seeding Likes...");

  // Collect all items that have liked:true in mockData → assign to user 1 (peter)
  const user1Likes = [];
  for (const park of mockParks) {
    for (const post of park.posts ?? []) {
      if (post.liked) user1Likes.push(post.id);
      for (const comment of post.comments ?? []) {
        if (comment.liked) user1Likes.push(comment.id);
        for (const reply of comment.replies ?? []) {
          if (reply.liked) user1Likes.push(reply.id);
        }
      }
    }
  }

  // Extra likes for user 2 (demo) and user 3 (admin) — picked manually for demo variety
  const user2Likes = ["post_p2_1", "post_p3_1", "comment_p2_1_1", "comment_p1_1_1"];
  const user3Likes = ["post_p1_1", "comment_p1_1_2", "reply_p1_1_2_1"];

  const allLikes = [
    ...user1Likes.map(itemId => ({ userId: "1", itemId })),
    ...user2Likes.map(itemId => ({ userId: "2", itemId })),
    ...user3Likes.map(itemId => ({ userId: "3", itemId })),
  ];

  for (const like of allLikes) {
    await put("Likes", like);
  }
  console.log(`  ✓ user 1 (peter)  — ${user1Likes.length} likes`);
  console.log(`  ✓ user 2 (demo)   — ${user2Likes.length} likes`);
  console.log(`  ✓ user 3 (admin)  — ${user3Likes.length} likes`);
}

// ── 匯入 Users ────────────────────────────────────────────────────────────────
async function seedUsers() {
  console.log("Seeding Users...");
  for (const user of mockUsers) {
    // 用 SHA-256 hash 存密碼（正式環境請用 bcrypt）
    const passwordHash = crypto
      .createHash("sha256")
      .update(user.password)
      .digest("hex");

    await put("Users", {
      username:     user.username,
      userId:       String(user.id),
      displayName:  user.displayName,
      email:        user.email,
      avatar:       user.avatar,
      role:         user.role,
      passwordHash,
      joinedAt:     user.joinedAt
    });
    console.log(`  ✓ ${user.username}`);
  }
}

// ── 執行 ──────────────────────────────────────────────────────────────────────
// 用法：
//   node seed.js          → 全部重新 seed（會覆蓋現有資料）
//   node seed.js likes    → 只 seed Likes Table（不影響其他資料）

async function main() {
  const target = process.argv[2];
  try {
    if (target === "likes") {
      await seedLikes();
    } else {
      await seedParks();
      await seedPosts();
      await seedRatings();
      await seedUsers();
      await seedLikes();
    }
    console.log("\n✅ Seed complete!");
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    console.error("   Check your AWS credentials and region setting.");
  }
}

main();
