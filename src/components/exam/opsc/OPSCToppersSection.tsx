import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export const OPSCToppersSection: React.FC = () => (
  <Card className="border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        Toppers & Cut-offs
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Toppers section - Coming soon</p>
    </CardContent>
  </Card>
);
