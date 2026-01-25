import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

export const OPSCPYQModule: React.FC = () => (
  <Card className="border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5" />
        Previous Year Questions
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">PYQ module - Coming soon</p>
    </CardContent>
  </Card>
);
