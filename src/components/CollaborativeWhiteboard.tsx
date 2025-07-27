import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Palette, Eraser, RotateCcw, Download, Upload, Users, Undo, Redo, Lock, Unlock } from 'lucide-react';

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

interface UploadedImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  isLocked: boolean;
  isSelected: boolean;
  isResizing: boolean;
  isMoving: boolean;
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
  const currentPathRef = useRef<Point[]>([]);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  const [customSize, setCustomSize] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isRenderingImages, setIsRenderingImages] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Set canvas size with high DPI support
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set the display size
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // Set the actual canvas size (scaled for high DPI)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Scale the context to ensure correct drawing operations
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set initial canvas style
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initialize history with blank canvas
    const initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory([initialImageData]);
    setHistoryIndex(0);

    // Render background images if any exist
    if (uploadedImages.length > 0) {
      renderBackgroundImages();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, drawingHistory.length]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('whiteboardDraw', (action: DrawingAction) => {
      drawPath(action.points, action.color, action.brushSize, action.type === 'erase');
    });

    socket.on('whiteboardClear', () => {
      clearCanvas();
    });

    socket.on('whiteboardImageUpload', (data: { 
      imageData: string; 
      imageId: string;
      x: number;
      y: number;
      width: number;
      height: number;
      userName: string 
    }) => {
      // Don't add the image if it's from the current user
      if (data.userName === user?.name) return;
      
      const newImage: UploadedImage = {
        id: data.imageId,
        src: data.imageData,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        originalWidth: data.width,
        originalHeight: data.height,
        isLocked: false,
        isSelected: false,
        isResizing: false,
        isMoving: false
      };

      setUploadedImages(prev => [...prev, newImage]);
    });

    socket.on('userJoinedWhiteboard', (userName: string) => {
      setActiveUsers(prev => [...prev, userName]);
    });

    // Request existing images when joining
    socket.on('requestExistingImages', () => {
      if (uploadedImages.length > 0) {
        uploadedImages.forEach(image => {
          socket.emit('whiteboardImageUpload', {
            roomId,
            imageData: image.src,
            imageId: image.id,
            x: image.x,
            y: image.y,
            width: image.width,
            height: image.height,
            userId: user?.id,
            userName: user?.name || 'Anonymous'
          });
        });
      }
    });

    socket.on('userLeftWhiteboard', (userName: string) => {
      setActiveUsers(prev => prev.filter(name => name !== userName));
    });

    // Image operation events
    socket.on('whiteboardImageMove', (data: { 
      imageId: string; 
      x: number; 
      y: number; 
      userName: string 
    }) => {
      if (data.userName === user?.name) return;
      
      setUploadedImages(prev => prev.map(img => 
        img.id === data.imageId ? { ...img, x: data.x, y: data.y } : img
      ));
    });

    socket.on('whiteboardImageResize', (data: { 
      imageId: string; 
      x: number; 
      y: number; 
      width: number; 
      height: number; 
      userName: string 
    }) => {
      if (data.userName === user?.name) return;
      
      setUploadedImages(prev => prev.map(img => 
        img.id === data.imageId ? { ...img, x: data.x, y: data.y, width: data.width, height: data.height } : img
      ));
    });

    socket.on('whiteboardImageLock', (data: { 
      imageId: string; 
      userName: string 
    }) => {
      if (data.userName === user?.name) return;
      
      setUploadedImages(prev => prev.map(img => 
        img.id === data.imageId ? { ...img, isLocked: true, isSelected: false } : img
      ));
    });

    socket.on('whiteboardImageUnlock', (data: { 
      imageId: string; 
      userName: string 
    }) => {
      if (data.userName === user?.name) return;
      
      setUploadedImages(prev => prev.map(img => 
        img.id === data.imageId ? { ...img, isLocked: false } : img
      ));
    });

    // Join whiteboard room
    socket.emit('joinWhiteboard', { roomId, userName: user?.name || 'Anonymous' });
    
    // Request existing images after joining
    setTimeout(() => {
      socket.emit('requestExistingImages', { roomId });
    }, 100);

    return () => {
      socket.off('whiteboardDraw');
      socket.off('whiteboardClear');
      socket.off('whiteboardImageUpload');
      socket.off('whiteboardImageMove');
      socket.off('whiteboardImageResize');
      socket.off('whiteboardImageLock');
      socket.off('whiteboardImageUnlock');
      socket.off('userJoinedWhiteboard');
      socket.off('userLeftWhiteboard');
      socket.off('requestExistingImages');
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

    // Save the current canvas state
    ctx.save();
    
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
    
    // Restore the canvas state
    ctx.restore();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    
    // Check if clicking on an image
    const clickedImage = uploadedImages.find(img => isPointInImage(point, img));
    
    if (clickedImage && !clickedImage.isLocked) {
      // Handle image selection and interaction
      setSelectedImageId(clickedImage.id);
      setIsImageMode(true);
      
      // Check if clicking on resize handle
      const handle = getResizeHandle(point, clickedImage);
      if (handle) {
        setResizeHandle(handle);
        setDragStart(point);
        return;
      }
      
      // Start moving image
      setDragStart(point);
      setUploadedImages(prev => prev.map(img => 
        img.id === clickedImage.id ? { ...img, isMoving: true } : img
      ));
      return;
    }
    
    // If not clicking on image or image is locked, start drawing
    if (!isImageMode || !clickedImage) {
      // Deselect any selected image when clicking outside
      if (selectedImageId) {
        setSelectedImageId(null);
        setUploadedImages(prev => prev.map(img => ({ ...img, isSelected: false })));
      }
      
      setIsDrawing(true);
      setCurrentPath([point]);
      currentPathRef.current = [point];
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    
    // Handle image resizing
    if (resizeHandle && dragStart && selectedImageId) {
      const image = uploadedImages.find(img => img.id === selectedImageId);
      if (image) {
        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;
        
        let newWidth = image.width;
        let newHeight = image.height;
        let newX = image.x;
        let newY = image.y;
        
        const aspectRatio = image.originalWidth / image.originalHeight;
        
        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(50, image.width + deltaX);
            newHeight = newWidth / aspectRatio;
            break;
          case 'sw':
            newWidth = Math.max(50, image.width - deltaX);
            newHeight = newWidth / aspectRatio;
            newX = image.x + image.width - newWidth;
            break;
          case 'ne':
            newWidth = Math.max(50, image.width + deltaX);
            newHeight = newWidth / aspectRatio;
            newY = image.y + image.height - newHeight;
            break;
          case 'nw':
            newWidth = Math.max(50, image.width - deltaX);
            newHeight = newWidth / aspectRatio;
            newX = image.x + image.width - newWidth;
            newY = image.y + image.height - newHeight;
            break;
        }
        
        setUploadedImages(prev => prev.map(img => 
          img.id === selectedImageId ? { ...img, x: newX, y: newY, width: newWidth, height: newHeight } : img
        ));
        
        // Send resize action to other users
        if (socket) {
          socket.emit('whiteboardImageResize', {
            roomId,
            imageId: selectedImageId,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
            userId: user?.id,
            userName: user?.name || 'Anonymous'
          });
        }
      }
      return;
    }
    
    // Handle image moving
    if (dragStart && selectedImageId) {
      const image = uploadedImages.find(img => img.id === selectedImageId);
      if (image && image.isMoving) {
        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;
        
        // Update image position without triggering re-render immediately
        setUploadedImages(prev => prev.map(img => 
          img.id === selectedImageId ? { ...img, x: img.x + deltaX, y: img.y + deltaY } : img
        ));
        setDragStart(point);
        
        // Send move action to other users
        if (socket) {
          socket.emit('whiteboardImageMove', {
            roomId,
            imageId: selectedImageId,
            x: image.x + deltaX,
            y: image.y + deltaY,
            userId: user?.id,
            userName: user?.name || 'Anonymous'
          });
        }
        
        // Prevent drawing during image movement
        return;
      }
      return;
    }
    
    // Handle drawing
    if (!isDrawing) return;

    const newPath = [...currentPathRef.current, point];
    setCurrentPath(newPath);
    currentPathRef.current = newPath;

    // Draw locally
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the last point from the ref for accurate drawing
    const lastPoint = currentPathRef.current[currentPathRef.current.length - 2];
    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = isErasing ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    // Handle image interaction end
    if (resizeHandle || (dragStart && selectedImageId)) {
      setResizeHandle(null);
      setDragStart(null);
      setUploadedImages(prev => prev.map(img => ({ ...img, isMoving: false })));
      
      // Force re-render images after movement/resize
      setTimeout(() => {
        renderImages();
      }, 10);
      return;
    }
    
    if (!isDrawing || currentPathRef.current.length === 0) return;

    setIsDrawing(false);

    // Save to history after drawing
    saveToHistory();

    // Send drawing action to other users
    if (socket) {
      socket.emit('whiteboardDraw', {
        roomId,
        points: currentPathRef.current,
        color,
        brushSize,
        type: isErasing ? 'erase' : 'draw',
        userId: user?.id,
        userName: user?.name || 'Anonymous'
      });
    }

    setCurrentPath([]);
    currentPathRef.current = [];
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

        // Calculate image dimensions to fit canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        let width, height;
        if (imgAspectRatio > canvasAspectRatio) {
          width = canvasWidth * 0.8; // 80% of canvas width
          height = width / imgAspectRatio;
        } else {
          height = canvasHeight * 0.8; // 80% of canvas height
          width = height * imgAspectRatio;
        }

        // Center the image
        const x = (canvasWidth - width) / 2;
        const y = (canvasHeight - height) / 2;

        const newImage: UploadedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          src: event.target?.result as string,
          x,
          y,
          width,
          height,
          originalWidth: img.width,
          originalHeight: img.height,
          isLocked: false,
          isSelected: true,
          isResizing: false,
          isMoving: false
        };

        setUploadedImages(prev => [...prev, newImage]);
        setSelectedImageId(newImage.id);
        setIsImageMode(true);

        // Send the uploaded image to other users
        if (socket) {
          socket.emit('whiteboardImageUpload', {
            roomId,
            imageData: event.target?.result as string,
            imageId: newImage.id,
            x: newImage.x,
            y: newImage.y,
            width: newImage.width,
            height: newImage.height,
            userId: user?.id,
            userName: user?.name || 'Anonymous'
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Save current canvas state to history
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save the current canvas state including drawings
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    setDrawingHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), imageData];
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      
      // Clear canvas and restore background images
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render background images
      renderBackgroundImages();
      
      // Restore drawing state
      ctx.putImageData(drawingHistory[newIndex], 0, 0);
      setHistoryIndex(newIndex);

      // Send undo action to other users
      if (socket) {
        socket.emit('whiteboardUndo', {
          roomId,
          userId: user?.id,
          userName: user?.name || 'Anonymous'
        });
      }
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex + 1;
      
      // Clear canvas and restore background images
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render background images
      renderBackgroundImages();
      
      // Restore drawing state
      ctx.putImageData(drawingHistory[newIndex], 0, 0);
      setHistoryIndex(newIndex);

      // Send redo action to other users
      if (socket) {
        socket.emit('whiteboardRedo', {
          roomId,
          userId: user?.id,
          userName: user?.name || 'Anonymous'
        });
      }
    }
  };

  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomSize(value);
    
    const size = parseInt(value);
    if (!isNaN(size) && size > 0 && size <= 50) {
      setBrushSize(size);
    }
  };

  // Image management functions

  const isPointInImage = (point: Point, image: UploadedImage): boolean => {
    return point.x >= image.x && point.x <= image.x + image.width &&
           point.y >= image.y && point.y <= image.y + image.height;
  };

  const getResizeHandle = (point: Point, image: UploadedImage): string | null => {
    const handleSize = 8;
    const handles = {
      'nw': { x: image.x, y: image.y },
      'ne': { x: image.x + image.width - handleSize, y: image.y },
      'sw': { x: image.x, y: image.y + image.height - handleSize },
      'se': { x: image.x + image.width - handleSize, y: image.y + image.height - handleSize }
    };

    for (const [handle, pos] of Object.entries(handles)) {
      if (point.x >= pos.x && point.x <= pos.x + handleSize &&
          point.y >= pos.y && point.y <= pos.y + handleSize) {
        return handle;
      }
    }
    return null;
  };

  const lockImage = (imageId: string) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, isLocked: true, isSelected: false } : img
    ));
    setSelectedImageId(null);
    setIsImageMode(false);
    
    // Send lock action to other users
    if (socket) {
      socket.emit('whiteboardImageLock', {
        roomId,
        imageId,
        userId: user?.id,
        userName: user?.name || 'Anonymous'
      });
    }
  };

  const unlockImage = (imageId: string) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, isLocked: false } : img
    ));
    setIsImageMode(true);
    
    // Send unlock action to other users
    if (socket) {
      socket.emit('whiteboardImageUnlock', {
        roomId,
        imageId,
        userId: user?.id,
        userName: user?.name || 'Anonymous'
      });
    }
  };

  // Render background images (called only when needed)
  const renderBackgroundImages = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only render if there are images and we're not currently drawing
    if (uploadedImages.length === 0) return;

    // Save current canvas state
    ctx.save();
    
    // Clear and fill background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render all images
    uploadedImages.forEach(image => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, image.x, image.y, image.width, image.height);
        
        // Draw selection border and resize handles if selected
        if (image.isSelected && !image.isLocked) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(image.x, image.y, image.width, image.height);
          ctx.setLineDash([]);
          
          // Draw resize handles
          const handleSize = 8;
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(image.x, image.y, handleSize, handleSize);
          ctx.fillRect(image.x + image.width - handleSize, image.y, handleSize, handleSize);
          ctx.fillRect(image.x, image.y + image.height - handleSize, handleSize, handleSize);
          ctx.fillRect(image.x + image.width - handleSize, image.y + image.height - handleSize, handleSize, handleSize);
        }
        
        // Draw lock indicator if image is locked
        if (image.isLocked) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(image.x + 5, image.y + 5, 20, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.fillText('🔒', image.x + 8, image.y + 18);
        }
      };
      img.src = image.src;
    });
    
    // Restore canvas state
    ctx.restore();
  }, [uploadedImages]);

  // Render images on canvas (for image operations)
  const renderImages = useCallback(() => {
    if (isRenderingImages) return; // Prevent recursive rendering
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRenderingImages(true);

    // Clear the canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render all images
    let imagesLoaded = 0;
    const totalImages = uploadedImages.length;
    
    if (totalImages === 0) {
      setIsRenderingImages(false);
      return;
    }

    uploadedImages.forEach(image => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, image.x, image.y, image.width, image.height);
        
        // Draw selection border and resize handles if selected
        if (image.isSelected && !image.isLocked) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(image.x, image.y, image.width, image.height);
          ctx.setLineDash([]);
          
          // Draw resize handles
          const handleSize = 8;
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(image.x, image.y, handleSize, handleSize);
          ctx.fillRect(image.x + image.width - handleSize, image.y, handleSize, handleSize);
          ctx.fillRect(image.x, image.y + image.height - handleSize, handleSize, handleSize);
          ctx.fillRect(image.x + image.width - handleSize, image.y + image.height - handleSize, handleSize, handleSize);
        }
        
        // Draw lock indicator if image is locked
        if (image.isLocked) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(image.x + 5, image.y + 5, 20, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.fillText('🔒', image.x + 8, image.y + 18);
        }
        
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
          setIsRenderingImages(false);
        }
      };
      img.onerror = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
          setIsRenderingImages(false);
        }
      };
      img.src = image.src;
    });
  }, [uploadedImages, isRenderingImages]);

  // Initial render of images
  useEffect(() => {
    if (uploadedImages.length > 0) {
      renderBackgroundImages();
    }
  }, []); // Only run once on mount

  // Re-render images only when images are added/removed or when image operations complete
  useEffect(() => {
    if (uploadedImages.length > 0) {
      renderBackgroundImages();
    }
  }, [uploadedImages.length]); // Only re-render when number of images changes

  return (
    <Card className="bg-white min-h-[480px] flex flex-col">
      {/* Header with toggle functionality */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
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
          {isImageMode && (
            <div className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <span>📷</span>
              <span>Image Mode</span>
            </div>
          )}
        </div>
      </div>

            {/* Whiteboard content */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
                    {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg flex-shrink-0">
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
          
          {/* Custom Size Input */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="50"
              placeholder="Custom"
              value={customSize}
              onChange={handleCustomSizeChange}
              className={`w-16 h-6 px-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                customSize && !brushSizes.includes(parseInt(customSize) || 0) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
            />
            <span className="text-xs text-gray-500">px</span>
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

                    {/* Undo */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="flex items-center gap-2"
            >
              <Undo className="w-4 h-4" />
              <span className="hidden sm:inline">Undo</span>
            </Button>

                    {/* Redo */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= drawingHistory.length - 1}
              className="flex items-center gap-2"
            >
              <Redo className="w-4 h-4" />
              <span className="hidden sm:inline">Redo</span>
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

                    {/* Lock/Unlock Image */}
            {selectedImageId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => lockImage(selectedImageId)}
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Lock</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unlockImage(selectedImageId)}
                  className="flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span className="hidden sm:inline">Unlock</span>
                </Button>
              </>
            )}
      </div>

      {/* Canvas */}
      <div className="relative flex-1 min-h-[320px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full border-2 border-gray-200 rounded-lg cursor-crosshair bg-white touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            handleMouseDown(mouseEvent as any);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            handleMouseMove(mouseEvent as any);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleMouseUp();
          }}
        />
        
        {/* Drawing indicator */}
        {isDrawing && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            Drawing...
          </div>
        )}
      </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600 text-center flex-shrink-0">
            Draw, annotate, and solve problems together. Your changes appear in real-time for all participants.
          </div>
        </div>
    </Card>
  );
};

export default CollaborativeWhiteboard; 