import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordField } from "@/components/vault/PasswordField";
import { toast } from "sonner";
import { format } from "date-fns";

// Quick Add Todo Dialog
interface QuickTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickTodoDialog = ({ open, onOpenChange }: QuickTodoDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("todos").insert({
      user_id: user.id,
      text: title.trim(),
      status: "pending",
      date: format(new Date(), "yyyy-MM-dd"),
    });

    setSaving(false);
    if (error) {
      toast.error("Failed to add task");
    } else {
      toast.success("Task added!");
      setTitle("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Task Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Adding..." : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Quick Add Expense Dialog
interface QuickExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

export const QuickExpenseDialog = ({ open, onOpenChange }: QuickExpenseDialogProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !amount) return;
    setSaving(true);

    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: parseFloat(amount),
      category,
      notes: notes || null,
      expense_date: format(new Date(), "yyyy-MM-dd"),
      payment_mode: "Cash",
    });

    setSaving(false);
    if (error) {
      toast.error("Failed to add expense");
    } else {
      toast.success("Expense added!");
      setAmount("");
      setCategory("Other");
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was this for?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!amount || saving}>
            {saving ? "Adding..." : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Quick Add Vault Item Dialog
interface QuickVaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickVaultDialog = ({ open, onOpenChange }: QuickVaultDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  const encryptData = async (data: object): Promise<string> => {
    const jsonStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(jsonStr);
    return btoa(String.fromCharCode(...encoded));
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);

    const encrypted = await encryptData({
      username: username || undefined,
      password: password || undefined,
    });

    const { error } = await supabase.from("vault_items").insert({
      user_id: user.id,
      name: name.trim(),
      category: "Login",
      encrypted_data: encrypted,
      website_url: website || null,
    });

    setSaving(false);
    if (error) {
      toast.error("Failed to save credential");
    } else {
      toast.success("Credential saved securely!");
      setName("");
      setUsername("");
      setPassword("");
      setWebsite("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Credential</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Gmail, Netflix"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Username / Email</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username@example.com"
            />
          </div>
          <PasswordField
            value={password}
            onChange={setPassword}
            label="Password"
            placeholder="Enter or generate password"
            showGenerator={true}
            showStrengthMeter={true}
          />
          <div className="space-y-2">
            <Label>Website (optional)</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save Securely"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
