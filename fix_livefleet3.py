import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

# Fix handleStopStream signature
old_stop = """  const handleStopStream = async (court: CourtCamera, venueName: string) => {
    setActionLoadingId(court.cameraId);
    try {
      await AdminApi.stopLiveStream(court.cameraId);"""

new_stop = """  const handleStopStream = async (court: CourtCamera, venueName: string, channel?: number) => {
    const loadId = channel ? `${court.cameraId}-ch${channel}` : court.cameraId;
    setActionLoadingId(loadId);
    try {
      await AdminApi.stopLiveStream(court.cameraId, channel);"""

content = content.replace(old_stop, new_stop)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

