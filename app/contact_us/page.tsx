import ContactForm from "@/components/ContactForm";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-[#f5f5f0] w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-16">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#800000] mb-3 xs:mb-4 sm:mb-5 break-words">
            Contact Us
          </h1>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto break-words px-2">
            Have a question or need assistance? Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 xs:p-8 sm:p-10 md:p-12">
          <ContactForm />
        </div>

        {/* Additional Info */}
        <div className="mt-8 xs:mt-10 sm:mt-12 text-center">
          <p className="text-xs xs:text-sm text-gray-600">
            We typically respond within 24-48 hours during business days.
          </p>
          {/* Contact form system - deployed */}
        </div>
      </div>
    </div>
  );
}

