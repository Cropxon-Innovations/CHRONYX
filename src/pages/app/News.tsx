import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  Globe, 
  MapPin, 
  Newspaper,
  Radio,
  Tv,
  TrendingUp,
  RefreshCw,
  Rss
} from "lucide-react";

const NEWS_CATEGORIES = [
  { id: "all", label: "All News", icon: Newspaper },
  { id: "india", label: "India", icon: MapPin },
  { id: "world", label: "World", icon: Globe },
  { id: "local", label: "Local", icon: Radio },
  { id: "trending", label: "Trending", icon: TrendingUp },
];

const News = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const handleOpenNewstack = () => {
    window.open("https://newstack.live", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">News & Media</h1>
            <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
              LIVE
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Indian, Local & World News at One Place
          </p>
        </div>
        <Button 
          onClick={handleOpenNewstack}
          className="gap-2"
        >
          <Rss className="w-4 h-4" />
          Open NEWSTACK.Live
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {/* Main Content */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center">
                <Tv className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">NEWSTACK.Live</CardTitle>
                <CardDescription>Your unified news dashboard</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              BY ORIGINX LABS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 gap-1 bg-muted/50 p-1">
                {NEWS_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="data-[state=active]:bg-card gap-2 whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{category.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {NEWS_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-4">
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <category.icon className="w-10 h-10 text-primary/60" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {category.id === "all" ? "All News Feed" : `${category.label} News`}
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Access real-time {category.label.toLowerCase()} news from trusted sources on NEWSTACK.Live
                    </p>
                  </div>
                  <Button 
                    onClick={handleOpenNewstack}
                    className="gap-2"
                  >
                    Open NEWSTACK.Live
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Features Grid */}
          <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <MapPin className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Indian News</p>
                <p className="text-xs text-muted-foreground">National coverage</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Globe className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">World News</p>
                <p className="text-xs text-muted-foreground">Global updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Radio className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Local News</p>
                <p className="text-xs text-muted-foreground">Regional focus</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>
          NEWSTACK.Live is a news aggregation platform by{" "}
          <span className="font-medium">ORIGINX LABS PVT. LTD.</span>
        </p>
      </div>
    </div>
  );
};

export default News;
