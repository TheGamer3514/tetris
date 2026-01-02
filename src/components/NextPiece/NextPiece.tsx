'use client';

import { useEffect, useRef } from 'react';
import { Piece } from '@/types/tetris';
import { eachBlock } from '@/utils/gameLogic';
import styles from './NextPiece.module.css';

interface NextPieceProps {
  piece: Piece | null;
}

const PREVIEW_SIZE = 5;

export function NextPiece({ piece }: NextPieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual canvas size to match display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const dx = canvas.width / PREVIEW_SIZE;
    const dy = canvas.height / PREVIEW_SIZE;

    // Clear canvas
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(0.5, 0.5);

    // Draw next piece
    if (piece) {
      const padding = (PREVIEW_SIZE - piece.type.size) / 2;
      eachBlock(piece.type, padding, padding, piece.dir, (x, y) => {
        ctx.fillStyle = piece.type.color;
        ctx.fillRect(x * dx, y * dy, dx, dy);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x * dx, y * dy, dx, dy);
      });
    }

    // Draw border
    ctx.strokeStyle = 'black';
    ctx.strokeRect(0, 0, PREVIEW_SIZE * dx - 1, PREVIEW_SIZE * dy - 1);

    ctx.restore();
  }, [piece]);

  return <canvas ref={canvasRef} className={styles.upcoming} />;
}
