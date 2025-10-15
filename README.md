Shaillaja Ravi — Portfolio

A modern, responsive portfolio with a small Node.js/Express backend.
The backend serves the static site and exposes created APIs plus two external API integrations (GitHub & Open-Meteo).
No API keys required. Clone → install → run.

✨ Features:

Animated, accessible design (HTML + CSS + JS)
Home: featured projects, latest GitHub repos, live clock & weather
Projects: full gallery with thumbnails and details
Skills: searchable/filterable grid with proficiency bars 
Contact form: with validation
Created JSON APIs under /api/*
External APIs proxied by server 

Project structure:
.
├── public/               
│   ├── index.html          # home
│   ├── projects.html
│   ├── skills.html
│   ├── contact.html
│   ├── css/styles.css
│   └── js/                 # main.js, projects.js, skills.js, contact.js
├── server.js               # Express server + APIs
├── package.json            # scripts & deps
└── README.md

Run locally:
1.Install deps (first time only)
npm install
2.Start the server
npm start

Quick test URLs: 

Home: http://localhost:3000/
Projects: http://localhost:3000/projects.html
Skills: http://localhost:3000/skills.html
Contact: http://localhost:3000/contact.html
