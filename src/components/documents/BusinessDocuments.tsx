import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building2, 
  Plus, 
  FileText, 
  Upload,
  Trash2,
  Edit2,
  ExternalLink,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Link2,
  Share2,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Briefcase,
  FileCheck,
  Scale,
  Receipt,
  ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BusinessProfile {
  id: string;
  business_name: string;
  legal_name: string | null;
  business_type: string;
  registration_number: string | null;
  gstin: string | null;
  pan: string | null;
  cin: string | null;
  incorporation_date: string | null;
  registered_address: string | null;
  business_address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
  employee_count: number | null;
  huminex_workspace_id: string | null;
  status: string;
  created_at: string;
}

interface BusinessDocument {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  document_type: string;
  file_url: string | null;
  file_name: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  is_verified: boolean;
  created_at: string;
}

interface BusinessLink {
  id: string;
  business_id: string;
  platform: string;
  url: string;
  label: string | null;
}

const BUSINESS_TYPES: Record<string, string> = {
  sole_proprietorship: "Sole Proprietorship",
  partnership: "Partnership Firm",
  llp: "Limited Liability Partnership",
  private_limited: "Private Limited Company",
  public_limited: "Public Limited Company",
  opc: "One Person Company",
  ngo: "NGO/Section 8",
  trust: "Trust",
  other: "Other",
};

const DOCUMENT_TYPES: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  incorporation: { icon: FileCheck, color: "text-blue-500", label: "Incorporation" },
  registration: { icon: ShieldCheck, color: "text-emerald-500", label: "Registration" },
  tax: { icon: Receipt, color: "text-amber-500", label: "Tax" },
  license: { icon: Scale, color: "text-purple-500", label: "License" },
  agreement: { icon: FileText, color: "text-indigo-500", label: "Agreement" },
  compliance: { icon: CheckCircle2, color: "text-green-500", label: "Compliance" },
  financial: { icon: Briefcase, color: "text-rose-500", label: "Financial" },
  hr: { icon: Users, color: "text-cyan-500", label: "HR" },
  legal: { icon: Scale, color: "text-orange-500", label: "Legal" },
  other: { icon: FileText, color: "text-gray-500", label: "Other" },
};

export const BusinessDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [showAddBusinessDialog, setShowAddBusinessDialog] = useState(false);
  const [showAddDocDialog, setShowAddDocDialog] = useState(false);
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessProfile | null>(null);
  
  // Business form state
  const [businessName, setBusinessName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [businessType, setBusinessType] = useState("private_limited");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [cin, setCin] = useState("");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [huminexWorkspaceId, setHuminexWorkspaceId] = useState("");

  // Document form state
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docType, setDocType] = useState("incorporation");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Link form state
  const [linkPlatform, setLinkPlatform] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["business-profiles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BusinessProfile[];
    },
    enabled: !!user?.id,
  });

  const activeBusiness = selectedBusiness 
    ? businesses.find(b => b.id === selectedBusiness) 
    : businesses[0];

  const { data: documents = [] } = useQuery({
    queryKey: ["business-documents", activeBusiness?.id],
    queryFn: async () => {
      if (!activeBusiness) return [];
      const { data, error } = await supabase
        .from("business_documents")
        .select("*")
        .eq("business_id", activeBusiness.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BusinessDocument[];
    },
    enabled: !!activeBusiness?.id,
  });

  const { data: links = [] } = useQuery({
    queryKey: ["business-links", activeBusiness?.id],
    queryFn: async () => {
      if (!activeBusiness) return [];
      const { data, error } = await supabase
        .from("business_links")
        .select("*")
        .eq("business_id", activeBusiness.id);
      
      if (error) throw error;
      return data as BusinessLink[];
    },
    enabled: !!activeBusiness?.id,
  });

  const createBusinessMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .insert({
          user_id: user?.id,
          business_name: businessName,
          legal_name: legalName || null,
          business_type: businessType,
          registration_number: registrationNumber || null,
          gstin: gstin || null,
          pan: pan || null,
          cin: cin || null,
          incorporation_date: incorporationDate || null,
          business_address: businessAddress || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          industry: industry || null,
          description: description || null,
          employee_count: employeeCount ? parseInt(employeeCount) : null,
          huminex_workspace_id: huminexWorkspaceId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add HUMINEX link if workspace ID provided
      if (huminexWorkspaceId) {
        await supabase.from("business_links").insert({
          business_id: data.id,
          platform: "HUMINEX",
          url: `https://www.gethuminex.com/workspace/${huminexWorkspaceId}`,
          label: "Workforce Management",
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["business-links"] });
      toast.success("Business profile created!");
      resetBusinessForm();
      setShowAddBusinessDialog(false);
    },
    onError: (error) => {
      toast.error("Failed to create business");
      console.error(error);
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (fileUrl?: string) => {
      if (!activeBusiness) throw new Error("No business selected");
      
      const { error } = await supabase
        .from("business_documents")
        .insert({
          business_id: activeBusiness.id,
          user_id: user?.id,
          title: docTitle,
          description: docDescription || null,
          document_type: docType,
          file_url: fileUrl || null,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
          issuing_authority: issuingAuthority || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-documents"] });
      toast.success("Document added!");
      resetDocForm();
      setShowAddDocDialog(false);
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      if (!activeBusiness) throw new Error("No business selected");
      
      const { error } = await supabase
        .from("business_links")
        .insert({
          business_id: activeBusiness.id,
          platform: linkPlatform,
          url: linkUrl,
          label: linkLabel || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-links"] });
      toast.success("Link added!");
      resetLinkForm();
      setShowAddLinkDialog(false);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("business_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-documents"] });
      toast.success("Document deleted");
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("business_links")
        .delete()
        .eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-links"] });
      toast.success("Link removed");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBusiness) return;

    setUploadingDoc(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/${activeBusiness.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      await createDocumentMutation.mutateAsync(publicUrl);
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploadingDoc(false);
    }
  };

  const shareDocument = async (doc: BusinessDocument, method: "whatsapp" | "email" | "copy") => {
    const shareText = `${doc.title} - ${activeBusiness?.business_name}`;
    const shareUrl = doc.file_url || "";

    if (method === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`);
    } else if (method === "email") {
      window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`);
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    }
  };

  const resetBusinessForm = () => {
    setBusinessName("");
    setLegalName("");
    setBusinessType("private_limited");
    setRegistrationNumber("");
    setGstin("");
    setPan("");
    setCin("");
    setIncorporationDate("");
    setBusinessAddress("");
    setCity("");
    setState("");
    setPincode("");
    setEmail("");
    setPhone("");
    setWebsite("");
    setIndustry("");
    setDescription("");
    setEmployeeCount("");
    setHuminexWorkspaceId("");
  };

  const resetDocForm = () => {
    setDocTitle("");
    setDocDescription("");
    setDocType("incorporation");
    setIssueDate("");
    setExpiryDate("");
    setIssuingAuthority("");
  };

  const resetLinkForm = () => {
    setLinkPlatform("");
    setLinkUrl("");
    setLinkLabel("");
  };

  // Check for expiring documents
  const expiringDocs = documents.filter(doc => {
    if (!doc.expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Selector and Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {businesses.length > 0 ? (
            <Select value={selectedBusiness || businesses[0]?.id} onValueChange={setSelectedBusiness}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {b.business_name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-muted-foreground">No businesses added yet</p>
          )}
        </div>

        <Dialog open={showAddBusinessDialog} onOpenChange={setShowAddBusinessDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Business Profile</DialogTitle>
              <DialogDescription>
                Create a comprehensive profile for your business
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Company" />
              </div>
              <div className="space-y-2">
                <Label>Legal Name</Label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Full registered name" />
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Incorporation Date</Label>
                <Input type="date" value={incorporationDate} onChange={(e) => setIncorporationDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CIN</Label>
                <Input value={cin} onChange={(e) => setCin(e.target.value)} placeholder="Company Identification Number" />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GST Registration Number" />
              </div>
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input value={pan} onChange={(e) => setPan(e.target.value)} placeholder="Permanent Account Number" />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Business Address</Label>
                <Textarea value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Technology, Healthcare" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label>Employee Count</Label>
                <Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="flex items-center gap-2">
                  HUMINEX Workspace ID
                  <a href="https://www.gethuminex.com/" target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">
                    (Get HUMINEX for Workforce Management)
                  </a>
                </Label>
                <Input value={huminexWorkspaceId} onChange={(e) => setHuminexWorkspaceId(e.target.value)} placeholder="Your HUMINEX workspace ID" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBusinessDialog(false)}>Cancel</Button>
              <Button onClick={() => createBusinessMutation.mutate()} disabled={!businessName || createBusinessMutation.isPending}>
                {createBusinessMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Business
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeBusiness && (
        <>
          {/* Business Overview Card */}
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-20 h-20 border-2 border-primary/20">
                  <AvatarImage src={activeBusiness.logo_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {activeBusiness.business_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-light">{activeBusiness.business_name}</h2>
                    <Badge variant="secondary">{BUSINESS_TYPES[activeBusiness.business_type]}</Badge>
                    {activeBusiness.status === "active" && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-0">Active</Badge>
                    )}
                  </div>
                  {activeBusiness.legal_name && (
                    <p className="text-sm text-muted-foreground mb-2">{activeBusiness.legal_name}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {activeBusiness.incorporation_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Est. {format(new Date(activeBusiness.incorporation_date), "MMM yyyy")}</span>
                      </div>
                    )}
                    {activeBusiness.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{activeBusiness.city}, {activeBusiness.state}</span>
                      </div>
                    )}
                    {activeBusiness.employee_count && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{activeBusiness.employee_count} employees</span>
                      </div>
                    )}
                    {activeBusiness.gstin && (
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                        <span>GSTIN: {activeBusiness.gstin}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/50">
                {activeBusiness.website && (
                  <a href={activeBusiness.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </Button>
                  </a>
                )}
                {activeBusiness.email && (
                  <a href={`mailto:${activeBusiness.email}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </a>
                )}
                {activeBusiness.huminex_workspace_id && (
                  <a href={`https://www.gethuminex.com/workspace/${activeBusiness.huminex_workspace_id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                      <Users className="w-4 h-4 text-purple-500" />
                      HUMINEX
                    </Button>
                  </a>
                )}
                {links.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      {link.label || link.platform}
                    </Button>
                  </a>
                ))}
                <Dialog open={showAddLinkDialog} onOpenChange={setShowAddLinkDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Link2 className="w-4 h-4" />
                      Add Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Add External Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Platform Name</Label>
                        <Input value={linkPlatform} onChange={(e) => setLinkPlatform(e.target.value)} placeholder="e.g., LinkedIn, GitHub" />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
                      </div>
                      <div className="space-y-2">
                        <Label>Label (optional)</Label>
                        <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddLinkDialog(false)}>Cancel</Button>
                      <Button onClick={() => createLinkMutation.mutate()} disabled={!linkPlatform || !linkUrl}>
                        Add Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Documents Alert */}
          {expiringDocs.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-600">Documents Expiring Soon</p>
                  <p className="text-sm text-muted-foreground">
                    {expiringDocs.map(d => d.title).join(", ")} will expire within 30 days
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Business Documents
                </CardTitle>
                <CardDescription>Store and manage all your business documents</CardDescription>
              </div>
              <Dialog open={showAddDocDialog} onOpenChange={setShowAddDocDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Business Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Document Title *</Label>
                      <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g., Certificate of Incorporation" />
                    </div>
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <config.icon className={cn("w-4 h-4", config.color)} />
                                {config.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Issuing Authority</Label>
                      <Input value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={docDescription} onChange={(e) => setDocDescription(e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Document (optional)</Label>
                      <Input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={uploadingDoc} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDocDialog(false)}>Cancel</Button>
                    <Button onClick={() => createDocumentMutation.mutate(undefined)} disabled={!docTitle || createDocumentMutation.isPending}>
                      {(createDocumentMutation.isPending || uploadingDoc) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Add Document
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents added yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {documents.map((doc, index) => {
                      const config = DOCUMENT_TYPES[doc.document_type] || DOCUMENT_TYPES.other;
                      const Icon = config.icon;
                      const isExpiring = doc.expiry_date && 
                        Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;

                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-4 rounded-xl border transition-all hover:shadow-md",
                            isExpiring ? "border-amber-500/30 bg-amber-500/5" : "border-border/50 bg-muted/20"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              "bg-muted"
                            )}>
                              <Icon className={cn("w-5 h-5", config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">{doc.title}</h4>
                              <Badge variant="secondary" className="text-[10px] mt-1">
                                {config.label}
                              </Badge>
                              {doc.expiry_date && (
                                <p className={cn(
                                  "text-xs mt-2 flex items-center gap-1",
                                  isExpiring ? "text-amber-600" : "text-muted-foreground"
                                )}>
                                  <Clock className="w-3 h-3" />
                                  Expires {format(new Date(doc.expiry_date), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/50">
                            {doc.file_url && (
                              <>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="w-4 h-4" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => shareDocument(doc, "copy")}>
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocumentMutation.mutate(doc.id)}
                              className="text-destructive hover:text-destructive ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BusinessDocuments;
