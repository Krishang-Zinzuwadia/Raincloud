const API = "/api/control-plane";

export type LiveServer = {
  id: string;
  name: string;
  game: string;
  currentState: string;
  desiredState: string;
  statusMessage: string | null;
  version: string | null;
  type?: string | null;
  hostname: string | null;
  port: number | null;
};

export type LiveListResponse = {
  success: boolean;
  data: LiveServer[];
};

type ApiErrorBody = Record<string, unknown> | string | null;

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, message: string, body: ApiErrorBody = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function errorMessage(body: ApiErrorBody, status: number): string {
  if (typeof body === "string" && body.trim()) return body.trim();

  if (body && typeof body === "object") {
    if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim();
  }

  return `Request failed with status ${status}.`;
}

async function parseApiError(response: Response): Promise<ApiError> {
  const text = await response.text();
  let body: ApiErrorBody = null;

  if (text.trim()) {
    try {
      const parsed: unknown = JSON.parse(text);
      body =
        typeof parsed === "string" || (typeof parsed === "object" && parsed !== null)
          ? (parsed as ApiErrorBody)
          : text;
    } catch {
      body = text;
    }
  }

  return new ApiError(response.status, errorMessage(body, response.status), body);
}

export function joinAddress(server: LiveServer): string {
  if (!server.hostname) return "routing not assigned yet";
  const port = server.port && server.port !== 25565 ? `:${server.port}` : "";
  return `${server.hostname}${port}`;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
