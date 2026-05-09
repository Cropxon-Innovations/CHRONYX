import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

// CHRONYX Logo Icon - Geometric angular symbol in concentric circles
const ChronxyxLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer circle */}
    <circle cx="256" cy="256" r="248" fill="currentColor" />
    {/* White ring */}
    <circle cx="256" cy="256" r="200" fill="none" stroke="hsl(var(--background))" strokeWidth="32" />
    {/* Inner filled circle */}
    <circle cx="256" cy="256" r="168" fill="currentColor" />
    {/* Geometric angular symbol - stylized interlocking arms */}
    <path
      d="M256 128 L256 216 L168 216 L168 256 L216 256 L216 344 L256 344 L256 296 L344 296 L344 256 L296 256 L296 168 L256 168 L256 128Z"
      fill="hsl(var(--background))"
    />
    {/* Extended arms */}
    <rect x="168" y="168" width="40" height="48" fill="hsl(var(--background))" />
    <rect x="304" y="296" width="40" height="48" fill="hsl(var(--background))" />
    <rect x="296" y="168" width="48" height="40" fill="hsl(var(--background))" />
    <rect x="168" y="304" width="48" height="40" fill="hsl(var(--background))" />
  </svg>
);

const featureGroups = {
  ai: {
    label: "AI & Intelligence",
    icon: Bot,
    color: "from-fuchsia-500 to-purple-600",
    items: [
      { icon: Sparkles, label: "NoteFlow", desc: "AI images, slides & video from notes", href: "#features", highlight: true, flagship: true },
      { icon: Bot, label: "NOVA AI", desc: "Personal AI assistant across all modules", href: "#features" },
      { icon: Calculator, label: "TAXYN", desc: "AI-powered tax assistant", href: "#features", highlight: true },
    ],
  },
  productivity: {
    label: "Productivity",
    icon: Layers,
    color: "from-emerald-500 to-teal-500",
    items: [
      { icon: CheckSquare, label: "Tasks & Todos", desc: "Smart task management & streaks", href: "#features" },
      { icon: BookOpen, label: "Study Planner", desc: "Syllabus tracking & timetable", href: "#features" },
      { icon: Clock, label: "Lifespan", desc: "Time visualization tracker", href: "#features" },
    ],
  },
  finance: {
    label: "Finance & Tax",
    icon: BarChart3,
    color: "from-amber-500 to-orange-500",
    items: [
      { icon: Wallet, label: "Finance Tracker", desc: "Expenses, income & budgets", href: "#features" },
      { icon: Calculator, label: "Tax Calculator", desc: "Old vs New regime comparison", href: "#features", highlight: true },
      { icon: Heart, label: "Insurance", desc: "Policy management & reminders", href: "#features" },
    ],
  },
  personal: {
    label: "Personal Vault",
    icon: Lock,
    color: "from-indigo-500 to-blue-500",
    items: [
      { icon: Image, label: "Memory Vault", desc: "Private photo & media storage", href: "#features" },
      { icon: Shield, label: "Document Vault", desc: "Encrypted document storage", href: "#features" },
      { icon: BookOpen, label: "Digital Library", desc: "Upload & read books (PDF, EPUB)", href: "#features" },
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
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const handleContactClick = () => {
    setIsOpen(false);
    navigate("/contact");
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
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 gap-4">

            {/* LEFT: Features mega menu + About + Pricing */}
            <nav className="hidden md:flex items-center justify-start gap-1">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                      <Sparkles className="w-4 h-4 text-fuchsia-500" />
                      Features
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[720px] p-6 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/30">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">Explore Features</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Everything in one ecosystem</p>
                          </div>
                          <Link to="/login" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            Get started free <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {Object.entries(featureGroups).map(([key, group]) => (
                            <div key={key} className="space-y-2">
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${(group as any).color} flex items-center justify-center`}>
                                  <group.icon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-foreground tracking-wide">{group.label}</span>
                              </div>
                              <div className="space-y-0.5">
                                {group.items.map((item) => (
                                  <NavigationMenuLink key={item.label} asChild>
                                    <button
                                      onClick={() => scrollToSection("features")}
                                      className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all hover:bg-muted/50 group/item ${
                                        (item as any).flagship ? "bg-gradient-to-r from-fuchsia-500/5 to-purple-500/5 border border-fuchsia-500/20" :
                                        item.highlight ? "bg-primary/5 border border-primary/10" : ""
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        (item as any).flagship ? "bg-gradient-to-br from-fuchsia-500 to-purple-600" :
                                        item.highlight ? "bg-primary/10" : "bg-muted/60"
                                      }`}>
                                        <item.icon className={`w-4 h-4 ${(item as any).flagship ? "text-white" : item.highlight ? "text-primary" : "text-muted-foreground group-hover/item:text-primary transition-colors"}`} />
                                      </div>
                                      <div className="text-left flex-1 min-w-0">
                                        <p className={`text-sm font-medium leading-tight ${(item as any).flagship ? "text-fuchsia-600 dark:text-fuchsia-400" : item.highlight ? "text-primary" : "text-foreground"}`}>{item.label}</p>
                                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.desc}</p>
                                      </div>
                                      {(item as any).flagship && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-full font-bold shrink-0">★</span>
                                      )}
                                      {item.highlight && !(item as any).flagship && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-primary/15 text-primary rounded-full font-medium shrink-0">New</span>
                                      )}
                                    </button>
                                  </NavigationMenuLink>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <Link
                to="/about"
                className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors rounded-lg hover:bg-emerald-500/5"
              >
                <Info className="w-4 h-4" />
                About
              </Link>

              <Link
                to="/pricing"
                className="flex items-center gap-2 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors rounded-lg hover:bg-amber-500/5"
              >
                <BarChart3 className="w-4 h-4" />
                Pricing
              </Link>
            </nav>

            {/* CENTER: Logo (icon only — no wordmark) */}
            <Link to="/" className="flex items-center justify-center mx-auto group" aria-label="CHRONYX home">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.05 }}
                transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                className="text-foreground"
              >
                <ChronxyxLogo className="w-10 h-10" />
              </motion.div>
            </Link>

            {/* RIGHT: Contact, Download, Theme, Enter */}
            <nav className="hidden md:flex items-center justify-end gap-1">
              <Link
                to="/contact"
                className="flex items-center gap-2 px-4 py-2 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors rounded-lg hover:bg-sky-500/5"
              >
                <Mail className="w-4 h-4" />
                Contact
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors rounded-lg hover:bg-violet-500/5">
                    <Download className="w-4 h-4" />
                    Download
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-xl border-border/50">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Desktop Apps</DropdownMenuLabel>
                  <DropdownMenuItem className="flex items-center gap-3 py-3 cursor-pointer" onClick={onDesktopDownload}>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">macOS</p>
                      <p className="text-xs text-muted-foreground">Apple Silicon</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full font-medium">Soon</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 py-3 cursor-pointer" onClick={onDesktopDownload}>
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
                  <DropdownMenuItem className="flex items-center gap-3 py-3 cursor-pointer text-primary">
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

              <div className="w-px h-5 bg-border/50 mx-2" />

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
                      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              )}

              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="ml-2 flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Enter
                </motion.button>
              </Link>
            </nav>

            {/* Mobile spacer for grid layout */}
            <div className="md:hidden" />

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

                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <Info className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">About</span>
                </Link>

                {/* Contact - Navigate to /contact page */}
                <Link
                  to="/contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Contact</span>
                </Link>

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
