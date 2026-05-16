import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. BYPASS TOTAL PARA CECILIA (Acceso Público para Meta)
  if (pathname.startsWith("/api/cecilia")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // 1. Headers Anti-SEO para JARVIS
  if (pathname.startsWith("/jarvis") || pathname.startsWith("/api/jarvis")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // 2. Definición de rutas protegidas
  const isProtectedPath = pathname.startsWith("/jarvis/panel") || 
                          (pathname.startsWith("/api/jarvis") && !pathname.startsWith("/api/jarvis/auth"));

  // 3. Validación de Sesión JARVIS
  if (isProtectedPath) {
    const agentKey = request.headers.get("X-Agent-Key");
    const internalSecret = process.env.AGENT_SECRET_KEY || 'AX-INTERNAL-2026';

    if (agentKey === internalSecret) {
      return response; // Bypass para agentes (Cecilia, Mark, Neo)
    }

    const sessionCookie = request.cookies.get("jarvis_session");
    
    if (!sessionCookie || sessionCookie.value !== "authenticated") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized. Jarvis Protocol Restricted." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/jarvis/login", request.url));
    }
  }

  // 4. Redirecciones de conveniencia
  if (pathname === "/jarvis") {
    const sessionCookie = request.cookies.get("jarvis_session");
    return (sessionCookie?.value === "authenticated") 
      ? NextResponse.redirect(new URL("/jarvis/panel", request.url))
      : NextResponse.redirect(new URL("/jarvis/login", request.url));
  }

  if (pathname === "/jarvis/login") {
    const sessionCookie = request.cookies.get("jarvis_session");
    if (sessionCookie?.value === "authenticated") {
      return NextResponse.redirect(new URL("/jarvis/panel", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/jarvis/:path*",
    "/api/jarvis/:path*",
    "/api/cecilia/:path*" // Lo incluimos para que el bypass (paso 0) se ejecute explícitamente
  ],
};
