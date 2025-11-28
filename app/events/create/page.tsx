"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import CreateEventModal from "@/components/events/CreateEventModal";
import { getUserEvents, getUserEventTickets, getUserPurchasedTickets, getUserEventTicketSales, stopSellingTickets, deleteEvent, depositTicketSales, deleteTicket } from "@/lib/server-actions/events";
import { formatCurrency, formatDateTime } from "@/lib/format";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import TicketDetailsModal from "@/components/tickets/TicketDetailsModal";

interface UserEvent {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "LIVE" | "ENDED";
  createdAt: string;
  rejectedReason?: string;
  eventDate?: string;
  isFree?: boolean;
  ticketPriceCents?: number;
}

const CreateEventPage = () => {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all" | "tickets">("pending");
  const [allEvents, setAllEvents] = useState<UserEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState("");
  const [ticketSummary, setTicketSummary] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [purchasedTickets, setPurchasedTickets] = useState<any[]>([]);
  const [ticketSales, setTicketSales] = useState<any[]>([]);
  const [loadingPurchasedTickets, setLoadingPurchasedTickets] = useState(false);
  const [loadingTicketSales, setLoadingTicketSales] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "stop" | "delete" | "deposit" | "deleteTicket" | null;
    eventId: string;
    eventTitle: string;
    depositAmount?: number;
  }>({
    isOpen: false,
    type: null,
    eventId: "",
    eventTitle: "",
    depositAmount: 0,
  });
  const [depositing, setDepositing] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/sign-in");
    }
  }, [loading, isAuthenticated, router]);

  // Fetch user's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.id) return;

      setLoadingEvents(true);
      setError("");
      try {
        const result = await getUserEvents(user.id);
        if (result.success) {
          setAllEvents(result.events as UserEvent[]);
        } else {
          setError(result.error || "Failed to load events");
        }
      } catch (error) {
        setError("An error occurred while loading events");
        console.error("Error fetching events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };

    if (user?.id) {
      fetchEvents();
    }
  }, [user?.id]);

  // Fetch user's tickets (for seller view)
  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.id) return;

      setLoadingTickets(true);
      setTicketsError("");
      try {
        const result = await getUserEventTickets(user.id, user.email);
        if (result.success) {
          setTicketSummary(result.summary || []);
        } else {
          setTicketsError(result.error || "Failed to load tickets");
        }
      } catch (error) {
        setTicketsError("An error occurred while loading tickets");
        console.error("Error fetching tickets:", error);
      } finally {
        setLoadingTickets(false);
      }
    };

    if (user?.id && activeTab === "tickets") {
      fetchTickets();
    }
  }, [user?.id, user?.email, activeTab]);

  // Fetch purchased tickets (tickets user bought)
  useEffect(() => {
    const fetchPurchasedTickets = async () => {
      if (!user?.id) return;

      setLoadingPurchasedTickets(true);
      try {
        const result = await getUserPurchasedTickets(user.id, user.email);
        if (result.success) {
          setPurchasedTickets(result.tickets || []);
        }
      } catch (error) {
        console.error("Error fetching purchased tickets:", error);
      } finally {
        setLoadingPurchasedTickets(false);
      }
    };

    if (user?.id && activeTab === "tickets") {
      fetchPurchasedTickets();
    }
  }, [user?.id, user?.email, activeTab]);

  // Fetch ticket sales (for seller management)
  useEffect(() => {
    const fetchTicketSales = async () => {
      if (!user?.id) return;

      setLoadingTicketSales(true);
      try {
        const result = await getUserEventTicketSales(user.id, user.email);
        if (result.success) {
          setTicketSales(result.sales || []);
        }
      } catch (error) {
        console.error("Error fetching ticket sales:", error);
      } finally {
        setLoadingTicketSales(false);
      }
    };

    if (user?.id && activeTab === "tickets") {
      fetchTicketSales();
    }
  }, [user?.id, user?.email, activeTab]);

  const handleEventSuccess = () => {
    // Refresh events after successful creation
    if (user?.id) {
      getUserEvents(user.id).then((result) => {
        if (result.success) {
          setAllEvents(result.events as UserEvent[]);
        }
      });
    }
  };

  const handleStopSelling = async () => {
    if (!user?.id || !confirmModal.eventId) return;

    const result = await stopSellingTickets(confirmModal.eventId, user.id, user.email);
    if (result.success) {
      // Refresh ticket sales
      const salesResult = await getUserEventTicketSales(user.id, user.email);
      if (salesResult.success) {
        setTicketSales(salesResult.sales || []);
      }
      // Refresh events
      const eventsResult = await getUserEvents(user.id);
      if (eventsResult.success) {
        setAllEvents(eventsResult.events as UserEvent[]);
      }
      setConfirmModal({ isOpen: false, type: null, eventId: "", eventTitle: "", depositAmount: 0 });
      alert("Ticket sales stopped successfully");
    } else {
      alert(result.error || "Failed to stop ticket sales");
    }
  };

  const handleDeleteEvent = async () => {
    if (!user?.id || !confirmModal.eventId) return;

    const result = await deleteEvent(confirmModal.eventId, user.id, user.email);
    if (result.success) {
      // Refresh events
      const eventsResult = await getUserEvents(user.id);
      if (eventsResult.success) {
        setAllEvents(eventsResult.events as UserEvent[]);
      }
      // Refresh ticket sales
      const salesResult = await getUserEventTicketSales(user.id, user.email);
      if (salesResult.success) {
        setTicketSales(salesResult.sales || []);
      }
      setConfirmModal({ isOpen: false, type: null, eventId: "", eventTitle: "", depositAmount: 0 });
      alert("Event deleted successfully");
    } else {
      alert(result.error || "Failed to delete event");
    }
  };

  const handleDeposit = async () => {
    if (!user?.id || !confirmModal.eventId) return;

    setDepositing(confirmModal.eventId);
    try {
      const result = await depositTicketSales(confirmModal.eventId, user.id, user.email);
      if (result.success) {
        // Refresh ticket sales
        const salesResult = await getUserEventTicketSales(user.id, user.email);
        if (salesResult.success) {
          setTicketSales(salesResult.sales || []);
        }
        setConfirmModal({ isOpen: false, type: null, eventId: "", eventTitle: "", depositAmount: 0 });
        alert(result.message || "Deposit successful!");
      } else {
        alert(result.error || "Failed to deposit ticket sales");
      }
    } catch (error) {
      alert("An error occurred while processing the deposit");
      console.error("Error depositing:", error);
    } finally {
      setDepositing(null);
    }
  };

  const handleDeleteTicket = async () => {
    if (!user?.id || !confirmModal.eventId) return;

    setDeletingTicket(confirmModal.eventId);
    try {
      const result = await deleteTicket(confirmModal.eventId, user.id, user.email);
      if (result.success) {
        // Refresh purchased tickets
        const ticketsResult = await getUserPurchasedTickets(user.id, user.email);
        if (ticketsResult.success) {
          setPurchasedTickets(ticketsResult.tickets || []);
        }
        setConfirmModal({ isOpen: false, type: null, eventId: "", eventTitle: "", depositAmount: 0 });
        alert("Ticket deleted successfully");
      } else {
        alert(result.error || "Failed to delete ticket");
      }
    } catch (error) {
      alert("An error occurred while deleting the ticket");
      console.error("Error deleting ticket:", error);
    } finally {
      setDeletingTicket(null);
    }
  };

  // Filter events based on active tab
  const getFilteredEvents = () => {
    switch (activeTab) {
      case "pending":
        return allEvents.filter((event) => event.status === "PENDING");
      case "approved":
        return allEvents.filter((event) => event.status === "APPROVED" || event.status === "LIVE");
      case "all":
        return allEvents;
      default:
        return [];
    }
  };

  const filteredEvents = getFilteredEvents();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          PENDING
        </span>
      ),
      APPROVED: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          APPROVED
        </span>
      ),
      REJECTED: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          REJECTED
        </span>
      ),
      LIVE: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          LIVE
        </span>
      ),
      ENDED: (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          ENDED
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 w-0 md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-3 xs:py-4 sm:py-6 md:py-8 lg:py-12">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-1 sm:mb-2" style={{ color: '#800000' }}>
                Create Event
              </h1>
              <p className="text-xs xs:text-sm text-gray-600 sm:text-[#800000]">
                Create new events or view your created events
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 xs:px-6 py-2 xs:py-3 text-sm xs:text-base text-white rounded-lg font-semibold hover:opacity-90 transition-opacity touch-manipulation whitespace-nowrap w-full sm:w-auto"
              style={{ backgroundColor: '#800000' }}
              tabIndex={0}
            >
              Create Event
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-4 sm:mb-6 border-b border-gray-300 overflow-x-auto -mx-2 xs:-mx-3 sm:mx-0 px-2 xs:px-3 sm:px-0">
            <div className="flex gap-2 sm:gap-4 min-w-max pb-1">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-3 xs:px-4 py-2 text-sm xs:text-base font-semibold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "pending"
                    ? "border-[#800000] text-[#800000]"
                    : "border-transparent text-gray-500 hover:text-[#800000]"
                }`}
                aria-selected={activeTab === "pending"}
                role="tab"
              >
                Pending ({allEvents.filter((e) => e.status === "PENDING").length})
              </button>
              <button
                onClick={() => setActiveTab("approved")}
                className={`px-3 xs:px-4 py-2 text-sm xs:text-base font-semibold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "approved"
                    ? "border-[#800000] text-[#800000]"
                    : "border-transparent text-gray-500 hover:text-[#800000]"
                }`}
                aria-selected={activeTab === "approved"}
                role="tab"
              >
                Approved ({allEvents.filter((e) => e.status === "APPROVED" || e.status === "LIVE").length})
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 xs:px-4 py-2 text-sm xs:text-base font-semibold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "all"
                    ? "border-[#800000] text-[#800000]"
                    : "border-transparent text-gray-500 hover:text-[#800000]"
                }`}
                aria-selected={activeTab === "all"}
                role="tab"
              >
                All Events ({allEvents.length})
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-3 xs:px-4 py-2 text-sm xs:text-base font-semibold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "tickets"
                    ? "border-[#800000] text-[#800000]"
                    : "border-transparent text-gray-500 hover:text-[#800000]"
                }`}
                aria-selected={activeTab === "tickets"}
                role="tab"
              >
                Tickets ({ticketSummary.reduce((sum, s) => sum + s.totalTicketsSold, 0)})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 xs:px-4 py-2 xs:py-3 rounded-lg mb-3 sm:mb-4 text-sm">
                {error}
              </div>
            )}

            {ticketsError && activeTab === "tickets" && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 xs:px-4 py-2 xs:py-3 rounded-lg mb-3 sm:mb-4 text-sm">
                {ticketsError}
              </div>
            )}

            {activeTab === "tickets" ? (
              <div className="space-y-6 sm:space-y-8">
                {/* Section 1: Tickets I Bought */}
                <div>
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: '#800000' }}>
                    Tickets I Bought
                  </h2>
                  {loadingPurchasedTickets ? (
                    <div className="bg-white rounded-lg p-6 xs:p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-4"></div>
                      <p className="text-sm xs:text-base" style={{ color: '#800000' }}>Loading purchased tickets...</p>
                    </div>
                  ) : purchasedTickets.length === 0 ? (
                    <div className="bg-white rounded-lg p-6 xs:p-8 text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-[#800000]/50 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4v-3a2 2 0 00-2-2H5z"
                        />
                      </svg>
                      <p className="text-lg" style={{ color: '#800000' }}>
                        No tickets purchased yet
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Tickets you purchase will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {purchasedTickets.map((ticket, index) => {
                        // Extract ticket number from serial number (last part after last dash)
                        const ticketNumber = ticket.serialNumber 
                          ? ticket.serialNumber.split('-').pop() || (index + 1).toString()
                          : (index + 1).toString();
                        
                        return (
                          <div
                            key={ticket.id}
                            className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 hover:border-[#800000] transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedTicket({
                                ...ticket,
                                ticketNumber: parseInt(ticketNumber) || index + 1,
                              });
                              setIsTicketModalOpen(true);
                            }}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedTicket({
                                  ...ticket,
                                  ticketNumber: parseInt(ticketNumber) || index + 1,
                                });
                                setIsTicketModalOpen(true);
                              }
                            }}
                            role="button"
                            aria-label={`View ticket #${ticketNumber} for ${ticket.eventTitle}`}
                          >
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              {ticket.eventImage && (
                                <img
                                  src={ticket.eventImage}
                                  alt={ticket.eventTitle}
                                  className="w-full sm:w-24 h-24 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1 w-full">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="text-sm font-bold px-2 py-1 bg-[#800000] text-white rounded">
                                        Ticket #{ticketNumber}
                                      </span>
                                      {ticket.serialNumber && (
                                        <span className="text-xs text-gray-500 font-mono">
                                          SN: {ticket.serialNumber}
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-lg font-bold" style={{ color: '#800000' }}>
                                      {ticket.eventTitle}
                                    </h3>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmModal({
                                        isOpen: true,
                                        type: "deleteTicket",
                                        eventId: ticket.id,
                                        eventTitle: `Ticket #${ticketNumber}`,
                                      });
                                    }}
                                    disabled={deletingTicket === ticket.id}
                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    tabIndex={0}
                                    aria-label={`Delete ticket #${ticketNumber}`}
                                  >
                                    {deletingTicket === ticket.id ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Price</p>
                                    <p className="font-semibold" style={{ color: '#800000' }}>
                                      {formatCurrency(ticket.totalPaidCents / 100)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
                                    <p style={{ color: '#800000' }}>
                                      {formatDateTime(ticket.createdAt)}
                                    </p>
                                  </div>
                                  {ticket.eventDate && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Event Date</p>
                                      <p style={{ color: '#800000' }}>
                                        {formatDateTime(ticket.eventDate)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {ticket.referenceNumber && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Reference Number</p>
                                    <p className="text-sm font-mono font-semibold" style={{ color: '#800000' }}>
                                      {ticket.referenceNumber}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Ticket Sales Management */}
                <div>
                  <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: '#800000' }}>
                    Ticket Sales Management
                  </h2>
                  {loadingTicketSales ? (
                    <div className="bg-white rounded-lg p-6 xs:p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-4"></div>
                      <p className="text-sm xs:text-base" style={{ color: '#800000' }}>Loading ticket sales...</p>
                    </div>
                  ) : ticketSales.length === 0 ? (
                    <div className="bg-white rounded-lg p-6 xs:p-8 text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-[#800000]/50 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <p className="text-lg" style={{ color: '#800000' }}>
                        No ticket sales yet
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Create payable events to start selling tickets.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {ticketSales.map((sale) => (
                        <div
                          key={sale.eventId}
                          className="bg-white rounded-lg p-4 xs:p-5 sm:p-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: '#800000' }}>
                                {sale.eventTitle}
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Tickets Sold</p>
                                  <p className="text-base xs:text-lg font-bold" style={{ color: '#800000' }}>
                                    {sale.ticketsSold}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Remaining</p>
                                  <p className={`text-base xs:text-lg font-bold ${sale.remainingTickets === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {sale.remainingTickets}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Total Income</p>
                                  <p className="text-sm xs:text-base sm:text-lg font-semibold break-words" style={{ color: '#800000' }}>
                                    {formatCurrency(sale.totalRevenueCents / 100)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">System Fee (10%)</p>
                                  <p className="text-sm xs:text-base sm:text-lg font-semibold text-orange-600 break-words">
                                    {formatCurrency(sale.totalFeeCents / 100)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                                  <span className="text-xs xs:text-sm font-medium text-green-800">Available to Deposit (90%):</span>
                                  <span className="text-base xs:text-lg font-bold text-green-700 break-words">
                                    {formatCurrency(sale.totalNetCents / 100)}
                                  </span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                  Click Deposit button to add this amount to your wallet balance
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Sold Tickets List */}
                          {sale.tickets && sale.tickets.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <h4 className="text-md font-semibold mb-3" style={{ color: '#800000' }}>
                                Sold Tickets ({sale.tickets.length})
                              </h4>
                              <div className="space-y-3">
                                {sale.tickets.map((ticket: any) => (
                                  <div
                                    key={ticket.id}
                                    className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Buyer</p>
                                        <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                                          {ticket.buyerName}
                                        </p>
                                        <p className="text-xs text-gray-600">{ticket.buyerEmail}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                        <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                                          {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                                        <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                                          {formatCurrency(ticket.totalPaidCents / 100)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
                                        <p className="text-sm" style={{ color: '#800000' }}>
                                          {formatDateTime(ticket.createdAt)}
                                        </p>
                                        {ticket.deposited && (
                                          <p className="text-xs text-green-600 mt-1">
                                            ✓ Deposited {ticket.depositedAt ? formatDateTime(ticket.depositedAt) : ''}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 xs:gap-3 pt-4 border-t border-gray-200">
                            {sale.totalNetCents > 0 && (
                              <button
                                onClick={() => setConfirmModal({
                                  isOpen: true,
                                  type: "deposit",
                                  eventId: sale.eventId,
                                  eventTitle: sale.eventTitle,
                                  depositAmount: sale.totalNetCents,
                                })}
                                disabled={depositing === sale.eventId}
                                className="px-3 xs:px-4 py-2 text-sm xs:text-base bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                tabIndex={0}
                              >
                                {depositing === sale.eventId ? "Depositing..." : "Deposit"}
                              </button>
                            )}
                            {sale.isSelling && (
                              <button
                                onClick={() => setConfirmModal({
                                  isOpen: true,
                                  type: "stop",
                                  eventId: sale.eventId,
                                  eventTitle: sale.eventTitle,
                                })}
                                className="px-3 xs:px-4 py-2 text-sm xs:text-base bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                                tabIndex={0}
                              >
                                Stop Selling
                              </button>
                            )}
                            {sale.ticketsSold === 0 && (
                              <button
                                onClick={() => setConfirmModal({
                                  isOpen: true,
                                  type: "delete",
                                  eventId: sale.eventId,
                                  eventTitle: sale.eventTitle,
                                })}
                                className="px-3 xs:px-4 py-2 text-sm xs:text-base bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                                tabIndex={0}
                              >
                                Delete Event
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : loadingEvents ? (
              <div className="bg-white rounded-lg shadow-md p-6 xs:p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-4"></div>
                <p className="text-sm xs:text-base" style={{ color: '#800000' }}>Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 xs:p-8 text-center">
                <p className="text-base xs:text-lg" style={{ color: '#800000' }}>
                  {activeTab === "pending"
                    ? "No pending events found."
                    : activeTab === "approved"
                    ? "No approved events found."
                    : "No events found."}
                </p>
                {activeTab === "pending" && (
                  <p className="text-xs xs:text-sm text-gray-600 mt-2">
                    Events awaiting admin approval will appear here.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg shadow-md p-4 xs:p-5 sm:p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base xs:text-lg font-semibold mb-1 break-words" style={{ color: '#800000' }}>
                              {event.title}
                            </h3>
                            <p className="text-xs xs:text-sm text-gray-600 line-clamp-2 break-words">
                              {event.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(event.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3">
                          {event.eventDate && (
                            <div>
                              <p className="text-xs text-gray-500">Event Date</p>
                              <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                                {formatDate(event.eventDate)}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="text-sm" style={{ color: '#800000' }}>
                              {formatDate(event.createdAt)}
                            </p>
                          </div>
                          {!event.isFree && event.ticketPriceCents && (
                            <div>
                              <p className="text-xs text-gray-500">Ticket Price</p>
                              <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                                ${(event.ticketPriceCents / 100).toFixed(2)}
                              </p>
                            </div>
                          )}
                          {event.isFree && (
                            <div>
                              <p className="text-xs text-gray-500">Type</p>
                              <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                                Free Event
                              </p>
                            </div>
                          )}
                        </div>

                        {event.status === "PENDING" && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              ⏰ Your event is under review. Admin will respond within 24 hours.
                            </p>
                          </div>
                        )}

                        {event.status === "REJECTED" && event.rejectedReason && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-700">{event.rejectedReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {user && (
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
          }}
          onSuccess={handleEventSuccess}
          userId={user.id}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, eventId: "", eventTitle: "", depositAmount: 0 })}
        onConfirm={
          confirmModal.type === "stop" 
            ? handleStopSelling 
            : confirmModal.type === "delete"
            ? handleDeleteEvent
            : confirmModal.type === "deleteTicket"
            ? handleDeleteTicket
            : handleDeposit
        }
        title={
          confirmModal.type === "stop" 
            ? "Stop Selling Tickets" 
            : confirmModal.type === "delete"
            ? "Delete Event"
            : confirmModal.type === "deleteTicket"
            ? "Delete Ticket"
            : "Deposit Ticket Sales"
        }
        message={
          confirmModal.type === "stop"
            ? `Are you sure you want to stop selling tickets for "${confirmModal.eventTitle}"? This action cannot be undone.`
            : confirmModal.type === "delete"
            ? `Are you sure you want to delete "${confirmModal.eventTitle}"? This action cannot be undone.`
            : confirmModal.type === "deleteTicket"
            ? `Are you sure you want to delete "${confirmModal.eventTitle}"? This action cannot be undone.`
            : `Deposit ${formatCurrency((confirmModal.depositAmount || 0) / 100)} from "${confirmModal.eventTitle}" to your wallet?`
        }
        confirmText={
          confirmModal.type === "stop" 
            ? "Stop Selling" 
            : confirmModal.type === "delete"
            ? "Delete"
            : confirmModal.type === "deleteTicket"
            ? "Delete"
            : "Deposit"
        }
        confirmButtonColor={
          confirmModal.type === "stop" 
            ? "yellow" 
            : confirmModal.type === "delete" || confirmModal.type === "deleteTicket"
            ? "red"
            : "green"
        }
      />

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal
          isOpen={isTicketModalOpen}
          onClose={() => {
            setIsTicketModalOpen(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
          onDelete={() => {
            setIsTicketModalOpen(false);
            setConfirmModal({
              isOpen: true,
              type: "deleteTicket",
              eventId: selectedTicket.id,
              eventTitle: `Ticket #${selectedTicket.ticketNumber}`,
            });
          }}
        />
      )}
    </div>
  );
};

export default CreateEventPage;


