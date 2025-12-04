import { MongoClient, Db, MongoClientOptions, Document, Collection } from "mongodb";

// Helper function to get MongoDB URI with validation
const getMongoUri = (): string => {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error(
      "MONGODB_URI is not set. Please create a .env.local file in the root directory with:\n" +
      "MONGODB_URI=mongodb://localhost:27017/madeenajuba\n" +
      "Or for MongoDB Atlas:\n" +
      "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority"
    );
  }

  return rawUri.trim();
};

// Helper function to validate and fix URI format
const validateAndFixUri = (uri: string): string => {
  let fixedUri = uri;

  // Auto-fix common mistakes: missing // after protocol
  if (fixedUri.startsWith("mongodb+srv:") && !fixedUri.startsWith("mongodb+srv://")) {
    fixedUri = fixedUri.replace("mongodb+srv:", "mongodb+srv://");
    console.warn("Fixed MongoDB URI: Added missing '//' after 'mongodb+srv:'");
  }

  if (fixedUri.startsWith("mongodb:") && !fixedUri.startsWith("mongodb://") && !fixedUri.startsWith("mongodb+srv://")) {
    fixedUri = fixedUri.replace(/^mongodb:(?!\/\/)/, "mongodb://");
    console.warn("Fixed MongoDB URI: Added missing '//' after 'mongodb:'");
  }

  // Validate URI format
  if (!fixedUri.startsWith("mongodb://") && !fixedUri.startsWith("mongodb+srv://")) {
    const preview = fixedUri.length > 30 ? fixedUri.substring(0, 30) + "..." : fixedUri;
    throw new Error(
      `Invalid MongoDB URI format. Expected URI to start with "mongodb://" or "mongodb+srv://".\n` +
      `Current value: ${preview}\n` +
      `Please check your .env.local file and ensure MONGODB_URI is set correctly.\n` +
      `Example: mongodb+srv://username:password@cluster.mongodb.net/madeenajuba?retryWrites=true&w=majority`
    );
  }

  return fixedUri;
};

const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Lazy initialization - only connect when actually needed
const getClientPromise = (): Promise<MongoClient> => {
  if (clientPromise) {
    return clientPromise;
  }

  const uri = validateAndFixUri(getMongoUri());

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

  return clientPromise;
};

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
// Use lazy initialization to avoid errors during build time
export default getClientPromise();

// Helper function to get the database instance
export const getDb = async (): Promise<Db> => {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME || "madeenajuba";
  return client.db(dbName);
};

// Helper function to get a collection
export const getCollection = async <T extends Document = Document>(collectionName: string): Promise<Collection<T>> => {
  const db = await getDb();
  return db.collection<T>(collectionName);
};

