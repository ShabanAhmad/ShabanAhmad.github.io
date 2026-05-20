#!/bin/bash

# Add all changes
git add .

# Commit with message passed as argument
git commit -m "$1"

# Push to GitHub
git push origin main