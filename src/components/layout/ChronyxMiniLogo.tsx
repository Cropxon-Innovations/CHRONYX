import { ChronyxOrbitalLogo } from "@/components/brand/ChronyxOrbitalLogo";

interface ChronyxMiniLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export const ChronyxMiniLogo = ({ className = "", size = "md" }: ChronyxMiniLogoProps) => {
  return (
    <div className={`${sizeConfig[size]} ${className} text-foreground`}>
      <ChronyxOrbitalLogo className="w-full h-full" animated glow />
    </div>
  );
};
