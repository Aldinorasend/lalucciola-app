import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/permissions";

// Shared by proxy.ts and auth.ts. Must not import the database or bcrypt.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const signedIn = !!auth?.user;
      if (nextUrl.pathname === "/login") {
        return signedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      return signedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
