import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

old_stop_body = """      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          courts: v.courts.map((c) =>
            c.cameraId === court.cameraId
              ? { ...c, isLiveStreaming: false, status: 'ONLINE', livePlaybackUrl: undefined }
              : c
          ),
        }))
      );
      if (activeModal?.court.cameraId === court.cameraId) {
        setActiveModal(null);
      }"""

new_stop_body = """      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          courts: v.courts.map((c) => {
            if (c.cameraId !== court.cameraId) return c;
            if (channel === 2) {
              return { ...c, isLiveStreamingCh2: false, livePlaybackUrlCh2: undefined, status: c.isLiveStreaming ? 'STREAMING' : 'ONLINE' };
            }
            return { ...c, isLiveStreaming: false, livePlaybackUrl: undefined, status: c.isLiveStreamingCh2 ? 'STREAMING' : 'ONLINE' };
          }),
        }))
      );
      if (activeModal && activeModal.court.cameraId === court.cameraId) {
        setActiveModal((prev) => {
          if (!prev) return null;
          if (channel === 2) {
            return { ...prev, court: { ...prev.court, isLiveStreamingCh2: false } };
          }
          return { ...prev, court: { ...prev.court, isLiveStreaming: false } };
        });
      }"""

content = content.replace(old_stop_body, new_stop_body)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

