# Silly Tetris

A simple game of Tetris rebuilt with Next.js and React.

## Features

- Classic Tetris gameplay with ghost piece and 7-bag-style randomizer
- Hard drop, hold piece, and pause
- Level progression with increasing speed and classic line-clear scoring
- High score saved between sessions (localStorage)
- Next piece and hold previews
- Selectable background music (Classic / Halloween / Christmas) with mute
- Arrow keys or WASD, plus on-screen touch controls for mobile
- Fully responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## How to Play

- **Arrow Left/Right** (or **A/D**): Move piece horizontally
- **Arrow Up** (or **W**): Rotate piece
- **Arrow Down** (or **S**): Soft drop (drop piece faster)
- **Space**: Hard drop (drop instantly and lock)
- **C** / **Shift**: Hold the current piece
- **P**: Pause / resume
- **Enter**: Start game
- **Escape**: End game

On touch devices, use the on-screen buttons below the board.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout with metadata
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ControlToggle/  # Arrows / WASD switch
│   ├── GameBoard/      # Main game canvas
│   ├── GameOverlay/    # Start / paused / game-over screens
│   ├── GameStats/      # Score, best, level and lines display
│   ├── MusicControls/  # Track selector and mute
│   ├── NextPiece/      # Next / hold piece preview
│   ├── TouchControls/  # On-screen mobile controls
│   └── TetrisGame/     # Main game wrapper
├── hooks/              # Custom React hooks
│   └── useTetris.ts    # Game logic hook
├── types/              # TypeScript types
│   └── tetris.ts       # Game type definitions
└── utils/              # Utility functions
    └── gameLogic.ts    # Core game logic
```

## Tech Stack

- Next.js 16
- React 19
- TypeScript 6
- CSS Modules

## Contributors Welcome! :)
