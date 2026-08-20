import re

with open('src/views/TournamentsView.tsx', 'r') as f:
    content = f.read()

old_stop = """  const handleStopStream = async (tournament: Tournament, cameraId: string) => {
    setStreamLoadingId(cameraId);
    try {
      await AdminApi.stopLiveStream(cameraId);
      const existing = tournament.liveStreams ?? [];
      const nextStreams: TournamentLiveStream[] = [
        ...existing.filter((s) => s.cameraId !== cameraId),
        {
          ...existing.find((s) => s.cameraId === cameraId)!,
          isLive: false,
        },
      ];
      await persistLiveStreams(tournament, nextStreams);
      if (activeStreamModal && activeStreamModal.court.cameraId === cameraId) {
        setActiveStreamModal((prev) => (prev ? { ...prev, court: { ...prev.court, isLiveStreaming: false } } : null));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to stop stream');
    } finally {
      setStreamLoadingId(null);
    }
  };"""

new_stop = """  const handleStopStream = async (tournament: Tournament, cameraId: string) => {
    setStreamLoadingId(cameraId);
    try {
      const isCh2 = cameraId.endsWith('_ch2');
      const baseCameraId = cameraId.replace('_ch1', '').replace('_ch2', '');
      const channel = isCh2 ? 2 : 1;
      
      await AdminApi.stopLiveStream(baseCameraId, channel);
      const existing = tournament.liveStreams ?? [];
      const nextStreams: TournamentLiveStream[] = [
        ...existing.filter((s) => s.cameraId !== cameraId),
        {
          ...existing.find((s) => s.cameraId === cameraId)!,
          isLive: false,
        },
      ];
      await persistLiveStreams(tournament, nextStreams);
      if (activeStreamModal && activeStreamModal.court.cameraId === baseCameraId) {
        setActiveStreamModal((prev) => (prev ? { ...prev, court: { ...prev.court, isLiveStreaming: false } } : null));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to stop stream');
    } finally {
      setStreamLoadingId(null);
    }
  };"""

content = content.replace(old_stop, new_stop)

with open('src/views/TournamentsView.tsx', 'w') as f:
    f.write(content)

