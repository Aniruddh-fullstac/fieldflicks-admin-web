import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

old_join = """  const handleJoinStream = (court: CourtCamera, venueName: string, channel?: number) => {
    const url = court.livePlaybackUrl || `https://stream.mux.com/live-${court.cameraId}.m3u8`;
    setActiveModal({
      court,
      venueName,
      playbackUrl: url,
    });
  };"""

new_join = """  const handleJoinStream = (court: CourtCamera, venueName: string, channel?: number) => {
    const url = channel === 2 
      ? (court.livePlaybackUrlCh2 || `https://stream.mux.com/live-${court.cameraId}.m3u8`) 
      : (court.livePlaybackUrl || `https://stream.mux.com/live-${court.cameraId}.m3u8`);
    setActiveModal({
      court,
      venueName,
      playbackUrl: url,
    });
  };"""

content = content.replace(old_join, new_join)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

