'use client';

import { useEffect, useRef, useState } from 'react';
import { Piece, TetrominoType, BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris';
import { eachBlock, getBlock } from '@/utils/gameLogic';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  blocks: (TetrominoType | null)[][];
  current: Piece | null;
  playing: boolean;
}

export function GameBoard({ blocks, current, playing }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setResizeCounter] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual canvas size to match display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const dx = canvas.width / BOARD_WIDTH;
    const dy = canvas.height / BOARD_HEIGHT;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.translate(0.5, 0.5);

    // Draw current piece
    if (playing && current) {
      eachBlock(current.type, current.x, current.y, current.dir, (x, y) => {
        ctx.fillStyle = current.type.color;
        ctx.fillRect(x * dx, y * dy, dx, dy);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x * dx, y * dy, dx, dy);
      });
    }

    // Draw placed blocks
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const block = getBlock(blocks, x, y);
        if (block) {
          ctx.fillStyle = block.color;
          ctx.fillRect(x * dx, y * dy, dx, dy);
          ctx.strokeStyle = '#333';
          ctx.strokeRect(x * dx, y * dy, dx, dy);
        }
      }
    }

    // Draw border
    ctx.strokeStyle = '#444';
    ctx.strokeRect(0, 0, BOARD_WIDTH * dx - 1, BOARD_HEIGHT * dy - 1);

    ctx.restore();
  }, [blocks, current, playing]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      // Trigger re-render
      setResizeCounter(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.canvas}>
      Sorry, this example cannot be run because your browser does not support the canvas element
    </canvas>
  );
}
