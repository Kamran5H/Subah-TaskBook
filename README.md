# 🌅 Subah — Daily Focus & Gamified Task Book

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Framework: Electron](https://img.shields.io/badge/Framework-Electron%20%7C%20Vanilla%20JS-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Offline First](https://img.shields.io/badge/Architecture-100%25%20Offline--First-10B981?style=for-the-badge)](https://github.com/Kamran5H/Subah-TaskBook)
[![Productivity](https://img.shields.io/badge/Design-Continuous%20Rollover-F59E0B?style=for-the-badge)](https://github.com/Kamran5H/Subah-TaskBook)
[![Gamification](https://img.shields.io/badge/Reward-Surprise%20Celebration%20Engine-EC4899?style=for-the-badge)](https://github.com/Kamran5H/Subah-TaskBook)

**A distraction-free, offline-first daily focus console, personal life diary, and continuous rollover task book with gamified surprise rewards.**

[Philosophy](#-philosophy) • [Key Features](#-key-features) • [Architecture](#-architecture) • [Quickstart](#-quick-start) • [License](#-license)

</div>

---

## 🌟 Philosophy

Most modern task managers fail because they create anxiety: rigid deadlines turn into overdue notifications, guilt piles up, and users abandon the app.

**Subah** (meaning *"Morning"* in Urdu/Arabic) is designed around compassion, focus, and organic flow. It embraces the reality of daily life:
- **Continuous Rollover**: Uncompleted tasks from yesterday do not turn red or trigger shame—they gracefully carry forward into today's focus queue.
- **Surprise Rewards**: Completing high-effort focus sessions triggers delightful, randomized gamified micro-celebrations and philosophical reflections.
- **Life Diary Synthesis**: Seamlessly blends tactical daily checklists with a personal evening reflective journal.

---

## 🚀 Key Features

- **🎯 Anchor Focus Mode**: Pin your #1 highest-priority task to the top of the interface, hiding distraction vectors until that objective is achieved.
- **🔄 Frictionless Continuous Rollover**: Automatically migrates pending backlog items at midnight without cluttering your inbox or resetting streaks.
- **🎉 Surprise Reward Engine**: Completing tasks triggers procedural confetti animations, motivational milestone badges, and surprise reward cards.
- **🔒 100% Local & Sovereign**: Zero cloud accounts, zero tracking, and zero subscription paywalls. All task data and journal entries are encrypted and stored locally.
- **📖 Integrated Life Diary**: Dedicated evening reflection mode to record gratitude, lessons learned, and breakthroughs.
- **⚡ Lightweight Desktop Performance**: Zero idle CPU consumption with instant keyboard shortcuts (`Ctrl+N` new task, `Ctrl+D` toggle done).

---

## 🏗️ Architecture

```mermaid
flowchart TD
    A[Electron Main Process: main.js] <-->|Context Bridge & Preload: preload.js| B[Renderer UI: src/]
    B --> C{Subah State Engine}
    C --> D[Daily Focus Queue & Task Tree]
    C --> E[Continuous Midnight Rollover Handler]
    C --> F[Surprise Reward Celebration Emitter]
    C --> G[Reflective Life Diary]
    C <-->|Bi-directional Atomic Sync| H[(Encrypted Local Storage / JSON Vault)]
```

---

## 📁 Repository Structure

```text
Subah-TaskBook/
├── main.js                     # Electron main process entry point
├── preload.js                  # IPC security bridge and safe API exposure
├── package.json                # Project dependencies and packaging scripts
├── src/                        # Frontend UI components, styling & audio effects
├── assets/                     # Application icons, celebration graphics & soundbites
├── scripts/                    # Build and distribution utilities
├── test/                       # Unit tests & rollover validation suite
├── .gitignore                  # Node modules & build exclusions
└── LICENSE                     # Open-source MIT License
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18.0+ or higher
- npm / yarn

### Installation
```bash
git clone https://github.com/Kamran5H/Subah-TaskBook.git
cd Subah-TaskBook

# Install dependencies
npm install

# Launch Subah desktop app
npm start
```

---

## 📜 License

This project is open-source and released under the [MIT License](LICENSE).  
Copyright (c) 2024-2026 **Kamran Ashraf**.
