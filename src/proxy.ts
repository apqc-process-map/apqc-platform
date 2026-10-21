import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/catalog", "/documents", "/relationships", "/findings", "/governance", "/notifications", "/process-map", "/role-knowledge"];
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getClaims validates the signed JWT locally with the cached JWKS (ES256),
  // avoiding an Auth HTTP round-trip for every navigation and prefetch.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const needsAuth = protectedRoutes.some((route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + "/"));
  if (needsAuth && !claims) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("error", "required");
    return NextResponse.redirect(login);
  }
  if (request.nextUrl.pathname === "/login" && claims) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
