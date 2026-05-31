const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE = "Parks";

exports.handler = async (event) => {
  const method  = event.httpMethod;
  const parkId  = event.pathParameters?.id;

  try {
    // GET /parks
    if (method === "GET" && !parkId) {
      const result = await client.send(new ScanCommand({ TableName: TABLE }));
      return ok(result.Items);
    }

    // GET /parks/{id}
    if (method === "GET" && parkId) {
      const result = await client.send(new GetCommand({
        TableName: TABLE,
        Key: { parkId }
      }));
      if (!result.Item) return notFound("Park not found");
      return ok(result.Item);
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── DynamoDB Table ────────────────────────────────────────────────────────────
// Table name : Parks
// PK         : parkId (String)
// Attributes : name, lat, lng, image, description, score, ratings[]

const ok       = (data) => ({ statusCode: 200, headers: cors(), body: JSON.stringify(data) });
const notFound = (msg)  => ({ statusCode: 404, headers: cors(), body: JSON.stringify({ error: msg }) });
const cors     = ()     => ({ "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" });
