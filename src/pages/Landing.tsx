import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const Landing = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative min-h-screen h-screen w-full flex items-center justify-center overflow-hidden bg-vyom-landing">
      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--vyom-landing-vignette))_100%)]" />
      
      {/* Rotating Arc - Meditative motion */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="vyom-arc-rotate"
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main arc */}
          <circle
            cx="300"
            cy="300"
            r="280"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="1"
            strokeDasharray="440 1320"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.04]"
          />
          {/* Secondary arc for depth */}
          <circle
            cx="300"
            cy="300"
            r="260"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="0.5"
            strokeDasharray="220 1540"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.03]"
          />
        </svg>
      </div>

      {/* Progress Ring - Subtle circular indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="vyom-ring-slow-rotate"
          width="500"
          height="500"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ring track */}
          <circle
            cx="250"
            cy="250"
            r="220"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="1"
            fill="none"
            className="opacity-[0.02]"
          />
          {/* Ring progress fill */}
          <circle
            cx="250"
            cy="250"
            r="220"
            stroke="hsl(var(--vyom-arc-stroke))"
            strokeWidth="1.5"
            strokeDasharray="345 1036"
            strokeDashoffset="0"
            strokeLinecap="round"
            fill="none"
            className="opacity-[0.05] vyom-ring-fill-animate"
            transform="rotate(-90 250 250)"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-md">
        {/* Primary Title */}
        <h1 
          className={`text-5xl sm:text-6xl md:text-7xl font-light tracking-[0.35em] text-vyom-landing-title transition-opacity duration-[800ms] ease-out ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          VYOM
        </h1>

        {/* Tagline */}
        <p 
          className={`mt-8 text-base sm:text-lg font-light text-vyom-landing-tagline transition-opacity duration-[600ms] ease-out ${
            mounted ? 'opacity-100 delay-300' : 'opacity-0'
          }`}
          style={{ 
            transitionDelay: '300ms',
            fontFamily: "'Inter', system-ui, sans-serif"
          }}
        >
          A quiet space for your life.
        </p>

        {/* Subtext - Categories */}
        <p 
          className={`mt-4 text-xs sm:text-sm text-vyom-landing-subtext tracking-widest transition-opacity duration-[600ms] ease-out ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            transitionDelay: '500ms',
            fontFamily: "'Inter', system-ui, sans-serif"
          }}
        >
          Tasks · Learning · Money · Time
        </p>

        {/* CTA Button */}
        <Link 
          to="/login"
          className={`mt-12 transition-opacity duration-[600ms] ease-out ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '700ms' }}
        >
          <button className="px-8 py-3 text-sm tracking-wider font-light border border-vyom-landing-button-border text-vyom-landing-button-text bg-transparent rounded-sm hover:bg-vyom-landing-button-hover hover:border-vyom-landing-button-hover-border transition-all duration-300 ease-out">
            Enter VYOM
          </button>
        </Link>
      </div>
    </main>
  );
};

export default Landing;
