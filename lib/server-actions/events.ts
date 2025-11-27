"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { COLLECTIONS, EventModel, TicketModel, TransactionModel, FeeModel, WalletModel } from "@/lib/db/models";
import { getWalletByUserId, updateWalletBalance, getUserById, getUserByEmail } from "@/lib/db/utils";

// Helper function to get MongoDB user ID from localStorage user ID or email
const getMongoUserId = async (localStorageUserId: string, email?: string): Promise<ObjectId | null> => {
  try {
    // If userId is already a valid ObjectId, try to use it directly
    if (ObjectId.isValid(localStorageUserId)) {
      const existingUser = await getUserById(localStorageUserId);
      if (existingUser && existingUser._id) {
        return existingUser._id;
      }
    }

    // If userId is not a valid ObjectId, try to find user by email
    if (email) {
      const userByEmail = await getUserByEmail(email);
      if (userByEmail && userByEmail._id) {
        return userByEmail._id;
      }
    }

    // User doesn't exist in MongoDB
    return null;
  } catch (error) {
    console.error("Error getting MongoDB user ID:", error);
    return null;
  }
};

// Server actions for events operations

export async function createEvent(data: {
  creatorUserId: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  eventDate: string; // ISO string
  eventImage?: string;
  isFree: boolean;
  ticketPriceCents?: number;
  ticketQuantity?: number;
}) {
  try {
    // Validate required fields
    if (!data.creatorUserId || !ObjectId.isValid(data.creatorUserId)) {
      return { success: false, error: "Invalid user ID" };
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Event title is required" };
    }

    if (!data.description || !data.description.trim()) {
      return { success: false, error: "Event description is required" };
    }

    if (!data.startTime || !data.endTime || !data.eventDate) {
      return { success: false, error: "Event date and times are required" };
    }

    // Validate dates
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const eventDate = new Date(data.eventDate);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime()) || isNaN(eventDate.getTime())) {
      return { success: false, error: "Invalid date format" };
    }

    if (endDateTime <= startDateTime) {
      return { success: false, error: "End time must be after start time" };
    }

    // If not free, validate ticket price and quantity
    if (!data.isFree) {
      if (!data.ticketPriceCents || data.ticketPriceCents <= 0) {
        return { success: false, error: "Ticket price must be greater than 0 for payable events" };
      }

      if (!data.ticketQuantity || data.ticketQuantity <= 0) {
        return { success: false, error: "Ticket quantity must be greater than 0" };
      }
    }

    // Determine initial status
    // Free events: APPROVED (published immediately)
    // Payable events: PENDING (awaiting admin approval)
    const status: EventModel["status"] = data.isFree ? "APPROVED" : "PENDING";

    // Create event document
    const eventData: Omit<EventModel, "_id"> = {
      creatorUserId: new ObjectId(data.creatorUserId),
      title: data.title.trim(),
      description: data.description.trim(),
      startTime: startDateTime,
      endTime: endDateTime,
      eventDate: eventDate,
      eventImage: data.eventImage?.trim() || undefined,
      isFree: data.isFree,
      ticketPriceCents: !data.isFree ? data.ticketPriceCents : undefined,
      ticketQuantity: !data.isFree ? data.ticketQuantity : undefined,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const result = await eventsCollection.insertOne(eventData);

    if (result.insertedId) {
      return {
        success: true,
        eventId: result.insertedId.toString(),
        message: data.isFree
          ? "Event created successfully! It will appear on the landing page immediately."
          : "Event created successfully! Your event is under review. Admin will respond within 24 hours.",
      };
    } else {
      return { success: false, error: "Failed to create event" };
    }
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

/**
 * Get all approved and live events for public display
 * Returns events that are approved, live, or ended (for historical display)
 */
export async function getEvents() {
  try {
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const events = await eventsCollection
      .find({
        status: { $in: ["APPROVED", "LIVE", "ENDED"] },
      })
      .sort({ eventDate: 1, createdAt: -1 }) // Sort by event date ascending, then by creation date
      .toArray();

    // Format events for client-side use
    const formattedEvents = events.map((event) => {
      const now = new Date();
      const eventDate = event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate);
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

      // Determine display status based on event dates and database status
      let displayStatus: "scheduled" | "live" | "ended" | "rejected" = "scheduled";
      if (event.status === "ENDED" || endTime < now) {
        displayStatus = "ended";
      } else if (event.status === "LIVE" || (startTime <= now && endTime >= now)) {
        displayStatus = "live";
      } else if (event.status === "REJECTED") {
        displayStatus = "rejected";
      } else {
        displayStatus = "scheduled";
      }

      return {
        id: event._id?.toString() || "",
        title: event.title,
        details: event.description,
        imageUrl: event.eventImage,
        startAt: startTime.toISOString(),
        endAt: endTime.toISOString(),
        isPaid: !event.isFree,
        ticketPriceCents: event.ticketPriceCents,
        status: displayStatus,
        location: undefined, // Location not in current model
      };
    });

    return formattedEvents;
  } catch (error) {
    console.error("Error getting events:", error);
    return [];
  }
}

/**
 * Get events created by a specific user
 */
export async function getUserEvents(userId: string) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return { success: false, events: [], error: "Invalid user ID" };
    }

    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const events = await eventsCollection
      .find({ creatorUserId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Format events for client-side use
    const formattedEvents = events.map((event) => ({
      id: event._id?.toString() || "",
      title: event.title,
      description: event.description,
      startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
      endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime,
      eventDate: event.eventDate instanceof Date ? event.eventDate.toISOString() : event.eventDate,
      eventImage: event.eventImage,
      isFree: event.isFree,
      ticketPriceCents: event.ticketPriceCents,
      ticketQuantity: event.ticketQuantity,
      status: event.status,
      rejectedReason: event.rejectedReason,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    }));

    return { success: true, events: formattedEvents };
  } catch (error) {
    console.error("Error getting user events:", error);
    return {
      success: false,
      events: [],
      error: error instanceof Error ? error.message : "Failed to get events",
    };
  }
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string) {
  try {
    if (!id || !ObjectId.isValid(id)) {
      return { success: false, event: null, error: "Invalid event ID" };
    }

    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return { success: false, event: null, error: "Event not found" };
    }

    // Format event for client-side use
    const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
    const eventDate = event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate);
    const createdAt = event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt);

    return {
      success: true,
      event: {
        id: event._id?.toString() || "",
        title: event.title,
        description: event.description,
        imageUrl: event.eventImage,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        eventDate: eventDate.toISOString(),
        isFree: event.isFree,
        ticketPriceCents: event.ticketPriceCents,
        ticketQuantity: event.ticketQuantity,
        status: event.status,
        createdAt: createdAt.toISOString(),
        creatorUserId: event.creatorUserId?.toString() || "",
      },
    };
  } catch (error) {
    console.error("Error getting event:", error);
    return {
      success: false,
      event: null,
      error: error instanceof Error ? error.message : "Failed to get event",
    };
  }
}


/**
 * Get all pending events for admin review
 */
export async function getPendingEvents() {
  try {
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const events = await eventsCollection
      .find({ status: "PENDING" })
      .sort({ createdAt: -1 })
      .toArray();

    // Format events for client-side use
    const formattedEvents = events.map((event) => ({
      id: event._id?.toString() || "",
      title: event.title,
      description: event.description,
      startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
      endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime,
      eventDate: event.eventDate instanceof Date ? event.eventDate.toISOString() : event.eventDate,
      eventImage: event.eventImage,
      isFree: event.isFree,
      ticketPriceCents: event.ticketPriceCents,
      ticketQuantity: event.ticketQuantity,
      status: event.status,
      rejectedReason: event.rejectedReason,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
      creatorUserId: event.creatorUserId?.toString() || "",
    }));

    return { success: true, events: formattedEvents };
  } catch (error) {
    console.error("Error getting pending events:", error);
    return {
      success: false,
      events: [],
      error: error instanceof Error ? error.message : "Failed to get pending events",
    };
  }
}

/**
 * Approve an event (admin only)
 */
export async function approveEvent(eventId: string, adminUserId: string) {
  try {
    if (!eventId || !ObjectId.isValid(eventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    if (!adminUserId || !ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId), status: "PENDING" },
      {
        $set: {
          status: "APPROVED",
          reviewedBy: new ObjectId(adminUserId),
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Event not found or already reviewed" };
    }

    return { success: true, message: "Event approved successfully" };
  } catch (error) {
    console.error("Error approving event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve event",
    };
  }
}

/**
 * Reject an event (admin only)
 */
export async function rejectEvent(eventId: string, adminUserId: string, reason: string) {
  try {
    if (!eventId || !ObjectId.isValid(eventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    if (!adminUserId || !ObjectId.isValid(adminUserId)) {
      return { success: false, error: "Invalid admin user ID" };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "Rejection reason is required" };
    }

    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId), status: "PENDING" },
      {
        $set: {
          status: "REJECTED",
          rejectedReason: reason.trim(),
          reviewedBy: new ObjectId(adminUserId),
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: "Event not found or already reviewed" };
    }

    return { success: true, message: "Event rejected successfully" };
  } catch (error) {
    console.error("Error rejecting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject event",
    };
  }
}

/**
 * Generate a unique reference number for transactions
 */
function generateReferenceNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Purchase tickets for an event
 */
export async function purchaseTicket(
  eventId: string,
  buyerUserId: string,
  quantity: number,
  buyerEmail?: string
) {
  try {
    // Validate inputs
    if (!eventId || !ObjectId.isValid(eventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    if (!buyerUserId || !ObjectId.isValid(buyerUserId)) {
      return { success: false, error: "Invalid buyer user ID" };
    }

    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return { success: false, error: "Quantity must be a positive integer" };
    }

    // Get MongoDB user ID
    const buyerMongoUserId = new ObjectId(buyerUserId);

    // Get event
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // Check if event is payable
    if (event.isFree) {
      return { success: false, error: "This is a free event. No ticket purchase required." };
    }

    if (!event.ticketPriceCents || event.ticketPriceCents <= 0) {
      return { success: false, error: "Ticket price not set for this event" };
    }

    // Check available tickets
    if (!event.ticketQuantity || event.ticketQuantity < quantity) {
      return { success: false, error: `Only ${event.ticketQuantity || 0} tickets available` };
    }

    // Calculate total cost (buyer pays only ticket price, no fees)
    const totalCostCents = event.ticketPriceCents * quantity;

    // Get buyer wallet
    const buyerWallet = await getWalletByUserId(buyerMongoUserId);
    if (!buyerWallet) {
      return { success: false, error: "Wallet not found. Please complete KYC application." };
    }

    if (buyerWallet.status !== "active") {
      return { success: false, error: `Your wallet is ${buyerWallet.status}. Cannot purchase tickets.` };
    }

    // Check sufficient balance
    if (buyerWallet.balance < totalCostCents) {
      return { success: false, error: "Insufficient balance to purchase tickets" };
    }

    // Get system settings for ticket fee percentage
    const { getSystemSettings } = await import("./system-settings");
    const settingsResult = await getSystemSettings();
    const ticketFeePercentage = settingsResult.success && settingsResult.settings
      ? settingsResult.settings.ticketFeePercentage
      : 10; // Default to 10% if settings not available

    // Calculate fees and payouts
    const feeCents = Math.round(totalCostCents * (ticketFeePercentage / 100));
    const netCents = totalCostCents - feeCents; // Amount seller receives (90%)

    // Get seller (event creator) wallet
    const sellerWallet = await getWalletByUserId(event.creatorUserId);
    if (!sellerWallet) {
      return { success: false, error: "Event creator wallet not found" };
    }

    // Process transaction
    try {
      // 1. Deduct from buyer wallet
      await updateWalletBalance(buyerMongoUserId, totalCostCents, "subtract");

      // 2. Fee will be recorded in Fee Ledger for admin to deposit manually
      // (No automatic deposit to admin wallet)

      // 3. Create individual ticket records (one per ticket) with unique serial numbers
      const ticketsCollection = await getCollection<TicketModel>(COLLECTIONS.TICKETS);
      const ticketPricePerTicket = event.ticketPriceCents;
      const feePerTicket = Math.round(ticketPricePerTicket * (ticketFeePercentage / 100));
      const netPerTicket = ticketPricePerTicket - feePerTicket;
      
      // Create a purchase group ID for tracking tickets from the same purchase
      const purchaseGroupId = new ObjectId();
      
      // Create individual tickets
      const ticketIds: ObjectId[] = [];
      for (let i = 0; i < quantity; i++) {
        const serialNumber = `${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${i + 1}`;
        const referenceNumber = generateReferenceNumber();
        
        const ticket: TicketModel = {
          eventId: new ObjectId(eventId),
          buyerUserId: buyerMongoUserId,
          qty: 1, // Each ticket is individual
          totalPaidCents: ticketPricePerTicket,
          feeCents: feePerTicket,
          netCents: netPerTicket,
          deposited: false, // Will be set to true when seller deposits
          serialNumber: serialNumber,
          referenceNumber: referenceNumber,
          purchaseGroupId: purchaseGroupId,
          createdAt: new Date(),
        };
        const result = await ticketsCollection.insertOne(ticket);
        if (result.insertedId) {
          ticketIds.push(result.insertedId);
        }
      }
      
      // Create a summary ticket record for backward compatibility and grouping
      const summaryTicket: TicketModel = {
        eventId: new ObjectId(eventId),
        buyerUserId: buyerMongoUserId,
        qty: quantity,
        totalPaidCents: totalCostCents,
        feeCents: feeCents,
        netCents: netCents,
        deposited: false,
        purchaseGroupId: purchaseGroupId,
        createdAt: new Date(),
      };
      await ticketsCollection.insertOne(summaryTicket);

      // 5. Update event ticket quantity
      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $inc: { ticketQuantity: -quantity }, $set: { updatedAt: new Date() } }
      );

      // 6. Create buyer transaction (use first ticket's reference number for the purchase transaction)
      const purchaseRef = ticketIds.length > 0 ? (await ticketsCollection.findOne({ _id: ticketIds[0] }))?.referenceNumber || generateReferenceNumber() : generateReferenceNumber();
      const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
      const buyerTransaction: TransactionModel = {
        userId: buyerMongoUserId,
        type: "ticket_payout",
        amount: totalCostCents,
        fromWalletId: buyerWallet.walletId,
        ref: purchaseRef,
        status: "success",
        meta: {
          eventId: new ObjectId(eventId),
          purchaseGroupId: purchaseGroupId.toString(),
        },
        createdAt: new Date(),
      };
      await transactionsCollection.insertOne(buyerTransaction);

      // 7. Create seller transaction (pending deposit - will be completed when deposited)
      // Note: Seller's wallet is not credited yet - they need to click Deposit button
      const sellerTransaction: TransactionModel = {
        userId: event.creatorUserId,
        type: "receive",
        amount: netCents,
        toWalletId: sellerWallet.walletId,
        ref: purchaseRef,
        status: "pending", // Will be marked as success when deposited
        meta: {
          eventId: new ObjectId(eventId),
          pendingDeposit: true,
          purchaseGroupId: purchaseGroupId.toString(),
        },
        createdAt: new Date(),
      };
      await transactionsCollection.insertOne(sellerTransaction);

      // 8. Record fee in Fee Ledger (admin will deposit manually)
      const feesCollection = await getCollection<FeeModel>(COLLECTIONS.FEES);
      const fee: FeeModel = {
        type: "transaction",
        amount: feeCents, // Fee amount (10% of ticket sale)
        percentage: ticketFeePercentage,
        userId: event.creatorUserId,
        transactionId: buyerTransaction._id,
        deposited: false, // Will be deposited when admin clicks Deposit button
        createdAt: new Date(),
      };
      await feesCollection.insertOne(fee);

      return {
        success: true,
        message: `Successfully purchased ${quantity} ticket(s)`,
        referenceNumber: purchaseRef,
        ticketIds: ticketIds.map(id => id.toString()),
      };
    } catch (transactionError) {
      console.error("Error processing ticket purchase:", transactionError);
      return {
        success: false,
        error: transactionError instanceof Error ? transactionError.message : "Failed to process ticket purchase",
      };
    }
  } catch (error) {
    console.error("Error purchasing ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to purchase ticket",
    };
  }
}

/**
 * Get tickets for events created by a user
 */
export async function getUserEventTickets(userId: string, email?: string) {
  try {
    if (!userId) {
      return { success: false, tickets: [], error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, tickets: [], error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, tickets: [], error: "User not found" };
    }

    // Get all events created by user
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const userEvents = await eventsCollection
      .find({ creatorUserId: mongoUserId })
      .toArray();

    if (userEvents.length === 0) {
      return { success: true, tickets: [] };
    }

    const eventIds = userEvents.map(e => e._id!);

    // Get all tickets for user's events
    const ticketsCollection = await getCollection<TicketModel>(COLLECTIONS.TICKETS);
    const tickets = await ticketsCollection
      .find({ eventId: { $in: eventIds } })
      .sort({ createdAt: -1 })
      .toArray();

    // Get user info for buyers
    const { getUserById } = await import("@/lib/db/utils");
    const { getKycUserInfo } = await import("./kyc");

    // Format tickets with event and buyer info
    const formattedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const event = userEvents.find(e => e._id?.toString() === ticket.eventId.toString());
        const buyer = await getUserById(ticket.buyerUserId.toString());
        const kycInfo = await getKycUserInfo(ticket.buyerUserId.toString(), buyer?.email);

        return {
          id: ticket._id?.toString() || "",
          eventId: ticket.eventId.toString(),
          eventTitle: event?.title || "Unknown Event",
          buyerUserId: ticket.buyerUserId.toString(),
          buyerEmail: buyer?.email || "Unknown",
          buyerName: kycInfo.success && kycInfo.firstName && kycInfo.lastName
            ? `${kycInfo.firstName} ${kycInfo.lastName}`
            : buyer?.email || "Unknown",
          quantity: ticket.qty,
          totalPaidCents: ticket.totalPaidCents,
          feeCents: ticket.feeCents,
          netCents: ticket.netCents,
          createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
        };
      })
    );

    // Group tickets by event for summary
    const eventTicketSummary = userEvents.map(event => {
      const eventTickets = formattedTickets.filter(t => t.eventId === event._id?.toString());
      const totalSold = eventTickets.reduce((sum, t) => sum + t.quantity, 0);
      const totalRevenueCents = eventTickets.reduce((sum, t) => sum + t.totalPaidCents, 0);
      const totalNetCents = eventTickets.reduce((sum, t) => sum + t.netCents, 0);
      const totalFeeCents = eventTickets.reduce((sum, t) => sum + t.feeCents, 0);

      return {
        eventId: event._id?.toString() || "",
        eventTitle: event.title,
        totalTicketsSold: totalSold,
        totalRevenueCents,
        totalNetCents,
        totalFeeCents,
        ticketCount: eventTickets.length,
      };
    });

    return {
      success: true,
      tickets: formattedTickets,
      summary: eventTicketSummary,
    };
  } catch (error) {
    console.error("Error getting user event tickets:", error);
    return {
      success: false,
      tickets: [],
      error: error instanceof Error ? error.message : "Failed to get tickets",
    };
  }
}

/**
 * Get tickets purchased by a user (as a buyer)
 */
export async function getUserPurchasedTickets(userId: string, email?: string) {
  try {
    if (!userId) {
      return { success: false, tickets: [], error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, tickets: [], error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, tickets: [], error: "User not found" };
    }

    // Get all individual tickets purchased by this user (exclude summary tickets)
    // Only get tickets with qty=1 and have a serialNumber (individual tickets)
    const ticketsCollection = await getCollection<TicketModel>(COLLECTIONS.TICKETS);
    const tickets = await ticketsCollection
      .find({ 
        buyerUserId: mongoUserId,
        qty: 1, // Only individual tickets
        serialNumber: { $exists: true } // Must have serial number
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (tickets.length === 0) {
      return { success: true, tickets: [] };
    }

    // Get event info for each ticket
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const eventIds = tickets.map(t => t.eventId);
    const events = await eventsCollection
      .find({ _id: { $in: eventIds } })
      .toArray();

    // Format tickets with event info and reference number
    const formattedTickets = tickets.map(ticket => {
      const event = events.find(e => e._id?.toString() === ticket.eventId.toString());
      return {
        id: ticket._id?.toString() || "",
        eventId: ticket.eventId.toString(),
        eventTitle: event?.title || "Unknown Event",
        eventImage: event?.eventImage,
        eventDate: event?.eventDate,
        eventTime: event?.eventTime,
        eventLocation: event?.location,
        quantity: 1, // Each ticket is individual
        totalPaidCents: ticket.totalPaidCents,
        referenceNumber: ticket.referenceNumber || "",
        serialNumber: ticket.serialNumber || "",
        createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
      };
    });

    return {
      success: true,
      tickets: formattedTickets,
    };
  } catch (error) {
    console.error("Error getting user purchased tickets:", error);
    return {
      success: false,
      tickets: [],
      error: error instanceof Error ? error.message : "Failed to get purchased tickets",
    };
  }
}

/**
 * Delete a ticket (only if user is the buyer)
 */
export async function deleteTicket(ticketId: string, userId: string, email?: string) {
  try {
    if (!ticketId || !ObjectId.isValid(ticketId)) {
      return { success: false, error: "Invalid ticket ID" };
    }

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found" };
    }

    // Verify user is the buyer of the ticket
    const ticketsCollection = await getCollection<TicketModel>(COLLECTIONS.TICKETS);
    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(ticketId),
      buyerUserId: mongoUserId,
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found or you don't have permission to delete it" };
    }

    // Delete the ticket
    await ticketsCollection.deleteOne({ _id: new ObjectId(ticketId) });

    return { success: true, message: "Ticket deleted successfully" };
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete ticket",
    };
  }
}

/**
 * Get ticket sales summary for events created by a user (as a seller)
 * Includes remaining tickets, total income, and fees
 */
export async function getUserEventTicketSales(userId: string, email?: string) {
  try {
    if (!userId) {
      return { success: false, sales: [], error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, sales: [], error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, sales: [], error: "User not found" };
    }

    // Get all events created by user
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const userEvents = await eventsCollection
      .find({ creatorUserId: mongoUserId })
      .toArray();

    if (userEvents.length === 0) {
      return { success: true, sales: [] };
    }

    const eventIds = userEvents.map(e => e._id!);

    // Get all individual tickets for user's events (exclude summary tickets)
    const ticketsCollection = await getCollection<TicketModel>(COLLECTIONS.TICKETS);
    const tickets = await ticketsCollection
      .find({ 
        eventId: { $in: eventIds },
        qty: 1, // Only individual tickets
        serialNumber: { $exists: true } // Must have serial number
      })
      .toArray();

    // Get user info for buyers
    const { getUserById } = await import("@/lib/db/utils");
    const { getKycUserInfo } = await import("./kyc");

    // Calculate sales summary for each event
    const salesSummary = await Promise.all(
      userEvents
        .filter(event => !event.isFree) // Only payable events
        .map(async (event) => {
          const eventTickets = tickets.filter(t => t.eventId.toString() === event._id?.toString());
          // Count individual tickets (each ticket has qty=1)
          const totalSold = eventTickets.length;
          const totalRevenueCents = eventTickets.reduce((sum, t) => sum + t.totalPaidCents, 0);
          // Only count undeposited tickets for net revenue
          const undepositedTickets = eventTickets.filter(t => !t.deposited);
          const totalNetCents = undepositedTickets.reduce((sum, t) => sum + t.netCents, 0);
          const totalFeeCents = eventTickets.reduce((sum, t) => sum + t.feeCents, 0);
          const remainingTickets = (event.ticketQuantity || 0) - totalSold;
          const isSelling = (event.ticketQuantity || 0) > 0 && remainingTickets > 0;

          // Format individual tickets with buyer info
          const formattedTickets = await Promise.all(
            eventTickets.map(async (ticket) => {
              const buyer = await getUserById(ticket.buyerUserId.toString());
              const kycInfo = await getKycUserInfo(ticket.buyerUserId.toString(), buyer?.email);

              return {
                id: ticket._id?.toString() || "",
                buyerUserId: ticket.buyerUserId.toString(),
                buyerEmail: buyer?.email || "Unknown",
                buyerName: kycInfo.success && kycInfo.firstName && kycInfo.lastName
                  ? `${kycInfo.firstName} ${kycInfo.lastName}`
                  : buyer?.email || "Unknown",
                quantity: ticket.qty,
                totalPaidCents: ticket.totalPaidCents,
                feeCents: ticket.feeCents,
                netCents: ticket.netCents,
                deposited: ticket.deposited || false,
                depositedAt: ticket.depositedAt instanceof Date ? ticket.depositedAt.toISOString() : ticket.depositedAt,
                createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
              };
            })
          );

          return {
            eventId: event._id?.toString() || "",
            eventTitle: event.title,
            ticketPriceCents: event.ticketPriceCents || 0,
            initialQuantity: event.ticketQuantity || 0,
            ticketsSold: totalSold,
            remainingTickets: Math.max(0, remainingTickets),
            totalRevenueCents,
            totalNetCents,
            totalFeeCents,
            isSelling,
            status: event.status,
            createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
            tickets: formattedTickets, // Include individual tickets
          };
        })
    );

    return {
      success: true,
      sales: salesSummary,
    };
  } catch (error) {
    console.error("Error getting user event ticket sales:", error);
    return {
      success: false,
      sales: [],
      error: error instanceof Error ? error.message : "Failed to get ticket sales",
    };
  }
}

/**
 * Deposit ticket sales revenue to user's wallet
 * Deposits all undeposited ticket sales for an event
 */
export async function depositTicketSales(eventId: string, userId: string, email?: string) {
  try {
    if (!eventId || !ObjectId.isValid(eventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found" };
    }

    // Get the event
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const event = await eventsCollection.findOne({ 
      _id: new ObjectId(eventId),
      creatorUserId: mongoUserId 
    });

    if (!event) {
      return { success: false, error: "Event not found or you are not the creator" };
    }

    // Get all individual tickets for this event that haven't been deposited yet (exclude summary tickets)
    const ticketsCollection = await getCollection<TicketModel>(COLLECTIONS.TICKETS);
    const undepositedTickets = await ticketsCollection
      .find({ 
        eventId: new ObjectId(eventId),
        $or: [{ deposited: { $ne: true } }, { deposited: { $exists: false } }],
        qty: 1, // Only individual tickets
        serialNumber: { $exists: true } // Must have serial number
      })
      .toArray();

    if (undepositedTickets.length === 0) {
      return { success: false, error: "No undeposited revenue available for this event" };
    }

    // Calculate total net revenue from undeposited tickets
    const totalNetCents = undepositedTickets.reduce((sum, t) => sum + t.netCents, 0);

    if (totalNetCents === 0) {
      return { success: false, error: "No revenue available to deposit" };
    }

    // Get user's wallet
    const userWallet = await getWalletByUserId(mongoUserId);
    if (!userWallet) {
      return { success: false, error: "Wallet not found" };
    }

    // Deposit the amount to wallet (add to balance)
    await updateWalletBalance(mongoUserId, totalNetCents, "add");

    // Mark all tickets as deposited
    const ticketIds = undepositedTickets.map(t => t._id).filter((id): id is ObjectId => id !== undefined);
    const depositTimestamp = new Date();
    if (ticketIds.length > 0) {
      await ticketsCollection.updateMany(
        { _id: { $in: ticketIds } },
        { 
          $set: { 
            deposited: true,
            depositedAt: depositTimestamp
          } 
        }
      );
    }

    // Update pending transactions for these tickets to "success" status
    const transactionsCollection = await getCollection<TransactionModel>(COLLECTIONS.TRANSACTIONS);
    await transactionsCollection.updateMany(
      {
        userId: mongoUserId,
        status: "pending",
        "meta.pendingDeposit": true,
        "meta.eventId": new ObjectId(eventId),
      },
      {
        $set: {
          status: "success",
          "meta.pendingDeposit": false,
          "meta.depositedAt": depositTimestamp,
        }
      }
    );

    // Create a deposit transaction record
    const ref = generateReferenceNumber();
    
    const depositTransaction: TransactionModel = {
      userId: mongoUserId,
      type: "deposit",
      amount: totalNetCents,
      toWalletId: userWallet.walletId,
      ref: ref,
      status: "success",
      meta: {
        eventId: new ObjectId(eventId),
        depositType: "ticket_sales",
      },
      createdAt: depositTimestamp,
    };

    await transactionsCollection.insertOne(depositTransaction);

    return {
      success: true,
      message: `Deposit successful. ${(totalNetCents / 100).toFixed(2)} has been deposited to your wallet.`,
      amount: totalNetCents,
    };
  } catch (error) {
    console.error("Error depositing ticket sales:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deposit ticket sales",
    };
  }
}

/**
 * Stop selling tickets for an event
 */
export async function stopSellingTickets(eventId: string, userId: string, email?: string) {
  try {
    if (!eventId || !ObjectId.isValid(eventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found" };
    }

    // Verify user is the creator of the event
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      creatorUserId: mongoUserId,
    });

    if (!event) {
      return { success: false, error: "Event not found or you don't have permission to modify it" };
    }

    // Stop selling by setting ticketQuantity to 0
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          ticketQuantity: 0,
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, message: "Ticket sales stopped successfully" };
  } catch (error) {
    console.error("Error stopping ticket sales:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to stop ticket sales",
    };
  }
}

/**
 * Delete an event (only if user is the creator)
 */
export async function deleteEvent(eventId: string, userId: string, email?: string) {
  try {
    if (!eventId || !ObjectId.isValid(eventId)) {
      return { success: false, error: "Invalid event ID" };
    }

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get MongoDB user ID
    let mongoUserId: ObjectId | null = null;
    
    if (ObjectId.isValid(userId)) {
      mongoUserId = new ObjectId(userId);
    } else if (email) {
      mongoUserId = await getMongoUserId(userId, email);
    } else {
      return { success: false, error: "Invalid user ID format" };
    }

    if (!mongoUserId) {
      return { success: false, error: "User not found" };
    }

    // Verify user is the creator of the event
    const eventsCollection = await getCollection<EventModel>(COLLECTIONS.EVENTS);
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      creatorUserId: mongoUserId,
    });

    if (!event) {
      return { success: false, error: "Event not found or you don't have permission to delete it" };
    }

    // Check if there are tickets sold
    const ticketsCollection = await getCollection<TicketModel>(COLLECTIONS.TICKETS);
    const ticketsCount = await ticketsCollection.countDocuments({
      eventId: new ObjectId(eventId),
    });

    if (ticketsCount > 0) {
      return {
        success: false,
        error: `Cannot delete event. ${ticketsCount} ticket(s) have been sold. Please stop selling tickets first.`,
      };
    }

    // Delete the event
    await eventsCollection.deleteOne({ _id: new ObjectId(eventId) });

    return { success: true, message: "Event deleted successfully" };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
}

