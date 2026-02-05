 import { motion } from "framer-motion";
 import { 
   Brain, 
   MessageSquare, 
   Eye, 
   Sparkles, 
   Calendar, 
   Shield, 
   Fingerprint,
   CheckCircle2,
   Lock,
   Globe,
   RefreshCw,
   Heart
 } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 import { Card } from "@/components/ui/card";
 import type { Easing } from "framer-motion";
 
 const fadeInUp = {
   initial: { opacity: 0, y: 30 },
   animate: { opacity: 1, y: 0 },
   transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
 };
 
 const stagger = {
   animate: {
     transition: {
       staggerChildren: 0.1
     }
   }
 };
 
 const capabilities = [
   {
     icon: MessageSquare,
     title: "Chat-triggered Intelligence",
     description: "Talk to AEON via messaging platforms. One message is enough to start complex workflows."
   },
   {
     icon: Brain,
     title: "Intent → Plan → Execute",
     description: "AEON breaks your request into clear steps and executes them intelligently."
   },
   {
     icon: Eye,
     title: "Full Transparency",
     description: "Watch every step AEON takes in real time from your browser."
   },
   {
     icon: Sparkles,
     title: "Content Creation & Publishing",
     description: "Draft posts, images, videos, and platform-specific content — preview before approval."
   },
   {
     icon: Calendar,
     title: "Scheduling & Automation",
     description: "Schedule posts, reminders, and tasks without losing control."
   },
   {
     icon: Shield,
     title: "Permission-first Actions",
     description: "AEON never posts, pays, or acts without explicit approval."
   },
   {
     icon: Fingerprint,
     title: "Personalized Intelligence",
     description: "Learns your tone, preferences, and style over time."
   }
 ];
 
 const principles = [
   { icon: Lock, label: "Privacy-first" },
   { icon: Shield, label: "Secure by design" },
   { icon: Eye, label: "Transparent by default" },
   { icon: Globe, label: "Open, extensible architecture" }
 ];
 
 const Aeon = () => {
   return (
     <div className="min-h-screen bg-background relative overflow-hidden">
       {/* Ambient Background Effects */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <motion.div
           className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]"
           animate={{
             scale: [1, 1.2, 1],
             opacity: [0.3, 0.5, 0.3]
           }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
         />
         <motion.div
           className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-500/5 blur-[100px]"
           animate={{
             scale: [1.2, 1, 1.2],
             opacity: [0.3, 0.5, 0.3]
           }}
           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
         />
       </div>
 
       <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
         {/* Hero Section */}
         <motion.div
           initial="initial"
           animate="animate"
           variants={stagger}
           className="text-center mb-16 sm:mb-24"
         >
           {/* AEON Logo/Symbol */}
           <motion.div
             variants={fadeInUp}
             className="mb-8"
           >
             <motion.div
               className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary/20 via-fuchsia-500/20 to-primary/20 border border-primary/30 backdrop-blur-sm"
               animate={{
                 boxShadow: [
                   "0 0 20px hsl(var(--primary) / 0.2)",
                   "0 0 40px hsl(var(--primary) / 0.4)",
                   "0 0 20px hsl(var(--primary) / 0.2)"
                 ]
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut" as Easing
               }}
             >
               <motion.div
                 animate={{ y: [0, -10, 0] }}
                 transition={{
                   duration: 4,
                   repeat: Infinity,
                   ease: "easeInOut" as Easing
                 }}
               >
                 <span className="text-4xl sm:text-5xl font-extralight tracking-[0.2em] bg-gradient-to-r from-primary via-fuchsia-400 to-primary bg-clip-text text-transparent">
                   ∆
                 </span>
               </motion.div>
             </motion.div>
           </motion.div>
 
           {/* Title */}
           <motion.div variants={fadeInUp} className="mb-6">
             <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-[0.15em] text-foreground mb-2">
               <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                 ∆E0N
               </span>
             </h1>
             <p className="text-sm sm:text-base text-muted-foreground tracking-[0.3em] uppercase font-light">
               Personal Autonomous Agent
             </p>
           </motion.div>
 
           {/* Tagline */}
           <motion.p
             variants={fadeInUp}
             className="text-lg sm:text-xl lg:text-2xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed"
           >
             A private, intelligent agent designed to understand intent, plan actions, and execute them seamlessly across your digital life — <span className="text-foreground font-normal">with you always in control.</span>
           </motion.p>
 
           {/* Core Actions */}
           <motion.div
             variants={fadeInUp}
             className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10"
           >
             {["It listens.", "It thinks.", "It acts.", "It asks before it executes."].map((text, i) => (
               <motion.span
                 key={text}
                 className={`text-sm sm:text-base ${i === 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.8 + i * 0.15 }}
               >
                 {text}
               </motion.span>
             ))}
           </motion.div>
         </motion.div>
 
         {/* What AEON Does */}
         <motion.section
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="mb-20"
         >
           <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 mb-4">
               <Brain className="w-5 h-5 text-primary" />
               <span className="text-sm tracking-[0.2em] uppercase text-muted-foreground">What AEON Does</span>
             </div>
             <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-4">
               AEON is <span className="text-primary">not</span> a chatbot.
             </h2>
             <p className="text-lg text-muted-foreground">
               It is a <span className="text-foreground font-medium">thinking workflow engine</span>.
             </p>
           </div>
         </motion.section>
 
         {/* Core Capabilities */}
         <motion.section
           initial="initial"
           whileInView="animate"
           viewport={{ once: true }}
           variants={stagger}
           className="mb-20"
         >
           <motion.div variants={fadeInUp} className="text-center mb-12">
             <div className="inline-flex items-center gap-2 mb-4">
               <Sparkles className="w-5 h-5 text-primary" />
               <span className="text-sm tracking-[0.2em] uppercase text-muted-foreground">Core Capabilities</span>
             </div>
             <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
               Preview
             </Badge>
           </motion.div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
             {capabilities.map((cap, i) => (
               <motion.div
                 key={cap.title}
                 variants={fadeInUp}
                 whileHover={{ y: -4, transition: { duration: 0.2 } }}
               >
                 <Card className="group relative h-full p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                   {/* Hover glow effect */}
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   
                   <div className="relative z-10">
                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                       <cap.icon className="w-6 h-6 text-primary" />
                     </div>
                     <h3 className="text-lg font-medium text-foreground mb-2">{cap.title}</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
                   </div>
                 </Card>
               </motion.div>
             ))}
           </div>
         </motion.section>
 
         {/* How AEON Feels */}
         <motion.section
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="mb-20"
         >
           <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 mb-4">
               <Heart className="w-5 h-5 text-primary" />
               <span className="text-sm tracking-[0.2em] uppercase text-muted-foreground">How AEON Feels</span>
             </div>
           </div>
 
           <div className="flex flex-wrap justify-center gap-6 sm:gap-12">
             {[
               { text: "Calm, focused, and capable", highlight: true },
               { text: "Never intrusive", highlight: false },
               { text: "Never rushed", highlight: false },
               { text: "Never opaque", highlight: false }
             ].map((item, i) => (
               <motion.div
                 key={item.text}
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className={`text-center ${item.highlight ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
               >
                 <CheckCircle2 className={`w-5 h-5 mx-auto mb-2 ${item.highlight ? 'text-primary' : 'text-muted-foreground/50'}`} />
                 <span className="text-sm sm:text-base">{item.text}</span>
               </motion.div>
             ))}
           </div>
 
           <motion.p
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             transition={{ delay: 0.5 }}
             className="text-center text-lg text-muted-foreground mt-10"
           >
             AEON works <span className="text-primary font-medium">with you</span>, not instead of you.
           </motion.p>
         </motion.section>
 
         {/* Built for the Long Run */}
         <motion.section
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="mb-20"
         >
           <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 mb-4">
               <Globe className="w-5 h-5 text-primary" />
               <span className="text-sm tracking-[0.2em] uppercase text-muted-foreground">Built for the Long Run</span>
             </div>
           </div>
 
           <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
             {principles.map((principle, i) => (
               <motion.div
                 key={principle.label}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="flex items-center gap-3 px-5 py-3 rounded-full bg-card/50 border border-border/50 backdrop-blur-sm"
               >
                 <principle.icon className="w-4 h-4 text-primary" />
                 <span className="text-sm text-foreground">{principle.label}</span>
               </motion.div>
             ))}
           </div>
 
           <motion.p
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             transition={{ delay: 0.5 }}
             className="text-center text-muted-foreground mt-10"
           >
             AEON is your <span className="text-foreground font-medium">personal autonomous agent</span>, not a shared assistant.
           </motion.p>
         </motion.section>
 
         {/* Status Section */}
         <motion.section
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
           className="mb-16"
         >
           <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-fuchsia-500/5 border-primary/20 p-8 sm:p-12 text-center">
             {/* Animated background */}
             <motion.div
               className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
               animate={{
                 x: ['-100%', '100%']
               }}
               transition={{
                 duration: 3,
                 repeat: Infinity,
                 ease: "linear"
               }}
             />
             
             <div className="relative z-10">
               <div className="inline-flex items-center gap-2 mb-4">
                 <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                 <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">
                   Under Development
                 </Badge>
               </div>
               
               <h3 className="text-xl sm:text-2xl font-light text-foreground mb-4">
                 AEON is currently under active development.
               </h3>
               
               <div className="space-y-2 text-muted-foreground">
                 <p>Early access will be limited.</p>
                 <p className="text-primary font-medium">Details coming soon.</p>
               </div>
             </div>
           </Card>
         </motion.section>
 
         {/* Footer Signature */}
         <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           className="text-center"
         >
           <div className="inline-flex flex-col items-center gap-3">
             <motion.div
               className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-fuchsia-500/20 flex items-center justify-center border border-primary/20"
               animate={{
                 boxShadow: [
                   "0 0 20px hsl(var(--primary) / 0.2)",
                   "0 0 40px hsl(var(--primary) / 0.4)",
                   "0 0 20px hsl(var(--primary) / 0.2)"
                 ]
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut" as Easing
               }}
             >
               <span className="text-2xl font-extralight tracking-widest text-primary">∆</span>
             </motion.div>
             <div className="text-center">
               <p className="text-lg font-light tracking-[0.2em] text-foreground">AEON</p>
               <p className="text-xs text-muted-foreground tracking-[0.15em]">From intent to execution.</p>
             </div>
           </div>
         </motion.div>
       </div>
     </div>
   );
 };
 
 export default Aeon;