import { env } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";

const rank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel) {
  return rank[level] >= rank[env.LOG_LEVEL];
}

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  const serialized = JSON.stringify(payload);
  if (level === "error") {
    console.error(serialized);
    return;
  }
  console.log(serialized);
}

export const logger = {
  debug: (message: string, metadata?: Record<string, unknown>) =>
    write("debug", message, metadata),
  info: (message: string, metadata?: Record<string, unknown>) =>
    write("info", message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) =>
    write("warn", message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) =>
    write("error", message, metadata),
};
