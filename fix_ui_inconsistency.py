import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

# Replace the block from `                      {/* Stream Action Toolbar */}` to the end of the `isConfigured` branch

old_block = """                      {/* Stream Action Toolbar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {isLive ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {/* JOIN STREAM BUTTON */}
                            <button
                              onClick={() => handleJoinStream(court, venue.turfName)}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                                color: '#05070A',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              <Play size={14} fill="#05070A" /> Join Live Stream
                            </button>

                            {/* STOP STREAM BUTTON */}
                            <button
                              onClick={() => handleStopStream(court, venue.turfName)}
                              disabled={isActionLoading}
                              className="btn-secondary"
                              style={{
                                padding: '10px 14px',
                                fontSize: '0.75rem',
                                color: 'var(--accent-crimson)',
                                borderColor: 'rgba(255, 61, 87, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                opacity: isActionLoading ? 0.6 : 1,
                              }}
                            >
                              <Square size={13} fill="currentColor" /> Stop
                            </button>
                          </div>
                        ) : isConfigured ? (
                          /* CONFIGURED COURT: Start Stream, Fetch Video & Settings buttons */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                          </div>
                        ) : ("""

new_block = """                      {/* Stream Action Toolbar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {isConfigured ? (
                          /* CONFIGURED COURT: Start Stream, Fetch Video & Settings buttons */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {court.isLiveStreaming ? (
                              <button
                                onClick={() => handleJoinStream(court, venue.turfName)}
                                className="btn-primary"
                                style={{
                                  flex: 1,
                                  padding: '10px 10px',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                  background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                                  color: '#05070A',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                <Play size={13} fill="#05070A" /> Join Stream (Ch 1)
                              </button>
                            ) : (
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
                            )}

                            <button
                              onClick={() => handleStopStream(court, venue.turfName, 1)}
                              disabled={isActionLoading}
                              className="btn-secondary"
                              title={court.isLiveStreaming ? "Stop Live Stream (Ch 1)" : "Force Stop Stalled Stream (Ch 1)"}
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
                              {court.isLiveStreamingCh2 ? (
                                <button
                                  onClick={() => handleJoinStream(court, venue.turfName, 2)}
                                  className="btn-primary"
                                  style={{
                                    flex: 1,
                                    padding: '8px 10px',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 5,
                                    background: 'linear-gradient(135deg, #00E676 0%, #00B359 100%)',
                                    color: '#05070A',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Play size={12} fill="#05070A" /> Join Stream (Ch 2)
                                </button>
                              ) : (
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
                              )}
                              
                              <button
                                onClick={() => handleStopStream(court, venue.turfName, 2)}
                                disabled={isActionLoading}
                                className="btn-secondary"
                                title={court.isLiveStreamingCh2 ? "Stop Live Stream (Ch 2)" : "Force Stop Stalled Stream (Ch 2)"}
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
                          </div>
                        ) : ("""

# In `handleJoinStream`, we also need to allow joining ch2.
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

content = content.replace(old_block, new_block)
content = content.replace(old_join, new_join)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

