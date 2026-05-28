import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const TaskJoin = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Joining…");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?redirect=/app/tasks/join/${token}`);
      return;
    }
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("tm_redeem_share_link", { _token: token });
      const r = data as { ok: boolean; project_id?: string; error?: string } | null;
      if (error || !r?.ok) {
        setStatus("Invalid or expired link");
        toast.error(r?.error ?? error?.message ?? "Failed to join");
        return;
      }
      toast.success("Joined project");
      navigate(`/app/tasks/${r.project_id}`, { replace: true });
    })();
  }, [token, user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-8 text-center space-y-3">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
          <p className="text-sm">{status}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskJoin;
