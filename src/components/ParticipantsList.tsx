import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Users, Circle } from 'lucide-react';

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
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  roomId,
  socket,
  user,
  participants
}) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for user join/leave events
    socket.on('userJoined', (userName: string) => {
      setOnlineUsers(prev => [...prev, userName]);
    });

    socket.on('userLeft', (userName: string) => {
      setOnlineUsers(prev => prev.filter(name => name !== userName));
    });

    // Get initial online users
    socket.emit('getOnlineUsers', roomId);

    socket.on('onlineUsers', (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('onlineUsers');
    };
  }, [socket, roomId]);

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
        {participants.map((participant) => {
          const isOnline = onlineUsers.includes(participant.name) || participant.status === 'online';
          const isCurrentUser = participant.id === user?.id;
          
          return (
            <div key={participant.id} className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <div className="w-full h-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-sm font-semibold">
                    {participant.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium truncate">
                    {participant.name}
                    {isCurrentUser && <span className="text-xs text-gray-500 ml-1">(You)</span>}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    isOnline ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <Circle className={`w-2 h-2 ${isOnline ? 'fill-current' : ''}`} />
                    <span>{getStatusText(isOnline ? 'online' : participant.status)}</span>
                  </div>
                </div>
                {participant.subject && (
                  <div className="text-xs text-gray-500 truncate">{participant.subject}</div>
                )}
              </div>
            </div>
          );
        })}
        
        {participants.length === 0 && (
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