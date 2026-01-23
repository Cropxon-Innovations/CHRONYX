import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, User, CheckCircle2, AlertCircle, Heart, ChevronDown } from "lucide-react";
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
  parents: FamilyMember[];
  x: number;
  y: number;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 140;
const SPOUSE_GAP = 60;

export const FamilyTreeVisualization = ({
  members,
  zoom,
  onMemberClick,
  onAddChild,
  selectedMemberId,
}: FamilyTreeVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build tree structure with relationship-based linking
  const { rootNode, allNodes, connections, dimensions } = useMemo(() => {
    if (members.length === 0) return { rootNode: null, allNodes: [], connections: [], dimensions: { width: 800, height: 400 } };

    // Find root (is_root = true or Self relationship)
    const rootMember = members.find(m => m.is_root) || members.find(m => m.relationship === "Self") || members[0];
    if (!rootMember) return { rootNode: null, allNodes: [], connections: [], dimensions: { width: 800, height: 400 } };

    // Group members by relationship type
    const spouse = members.find(m => m.relationship === "Spouse" && m.id !== rootMember.id);
    const children = members.filter(m => 
      (m.relationship === "Son" || m.relationship === "Daughter" || m.relationship === "Child") && 
      m.id !== rootMember.id
    );
    const parents = members.filter(m => 
      (m.relationship === "Father" || m.relationship === "Mother" || m.relationship === "Parent") && 
      m.id !== rootMember.id
    );
    const grandparents = members.filter(m => 
      m.relationship?.includes("Grandfather") || m.relationship?.includes("Grandmother")
    );
    const siblings = members.filter(m => 
      (m.relationship === "Brother" || m.relationship === "Sister" || m.relationship === "Sibling") && 
      m.id !== rootMember.id
    );
    const others = members.filter(m => 
      m.id !== rootMember.id && 
      !spouse?.id?.includes(m.id) && 
      !children.find(c => c.id === m.id) && 
      !parents.find(p => p.id === m.id) && 
      !grandparents.find(g => g.id === m.id) &&
      !siblings.find(s => s.id === m.id) &&
      m.relationship !== "Spouse"
    );

    // Calculate positions
    const allNodes: { member: FamilyMember; x: number; y: number; type: string }[] = [];
    const connections: { from: { x: number; y: number }; to: { x: number; y: number }; type: string }[] = [];

    // Center X position
    const centerX = 400;
    let currentY = 0;

    // Row 0: Grandparents (top)
    if (grandparents.length > 0) {
      const gpWidth = grandparents.length * (NODE_WIDTH + HORIZONTAL_SPACING);
      let gpX = centerX - gpWidth / 2 + HORIZONTAL_SPACING / 2;
      
      grandparents.forEach((gp, i) => {
        allNodes.push({ member: gp, x: gpX, y: currentY, type: "grandparent" });
        gpX += NODE_WIDTH + HORIZONTAL_SPACING;
      });
      currentY += VERTICAL_SPACING;
    }

    // Row 1: Parents
    if (parents.length > 0) {
      const parentWidth = parents.length * (NODE_WIDTH + HORIZONTAL_SPACING);
      let parentX = centerX - parentWidth / 2 + HORIZONTAL_SPACING / 2;
      
      parents.forEach((parent) => {
        allNodes.push({ member: parent, x: parentX, y: currentY, type: "parent" });
        
        // Connect grandparents to parents
        const gpAbove = grandparents.find(g => 
          (g.relationship?.includes("Paternal") && parent.relationship === "Father") ||
          (g.relationship?.includes("Maternal") && parent.relationship === "Mother")
        );
        if (gpAbove) {
          const gpNode = allNodes.find(n => n.member.id === gpAbove.id);
          if (gpNode) {
            connections.push({
              from: { x: gpNode.x + NODE_WIDTH / 2, y: gpNode.y + NODE_HEIGHT },
              to: { x: parentX + NODE_WIDTH / 2, y: currentY },
              type: "lineage",
            });
          }
        }
        
        parentX += NODE_WIDTH + HORIZONTAL_SPACING;
      });
      
      // Connect parents if there are two
      if (parents.length === 2) {
        const p1 = allNodes.find(n => n.member.id === parents[0].id);
        const p2 = allNodes.find(n => n.member.id === parents[1].id);
        if (p1 && p2) {
          connections.push({
            from: { x: p1.x + NODE_WIDTH, y: p1.y + NODE_HEIGHT / 2 },
            to: { x: p2.x, y: p2.y + NODE_HEIGHT / 2 },
            type: "spouse",
          });
        }
      }
      
      currentY += VERTICAL_SPACING;
    }

    // Row 2: Self + Spouse + Siblings (same generation)
    const selfRowY = currentY;
    
    // Calculate total width for self row
    let selfRowWidth = NODE_WIDTH; // Self
    if (spouse) selfRowWidth += SPOUSE_GAP + NODE_WIDTH;
    if (siblings.length > 0) selfRowWidth += HORIZONTAL_SPACING + siblings.length * (NODE_WIDTH + HORIZONTAL_SPACING);
    
    let selfX = centerX - selfRowWidth / 2 + (siblings.length > 0 ? siblings.length * (NODE_WIDTH + HORIZONTAL_SPACING) / 2 : 0);
    
    // Add siblings to the left
    siblings.forEach((sibling, i) => {
      const sibX = selfX - (siblings.length - i) * (NODE_WIDTH + HORIZONTAL_SPACING);
      allNodes.push({ member: sibling, x: sibX, y: selfRowY, type: "sibling" });
      
      // Connect sibling to parents (to the midpoint between parents)
      if (parents.length > 0) {
        const parentNodes = allNodes.filter(n => n.type === "parent");
        const parentMidX = parentNodes.reduce((sum, p) => sum + p.x + NODE_WIDTH / 2, 0) / parentNodes.length;
        connections.push({
          from: { x: parentMidX, y: selfRowY - VERTICAL_SPACING + NODE_HEIGHT },
          to: { x: sibX + NODE_WIDTH / 2, y: selfRowY },
          type: "lineage",
        });
      }
    });
    
    // Add Self (root)
    allNodes.push({ member: rootMember, x: selfX, y: selfRowY, type: "self" });
    
    // Connect self to parents
    if (parents.length > 0) {
      const parentNodes = allNodes.filter(n => n.type === "parent");
      const parentMidX = parentNodes.reduce((sum, p) => sum + p.x + NODE_WIDTH / 2, 0) / parentNodes.length;
      connections.push({
        from: { x: parentMidX, y: selfRowY - VERTICAL_SPACING + NODE_HEIGHT },
        to: { x: selfX + NODE_WIDTH / 2, y: selfRowY },
        type: "lineage",
      });
    }
    
    // Add Spouse to the right of Self
    if (spouse) {
      const spouseX = selfX + NODE_WIDTH + SPOUSE_GAP;
      allNodes.push({ member: spouse, x: spouseX, y: selfRowY, type: "spouse" });
      
      // Spouse connection
      connections.push({
        from: { x: selfX + NODE_WIDTH, y: selfRowY + NODE_HEIGHT / 2 },
        to: { x: spouseX, y: selfRowY + NODE_HEIGHT / 2 },
        type: "spouse",
      });
    }

    currentY += VERTICAL_SPACING;

    // Row 3: Children
    if (children.length > 0) {
      const childrenWidth = children.length * (NODE_WIDTH + HORIZONTAL_SPACING);
      let childX = centerX - childrenWidth / 2 + HORIZONTAL_SPACING / 2;
      
      // Parent connection point (between self and spouse)
      const selfNode = allNodes.find(n => n.type === "self");
      const spouseNode = allNodes.find(n => n.type === "spouse");
      const parentConnectX = spouseNode 
        ? (selfNode!.x + NODE_WIDTH + spouseNode.x) / 2 
        : selfNode!.x + NODE_WIDTH / 2;
      const parentConnectY = selfRowY + NODE_HEIGHT;
      
      children.forEach((child) => {
        allNodes.push({ member: child, x: childX, y: currentY, type: "child" });
        
        // Connect child to parents
        connections.push({
          from: { x: parentConnectX, y: parentConnectY },
          to: { x: childX + NODE_WIDTH / 2, y: currentY },
          type: "lineage",
        });
        
        childX += NODE_WIDTH + HORIZONTAL_SPACING;
      });
      
      currentY += VERTICAL_SPACING;
    }

    // Row 4: Others (extended family)
    if (others.length > 0) {
      const othersWidth = others.length * (NODE_WIDTH + HORIZONTAL_SPACING);
      let otherX = centerX - othersWidth / 2 + HORIZONTAL_SPACING / 2;
      
      others.forEach((other) => {
        allNodes.push({ member: other, x: otherX, y: currentY, type: "other" });
        otherX += NODE_WIDTH + HORIZONTAL_SPACING;
      });
      
      currentY += VERTICAL_SPACING;
    }

    // Calculate dimensions
    const minX = Math.min(...allNodes.map(n => n.x)) - 50;
    const maxX = Math.max(...allNodes.map(n => n.x + NODE_WIDTH)) + 50;
    const maxY = Math.max(...allNodes.map(n => n.y + NODE_HEIGHT)) + 50;
    
    // Adjust all positions to start from 0
    allNodes.forEach(n => {
      n.x -= minX;
    });
    connections.forEach(c => {
      c.from.x -= minX;
      c.to.x -= minX;
    });

    return { 
      rootNode: rootMember, 
      allNodes, 
      connections, 
      dimensions: { width: maxX - minX + 100, height: maxY + 50 } 
    };
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

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Render member node
  const renderMemberNode = (node: { member: FamilyMember; x: number; y: number; type: string }) => {
    const { member, x, y, type } = node;
    const isSelected = selectedMemberId === member.id;
    const isSelf = type === "self";

    return (
      <foreignObject key={member.id} x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "w-full h-full p-3 rounded-xl border-2 cursor-pointer transition-all",
            isSelf ? "bg-primary/5" : "bg-card",
            isSelected 
              ? "border-primary shadow-lg shadow-primary/20" 
              : isSelf 
                ? "border-primary/50 hover:border-primary hover:shadow-md"
                : "border-border hover:border-primary/50 hover:shadow-md"
          )}
          onClick={() => onMemberClick(member)}
        >
          <div className="flex items-start gap-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
              member.gender === "Male" ? "bg-blue-100 text-blue-600 border-blue-200" :
              member.gender === "Female" ? "bg-pink-100 text-pink-600 border-pink-200" :
              "bg-muted text-muted-foreground border-muted-foreground/20"
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
                <><AlertCircle className="w-3 h-3 mr-1" /> Pending</>
              )}
            </Badge>
            {(type === "self" || type === "spouse") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onAddChild(member.id); }}
                title="Add family member"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        </motion.div>
      </foreignObject>
    );
  };

  if (!rootNode || allNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No family members found. Add yourself to start your family tree.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden min-h-[500px]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <svg
        width={Math.max(dimensions.width * zoom, 800)}
        height={Math.max(dimensions.height * zoom, 500)}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "top left",
        }}
        className="select-none"
      >
        {/* Connection lines with arrows */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
          </marker>
          <marker
            id="heart-marker"
            markerWidth="16"
            markerHeight="16"
            refX="8"
            refY="8"
          >
            <circle cx="8" cy="8" r="6" fill="hsl(var(--destructive) / 0.1)" />
            <text x="8" y="11" textAnchor="middle" fontSize="10">❤</text>
          </marker>
        </defs>

        <g>
          {connections.map((conn, i) => {
            const isSpouse = conn.type === "spouse";
            const midY = (conn.from.y + conn.to.y) / 2;
            
            return (
              <g key={i}>
                {isSpouse ? (
                  // Horizontal spouse connection with heart
                  <>
                    <line
                      x1={conn.from.x}
                      y1={conn.from.y}
                      x2={conn.to.x}
                      y2={conn.to.y}
                      stroke="hsl(var(--destructive) / 0.5)"
                      strokeWidth={2}
                      strokeDasharray="4,4"
                    />
                    <circle
                      cx={(conn.from.x + conn.to.x) / 2}
                      cy={conn.from.y}
                      r={10}
                      fill="hsl(var(--destructive) / 0.1)"
                      stroke="hsl(var(--destructive) / 0.3)"
                      strokeWidth={1}
                    />
                    <text
                      x={(conn.from.x + conn.to.x) / 2}
                      y={conn.from.y + 4}
                      textAnchor="middle"
                      fontSize="12"
                    >
                      ❤️
                    </text>
                  </>
                ) : (
                  // Vertical lineage connection with arrow
                  <path
                    d={`M ${conn.from.x} ${conn.from.y} 
                       L ${conn.from.x} ${midY}
                       L ${conn.to.x} ${midY}
                       L ${conn.to.x} ${conn.to.y}`}
                    fill="none"
                    stroke="hsl(var(--muted-foreground) / 0.5)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Member nodes */}
        {allNodes.map(node => renderMemberNode(node))}

        {/* Generation labels */}
        <g className="text-xs fill-muted-foreground">
          {allNodes.some(n => n.type === "grandparent") && (
            <text x={10} y={allNodes.find(n => n.type === "grandparent")!.y + NODE_HEIGHT / 2} fontSize={10} opacity={0.5}>
              Grandparents
            </text>
          )}
          {allNodes.some(n => n.type === "parent") && (
            <text x={10} y={allNodes.find(n => n.type === "parent")!.y + NODE_HEIGHT / 2} fontSize={10} opacity={0.5}>
              Parents
            </text>
          )}
          {allNodes.some(n => n.type === "self") && (
            <text x={10} y={allNodes.find(n => n.type === "self")!.y + NODE_HEIGHT / 2} fontSize={10} opacity={0.5}>
              You
            </text>
          )}
          {allNodes.some(n => n.type === "child") && (
            <text x={10} y={allNodes.find(n => n.type === "child")!.y + NODE_HEIGHT / 2} fontSize={10} opacity={0.5}>
              Children
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};
