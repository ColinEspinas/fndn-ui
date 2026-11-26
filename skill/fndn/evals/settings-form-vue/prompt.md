---
tags: [fndn-skill]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Add a settings page to our Vue 3 app (Vite, Tailwind 4, the fndn/ui components are set up). Fields: display name, email (validated), a timezone select with the full IANA list (some names are long, like America/Argentina/ComodRivadavia), a "compact mode" switch, notification frequency (daily / weekly / never), and Save / Cancel at the bottom. Save is disabled until something changed. Put it in src/pages/Settings.vue.
