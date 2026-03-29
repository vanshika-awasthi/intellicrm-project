/**
 * app/auth/auth.service.ts
 * Typed API calls consumed by LoginPage and SignupPage.
 * Uses fetch (Next.js native) — swap with axios if preferred.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";


export interface AuthUser {
  id: string;
  company_id: string;
  employee_id: string;
  role: "admin" | "manager" | "employee";
}

export interface AuthResult {
  access_token: string;
  user: AuthUser;
}

export interface LoginPayload {
  company_id: string;
  employee_id: string;
  password: string;
  captcha_token: string;
}

export interface SignupPayload {
  company_id: string;
  company_name: string;
  employee_id: string;
  full_name: string;
  email: string;
  password: string;
  captcha_token: string;
}


async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // sends / receives httpOnly refresh cookie
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

// --- Auth API calls -----------------------------------------------------------

export function loginUser(payload: LoginPayload): Promise<AuthResult> {
  return post<AuthResult>("/auth/login", payload);
}

export function signupUser(payload: SignupPayload): Promise<AuthResult> {
  return post<AuthResult>("/auth/signup", payload);
}

export async function refreshToken(): Promise<AuthResult> {
  return post<AuthResult>("/auth/refresh", {});
}

export async function logoutUser(): Promise<void> {
  await post("/auth/logout", {});
}