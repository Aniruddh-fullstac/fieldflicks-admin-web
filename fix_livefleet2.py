import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

# Fix activeModal type
old_type = """  const [activeModal, setActiveModal] = useState<{
    court: CourtCamera;
    venueName: string;
    playbackUrl: string;
    secondaryPlaybackUrl?: string;
    dualChannelNote?: string;
  } | null>(null);"""

new_type = """  const [activeModal, setActiveModal] = useState<{
    court: CourtCamera;
    venueName: string;
    playbackUrl: string;
    secondaryPlaybackUrl?: string;
    dualChannelNote?: string;
    playbackUrlCh2?: string;
  } | null>(null);"""

content = content.replace(old_type, new_type)

# Fix Expected 2 arguments, but got 3 for stopLiveStream
# Actually, stopLiveStream in src/services/api.ts was never updated!
# Let's check src/services/api.ts

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

