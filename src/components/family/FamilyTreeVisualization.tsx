import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, User, CheckCircle2, AlertCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FamilyMember } from "@/pages/app/FamilyTree";

interface FamilyTreeVisualizationProps {
  members: FamilyMember[];
  zoom: number;
  onMemberClick: (member: FamilyMember) => void;
  onAddChild: (parentId: string) => void;
  selectedMemberId?: string;
}

interface TreeNode {
  member: FamilyMember;
  children: TreeNode[];
  spouse?: FamilyMember;
  x: number;
  y: number;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 120;

export const FamilyTreeVisualization = ({
  members,
  zoom,
  onMemberClick,
  onAddChild,
  selectedMemberId,
}: FamilyTreeVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build tree structure
  const { tree, connections, dimensions } = useMemo(() => {
    if (members.length === 0) return { tree: null, connections: [], dimensions: { width: 0, height: 0 } };

    // Find root (is_root = true or Self relationship)
    const rootMember = members.find(m => m.is_root) || members.find(m => m.relationship === "Self") || members[0];
    if (!rootMember) return { tree: null, connections: [], dimensions: { width: 0, height: 0 } };

    // Build parent-child relationships
    const childrenMap = new Map<string, FamilyMember[]>();
    const spouseMap = new Map<string, FamilyMember>();
    
    members.forEach(m => {
      if (m.parent_id) {
        const siblings = childrenMap.get(m.parent_id) || [];
        siblings.push(m);
        childrenMap.set(m.parent_id, siblings);
      }
      if (m.spouse_id) {
        spouseMap.set(m.spouse_id, m);
      }
    });

    // Build tree recursively
    const buildNode = (member: FamilyMember, level: number, xOffset: number): TreeNode => {
      const children = childrenMap.get(member.id) || [];
      const spouse = spouseMap.get(member.id);
      
      const childNodes: TreeNode[] = [];
      let currentX = xOffset;
      
      children.forEach(child => {
        const childNode = buildNode(child, level + 1, currentX);
        childNodes.push(childNode);
        currentX = childNode.x + NODE_WIDTH + HORIZONTAL_SPACING;
      });

      // Calculate this node's x position (center over children)
      let x = xOffset;
      if (childNodes.length > 0) {
        const leftmost = childNodes[0].x;
        const rightmost = childNodes[childNodes.length - 1].x;
        x = (leftmost + rightmost) / 2;
      }

      return {
        member,
        children: childNodes,
        spouse,
        x,
        y: level * VERTICAL_SPACING,
      };
    };

    const tree = buildNode(rootMember, 0, 0);

    // Calculate connections
    const connections: { from: { x: number; y: number }; to: { x: number; y: number }; type: "parent" | "spouse" }[] = [];
    
    const traverseForConnections = (node: TreeNode) => {
      const fromX = node.x + NODE_WIDTH / 2;
      const fromY = node.y + NODE_HEIGHT;

      node.children.forEach(child => {
        connections.push({
          from: { x: fromX, y: fromY },
          to: { x: child.x + NODE_WIDTH / 2, y: child.y },
          type: "parent",
        });
        traverseForConnections(child);
      });

      if (node.spouse) {
        connections.push({
          from: { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 },
          to: { x: node.x + NODE_WIDTH + 30, y: node.y + NODE_HEIGHT / 2 },
          type: "spouse",
        });
      }
    };

    traverseForConnections(tree);

    // Calculate dimensions
    const calcDimensions = (node: TreeNode): { minX: number; maxX: number; maxY: number } => {
      let minX = node.x;
      let maxX = node.x + NODE_WIDTH;
      let maxY = node.y + NODE_HEIGHT;

      if (node.spouse) {
        maxX += NODE_WIDTH + 60;
      }

      node.children.forEach(child => {
        const childDim = calcDimensions(child);
        minX = Math.min(minX, childDim.minX);
        maxX = Math.max(maxX, childDim.maxX);
        maxY = Math.max(maxY, childDim.maxY);
      });

      return { minX, maxX, maxY };
    };

    const dims = calcDimensions(tree);
    const width = dims.maxX - dims.minX + 200;
    const height = dims.maxY + 100;

    return { tree, connections, dimensions: { width, height } };
  }, [members]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render tree node
  const renderNode = (node: TreeNode) => {
    const { member, spouse, children, x, y } = node;
    const isSelected = selectedMemberId === member.id;

    return (
      <g key={member.id}>
        {/* Member card */}
        <foreignObject x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "w-full h-full p-3 rounded-xl border-2 cursor-pointer transition-all bg-card",
              isSelected 
                ? "border-primary shadow-lg shadow-primary/20" 
                : "border-border hover:border-primary/50 hover:shadow-md"
            )}
            onClick={() => onMemberClick(member)}
          >
            <div className="flex items-start gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                member.gender === "Male" ? "bg-blue-100 text-blue-600" :
                member.gender === "Female" ? "bg-pink-100 text-pink-600" :
                "bg-muted text-muted-foreground"
              )}>
                {member.photo_url ? (
                  <img src={member.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{member.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.relationship}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge 
                variant={member.is_verified ? "default" : "outline"} 
                className={cn(
                  "text-[10px] h-5",
                  member.is_verified && "bg-green-500/10 text-green-600 border-green-500/20"
                )}
              >
                {member.is_verified ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</>
                ) : (
                  <><AlertCircle className="w-3 h-3 mr-1" /> Unverified</>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); onAddChild(member.id); }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        </foreignObject>

        {/* Spouse card */}
        {spouse && (
          <>
            {/* Heart connector */}
            <circle cx={x + NODE_WIDTH + 30} cy={y + NODE_HEIGHT / 2} r={12} fill="hsl(var(--primary) / 0.1)" />
            <foreignObject x={x + NODE_WIDTH + 16} y={y + NODE_HEIGHT / 2 - 8} width={28} height={16}>
              <div className="flex items-center justify-center w-full h-full">
                <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
              </div>
            </foreignObject>

            <foreignObject x={x + NODE_WIDTH + 60} y={y} width={NODE_WIDTH} height={NODE_HEIGHT}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "w-full h-full p-3 rounded-xl border-2 cursor-pointer transition-all bg-card",
                  selectedMemberId === spouse.id 
                    ? "border-primary shadow-lg shadow-primary/20" 
                    : "border-border hover:border-primary/50 hover:shadow-md"
                )}
                onClick={() => onMemberClick(spouse)}
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    spouse.gender === "Male" ? "bg-blue-100 text-blue-600" :
                    spouse.gender === "Female" ? "bg-pink-100 text-pink-600" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {spouse.photo_url ? (
                      <img src={spouse.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{spouse.full_name}</p>
                    <p className="text-xs text-muted-foreground">Spouse</p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <Badge 
                    variant={spouse.is_verified ? "default" : "outline"} 
                    className={cn(
                      "text-[10px] h-5",
                      spouse.is_verified && "bg-green-500/10 text-green-600 border-green-500/20"
                    )}
                  >
                    {spouse.is_verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </motion.div>
            </foreignObject>
          </>
        )}

        {/* Render children */}
        {children.map(child => renderNode(child))}
      </g>
    );
  };

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No family members found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width={dimensions.width * zoom}
        height={dimensions.height * zoom}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "top left",
        }}
        className="select-none"
      >
        {/* Connection lines */}
        <g>
          {connections.map((conn, i) => (
            <path
              key={i}
              d={
                conn.type === "parent"
                  ? `M ${conn.from.x} ${conn.from.y} 
                     L ${conn.from.x} ${(conn.from.y + conn.to.y) / 2}
                     L ${conn.to.x} ${(conn.from.y + conn.to.y) / 2}
                     L ${conn.to.x} ${conn.to.y}`
                  : `M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`
              }
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={2}
              strokeLinecap="round"
              className={conn.type === "spouse" ? "stroke-red-300" : ""}
            />
          ))}
        </g>

        {/* Tree nodes */}
        {renderNode(tree)}
      </svg>
    </div>
  );
};
