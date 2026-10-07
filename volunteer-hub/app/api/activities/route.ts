import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function distanceInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const a = Math.sin(radians(lat2 - lat1) / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lon2 - lon1) / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const client = await getMongoClient();
    const activities = await client.db(process.env.MONGODB_DB ?? "kindred").collection("activities").find({ date: { $gte: new Date() } }).sort({ date: 1 }).toArray();
    const withDistance = Number.isFinite(lat) && Number.isFinite(lng)
      ? activities.map((activity) => ({ ...activity, distance: activity.latitude && activity.longitude ? distanceInMiles(lat, lng, activity.latitude, activity.longitude) : null })).sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999))
      : activities.map((activity) => ({ ...activity, distance: null }));
    return NextResponse.json(withDistance);
  } catch (error) {
    console.error("Unable to load activities", error);
    return NextResponse.json({ error: "Unable to load activities." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const payload = await request.json();
    if (!payload.title || !payload.location || !payload.date || !payload.latitude || !payload.longitude) {
      return NextResponse.json({ error: "title, location, and date are required." }, { status: 400 });
    }
    const client = await getMongoClient();
    const result = await client.db(process.env.MONGODB_DB ?? "kindred").collection("activities").insertOne({
      ...payload,
      creatorEmail: session.user.email,
      creatorName: session.user.name ?? session.user.email,
      verificationCode: `KND-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      date: new Date(payload.date),
      createdAt: new Date(),
      attendees: 0,
    });
    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Unable to create activity", error);
    return NextResponse.json({ error: "Unable to create activity." }, { status: 503 });
  }
}
