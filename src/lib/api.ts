// =========================================================================
// FastAPI client — single integration point for the Python backend.
//
// Configure the base URL with VITE_API_BASE_URL (e.g. in .env.local):
//   VITE_API_BASE_URL=http://localhost:8000
//
// All endpoints used by the React app live here. To swap, mock, or proxy
// the backend, edit ONLY this file.
// =========================================================================

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (err: any) {
    throw new ApiError(
      `Failed to reach backend at ${API_BASE_URL}. Is FastAPI (uvicorn) running?`,
      0,
      err?.message,
    );
  }
  const body = await parseJson(res);
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "message" in body && String((body as any).message)) ||
      `Request failed: ${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

// ---------- Types matching the FastAPI responses ----------

export interface ProcessResult {
  status: "success" | "error";
  message?: string;
  original_text: string;
  masked_text: string;
  extracted_json: unknown;
  unmasked_json: unknown;
}

export interface DashboardStats {
  documents_processed: number;
  entities_masked: number;
  records_in_db: number;
}

export interface RecentRun {
  id?: string | number;
  original_filename: string;
  entity_count: number;
  created_at: string;
}

export interface DashboardResponse {
  status: "success" | "error";
  stats: DashboardStats;
  recent_runs: RecentRun[];
}

export interface ResultRow {
  id: string | number;
  original_filename: string;
  created_at: string;
  status: "complete" | "failed" | string;
  original_text: string;
  masked_text: string;
  extracted_json: unknown;
  unmasked_json: unknown;
  // extracted_json?: unknown;
  // unmasked_json?: unknown;
}

export interface ResultsResponse {
  status: "success" | "error";
  results: ResultRow[];
}

// ---------- Endpoints ----------

export function processDocument(args: {
  file: File;
  user_instruction: string;
  json_schema: string;
  signal?: AbortSignal;
}): Promise<ProcessResult> {
  const fd = new FormData();
  fd.append("file", args.file);
  fd.append("user_instruction", args.user_instruction);
  fd.append("json_schema", args.json_schema);
  return request<ProcessResult>("/api/process", {
    method: "POST",
    body: fd,
    signal: args.signal,
  });
}

export function getDashboardStats(signal?: AbortSignal): Promise<DashboardResponse> {
  return request<DashboardResponse>("/api/dashboard-stats", { signal });
}

export function getResults(signal?: AbortSignal): Promise<ResultsResponse> {
  return request<ResultsResponse>("/api/results", { signal });
}

export function deleteResult(id: string | number, signal?: AbortSignal): Promise<{status: string, message?: string}> {
  return request<{status: string, message?: string}>(`/api/results/${id}`, {
    method: "DELETE",
    signal,
  });
}