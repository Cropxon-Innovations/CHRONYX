import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

export const OPSCStudyTimetable: React.FC = () => (
  <Card className="border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Study Timetable
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Timetable module - Coming soon</p>
    </CardContent>
  </Card>
);
