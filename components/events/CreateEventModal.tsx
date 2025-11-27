"use client";

import { useState } from "react";
import { createEvent } from "@/lib/server-actions/events";
import { uploadImageToCloudinary } from "@/lib/server-actions/cloudinary";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const CreateEventModal = ({ isOpen, onClose, onSuccess, userId }: CreateEventModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventImage, setEventImage] = useState("");
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string>("");
  const [isFree, setIsFree] = useState(true);
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!title.trim()) {
      setError("Event title is required");
      return;
    }

    if (!description.trim()) {
      setError("Event description is required");
      return;
    }

    if (!eventDate) {
      setError("Event date is required");
      return;
    }

    if (!startTime) {
      setError("Start time is required");
      return;
    }

    if (!endTime) {
      setError("End time is required");
      return;
    }

    // Validate time logic
    const startDateTime = new Date(`${eventDate}T${startTime}`);
    const endDateTime = new Date(`${eventDate}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      setError("End time must be after start time");
      return;
    }

    // If not free, validate ticket price and quantity
    if (!isFree) {
      const priceNum = parseFloat(ticketPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError("Ticket price must be greater than 0 for payable events");
        return;
      }

      const quantityNum = parseInt(ticketQuantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        setError("Ticket quantity must be greater than 0");
        return;
      }
    }

    // Validate image URL if provided
    if (eventImage.trim() && !eventImageFile) {
      const imageUrl = eventImage.trim();
      // Check if it's a Google Images redirect URL or other invalid patterns
      if (imageUrl.includes("google.com/url") || imageUrl.includes("googleusercontent.com/imgres")) {
        setError("Invalid image URL. Please use a direct image link (not a Google Images link). Right-click the image and select 'Copy image address' instead.");
        return;
      }
      // Validate URL format
      try {
        const urlObj = new URL(imageUrl);
        // Only allow http, https, data, and blob URLs
        if (!["http:", "https:", "data:", "blob:"].includes(urlObj.protocol) && !imageUrl.startsWith("/")) {
          setError("Invalid image URL format. Please use a valid image URL.");
          return;
        }
      } catch {
        // If URL parsing fails, check if it's a relative path
        if (!imageUrl.startsWith("/")) {
          setError("Invalid image URL format. Please use a valid image URL or upload an image file.");
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Handle image upload to Cloudinary if file is selected
      let imageUrl = eventImage.trim() || undefined;
      if (eventImageFile) {
        // Compress and resize image before uploading
        const compressedBase64 = await new Promise<string>((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          const img = new Image();
          const objectUrl = URL.createObjectURL(eventImageFile);
          
          img.onload = () => {
            try {
              // Calculate new dimensions (max 1200px, maintain aspect ratio)
              const maxWidth = 1200;
              const maxHeight = 1200;
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
              }
              
              canvas.width = width;
              canvas.height = height;
              
              // Draw and compress
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to base64 with compression (quality 0.8)
              let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              
              // If still too large (>900KB), reduce quality further
              if (compressedDataUrl.length > 900000) {
                compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
              }
              
              // Clean up object URL
              URL.revokeObjectURL(objectUrl);
              resolve(compressedDataUrl);
            } catch (error) {
              URL.revokeObjectURL(objectUrl);
              reject(error);
            }
          };
          
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
          };
          
          img.src = objectUrl;
        });

        // Upload to Cloudinary
        const uploadResult = await uploadImageToCloudinary(
          compressedBase64,
          'madeenajuba/events',
          undefined // Let Cloudinary generate a unique ID
        );

        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error || "Failed to upload image. Please try again.");
          setLoading(false);
          return;
        }

        imageUrl = uploadResult.url;
      }

      const result = await createEvent({
        creatorUserId: userId,
        title: title.trim(),
        description: description.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        eventDate: new Date(eventDate).toISOString(),
        eventImage: imageUrl,
        isFree,
        ticketPriceCents: !isFree ? Math.round(parseFloat(ticketPrice) * 100) : undefined,
        ticketQuantity: !isFree ? parseInt(ticketQuantity) : undefined,
      });

      if (result.success) {
        const successMessage = isFree 
          ? "Event created successfully! It will appear on the landing page immediately." 
          : "Event created successfully! Your event is under review. Admin will respond within 24 hours.";
        
        setSuccess(successMessage);
        
        // Reset form
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
        setEventDate("");
        setEventImage("");
        setEventImageFile(null);
        setEventImagePreview("");
        setIsFree(true);
        setTicketPrice("");
        setTicketQuantity("");

        // For payable events, show message longer (5 seconds) so user can read the 24-hour notice
        // For free events, close after 2 seconds
        const closeDelay = isFree ? 2000 : 5000;
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, closeDelay);
      } else {
        setError(result.error || "Failed to create event");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error creating event:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setEventDate("");
    setEventImage("");
    setEventImageFile(null);
    setEventImagePreview("");
    setIsFree(true);
    setTicketPrice("");
    setTicketQuantity("");
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-modal-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 shadow-2xl m-2 xs:m-3 sm:m-4 md:m-0"
        style={{ backgroundColor: '#d6d6c2' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-2 xs:right-3 sm:right-4 top-2 xs:top-3 sm:top-4 text-[#800000]/50 hover:text-[#800000] transition-colors z-10 p-1"
          aria-label="Close modal"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClose();
            }
          }}
          disabled={loading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="create-event-modal-title" className="text-xl xs:text-2xl font-bold mb-4 xs:mb-6 pr-8" style={{ color: '#800000' }}>
          Create Event
        </h2>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-green-800 text-base font-medium shadow-sm">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-1">Event Created Successfully!</p>
                <p>{success}</p>
                {!isFree && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">
                      ⏰ Your event is under review. Admin will respond within 24 hours.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!isFree && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            Your event is under review. Admin will respond within 24 hours.
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3 xs:space-y-4">
          <div>
            <label htmlFor="event-title" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              className="w-full px-3 xs:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-sm xs:text-base placeholder:text-[#800000] touch-manipulation"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="e.g., Madeenajuba Music Festival 2024"
              required
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="event-description" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Event Description / Details <span className="text-red-500">*</span>
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError("");
              }}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-base placeholder:text-[#800000] touch-manipulation resize-none"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="Describe your event in detail..."
              required
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4">
            <div>
              <label htmlFor="event-date" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
                Event Date <span className="text-red-500">*</span>
              </label>
              <input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => {
                  setEventDate(e.target.value);
                  if (error) setError("");
                }}
                className="w-full px-3 xs:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-sm xs:text-base touch-manipulation"
                style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                required
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="start-time" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (error) setError("");
                }}
                className="w-full px-3 xs:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-sm xs:text-base touch-manipulation"
                style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="end-time" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (error) setError("");
                }}
                className="w-full px-3 xs:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-sm xs:text-base touch-manipulation"
                style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="event-image" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Event Image (Optional)
            </label>
            
            {/* Hidden file input */}
            <input
              id="event-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Validate file type
                  if (!file.type.startsWith('image/')) {
                    setError("Please select a valid image file");
                    return;
                  }
                  
                  // Validate file size (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    setError("Image size must be less than 5MB");
                    return;
                  }
                  
                  setEventImageFile(file);
                  setEventImage(""); // Clear URL if file is selected
                  
                  // Create preview
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setEventImagePreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                  
                  if (error) setError("");
                }
              }}
              className="hidden"
              disabled={loading}
            />
            
            {/* Upload button and preview */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('event-image') as HTMLInputElement;
                  input?.click();
                }}
                disabled={loading}
                className="w-full px-3 xs:px-4 py-2 xs:py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#800000] transition-colors text-center touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed text-sm xs:text-base"
                style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                tabIndex={0}
                aria-label="Upload event image"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    {eventImageFile ? "Change Image" : "Upload Image from Device"}
                  </span>
                  <span className="text-xs opacity-75">
                    PNG, JPG, GIF up to 5MB
                  </span>
                </div>
              </button>
              
              {/* Image Preview */}
              {eventImagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                  <img
                    src={eventImagePreview}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEventImageFile(null);
                      setEventImagePreview("");
                      const input = document.getElementById('event-image') as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remove image"
                    tabIndex={0}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <p className="mt-1 text-xs" style={{ color: '#800000' }}>
              Upload an image from your device to display on the landing page
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => {
                  setIsFree(e.target.checked);
                  if (e.target.checked) {
                    setTicketPrice("");
                    setTicketQuantity("");
                  }
                  if (error) setError("");
                }}
                className="w-5 h-5 text-[#800000] border-gray-300 rounded focus:ring-[#800000] cursor-pointer"
                disabled={loading}
              />
              <span className="text-sm font-medium" style={{ color: '#800000' }}>
                Free Event (No ticket purchase required)
              </span>
            </label>
          </div>

          {!isFree && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
              <div>
                <label htmlFor="ticket-price" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
                  Ticket Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#800000' }}>$</span>
                  <input
                    id="ticket-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={ticketPrice}
                    onChange={(e) => {
                      setTicketPrice(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-base placeholder:text-[#800000] touch-manipulation"
                    style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                    placeholder="0.00"
                    required={!isFree}
                    autoComplete="off"
                    inputMode="decimal"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ticket-quantity" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
                  Ticket Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="ticket-quantity"
                  type="number"
                  step="1"
                  min="1"
                  value={ticketQuantity}
                  onChange={(e) => {
                    setTicketQuantity(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full px-3 xs:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-sm xs:text-base placeholder:text-[#800000] touch-manipulation"
                  style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                  placeholder="100"
                  required={!isFree}
                  autoComplete="off"
                  inputMode="numeric"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 xs:px-6 py-2 xs:py-3 text-sm xs:text-base bg-gray-200 text-[#800000] rounded-lg font-semibold hover:bg-gray-300 transition-colors touch-manipulation"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 xs:px-6 py-2 xs:py-3 text-sm xs:text-base text-white rounded-lg font-semibold hover:opacity-90 transition-opacity touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#800000' }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;

