import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Users, Circle, Mic } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  subject?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

interface ParticipantsListProps {
  roomId: string;
  socket: any;
  user: any;
  participants: Participant[];
  activeSpeakers?: string[];
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  roomId,
  socket,
  user,
  participants,
  activeSpeakers = []
}) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for user join/leave events
    socket.on('userJoined', (userName: string) => {
      console.log('User joined participants:', userName);
      setOnlineUsers(prev => {
        if (!prev.includes(userName)) {
          return [...prev, userName];
        }
        return prev;
      });
    });

    socket.on('userLeft', (userName: string) => {
      console.log('User left participants:', userName);
      setOnlineUsers(prev => prev.filter(name => name !== userName));
    });

    socket.on('currentUsers', (users: string[]) => {
      console.log('Current users in participants:', users);
      setOnlineUsers(users);
    });

    // Add current user to online users if not already there
    if (user?.name && !onlineUsers.includes(user.name)) {
      setOnlineUsers(prev => [...prev, user.name]);
    }

    return () => {
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('currentUsers');
    };
  }, [socket, roomId, user?.name, onlineUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4" />
        <h4 className="font-semibold">Participants ({participants.length})</h4>
      </div>
      
      <div className="space-y-3">
        {/* Show current user first */}
        {user?.name && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
              {/* Speaking indicator */}
              {activeSpeakers.includes(user.id) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium truncate">
                  {user.name}
                  <span className="text-xs text-gray-500 ml-1">(You)</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Circle className="w-2 h-2 fill-current" />
                  <span>Online</span>
                  {activeSpeakers.includes(user.id) && (
                    <span className="text-red-500 font-medium">• Speaking</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show other online users */}
        {onlineUsers
          .filter(userName => userName !== user?.name)
          .map((userName, index) => {
            // Find participant by name to get their ID
            const participant = participants.find(p => p.name === userName);
            const isSpeaking = participant && activeSpeakers.includes(participant.id);
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </div>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">
                      {userName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Circle className="w-2 h-2 fill-current" />
                      <span>Online</span>
                      {isSpeaking && (
                        <span className="text-red-500 font-medium">• Speaking</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Show participants from database */}
        {participants
          .filter(participant => participant.id !== user?.id && !onlineUsers.includes(participant.name))
          .map((participant) => {
            const isOnline = onlineUsers.includes(participant.name) || participant.status === 'online';
            const isSpeaking = activeSpeakers.includes(participant.id);
            
            return (
              <div key={participant.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-semibold">
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">
                      {participant.name}
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${
                      isOnline ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <Circle className={`w-2 h-2 ${isOnline ? 'fill-current' : ''}`} />
                      <span>{getStatusText(isOnline ? 'online' : participant.status)}</span>
                      {isSpeaking && (
                        <span className="text-red-500 font-medium">• Speaking</span>
                      )}
                    </div>
                  </div>
                  {participant.subject && (
                    <div className="text-xs text-gray-500 truncate">{participant.subject}</div>
                  )}
                </div>
              </div>
            );
          })}
        
        {onlineUsers.length === 0 && participants.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No participants yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ParticipantsList; 