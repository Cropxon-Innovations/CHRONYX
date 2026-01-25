import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const OPSCNotesLibrary: React.FC = () => (
  <Card className="border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Notes Library
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Notes module - Coming soon</p>
    </CardContent>
  </Card>
);
