import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  text?: string;
  textClassName?: string;
}

export const BrandLogo = ({
  className,
  imageClassName,
  showText = true,
  text = "Clever Vault",
  textClassName,
}: BrandLogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt={`${text} logo`}
        className={cn("h-9 w-9 object-contain", imageClassName)}
      />
      {showText ? (
        <span className={cn("text-xl font-semibold tracking-tight text-foreground", textClassName)}>
          {text}
        </span>
      ) : null}
    </div>
  );
};
