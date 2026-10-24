import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/permissions";

// Shared by proxy.ts and auth.ts. Must not import the database or bcrypt.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // /login stays reachable with a cookie: a deactivated user still has one,
      // and lib/dal.ts sends them here.
      return nextUrl.pathname === "/login" || !!auth?.user;
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
