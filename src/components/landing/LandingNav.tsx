import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Shield,
  BookOpen,
  Wallet,
  Clock,
  Image,
  CheckSquare,
  Heart,
  Mail,
  Info,
  Download,
  Laptop,
  Calculator,
  CreditCard,
  ArrowRight,
  Layers,
  BarChart3,
  Lock,
  Bot,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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

const featureGroups = {
  productivity: {
    label: "Productivity",
    icon: Layers,
    items: [
      { icon: CheckSquare, label: "Tasks", desc: "Daily todos & planning", href: "#features" },
      { icon: BookOpen, label: "Study", desc: "Syllabus & learning", href: "#features" },
      { icon: Clock, label: "Lifespan", desc: "Time visualization", href: "#features" },
    ],
  },
  finance: {
    label: "Finance",
    icon: BarChart3,
    items: [
      { icon: Wallet, label: "Finance", desc: "Budget & expenses", href: "#features" },
      { icon: Calculator, label: "Tax", desc: "Smart tax calculator", href: "#features", highlight: true },
      { icon: Heart, label: "Insurance", desc: "Policy management", href: "#features" },
    ],
  },
  personal: {
    label: "Personal",
    icon: Lock,
    items: [
      { icon: Image, label: "Memory", desc: "Private photo vault", href: "#features" },
      { icon: Bot, label: "TAXYN", desc: "AI tax assistant", href: "#features" },
    ],
  },
};

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
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/70 backdrop-blur-xl border-b border-border/30 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <ChronxyxLogo className="w-9 h-9" />
              </motion.div>
              <span className="text-lg font-extralight tracking-[0.2em] text-foreground/90 group-hover:text-foreground transition-colors">
                CHRONYX
              </span>
            </Link>

            {/* Desktop Navigation - Apple/Vercel style */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Features Mega Menu */}
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                      <Sparkles className="w-4 h-4" />
                      Features
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[600px] p-6 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl">
                        <div className="grid grid-cols-3 gap-6">
                          {Object.entries(featureGroups).map(([key, group]) => (
                            <div key={key}>
                              <div className="flex items-center gap-2 mb-4">
                                <group.icon className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.label}</span>
                              </div>
                              <div className="space-y-1">
                                {group.items.map((item) => (
                                  <NavigationMenuLink key={item.label} asChild>
                                    <button
                                      onClick={() => scrollToSection("features")}
                                      className={`flex items-start gap-3 w-full p-3 rounded-lg transition-all hover:bg-muted/50 ${
                                        item.highlight ? "bg-primary/5 border border-primary/20" : ""
                                      }`}
                                    >
                                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                        item.highlight ? "bg-primary/10" : "bg-muted/50"
                                      }`}>
                                        <item.icon className={`w-4 h-4 ${item.highlight ? "text-primary" : "text-muted-foreground"}`} />
                                      </div>
                                      <div className="text-left">
                                        <p className={`text-sm font-medium ${item.highlight ? "text-primary" : ""}`}>{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                      </div>
                                      {item.highlight && (
                                        <span className="ml-auto text-[9px] px-2 py-0.5 bg-primary/20 text-primary rounded-full">New</span>
                                      )}
                                    </button>
                                  </NavigationMenuLink>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            All features included in every plan
                          </p>
                          <Link to="/login" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Get started <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              {/* Pricing */}
              <Link
                to="/pricing"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
              >
                <CreditCard className="w-4 h-4" />
                Pricing
              </Link>

              {/* About */}
              <Link
                to="/about"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
              >
                <Info className="w-4 h-4" />
                About
              </Link>

              {/* Contact */}
              <button
                onClick={() => scrollToSection("footer")}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
              >
                <Mail className="w-4 h-4" />
                Contact
              </button>

              {/* Download Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30">
                    <Download className="w-4 h-4" />
                    Download
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-xl border-border/50">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Desktop Apps</DropdownMenuLabel>
                  <DropdownMenuItem
                    className="flex items-center gap-3 py-3 cursor-pointer"
                    onClick={onDesktopDownload}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <span className="text-sm"></span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">macOS</p>
                      <p className="text-xs text-muted-foreground">Apple Silicon</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full font-medium">Soon</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-3 py-3 cursor-pointer"
                    onClick={onDesktopDownload}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                      <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Windows</p>
                      <p className="text-xs text-muted-foreground">x64</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full font-medium">Soon</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-3 py-3 cursor-pointer text-primary"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Web App</p>
                      <p className="text-xs text-muted-foreground">Install as PWA</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Divider */}
              <div className="w-px h-5 bg-border/50 mx-2" />

              {/* Theme Toggle */}
              {mounted && (
                <motion.button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  aria-label="Toggle theme"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={theme}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Enter Button */}
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="ml-3 flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all"
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
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-lg"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Menu Content */}
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-16 right-0 bottom-0 w-full max-w-sm bg-card/95 backdrop-blur-xl border-l border-border/30 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                {/* Features Collapsible */}
                <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Features</span>
                    </div>
                    <motion.div
                      animate={{ rotate: featuresOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1">
                    {Object.entries(featureGroups).map(([key, group]) => (
                      <div key={key} className="mb-4">
                        <div className="flex items-center gap-2 px-4 py-2">
                          <group.icon className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{group.label}</span>
                        </div>
                        {group.items.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              scrollToSection("features");
                            }}
                            className="flex items-center gap-3 w-full p-3 pl-8 rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <item.icon className={`w-4 h-4 ${item.highlight ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="text-left flex-1">
                              <p className={`text-sm ${item.highlight ? "text-primary font-medium" : ""}`}>{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            {item.highlight && (
                              <span className="text-[9px] px-2 py-0.5 bg-primary/20 text-primary rounded-full">New</span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Pricing */}
                <Link
                  to="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Pricing</span>
                </Link>

                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <Info className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">About</span>
                </Link>

                {/* Contact */}
                <button
                  onClick={() => scrollToSection("footer")}
                  className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Contact</span>
                </button>

                {/* Download Collapsible */}
                <Collapsible open={downloadOpen} onOpenChange={setDownloadOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Download</span>
                    </div>
                    <motion.div
                      animate={{ rotate: downloadOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        onDesktopDownload?.();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 pl-8 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-lg"></span>
                      <div className="flex-1 text-left">
                        <p className="text-sm">macOS</p>
                        <p className="text-xs text-muted-foreground">Apple Silicon</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Soon</span>
                    </button>
                    <button
                      onClick={() => {
                        onDesktopDownload?.();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 pl-8 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Laptop className="w-5 h-5" />
                      <div className="flex-1 text-left">
                        <p className="text-sm">Windows</p>
                        <p className="text-xs text-muted-foreground">x64</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">Soon</span>
                    </button>
                  </CollapsibleContent>
                </Collapsible>

                {/* Divider */}
                <div className="border-t border-border/30 my-4" />

                {/* Enter Button */}
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-3 w-full p-4 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  Enter CHRONYX
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNav;
