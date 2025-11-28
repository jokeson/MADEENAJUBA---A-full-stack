import { MongoClient, Db, MongoClientOptions, Document, Collection } from "mongodb";

// Get MongoDB URI from environment variables
const rawUri = process.env.MONGODB_URI;

if (!rawUri) {
  throw new Error(
    "MONGODB_URI is not set. Please create a .env.local file in the root directory with:\n" +
    "MONGODB_URI=mongodb://localhost:27017/madeenajuba\n" +
    "Or for MongoDB Atlas:\n" +
    "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority"
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

const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// Helper function to get the database instance
export const getDb = async (): Promise<Db> => {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME || "madeenajuba";
  return client.db(dbName);
};

// Helper function to get a collection
export const getCollection = async <T extends Document = Document>(collectionName: string): Promise<Collection<T>> => {
  const db = await getDb();
  return db.collection<T>(collectionName);
};

