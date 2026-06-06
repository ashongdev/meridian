import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let _client: DynamoDBDocumentClient | null = null;

export function getDynamoDb(): DynamoDBDocumentClient {
  if (_client) return _client;

  const region = process.env.AWS_REGION ?? "us-east-1";

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
  PRESENCE:        "meridian_presence",
  NOTIFICATIONS:   "meridian_notifications",
  STUDY_SESSIONS:  "meridian_study_sessions",
  AI_USAGE:        "meridian_ai_usage",
} as const;
