import {
  Linkedin,
  Github,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  Send,
  Globe,
  Music,
  Image,
  Bookmark,
  Chrome,
  MessageSquare,
  Twitch,
  Video,
  type LucideIcon
} from "lucide-react";

// Map platform icon strings to Lucide components
export const PLATFORM_ICONS: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  Linkedin: Linkedin,
  github: Github,
  Github: Github,
  instagram: Instagram,
  Instagram: Instagram,
  facebook: Facebook,
  Facebook: Facebook,
  youtube: Youtube,
  Youtube: Youtube,
  twitter: Twitter,
  Twitter: Twitter,
  tiktok: Music,
  Music: Music,
  pinterest: Image,
  Image: Image,
  snapchat: Globe, // No ghost icon in lucide
  Ghost: Globe,
  threads: MessageCircle,
  whatsapp: MessageCircle,
  MessageCircle: MessageCircle,
  telegram: Send,
  Send: Send,
  reddit: Chrome,
  Chrome: Chrome,
  discord: MessageSquare,
  MessageSquare: MessageSquare,
  tumblr: Bookmark,
  Bookmark: Bookmark,
  twitch: Twitch,
  Twitch: Twitch,
  other: Globe,
  Globe: Globe,
};

export const getPlatformIcon = (platform: string | null | undefined): LucideIcon => {
  if (!platform) return Globe;
  return PLATFORM_ICONS[platform.toLowerCase()] || PLATFORM_ICONS[platform] || Globe;
};

// Platform colors
export const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "#0A66C2",
  github: "#181717",
  instagram: "#E4405F",
  facebook: "#1877F2",
  youtube: "#FF0000",
  twitter: "#1DA1F2",
  tiktok: "#000000",
  pinterest: "#E60023",
  snapchat: "#FFFC00",
  threads: "#000000",
  whatsapp: "#25D366",
  telegram: "#0088CC",
  reddit: "#FF4500",
  discord: "#5865F2",
  tumblr: "#35465C",
  twitch: "#9146FF",
  other: "#6B7280",
};

export const getPlatformColor = (platform: string): string => {
  return PLATFORM_COLORS[platform.toLowerCase()] || PLATFORM_COLORS.other;
};
