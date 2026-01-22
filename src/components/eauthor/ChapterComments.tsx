import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { MessageSquare, Send, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  is_resolved: boolean;
  created_at: string;
}

interface ChapterCommentsProps {
  chapterId: string | undefined;
}

const ChapterComments = ({ chapterId }: ChapterCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (chapterId) {
      fetchComments();
    }
  }, [chapterId]);

  const fetchComments = async () => {
    if (!chapterId) return;
    
    const { data, error } = await supabase
      .from("book_comments")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  };

  const addComment = async () => {
    if (!newComment.trim() || !chapterId || !user) return;

    const { data, error } = await supabase
      .from("book_comments")
      .insert({
        chapter_id: chapterId,
        user_id: user.id,
        content: newComment.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setComments([...comments, data]);
      setNewComment("");
    }
  };

  const toggleResolved = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("book_comments")
      .update({ is_resolved: !currentState })
      .eq("id", id);

    if (!error) {
      setComments(comments.map(c => 
        c.id === id ? { ...c, is_resolved: !currentState } : c
      ));
    }
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase
      .from("book_comments")
      .delete()
      .eq("id", id);

    if (!error) {
      setComments(comments.filter(c => c.id !== id));
    }
  };

  if (!chapterId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a chapter to view comments</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments & Notes
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground text-sm">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No comments yet
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "p-3 rounded-lg border transition-opacity",
                  comment.is_resolved 
                    ? "bg-muted/30 border-border opacity-60" 
                    : "bg-card border-border"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, h:mm a")}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleResolved(comment.id, comment.is_resolved)}
                        >
                          <Check className={cn(
                            "w-3 h-3",
                            comment.is_resolved && "text-emerald-500"
                          )} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteComment(comment.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm mt-1",
                      comment.is_resolved && "line-through"
                    )}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Comment */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="text-sm resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                addComment();
              }
            }}
          />
        </div>
        <Button
          size="sm"
          className="w-full mt-2"
          onClick={addComment}
          disabled={!newComment.trim()}
        >
          <Send className="w-4 h-4 mr-2" />
          Add Comment
        </Button>
      </div>
    </div>
  );
};

export default ChapterComments;
