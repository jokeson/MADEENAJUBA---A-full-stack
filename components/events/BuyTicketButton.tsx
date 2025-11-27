"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import BuyTicketModal from "./BuyTicketModal";

interface BuyTicketButtonProps {
  eventId: string;
  eventTitle: string;
  ticketPriceCents: number;
  ticketQuantity: number;
}

const BuyTicketButton = ({
  eventId,
  eventTitle,
  ticketPriceCents,
  ticketQuantity,
}: BuyTicketButtonProps) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated || !user) {
      router.push("/");
      return;
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    // Optionally refresh the page or show success message
    router.refresh();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 text-sm xs:text-base bg-[#800000] text-white font-semibold rounded-lg hover:bg-[#900000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        tabIndex={0}
        aria-label="Buy ticket for this event"
      >
        Buy Ticket
      </button>

      <BuyTicketModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        eventId={eventId}
        eventTitle={eventTitle}
        ticketPriceCents={ticketPriceCents}
        ticketQuantity={ticketQuantity}
        userId={user.id}
        userEmail={user.email}
      />
    </>
  );
};

export default BuyTicketButton;

