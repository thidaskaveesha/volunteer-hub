import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getMongoClient } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = typeof credentials?.username === "string" ? credentials.username.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !password) return null;

        const user = await (await getMongoClient()).db(process.env.MONGODB_DB ?? "kindred").collection("users").findOne({ username, authProvider: "credentials" });
        if (!user || typeof user.passwordHash !== "string" || !(await verifyPassword(password, user.passwordHash))) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, image: typeof user.image === "string" ? user.image : null };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const client = await getMongoClient();
        await client.db(process.env.MONGODB_DB ?? "kindred").collection("users").updateOne(
          { email: user.email },
          {
            $set: { name: user.name ?? "", image: user.image ?? "", updatedAt: new Date() },
            $setOnInsert: { email: user.email, createdAt: new Date(), role: "volunteer", totalHours: 0 },
          },
          { upsert: true },
        );
        return true;
      } catch (error) {
        console.error("Unable to provision Google user", error);
        return false;
      }
    },
  },
};
