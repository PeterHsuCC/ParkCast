const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE = "Users";

exports.handler = async (event) => {
  const method = event.httpMethod;
  const body   = event.body ? JSON.parse(event.body) : {};

  try {
    // POST /auth/login
    if (method === "POST") {
      const { username, password } = body;
      if (!username || !password) return badRequest("Username and password required");

      const result = await client.send(new GetCommand({
        TableName: TABLE,
        Key: { username }
      }));

      const user = result.Item;
      if (!user) return unauthorized("Invalid username or password");

      // Compare hashed password (store bcrypt hash in DynamoDB, never plain text)
      const hash = crypto.createHash("sha256").update(password).digest("hex");
      if (user.passwordHash !== hash) return unauthorized("Invalid username or password");

      // Return safe user object (no password)
      const safeUser = {
        id:          user.userId,
        username:    user.username,
        displayName: user.displayName,
        email:       user.email,
        avatar:      user.avatar,
        role:        user.role
      };
      return ok(safeUser);
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── DynamoDB Table ────────────────────────────────────────────────────────────
// Table name  : Users
// PK          : username (String)
// Attributes  : userId, displayName, email, avatar, role, passwordHash
//
// NOTE: In production use AWS Cognito instead of storing passwords yourself.
//       Cognito handles hashing, MFA, OAuth, forgot-password flows for free.

const ok           = (d)   => ({ statusCode: 200, headers: cors(), body: JSON.stringify(d) });
const badRequest   = (msg) => ({ statusCode: 400, headers: cors(), body: JSON.stringify({ error: msg }) });
const unauthorized = (msg) => ({ statusCode: 401, headers: cors(), body: JSON.stringify({ error: msg }) });
const cors         = ()    => ({ "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" });
