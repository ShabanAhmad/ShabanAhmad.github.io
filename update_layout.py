import re

with open("index.html", "r") as f:
    content = f.read()

# 1. Extract Selected Publications block
pattern_sel = re.compile(r'(\s*<div class="selected-publications-container".*?</div>\n\s*</div>\n\s*</div>\n)', re.DOTALL)
# Wait, the structure ends at line 831 which is `        </div>`.
# Let's extract by exact string matching based on the start tag and end tag.
sel_start_str = '        <div class="selected-publications-container"'
sel_start = content.find(sel_start_str)
sel_end_str = '                    </ol>\n                </div>\n            </div>\n        </div>\n'
sel_end = content.find(sel_end_str, sel_start) + len(sel_end_str)

selected_pubs_block = content[sel_start:sel_end]

# 2. Remove it from current location
content = content[:sel_start] + content[sel_end:]

# 3. Insert it before Key Scientific Contributions
key_start_str = '                <!-- Sub-section: Key Scientific Contributions -->'
key_start = content.find(key_start_str)

# Add it with an extra newline
content = content[:key_start] + selected_pubs_block + "\n" + content[key_start:]

# 4. Shorten Open to Collaboration text
old_collab_text = 'Interested in discussing a position, collaboration, or joint project? Share the context below and I will get back to you directly.'
new_collab_text = 'Interested in a position or collaboration? Share the context below.'
content = content.replace(old_collab_text, new_collab_text)

# We can also reduce the textarea rows from default (which is usually 2 or whatever CSS sets)
# But wait, textarea is just `<textarea id="job-desc-input" ...></textarea>`
# Let's reduce its default height if we can by adding rows="1" or changing CSS.
content = content.replace('<textarea id="job-desc-input"', '<textarea id="job-desc-input" rows="1" style="min-height: 40px; padding: 8px 12px;"')

with open("index.html", "w") as f:
    f.write(content)

print("Done")
