import re

with open("index.html", "r") as f:
    html = f.read()

# The goal is to:
# 1. Replace `<div class="traj-sub-bullet" style="margin-left: 1.2rem;">` with `<div class="traj-sub-sub-bullet">`
# So we can style them independently in CSS.

html = html.replace('<div class="traj-sub-bullet" style="margin-left: 1.2rem;">', '<div class="traj-sub-sub-bullet">')

with open("index.html", "w") as f:
    f.write(html)
