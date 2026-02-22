"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveTokens, clearTokens, getRefreshToken } from "@/lib/auth";
import type { AuthUser, LoginRequest } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://teleradar-pgo-api.onrender.com";

export async function loginAction(
  data: LoginRequest
): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      if (res.status >= 500) {
        return { success: false, error: "Servidor temporariamente indisponível. Aguarde alguns segundos e tente novamente." };
      }
      const body = await res.json().catch(() => ({}));
      const message = body?.detail ?? "Credenciais inválidas.";
      return { success: false, error: message };
    }

    const body = await res.json();
    const tokens = body.data;
    await saveTokens(tokens);

    const user = await fetchMe(tokens.access_token);
    if (!user) return { success: false, error: "Não foi possível obter os dados do usuário." };

    return { success: true, user };
  } catch {
    return { success: false, error: "Erro ao conectar com o servidor." };
  }
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // ignora erro de rede no logout
    }
  }

  await clearTokens();
  redirect("/login");
}

export async function refreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      await clearTokens();
      return null;
    }

    const body = await res.json();
    const tokens = body.data;
    await saveTokens(tokens);
    return tokens.access_token;
  } catch {
    return null;
  }
}

export async function getMeAction(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return null;
  return fetchMe(accessToken);
}

export async function forgotPasswordAction(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body?.detail ?? "Erro ao processar solicitação." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao conectar com o servidor." };
  }
}

export async function resetPasswordAction(
  token: string,
  new_password: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body?.detail ?? "Token inválido ou expirado." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao conectar com o servidor." };
  }
}

async function fetchMe(accessToken: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data as AuthUser;
  } catch {
    return null;
  }
}
