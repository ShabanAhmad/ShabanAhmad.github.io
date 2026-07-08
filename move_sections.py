import re

with open("index.html", "r") as f:
    html = f.read()

# We need to find the start of the block to extract.
# Line 787 is `<hr class="subtle-separator">`
# Let's extract from `<hr class="subtle-separator">` right before `<div class="selected-publications-container"`
# all the way down to the end of `Open to Collaboration`.
# Wait, let's just find the exact strings.

start_str = """        <hr class="subtle-separator">
<div class="selected-publications-container\""""

# Let's find the end of "Open to Collaboration".
end_marker = """<div id="match-result" aria-live="polite" aria-atomic="true" style="display: none; margin-top: 15px; padding: 20px; background: #f1f5f9; border: 1px solid #cbd5e1; border-left: 5px solid var(--primary); border-radius: 12px; font-size: 0.95rem; line-height: 1.6; color: #1e293b; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);"></div>
                </div>"""

start_idx = html.find('<hr class="subtle-separator">\n<div class="selected-publications-container"')
if start_idx == -1:
    print("Start not found")
else:
    end_idx = html.find(end_marker)
    if end_idx == -1:
        print("End not found")
    else:
        end_idx += len(end_marker)
        extracted_block = html[start_idx:end_idx]
        
        # Remove it from the original place
        html = html[:start_idx] + html[end_idx:]
        
        # Now find where to insert it.
        # We want to insert it after the `#about` section ends, or at the end of the `#about` container.
        # Let's insert it as a NEW SECTION immediately after `</section>` of `#about`.
        # Searching for:
        #         <hr class="separator">
        #     </section>
        
        insert_marker = """        <hr class="separator">
    </section>"""
        insert_idx = html.find(insert_marker)
        if insert_idx != -1:
            insert_idx += len(insert_marker)
            
            # Wrap the extracted block in a new section
            new_section = f"""

    <!-- === SCIENTIFIC IMPACT & PUBLICATIONS === -->
    <section id="scientific-impact" class="section">
        <div class="container reveal">
            <h2 class="section-title">Scientific Impact & Publications</h2>
            <div class="about-hero-box" style="margin-top: 0; padding: 2rem;">
{extracted_block}
            </div>
        </div>
        <hr class="separator">
    </section>"""
            
            html = html[:insert_idx] + new_section + html[insert_idx:]
            
            with open("index.html", "w") as f:
                f.write(html)
            print("Successfully moved sections.")
        else:
            print("Insert marker not found")

