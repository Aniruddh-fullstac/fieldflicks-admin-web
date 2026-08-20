import re

with open('src/views/TournamentsView.tsx', 'r') as f:
    content = f.read()

old_start = """  const handleStartTournamentStream = async (tournament: Tournament, cameraId: string) => {
    // We need to resolve the court details from fleet to ensure Pi is configured
    const match = resolveFleetCourt(cameraId);
    if (!match) {
      alert('Camera details not found in Fleet. Unable to start stream.');
      return;
    }
    const { court, venue } = match;
    if (!court.raspberryPiBaseUrl?.trim()) {
      alert(`${court.name} is not configured with a Pi URL. Configure it in Camera Fleet first.`);
      return;
    }

    setStreamLoadingId(cameraId);
    try {
      const res = await AdminApi.startLiveStream(cameraId, `${venue.turfName} ${court.name}`);
      const playbackUrl = res.playbackUrl || `https://stream.mux.com/live-${cameraId}.m3u8`;
      const existing = tournament.liveStreams ?? [];
      const nextStreams: TournamentLiveStream[] = [
        ...existing.filter((s) => s.cameraId !== cameraId),
        {
          cameraId,
          cameraName: court.name,
          courtNumber: court.courtNumber,
          playbackUrl,
          isLive: true,
        },
      ];
      await persistLiveStreams(tournament, nextStreams);
      setActiveStreamModal({
        court: { ...court, isLiveStreaming: true, livePlaybackUrl: playbackUrl },
        venueName: venue.turfName,
        playbackUrl,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to start stream');
    } finally {
      setStreamLoadingId(null);
    }
  };"""

new_start = """  const handleStartTournamentStream = async (tournament: Tournament, cameraId: string) => {
    const isCh2 = cameraId.endsWith('_ch2');
    const baseCameraId = cameraId.replace('_ch1', '').replace('_ch2', '');
    const channel = isCh2 ? 2 : 1;

    // We need to resolve the court details from fleet to ensure Pi is configured
    const match = resolveFleetCourt(baseCameraId);
    if (!match) {
      alert('Camera details not found in Fleet. Unable to start stream.');
      return;
    }
    const { court, venue } = match;
    if (!court.raspberryPiBaseUrl?.trim()) {
      alert(`${court.name} is not configured with a Pi URL. Configure it in Camera Fleet first.`);
      return;
    }

    setStreamLoadingId(cameraId);
    try {
      const res = await AdminApi.startLiveStream(baseCameraId, `${venue.turfName} ${court.name} (Ch ${channel})`, channel);
      const playbackUrl = res.playbackUrl || `https://stream.mux.com/live-${baseCameraId}.m3u8`;
      const existing = tournament.liveStreams ?? [];
      const nextStreams: TournamentLiveStream[] = [
        ...existing.filter((s) => s.cameraId !== cameraId),
        {
          cameraId,
          cameraName: court.name + ` (Ch ${channel})`,
          courtNumber: court.courtNumber,
          playbackUrl,
          isLive: true,
        },
      ];
      await persistLiveStreams(tournament, nextStreams);
      setActiveStreamModal({
        court: { ...court, isLiveStreaming: true, livePlaybackUrl: playbackUrl },
        venueName: venue.turfName,
        playbackUrl,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to start stream');
    } finally {
      setStreamLoadingId(null);
    }
  };"""

content = content.replace(old_start, new_start)

# We also need to update resolveFleetCourt which is used here
old_resolve = """  const resolveFleetCourt = (cameraId: string) => {
    for (const v of fleet) {
      const c = v.courts.find((court) => court.cameraId === cameraId);
      if (c) return { venue: v, court: c };
    }
    return null;
  };"""

new_resolve = """  const resolveFleetCourt = (cameraId: string) => {
    const baseCameraId = cameraId.replace('_ch1', '').replace('_ch2', '');
    for (const v of fleet) {
      const c = v.courts.find((court) => court.cameraId === baseCameraId);
      if (c) return { venue: v, court: c };
    }
    return null;
  };"""

content = content.replace(old_resolve, new_resolve)

with open('src/views/TournamentsView.tsx', 'w') as f:
    f.write(content)

