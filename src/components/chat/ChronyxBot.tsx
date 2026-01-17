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
const AGENT_TAGLINE = "Personal Assistant";

// Premium NOVA Logo - CHRONYX Design Language
const NovaLogo = ({ size = "md", isActive = false, isSpeaking = false }: { 
  size?: "xs" | "sm" | "md" | "lg" | "xl"; 
  isActive?: boolean;
  isSpeaking?: boolean;
}) => {
  const dimensions = {
    xs: { container: 24, viewBox: 48 },
    sm: { container: 32, viewBox: 48 },
    md: { container: 40, viewBox: 48 },
    lg: { container: 56, viewBox: 48 },
    xl: { container: 72, viewBox: 48 },
  };
  
  const d = dimensions[size];
  
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: d.container, height: d.container }}
    >
      <svg
        width={d.container}
        height={d.container}
        viewBox={`0 0 ${d.viewBox} ${d.viewBox}`}
        className="overflow-visible"
      >
        <defs>
          {/* Deep tint gradient - CHRONYX brand colors */}
          <linearGradient id="novaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(230 30% 35%)" />
            <stop offset="50%" stopColor="hsl(230 25% 45%)" />
            <stop offset="100%" stopColor="hsl(230 20% 55%)" />
          </linearGradient>
          
          {/* Core glow gradient */}
          <radialGradient id="novaCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(230 25% 55%)" stopOpacity="0.9" />
            <stop offset="60%" stopColor="hsl(230 30% 40%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(230 35% 30%)" stopOpacity="0.3" />
          </radialGradient>
          
          {/* Speaking pulse glow */}
          <radialGradient id="novaSpeakGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(230 25% 60%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(230 30% 45%)" stopOpacity="0" />
          </radialGradient>
          
          {/* Outer ring gradient */}
          <linearGradient id="novaRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(230 25% 50%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(230 20% 60%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(230 25% 50%)" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        {/* Speaking pulse ring */}
        {isSpeaking && (
          <motion.circle
            cx="24"
            cy="24"
            r="22"
            fill="url(#novaSpeakGlow)"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        )}
        
        {/* Outer rotating ring */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "24px 24px" }}
        >
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke="url(#novaRingGradient)"
            strokeWidth="1.5"
            strokeDasharray="8 4"
            opacity={isActive ? 0.8 : 0.4}
          />
        </motion.g>
        
        {/* Inner counter-rotating dashed ring */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "24px 24px" }}
        >
          <circle
            cx="24"
            cy="24"
            r="17"
            fill="none"
            stroke="hsl(230 20% 50%)"
            strokeWidth="0.75"
            strokeDasharray="3 6"
            opacity={isActive ? 0.6 : 0.3}
          />
        </motion.g>
        
        {/* Time markers (4 positions like CHRONYX) */}
        {[0, 90, 180, 270].map((angle, i) => (
          <motion.circle
            key={i}
            cx={24 + 19 * Math.cos((angle - 90) * Math.PI / 180)}
            cy={24 + 19 * Math.sin((angle - 90) * Math.PI / 180)}
            r="1.5"
            fill="hsl(230 25% 55%)"
            initial={{ opacity: 0.4 }}
            animate={isActive ? { 
              opacity: [0.4, 0.9, 0.4],
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Core circle with gradient */}
        <motion.circle
          cx="24"
          cy="24"
          r="13"
          fill="url(#novaCoreGlow)"
          animate={isActive ? {
            scale: [1, 1.02, 1],
          } : {}}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          style={{ transformOrigin: "24px 24px" }}
        />
        
        {/* Inner ring accent */}
        <circle
          cx="24"
          cy="24"
          r="13"
          fill="none"
          stroke="hsl(230 20% 65%)"
          strokeWidth="0.5"
          opacity="0.5"
        />
        
        {/* Center dot */}
        <motion.circle
          cx="24"
          cy="24"
          r="3"
          fill="hsl(230 15% 85%)"
          animate={isSpeaking ? {
            scale: [1, 1.3, 1],
            opacity: [0.9, 1, 0.9]
          } : isActive ? {
            opacity: [0.7, 1, 0.7]
          } : {}}
          transition={{ 
            duration: isSpeaking ? 0.5 : 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        
        {/* Speaking audio wave indicator */}
        {isSpeaking && (
          <g>
            {[-4, 0, 4].map((offset, i) => (
              <motion.line
                key={i}
                x1={24 + offset}
                y1="21"
                x2={24 + offset}
                y2="27"
                stroke="hsl(230 15% 90%)"
                strokeWidth="1"
                strokeLinecap="round"
                initial={{ scaleY: 0.5 }}
                animate={{ scaleY: [0.5, 1.2, 0.5] }}
                transition={{ 
                  duration: 0.4, 
                  repeat: Infinity, 
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: `${24 + offset}px 24px` }}
              />
            ))}
          </g>
        )}
      </svg>
      
      {/* Online indicator */}
      {isActive && !isSpeaking && (
        <motion.span 
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
          style={{ backgroundColor: "hsl(150 40% 50%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

// Animated NOVA name badge with elegant styling
const NovaNameBadge = ({ isTyping = false }: { isTyping?: boolean }) => (
  <div className="flex items-center gap-2">
    <motion.span 
      className="font-semibold tracking-widest text-sm"
      style={{ color: "hsl(230 25% 35%)" }}
      animate={isTyping ? { opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      NOVA
    </motion.span>
    {isTyping && (
      <motion.div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: "hsl(230 25% 50%)" }}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              y: [0, -2, 0]
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    )}
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
  const [showNameBadge, setShowNameBadge] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Animate NOVA name badge appearing/disappearing
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setShowNameBadge(prev => !prev);
    }, 5000);
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
          {/* Premium Header with NOVA branding */}
          <div 
            className="flex items-center justify-between p-4 border-b border-border"
            style={{ 
              background: "linear-gradient(135deg, hsl(230 20% 95%) 0%, hsl(230 15% 98%) 100%)"
            }}
          >
            <div className="flex items-center gap-3">
              <NovaLogo size="md" isActive={true} isSpeaking={isSpeaking} />
              <div className="flex flex-col">
                <AnimatePresence mode="wait">
                  {showNameBadge ? (
                    <motion.div
                      key="badge"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <NovaNameBadge isTyping={isLoading} />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="name"
                      className="font-semibold tracking-widest text-sm"
                      style={{ color: "hsl(230 25% 35%)" }}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {AGENT_NAME}
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.span 
                  className="text-[10px] tracking-wide"
                  style={{ color: "hsl(230 15% 55%)" }}
                  animate={{ opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  {AGENT_TAGLINE}
                </motion.span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/50" 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4" style={{ color: "hsl(230 25% 45%)" }} />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/50" 
                onClick={() => setMessages([welcomeMessage])}
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-white/50" 
                onClick={handleClose}
              >
                <X className="w-5 h-5 text-muted-foreground" />
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
                    <div className="shrink-0">
                      <NovaLogo size="sm" isActive={false} />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    message.role === "user" 
                      ? "rounded-br-sm text-primary-foreground"
                      : "rounded-bl-sm text-foreground border"
                  )}
                  style={message.role === "user" ? {
                    background: "linear-gradient(135deg, hsl(230 30% 35%) 0%, hsl(230 25% 45%) 100%)"
                  } : {
                    background: "hsl(230 15% 97%)",
                    borderColor: "hsl(230 20% 90%)"
                  }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] mt-1 opacity-60">{format(message.timestamp, "h:mm a")}</p>
                  </div>
                  {message.role === "user" && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "hsl(230 20% 90%)" }}
                    >
                      <User className="w-4 h-4" style={{ color: "hsl(230 25% 45%)" }} />
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
                  <div className="shrink-0">
                    <NovaLogo size="sm" isActive={true} />
                  </div>
                  <div 
                    className="rounded-2xl rounded-bl-sm px-4 py-2.5 border"
                    style={{ 
                      background: "hsl(230 15% 97%)",
                      borderColor: "hsl(230 20% 90%)"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: "hsl(230 25% 50%)" }}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </motion.div>
                      <span className="text-xs" style={{ color: "hsl(230 15% 55%)" }}>
                        NOVA is thinking...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              {isSpeaking && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={stopSpeaking} 
                    className="text-xs gap-2 border-border"
                  >
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
                  <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(230 15% 55%)" }}>
                    <Lightbulb className="w-3 h-3" />
                    <span>Try asking me</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_QUESTIONS.map((q, i) => (
                      <motion.button 
                        key={i} 
                        onClick={() => sendMessage(q)} 
                        className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ 
                          background: "hsl(230 15% 97%)",
                          borderColor: "hsl(230 20% 88%)",
                          color: "hsl(230 20% 40%)"
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        whileHover={{ backgroundColor: "hsl(230 18% 94%)" }}
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
          <div 
            className="p-4 border-t border-border"
            style={{ background: "hsl(230 15% 97%)" }}
          >
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
                className="flex-1 bg-background border-border" 
              />
              <Button 
                onClick={() => sendMessage()} 
                disabled={!input.trim() || isLoading} 
                size="icon" 
                className="shrink-0"
                style={{ 
                  background: "linear-gradient(135deg, hsl(230 30% 35%) 0%, hsl(230 25% 45%) 100%)"
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: "hsl(230 15% 55%)" }}>
              {detectedLanguage !== "en-IN" ? `Language: ${detectedLanguage.split("-")[0].toUpperCase()}` : "NOVA uses your actual CHRONYX data"}
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Premium Floating Button */}
      {externalIsOpen === undefined && (
        <motion.button
          onClick={() => isOpen ? handleClose() : handleOpen()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 rounded-full shadow-2xl flex items-center justify-center z-50 overflow-visible"
          style={{ 
            width: 64,
            height: 64,
            background: isOpen 
              ? "hsl(230 15% 95%)"
              : "linear-gradient(145deg, hsl(230 25% 25%) 0%, hsl(230 30% 35%) 50%, hsl(230 25% 40%) 100%)",
            border: isOpen ? "2px solid hsl(230 20% 88%)" : "2px solid hsl(230 25% 50% / 0.3)",
            boxShadow: isOpen 
              ? "0 4px 20px hsl(230 20% 50% / 0.15)"
              : "0 8px 32px hsl(230 30% 20% / 0.4), inset 0 1px 0 hsl(230 20% 55% / 0.2)"
          }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" style={{ color: "hsl(230 25% 45%)" }} />
              </motion.div>
            ) : (
              <motion.div
                key="logo"
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <NovaLogo size="lg" isActive={true} isSpeaking={isSpeaking} />
                
                {/* Animated "NOVA" text badge */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ 
                    background: "linear-gradient(135deg, hsl(230 20% 95%) 0%, hsl(230 15% 98%) 100%)",
                    border: "1px solid hsl(230 25% 85%)",
                    boxShadow: "0 2px 8px hsl(230 30% 20% / 0.15)"
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0], 
                    y: [4, 0, 0, -2] 
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    times: [0, 0.1, 0.85, 1],
                    ease: "easeInOut"
                  }}
                >
                  <span 
                    className="text-[9px] font-bold tracking-widest"
                    style={{ color: "hsl(230 30% 35%)" }}
                  >
                    NOVA
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ChronyxBot;
