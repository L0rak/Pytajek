import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Aplikacja działa na jednym komputerze i nie wysyła e-maili, więc te funkcje są wyłączone.
  disabledPaths: [
    "/request-password-reset",
    "/reset-password",
    "/send-verification-email",
    "/verify-email",
  ],
  emailAndPassword:{
    enabled:true
  }
});