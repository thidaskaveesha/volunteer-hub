import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { hash } = await request.json();
    if (!hash) return NextResponse.json({ error: "Document hash is required." }, { status: 400 });
    const document = await (await getMongoClient()).db(process.env.MONGODB_DB ?? "kindred").collection("documents").findOne({ hash: hash.trim() });
    return document ? NextResponse.json({ valid: true, document }) : NextResponse.json({ valid: false }, { status: 404 });
  } catch (error) {
    console.error("Unable to verify document", error);
    return NextResponse.json({ error: "Unable to verify document." }, { status: 503 });
  }
}
