import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Sparkles } from "lucide-react";

export const NyayaBot: React.FC = () => (
  <Card className="border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Nyāya - AI Study Assistant
      </CardTitle>
      <p className="text-sm text-muted-foreground">The Guide of Truth</p>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">AI tutor module - Coming soon</p>
    </CardContent>
  </Card>
);
