import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, Calendar, Clock, Send, Loader2, CheckCircle2,
  CalendarDays, CalendarRange, CalendarClock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Subscription {
  id: string;
  report_type: string;
  delivery_method: string;
  is_enabled: boolean;
  last_sent_at: string | null;
  next_scheduled_at: string | null;
}

const REPORT_TYPES = [
  { 
    type: 'daily', 
    label: 'Daily Report', 
    description: 'Sent every morning at 7 AM',
    icon: Clock,
    color: 'bg-blue-500'
  },
  { 
    type: 'weekly', 
    label: 'Weekly Report', 
    description: 'Sent every Monday morning',
    icon: CalendarDays,
    color: 'bg-green-500'
  },
  { 
    type: 'monthly', 
    label: 'Monthly Report', 
    description: 'Sent on the 1st of each month',
    icon: Calendar,
    color: 'bg-purple-500'
  },
  { 
    type: 'quarterly', 
    label: 'Quarterly Report', 
    description: 'Sent at the start of each quarter',
    icon: CalendarRange,
    color: 'bg-orange-500'
  },
  { 
    type: 'annually', 
    label: 'Annual Report', 
    description: 'Sent on January 1st each year',
    icon: CalendarClock,
    color: 'bg-pink-500'
  },
];

export const ReportSubscriptions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("finance_report_subscriptions")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (reportType: string, currentlyEnabled: boolean) => {
    if (!user) return;
    setToggling(reportType);

    try {
      const existing = subscriptions.find(s => s.report_type === reportType);

      if (existing) {
        const { error } = await supabase
          .from("finance_report_subscriptions")
          .update({ is_enabled: !currentlyEnabled })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("finance_report_subscriptions")
          .insert({
            user_id: user.id,
            report_type: reportType,
            delivery_method: 'email',
            is_enabled: true,
          });

        if (error) throw error;
      }

      await fetchSubscriptions();
      toast({
        title: currentlyEnabled ? "Report disabled" : "Report enabled",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} reports have been ${currentlyEnabled ? 'disabled' : 'enabled'}.`,
      });
    } catch (error: any) {
      console.error("Error toggling subscription:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const sendTestReport = async (reportType: string) => {
    if (!user) return;
    setSending(reportType);

    try {
      const { data, error } = await supabase.functions.invoke('send-financial-report', {
        body: {
          action: 'send_report',
          userId: user.id,
          reportType,
        },
      });

      if (error) throw error;

      toast({
        title: "Report sent!",
        description: "Check your email for the financial report.",
      });
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast({ title: "Failed to send report", description: error.message, variant: "destructive" });
    } finally {
      setSending(null);
    }
  };

  const isEnabled = (reportType: string): boolean => {
    const sub = subscriptions.find(s => s.report_type === reportType);
    return sub?.is_enabled || false;
  };

  const getLastSent = (reportType: string): string | null => {
    const sub = subscriptions.find(s => s.report_type === reportType);
    return sub?.last_sent_at || null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Report Subscriptions
        </CardTitle>
        <CardDescription>
          Receive automated financial summaries directly in your inbox
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {REPORT_TYPES.map((report, index) => {
          const Icon = report.icon;
          const enabled = isEnabled(report.type);
          const lastSent = getLastSent(report.type);
          const isToggling = toggling === report.type;
          const isSending = sending === report.type;

          return (
            <React.Fragment key={report.type}>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${report.color} text-white flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{report.label}</p>
                      {enabled && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    {lastSent && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last sent: {formatDistanceToNow(new Date(lastSent), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTestReport(report.type)}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleSubscription(report.type, enabled)}
                      disabled={isToggling}
                    />
                    {isToggling && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              </div>
              {index < REPORT_TYPES.length - 1 && <Separator />}
            </React.Fragment>
          );
        })}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Reports are sent to your registered email address. Enable the reports you want to receive and we'll automatically send them on schedule.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportSubscriptions;
