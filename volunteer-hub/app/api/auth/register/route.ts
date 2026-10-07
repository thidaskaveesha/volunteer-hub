import { hashPassword } from "@/lib/password";
import { getMongoClient } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: unknown; username?: unknown; password?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2) return Response.json({ error: "Enter a name with at least 2 characters." }, { status: 400 });
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return Response.json({ error: "Username must be 3–30 characters using letters, numbers, dots, underscores, or hyphens." }, { status: 400 });
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return Response.json({ error: "Password must be at least 8 characters and include a letter and a number." }, { status: 400 });
    }

    const db = (await getMongoClient()).db(process.env.MONGODB_DB ?? "kindred");
    const users = db.collection("users");
    await users.createIndex({ username: 1 }, { unique: true, sparse: true });
    const existing = await users.findOne({ username });
    if (existing) return Response.json({ error: "That username is already in use." }, { status: 409 });

    await users.insertOne({
      name,
      username,
      email: `${username}@local.kindred`,
      passwordHash: await hashPassword(password),
      authProvider: "credentials",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "volunteer",
      totalHours: 0,
    });

    return Response.json({ created: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to create local user", error);
    return Response.json({ error: "Unable to create your account right now." }, { status: 500 });
  }
}
