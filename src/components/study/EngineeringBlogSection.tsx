import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  BookOpen, 
  PenSquare, 
  Code2, 
  Layers, 
  ArrowRight,
  Sparkles 
} from "lucide-react";

interface EngineeringBlogSectionProps {
  className?: string;
}

export const EngineeringBlogSection = ({ className }: EngineeringBlogSectionProps) => {
  const handleOpenStackcraft = () => {
    window.open("https://stackcraft.io", "_blank", "noopener,noreferrer");
  };

  const handleOpenBlog = () => {
    window.open("https://blog.stackcraft.io", "_blank", "noopener,noreferrer");
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Code2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Engineering Resources</h3>
        <Badge variant="secondary" className="text-[10px]">
          LINKED
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Stackcraft.io Card */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Stackcraft.io</CardTitle>
                  <CardDescription className="text-xs">Engineering Platform</CardDescription>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Learn system design, backend architecture, and engineering best practices.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px]">System Design</Badge>
              <Badge variant="outline" className="text-[10px]">Backend</Badge>
              <Badge variant="outline" className="text-[10px]">Architecture</Badge>
            </div>
            <Button 
              onClick={handleOpenStackcraft}
              className="w-full gap-2"
              variant="outline"
            >
              <BookOpen className="w-4 h-4" />
              Read Engineering Blog
              <ArrowRight className="w-3 h-3 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Write/Publish Card */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
              COMING SOON
            </Badge>
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                <PenSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Write & Publish</CardTitle>
                <CardDescription className="text-xs">blog.stackcraft.io</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Write technical blogs, get paid for quality content, and build your engineering portfolio.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px]">Get Paid</Badge>
              <Badge variant="outline" className="text-[10px]">Build Portfolio</Badge>
              <Badge variant="outline" className="text-[10px]">Get Noticed</Badge>
            </div>
            <Button 
              onClick={handleOpenBlog}
              className="w-full gap-2"
              variant="secondary"
              disabled
            >
              <Sparkles className="w-4 h-4" />
              Publish Your Blog
              <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Powered by <span className="font-medium">CHRONYX</span> • Study & Engineering Resources
      </p>
    </div>
  );
};

export default EngineeringBlogSection;
