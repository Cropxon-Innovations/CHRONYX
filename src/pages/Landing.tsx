import FlowLines from "@/components/landing/FlowLines";
import LifespanRing from "@/components/landing/LifespanRing";
import HeroSection from "@/components/landing/HeroSection";

const Landing = () => {
  return (
    <main className="relative min-h-screen vyom-gradient-bg flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <FlowLines />
      <LifespanRing />
      
      {/* Hero Content */}
      <HeroSection />
    </main>
  );
};

export default Landing;
