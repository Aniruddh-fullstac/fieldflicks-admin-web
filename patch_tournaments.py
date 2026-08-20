import re

with open('src/views/TournamentsView.tsx', 'r') as f:
    content = f.read()

# 1. Update the UI for checkboxes
old_checkboxes = """                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 12,
                    marginTop: 6,
                  }}>
                    {fleet
                      .find((v) => v.turfId === formData.turfId)
                      ?.courts.map((c) => (
                        <label
                          key={c.cameraId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: '0.85rem',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.cameraIds.includes(c.cameraId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  cameraIds: [...formData.cameraIds, c.cameraId],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  cameraIds: formData.cameraIds.filter((id) => id !== c.cameraId),
                                });
                              }
                            }}
                            style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }}
                          />
                          Court {c.courtNumber} - {c.name}
                        </label>
                      ))}
                  </div>"""

new_checkboxes = """                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 12,
                    marginTop: 6,
                  }}>
                    {fleet
                      .find((v) => v.turfId === formData.turfId)
                      ?.courts.flatMap((c) => {
                        const isPickpad = fleet.find((v) => v.turfId === formData.turfId)?.turfName.toLowerCase().includes('pickpad') || true; // Apply to all for now or check isPickpad
                        
                        const opts = [
                          <label
                            key={`${c.cameraId}_ch1`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: '0.85rem',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.cameraIds.includes(`${c.cameraId}_ch1`)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    cameraIds: [...formData.cameraIds, `${c.cameraId}_ch1`],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    cameraIds: formData.cameraIds.filter((id) => id !== `${c.cameraId}_ch1`),
                                  });
                                }
                              }}
                              style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }}
                            />
                            Court {c.courtNumber} - {c.name} (Ch 1)
                          </label>
                        ];
                        
                        if (isPickpad) {
                          opts.push(
                            <label
                              key={`${c.cameraId}_ch2`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                fontSize: '0.85rem',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.cameraIds.includes(`${c.cameraId}_ch2`)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      cameraIds: [...formData.cameraIds, `${c.cameraId}_ch2`],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      cameraIds: formData.cameraIds.filter((id) => id !== `${c.cameraId}_ch2`),
                                    });
                                  }
                                }}
                                style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }}
                              />
                              Court {c.courtNumber} - {c.name} (Ch 2)
                            </label>
                          );
                        }
                        
                        return opts;
                      })}
                  </div>"""

content = content.replace(old_checkboxes, new_checkboxes)

# 2. Update mapping logic for TournamentLiveStream creation
old_mapping = """    const liveStreams: TournamentLiveStream[] = formData.cameraIds.map((cameraId) => {
      const court = venue?.courts.find((c) => c.cameraId === cameraId);
      return {
        cameraId,
        cameraName: court?.name || `Camera ${cameraId.slice(0, 6)}`,
        courtNumber: court?.courtNumber,
        isLive: false,
      };
    });"""

new_mapping = """    const liveStreams: TournamentLiveStream[] = formData.cameraIds.map((selectedId) => {
      // selectedId is like "uuid_ch1" or "uuid_ch2"
      const isCh2 = selectedId.endsWith('_ch2');
      const baseCameraId = selectedId.replace('_ch1', '').replace('_ch2', '');
      const court = venue?.courts.find((c) => c.cameraId === baseCameraId);
      return {
        cameraId: selectedId,
        cameraName: (court?.name || `Camera ${baseCameraId.slice(0, 6)}`) + (isCh2 ? ' (Ch 2)' : ' (Ch 1)'),
        courtNumber: court?.courtNumber,
        isLive: false,
      };
    });"""

content = content.replace(old_mapping, new_mapping)

with open('src/views/TournamentsView.tsx', 'w') as f:
    f.write(content)

