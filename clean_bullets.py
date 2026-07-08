import re

with open("index.html", "r") as f:
    html = f.read()

# Replace <span class="sub-bullet-icon">&bull;</span> with <span class="sub-bullet-icon"></span>
html = re.sub(r'<span class="sub-bullet-icon">&bull;</span>', '<span class="sub-bullet-icon"></span>', html)
# Replace <span class="sub-bullet-icon">-</span> with <span class="sub-bullet-icon"></span>
html = re.sub(r'<span class="sub-bullet-icon">-</span>', '<span class="sub-bullet-icon"></span>', html)

with open("index.html", "w") as f:
    f.write(html)
print("Replaced all &bull; and - in sub-bullet-icon")
