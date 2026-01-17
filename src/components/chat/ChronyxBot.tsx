import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import chronyxLogo from "@/assets/chronyx-circular-logo.png";
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
  Sparkles,
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
];

// NOVA - Neural Orchestrated Voice Agent
const AGENT_NAME = "NOVA";
const AGENT_TAGLINE = "Your Personal Intelligence";

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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const welcomeMessage: Message = {
    id: "welcome",
    role: "assistant",
    content: `Hello! I'm ${AGENT_NAME}, your personal CHRONYX intelligence. I can help you with tasks, finances, productivity insights, and more. You can type or speak to me!`,
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
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join("");
        
        setInput(transcript);
        
        // Detect language from input
        if (event.results[0].isFinal) {
          detectLanguage(transcript);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
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
  
  // Simple language detection based on script
  const detectLanguage = (text: string) => {
    // Devanagari (Hindi, Marathi, etc.)
    if (/[\u0900-\u097F]/.test(text)) {
      setDetectedLanguage("hi-IN");
      return "hi-IN";
    }
    // Tamil
    if (/[\u0B80-\u0BFF]/.test(text)) {
      setDetectedLanguage("ta-IN");
      return "ta-IN";
    }
    // Telugu
    if (/[\u0C00-\u0C7F]/.test(text)) {
      setDetectedLanguage("te-IN");
      return "te-IN";
    }
    // Bengali
    if (/[\u0980-\u09FF]/.test(text)) {
      setDetectedLanguage("bn-IN");
      return "bn-IN";
    }
    // Kannada
    if (/[\u0C80-\u0CFF]/.test(text)) {
      setDetectedLanguage("kn-IN");
      return "kn-IN";
    }
    // Malayalam
    if (/[\u0D00-\u0D7F]/.test(text)) {
      setDetectedLanguage("ml-IN");
      return "ml-IN";
    }
    // Gujarati
    if (/[\u0A80-\u0AFF]/.test(text)) {
      setDetectedLanguage("gu-IN");
      return "gu-IN";
    }
    // Default to English
    setDetectedLanguage("en-IN");
    return "en-IN";
  };
  
  // Text to speech function
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectedLanguage;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a voice for the detected language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(detectedLanguage.split("-")[0]));
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
    
    // Detect language
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
      const response = await supabase.functions.invoke("chronyx-bot", {
        body: { message: text.trim(), context: "", history: [], language: detectedLanguage },
      });
      
      const responseText = response.data?.response || "I couldn't process that. Please try again.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      if (voiceEnabled) {
        speakText(responseText);
      }
    } catch {
      const errorMessage = "I'm having trouble connecting. Please try again.";
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
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={chronyxLogo} 
                  alt="NOVA" 
                  className="w-10 h-10 rounded-full ring-2 ring-primary/20" 
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-foreground">{AGENT_NAME}</h3>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground">{AGENT_TAGLINE}</p>
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
                <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                      <img src={chronyxLogo} alt="" className="w-6 h-6 rounded-full" />
                    </div>
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
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
                    <img src={chronyxLogo} alt="" className="w-6 h-6 rounded-full animate-pulse" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-2.5 border border-border/50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
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
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lightbulb className="w-3 h-3" />
                    <span>Quick questions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_QUESTIONS.map((q, i) => (
                      <button 
                        key={i} 
                        onClick={() => sendMessage(q)} 
                        className="text-xs bg-muted/50 hover:bg-accent px-3 py-1.5 rounded-full border border-border/50 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
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
                placeholder={isListening ? "Listening..." : `Ask ${AGENT_NAME} anything...`}
                disabled={isLoading} 
                className="flex-1 bg-background" 
              />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {detectedLanguage !== "en-IN" ? `Detected: ${detectedLanguage.split("-")[0].toUpperCase()}` : "Speak or type in any language"}
            </p>
          </div>
        </motion.div>
      )}
      
      {externalIsOpen === undefined && (
        <motion.button
          onClick={() => isOpen ? handleClose() : handleOpen()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 border-2",
            isOpen 
              ? "bg-muted border-border" 
              : "bg-gradient-to-br from-primary/90 to-primary border-primary/30"
          )}
        >
          {isOpen ? <ChevronDown className="w-6 h-6" /> : (
            <div className="relative">
              <img 
                src={chronyxLogo} 
                alt="NOVA" 
                className="w-10 h-10 rounded-full" 
              />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-card" />
            </div>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ChronyxBot;
