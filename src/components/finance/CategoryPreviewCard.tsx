import { useState } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShoppingCart,
  Utensils,
  Car,
  Tv,
  Zap,
  Heart,
  GraduationCap,
  Plane,
  Music,
  MoreHorizontal,
  CreditCard,
  Wallet,
  Building2,
  Banknote,
} from "lucide-react";

const CATEGORIES = [
  { value: "Shopping", icon: ShoppingCart, color: "text-blue-500" },
  { value: "Food", icon: Utensils, color: "text-orange-500" },
  { value: "Transport", icon: Car, color: "text-purple-500" },
  { value: "Entertainment", icon: Tv, color: "text-pink-500" },
  { value: "Utilities", icon: Zap, color: "text-yellow-500" },
  { value: "Healthcare", icon: Heart, color: "text-red-500" },
  { value: "Education", icon: GraduationCap, color: "text-indigo-500" },
  { value: "Travel", icon: Plane, color: "text-cyan-500" },
  { value: "Subscriptions", icon: Music, color: "text-green-500" },
  { value: "Others", icon: MoreHorizontal, color: "text-muted-foreground" },
];

const PAYMENT_MODES = [
  { value: "UPI", icon: Wallet },
  { value: "Card", icon: CreditCard },
  { value: "Bank Transfer", icon: Building2 },
  { value: "Cash", icon: Banknote },
  { value: "Other", icon: MoreHorizontal },
];

interface CategoryPreviewCardProps {
  id: string;
  merchantName: string;
  amount: number;
  date: string;
  category: string;
  paymentMode: string;
  confidenceScore: number;
  onCategoryChange: (id: string, category: string) => void;
  onPaymentModeChange: (id: string, paymentMode: string) => void;
}

const CategoryPreviewCard = ({
  id,
  merchantName,
  amount,
  date,
  category,
  paymentMode,
  confidenceScore,
  onCategoryChange,
  onPaymentModeChange,
}: CategoryPreviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryConfig = CATEGORIES.find((c) => c.value === category) || CATEGORIES[9];
  const CategoryIcon = categoryConfig.icon;

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-emerald-500";
    if (score >= 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border transition-all ${
        confidenceScore < 0.5
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div
          className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0`}
        >
          <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {merchantName}
            </p>
            <p className="text-sm font-semibold shrink-0">
              ₹{amount.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{date}</span>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {paymentMode}
            </Badge>
          </div>

          {/* Confidence Score */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                Confidence: {getConfidenceLabel(confidenceScore)}
              </span>
              <span className="text-muted-foreground">
                {Math.round(confidenceScore * 100)}%
              </span>
            </div>
            <Progress
              value={confidenceScore * 100}
              className="h-1"
              indicatorClassName={getConfidenceColor(confidenceScore)}
            />
          </div>

          {/* Expandable Edit Section */}
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Category</label>
                  <Select
                    value={category}
                    onValueChange={(value) => onCategoryChange(id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-xs">
                          <div className="flex items-center gap-2">
                            <cat.icon className={`w-3.5 h-3.5 ${cat.color}`} />
                            {cat.value}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Payment Mode</label>
                  <Select
                    value={paymentMode}
                    onValueChange={(value) => onPaymentModeChange(id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value} className="text-xs">
                          <div className="flex items-center gap-2">
                            <mode.icon className="w-3.5 h-3.5" />
                            {mode.value}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-[10px] text-primary hover:underline"
          >
            {isExpanded ? "Hide options" : "Edit category & mode"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryPreviewCard;
