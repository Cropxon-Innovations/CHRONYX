import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Wallet } from "lucide-react";
import ResolutionsSection from "@/components/resolutions/ResolutionsSection";
import WalletRedemption from "@/components/resolutions/WalletRedemption";

const Resolutions = () => {
  const [activeTab, setActiveTab] = useState<"resolutions" | "wallet">("resolutions");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Resolutions & Rewards</h1>
          <p className="text-muted-foreground mt-1">Track your yearly goals and earn rewards</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "resolutions" | "wallet")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="resolutions" className="gap-2">
            <Target className="w-4 h-4" />
            Resolutions
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="w-4 h-4" />
            Wallet & Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resolutions" className="mt-6">
          <ResolutionsSection />
        </TabsContent>

        <TabsContent value="wallet" className="mt-6">
          <WalletRedemption />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Resolutions;
