import re

with open("index.html", "r") as f:
    content = f.read()

open_collab_start = content.find('<!-- Open to Collaboration -->')
sel_pub_start = content.find('<div class="selected-publications-container"')
about_left_end = content.find('</div> <!-- /about-left -->')

print(f"Open Collab: {open_collab_start}")
print(f"Selected Pubs: {sel_pub_start}")
print(f"About Left End: {about_left_end}")

# Print snippet of selected pubs to end
print("--- Selected Pubs ---")
print(content[sel_pub_start:about_left_end])

