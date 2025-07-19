import { ReactNode, useState, useEffect } from "react";
import { Header } from "./header";
import { GridOverlay } from "./grid-overlay";
import { cn } from "../lib/utils";
import { addGridVisibilityListener } from "./footer";

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  showGrid?: boolean;
  className?: string;
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  colSpan?: {
    default: number;
    md?: number;
    lg?: number;
  };
}

interface GridRowProps {
  children: ReactNode;
  className?: string;
  gap?: {
    default?: number;
    md?: number;
    lg?: number;
  };
}

const generateColSpanClass = (span: number, breakpoint?: string) => {
  if (!span) return '';
  return breakpoint ? `${breakpoint}:col-span-${span}` : `col-span-${span}`;
};

const generateGapClass = (gap: number, breakpoint?: string) => {
  if (!gap) return '';
  return breakpoint ? `${breakpoint}:gap-${gap}` : `gap-${gap}`;
};

export function GridItem({ children, className, colSpan = { default: 4 } }: GridItemProps) {
  const classes = [
    generateColSpanClass(colSpan.default),
    colSpan.md && generateColSpanClass(colSpan.md, 'md'),
    colSpan.lg && generateColSpanClass(colSpan.lg, 'lg')
  ].filter(Boolean);

  return (
    <div className={cn(...classes, className)}>
      {children}
    </div>
  );
}

export function GridRow({ children, className, gap = { default: 4, md: 6 } }: GridRowProps) {
  const gapClasses = [
    generateGapClass(gap.default || 4),
    gap.md && generateGapClass(gap.md, 'md'),
    gap.lg && generateGapClass(gap.lg, 'lg')
  ].filter(Boolean);

  return (
    <div className={cn(
      "grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12",
      ...gapClasses,
      className
    )}>
      {children}
    </div>
  );
}

export function Layout({ children, fullWidth = false, showGrid = false, className }: LayoutProps) {
  const [isGridVisible, setIsGridVisible] = useState(showGrid);

  useEffect(() => {
    const unsubscribe = addGridVisibilityListener((visible) => {
      setIsGridVisible(visible);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <GridOverlay visible={isGridVisible} />
      <main className="pt-24 pb-16">
        <div className="w-full px-4 md:px-6 lg:px-8 mx-auto">
          <div className={cn("relative min-h-[calc(100vh-10rem)]", className)}>
            {fullWidth ? (
              <div>{children}</div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-6">
                {children}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 