#!/bin/bash
git add .
git commit -m "chore: prepare for deployment - include all stable changes"
git checkout main
git merge feature/new-enhancements
git push origin main
