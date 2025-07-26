import { Link, useLocation } from "react-router-dom";
import { useProjectStore } from "../lib/store";
import { useState, useCallback, useMemo } from "react";

const TAG_DISPLAY_MAP = {
  "Graphic": "Graphic",
  "Shodo": "Shodo", 
  "Illustration": "Illustration",
  "kaku": "Unit"
} as const;

const TAGS = Object.keys(TAG_DISPLAY_MAP) as Array<keyof typeof TAG_DISPLAY_MAP>;

const gridVisibilityListeners = new Set<(isVisible: boolean) => void>();

export function addGridVisibilityListener(callback: (isVisible: boolean) => void) {
  gridVisibilityListeners.add(callback);
  return () => gridVisibilityListeners.delete(callback);
}

export function notifyGridVisibilityChange(isVisible: boolean) {
  gridVisibilityListeners.forEach(callback => callback(isVisible));
}

export function Footer() {
  const location = useLocation();
  const { selectedImageTags, setSelectedImageTags } = useProjectStore();
  const isHome = location.pathname === "/";
  const [isGridVisible, setIsGridVisible] = useState(false);
  
  const toggleGrid = useCallback(() => {
    const newState = !isGridVisible;
    setIsGridVisible(newState);
    notifyGridVisibilityChange(newState);
  }, [isGridVisible]);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedImageTags(selectedImageTags.includes(tag) ? [] : [tag]);
  }, [selectedImageTags, setSelectedImageTags]);

  const tagButtons = useMemo(() => {
    return TAGS.map((tag) => (
      <span
        key={tag}
        onClick={() => handleTagClick(tag)}
        className={`text-sm text-white transition-all cursor-pointer pb-0.5 ${
          selectedImageTags.includes(tag)
            ? "border-b-2 border-white"
            : "border-b-2 border-transparent hover:text-white/80"
        }`}
      >
        {TAG_DISPLAY_MAP[tag]}
      </span>
    ));
  }, [selectedImageTags, handleTagClick]);
  
  if (!isHome) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-transparent mix-blend-difference">
        <div className="px-4 md:px-6">
          <div className="h-12 flex items-center justify-between">
            <Link to="/" className="text-sm text-white hover:opacity-80 transition-opacity">
              Back to home
            </Link>
            {process.env.NODE_ENV === 'development' && (
              <button
                className="text-sm text-white opacity-50 hover:opacity-100"
                onClick={toggleGrid}
              >
                {isGridVisible ? 'Hide Grid' : 'Show Grid'}
              </button>
            )}
          </div>
        </div>
      </footer>
    );
  }
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-transparent mix-blend-difference">
      <div className="h-12 flex items-center justify-between px-4 md:px-6">
        <span
          onClick={() => setSelectedImageTags([])}
          className={`text-sm text-white transition-all cursor-pointer pb-0.5 ${
            selectedImageTags.length === 0
              ? "border-b-2 border-white"
              : "border-b-2 border-transparent hover:text-white/80"
          }`}
        >
          All
        </span>
        {tagButtons}
      </div>
    </footer>
  );
} 