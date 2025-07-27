import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Palette, Eraser, RotateCcw, Download, Upload, Users, ChevronDown, ChevronUp, X } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface DrawingAction {
  type: 'draw' | 'erase';
  points: Point[];
  color: string;
  brushSize: number;
  userId: string;
  userName: string;
}

interface CollaborativeWhiteboardProps {
  roomId: string;
  socket: any;
  user: any;
  isOpen?: boolean;
  onToggle?: () => void;
}

const CollaborativeWhiteboard: React.FC<CollaborativeWhiteboardProps> = ({
  roomId,
  socket,
  user,
  isOpen = false,
  onToggle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [isErasing, setIsErasing] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#000000', // black
  ];

  const brushSizes = [1, 3, 5, 8, 12];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set initial canvas style
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('whiteboardDraw', (action: DrawingAction) => {
      drawPath(action.points, action.color, action.brushSize, action.type === 'erase');
    });

    socket.on('whiteboardClear', () => {
      clearCanvas();
    });

    socket.on('userJoinedWhiteboard', (userName: string) => {
      setActiveUsers(prev => [...prev, userName]);
    });

    socket.on('userLeftWhiteboard', (userName: string) => {
      setActiveUsers(prev => prev.filter(name => name !== userName));
    });

    // Join whiteboard room
    socket.emit('joinWhiteboard', { roomId, userName: user?.name || 'Anonymous' });

    return () => {
      socket.off('whiteboardDraw');
      socket.off('whiteboardClear');
      socket.off('userJoinedWhiteboard');
      socket.off('userLeftWhiteboard');
      socket.emit('leaveWhiteboard', { roomId, userName: user?.name || 'Anonymous' });
    };
  }, [socket, roomId, user]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const drawPath = useCallback((points: Point[], color: string, size: number, isErase: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.strokeStyle = isErase ? '#ffffff' : color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getCanvasCoordinates(e);
    setCurrentPath([point]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getCanvasCoordinates(e);
    setCurrentPath(prev => [...prev, point]);

    // Draw locally
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(currentPath[currentPath.length - 1]?.x || point.x, currentPath[currentPath.length - 1]?.y || point.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = isErasing ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentPath.length === 0) return;

    setIsDrawing(false);

    // Send drawing action to other users
    if (socket) {
      socket.emit('whiteboardDraw', {
        roomId,
        points: currentPath,
        color,
        brushSize,
        type: isErasing ? 'erase' : 'draw',
        userId: user?.id,
        userName: user?.name || 'Anonymous'
      });
    }

    setCurrentPath([]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    clearCanvas();
    if (socket) {
      socket.emit('whiteboardClear', { roomId });
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas and draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="bg-white">
      {/* Header with toggle functionality */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Collaborative Whiteboard
          </h4>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{activeUsers.length + 1} active</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="flex items-center gap-1"
            >
              {isOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Open</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

            {/* Collapsible content */}
      {isOpen && (
        <div className="p-4">
                    {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            {/* Color Palette */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Colors:</span>
              <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  color === c ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setIsErasing(false);
                }}
              />
            ))}
          </div>
        </div>

                    {/* Brush Size */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Size:</span>
              <div className="flex gap-1">
            {brushSizes.map((size) => (
              <button
                key={size}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
                  brushSize === size ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 hover:border-gray-500'
                }`}
                onClick={() => setBrushSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

                    {/* Eraser */}
            <Button
              variant={isErasing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsErasing(!isErasing)}
              className="flex items-center gap-2"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </Button>

                    {/* Clear */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>

                    {/* Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCanvas}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>

                    {/* Upload */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Load</span>
              </Button>
            </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 sm:h-80 md:h-96 border-2 border-gray-200 rounded-lg cursor-crosshair bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Drawing indicator */}
        {isDrawing && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            Drawing...
          </div>
        )}
      </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            Draw, annotate, and solve problems together. Your changes appear in real-time for all participants.
          </div>
        </div>
      )}
    </Card>
  );
};

export default CollaborativeWhiteboard; 