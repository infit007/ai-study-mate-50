import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from './ui/button';

interface AudioStreamProps {
  roomId: string;
  socket: any;
  user: any;
  isActive: boolean;
  onActiveSpeakersChange: (speakers: string[]) => void;
  callParticipants?: string[];
}

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  audioElement: HTMLAudioElement;
}

const AudioStream: React.FC<AudioStreamProps> = ({
  roomId,
  socket,
  user,
  isActive,
  onActiveSpeakersChange,
  callParticipants = []
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map());
  
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize audio stream
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        } 
      });
      
      setLocalStream(stream);
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Mute local audio to prevent echo
      }
      
      setIsConnected(true);
      console.log('Audio stream initialized');
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      setIsConnected(false);
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming audio streams
    pc.ontrack = (event) => {
      console.log('Received track from peer:', peerId, event.streams[0]);
      
      const audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      audioElement.controls = false;
      audioElement.muted = false; // Ensure audio is not muted
      audioElement.srcObject = event.streams[0];
      
      // Add audio element to DOM so it can play
      document.body.appendChild(audioElement);
      
      // Store peer connection info
      const peerConnection: PeerConnection = {
        peerId,
        connection: pc,
        audioElement
      };
      
      peerConnectionsRef.current.set(peerId, peerConnection);
      setPeerConnections(new Map(peerConnectionsRef.current));
      
      // Update active speakers
      setActiveSpeakers(prev => [...prev, peerId]);
      onActiveSpeakersChange([...activeSpeakers, peerId]);
      
      console.log('Audio element added to DOM for peer:', peerId);
      
      // Try to play the audio
      audioElement.play().catch(error => {
        console.error('Failed to play audio for peer:', peerId, error);
      });
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${peerId}:`, pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        console.log(`WebRTC connection established with ${peerId}`);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log(`WebRTC connection lost with ${peerId}`);
        // Remove peer connection
        peerConnectionsRef.current.delete(peerId);
        setPeerConnections(new Map(peerConnectionsRef.current));
        
        // Remove from active speakers
        setActiveSpeakers(prev => prev.filter(id => id !== peerId));
        onActiveSpeakersChange(activeSpeakers.filter(id => id !== peerId));
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${peerId}:`, pc.iceConnectionState);
    };

    // Handle ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      console.log(`ICE gathering state for ${peerId}:`, pc.iceGatheringState);
    };

    return pc;
  }, [localStream, activeSpeakers, onActiveSpeakersChange]);

  // Start recording and streaming
  const startRecording = useCallback(async () => {
    if (!isConnected || !localStream) {
      await initializeAudio();
      return;
    }

    setIsRecording(true);
    
    // Notify other users that we're starting to speak
    socket.emit('audioStart', {
      roomId,
      userId: user?.id,
      userName: user?.name || 'Anonymous'
    });

    // Add to active speakers
    setActiveSpeakers(prev => [...prev, user?.id]);
    onActiveSpeakersChange([...activeSpeakers, user?.id]);

    console.log('Started audio streaming');
  }, [isConnected, localStream, initializeAudio, socket, roomId, user, activeSpeakers, onActiveSpeakersChange]);

  // Stop recording and streaming
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    
    // Notify other users that we stopped speaking
    socket.emit('audioStop', {
      roomId,
      userId: user?.id,
      userName: user?.name || 'Anonymous'
    });

    // Remove from active speakers
    setActiveSpeakers(prev => prev.filter(id => id !== user?.id));
    onActiveSpeakersChange(activeSpeakers.filter(id => id !== user?.id));

    console.log('Stopped audio streaming');
  }, [socket, roomId, user, activeSpeakers, onActiveSpeakersChange]);

  // Handle mouse/touch events for recording
  const handleMouseDown = () => {
    if (isActive) {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  const handleMouseLeave = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  // Test audio playback
  const testAudioPlayback = () => {
    const testAudio = new Audio();
    testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    testAudio.play().then(() => {
      console.log('Test audio played successfully');
    }).catch(error => {
      console.error('Test audio failed:', error);
    });
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle new user joining the room
    socket.on('userJoined', async (data: { userId: string; userName: string }) => {
      if (data.userId === user?.id) return; // Don't connect to self
      
      // Only create peer connection if both users are in the call
      if (callParticipants.length > 0 && !callParticipants.includes(data.userId)) {
        console.log('User not in call, skipping peer connection:', data.userId);
        return;
      }
      
      console.log('New user joined, creating peer connection:', data.userId);
      
      // Wait a bit for the user to be ready
      setTimeout(async () => {
        const pc = createPeerConnection(data.userId);
        
        // Create and send offer
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          console.log('Sending offer to:', data.userId);
          socket.emit('audioOffer', {
            roomId,
            targetUserId: data.userId,
            offer
          });
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      }, 1000);
    });

    // Handle audio offer
    socket.on('audioOffer', async (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.fromUserId === user?.id) return; // Don't handle own offer
      
      console.log('Received audio offer from:', data.fromUserId);
      const pc = createPeerConnection(data.fromUserId);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log('Sending answer to:', data.fromUserId);
        socket.emit('audioAnswer', {
          roomId,
          targetUserId: data.fromUserId,
          answer
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Handle audio answer
    socket.on('audioAnswer', async (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      if (data.fromUserId === user?.id) return; // Don't handle own answer
      
      console.log('Received audio answer from:', data.fromUserId);
      const peerConnection = peerConnectionsRef.current.get(data.fromUserId);
      
      if (peerConnection) {
        try {
          await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('Remote description set for peer:', data.fromUserId);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      } else {
        console.warn('No peer connection found for answer from:', data.fromUserId);
      }
    });

    // Handle ICE candidates
    socket.on('audioIceCandidate', async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (data.fromUserId === user?.id) return; // Don't handle own ICE candidate
      
      const peerConnection = peerConnectionsRef.current.get(data.fromUserId);
      if (peerConnection) {
        try {
          await peerConnection.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Handle user leaving
    socket.on('userLeft', (data: { userId: string; userName: string }) => {
      const peerConnection = peerConnectionsRef.current.get(data.userId);
      if (peerConnection) {
        peerConnection.connection.close();
        // Remove audio element from DOM
        if (peerConnection.audioElement.parentNode) {
          peerConnection.audioElement.parentNode.removeChild(peerConnection.audioElement);
        }
        peerConnectionsRef.current.delete(data.userId);
        setPeerConnections(new Map(peerConnectionsRef.current));
        
        // Remove from active speakers
        setActiveSpeakers(prev => prev.filter(id => id !== data.userId));
        onActiveSpeakersChange(activeSpeakers.filter(id => id !== data.userId));
      }
    });

    // Handle audio start/stop events
    socket.on('audioStarted', (data: { userId: string; userName: string }) => {
      if (data.userId === user?.id) return;
      setActiveSpeakers(prev => [...prev, data.userId]);
      onActiveSpeakersChange([...activeSpeakers, data.userId]);
    });

    socket.on('audioStopped', (data: { userId: string; userName: string }) => {
      if (data.userId === user?.id) return;
      setActiveSpeakers(prev => prev.filter(id => id !== data.userId));
      onActiveSpeakersChange(activeSpeakers.filter(id => id !== data.userId));
    });

    // Cleanup
    return () => {
      socket.off('userJoined');
      socket.off('audioOffer');
      socket.off('audioAnswer');
      socket.off('audioIceCandidate');
      socket.off('userLeft');
      socket.off('audioStarted');
      socket.off('audioStopped');
    };
  }, [socket, user, createPeerConnection, activeSpeakers, onActiveSpeakersChange]);

  // Initialize audio on mount
  useEffect(() => {
    if (isActive) {
      initializeAudio();
    }
  }, [isActive, initializeAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections and remove audio elements
      peerConnectionsRef.current.forEach((peerConnection) => {
        peerConnection.connection.close();
        // Remove audio element from DOM
        if (peerConnection.audioElement.parentNode) {
          peerConnection.audioElement.parentNode.removeChild(peerConnection.audioElement);
        }
      });
      peerConnectionsRef.current.clear();
    };
  }, [localStream]);

  // Add ICE candidate handling
  useEffect(() => {
    peerConnectionsRef.current.forEach((peerConnection) => {
      peerConnection.connection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('audioIceCandidate', {
            roomId,
            targetUserId: peerConnection.peerId,
            candidate: event.candidate
          });
        }
      };
    });
  }, [socket, roomId]);

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Hidden audio element for local stream */}
      <audio ref={localAudioRef} autoPlay muted />
      
      {/* Microphone button */}
      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        className={`relative ${isRecording ? 'animate-pulse' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={!isConnected}
      >
        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      
      {/* Connection status */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Mic Ready' : 'Mic Disconnected'}
        </span>
      </div>
      
      {/* Active speakers indicator */}
      {activeSpeakers.length > 0 && (
        <div className="flex items-center gap-1">
          <Volume2 className="h-3 w-3 text-green-500" />
          <span className="text-xs text-muted-foreground">
            {activeSpeakers.length} speaking
          </span>
        </div>
      )}
      
      {/* Debug info */}
      <div className="text-xs text-gray-500">
        Peers: {peerConnections.size}
      </div>
      
      {/* Test audio button */}
      <Button
        variant="outline"
        size="sm"
        onClick={testAudioPlayback}
        className="text-xs"
      >
        Test Audio
      </Button>
    </div>
  );
};

export default AudioStream; 