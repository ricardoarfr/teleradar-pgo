import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/register", "/api/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.SECRET_KEY ?? "dev-secret-key-change-in-production"
    );
    const { payload } = await jwtVerify(accessToken, secret);

    if (payload.type !== "access") {
      throw new Error("Token inválido");
    }

    return NextResponse.next();
  } catch {
    // Token expirado ou inválido — tenta refresh via redirect com refresh cookie
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Tenta fazer o refresh server-side no middleware
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "https://teleradar-pgo-api.onrender.com";

    try {
      const res = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
      }

      const body = await res.json();
      const tokens = body.data;
      const isProduction = process.env.NODE_ENV === "production";

      const response = NextResponse.next();
      response.cookies.set("access_token", tokens.access_token, {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 30,
      });
      response.cookies.set("refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
