# Audio Streaming Debugging Guide

## Issue: Users can't hear each other

### 🔍 **Step-by-Step Debugging Process**

#### 1. **Check Browser Console**
Open browser console (F12) and look for these logs:

**Expected Logs:**
```
✅ Audio stream initialized
✅ New user joined, creating peer connection: [userId]
✅ Sending offer to: [userId]
✅ Received audio offer from: [userId]
✅ Sending answer to: [userId]
✅ Received audio answer from: [userId]
✅ Remote description set for peer: [userId]
✅ WebRTC connection established with [userId]
✅ Received track from peer: [userId]
✅ Audio element added to DOM for peer: [userId]
```

**If you see errors, note them down.**

#### 2. **Test Audio Playback**
- Click the "Test Audio" button next to the microphone
- You should hear a short beep sound
- If no sound, check:
  - Browser audio settings
  - System volume
  - Browser permissions

#### 3. **Test Microphone Echo**
- Click and hold the microphone button
- Speak into your microphone
- You should hear yourself (echo test)
- If no echo, microphone isn't working

#### 4. **Check WebRTC Connection Status**
Look for these connection states in console:
```
Peer connection state for [userId]: connecting
Peer connection state for [userId]: connected
ICE connection state for [userId]: connected
```

#### 5. **Check Backend Logs**
In your backend terminal, look for:
```
✅ User joined room [roomId]
✅ Audio offer from [userId] to [userId] in room [roomId]
✅ Audio offer forwarded to [userId]
✅ Audio answer from [userId] to [userId] in room [roomId]
✅ Audio answer forwarded to [userId]
```

### 🛠️ **Common Issues and Solutions**

#### **Issue 1: No Audio Playback**
**Symptoms:** Test audio button doesn't work
**Solutions:**
- Check browser audio permissions
- Ensure system volume is up
- Try different browser
- Check if browser blocks autoplay

#### **Issue 2: Microphone Not Working**
**Symptoms:** No echo when speaking
**Solutions:**
- Grant microphone permissions
- Check microphone settings
- Try different microphone
- Restart browser

#### **Issue 3: WebRTC Connection Fails**
**Symptoms:** Connection state stays "connecting" or "failed"
**Solutions:**
- Check firewall settings
- Try different network
- Use STUN/TURN servers
- Check NAT type

#### **Issue 4: No Peer Connections**
**Symptoms:** "Peers: 0" in debug info
**Solutions:**
- Check if users are in same room
- Verify socket connection
- Check backend logs for user join events

#### **Issue 5: Audio Elements Not Created**
**Symptoms:** No "Audio element added to DOM" logs
**Solutions:**
- Check if ontrack event fires
- Verify WebRTC connection established
- Check for JavaScript errors

### 🔧 **Manual Testing Steps**

#### **Test 1: Single User Test**
1. Open room in one browser tab
2. Click "Test Audio" - should hear beep
3. Click and hold microphone - should hear echo
4. Check console for all expected logs

#### **Test 2: Two User Test**
1. Open room in two different browser tabs/windows
2. Grant permissions in both
3. Check console for peer connection logs
4. Try speaking in one tab, listen in other
5. Check for "Received track" logs

#### **Test 3: Network Test**
1. Try on different networks
2. Check if behind corporate firewall
3. Try with VPN on/off
4. Test on mobile vs desktop

### 📊 **Debug Information to Collect**

When reporting issues, include:

1. **Browser Information:**
   - Browser name and version
   - Operating system
   - Network type (WiFi/Cellular)

2. **Console Logs:**
   - All WebRTC connection logs
   - Any error messages
   - Audio element creation logs

3. **Backend Logs:**
   - User join/leave events
   - WebRTC signaling events
   - Any error messages

4. **Network Information:**
   - NAT type (if known)
   - Firewall settings
   - Corporate network restrictions

### 🚀 **Quick Fixes to Try**

#### **Fix 1: Refresh and Reconnect**
1. Refresh both browser tabs
2. Rejoin the room
3. Grant permissions again
4. Try audio test

#### **Fix 2: Clear Browser Data**
1. Clear browser cache and cookies
2. Clear site data for localhost
3. Restart browser
4. Try again

#### **Fix 3: Check Permissions**
1. Go to browser settings
2. Find microphone permissions
3. Ensure localhost is allowed
4. Try again

#### **Fix 4: Restart Backend**
1. Stop backend server (Ctrl+C)
2. Restart backend server (`npm start`)
3. Refresh frontend
4. Try again

### 📞 **Getting Help**

If issues persist, provide:
1. Complete console logs from both users
2. Backend server logs
3. Browser and OS information
4. Network environment details
5. Steps to reproduce the issue

### 🔮 **Advanced Debugging**

#### **Enable Detailed WebRTC Logging**
Add this to browser console:
```javascript
localStorage.setItem('webrtc_debug', 'true');
```

#### **Check WebRTC Stats**
In browser console:
```javascript
// Get connection stats
const pc = peerConnectionsRef.current.get('userId');
if (pc) {
  pc.getStats().then(stats => {
    stats.forEach(report => console.log(report));
  });
}
```

#### **Test STUN Servers**
Try different STUN servers in AudioStream.tsx:
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};
``` 