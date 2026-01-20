import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  Check,
  ShieldCheck,
  ShieldAlert,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showGenerator?: boolean;
  showStrengthMeter?: boolean;
}

// Password strength calculation
const calculateStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: "Enter password", color: "bg-muted" };
  
  let score = 0;
  
  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Variety bonus
  if (password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  }
  
  // Normalize to 0-100
  const normalizedScore = Math.min(100, (score / 8) * 100);
  
  if (normalizedScore < 30) return { score: normalizedScore, label: "Weak", color: "bg-destructive" };
  if (normalizedScore < 50) return { score: normalizedScore, label: "Fair", color: "bg-orange-500" };
  if (normalizedScore < 75) return { score: normalizedScore, label: "Good", color: "bg-yellow-500" };
  return { score: normalizedScore, label: "Strong", color: "bg-emerald-500" };
};

// Generate secure password
const generatePassword = (length: number = 16): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure at least one of each type
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const PasswordField = ({
  value,
  onChange,
  label = "Password",
  placeholder = "Enter password",
  showGenerator = true,
  showStrengthMeter = true,
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const strength = calculateStrength(value);
  
  const handleCopy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Password copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [value]);
  
  const handleGenerate = useCallback(() => {
    const newPassword = generatePassword(16);
    onChange(newPassword);
    setShowPassword(true); // Show the generated password
    toast.success("Strong password generated!");
  }, [onChange]);
  
  const StrengthIcon = strength.score >= 75 ? ShieldCheck : strength.score >= 50 ? Shield : ShieldAlert;
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-28 font-mono"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {/* Generate button */}
          {showGenerator && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={handleGenerate}
              title="Generate strong password"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          
          {/* Copy button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={handleCopy}
            disabled={!value}
            title="Copy password"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
          
          {/* Show/Hide button */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Strength Meter */}
      {showStrengthMeter && value && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Progress 
              value={strength.score} 
              className={cn("h-1.5 flex-1", strength.color)}
            />
            <div className="flex items-center gap-1 text-xs">
              <StrengthIcon className={cn(
                "w-3.5 h-3.5",
                strength.score >= 75 ? "text-emerald-500" : 
                strength.score >= 50 ? "text-yellow-500" : "text-destructive"
              )} />
              <span className={cn(
                "font-medium",
                strength.score >= 75 ? "text-emerald-500" : 
                strength.score >= 50 ? "text-yellow-500" : "text-destructive"
              )}>
                {strength.label}
              </span>
            </div>
          </div>
          
          {/* Tips for weak passwords */}
          {strength.score < 50 && (
            <ul className="text-[10px] text-muted-foreground space-y-0.5">
              {value.length < 12 && <li>• Use at least 12 characters</li>}
              {!/[A-Z]/.test(value) && <li>• Add uppercase letters</li>}
              {!/[0-9]/.test(value) && <li>• Add numbers</li>}
              {!/[^a-zA-Z0-9]/.test(value) && <li>• Add special characters</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordField;
