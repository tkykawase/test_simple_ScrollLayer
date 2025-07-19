import { cn } from "../lib/utils";

interface GridOverlayProps {
  className?: string;
  visible?: boolean;
}

export function GridOverlay({ className, visible = true }: GridOverlayProps) {
  if (!visible) return null;
  
  return (
    <div className={cn("fixed inset-0 pointer-events-none z-40", className)}>
      <div className="h-full w-full px-4 md:px-6 lg:px-8 mx-auto">
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-6 h-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`col-${i}`}
              className={cn(
                "h-full border border-black opacity-10",
                i >= 4 && "hidden",
                i < 8 && "md:block md:opacity-10",
                "lg:block lg:opacity-10"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 