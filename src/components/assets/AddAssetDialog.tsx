import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: Record<string, { name: string; icon: React.ReactNode; color: string }>;
  subcategories: Record<string, string[]>;
  defaultCategory?: string;
}

export const AddAssetDialog: React.FC<AddAssetDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  categories,
  subcategories,
  defaultCategory,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    category_code: defaultCategory || "",
    subcategory: "",
    asset_name: "",
    description: "",
    purchase_value: "",
    current_value: "",
    purchase_date: "",
    bank_name: "",
    account_number_mask: "",
    interest_rate: "",
    maturity_date: "",
    address: "",
    ownership_percent: "100",
    rental_income: "",
    symbol: "",
    quantity: "",
    broker_platform: "",
    policy_number: "",
    sum_assured: "",
    premium_amount: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset subcategory when category changes
    if (field === 'category_code') {
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.category_code || !formData.subcategory || !formData.asset_name) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("user_assets").insert({
        user_id: user.id,
        category_code: formData.category_code,
        subcategory: formData.subcategory,
        asset_name: formData.asset_name,
        description: formData.description || null,
        purchase_value: parseFloat(formData.purchase_value) || 0,
        current_value: parseFloat(formData.current_value) || parseFloat(formData.purchase_value) || 0,
        purchase_date: formData.purchase_date || null,
        bank_name: formData.bank_name || null,
        account_number_mask: formData.account_number_mask || null,
        interest_rate: parseFloat(formData.interest_rate) || null,
        maturity_date: formData.maturity_date || null,
        address: formData.address || null,
        ownership_percent: parseFloat(formData.ownership_percent) || 100,
        rental_income: parseFloat(formData.rental_income) || 0,
        symbol: formData.symbol || null,
        quantity: parseFloat(formData.quantity) || null,
        broker_platform: formData.broker_platform || null,
        policy_number: formData.policy_number || null,
        sum_assured: parseFloat(formData.sum_assured) || null,
        premium_amount: parseFloat(formData.premium_amount) || null,
      });

      if (error) throw error;

      toast({ title: "Asset added successfully!" });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        category_code: "",
        subcategory: "",
        asset_name: "",
        description: "",
        purchase_value: "",
        current_value: "",
        purchase_date: "",
        bank_name: "",
        account_number_mask: "",
        interest_rate: "",
        maturity_date: "",
        address: "",
        ownership_percent: "100",
        rental_income: "",
        symbol: "",
        quantity: "",
        broker_platform: "",
        policy_number: "",
        sum_assured: "",
        premium_amount: "",
      });
    } catch (error: any) {
      console.error("Error adding asset:", error);
      toast({ title: "Failed to add asset", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryFields = () => {
    switch (formData.category_code) {
      case 'CASH_BANK':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => handleChange("bank_name", e.target.value)}
                  placeholder="e.g., HDFC Bank"
                />
              </div>
              <div className="space-y-2">
                <Label>Account (Last 4 digits)</Label>
                <Input
                  value={formData.account_number_mask}
                  onChange={(e) => handleChange("account_number_mask", e.target.value)}
                  placeholder="XXXX"
                  maxLength={4}
                />
              </div>
            </div>
            {(formData.subcategory === 'Fixed Deposit' || formData.subcategory === 'Recurring Deposit') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => handleChange("interest_rate", e.target.value)}
                    placeholder="7.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maturity Date</Label>
                  <Input
                    type="date"
                    value={formData.maturity_date}
                    onChange={(e) => handleChange("maturity_date", e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        );

      case 'INVESTMENTS':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Symbol / ISIN</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => handleChange("symbol", e.target.value)}
                placeholder="e.g., RELIANCE or ISIN"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Broker / Platform</Label>
              <Input
                value={formData.broker_platform}
                onChange={(e) => handleChange("broker_platform", e.target.value)}
                placeholder="e.g., Zerodha, Groww"
              />
            </div>
          </div>
        );

      case 'PROPERTY_REAL':
        return (
          <>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Property address"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ownership %</Label>
                <Input
                  type="number"
                  value={formData.ownership_percent}
                  onChange={(e) => handleChange("ownership_percent", e.target.value)}
                  placeholder="100"
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Rental Income</Label>
                <Input
                  type="number"
                  value={formData.rental_income}
                  onChange={(e) => handleChange("rental_income", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </>
        );

      case 'INSURANCE_ASSET':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Policy Number</Label>
              <Input
                value={formData.policy_number}
                onChange={(e) => handleChange("policy_number", e.target.value)}
                placeholder="Policy number"
              />
            </div>
            <div className="space-y-2">
              <Label>Sum Assured</Label>
              <Input
                type="number"
                value={formData.sum_assured}
                onChange={(e) => handleChange("sum_assured", e.target.value)}
                placeholder="1000000"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Annual Premium</Label>
              <Input
                type="number"
                value={formData.premium_amount}
                onChange={(e) => handleChange("premium_amount", e.target.value)}
                placeholder="50000"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Asset Category *</Label>
            <Select
              value={formData.category_code}
              onValueChange={(v) => handleChange("category_code", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categories).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          {formData.category_code && (
            <div className="space-y-2">
              <Label>Subcategory *</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(v) => handleChange("subcategory", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {(subcategories[formData.category_code] || []).map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Asset Name */}
          <div className="space-y-2">
            <Label>Asset Name *</Label>
            <Input
              value={formData.asset_name}
              onChange={(e) => handleChange("asset_name", e.target.value)}
              placeholder="e.g., HDFC Savings Account"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Optional notes about this asset"
              rows={2}
            />
          </div>

          {/* Value Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Purchase Value (₹)</Label>
              <Input
                type="number"
                value={formData.purchase_value}
                onChange={(e) => handleChange("purchase_value", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Value (₹) *</Label>
              <Input
                type="number"
                value={formData.current_value}
                onChange={(e) => handleChange("current_value", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => handleChange("purchase_date", e.target.value)}
            />
          </div>

          {/* Category-specific fields */}
          {renderCategoryFields()}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetDialog;
