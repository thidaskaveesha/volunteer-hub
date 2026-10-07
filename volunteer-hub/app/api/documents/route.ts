import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const attendance = await (await getMongoClient()).db(process.env.MONGODB_DB ?? "kindred").collection("attendance").find({ userEmail: session.user.email }).sort({ verifiedAt: -1 }).toArray();
    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Unable to load attendance", error);
    return NextResponse.json({ error: "Unable to load attendance." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const payload = await request.json();
    if (!payload.hash) return NextResponse.json({ error: "Document hash is required." }, { status: 400 });
    await (await getMongoClient()).db(process.env.MONGODB_DB ?? "kindred").collection("documents").updateOne(
      { hash: payload.hash },
      { $set: { ...payload, userEmail: session.user.email, createdAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ hash: payload.hash }, { status: 201 });
  } catch (error) {
    console.error("Unable to save document", error);
    return NextResponse.json({ error: "Unable to save document." }, { status: 503 });
  }
}
