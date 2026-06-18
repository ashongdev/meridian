import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoDb, TABLES } from "./dynamodb";

const PRESENCE_HEARTBEAT_TTL_SEC = 30;
const POMODORO_STATE_TTL_SEC     = 24 * 60 * 60;
const NOTIFICATION_TTL_SEC       = 30 * 24 * 60 * 60;
const PRESENCE_STALE_AFTER_MS    = 20_000;

export type PresenceUser = {
  userId:     string;
  userName:   string | null;
  userAvatar: string | null;
  lastSeenAt: string;
};

export type PomodoroStatus = "idle" | "running" | "paused";

export type PomodoroState = {
  status:              PomodoroStatus;
  durationSec:         number;
  startedAt:           string | null;
  endsAt:              string | null;
  pausedRemainingSec:  number | null;
  startedBy:           string | null;
  updatedAt:           string;
};

export type Notification = {
  pk: string; sk: string;
  type: string; groupId: string; groupName: string;
  actorUserId: string; actorName: string;
  read: boolean; createdAt: string;
};

/** Overwrites this user's heartbeat item for the group — call on SSE connect and every poll tick. */
export async function writePresenceHeartbeat(
  groupId: string,
  user: { id: string; name: string | null; image: string | null },
): Promise<void> {
  const now = Date.now();
  await getDynamoDb().send(new PutCommand({
    TableName: TABLES.PRESENCE,
    Item: {
      pk:         `GROUP#${groupId}`,
      sk:         `PRESENCE#${user.id}`,
      userId:     user.id,
      userName:   user.name,
      userAvatar: user.image,
      lastSeenAt: new Date(now).toISOString(),
      ttl:        Math.floor(now / 1000) + PRESENCE_HEARTBEAT_TTL_SEC,
    },
  }));
}

/**
 * Single Query for everything live about a group: who's online (filtered by
 * heartbeat freshness, not DynamoDB TTL deletion timing) and the Pomodoro state.
 */
export async function queryGroupLiveState(groupId: string): Promise<{
  presence: PresenceUser[];
  pomodoro: PomodoroState | null;
}> {
  const { Items = [] } = await getDynamoDb().send(new QueryCommand({
    TableName: TABLES.PRESENCE,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": `GROUP#${groupId}` },
  }));

  const staleBefore = Date.now() - PRESENCE_STALE_AFTER_MS;
  const presence: PresenceUser[] = [];
  let pomodoro: PomodoroState | null = null;

  for (const item of Items) {
    if (typeof item.sk === "string" && item.sk.startsWith("PRESENCE#")) {
      if (new Date(item.lastSeenAt).getTime() >= staleBefore) {
        presence.push({
          userId:     item.userId,
          userName:   item.userName ?? null,
          userAvatar: item.userAvatar ?? null,
          lastSeenAt: item.lastSeenAt,
        });
      }
    } else if (item.sk === "POMODORO#STATE") {
      pomodoro = {
        status:             item.status,
        durationSec:        item.durationSec,
        startedAt:          item.startedAt ?? null,
        endsAt:             item.endsAt ?? null,
        pausedRemainingSec: item.pausedRemainingSec ?? null,
        startedBy:          item.startedBy ?? null,
        updatedAt:          item.updatedAt,
      };
    }
  }

  return { presence, pomodoro };
}

/** Overwrites the group's single Pomodoro state item. Last write wins — no locking. */
export async function writePomodoroState(
  groupId: string,
  state: Omit<PomodoroState, "updatedAt">,
): Promise<PomodoroState> {
  const updatedAt = new Date().toISOString();
  const full: PomodoroState = { ...state, updatedAt };
  await getDynamoDb().send(new PutCommand({
    TableName: TABLES.PRESENCE,
    Item: {
      pk: `GROUP#${groupId}`,
      sk: "POMODORO#STATE",
      ...full,
      ttl: Math.floor(Date.now() / 1000) + POMODORO_STATE_TTL_SEC,
    },
  }));
  return full;
}

export async function writeNotification(
  userId: string,
  payload: { type: string; groupId: string; groupName: string; actorUserId: string; actorName: string },
): Promise<void> {
  const createdAt = new Date().toISOString();
  const random     = Math.random().toString(36).slice(2, 8);
  await getDynamoDb().send(new PutCommand({
    TableName: TABLES.NOTIFICATIONS,
    Item: {
      pk: `USER#${userId}`,
      sk: `NOTIF#${createdAt}#${random}`,
      ...payload,
      read:      false,
      createdAt,
      ttl: Math.floor(Date.now() / 1000) + NOTIFICATION_TTL_SEC,
    },
  }));
}

export async function queryNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const { Items = [] } = await getDynamoDb().send(new QueryCommand({
    TableName: TABLES.NOTIFICATIONS,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": `USER#${userId}` },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return Items as Notification[];
}

export async function markNotificationRead(userId: string, sk: string): Promise<void> {
  await getDynamoDb().send(new UpdateCommand({
    TableName: TABLES.NOTIFICATIONS,
    Key: { pk: `USER#${userId}`, sk },
    UpdateExpression: "SET #read = :true",
    ExpressionAttributeNames: { "#read": "read" },
    ExpressionAttributeValues: { ":true": true },
  }));
}
