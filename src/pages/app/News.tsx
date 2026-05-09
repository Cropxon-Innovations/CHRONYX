import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  ExternalLink, 
  Globe, 
  MapPin, 
  Newspaper,
  Radio,
  Tv,
  TrendingUp,
  Rss,
  Flag,
  Building2,
  Mail,
  Phone
} from "lucide-react";

const NEWS_CATEGORIES = [
  { id: "all", label: "All News", icon: Newspaper },
  { id: "india", label: "India", icon: MapPin, flag: "🇮🇳" },
  { id: "world", label: "World", icon: Globe, flag: "🌍" },
  { id: "local", label: "Local", icon: Radio },
  { id: "trending", label: "Trending", icon: TrendingUp },
];

const COUNTRY_FLAGS = [
  { country: "India", flag: "🇮🇳", code: "IN" },
  { country: "USA", flag: "🇺🇸", code: "US" },
  { country: "UK", flag: "🇬🇧", code: "UK" },
  { country: "Japan", flag: "🇯🇵", code: "JP" },
  { country: "Germany", flag: "🇩🇪", code: "DE" },
  { country: "France", flag: "🇫🇷", code: "FR" },
  { country: "Australia", flag: "🇦🇺", code: "AU" },
  { country: "Canada", flag: "🇨🇦", code: "CA" },
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

      {/* Company Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2 border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Tv className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    NEWSTACK
                    <Badge className="bg-red-500/20 text-red-600 text-[10px]">LIVE</Badge>
                  </CardTitle>
                  <CardDescription className="text-sm">Real-time News Aggregation Platform</CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-xs border-primary/30">
                  
                </Badge>
                <span className="text-[10px] text-muted-foreground"></span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* About Section */}
            <div className="p-4 rounded-xl bg-background/50 border border-border/30">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                About NEWSTACK
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                NEWSTACK.Live is a premium news aggregation platform developed by{" "}
                <span className="font-semibold text-foreground">CHRONYX</span>. 
                We curate and deliver real-time news from trusted sources across India and the world, 
                providing a unified dashboard for staying informed on politics, business, technology, 
                sports, and more.
              </p>
            </div>

            {/* Country Flags */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-primary" />
                Coverage Regions
              </h3>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_FLAGS.map((item) => (
                  <motion.div
                    key={item.code}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">{item.flag}</span>
                    <span className="text-xs font-medium">{item.country}</span>
                  </motion.div>
                ))}
              </div>
            </div>

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
                        {category.flag ? (
                          <span className="text-sm">{category.flag}</span>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
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
                      {category.flag ? (
                        <span className="text-4xl">{category.flag}</span>
                      ) : (
                        <category.icon className="w-10 h-10 text-primary/60" />
                      )}
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
                      className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:opacity-90"
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
                <span className="text-2xl">🇮🇳</span>
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
      </motion.div>

      {/* Info Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 space-y-2 border-t border-border/30 pt-6">
        <div className="flex items-center justify-center gap-2">
          <Tv className="w-4 h-4 text-red-500" />
          <span className="font-semibold">NEWSTACK.Live</span>
        </div>
        <p>
          A news aggregation platform by{" "}
          <a 
            href="https://www.getchronyx.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            CHRONYX
          </a>
        </p>
        <p className="text-muted-foreground/70">
          Curating trusted news from India 🇮🇳 and around the world 🌍
        </p>
      </div>
    </div>
  );
};

export default News;
