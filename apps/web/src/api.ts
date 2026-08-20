import type { ResultResponse, Task, WatermarkRegion } from "./types";
import { copy } from "./i18n/copy";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";
const TOKEN_KEY = "weiran_access_token";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { message?: string; code?: string };
  if (!response.ok) throw new ApiError(copy.api.error(payload.code, payload.message), response.status, payload.code);
  return payload as T;
}

async function createGuestSession(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/guest`, {
    method: "POST"
  });
  const session = await parseResponse<{ accessToken: string }>(response);
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  return session.accessToken;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) token = await createGuestSession();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init.body != null && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });
  if (response.status === 401 && retry) {
    localStorage.removeItem(TOKEN_KEY);
    await createGuestSession();
    return request<T>(path, init, false);
  }
  return parseResponse<T>(response);
}

async function uploadImage(file: File): Promise<string> {
  const prepared = await request<{
    assetId: string;
    upload: { url: string; fields: Record<string, string> };
  }>("/v1/assets/upload-url", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, mimeType: file.type || "image/jpeg", byteSize: file.size })
  });

  const form = new FormData();
  for (const [key, value] of Object.entries(prepared.upload.fields)) form.append(key, value);
  form.append("file", file);
  const uploadResponse = await fetch(prepared.upload.url, { method: "POST", body: form });
  if (!uploadResponse.ok) throw new ApiError(copy.api.uploadFailed, uploadResponse.status);

  await request(`/v1/assets/${prepared.assetId}/complete`, { method: "POST", body: "{}" });
  return prepared.assetId;
}

export const api = {
  createVideoTask: (url: string) => request<Task>("/v1/tasks", {
    method: "POST",
    body: JSON.stringify({ taskType: "VIDEO_WATERMARK_REMOVE", input: { platform: "dola", url } })
  }),
  createImageTask: async (file: File, region: WatermarkRegion, mode: "inpaint" | "blur") => {
    const sourceAssetId = await uploadImage(file);
    return request<Task>("/v1/tasks", {
      method: "POST",
      body: JSON.stringify({ taskType: "IMAGE_WATERMARK_REMOVE", input: { sourceAssetId, regions: [region], mode } })
    });
  },
  getTask: (taskId: string) => request<Task>(`/v1/tasks/${taskId}`),
  getResults: (taskId: string) => request<ResultResponse>(`/v1/tasks/${taskId}/result-url`),
  listTasks: () => request<{ tasks: Task[] }>("/v1/tasks?limit=50")
};
