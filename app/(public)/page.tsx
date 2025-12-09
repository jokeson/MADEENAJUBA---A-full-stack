import Hero from "../../components/Hero";
import CertificationsAwards from "../../components/CertificationsAwards";
import EventsSection from "../../components/EventsSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to MADEENAJUBA - Your comprehensive city portal with integrated e-wallet functionality, news, events, jobs, and community services.",
  openGraph: {
    title: "MADEENAJUBA - City Portal",
    description: "Welcome to MADEENAJUBA - Your comprehensive city portal with integrated e-wallet functionality, news, events, jobs, and community services.",
    type: "website",
  },
};

export default function Home() {
  return (
    <div 
      className="w-full overflow-x-hidden min-h-screen bg-gradient-to-r from-[#DECBA4] to-[#3E5151]"
      style={{
        backgroundColor: '#3E5151',
        backgroundImage: 'linear-gradient(to right, #DECBA4, #3E5151)',
      }}
    >
      <Hero />
      <CertificationsAwards />
      <EventsSection />
    </div>
  );
}

