import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import AudioStream from './AudioStream';

interface CallButtonProps {
  roomId: string;
  socket: any;
  user: any;
  participants: any[];
}

interface CallParticipant {
  userId: string;
  userName: string;
  joinedAt: Date;
}

const CallButton: React.FC<CallButtonProps> = ({
  roomId,
  socket,
  user,
  participants
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callParticipants, setCallParticipants] = useState<CallParticipant[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for call events
    socket.on('callStarted', (data: { startedBy: string; startedByUser: string }) => {
      setIsCallActive(true);
      setCallParticipants([{
        userId: data.startedBy,
        userName: data.startedByUser,
        joinedAt: new Date()
      }]);
      console.log('Call started by:', data.startedByUser);
    });

    socket.on('callEnded', () => {
      setIsCallActive(false);
      setCallParticipants([]);
      setActiveSpeakers([]);
      console.log('Call ended');
    });

    socket.on('userJoinedCall', (data: { userId: string; userName: string }) => {
      setCallParticipants(prev => {
        const existing = prev.find(p => p.userId === data.userId);
        if (!existing) {
          return [...prev, {
            userId: data.userId,
            userName: data.userName,
            joinedAt: new Date()
          }];
        }
        return prev;
      });
      console.log('User joined call:', data.userName);
    });

    socket.on('userLeftCall', (data: { userId: string; userName: string }) => {
      setCallParticipants(prev => prev.filter(p => p.userId !== data.userId));
      setActiveSpeakers(prev => prev.filter(id => id !== data.userId));
      console.log('User left call:', data.userName);
    });

    // Cleanup
    return () => {
      socket.off('callStarted');
      socket.off('callEnded');
      socket.off('userJoinedCall');
      socket.off('userLeftCall');
    };
  }, [socket]);

  const startCall = () => {
    if (!socket || !user) return;
    
    socket.emit('startCall', {
      roomId,
      userId: user.id,
      userName: user.name || 'Anonymous'
    });
    
    setIsCallActive(true);
    setCallParticipants([{
      userId: user.id,
      userName: user.name || 'Anonymous',
      joinedAt: new Date()
    }]);
    
    console.log('Starting call...');
  };

  const endCall = () => {
    if (!socket) return;
    
    socket.emit('endCall', {
      roomId,
      userId: user.id,
      userName: user.name || 'Anonymous'
    });
    
    setIsCallActive(false);
    setCallParticipants([]);
    setActiveSpeakers([]);
    
    console.log('Ending call...');
  };

  const joinCall = () => {
    if (!socket || !user) return;
    
    socket.emit('joinCall', {
      roomId,
      userId: user.id,
      userName: user.name || 'Anonymous'
    });
    
    setCallParticipants(prev => {
      const existing = prev.find(p => p.userId === user.id);
      if (!existing) {
        return [...prev, {
          userId: user.id,
          userName: user.name || 'Anonymous',
          joinedAt: new Date()
        }];
      }
      return prev;
    });
    
    console.log('Joining call...');
  };

  const leaveCall = () => {
    if (!socket || !user) return;
    
    socket.emit('leaveCall', {
      roomId,
      userId: user.id,
      userName: user.name || 'Anonymous'
    });
    
    setCallParticipants(prev => prev.filter(p => p.userId !== user.id));
    setActiveSpeakers(prev => prev.filter(id => id !== user.id));
    
    console.log('Leaving call...');
  };

  const isUserInCall = callParticipants.some(p => p.userId === user?.id);
  const isCallCreator = callParticipants.length > 0 && callParticipants[0].userId === user?.id;

  return (
    <div className="flex flex-col gap-2">
      {/* Call Status */}
      {isCallActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Active Call</span>
              <Badge variant="secondary" className="text-xs">
                {callParticipants.length} participants
              </Badge>
            </div>
            {isCallCreator && (
              <Button
                variant="destructive"
                size="sm"
                onClick={endCall}
                className="text-xs"
              >
                <PhoneOff className="w-3 h-3 mr-1" />
                End Call
              </Button>
            )}
          </div>
          
          {/* Call Participants */}
          <div className="space-y-1">
            {callParticipants.map((participant) => (
              <div key={participant.userId} className="flex items-center justify-between text-xs">
                <span className="text-gray-700">
                  {participant.userName}
                  {participant.userId === user?.id && ' (You)'}
                  {participant.userId === callParticipants[0].userId && ' (Host)'}
                </span>
                {activeSpeakers.includes(participant.userId) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600">Speaking</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="flex gap-2">
        {!isCallActive ? (
          <Button
            onClick={startCall}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-2" />
            Start Call
          </Button>
        ) : !isUserInCall ? (
          <Button
            onClick={joinCall}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-2" />
            Join Call
          </Button>
        ) : (
          <Button
            onClick={leaveCall}
            variant="outline"
            size="sm"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            Leave Call
          </Button>
        )}
      </div>

      {/* Audio Stream (only show when user is in call) */}
      {isUserInCall && (
        <div className="border-t pt-2">
          <AudioStream
            roomId={roomId}
            socket={socket}
            user={user}
            isActive={isUserInCall}
            onActiveSpeakersChange={setActiveSpeakers}
            callParticipants={callParticipants.map(p => p.userId)}
          />
        </div>
      )}
    </div>
  );
};

export default CallButton; 