import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Pen,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Circle,
  Square,
  Minus,
  Download,
  Palette,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "highlighter" | "eraser" | "line" | "rectangle" | "circle";
}

export interface CanvasLayerRef {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  export: () => string;
  getStrokes: () => Stroke[];
}

interface CanvasLayerProps {
  className?: string;
  initialStrokes?: Stroke[];
  onStrokesChange?: (strokes: Stroke[]) => void;
  isOverlay?: boolean;
}

// Premium ink colors
const INK_COLORS = [
  { name: "Black", value: "#1a1a1a" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Forest", value: "#1a4d2e" },
  { name: "Wine", value: "#722f37" },
  { name: "Slate", value: "#475569" },
  { name: "Royal Blue", value: "#2563eb" },
  { name: "Teal", value: "#0d9488" },
  { name: "Purple", value: "#7c3aed" },
];

const HIGHLIGHTER_COLORS = [
  { name: "Yellow", value: "rgba(250, 204, 21, 0.4)" },
  { name: "Green", value: "rgba(74, 222, 128, 0.4)" },
  { name: "Pink", value: "rgba(249, 168, 212, 0.4)" },
  { name: "Blue", value: "rgba(147, 197, 253, 0.4)" },
  { name: "Orange", value: "rgba(251, 146, 60, 0.4)" },
  { name: "Purple", value: "rgba(192, 132, 252, 0.4)" },
];

type Tool = "pen" | "highlighter" | "eraser" | "line" | "rectangle" | "circle";

const ToolButton = ({
  onClick,
  isActive,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  title: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        onClick={onClick}
        className={cn(
          "h-9 w-9 p-0 rounded-xl transition-all duration-200",
          isActive && "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
        )}
      >
        <Icon className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs font-medium">
      {title}
    </TooltipContent>
  </Tooltip>
);

export const CanvasLayer = forwardRef<CanvasLayerRef, CanvasLayerProps>(
  ({ className, initialStrokes = [], onStrokesChange, isOverlay = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
    const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

    // Tool state
    const [activeTool, setActiveTool] = useState<Tool>("pen");
    const [penColor, setPenColor] = useState(INK_COLORS[0].value);
    const [highlighterColor, setHighlighterColor] = useState(HIGHLIGHTER_COLORS[0].value);
    const [penWidth, setPenWidth] = useState(2.5);
    const [highlighterWidth, setHighlighterWidth] = useState(20);
    const [eraserWidth, setEraserWidth] = useState(24);
    const [stylusDetected, setStylusDetected] = useState(false);

    // Shape drawing state
    const [shapeStart, setShapeStart] = useState<Point | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      clear: handleClear,
      undo: handleUndo,
      redo: handleRedo,
      export: () => canvasRef.current?.toDataURL("image/png") || "",
      getStrokes: () => strokes,
    }));

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

    // Redraw canvas
    useEffect(() => {
      redrawCanvas();
      onStrokesChange?.(strokes);
    }, [strokes]);

    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle paper lines if not overlay
      if (!isOverlay) {
        const lineSpacing = 28;
        ctx.strokeStyle = "rgba(200, 200, 200, 0.2)";
        ctx.lineWidth = 0.5;
        for (let y = lineSpacing; y < canvas.height / (window.devicePixelRatio || 1); y += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width / (window.devicePixelRatio || 1), y);
          ctx.stroke();
        }
      }

      // Draw strokes
      strokes.forEach((stroke) => {
        if (stroke.tool === "line" || stroke.tool === "rectangle" || stroke.tool === "circle") {
          drawShape(ctx, stroke);
        } else {
          drawStroke(ctx, stroke);
        }
      });
    }, [strokes, isOverlay]);

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
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
        const pressureWidth = stroke.width * (point.pressure * 0.6 + 0.4);
        ctx.lineWidth = pressureWidth;

        const midX = (prevPoint.x + point.x) / 2;
        const midY = (prevPoint.y + point.y) / 2;
        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
      }

      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    };

    const drawShape = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
      if (stroke.points.length < 2) return;

      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (stroke.tool) {
        case "line":
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          break;
        case "rectangle":
          ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
          break;
        case "circle":
          const radiusX = Math.abs(end.x - start.x) / 2;
          const radiusY = Math.abs(end.y - start.y) / 2;
          const centerX = start.x + (end.x - start.x) / 2;
          const centerY = start.y + (end.y - start.y) / 2;
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          break;
      }

      ctx.stroke();
    };

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

    const handlePointerDown = (e: React.PointerEvent) => {
      if (e.pointerType === "pen") setStylusDetected(true);
      if (e.pointerType === "mouse" && stylusDetected) return;

      setIsDrawing(true);
      const point = getPointerPosition(e);

      if (activeTool === "line" || activeTool === "rectangle" || activeTool === "circle") {
        setShapeStart(point);
      }

      setCurrentStroke([point]);
      setUndoStack([...undoStack, strokes]);
      setRedoStack([]);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDrawing) return;

      const point = getPointerPosition(e);
      setCurrentStroke((prev) => [...prev, point]);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || currentStroke.length < 1) return;

      if (activeTool === "line" || activeTool === "rectangle" || activeTool === "circle") {
        // Preview shape
        redrawCanvas();
        const start = currentStroke[0];
        ctx.beginPath();
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
        ctx.setLineDash([5, 5]);

        switch (activeTool) {
          case "line":
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(point.x, point.y);
            break;
          case "rectangle":
            ctx.rect(start.x, start.y, point.x - start.x, point.y - start.y);
            break;
          case "circle":
            const radiusX = Math.abs(point.x - start.x) / 2;
            const radiusY = Math.abs(point.y - start.y) / 2;
            const centerX = start.x + (point.x - start.x) / 2;
            const centerY = start.y + (point.y - start.y) / 2;
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            break;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        return;
      }

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
        ctx.lineWidth = penWidth * (point.pressure * 0.6 + 0.4);
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
        setShapeStart(null);
        return;
      }

      const newStroke: Stroke = {
        points: currentStroke,
        color:
          activeTool === "eraser"
            ? "transparent"
            : activeTool === "highlighter"
            ? highlighterColor
            : penColor,
        width:
          activeTool === "eraser"
            ? eraserWidth
            : activeTool === "highlighter"
            ? highlighterWidth
            : penWidth,
        tool: activeTool,
      };

      if (activeTool !== "eraser") {
        setStrokes([...strokes, newStroke]);
      }

      setIsDrawing(false);
      setCurrentStroke([]);
      setShapeStart(null);
    };

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

    const handleExport = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = `drawing-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    return (
      <TooltipProvider>
        <div className={cn("flex flex-col", className)}>
          {/* Floating Toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl">
            {/* Tool Selection */}
            <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-xl">
              <ToolButton
                onClick={() => setActiveTool("pen")}
                isActive={activeTool === "pen"}
                icon={Pen}
                title="Pen"
              />
              <ToolButton
                onClick={() => setActiveTool("highlighter")}
                isActive={activeTool === "highlighter"}
                icon={Highlighter}
                title="Highlighter"
              />
              <ToolButton
                onClick={() => setActiveTool("eraser")}
                isActive={activeTool === "eraser"}
                icon={Eraser}
                title="Eraser"
              />
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Shape Tools */}
            <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-xl">
              <ToolButton
                onClick={() => setActiveTool("line")}
                isActive={activeTool === "line"}
                icon={Minus}
                title="Line"
              />
              <ToolButton
                onClick={() => setActiveTool("rectangle")}
                isActive={activeTool === "rectangle"}
                icon={Square}
                title="Rectangle"
              />
              <ToolButton
                onClick={() => setActiveTool("circle")}
                isActive={activeTool === "circle"}
                icon={Circle}
                title="Circle"
              />
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Color & Size */}
            {activeTool !== "eraser" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-border shadow-inner"
                      style={{
                        backgroundColor:
                          activeTool === "highlighter" ? highlighterColor : penColor,
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="center">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {activeTool === "highlighter" ? "Highlighter" : "Ink"} Color
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(activeTool === "highlighter" ? HIGHLIGHTER_COLORS : INK_COLORS).map(
                          (color) => (
                            <button
                              key={color.value}
                              className={cn(
                                "w-7 h-7 rounded-full border-2 transition-all",
                                (activeTool === "highlighter"
                                  ? highlighterColor
                                  : penColor) === color.value
                                  ? "border-primary scale-110 shadow-md"
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
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Stroke Size
                      </p>
                      <Slider
                        value={[activeTool === "highlighter" ? highlighterWidth : penWidth]}
                        onValueChange={([value]) =>
                          activeTool === "highlighter"
                            ? setHighlighterWidth(value)
                            : setPenWidth(value)
                        }
                        min={activeTool === "highlighter" ? 8 : 0.5}
                        max={activeTool === "highlighter" ? 40 : 12}
                        step={0.5}
                        className="w-32"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <div className="w-px h-6 bg-border mx-1" />

            {/* Actions */}
            <ToolButton
              onClick={handleUndo}
              isActive={false}
              icon={Undo2}
              title="Undo"
            />
            <ToolButton
              onClick={handleRedo}
              isActive={false}
              icon={Redo2}
              title="Redo"
            />
            <ToolButton
              onClick={handleClear}
              isActive={false}
              icon={Trash2}
              title="Clear"
            />
            <ToolButton
              onClick={handleExport}
              isActive={false}
              icon={Download}
              title="Export"
            />
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            className={cn(
              "relative flex-1 min-h-[400px] overflow-hidden touch-none",
              !isOverlay && "bg-card dark:bg-card rounded-b-2xl"
            )}
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

            {/* Empty state */}
            {!isOverlay && !stylusDetected && strokes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2">
                  <div className="p-4 rounded-full bg-muted/50 mx-auto w-fit">
                    <Pen className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground/70 font-medium">
                    Use Apple Pencil or stylus to draw
                  </p>
                  <p className="text-xs text-muted-foreground/50">Touch drawing also supported</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }
);

CanvasLayer.displayName = "CanvasLayer";
