import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  X,
  Send,
  User,
  Loader2,
  ChevronDown,
  Lightbulb,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const PRESET_QUESTIONS = [
  "What's my productivity like this week?",
  "Summarize my financial status",
  "How many tasks did I complete today?",
  "What should I focus on today?",
  "How is my savings rate?",
];

// NOVA - Neural Orchestrated Voice Agent
const AGENT_NAME = "NOVA";
const AGENT_TAGLINE = "Your Personal Assistant";

// Animated NOVA Logo Component
const NovaLogo = ({ size = "md", isActive = false, isSpeaking = false }: { 
  size?: "sm" | "md" | "lg"; 
  isActive?: boolean;
  isSpeaking?: boolean;
}) => {
  const dimensions = {
    sm: { container: "w-8 h-8", inner: "w-6 h-6", ring: 32 },
    md: { container: "w-10 h-10", inner: "w-8 h-8", ring: 40 },
    lg: { container: "w-14 h-14", inner: "w-12 h-12", ring: 56 },
  };
  
  const d = dimensions[size];
  
  return (
    <div className={cn("relative flex items-center justify-center", d.container)}>
      {/* Outer rotating ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary) / 0.3), hsl(var(--primary)))",
          opacity: isActive ? 0.8 : 0.4,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner glow ring when speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0.5 rounded-full bg-primary/30"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      {/* Main circle background */}
      <div className={cn(
        "absolute rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30",
        d.inner
      )} />
      
      {/* NOVA text with animation */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span
          className={cn(
            "font-bold tracking-wider bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent",
            size === "sm" ? "text-[8px]" : size === "md" ? "text-[10px]" : "text-xs"
          )}
          animate={isActive ? {
            opacity: [1, 0.7, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          N
        </motion.span>
      </motion.div>
      
      {/* Online indicator */}
      {isActive && (
        <motion.span 
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

// Animated NOVA name badge
const NovaNameBadge = ({ isTyping = false }: { isTyping?: boolean }) => (
  <div className="flex items-center gap-1.5">
    <motion.span 
      className="font-semibold text-foreground tracking-wide"
      animate={isTyping ? { opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      NOVA
    </motion.span>
    <motion.div
      className="flex gap-0.5"
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      {['●', '●', '●'].map((dot, i) => (
        <motion.span
          key={i}
          className="text-[6px] text-primary"
          animate={{ 
            opacity: [0.3, 1, 0.3],
            y: [0, -2, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        >
          {dot}
        </motion.span>
      ))}
    </motion.div>
  </div>
);

interface ChronyxBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ChronyxBot = ({ isOpen: externalIsOpen, onClose: externalOnClose }: ChronyxBotProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en-IN");
  const [showName, setShowName] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Animate NOVA name appearing/disappearing
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setShowName(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);
  
  const welcomeMessage: Message = {
    id: "welcome",
    role: "assistant",
    content: `Hello! I'm NOVA, your personal assistant. I have access to your CHRONYX data and can help you understand your productivity, finances, study progress, and more. How can I assist you today?`,
    timestamp: new Date(),
  };
  
  // Initialize speech recognition
  useEffect(() => {
    const win = window as any;
    if (typeof window !== "undefined" && (win.SpeechRecognition || win.webkitSpeechRecognition)) {
      const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = detectedLanguage;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        
        setInput(transcript);
        
        if (event.results[0].isFinal) {
          detectLanguage(transcript);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone access.");
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [detectedLanguage]);
  
  // Language detection
  const detectLanguage = (text: string) => {
    if (/[\u0900-\u097F]/.test(text)) {
      setDetectedLanguage("hi-IN");
      return "hi-IN";
    }
    if (/[\u0B80-\u0BFF]/.test(text)) {
      setDetectedLanguage("ta-IN");
      return "ta-IN";
    }
    if (/[\u0C00-\u0C7F]/.test(text)) {
      setDetectedLanguage("te-IN");
      return "te-IN";
    }
    if (/[\u0980-\u09FF]/.test(text)) {
      setDetectedLanguage("bn-IN");
      return "bn-IN";
    }
    setDetectedLanguage("en-IN");
    return "en-IN";
  };
  
  // Professional female voice settings - calm and measured
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectedLanguage;
    utterance.rate = 0.9; // Slightly slower for calm, professional delivery
    utterance.pitch = 1.1; // Slightly higher for female voice
    utterance.volume = 0.9;
    
    // Try to find a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('woman') ||
       v.name.toLowerCase().includes('zira') || // Microsoft Zira
       v.name.toLowerCase().includes('samantha') || // Apple Samantha
       v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female') ||
       v.name.toLowerCase().includes('veena') || // Indian English
       v.name.toLowerCase().includes('raveena')) &&
      v.lang.startsWith(detectedLanguage.split("-")[0])
    );
    
    const matchingVoice = femaleVoice || voices.find(v => 
      v.lang.startsWith(detectedLanguage.split("-")[0]) && 
      !v.name.toLowerCase().includes('male')
    );
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, detectedLanguage]);
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = detectedLanguage;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast.error("Could not start voice input. Please try again.");
      }
    }
  };
  
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  
  const handleClose = () => {
    stopSpeaking();
    setMessages([welcomeMessage]);
    setInput("");
    if (externalOnClose) externalOnClose();
    else setInternalIsOpen(false);
  };
  
  const handleOpen = () => setInternalIsOpen(true);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Load voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);
  
  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading || !user) return;
    
    detectLanguage(text);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("chronyx-bot", {
        body: { 
          message: text.trim(), 
          context: "", 
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          language: detectedLanguage 
        },
      });
      
      const responseText = response.data?.response || "I apologize, I couldn't process that. Please try again.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (voiceEnabled) {
        speakText(responseText);
      }
    } catch {
      const errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
        >
          {/* Header with animated NOVA branding */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <NovaLogo size="md" isActive={true} isSpeaking={isSpeaking} />
              <div>
                <AnimatePresence mode="wait">
                  {showName ? (
                    <motion.div
                      key="name"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <NovaNameBadge isTyping={isLoading} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tagline"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="font-semibold text-foreground"
                    >
                      {AGENT_NAME}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.p 
                  className="text-[11px] text-muted-foreground"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {AGENT_TAGLINE}
                </motion.p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMessages([welcomeMessage])}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div 
                  key={message.id} 
                  className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.role === "assistant" && (
                    <NovaLogo size="sm" isActive={false} />
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-muted/50 text-foreground rounded-bl-sm border border-border/50"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-60">{format(message.timestamp, "h:mm a")}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <NovaLogo size="sm" isActive={true} />
                  <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-2.5 border border-border/50">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="flex gap-1"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 bg-primary rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </motion.div>
                      <span className="text-xs text-muted-foreground">NOVA is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              {isSpeaking && (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" onClick={stopSpeaking} className="text-xs gap-2">
                    <VolumeX className="w-3 h-3" />
                    Stop speaking
                  </Button>
                </div>
              )}
              {messages.length <= 1 && (
                <motion.div 
                  className="mt-4 space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lightbulb className="w-3 h-3" />
                    <span>Try asking me</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_QUESTIONS.map((q, i) => (
                      <motion.button 
                        key={i} 
                        onClick={() => sendMessage(q)} 
                        className="text-xs bg-muted/50 hover:bg-accent px-3 py-1.5 rounded-full border border-border/50 transition-colors"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex gap-2">
              <Button 
                variant={isListening ? "destructive" : "outline"} 
                size="icon" 
                onClick={toggleListening}
                className={cn("shrink-0", isListening && "animate-pulse")}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
                placeholder={isListening ? "Listening..." : "Ask NOVA anything..."}
                disabled={isLoading} 
                className="flex-1 bg-background" 
              />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {detectedLanguage !== "en-IN" ? `Language: ${detectedLanguage.split("-")[0].toUpperCase()}` : "NOVA uses your actual CHRONYX data"}
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Floating button with animated NOVA logo */}
      {externalIsOpen === undefined && (
        <motion.button
          onClick={() => isOpen ? handleClose() : handleOpen()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 border-2 overflow-hidden",
            isOpen 
              ? "bg-muted border-border" 
              : "bg-gradient-to-br from-primary/90 to-primary border-primary/30"
          )}
        >
          {isOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <div className="relative">
              <NovaLogo size="lg" isActive={true} />
              {/* Animated "NOVA" text that appears and disappears */}
              <AnimatePresence>
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-background/90 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider text-primary whitespace-nowrap border border-primary/20"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -5] }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    times: [0, 0.1, 0.9, 1]
                  }}
                >
                  NOVA
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ChronyxBot;
