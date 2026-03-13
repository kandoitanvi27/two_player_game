<p align="center">
  <span style="font-size: 3rem;">🎮</span>
</p>

<h1 align="center">Games Arena</h1>

<p align="center">
  A collection of classic two-player board & strategy games — all in one browser tab.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/No_Backend-Static_Only-00e676" alt="Static">
</p>

---

## ✨ Overview

**Games Arena** is a fully client-side, single-page web application where two players can enjoy classic board games on the same device. No accounts, no server, no installs — just open and play.

### 🎯 Games Included

| Game | Description | Board |
|------|-------------|-------|
| ❌⭕ **Tic Tac Toe** | Get three in a row to win | 3×3 |
| 🔴🟡 **Connect Four** | Drop discs and connect four in a row | 7×6 |
| 🔵🟦 **Dots & Boxes** | Draw lines between dots to claim boxes | 5×5 dots |
| ⚫⚪ **Othello (Reversi)** | Flip opponent discs by flanking them | 8×8 |
| 🏁 **Checkers** | Capture all opponent pieces or block their moves | 8×8 |
| 🚢 **Battleship** | Find and sink the opponent's hidden fleet | 10×10 |
| ♔♚ **Chess** | Checkmate your opponent's King | 8×8 |

---

## 🚀 Getting Started

### Prerequisites

A modern web browser (Chrome, Firefox, Safari, or Edge).

### Run Locally

```bash
# Clone the repository
git clone <repo-url>
cd game

# Open in your browser — no build step required
open index.html        # macOS
# or
xdg-open index.html    # Linux
# or
start index.html       # Windows
```

Alternatively, serve with any static file server:

```bash
npx serve .
```

---

## 🏗️ Project Structure

```
game/
├── index.html              # Single HTML entry point
├── css/
│   └── styles.css          # Global design system & game-specific styles
├── js/
│   ├── app.js              # SPA router, mode select, lobby rendering
│   ├── utils.js            # Shared utilities (turns, scores, undo, toasts)
│   └── games/
│       ├── tic-tac-toe.js
│       ├── connect-four.js
│       ├── dots-boxes.js
│       ├── reversi.js
│       ├── checkers.js
│       ├── battleship.js
│       └── chess.js
├── assets/
│   └── images/             # Game thumbnails & mode images
├── SRS.md                  # Software Requirements Specification
├── SDD.md                  # Software Design Document
└── README.md
```

---

## 🎨 Features

- **🌑 Dark Neon UI** — Deep dark backgrounds with cyan, pink, and gold neon accents, glassmorphism panels, and smooth hover effects.
- **📱 Responsive Design** — Optimised for desktop & tablet (≥ 768px).
- **🔀 Hash-Based SPA Routing** — Seamless navigation between lobby, mode selection, and individual games with no page reloads.
- **📊 Score Tracking** — Persistent scoreboard across rounds (P1 wins, P2 wins, draws).
- **↩️ Undo** — Revert the last move in any game.
- **📖 In-App Rules** — Quick rules modal for every game.
- **🎞️ Smooth Animations** — Powered by [Anime.js](https://animejs.com/) and CSS keyframes — disc drops, piece flips, card transitions, and victory celebrations.
- **🚫 Zero Dependencies** — No backend, no database, no build tools. Pure HTML + CSS + JS (plus Anime.js via CDN).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Structure** | HTML5 |
| **Styling** | Vanilla CSS3 (custom properties, grid, flexbox) |
| **Logic** | Vanilla JavaScript (ES6+) |
| **Animations** | [Anime.js](https://animejs.com/) v3.2.2 (CDN) |
| **Typography** | [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts) |
| **Hosting** | Any static file server (GitHub Pages, Netlify, Vercel, etc.) |

---

## 📄 Documentation

- [**SRS.md**](SRS.md) — Software Requirements Specification
- [**SDD.md**](SDD.md) — Software Design Document (architecture, algorithms, data flow)

---

## 🗺️ Roadmap

- [ ] Single-player mode with AI opponents
- [ ] Online multiplayer via WebSockets
- [ ] Additional games (Ludo, Snakes & Ladders, Mancala)
- [ ] Mobile-optimised touch controls
- [ ] Sound effects & background music
- [ ] Move history & game replay export

---

## 👩‍💻 Author

**Tanvi Kandoi**

---

## 📝 License

This project is for educational and personal use.
