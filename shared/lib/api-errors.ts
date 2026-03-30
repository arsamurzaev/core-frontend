import axios from "axios";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (isRecord(payload)) {
      const message = payload.message;
      if (Array.isArray(message)) {
        const text = message.filter(Boolean).map(String).join(", ");
        if (text) return text;
      }
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось выполнить операцию.";
}
