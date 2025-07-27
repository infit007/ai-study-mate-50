# Real-Time Audio Streaming Feature

## Overview

The StudySync application now includes real-time audio streaming capabilities that allow users to communicate via voice in study rooms. This feature uses WebRTC for low-latency peer-to-peer audio transmission.

## Features

### 🎤 **Microphone Button**
- Located next to the chat send button in both chat and whiteboard interfaces
- Click and hold to start recording
- Release to stop recording
- Real-time audio streaming to all participants in the room

### 🔊 **Active Speaker Indicators**
- Visual indicators show who is currently speaking
- Red microphone icon with pulsing animation
- "Speaking" status text in participants list
- Real-time updates across all connected users

### 🌐 **WebRTC Technology**
- Peer-to-peer audio transmission for minimal latency
- No audio storage or database persistence
- Automatic connection management
- ICE candidate handling for NAT traversal

## How It Works

### 1. **Audio Capture**
- Uses `getUserMedia()` API to access microphone
- Configures audio with echo cancellation, noise suppression, and auto gain control
- Streams audio in real-time without saving

### 2. **WebRTC Signaling**
- Socket.IO handles WebRTC signaling (offer/answer/ICE candidates)
- Automatic peer connection establishment
- Room-based user discovery and connection

### 3. **Real-Time Broadcasting**
- Audio streams instantly to all participants
- No buffering or delay
- Multiple simultaneous speakers supported

## Technical Implementation

### Frontend Components

#### `AudioStream.tsx`
- Main audio streaming component
- Handles microphone access and WebRTC connections
- Manages recording state and UI feedback

#### `RoomDetails.tsx`
- Integrates audio streaming into chat interfaces
- Manages active speakers state
- Passes audio data to participants list

#### `ParticipantsList.tsx`
- Shows active speaker indicators
- Visual feedback for who is currently speaking
- Real-time status updates

### Backend Socket Events

#### Audio Control Events
- `audioStart`: User starts speaking
- `audioStop`: User stops speaking

#### WebRTC Signaling Events
- `audioOffer`: Sends WebRTC offer to peer
- `audioAnswer`: Sends WebRTC answer to peer
- `audioIceCandidate`: Exchanges ICE candidates

#### User Management Events
- `userJoined`: New user joins room (includes userId for WebRTC)
- `userLeft`: User leaves room

## Usage Instructions

### For Users

1. **Join a Study Room**
   - Navigate to any study room
   - Grant microphone permissions when prompted

2. **Start Speaking**
   - Click and hold the microphone button (🎤)
   - Speak naturally - audio streams in real-time
   - Release to stop speaking

3. **Visual Feedback**
   - See who is currently speaking in the participants list
   - Red microphone icon indicates active speakers
   - "Speaking" status appears next to active users

### For Developers

#### Adding Audio to New Components

```tsx
import AudioStream from '@/components/AudioStream';

// In your component
<AudioStream
  roomId={roomId}
  socket={socket}
  user={user}
  isActive={true}
  onActiveSpeakersChange={setActiveSpeakers}
/>
```

#### Handling Active Speakers

```tsx
const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);

// Pass to components that need speaker info
<ParticipantsList
  participants={participants}
  activeSpeakers={activeSpeakers}
/>
```

## Browser Compatibility

### Supported Browsers
- Chrome 66+
- Firefox 60+
- Safari 11+
- Edge 79+

### Requirements
- HTTPS connection (required for getUserMedia)
- Microphone permissions
- WebRTC support

## Troubleshooting

### Common Issues

1. **Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Try refreshing the page

2. **No Audio from Other Users**
   - Check WebRTC connection status
   - Verify room membership
   - Check browser console for errors

3. **High Latency**
   - Check internet connection
   - Verify WebRTC ICE servers
   - Consider network firewall settings

### Debug Information

Enable console logging to see:
- WebRTC connection status
- Audio stream initialization
- Socket event transmission
- Peer connection establishment

## Security Considerations

- Audio is not stored or recorded
- WebRTC connections are peer-to-peer
- No server-side audio processing
- User consent required for microphone access

## Performance Notes

- Optimized for low-latency communication
- Automatic audio quality adjustment
- Efficient peer connection management
- Minimal bandwidth usage

## Future Enhancements

- Audio quality settings
- Mute/unmute functionality
- Audio recording (optional)
- Screen sharing integration
- Video calling capabilities 