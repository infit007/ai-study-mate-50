import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableLayoutProps {
  leftComponent: React.ReactNode;
  rightComponent: React.ReactNode;
  defaultLeftWidth?: number; // percentage
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftComponent,
  rightComponent,
  defaultLeftWidth = 60,
  minLeftWidth = 30,
  maxLeftWidth = 80
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="flex w-full h-full relative"
      style={{ cursor: isDragging ? 'col-resize' : 'default' }}
    >
      {/* Left Component */}
      <div 
        className="flex-shrink-0"
        style={{ width: `${leftWidth}%` }}
      >
        {leftComponent}
      </div>

      {/* Resizer Handle */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors duration-200 relative group"
        onMouseDown={handleMouseDown}
      >
        <div className="w-4 h-8 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <GripVertical className="w-3 h-3 text-gray-500" />
        </div>
      </div>

      {/* Right Component */}
      <div 
        className="flex-1"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightComponent}
      </div>
    </div>
  );
};

export default ResizableLayout; 