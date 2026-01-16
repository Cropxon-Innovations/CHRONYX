import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Mail, Phone, MapPin, Linkedin, Twitter, Globe, Users, Target, 
  Heart, Shield, Zap, Clock, FileText, Wallet, BookOpen, Camera, CheckCircle,
  Sparkles, Lock, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const About = () => {
  const chronyxFeatures = [
    { icon: Wallet, title: "Financial Tracking", desc: "Expenses, income, loans, and EMI management" },
    { icon: Camera, title: "Memory Vault", desc: "Secure photo and video storage with privacy" },
    { icon: FileText, title: "Document Hub", desc: "Store and organize important documents" },
    { icon: BookOpen, title: "Study Planner", desc: "Track learning progress and goals" },
    { icon: Shield, title: "Insurance Manager", desc: "Track policies, claims, and renewals" },
    { icon: Clock, title: "Life Timeline", desc: "Visualize your journey through time" },
  ];

  const values = [
    { icon: Lock, title: "Privacy First", desc: "Your data belongs to you. We never sell or share your personal information." },
    { icon: Zap, title: "Simplicity", desc: "Powerful features wrapped in intuitive, beautiful interfaces." },
    { icon: Sparkles, title: "Innovation", desc: "Continuously improving to serve you better with cutting-edge technology." },
    { icon: BarChart3, title: "Transparency", desc: "Clear pricing, honest practices, and open communication." },
  ];

  const team = [
    {
      name: "Leadership Team",
      role: "Vision & Strategy",
      description: "Guiding CHRONYX's mission to simplify personal life management for everyone worldwide."
    },
    {
      name: "Engineering Team",
      role: "Product Development",
      description: "Building robust, scalable, and secure solutions that power CHRONYX."
    },
    {
      name: "Design Team",
      role: "User Experience",
      description: "Crafting intuitive interfaces that make life tracking effortless and delightful."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">CHRONYX</span>
              <span className="text-xs text-muted-foreground">by CROPXON</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section - CHRONYX */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            About Us
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            About <span className="text-primary">CHRONYX</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your personal life operating system. A quiet, secure space to manage your finances, 
            preserve memories, track goals, and organize your entire life—all in one beautiful place.
          </p>
        </motion.section>

        {/* CHRONYX Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">The CHRONYX Story</h2>
              </div>
              <div className="space-y-5 text-muted-foreground leading-relaxed text-base md:text-lg">
                <p>
                  <strong className="text-foreground">CHRONYX</strong> was born from a simple yet powerful idea: 
                  everyone deserves a private, secure space to manage their entire life. In a world of scattered apps, 
                  overwhelming notifications, and constant digital noise, we envisioned something different—
                  <em>a quiet space for your life</em>.
                </p>
                <p>
                  We believe that managing your finances, preserving precious memories, tracking personal goals, 
                  and organizing important documents shouldn't require juggling multiple apps and complex spreadsheets. 
                  CHRONYX brings everything together in one elegant, intuitive platform.
                </p>
                <p>
                  From tracking daily expenses and managing loans with detailed EMI schedules, to storing cherished 
                  photographs in a secure memory vault, planning your studies with smart reminders, and keeping 
                  all your important documents organized—CHRONYX is designed to be your trusted companion 
                  through every chapter of life.
                </p>
                <p>
                  Built with <strong className="text-foreground">privacy at its core</strong>, CHRONYX ensures 
                  your personal data remains yours. No ads, no data selling, no compromises. Just a beautiful, 
                  powerful tool that respects your privacy while helping you live a more organized, intentional life.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* CHRONYX Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">What CHRONYX Offers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chronyxFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card className="border-border/50 bg-card/50 h-full hover:bg-card/80 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Mission & Vision */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-16"
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Our Mission</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To empower individuals worldwide with simple, powerful, and private tools that help them 
                take control of their finances, preserve their most precious memories, achieve their goals, 
                and live more organized, intentional lives.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Our Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                A world where everyone has access to the tools they need to make informed decisions 
                about their life and finances, regardless of their background—where personal data 
                privacy is not a luxury but a fundamental right.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Our Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card className="border-border/50 bg-card/50 h-full text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Divider */}
        <div className="relative my-20">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-6 text-sm text-muted-foreground">POWERED BY</span>
          </div>
        </div>

        {/* CROPXON Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <Card className="border-border/50 bg-card/50 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">CROPXON INNOVATIONS PVT. LTD.</h2>
                  <p className="text-sm text-muted-foreground">The Company Behind CHRONYX</p>
                </div>
              </div>
              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">CROPXON INNOVATIONS PVT. LTD.</strong> is an innovative 
                  technology company based in India, dedicated to building products that make a meaningful 
                  difference in people's lives. Founded with the vision of leveraging technology for 
                  positive impact, CROPXON focuses on creating solutions that are both powerful and accessible.
                </p>
                <p>
                  CHRONYX is our flagship consumer product, representing our commitment to building 
                  user-centric applications that respect privacy while delivering exceptional functionality. 
                  We believe technology should serve humanity, not exploit it—and every product we build 
                  reflects this philosophy.
                </p>
                <p>
                  At CROPXON, we're driven by a passion for innovation, a commitment to quality, 
                  and an unwavering focus on user privacy and security. We're building the future, 
                  one thoughtful product at a time.
                </p>
              </div>
              <div className="mt-8 pt-8 border-t border-border/50">
                <a 
                  href="https://www.cropxon.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <Globe className="w-4 h-4" />
                  Visit www.cropxon.com →
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Team */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Our Team</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="border-border/50 bg-card/50 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{member.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-bold mb-1">{member.name}</h3>
                    <p className="text-sm text-primary mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-16"
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Get in Touch</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <a 
                  href="mailto:contact@getchronyx.com" 
                  className="flex items-center gap-3 p-4 rounded-lg bg-background/50 hover:bg-background transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">General</p>
                    <p className="text-sm font-medium">contact@getchronyx.com</p>
                  </div>
                </a>

                <a 
                  href="mailto:support@getchronyx.com" 
                  className="flex items-center gap-3 p-4 rounded-lg bg-background/50 hover:bg-background transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Support</p>
                    <p className="text-sm font-medium">support@getchronyx.com</p>
                  </div>
                </a>

                <a 
                  href="mailto:office@getchronyx.com" 
                  className="flex items-center gap-3 p-4 rounded-lg bg-background/50 hover:bg-background transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Billing</p>
                    <p className="text-sm font-medium">office@getchronyx.com</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">India</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border/50">
                <a 
                  href="https://www.cropxon.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who trust CHRONYX to manage their life.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg">
              <Link to="/login">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">© {new Date().getFullYear()} CHRONYX by CROPXON INNOVATIONS PVT. LTD.</p>
          <p>
            <a href="https://www.cropxon.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              www.cropxon.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
