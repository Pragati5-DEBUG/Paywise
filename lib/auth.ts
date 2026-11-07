import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Phase 1: JWT auth shell without Prisma adapter so the UI runs even if Postgres
// migrate hasn't completed. Wire PrismaAdapter in a later phase once DB is ready.
// Price alerts go through Resend in lib/email.ts, not the NextAuth email provider.

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
};
