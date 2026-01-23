import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle, Sparkles, CreditCard, LifeBuoy, User, Building2, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

// Typography animation variants
const letterAnimation = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

const AnimatedText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <motion.span className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={letterAnimation}
          initial="hidden"
          animate="visible"
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: formData
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Office Email",
      primary: "Office@getchronyx.com",
      secondary: "For official inquiries",
      href: "mailto:Office@getchronyx.com"
    },
    {
      icon: MessageSquare,
      title: "Support",
      primary: "support@getchronyx.com",
      secondary: "For technical help",
      href: "mailto:support@getchronyx.com"
    },
    {
      icon: Phone,
      title: "Phone",
      primary: "+91 98765 43210",
      secondary: "Mon-Fri, 10AM-6PM IST",
      href: "tel:+919876543210"
    },
    {
      icon: Clock,
      title: "Response Time",
      primary: "Within 24 hours",
      secondary: "We reply fast",
      href: null
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] -top-[200px] -right-[100px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)" }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] top-[60%] -left-[100px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(280 60% 60% / 0.04) 0%, transparent 70%)" }}
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="text-xl font-extralight tracking-[0.2em]">CHRONYX</span>
              <span className="text-xs text-muted-foreground">by ORIGINX LABS</span>
            </motion.div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        {/* Hero Section with Animated Typography */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 mb-6"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">We'd love to hear from you</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight mb-6 tracking-tight">
            <AnimatedText text="Get in Touch" />
          </h1>
          
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Have a question, suggestion, or need support? We'd love to hear from you. 
            Fill out the form below and we'll get back to you as soon as possible.
          </motion.p>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
                  <CardContent className="p-6">
                    {info.href ? (
                      <a href={info.href} className="flex items-start gap-4 group">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <info.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{info.title}</p>
                          <p className="font-semibold group-hover:text-primary transition-colors">{info.primary}</p>
                          <p className="text-sm text-muted-foreground">{info.secondary}</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <info.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{info.title}</p>
                          <p className="font-semibold">{info.primary}</p>
                          <p className="text-sm text-muted-foreground">{info.secondary}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                <CardContent className="p-6 relative">
                  <motion.div
                    className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/5"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Our Office</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    <strong className="text-foreground">ORIGINX LABS PVT. LTD.</strong><br />
                    Bangalore, Karnataka<br />
                    India - 560001
                  </p>
                  <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                    <a 
                      href="mailto:Office@getchronyx.com"
                      className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Office@getchronyx.com
                    </a>
                    <a 
                      href="https://www.cropxon.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      www.cropxon.com
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Quick Contact</p>
                  <div className="space-y-2">
                    <a 
                      href="mailto:Office@getchronyx.com"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email Office
                    </a>
                    <a 
                      href="tel:+919876543210"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll respond within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We'll get back to you soon.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: "", email: "", subject: "general", message: "" });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                          <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help you..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about CHRONYX features, pricing, and support.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Features FAQs */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  Features & Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">What is CHRONYX?</h4>
                  <p className="text-sm text-muted-foreground">
                    CHRONYX is an all-in-one personal life management platform that helps you track finances, 
                    study sessions, tasks, memories, and more. It's designed to give you complete control 
                    over your personal data in a quiet, minimal interface.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">What can I track with CHRONYX?</h4>
                  <p className="text-sm text-muted-foreground">
                    You can track expenses, income, loans, insurance policies, study sessions with syllabus planning, 
                    daily todos, achievements, memories with photo storage, documents, and more. Everything 
                    is organized in one secure place.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Is my data secure?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! CHRONYX uses enterprise-grade encryption and secure cloud infrastructure. Your data 
                    is protected with industry-standard security protocols, and you have full control over 
                    your information with data export options.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Can I use CHRONYX offline?</h4>
                  <p className="text-sm text-muted-foreground">
                    CHRONYX is a Progressive Web App (PWA) with offline capabilities. You can install it 
                    on your device and access certain features even without an internet connection. Data 
                    syncs automatically when you're back online.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing FAQs */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  Pricing & Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Is CHRONYX free to use?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! CHRONYX offers a generous free tier with core features including expense tracking, 
                    income management, study tracking, todos, and basic reports. Premium features are 
                    available through Pro and Premium plans.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">What's included in the Pro plan?</h4>
                  <p className="text-sm text-muted-foreground">
                    Pro plan includes extra memory storage, advanced financial insights, tax savings tools, 
                    detailed analytics, email reminders for EMIs and insurance renewals, and priority 
                    customer support.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">What's the Premium Lifetime plan?</h4>
                  <p className="text-sm text-muted-foreground">
                    Premium Lifetime gives you permanent access to all CHRONYX features with a one-time payment. 
                    This includes unlimited storage, early access to new features, dedicated support, and 
                    all future updates forever.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">What payment methods are accepted?</h4>
                  <p className="text-sm text-muted-foreground">
                    We accept UPI, credit/debit cards, net banking, and popular wallets through our 
                    secure Razorpay integration. All transactions are encrypted and PCI-DSS compliant.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Support FAQs */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LifeBuoy className="w-4 h-4 text-primary" />
                  </div>
                  Support & Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">How can I get help?</h4>
                  <p className="text-sm text-muted-foreground">
                    You can reach our support team at <a href="mailto:support@getchronyx.com" className="text-primary hover:underline">support@getchronyx.com</a>. 
                    We typically respond within 24 hours on business days. For urgent issues, 
                    Pro and Premium users get priority support.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Can I export my data?</h4>
                  <p className="text-sm text-muted-foreground">
                    Absolutely! CHRONYX allows you to export all your data at any time. Go to Settings 
                    and use the Data Export feature to download your complete data in JSON format. 
                    PDF reports are also available for financial data.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">How do I delete my account?</h4>
                  <p className="text-sm text-muted-foreground">
                    You can delete your account from Settings → Delete Account. We'll send an OTP 
                    verification for security. Before deletion, we recommend exporting your data 
                    as this action is permanent and cannot be undone.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Do you offer refunds?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, we offer refunds within 7 days of purchase if you're not satisfied. 
                    Contact <a href="mailto:office@getchronyx.com" className="text-primary hover:underline">office@getchronyx.com</a> with 
                    your payment details and reason for the refund request.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account FAQs */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  Account & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">How do I verify my email?</h4>
                  <p className="text-sm text-muted-foreground">
                    After signing up, go to Settings and click "Verify" next to your email. We'll send 
                    a 6-digit OTP to your email which you can enter to complete verification. 
                    Verified emails appear with a green tick.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Can I sign in with Google?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! CHRONYX supports Google Sign-In for a faster and more secure login experience. 
                    Just click "Continue with Google" on the login page to authenticate with your 
                    Google account.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Who owns my data?</h4>
                  <p className="text-sm text-muted-foreground">
                    You do! CHRONYX believes in data sovereignty. You have complete ownership and 
                    control over your data. We don't sell or share your personal information with 
                    third parties. Read our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Is there a desktop app?</h4>
                  <p className="text-sm text-muted-foreground">
                    Desktop apps for Mac and Windows are coming soon! Meanwhile, you can use CHRONYX 
                    as a PWA by installing it from your browser. It works just like a native app 
                    with offline support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap mt-10">
            <Button variant="outline" asChild>
              <Link to="/about">About CHRONYX</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">© {new Date().getFullYear()} CHRONYX by ORIGINX LABS PVT. LTD.</p>
          <p>
            <a href="https://www.originxlabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              www.originxlabs.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
