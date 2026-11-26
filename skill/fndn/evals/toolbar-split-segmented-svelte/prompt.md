---
tags: [fndn-skill]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

In our Svelte 5 app I need an editor toolbar: a split button "Publish" with a menu (Publish now, Schedule…, Save as draft), a segmented control for the view (Edit / Preview / Split), a small font-size select, and icon buttons for bold, italic and link. One row, everything lined up, and on a narrow screen it must not break. Use our ui components. File: src/lib/EditorToolbar.svelte
