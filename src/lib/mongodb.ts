import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/iot-pad-dispenser';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
  isConnected: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  isConnected: false
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function dbConnect(): Promise<{ isConnected: boolean; connection: typeof mongoose | null }> {
  if (cached.conn && cached.isConnected) {
    return { isConnected: true, connection: cached.conn };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000, // Quick timeout if MongoDB daemon isn't running locally
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        cached.isConnected = true;
        return mongooseInstance;
      })
      .catch((err) => {
        cached.isConnected = false;
        cached.promise = null;
        console.warn('MongoDB connection notice: Unable to connect to MongoDB server at', MONGODB_URI, err.message);
        return null;
      });
  }

  try {
    const conn = await cached.promise;
    if (conn) {
      cached.conn = conn;
      cached.isConnected = true;
      return { isConnected: true, connection: conn };
    }
  } catch (e) {
    cached.promise = null;
    cached.isConnected = false;
  }

  return { isConnected: false, connection: null };
}

export default dbConnect;
