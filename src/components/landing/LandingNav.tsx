import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Sparkles,
  Shield,
  BookOpen,
  Wallet,
  Clock,
  Image,
  CheckSquare,
  Heart,
  Apple,
  Mail,
  Info,
  Download,
  ExternalLink,
  Laptop,
  Calculator,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LandingNavProps {
  onDesktopDownload?: () => void;
}

// CHRONYX Logo Component
const ChronxyxLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="nav-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#nav-logo-gradient)" 
      strokeWidth="2" 
      fill="none"
      className="opacity-80"
    />
    <circle 
      cx="50" cy="50" r="35" 
      stroke="hsl(var(--primary))" 
      strokeWidth="1" 
      strokeDasharray="6 4"
      fill="none"
      className="opacity-40"
    />
    <circle 
      cx="50" cy="50" r="5" 
      fill="hsl(var(--primary))"
      className="opacity-90"
    />
    {[0, 90, 180, 270].map((angle, i) => (
      <circle 
        key={i}
        cx={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
        cy={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
        r="2"
        fill="hsl(var(--primary))"
        className="opacity-50"
      />
    ))}
  </svg>
);

const features = [
  { icon: CheckSquare, label: "Tasks", desc: "Daily todos & planning" },
  { icon: BookOpen, label: "Study", desc: "Syllabus & learning" },
  { icon: Wallet, label: "Finance", desc: "Budget & expenses" },
  { icon: Calculator, label: "Tax", desc: "Smart tax calculator" },
  { icon: Heart, label: "Insurance", desc: "Policy management" },
  { icon: Image, label: "Memory", desc: "Private photo vault" },
  { icon: Clock, label: "Lifespan", desc: "Time visualization" },
];

const LandingNav = ({ onDesktopDownload }: LandingNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <ChronxyxLogo className="w-8 h-8" />
              </motion.div>
              <span className="text-base font-light tracking-[0.2em] text-foreground/90 group-hover:text-foreground transition-colors">
                CHRONYX
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Features Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50">
                    <Sparkles className="w-4 h-4" />
                    Features
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 bg-card border-border">
                  {features.map((feature) => (
                    <DropdownMenuItem
                      key={feature.label}
                      className="flex items-center gap-3 py-2.5 cursor-pointer"
                      onClick={() => scrollToSection("features")}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{feature.label}</p>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* About */}
              <Link
                to="/about"
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50"
              >
                <Info className="w-4 h-4" />
                About
              </Link>

              {/* Contact */}
              <button
                onClick={() => scrollToSection("footer")}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50"
              >
                <Mail className="w-4 h-4" />
                Contact
              </button>

              {/* Download Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50">
                    <Download className="w-4 h-4" />
                    Download
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 bg-card border-border">
                  <DropdownMenuItem
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                    onClick={onDesktopDownload}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <Apple className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">macOS</p>
                      <p className="text-xs text-muted-foreground">Apple Silicon</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Soon</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                    onClick={onDesktopDownload}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                      <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Windows</p>
                      <p className="text-xs text-muted-foreground">x64</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Soon</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-3 py-2.5 cursor-pointer text-primary"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Web App</p>
                      <p className="text-xs text-muted-foreground">Use in browser</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Divider */}
              <div className="w-px h-6 bg-border/50 mx-2" />

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Enter Button */}
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="ml-2 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Enter
                </motion.button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              {/* Theme Toggle Mobile */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Content */}
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-16 right-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                {/* Features Collapsible */}
                <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Features</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        featuresOpen ? "rotate-180" : ""
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1">
                    {features.map((feature) => (
                      <button
                        key={feature.label}
                        onClick={() => {
                          scrollToSection("features");
                        }}
                        className="flex items-center gap-3 w-full p-3 pl-12 rounded-lg hover:bg-accent/30 transition-colors"
                      >
                        <feature.icon className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm">{feature.label}</p>
                          <p className="text-xs text-muted-foreground">{feature.desc}</p>
                        </div>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <Info className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">About</span>
                </Link>

                {/* Contact */}
                <button
                  onClick={() => scrollToSection("footer")}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Contact</span>
                </button>

                {/* Download Collapsible */}
                <Collapsible open={downloadOpen} onOpenChange={setDownloadOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Download</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        downloadOpen ? "rotate-180" : ""
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        onDesktopDownload?.();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 pl-12 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <Apple className="w-4 h-4" />
                      <div className="flex-1 text-left">
                        <p className="text-sm">macOS</p>
                        <p className="text-xs text-muted-foreground">Apple Silicon</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Soon</span>
                    </button>
                    <button
                      onClick={() => {
                        onDesktopDownload?.();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 pl-12 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <Laptop className="w-4 h-4" />
                      <div className="flex-1 text-left">
                        <p className="text-sm">Windows</p>
                        <p className="text-xs text-muted-foreground">x64</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Soon</span>
                    </button>
                  </CollapsibleContent>
                </Collapsible>

                {/* Divider */}
                <div className="border-t border-border my-4" />

                {/* Pricing Link */}
                <Link
                  to="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Pricing</span>
                </Link>

                {/* Enter Button */}
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block mt-4"
                >
                  <button className="flex items-center justify-center gap-2 w-full p-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    <Shield className="w-5 h-5" />
                    Enter CHRONYX
                  </button>
                </Link>

                {/* Footer */}
                <div className="pt-6 mt-6 border-t border-border">
                  <p className="text-center text-[10px] tracking-widest text-muted-foreground/60">
                    CHRONYX BY CROPXON<br />
                    INNOVATIONS PVT. LTD.
                  </p>
                  <a
                    href="https://www.cropxon.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-[9px] tracking-wide text-muted-foreground/40 hover:text-muted-foreground mt-1"
                  >
                    www.cropxon.com
                  </a>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNav;