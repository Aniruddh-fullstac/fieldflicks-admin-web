import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

# Remove handleStopDualStream
content = re.sub(r'  const handleStopDualStream = async \(court: CourtCamera, venueName: string\) => \{.*?\n  \};\n', '', content, flags=re.DOTALL)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

