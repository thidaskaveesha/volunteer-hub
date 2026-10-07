import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getMongoClient } from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
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
