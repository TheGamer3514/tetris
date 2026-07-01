'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Piece, TetrominoType, BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris';
import { eachBlock, getBlock, findDropPosition } from '@/utils/gameLogic';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  blocks: (TetrominoType | null)[][];
  current: Piece | null;
  playing: boolean;
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  dx: number,
  dy: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(px, py, dx, dy);
  // Highlight (top-left bevel)
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(px, py, dx, 2);
  ctx.fillRect(px, py, 2, dy);
  // Shadow (bottom-right bevel)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(px, py + dy - 2, dx, 2);
  ctx.fillRect(px + dx - 2, py, 2, dy);
  // Grid line
  ctx.strokeStyle = '#2a2a2a';
  ctx.strokeRect(px, py, dx, dy);
}

export function GameBoard({ blocks, current, playing }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match the backing store to the CSS display size (this also clears it).
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const dx = canvas.width / BOARD_WIDTH;
    const dy = canvas.height / BOARD_HEIGHT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.translate(0.5, 0.5);

    // Draw ghost piece (drop shadow)
    if (playing && current) {
      const ghostY = findDropPosition(current, blocks);
      if (ghostY !== current.y) {
        ctx.globalAlpha = 0.25;
        eachBlock(current.type, current.x, ghostY, current.dir, (x, y) => {
          drawBlock(ctx, x * dx, y * dy, dx, dy, current.type.color);
        });
        ctx.globalAlpha = 1;
      }
    }

    // Draw current piece
    if (playing && current) {
      eachBlock(current.type, current.x, current.y, current.dir, (x, y) => {
        drawBlock(ctx, x * dx, y * dy, dx, dy, current.type.color);
      });
    }

    // Draw placed blocks
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const block = getBlock(blocks, x, y);
        if (block) {
          drawBlock(ctx, x * dx, y * dy, dx, dy, block.color);
        }
      }
    }

    // Draw border
    ctx.strokeStyle = '#444';
    ctx.strokeRect(0, 0, BOARD_WIDTH * dx - 1, BOARD_HEIGHT * dy - 1);

    ctx.restore();
  }, [blocks, current, playing]);

  // Redraw whenever the game state changes.
  useEffect(() => {
    drawBoard();
  }, [drawBoard]);

  // Repaint after a resize (setting canvas width/height clears the canvas, so
  // an explicit redraw is required — otherwise the board goes blank on the
  // idle / paused / game-over screens where no state change follows).
  useEffect(() => {
    window.addEventListener('resize', drawBoard);
    return () => window.removeEventListener('resize', drawBoard);
  }, [drawBoard]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvas}${playing ? ` ${styles.canvasPlaying}` : ''}`}
    >
      Sorry, this example cannot be run because your browser does not support the canvas element
    </canvas>
  );
}
