import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

# 1. Update handleStartStream to support channel
old_start = """  const handleStartStream = async (court: CourtCamera, venue: VenueFleet) => {
    // STREAMING GUARD: Immediately notify if court isn't configured
    const isConfigured = !!(court.raspberryPiBaseUrl && court.raspberryPiBaseUrl.trim().length > 0);
    if (!isConfigured) {
      setUnconfiguredWarning({
        court,
        venueId: venue.turfId,
        venueName: venue.turfName,
      });
      return;
    }

    setActionLoadingId(court.cameraId);
    try {
      const res = await AdminApi.startLiveStream(court.cameraId, `${venue.turfName} ${court.name}`);
      const playbackUrl = res.playbackUrl || `https://stream.mux.com/live-${court.cameraId}.m3u8`;

      // Update fleet state
      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          courts: v.courts.map((c) =>
            c.cameraId === court.cameraId
              ? { ...c, isLiveStreaming: true, status: 'STREAMING', livePlaybackUrl: playbackUrl }
              : c
          ),
        }))
      );

      // Open stream player modal
      setActiveModal({
        court: { ...court, isLiveStreaming: true, livePlaybackUrl: playbackUrl },
        venueName: venue.turfName,
        playbackUrl,
      });
      setActionLoadingId(null);
    } catch (err: any) {
      setActionLoadingId(null);
      const diag = parseDiagnosticError(err, {
        courtName: `${venue.turfName} — ${court.name}`,
        courtNumber: court.courtNumber,
        deviceUrl: court.raspberryPiBaseUrl,
      });
      setDiagnosticError(diag);
    }
  };"""

new_start = """  const handleStartStream = async (court: CourtCamera, venue: VenueFleet, channel?: number) => {
    // STREAMING GUARD: Immediately notify if court isn't configured
    const isConfigured = !!(court.raspberryPiBaseUrl && court.raspberryPiBaseUrl.trim().length > 0);
    if (!isConfigured) {
      setUnconfiguredWarning({
        court,
        venueId: venue.turfId,
        venueName: venue.turfName,
      });
      return;
    }

    const loadId = channel ? `${court.cameraId}-ch${channel}` : court.cameraId;
    setActionLoadingId(loadId);
    try {
      const courtTitle = channel ? `${venue.turfName} ${court.name} (Ch ${channel})` : `${venue.turfName} ${court.name}`;
      const res = await AdminApi.startLiveStream(court.cameraId, courtTitle, channel);
      const playbackUrl = res.playbackUrl || `https://stream.mux.com/live-${court.cameraId}.m3u8`;

      // Update fleet state
      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          courts: v.courts.map((c) => {
            if (c.cameraId !== court.cameraId) return c;
            if (channel === 2) {
              return { ...c, isLiveStreamingCh2: true, status: 'STREAMING', livePlaybackUrlCh2: playbackUrl };
            }
            return { ...c, isLiveStreaming: true, status: 'STREAMING', livePlaybackUrl: playbackUrl };
          }),
        }))
      );

      // Open stream player modal
      setActiveModal({
        court: { 
          ...court, 
          isLiveStreaming: channel !== 2 ? true : court.isLiveStreaming, 
          livePlaybackUrl: channel !== 2 ? playbackUrl : court.livePlaybackUrl,
          isLiveStreamingCh2: channel === 2 ? true : court.isLiveStreamingCh2,
          livePlaybackUrlCh2: channel === 2 ? playbackUrl : court.livePlaybackUrlCh2,
        },
        venueName: venue.turfName,
        playbackUrl,
        playbackUrlCh2: channel === 2 ? playbackUrl : undefined,
      });
      setActionLoadingId(null);
    } catch (err: any) {
      setActionLoadingId(null);
      const diag = parseDiagnosticError(err, {
        courtName: `${venue.turfName} — ${court.name} ${channel ? '(Ch '+channel+')' : ''}`,
        courtNumber: court.courtNumber,
        deviceUrl: court.raspberryPiBaseUrl,
      });
      setDiagnosticError(diag);
    }
  };"""

content = content.replace(old_start, new_start)

# 2. Update handleStopStream to support channel
old_stop = """  const handleStopStream = async (court: CourtCamera, venueName: string) => {
    setActionLoadingId(court.cameraId);
    try {
      await AdminApi.stopLiveStream(court.cameraId);
      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          courts: v.courts.map((c) =>
            c.cameraId === court.cameraId
              ? { ...c, isLiveStreaming: false, livePlaybackUrl: undefined, status: 'ONLINE' }
              : c
          ),
        }))
      );
      if (activeModal && activeModal.court.cameraId === court.cameraId) {
        setActiveModal((prev) => (prev ? { ...prev, court: { ...prev.court, isLiveStreaming: false } } : null));
      }
      setActionLoadingId(null);
    } catch (err: any) {
      setActionLoadingId(null);
      const diag = parseDiagnosticError(err, {
        courtName: `${venueName} — ${court.name}`,
        courtNumber: court.courtNumber,
        deviceUrl: court.raspberryPiBaseUrl,
      });
      setDiagnosticError(diag);
    }
  };"""

new_stop = """  const handleStopStream = async (court: CourtCamera, venueName: string, channel?: number) => {
    const loadId = channel ? `${court.cameraId}-ch${channel}` : court.cameraId;
    setActionLoadingId(loadId);
    try {
      await AdminApi.stopLiveStream(court.cameraId, channel);
      setFleet((prev) =>
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
      }
      setActionLoadingId(null);
    } catch (err: any) {
      setActionLoadingId(null);
      const diag = parseDiagnosticError(err, {
        courtName: `${venueName} — ${court.name}`,
        courtNumber: court.courtNumber,
        deviceUrl: court.raspberryPiBaseUrl,
      });
      setDiagnosticError(diag);
    }
  };"""

content = content.replace(old_stop, new_stop)

# 3. Replace the UI buttons
old_ui_buttons = """                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleStartStream(court, venue)}
                              disabled={isActionLoading}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                opacity: isActionLoading ? 0.7 : 1,
                              }}
                            >
                              {isActionLoading ? (
                                <>
                                  <RefreshCw size={13} className="spin" />
                                  Starting...
                                </>
                              ) : (
                                <>
                                  <Radio size={13} /> Live Stream
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleStopStream(court, venue.turfName)}
                              disabled={isActionLoading}
                              className="btn-secondary"
                              title="Force Stop Stalled Stream"
                              style={{
                                padding: '10px 10px',
                                color: 'var(--accent-crimson)',
                                borderColor: 'rgba(255, 61, 87, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isActionLoading ? 0.6 : 1,
                              }}
                            >
                              <Square size={13} fill="currentColor" />
                            </button>

                            <button
                              onClick={() =>
                                setExtractModal({
                                  court,
                                  venueName: venue.turfName,
                                })
                              }
                              title="Fetch and test video recording extraction from Dahua NVR"
                              className="btn-secondary"
                              style={{
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--accent-cyan)',
                                borderColor: 'rgba(0, 229, 255, 0.3)',
                              }}
                            >
                              <Film size={13} /> Fetch Video
                            </button>

                            <button
                              onClick={() =>
                                setConfigureModal({
                                  court,
                                  venueId: venue.turfId,
                                  venueName: venue.turfName,
                                })
                              }
                              title="Edit Court Pi Gateway Base URL"
                              className="btn-secondary"
                              style={{
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Settings size={13} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleStartDualStream(court, venue)}
                            disabled={isActionLoading}
                            className="btn-secondary"
                            title="Start NVR channels 1 & 2 on the same Pi (dual-camera court)"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              fontSize: '0.72rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              color: 'var(--accent-cyan)',
                              borderColor: 'rgba(0, 229, 255, 0.35)',
                              opacity: isActionLoading ? 0.7 : 1,
                            }}
                          >
                            {actionLoadingId === `${court.cameraId}-dual` ? (
                              <>
                                <RefreshCw size={12} className="spin" />
                                Starting dual stream...
                              </>
                            ) : (
                              <>
                                <RadioTower size={12} /> Dual Stream (NVR Ch 1 + 2)
                              </>
                            )}
                          </button>
                          </div>"""

new_ui_buttons = """                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleStartStream(court, venue, 1)}
                              disabled={isActionLoading}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                opacity: isActionLoading ? 0.7 : 1,
                              }}
                            >
                              {actionLoadingId === `${court.cameraId}-ch1` || actionLoadingId === court.cameraId ? (
                                <>
                                  <RefreshCw size={13} className="spin" />
                                  ...
                                </>
                              ) : (
                                <>
                                  <Radio size={13} /> Live Stream (Ch 1)
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleStopStream(court, venue.turfName, 1)}
                              disabled={isActionLoading}
                              className="btn-secondary"
                              title="Force Stop Stalled Stream Ch 1"
                              style={{
                                padding: '10px 10px',
                                color: 'var(--accent-crimson)',
                                borderColor: 'rgba(255, 61, 87, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isActionLoading ? 0.6 : 1,
                              }}
                            >
                              <Square size={13} fill="currentColor" />
                            </button>

                            <button
                              onClick={() =>
                                setExtractModal({
                                  court,
                                  venueName: venue.turfName,
                                })
                              }
                              title="Fetch and test video recording extraction from Dahua NVR"
                              className="btn-secondary"
                              style={{
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--accent-cyan)',
                                borderColor: 'rgba(0, 229, 255, 0.3)',
                              }}
                            >
                              <Film size={13} /> Fetch Video
                            </button>

                            <button
                              onClick={() =>
                                setConfigureModal({
                                  court,
                                  venueId: venue.turfId,
                                  venueName: venue.turfName,
                                })
                              }
                              title="Edit Court Pi Gateway Base URL"
                              className="btn-secondary"
                              style={{
                                padding: '10px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Settings size={13} />
                            </button>
                          </div>

                          {(venue.turfName.toLowerCase().includes('pickpad') || court.isLiveStreamingCh2 || true) && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleStartStream(court, venue, 2)}
                                disabled={isActionLoading}
                                className="btn-secondary"
                                title="Start NVR channel 2"
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  fontSize: '0.72rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  color: 'var(--accent-cyan)',
                                  borderColor: 'rgba(0, 229, 255, 0.35)',
                                  opacity: isActionLoading ? 0.7 : 1,
                                }}
                              >
                                {actionLoadingId === `${court.cameraId}-ch2` ? (
                                  <>
                                    <RefreshCw size={12} className="spin" />
                                    Starting Ch 2...
                                  </>
                                ) : (
                                  <>
                                    <RadioTower size={12} /> Live Stream (Ch 2)
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleStopStream(court, venue.turfName, 2)}
                                disabled={isActionLoading}
                                className="btn-secondary"
                                title="Stop NVR channel 2"
                                style={{
                                  padding: '8px 10px',
                                  color: 'var(--accent-crimson)',
                                  borderColor: 'rgba(255, 61, 87, 0.4)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: isActionLoading ? 0.6 : 1,
                                }}
                              >
                                <Square size={13} fill="currentColor" />
                              </button>
                            </div>
                          )}
                          </div>"""

content = content.replace(old_ui_buttons, new_ui_buttons)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

