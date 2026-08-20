import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

# Remove handleStartDualStream
content = re.sub(r'  const handleStartDualStream = async \(court: CourtCamera, venue: VenueFleet\) => \{.*?\n  \};\n', '', content, flags=re.DOTALL)

# Add playbackUrlCh2 to activeModal state type
# Search for: const [activeModal, setActiveModal] = useState<{ court: CourtCamera; venueName: string; playbackUrl: string; secondaryPlaybackUrl?: string; dualChannelNote?: string } | null>(null);
old_state = 'const [activeModal, setActiveModal] = useState<{ court: CourtCamera; venueName: string; playbackUrl: string; secondaryPlaybackUrl?: string; dualChannelNote?: string } | null>(null);'
new_state = 'const [activeModal, setActiveModal] = useState<{ court: CourtCamera; venueName: string; playbackUrl: string; secondaryPlaybackUrl?: string; dualChannelNote?: string; playbackUrlCh2?: string } | null>(null);'
content = content.replace(old_state, new_state)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)
