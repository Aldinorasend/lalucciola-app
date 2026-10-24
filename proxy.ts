import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Optimistic check only: redirects signed-out visitors to /login.
// Pages and server actions still verify the session themselves (lib/dal.ts).
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
