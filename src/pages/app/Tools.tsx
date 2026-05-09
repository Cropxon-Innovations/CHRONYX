import { ExternalLink, FileImage, FileText, Sparkles, Zap, FileType2, Image, FileVideo, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Tools = () => {
  const handleOpenConvertix = () => {
    window.open("https://www.getconvertix.com", "_blank", "noopener,noreferrer");
  };

  const tools = [
    {
      id: "convertix",
      name: "CONVERTIX",
      subtitle: "",
      description: "Universal file conversion tool for PDFs, images, documents, and more. Convert between formats instantly with AI-powered precision.",
      icon: Zap,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
      borderColor: "border-emerald-500/30",
      link: "https://www.getconvertix.com",
      features: [
        { icon: FileText, label: "PDF Conversion", desc: "PDF to Word, Excel, PPT & more" },
        { icon: Image, label: "Image Conversion", desc: "PNG, JPG, WebP, SVG formats" },
        { icon: FileVideo, label: "Media Files", desc: "Video & audio format conversion" },
        { icon: Download, label: "Batch Processing", desc: "Convert multiple files at once" },
      ],
      isFlagship: true,
    },
    {
      id: "noteflowlm",
      name: "NoteFlowLM",
      subtitle: "AI-Powered",
      description: "Transform your notes into beautiful images, presentations, and videos using advanced AI. Available within CHRONYX.",
      icon: Sparkles,
      color: "from-fuchsia-500 to-purple-500",
      bgColor: "bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10",
      borderColor: "border-fuchsia-500/30",
      link: "/app/notes",
      features: [
        { icon: FileImage, label: "AI Images", desc: "Generate visuals from notes" },
        { icon: FileType2, label: "Slides", desc: "Create presentations" },
        { icon: FileVideo, label: "Videos", desc: "Coming Soon" },
      ],
      isInternal: true,
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Tools</h1>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Powerful utilities to enhance your productivity
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className={`border-2 ${tool.borderColor} ${tool.bgColor} overflow-hidden`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {tool.name}
                        {tool.isFlagship && (
                          <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px]">
                            FLAGSHIP
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">{tool.subtitle}</CardDescription>
                    </div>
                  </div>
                  {tool.isInternal ? (
                    <Badge variant="outline" className="text-xs">
                      Built-in
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      External
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {tool.features.map((feature) => (
                    <div
                      key={feature.label}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50 border border-border/30"
                    >
                      <feature.icon className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">{feature.label}</p>
                        <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => {
                    if (tool.isInternal) {
                      window.location.href = tool.link;
                    } else {
                      window.open(tool.link, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className={`w-full gap-2 bg-gradient-to-r ${tool.color} text-white hover:opacity-90`}
                >
                  {tool.isInternal ? "Open in CHRONYX" : "Open CONVERTIX"}
                  {tool.isInternal ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 space-y-1">
        <p>
          <span className="font-semibold text-emerald-600">CONVERTIX</span> is a universal file conversion platform by{" "}
          <a
            href="https://www.getchronyx.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            CHRONYX
          </a>
        </p>
        <p className="text-muted-foreground/70">
          Visit{" "}
          <a
            href="https://www.getconvertix.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            www.getconvertix.com
          </a>
          {" "}for PDF, image, and document conversions.
        </p>
      </div>
    </div>
  );
};

export default Tools;
