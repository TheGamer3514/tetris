'use client';

import { useEffect, useRef } from 'react';
import { Piece } from '@/types/tetris';
import { eachBlock } from '@/utils/gameLogic';
import styles from './NextPiece.module.css';

interface NextPieceProps {
  piece: Piece | null;
  /** Render at reduced opacity, e.g. when the hold slot is locked for this turn. */
  dimmed?: boolean;
}

const PREVIEW_SIZE = 5;

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
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(px, py, dx, 2);
  ctx.fillRect(px, py, 2, dy);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(px, py + dy - 2, dx, 2);
  ctx.fillRect(px + dx - 2, py, 2, dy);
  ctx.strokeStyle = '#2a2a2a';
  ctx.strokeRect(px, py, dx, dy);
}

export function NextPiece({ piece, dimmed = false }: NextPieceProps) {
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
    ctx.globalAlpha = dimmed ? 0.35 : 1;

    // Draw next piece, centered within the preview grid
    if (piece) {
      const offsetX = (PREVIEW_SIZE - piece.type.size) / 2;
      const offsetY = (PREVIEW_SIZE - piece.type.size) / 2;
      eachBlock(piece.type, offsetX, offsetY, piece.dir, (x, y) => {
        drawBlock(ctx, x * dx, y * dy, dx, dy, piece.type.color);
      });
    }

    ctx.globalAlpha = 1;

    // Draw border
    ctx.strokeStyle = 'black';
    ctx.strokeRect(0, 0, PREVIEW_SIZE * dx - 1, PREVIEW_SIZE * dy - 1);

    ctx.restore();
  }, [piece, dimmed]);

  return <canvas ref={canvasRef} className={styles.upcoming} />;
}
