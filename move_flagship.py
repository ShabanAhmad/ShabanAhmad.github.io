import re

with open("index.html", "r") as f:
    content = f.read()

# 1. Extract the featured publications container
# We will use regex to find the start of `<div class="featured-publications-container">`
# until the end of its `</div>` which is followed by `<hr class="subtle-separator" style="margin-bottom: 2rem;">`
pattern = re.compile(r'(\s*<div class="featured-publications-container">.*?</div>\n)\s*<hr class="subtle-separator" style="margin-bottom: 2rem;">', re.DOTALL)
match = pattern.search(content)
if not match:
    print("Could not find flagship container")
    exit(1)

flagship_block = match.group(1)

# Remove it from its original place
content = content.replace(flagship_block, "\n")

# 2. Add Funding to Postdoc
# Find the Postdoc trajectory grid
funding_block = """
                                <div class="trajectory-meta-row" style="--dot-color: var(--exp-full); color: var(--text-muted);">
                                    <span><strong>Funding:</strong> Submitted Grant Applications to <a href="https://lighthouse.ku.dk/" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">KU- Proof of Concept</a></span>
                                </div>"""

postdoc_start = '<p class="journey-desc">Identifying PFAS-degrading enzymes using AI strategies.</p>\n                            <div class="trajectory-meta-grid">'
content = content.replace(postdoc_start, postdoc_start + funding_block)

# 3. Insert Flagship block under Open to Collaboration
# We find:
#                     <div id="match-result" ...></div>
#                 </div>
#                     </div>
#                 </div>
#             </div>
# Let's insert it right after the `</div>` of `.ai-matcher-box`.

target_insert = '                    <div id="match-result" aria-live="polite" aria-atomic="true" style="display: none; margin-top: 15px; padding: 20px; background: #f1f5f9; border: 1px solid #cbd5e1; border-left: 5px solid var(--primary); border-radius: 12px; font-size: 0.95rem; line-height: 1.6; color: #1e293b; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);"></div>\n                </div>'

flagship_block_indented = "\n" + flagship_block

content = content.replace(target_insert, target_insert + flagship_block_indented)

with open("index.html", "w") as f:
    f.write(content)

print("Done")
