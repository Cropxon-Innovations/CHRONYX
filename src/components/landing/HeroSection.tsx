import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
      {/* Title */}
      <h1 className="vyom-fade-in text-6xl md:text-8xl font-light tracking-[0.3em] text-foreground mb-6">
        VYOM
      </h1>

      {/* Subtitle */}
      <p className="vyom-fade-in-delayed text-lg md:text-xl text-muted-foreground font-light max-w-md mb-4">
        A private system to track your life with clarity.
      </p>

      {/* Categories */}
      <p className="vyom-fade-in-delayed text-sm text-muted-foreground/70 tracking-widest mb-12">
        Tasks · Learning · Money · Time
      </p>

      {/* CTA */}
      <Link to="/login" className="vyom-fade-in-delayed-2">
        <Button 
          variant="vyom" 
          size="xl"
          className="tracking-wider"
        >
          Enter VYOM
        </Button>
      </Link>
    </div>
  );
};

export default HeroSection;
