import re

with open("index.html", "r") as f:
    content = f.read()

# 1. Identify the 'Key Scientific Contributions' block
# 2. Identify the 'Selected Publications' block
# 3. Swap them.

# First, find where Key Scientific Contributions starts:
key_sci_start = '<!-- Sub-section: Key Scientific Contributions -->'
key_sci_idx = content.find(key_sci_start)

# Find where Open to Collaboration starts:
open_collab_start = '<!-- Open to Collaboration -->'
open_collab_idx = content.find(open_collab_start)

# Find where Selected Publications starts
selected_pubs_start = '<div class="selected-publications-container"'
selected_pubs_idx = content.find(selected_pubs_start)

# Let's extract the exact blocks we need to swap/move.
# Actually, the user wants Selected Publications to go before Key Scientific Contributions.
# Currently, the order is:
# 1. Key Scientific Contributions
# 2. Open to Collaboration
# 3. Selected Publications
#
# So we need to move Selected Publications (3) above Key Scientific Contributions (1).

# Let's verify the layout.
print(f"Key Sci Index: {key_sci_idx}")
print(f"Open Collab Index: {open_collab_idx}")
print(f"Selected Pubs Index: {selected_pubs_idx}")

