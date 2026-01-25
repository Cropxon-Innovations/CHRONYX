import React from "react";
import { ChevronRight, Home, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface StudyWorkspaceBreadcrumbProps {
  templateName: string;
  templateIcon?: string;
  onBack: () => void;
}

export const StudyWorkspaceBreadcrumb: React.FC<StudyWorkspaceBreadcrumbProps> = ({
  templateName,
  templateIcon,
  onBack
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/app" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Dashboard</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbSeparator>
            <ChevronRight className="h-3.5 w-3.5" />
          </BreadcrumbSeparator>
          
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button 
                onClick={onBack}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Study</span>
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbSeparator>
            <ChevronRight className="h-3.5 w-3.5" />
          </BreadcrumbSeparator>
          
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
              {templateIcon && <span>{templateIcon}</span>}
              {templateName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  );
};
