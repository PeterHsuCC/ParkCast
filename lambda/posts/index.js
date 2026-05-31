const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE = "Posts";

exports.handler = async (event) => {
  const method = event.httpMethod;
  const { id: parkId, postId } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // GET /parks/{id}/posts
    if (method === "GET") {
      const result = await client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "parkId = :pid",
        ExpressionAttributeValues: { ":pid": parkId },
        ScanIndexForward: false   // newest first
      }));
      return ok(result.Items);
    }

    // POST /parks/{id}/posts  — add new post
    if (method === "POST" && !postId) {
      const item = {
        parkId,
        postId:    `post_${randomUUID()}`,
        user:      body.user,
        text:      body.text,
        likes:     0,
        comments:  [],
        timestamp: Date.now()
      };
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      return ok(item);
    }

    // PATCH /parks/{id}/posts/{postId}/like  — toggle like
    if (method === "PATCH" && postId && event.path.endsWith("/like")) {
      const result = await client.send(new UpdateCommand({
        TableName: TABLE,
        Key: { parkId, postId },
        UpdateExpression: "SET likes = likes + :val",
        ExpressionAttributeValues: { ":val": body.delta ?? 1 },
        ReturnValues: "ALL_NEW"
      }));
      return ok(result.Attributes);
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── DynamoDB Table ────────────────────────────────────────────────────────────
// Table name : Posts
// PK         : parkId  (String)   ← partition key
// SK         : postId  (String)   ← sort key
// Attributes : user, text, likes, comments[], timestamp

const ok   = (data) => ({ statusCode: 200, headers: cors(), body: JSON.stringify(data) });
const cors = ()     => ({ "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" });
