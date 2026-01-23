import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, 
  Briefcase, 
  FolderOpen,
  Building2
} from "lucide-react";
import EnhancedDocuments from "@/components/documents/EnhancedDocuments";
import EnhancedEducationRecords from "@/components/documents/EnhancedEducationRecords";
import EnhancedWorkHistory from "@/components/documents/EnhancedWorkHistory";
import { BusinessDocuments } from "@/components/documents/BusinessDocuments";

const Documents = () => {
  const [activeTab, setActiveTab] = useState("documents");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-2">
            Personal Documents & Career Vault
          </h1>
          <p className="text-muted-foreground text-sm">
            Your private archive for identity, education, career records, and business documents
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 gap-2 h-auto p-1.5 bg-muted/50 rounded-2xl">
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-2 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger 
              value="education"
              className="flex items-center gap-2 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
            <TabsTrigger 
              value="work"
              className="flex items-center gap-2 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Work</span>
            </TabsTrigger>
            <TabsTrigger 
              value="business"
              className="flex items-center gap-2 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6">
            <EnhancedDocuments />
          </TabsContent>

          <TabsContent value="education" className="mt-6">
            <EnhancedEducationRecords />
          </TabsContent>

          <TabsContent value="work" className="mt-6">
            <EnhancedWorkHistory />
          </TabsContent>

          <TabsContent value="business" className="mt-6">
            <BusinessDocuments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Documents;
