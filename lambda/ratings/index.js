const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE = "Ratings";

exports.handler = async (event) => {
  const method = event.httpMethod;
  const { id: parkId } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // GET /parks/{id}/ratings  — get all ratings for a park
    if (method === "GET") {
      const result = await client.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "parkId = :pid",
        ExpressionAttributeValues: { ":pid": parkId }
      }));
      const ratings = result.Items;
      const avg = ratings.length
        ? Number((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1))
        : 0;
      return ok({ ratings, average: avg, count: ratings.length });
    }

    // POST /parks/{id}/ratings  — submit or update a rating
    if (method === "POST") {
      const item = {
        parkId,
        userId: String(body.userId),
        rating: body.rating           // 1–5
      };
      // PutCommand overwrites existing item (same parkId + userId = update rating)
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      return ok({ message: "Rating saved", ...item });
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── DynamoDB Table ────────────────────────────────────────────────────────────
// Table name : Ratings
// PK         : parkId  (String)
// SK         : userId  (String)
// Attributes : rating (Number 1–5)
//
// One row per user per park. PutCommand naturally handles "update if exists".

const ok   = (data) => ({ statusCode: 200, headers: cors(), body: JSON.stringify(data) });
const cors = ()     => ({ "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" });
