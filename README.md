# Silly Tetris

A simple game of Tetris rebuilt with Next.js and React.

## Features

- Classic Tetris gameplay
- Responsive design for all screen sizes
- Background music
- Score and row tracking
- Next piece preview

## Getting Started

### Prerequisites

- Node.js 18+ 
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

- **Arrow Left/Right**: Move piece horizontally
- **Arrow Up**: Rotate piece
- **Arrow Down / Space**: Drop piece faster
- **Enter**: Start game
- **Escape**: End game

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout with metadata
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── GameBoard/      # Main game canvas
│   ├── GameStats/      # Score and rows display
│   ├── NextPiece/      # Next piece preview
│   ├── StartPrompt/    # Start game prompt
│   └── TetrisGame/     # Main game wrapper
├── hooks/              # Custom React hooks
│   └── useTetris.ts    # Game logic hook
├── types/              # TypeScript types
│   └── tetris.ts       # Game type definitions
└── utils/              # Utility functions
    └── gameLogic.ts    # Core game logic
```

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- CSS Modules

## Contributors Welcome! :)