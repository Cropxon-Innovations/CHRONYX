import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PasswordField } from "@/components/vault/PasswordField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { encryptFile, decryptFile, hashPassword } from "@/utils/crypto";
import {
  Plus,
  Search,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit2,
  Shield,
  Key,
  CreditCard,
  Globe,
  User,
  Mail,
  Smartphone,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast as sonnerToast } from "sonner";

interface VaultItem {
  id: string;
  name: string;
  category: string;
  encrypted_data: string;
  notes: string | null;
  website_url: string | null;
  icon: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DecryptedData {
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  cardNumber?: string;
  cvv?: string;
  expiry?: string;
  pin?: string;
  notes?: string;
}

const CATEGORIES = [
  { name: "Login", icon: Key },
  { name: "Card", icon: CreditCard },
  { name: "Identity", icon: User },
  { name: "Secure Note", icon: Shield },
  { name: "Other", icon: Lock },
];

const Vault = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Vault unlock state
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState("");
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  
  // OTP verification state
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpHash, setOtpHash] = useState("");
  const [otpExpiry, setOtpExpiry] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Item view/edit state
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Create/Edit form
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Login");
  const [formWebsite, setFormWebsite] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formData, setFormData] = useState<DecryptedData>({});
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) fetchItems();
  }, [user]);
  
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("vault_items")
      .select("*")
      .order("updated_at", { ascending: false });
    
    if (!error && data) {
      setItems(data as VaultItem[]);
    }
    setLoading(false);
  };
  
  const sendOtp = async () => {
    if (!user?.email) return;
    setOtpSending(true);
    
    try {
      const response = await supabase.functions.invoke("send-email-otp", {
        body: { email: user.email, userId: user.id, type: "email", purpose: "vault_access" },
      });
      
      if (response.error) throw response.error;
      
      if (response.data?.success) {
        setOtpHash(response.data.otpHash);
        setOtpExpiry(response.data.expiresAt);
        setResendCooldown(60);
        sonnerToast.success("OTP sent to your email!");
      } else {
        throw new Error(response.data?.error || "Failed to send OTP");
      }
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };
  
  const hashOtpWithUserId = async (otpValue: string): Promise<string> => {
    if (!user?.id) return "";
    const encoder = new TextEncoder();
    const data = encoder.encode(otpValue + user.id);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const verifyOtp = async () => {
    setOtpVerifying(true);
    
    try {
      const inputHash = await hashOtpWithUserId(otp);
      
      if (inputHash === otpHash) {
        setIsVaultLocked(false);
        setOtpDialogOpen(false);
        setOtp("");
        sonnerToast.success("Vault unlocked!");
        logActivity("Unlocked vault with email OTP", "Vault");
      } else {
        sonnerToast.error("Invalid OTP. Please try again.");
      }
    } catch (error) {
      sonnerToast.error("Verification failed");
    } finally {
      setOtpVerifying(false);
    }
  };
  
  const unlockVault = () => {
    setOtpDialogOpen(true);
    sendOtp();
  };
  
  const lockVault = () => {
    setIsVaultLocked(true);
    setMasterPassword("");
    setViewingItem(null);
    setDecryptedData(null);
    sonnerToast.info("Vault locked");
  };
  
  const encryptData = async (data: DecryptedData): Promise<string> => {
    const jsonStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(jsonStr);
    return btoa(String.fromCharCode(...encoded));
  };
  
  const decryptData = async (encrypted: string): Promise<DecryptedData> => {
    try {
      const decoded = atob(encrypted);
      const bytes = new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)));
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(bytes));
    } catch {
      return {};
    }
  };
  
  const createItem = async () => {
    if (!user || !formName.trim()) return;
    
    const encrypted = await encryptData(formData);
    
    const { data, error } = await supabase
      .from("vault_items")
      .insert({
        user_id: user.id,
        name: formName.trim(),
        category: formCategory,
        encrypted_data: encrypted,
        website_url: formWebsite || null,
        notes: formNotes || null,
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Error", description: "Failed to create vault item", variant: "destructive" });
    } else if (data) {
      setItems([data as VaultItem, ...items]);
      resetForm();
      setIsCreating(false);
      toast({ title: "Item saved securely" });
      logActivity(`Added vault item: ${formName.substring(0, 20)}`, "Vault");
    }
  };
  
  const updateItem = async () => {
    if (!editingItem || !formName.trim()) return;
    
    const encrypted = await encryptData(formData);
    
    const { error } = await supabase
      .from("vault_items")
      .update({
        name: formName.trim(),
        category: formCategory,
        encrypted_data: encrypted,
        website_url: formWebsite || null,
        notes: formNotes || null,
      })
      .eq("id", editingItem.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    } else {
      setItems(items.map(i => i.id === editingItem.id ? {
        ...i,
        name: formName.trim(),
        category: formCategory,
        encrypted_data: encrypted,
        website_url: formWebsite || null,
        notes: formNotes || null,
        updated_at: new Date().toISOString(),
      } : i));
      resetForm();
      setEditingItem(null);
      toast({ title: "Item updated" });
    }
  };
  
  const viewItem = async (item: VaultItem) => {
    if (isVaultLocked) {
      unlockVault();
      return;
    }
    
    const data = await decryptData(item.encrypted_data);
    setDecryptedData(data);
    setViewingItem(item);
    
    // Update last accessed
    await supabase
      .from("vault_items")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", item.id);
  };
  
  const deleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    const { error } = await supabase.from("vault_items").delete().eq("id", id);
    
    if (!error) {
      setItems(items.filter(i => i.id !== id));
      setDeleteConfirmId(null);
      toast({ title: "Item deleted" });
      if (item) logActivity(`Deleted vault item: ${item.name.substring(0, 20)}`, "Vault");
    }
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    sonnerToast.success(`${label} copied to clipboard`);
  };
  
  const resetForm = () => {
    setFormName("");
    setFormCategory("Login");
    setFormWebsite("");
    setFormNotes("");
    setFormData({});
  };
  
  const openEdit = async (item: VaultItem) => {
    if (isVaultLocked) {
      unlockVault();
      return;
    }
    
    const data = await decryptData(item.encrypted_data);
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormWebsite(item.website_url || "");
    setFormNotes(item.notes || "");
    setFormData(data);
  };
  
  const filteredItems = items.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading vault...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Secure Vault
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store passwords, cards, and sensitive information securely
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isVaultLocked ? (
            <Button onClick={unlockVault} variant="outline">
              <Unlock className="w-4 h-4 mr-2" />
              Unlock Vault
            </Button>
          ) : (
            <Button onClick={lockVault} variant="outline">
              <Lock className="w-4 h-4 mr-2" />
              Lock Vault
            </Button>
          )}
          <Button onClick={() => setIsCreating(true)} disabled={isVaultLocked}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </header>
      
      {/* Vault Status */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border",
        isVaultLocked 
          ? "bg-amber-500/10 border-amber-500/20" 
          : "bg-emerald-500/10 border-emerald-500/20"
      )}>
        {isVaultLocked ? (
          <>
            <Lock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-foreground">Vault is Locked</p>
              <p className="text-sm text-muted-foreground">Unlock with email OTP to view or add items</p>
            </div>
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-medium text-foreground">Vault is Unlocked</p>
              <p className="text-sm text-muted-foreground">Your data is accessible. Lock when done.</p>
            </div>
          </>
        )}
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.name}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className="gap-1"
            >
              <cat.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{cat.name}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isVaultLocked ? "Unlock vault to see your items" : "No items yet. Add your first secure item!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const category = CATEGORIES.find(c => c.name === item.category);
            const CategoryIcon = category?.icon || Lock;
            
            return (
              <div
                key={item.id}
                className="group bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => viewItem(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); viewItem(item); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {item.website_url && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(item.website_url!, '_blank'); }}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Website
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {item.website_url && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    <span className="truncate">{new URL(item.website_url).hostname}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>Updated {format(new Date(item.updated_at), "MMM d")}</span>
                  {isVaultLocked && <Lock className="w-3 h-3" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Verify Your Identity
            </DialogTitle>
            <DialogDescription>
              Enter the OTP sent to {user?.email} to unlock your vault
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Enter OTP</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Didn't receive code?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={sendOtp}
                disabled={otpSending || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={verifyOtp} disabled={otp.length !== 6 || otpVerifying}>
              {otpVerifying ? "Verifying..." : "Verify & Unlock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Item Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingItem?.name}</DialogTitle>
          </DialogHeader>
          {decryptedData && (
            <div className="space-y-4 py-4">
              {decryptedData.username && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{decryptedData.username}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decryptedData.username!, "Username")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {decryptedData.email && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{decryptedData.email}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decryptedData.email!, "Email")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {decryptedData.password && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">
                      {showPassword ? decryptedData.password : "••••••••••••"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decryptedData.password!, "Password")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {decryptedData.cardNumber && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">
                      {showPassword ? decryptedData.cardNumber : "•••• •••• •••• " + decryptedData.cardNumber.slice(-4)}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(decryptedData.cardNumber!, "Card number")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {viewingItem?.website_url && (
                <Button variant="outline" className="w-full" onClick={() => window.open(viewingItem.website_url!, '_blank')}>
                  <Globe className="w-4 h-4 mr-2" />
                  Open Website
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Secure Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Gmail, Netflix, Bank Card"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      <span className="flex items-center gap-2">
                        <c.icon className="w-4 h-4" />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(formCategory === "Login" || formCategory === "Other") && (
              <>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={formData.username || ""}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <PasswordField
                  value={formData.password || ""}
                  onChange={(value) => setFormData({ ...formData, password: value })}
                  label="Password"
                  placeholder="Enter or generate password"
                  showGenerator={true}
                  showStrengthMeter={true}
                />
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}
            
            {formCategory === "Card" && (
              <>
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    value={formData.cardNumber || ""}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\D/g, "") })}
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input
                      value={formData.expiry || ""}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input
                      type="password"
                      value={formData.cvv || ""}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>PIN</Label>
                  <Input
                    type="password"
                    value={formData.pin || ""}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    maxLength={6}
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreating(false);
              setEditingItem(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingItem ? updateItem : createItem}>
              {editingItem ? "Save Changes" : "Save Securely"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && deleteItem(deleteConfirmId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vault;
