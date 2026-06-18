import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let _client: DynamoDBDocumentClient | null = null;

export function getDynamoDb(): DynamoDBDocumentClient {
  if (_client) return _client;

  // Same region as Aurora DSQL — both AWS resources for this project live in eu-north-1.
  const region = process.env.AWS_REGION ?? "eu-north-1";

  const raw = new DynamoDBClient({
    region,
    ...(process.env.AWS_ACCESS_KEY_ID && {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    }),
  });

  _client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
  });

  return _client;
}

// DynamoDB table names
export const TABLES = {
  PRESENCE:      process.env.DYNAMODB_TABLE_PRESENCE ?? "meridian-dev-presence",
  NOTIFICATIONS: process.env.DYNAMODB_TABLE_NOTIFICATIONS ?? "meridian-dev-notifications",
} as const;
