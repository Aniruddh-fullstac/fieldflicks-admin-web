import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

old_join = """  const handleJoinStream = (court: CourtCamera, venueName: string) => {
    if (!court.livePlaybackUrl) return;
    setActiveModal({
      court,
      venueName,
      playbackUrl: court.livePlaybackUrl,
    });
  };"""

new_join = """  const handleJoinStream = (court: CourtCamera, venueName: string, channel: number = 1) => {
    const url = channel === 2 ? court.livePlaybackUrlCh2 : court.livePlaybackUrl;
    if (!url) return;
    setActiveModal({
      court,
      venueName,
      playbackUrl: url,
    });
  };"""

content = content.replace(old_join, new_join)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

