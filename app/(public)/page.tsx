import Hero from "../../components/Hero";
import CertificationsAwards from "../../components/CertificationsAwards";
import EventsSection from "../../components/EventsSection";

export default function Home() {
  return (
    <div className="w-full overflow-x-hidden">
      <Hero />
      <CertificationsAwards />
      <EventsSection />
    </div>
  );
}

