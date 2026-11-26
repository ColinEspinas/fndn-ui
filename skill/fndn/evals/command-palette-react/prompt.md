---
tags: [fndn-skill]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

build a command palette for our react app. cmd+k / ctrl+k opens it, there's a search box at the top, results are grouped (Navigation, Actions), each row has an icon and its keyboard shortcut on the right, enter runs the command, esc closes. we use the fndn/ui components (tailwind 4). put it in src/components/CommandPalette.tsx
