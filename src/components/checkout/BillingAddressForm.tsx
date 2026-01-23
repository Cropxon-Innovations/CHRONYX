import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin } from "lucide-react";

export interface BillingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry"
];

interface BillingAddressFormProps {
  onSubmit: (address: BillingAddress) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const BillingAddressForm = ({ onSubmit, onCancel, isLoading }: BillingAddressFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BillingAddress>({
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    gstin: "",
  });
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Load saved billing address if exists
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("billing_addresses")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle();

        if (data) {
          setFormData({
            full_name: data.full_name,
            address_line1: data.address_line1,
            address_line2: data.address_line2 || "",
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            country: data.country || "India",
            gstin: data.gstin || "",
          });
        } else if (user?.email) {
          // Pre-fill with email username as fallback
          setFormData(prev => ({
            ...prev,
            full_name: user.email?.split("@")[0] || "",
          }));
        }
      } catch (err) {
        console.error("Error loading saved address:", err);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedAddress();
  }, [user]);

  const handleChange = (field: keyof BillingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = formData.full_name && formData.address_line1 && 
                  formData.city && formData.state && formData.pincode;

  if (loadingSaved) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <MapPin className="w-4 h-4" />
        <span>Billing Address for Invoice</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full_name" className="text-xs font-medium">
          Full Name / Company Name *
        </Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
          placeholder="John Doe or ACME Corp Pvt Ltd"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address_line1" className="text-xs font-medium">
          Address Line 1 *
        </Label>
        <Input
          id="address_line1"
          value={formData.address_line1}
          onChange={(e) => handleChange("address_line1", e.target.value)}
          placeholder="123, Main Street, Building Name"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address_line2" className="text-xs font-medium">
          Address Line 2
        </Label>
        <Input
          id="address_line2"
          value={formData.address_line2}
          onChange={(e) => handleChange("address_line2", e.target.value)}
          placeholder="Apartment, Suite, Floor (optional)"
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-medium">
            City *
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Mumbai"
            required
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pincode" className="text-xs font-medium">
            PIN Code *
          </Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="400001"
            required
            maxLength={6}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="state" className="text-xs font-medium">
          State *
        </Label>
        <Select value={formData.state} onValueChange={(val) => handleChange("state", val)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_STATES.map((state) => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gstin" className="text-xs font-medium">
          GSTIN (Optional - for GST Invoice)
        </Label>
        <Input
          id="gstin"
          value={formData.gstin}
          onChange={(e) => handleChange("gstin", e.target.value.toUpperCase().slice(0, 15))}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          className="h-11 font-mono"
        />
        <p className="text-[10px] text-muted-foreground">
          Provide GSTIN for claiming input tax credit on business expenses
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || isLoading} className="flex-1">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue to Payment"}
        </Button>
      </div>
    </form>
  );
};
