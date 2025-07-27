import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface PomodoroTimerProps {
  onSessionComplete?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalFocusTime = settings.focusTime * 60;
  const progress = ((totalFocusTime - timeLeft) / totalFocusTime) * 100;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Session completed
            if (!isBreak) {
              setCompletedSessions(prev => prev + 1);
              const shouldTakeLongBreak = (completedSessions + 1) % settings.longBreakInterval === 0;
              const breakTime = shouldTakeLongBreak ? settings.longBreak : settings.shortBreak;
              setTimeLeft(breakTime * 60);
              setIsBreak(true);
              onSessionComplete?.();
            } else {
              // Break completed, start new focus session
              setTimeLeft(settings.focusTime * 60);
              setIsBreak(false);
            }
            return prev;
          }
          return prev - 1;
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
  }, [isRunning, isBreak, completedSessions, settings, onSessionComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings.focusTime * 60);
    setIsBreak(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const skipSession = () => {
    if (isBreak) {
      setTimeLeft(settings.focusTime * 60);
      setIsBreak(false);
    } else {
      setTimeLeft(settings.shortBreak * 60);
      setIsBreak(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSetting = (key: keyof typeof settings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'focusTime' && !isBreak) {
      setTimeLeft(value * 60);
    }
  };

  return (
    <Card className="p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-brand-purple" />
          <div>
            <h4 className="font-semibold">Pomodoro Session</h4>
            <p className="text-sm text-muted-foreground">Focus time with breaks</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium mb-3">Timer Settings</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Focus Time (min)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.focusTime}
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
                value={settings.shortBreak}
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
                value={settings.longBreak}
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
                value={settings.longBreakInterval}
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
          isBreak ? 'text-green-600' : 'text-brand-purple'
        }`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-muted-foreground">
          {isBreak ? 'Break Time' : 'Focus Time'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${
              isBreak 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-brand-purple to-brand-blue'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{Math.floor(progress)}% complete</span>
          <span>{completedSessions} sessions completed</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={toggleTimer}
          variant={isRunning ? "outline" : "default"}
          size="lg"
          className="flex items-center gap-2"
        >
          {isRunning ? (
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
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </Button>

        <Button
          onClick={skipSession}
          variant="outline"
          size="lg"
        >
          Skip
        </Button>
      </div>

      {/* Session Info */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          {isBreak ? (
            <span>
              Take a {settings.shortBreak}-minute break. 
              {completedSessions % settings.longBreakInterval === 0 && completedSessions > 0 && 
                ` Great job! You've completed ${completedSessions} focus sessions.`
              }
            </span>
          ) : (
            <span>
              Focus session in progress. 
              {completedSessions > 0 && ` You've completed ${completedSessions} sessions so far.`}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PomodoroTimer; 