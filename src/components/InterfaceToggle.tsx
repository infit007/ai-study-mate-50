import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Palette } from 'lucide-react';

interface InterfaceToggleProps {
  currentMode: 'chat' | 'whiteboard';
  onToggle: () => void;
}

const InterfaceToggle: React.FC<InterfaceToggleProps> = ({
  currentMode,
  onToggle
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">Interface:</span>
      <div className="flex bg-white rounded-md p-1 shadow-sm">
        <Button
          variant={currentMode === 'chat' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => currentMode !== 'chat' && onToggle()}
          className="flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </Button>
        <Button
          variant={currentMode === 'whiteboard' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => currentMode !== 'whiteboard' && onToggle()}
          className="flex items-center gap-2"
        >
          <Palette className="w-4 h-4" />
          <span className="hidden sm:inline">Whiteboard</span>
        </Button>
      </div>
    </div>
  );
};

export default InterfaceToggle; 