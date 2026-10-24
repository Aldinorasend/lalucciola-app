"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function login(_previous: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    // signIn throws a redirect on success; only auth failures are handled here.
    if (error instanceof AuthError) return "Wrong email or password.";
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
