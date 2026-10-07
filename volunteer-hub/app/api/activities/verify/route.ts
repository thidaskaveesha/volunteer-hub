import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
    const db = (await getMongoClient()).db(process.env.MONGODB_DB ?? "kindred");
    const activity = await db.collection("activities").findOne({ verificationCode: code.trim().toUpperCase() });
    if (!activity) return NextResponse.json({ error: "That code is not valid." }, { status: 404 });
    const attendance = { activityId: activity._id, activityTitle: activity.title, userEmail: session.user.email, userName: session.user.name ?? session.user.email, verifiedAt: new Date(), organizerEmail: activity.creatorEmail };
    await db.collection("attendance").updateOne({ activityId: activity._id, userEmail: session.user.email }, { $setOnInsert: attendance }, { upsert: true });
    await db.collection("activities").updateOne({ _id: activity._id }, { $inc: { attendees: 1 } });
    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Unable to verify attendance", error);
    return NextResponse.json({ error: "Unable to verify attendance." }, { status: 503 });
  }
}
