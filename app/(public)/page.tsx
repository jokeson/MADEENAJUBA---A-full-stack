import Hero from "../../components/Hero";
import CertificationsAwards from "../../components/CertificationsAwards";
import EventsSection from "../../components/EventsSection";

export default function Home() {
  return (
    <div 
      className="w-full overflow-x-hidden min-h-screen bg-gradient-to-r from-[#DECBA4] to-[#3E5151]"
      style={{
        background: '#3E5151',
        background: '-webkit-linear-gradient(to right, #DECBA4, #3E5151)',
        background: 'linear-gradient(to right, #DECBA4, #3E5151)',
      }}
    >
      <Hero />
      <CertificationsAwards />
      <EventsSection />
    </div>
  );
}

