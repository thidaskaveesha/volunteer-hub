import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Copy .env.example to .env.local and configure MongoDB.");
  }
  const client = new MongoClient(uri);
  const clientPromise = global._mongoClientPromise ?? client.connect();

  if (process.env.NODE_ENV !== "production") {
    global._mongoClientPromise = clientPromise;
  }

  return clientPromise;
}
