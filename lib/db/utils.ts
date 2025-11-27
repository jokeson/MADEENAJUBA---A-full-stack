import { ObjectId } from "mongodb";
import { getCollection } from "../db";
import { COLLECTIONS } from "./models";
import type { UserModel, WalletModel } from "./models";

// Helper function to validate if a string is a valid MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== "string") return false;
  return ObjectId.isValid(id);
};

// User utilities
export const getUserByEmail = async (email: string) => {
  const collection = await getCollection<UserModel>(COLLECTIONS.USERS);
  return collection.findOne({ email: email.toLowerCase() });
};

export const getUserById = async (id: string | ObjectId) => {
  const collection = await getCollection<UserModel>(COLLECTIONS.USERS);
  const userId = typeof id === "string" ? new ObjectId(id) : id;
  return collection.findOne({ _id: userId });
};

export const createUser = async (userData: Omit<UserModel, "_id" | "createdAt" | "updatedAt">) => {
  const collection = await getCollection<UserModel>(COLLECTIONS.USERS);
  const now = new Date();
  const newUser: UserModel = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(newUser);
  return { ...newUser, _id: result.insertedId };
};

export const updateUser = async (id: string | ObjectId, updates: Partial<UserModel>) => {
  const collection = await getCollection<UserModel>(COLLECTIONS.USERS);
  const userId = typeof id === "string" ? new ObjectId(id) : id;
  const result = await collection.findOneAndUpdate(
    { _id: userId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result;
};

// Wallet utilities
export const getWalletByUserId = async (userId: string | ObjectId) => {
  const collection = await getCollection<WalletModel>(COLLECTIONS.WALLETS);
  
  let userObjectId: ObjectId;
  if (typeof userId === "string") {
    if (!isValidObjectId(userId)) {
      throw new Error(`Invalid user ID format: "${userId}". Expected a valid MongoDB ObjectId (24 character hex string).`);
    }
    userObjectId = new ObjectId(userId);
  } else {
    userObjectId = userId;
  }
  
  return collection.findOne({ userId: userObjectId });
};

export const getWalletByWalletId = async (walletId: string) => {
  const collection = await getCollection<WalletModel>(COLLECTIONS.WALLETS);
  return collection.findOne({ walletId: walletId.toUpperCase() });
};

// Helper function to generate wallet ID (3 letters + 3 digits format, e.g., VXE445)
const generateWalletId = (): string => {
  // Generate 3 random uppercase letters
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters = Array.from({ length: 3 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join("");
  
  // Generate 3 random digits
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  
  return `${randomLetters}${randomDigits}`;
};

export const createWallet = async (userId: string | ObjectId, initialBalance: number = 0) => {
  const collection = await getCollection<WalletModel>(COLLECTIONS.WALLETS);
  const userObjectId = typeof userId === "string" ? new ObjectId(userId) : userId;
  const now = new Date();
  
  // Generate unique wallet ID
  let walletId = generateWalletId();
  let existingWallet = await collection.findOne({ walletId });
  
  // Ensure uniqueness
  while (existingWallet) {
    walletId = generateWalletId();
    existingWallet = await collection.findOne({ walletId });
  }
  
  const newWallet: WalletModel = {
    userId: userObjectId,
    walletId: walletId,
    balance: initialBalance,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(newWallet);
  return { ...newWallet, _id: result.insertedId };
};

export const updateWalletBalance = async (
  userId: string | ObjectId,
  amount: number,
  operation: "add" | "subtract" | "set" = "set"
) => {
  const collection = await getCollection<WalletModel>(COLLECTIONS.WALLETS);
  const userObjectId = typeof userId === "string" ? new ObjectId(userId) : userId;
  
  // For subtract operation, check if balance would go negative
  if (operation === "subtract") {
    const wallet = await collection.findOne({ userId: userObjectId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    
    // Prevent negative balance
    if (wallet.balance < amount) {
      throw new Error(`Insufficient balance. Cannot subtract ${amount} from balance of ${wallet.balance}. Balance cannot go negative.`);
    }
  }
  
  // For set operation, ensure balance is not negative
  if (operation === "set" && amount < 0) {
    throw new Error("Balance cannot be set to a negative value");
  }
  
  let updateQuery: any;
  if (operation === "add") {
    updateQuery = { $inc: { balance: amount } };
  } else if (operation === "subtract") {
    updateQuery = { $inc: { balance: -amount } };
  } else {
    updateQuery = { $set: { balance: amount } };
  }
  
  updateQuery.$set = { ...updateQuery.$set, updatedAt: new Date() };
  
  const result = await collection.findOneAndUpdate(
    { userId: userObjectId },
    updateQuery,
    { returnDocument: "after" }
  );
  
  // Final safety check: ensure result balance is not negative
  if (result && result.balance < 0) {
    // Rollback: restore previous balance
    const previousBalance = operation === "subtract" 
      ? result.balance + amount 
      : operation === "add" 
        ? result.balance - amount 
        : 0;
    
    await collection.updateOne(
      { userId: userObjectId },
      { $set: { balance: Math.max(0, previousBalance), updatedAt: new Date() } }
    );
    
    throw new Error("Balance cannot go negative. Transaction prevented.");
  }
  
  return result;
};

