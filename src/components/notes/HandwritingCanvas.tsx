import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Pen,
  Highlighter,
  Download,
  Type,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "highlighter" | "eraser";
}

interface HandwritingCanvasProps {
  onTextExtracted?: (text: string) => void;
  className?: string;
  initialStrokes?: Stroke[];
  onStrokesChange?: (strokes: Stroke[]) => void;
}

// Ink colors (elegant, muted palette)
const INK_COLORS = [
  { name: "Black", value: "#1a1a1a" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Forest", value: "#2d5a3d" },
  { name: "Wine", value: "#722f37" },
  { name: "Slate", value: "#475569" },
  { name: "Blue", value: "#3b82f6" },
];

const HIGHLIGHTER_COLORS = [
  { name: "Yellow", value: "rgba(250, 204, 21, 0.4)" },
  { name: "Green", value: "rgba(74, 222, 128, 0.4)" },
  { name: "Pink", value: "rgba(249, 168, 212, 0.4)" },
  { name: "Blue", value: "rgba(147, 197, 253, 0.4)" },
  { name: "Orange", value: "rgba(251, 146, 60, 0.4)" },
];

export const HandwritingCanvas = ({
  onTextExtracted,
  className,
  initialStrokes = [],
  onStrokesChange,
}: HandwritingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  
  // Tool settings
  const [activeTool, setActiveTool] = useState<"pen" | "highlighter" | "eraser">("pen");
  const [penColor, setPenColor] = useState(INK_COLORS[0].value);
  const [highlighterColor, setHighlighterColor] = useState(HIGHLIGHTER_COLORS[0].value);
  const [penWidth, setPenWidth] = useState(2);
  const [highlighterWidth, setHighlighterWidth] = useState(20);
  const [eraserWidth, setEraserWidth] = useState(20);
  
  // Stylus detection
  const [stylusDetected, setStylusDetected] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Redraw canvas when strokes change
  useEffect(() => {
    redrawCanvas();
    onStrokesChange?.(strokes);
  }, [strokes]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paper lines (subtle)
    const lineSpacing = 32;
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 0.5;
    for (let y = lineSpacing; y < canvas.height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      if (stroke.tool === "highlighter") {
        ctx.globalCompositeOperation = "multiply";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const prevPoint = stroke.points[i - 1];
        
        // Apply pressure sensitivity
        const pressureWidth = stroke.width * (point.pressure * 0.5 + 0.5);
        ctx.lineWidth = pressureWidth;
        
        // Smooth curve
        const midX = (prevPoint.x + point.x) / 2;
        const midY = (prevPoint.y + point.y) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
      }
      
      ctx.stroke();
    });

    ctx.globalCompositeOperation = "source-over";
  }, [strokes]);

  // Get pointer position
  const getPointerPosition = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    };
  };

  // Handle pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    // Detect stylus
    if (e.pointerType === "pen") {
      setStylusDetected(true);
    }
    
    // Only draw with pen or touch, not mouse (for palm rejection)
    if (e.pointerType === "mouse" && stylusDetected) return;
    
    setIsDrawing(true);
    const point = getPointerPosition(e);
    setCurrentStroke([point]);
    
    // Save state for undo
    setUndoStack([...undoStack, strokes]);
    setRedoStack([]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    
    const point = getPointerPosition(e);
    setCurrentStroke((prev) => [...prev, point]);
    
    // Draw current stroke in real-time
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || currentStroke.length < 1) return;

    const prevPoint = currentStroke[currentStroke.length - 1];
    
    ctx.beginPath();
    
    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = eraserWidth;
    } else if (activeTool === "highlighter") {
      ctx.globalCompositeOperation = "multiply";
      ctx.strokeStyle = highlighterColor;
      ctx.lineWidth = highlighterWidth * (point.pressure * 0.5 + 0.5);
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth * (point.pressure * 0.5 + 0.5);
    }
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    
    ctx.globalCompositeOperation = "source-over";
  };

  const handlePointerUp = () => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    const newStroke: Stroke = {
      points: currentStroke,
      color: activeTool === "eraser" ? "transparent" : 
             activeTool === "highlighter" ? highlighterColor : penColor,
      width: activeTool === "eraser" ? eraserWidth :
             activeTool === "highlighter" ? highlighterWidth : penWidth,
      tool: activeTool,
    };

    if (activeTool !== "eraser") {
      setStrokes([...strokes, newStroke]);
    }
    
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack([...redoStack, strokes]);
    setStrokes(previousState);
    setUndoStack(undoStack.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack([...undoStack, strokes]);
    setStrokes(nextState);
    setRedoStack(redoStack.slice(0, -1));
  };

  const handleClear = () => {
    setUndoStack([...undoStack, strokes]);
    setRedoStack([]);
    setStrokes([]);
  };

  // Export as image
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `handwriting-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-muted/30 border-b border-border rounded-t-xl">
        {/* Tool Selection */}
        <div className="flex items-center border border-border rounded-lg p-1 bg-background">
          <Button
            variant={activeTool === "pen" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("pen")}
            className="h-8 w-8 p-0"
            title="Pen"
          >
            <Pen className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "highlighter" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("highlighter")}
            className="h-8 w-8 p-0"
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "eraser" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("eraser")}
            className="h-8 w-8 p-0"
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        {/* Color Picker */}
        {activeTool !== "eraser" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{
                    backgroundColor:
                      activeTool === "highlighter" ? highlighterColor : penColor,
                  }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {activeTool === "highlighter" ? "Highlighter Color" : "Ink Color"}
                </p>
                <div className="flex gap-2">
                  {(activeTool === "highlighter" ? HIGHLIGHTER_COLORS : INK_COLORS).map(
                    (color) => (
                      <button
                        key={color.value}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          (activeTool === "highlighter"
                            ? highlighterColor
                            : penColor) === color.value
                            ? "border-primary scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={() =>
                          activeTool === "highlighter"
                            ? setHighlighterColor(color.value)
                            : setPenColor(color.value)
                        }
                        title={color.name}
                      />
                    )
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Size</p>
                  <Slider
                    value={[
                      activeTool === "highlighter" ? highlighterWidth : penWidth,
                    ]}
                    onValueChange={([value]) =>
                      activeTool === "highlighter"
                        ? setHighlighterWidth(value)
                        : setPenWidth(value)
                    }
                    min={activeTool === "highlighter" ? 10 : 1}
                    max={activeTool === "highlighter" ? 40 : 10}
                    step={1}
                    className="w-32"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <div className="h-6 w-px bg-border" />

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="h-8 w-8 p-0"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="h-8 w-8 p-0"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={strokes.length === 0}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Clear All"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={strokes.length === 0}
          className="h-8"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[400px] bg-[#fefef9] rounded-b-xl overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 cursor-crosshair"
          style={{ touchAction: "none" }}
        />
        
        {/* Stylus hint */}
        {!stylusDetected && strokes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground/50">
              <Pen className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Use your Apple Pencil or stylus to write</p>
              <p className="text-xs mt-1">Or draw with touch</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
