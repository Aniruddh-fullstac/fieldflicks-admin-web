import re

with open('src/views/LiveFleetView.tsx', 'r') as f:
    content = f.read()

old_modal = """          onStopStream={() =>
            activeModal.dualChannelNote
              ? handleStopDualStream(activeModal.court, activeModal.venueName)
              : handleStopStream(activeModal.court, activeModal.venueName)
          }"""

new_modal = """          onStopStream={() => handleStopStream(activeModal.court, activeModal.venueName)}"""

content = content.replace(old_modal, new_modal)

with open('src/views/LiveFleetView.tsx', 'w') as f:
    f.write(content)

