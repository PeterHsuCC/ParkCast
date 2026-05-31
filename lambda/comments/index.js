const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE = "Posts";   // comments are stored inside the Post item

exports.handler = async (event) => {
  const method = event.httpMethod;
  const { id: parkId, postId, commentId, replyId } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  const path = event.path;

  try {

    // POST /parks/{id}/posts/{postId}/comments  — add comment
    if (method === "POST" && !commentId) {
      const newComment = {
        id:             `comment_${randomUUID()}`,
        user:           body.user,
        text:           body.text,
        likes:          0,
        replies:        [],
        repliesVisible: false
      };
      await client.send(new UpdateCommand({
        TableName: TABLE,
        Key: { parkId, postId },
        UpdateExpression: "SET comments = list_append(comments, :c)",
        ExpressionAttributeValues: { ":c": [newComment] },
        ReturnValues: "NONE"
      }));
      return ok(newComment);
    }

    // POST /parks/{id}/posts/{postId}/comments/{commentId}/replies  — add reply
    if (method === "POST" && commentId && path.endsWith("/replies")) {
      // NOTE: Since comments are a list inside Posts, we'd fetch the post,
      // find the comment index, then update. Shown simplified here.
      // In production consider a separate Comments table for easier updates.
      const newReply = {
        id:   `reply_${randomUUID()}`,
        user: body.user,
        text: body.text,
        likes: 0
      };
      // (fetch post → find comment index → append reply → update)
      return ok(newReply);
    }

    // PATCH .../like  — like a comment or reply
    if (method === "PATCH" && path.endsWith("/like")) {
      // Same pattern: fetch post item, find comment/reply, increment likes, put back
      return ok({ liked: true });
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── DynamoDB Note ─────────────────────────────────────────────────────────────
// Comments are stored as a nested list inside the Posts table item.
// This works well for read-heavy apps (one read gets post + all comments).
// If comments grow very large, consider a separate Comments table:
//   PK: postId, SK: commentId

const ok   = (data) => ({ statusCode: 200, headers: cors(), body: JSON.stringify(data) });
const cors = ()     => ({ "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" });
