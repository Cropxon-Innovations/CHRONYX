import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Edit, Check } from "lucide-react";
import { usePricingConfig, useUpdatePricing } from "@/hooks/useAdmin";
import { Json } from "@/integrations/supabase/types";

const AdminPricing = () => {
  const { data: pricing, isLoading } = usePricingConfig();
  const updatePricing = useUpdatePricing();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    plan_name: "",
    display_name: "",
    description: "",
    monthly_price: 0,
    annual_price: 0,
    features: "",
  });

  const openNewPlanDialog = () => {
    setFormData({
      id: "",
      plan_name: "",
      display_name: "",
      description: "",
      monthly_price: 0,
      annual_price: 0,
      features: "",
    });
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan: NonNullable<typeof pricing>[0]) => {
    setFormData({
      id: plan.id,
      plan_name: plan.plan_name,
      display_name: plan.display_name,
      description: plan.description || "",
      monthly_price: Number(plan.monthly_price),
      annual_price: Number(plan.annual_price) || 0,
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
    });
    setEditingPlan(plan.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.plan_name.trim() || !formData.display_name.trim()) return;
    
    const featuresArray = formData.features.split("\n").filter(f => f.trim());
    
    updatePricing.mutate({
      id: formData.id || undefined,
      plan_name: formData.plan_name,
      display_name: formData.display_name,
      description: formData.description,
      monthly_price: formData.monthly_price,
      annual_price: formData.annual_price || undefined,
      features: featuresArray as Json,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setEditingPlan(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pricing Configuration
              </CardTitle>
              <CardDescription>
                Manage subscription plans and pricing
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewPlanDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan Name (slug)</Label>
                      <Input
                        value={formData.plan_name}
                        onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                        placeholder="pro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Name</Label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="Pro Plan"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Plan description"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Price (₹)</Label>
                      <Input
                        type="number"
                        value={formData.monthly_price}
                        onChange={(e) => setFormData({ ...formData, monthly_price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Price (₹)</Label>
                      <Input
                        type="number"
                        value={formData.annual_price}
                        onChange={(e) => setFormData({ ...formData, annual_price: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                      rows={5}
                    />
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={updatePricing.isPending || !formData.plan_name.trim() || !formData.display_name.trim()}
                    className="w-full"
                  >
                    {updatePricing.isPending ? "Saving..." : (editingPlan ? "Update Plan" : "Create Plan")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pricing && pricing.length > 0 ? (
              pricing.map((plan) => (
                <Card key={plan.id} className="border-border/50 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-2">{plan.plan_name}</Badge>
                      <h3 className="text-xl font-bold">{plan.display_name}</h3>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <p className="text-3xl font-bold">
                        ₹{Number(plan.monthly_price).toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      {plan.annual_price && (
                        <p className="text-sm text-muted-foreground">
                          ₹{Number(plan.annual_price).toLocaleString()}/year
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>{String(feature)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pricing plans configured</p>
                <p className="text-sm">Create your first pricing plan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPricing;
