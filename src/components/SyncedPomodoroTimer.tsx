import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface SyncedPomodoroTimerProps {
  roomId: string;
  socket: any;
  user: any;
  onSessionComplete?: () => void;
}

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  completedSessions: number;
  settings: {
    focusTime: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
  };
  lastSyncTime: number;
}

const SyncedPomodoroTimer: React.FC<SyncedPomodoroTimerProps> = ({ 
  roomId, 
  socket, 
  user, 
  onSessionComplete 
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 25 * 60,
    isRunning: false,
    isBreak: false,
    completedSessions: 0,
    settings: {
      focusTime: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4
    },
    lastSyncTime: Date.now()
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [isController, setIsController] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalFocusTime = timerState.settings.focusTime * 60;
  const progress = ((totalFocusTime - timerState.timeLeft) / totalFocusTime) * 100;

  // Listen for timer sync events
  useEffect(() => {
    if (!socket) return;

    socket.on('timerSync', (data: TimerState) => {
      console.log('Received timer sync:', data);
      setTimerState(data);
    });

    socket.on('timerControl', (data: { action: string; userId: string }) => {
      console.log('Timer control received:', data);
      if (data.userId !== user?.id) {
        // Someone else is controlling the timer
        setIsController(false);
      }
    });

    socket.on('timerSettingsUpdate', (data: TimerState['settings']) => {
      console.log('Timer settings updated:', data);
      setTimerState(prev => ({
        ...prev,
        settings: data
      }));
    });

    // Request current timer state when joining
    socket.emit('requestTimerState', { roomId });

    return () => {
      socket.off('timerSync');
      socket.off('timerControl');
      socket.off('timerSettingsUpdate');
    };
  }, [socket, roomId, user?.id]);

  // Timer logic
  useEffect(() => {
    if (timerState.isRunning && isController) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            // Session completed
            if (!prev.isBreak) {
              const newCompletedSessions = prev.completedSessions + 1;
              const shouldTakeLongBreak = newCompletedSessions % prev.settings.longBreakInterval === 0;
              const breakTime = shouldTakeLongBreak ? prev.settings.longBreak : prev.settings.shortBreak;
              
              const newState = {
                ...prev,
                timeLeft: breakTime * 60,
                isBreak: true,
                completedSessions: newCompletedSessions,
                lastSyncTime: Date.now()
              };
              
              // Sync to other users
              socket.emit('timerSync', { roomId, timerState: newState });
              onSessionComplete?.();
              
              return newState;
            } else {
              // Break completed, start new focus session
              const newState = {
                ...prev,
                timeLeft: prev.settings.focusTime * 60,
                isBreak: false,
                lastSyncTime: Date.now()
              };
              
              // Sync to other users
              socket.emit('timerSync', { roomId, timerState: newState });
              
              return newState;
            }
          }
          
          const newState = {
            ...prev,
            timeLeft: newTimeLeft,
            lastSyncTime: Date.now()
          };
          
          // Sync every 5 seconds to keep everyone in sync
          if (newTimeLeft % 5 === 0) {
            socket.emit('timerSync', { roomId, timerState: newState });
          }
          
          return newState;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, isController, socket, roomId, onSessionComplete]);

  const toggleTimer = () => {
    if (!isController) {
      // Request control
      socket.emit('timerControl', { 
        roomId, 
        action: 'request', 
        userId: user?.id 
      });
      setIsController(true);
    }
    
    const newState = {
      ...timerState,
      isRunning: !timerState.isRunning,
      lastSyncTime: Date.now()
    };
    
    setTimerState(newState);
    socket.emit('timerSync', { roomId, timerState: newState });
    socket.emit('timerControl', { 
      roomId, 
      action: timerState.isRunning ? 'pause' : 'start', 
      userId: user?.id 
    });
  };

  const resetTimer = () => {
    if (!isController) {
      socket.emit('timerControl', { 
        roomId, 
        action: 'request', 
        userId: user?.id 
      });
      setIsController(true);
    }
    
    const newState = {
      ...timerState,
      timeLeft: timerState.settings.focusTime * 60,
      isRunning: false,
      isBreak: false,
      lastSyncTime: Date.now()
    };
    
    setTimerState(newState);
    socket.emit('timerSync', { roomId, timerState: newState });
    socket.emit('timerControl', { 
      roomId, 
      action: 'reset', 
      userId: user?.id 
    });
  };

  const skipSession = () => {
    if (!isController) {
      socket.emit('timerControl', { 
        roomId, 
        action: 'request', 
        userId: user?.id 
      });
      setIsController(true);
    }
    
    let newState;
    if (timerState.isBreak) {
      newState = {
        ...timerState,
        timeLeft: timerState.settings.focusTime * 60,
        isBreak: false,
        lastSyncTime: Date.now()
      };
    } else {
      newState = {
        ...timerState,
        timeLeft: timerState.settings.shortBreak * 60,
        isBreak: true,
        lastSyncTime: Date.now()
      };
    }
    
    setTimerState(newState);
    socket.emit('timerSync', { roomId, timerState: newState });
    socket.emit('timerControl', { 
      roomId, 
      action: 'skip', 
      userId: user?.id 
    });
  };

  const updateSetting = (key: keyof TimerState['settings'], value: number) => {
    if (!isController) {
      socket.emit('timerControl', { 
        roomId, 
        action: 'request', 
        userId: user?.id 
      });
      setIsController(true);
    }
    
    const newSettings = { ...timerState.settings, [key]: value };
    const newState = {
      ...timerState,
      settings: newSettings,
      lastSyncTime: Date.now()
    };
    
    if (key === 'focusTime' && !timerState.isBreak) {
      newState.timeLeft = value * 60;
    }
    
    setTimerState(newState);
    socket.emit('timerSettingsUpdate', { roomId, settings: newSettings });
    socket.emit('timerSync', { roomId, timerState: newState });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-brand-purple" />
          <div>
            <h4 className="font-semibold">Pomodoro Session</h4>
            <p className="text-sm text-muted-foreground">
              {isController ? 'You control the timer' : 'Timer controlled by another user'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2"
          disabled={!isController}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && isController && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium mb-3">Timer Settings</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Focus Time (min)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={timerState.settings.focusTime}
                onChange={(e) => updateSetting('focusTime', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Break (min)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={timerState.settings.shortBreak}
                onChange={(e) => updateSetting('shortBreak', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Long Break (min)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={timerState.settings.longBreak}
                onChange={(e) => updateSetting('longBreak', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Long Break Interval</label>
              <input
                type="number"
                min="1"
                max="10"
                value={timerState.settings.longBreakInterval}
                onChange={(e) => updateSetting('longBreakInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold mb-2 ${
          timerState.isBreak ? 'text-green-600' : 'text-brand-purple'
        }`}>
          {formatTime(timerState.timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground">
          {timerState.isBreak ? 'Break Time' : 'Focus Time'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${
              timerState.isBreak 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-brand-purple to-brand-blue'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{Math.floor(progress)}% complete</span>
          <span>{timerState.completedSessions} sessions completed</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={toggleTimer}
          variant={timerState.isRunning ? "outline" : "default"}
          size="lg"
          className="flex items-center gap-2"
          disabled={!isController}
        >
          {timerState.isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start
            </>
          )}
        </Button>

        <Button
          onClick={resetTimer}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
          disabled={!isController}
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </Button>

        <Button
          onClick={skipSession}
          variant="outline"
          size="lg"
          disabled={!isController}
        >
          Skip
        </Button>
      </div>

      {/* Session Info */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          {timerState.isBreak ? (
            <span>
              Take a {timerState.settings.shortBreak}-minute break. 
              {timerState.completedSessions % timerState.settings.longBreakInterval === 0 && timerState.completedSessions > 0 && 
                ` Great job! You've completed ${timerState.completedSessions} focus sessions.`
              }
            </span>
          ) : (
            <span>
              Focus session in progress. 
              {timerState.completedSessions > 0 && ` You've completed ${timerState.completedSessions} sessions so far.`}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SyncedPomodoroTimer; 