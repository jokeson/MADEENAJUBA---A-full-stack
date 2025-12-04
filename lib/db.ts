import { MongoClient, Db, MongoClientOptions, Document, Collection } from "mongodb";

// Lazy initialization function to get MongoDB URI
const getMongoUri = (): string => {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error(
      "MONGODB_URI is not set. Please add it to your environment variables:\n" +
      "For local development: Create a .env.local file with MONGODB_URI=mongodb://localhost:27017/madeenajuba\n" +
      "For Vercel: Add MONGODB_URI in your Vercel project settings → Environment Variables\n" +
      "MongoDB Atlas example: mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority"
    );
  }

  let uri: string = rawUri.trim();

  // Auto-fix common mistakes: missing // after protocol
  if (uri.startsWith("mongodb+srv:") && !uri.startsWith("mongodb+srv://")) {
    uri = uri.replace("mongodb+srv:", "mongodb+srv://");
    console.warn("Fixed MongoDB URI: Added missing '//' after 'mongodb+srv:'");
  }

  if (uri.startsWith("mongodb:") && !uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    uri = uri.replace(/^mongodb:(?!\/\/)/, "mongodb://");
    console.warn("Fixed MongoDB URI: Added missing '//' after 'mongodb:'");
  }

  // Validate URI format
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    const preview = uri.length > 30 ? uri.substring(0, 30) + "..." : uri;
    throw new Error(
      `Invalid MongoDB URI format. Expected URI to start with "mongodb://" or "mongodb+srv://".\n` +
      `Current value: ${preview}\n` +
      `Please check your .env.local file and ensure MONGODB_URI is set correctly.\n` +
      `Example: mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority`
    );
  }

  return uri;
};

// Cache for client promise (works in both dev and production)
let cachedClientPromise: Promise<MongoClient> | null = null;

// Lazy initialization function to get client promise
const getClientPromise = (): Promise<MongoClient> => {
  // Return cached promise if it exists
  if (cachedClientPromise) {
    return cachedClientPromise;
  }

  const uri = getMongoUri();
  const options: MongoClientOptions = {};

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    cachedClientPromise = globalWithMongo._mongoClientPromise;
    return cachedClientPromise;
  } else {
    // In production mode, cache the promise in module scope
    const client = new MongoClient(uri, options);
    cachedClientPromise = client.connect();
    return cachedClientPromise;
  }
};

// Export a function that returns the client promise (lazy initialization)
// This prevents the error during build time when env vars might not be available
export default getClientPromise;

// Helper function to get the database instance
export const getDb = async (): Promise<Db> => {
  const clientPromise = getClientPromise();
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME || "madeenajuba";
  return client.db(dbName);
};

// Helper function to get a collection
export const getCollection = async <T extends Document = Document>(collectionName: string): Promise<Collection<T>> => {
  const db = await getDb();
  return db.collection<T>(collectionName);
};

