type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV !== "production";

const normalizePayload = (payload?: Record<string, unknown>) => {
  if (!payload) return undefined;
  if (payload.error instanceof Error) {
    return {
      ...payload,
      error: {
        message: payload.error.message,
        stack: payload.error.stack,
        name: payload.error.name,
      },
    };
  }
  if (payload.response && typeof payload.response === "object") {
    const response = payload.response as { status?: number; statusText?: string };
    return {
      ...payload,
      response: {
        status: response.status,
        statusText: response.statusText,
      },
    };
  }
  return payload;
};

const log = (level: LogLevel, message: string, payload?: Record<string, unknown>) => {
  if (!isDev && level === "debug") return;
  const timestamp = new Date().toISOString();
  const normalized = normalizePayload(payload);
  console[level === "debug" ? "log" : level](`[CalmScroll][${timestamp}] ${message}`, normalized ?? "");
};

export const logger = {
  debug: (message: string, payload?: Record<string, unknown>) => log("debug", message, payload),
  info: (message: string, payload?: Record<string, unknown>) => log("info", message, payload),
  warn: (message: string, payload?: Record<string, unknown>) => log("warn", message, payload),
  error: (message: string, payload?: Record<string, unknown>) => log("error", message, payload),
};

export const logEvent = (event: string, payload?: Record<string, unknown>) => {
  logger.info(`Event: ${event}`, payload);
};
