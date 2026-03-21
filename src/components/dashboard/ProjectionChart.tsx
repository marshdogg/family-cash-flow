"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { formatCurrency } from "@/lib/format";

interface Period {
  label: string;
  income: number;
  expense: number;
  balance: number;
}

interface ProjectionChartProps {
  periods: Period[];
  threshold: number;
}

export function ProjectionChart({ periods, threshold }: ProjectionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const H = 220;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const chartData = useMemo(() => {
    if (periods.length === 0) return null;
    const balances = periods.map((p) => p.balance);
    const allVals = [...balances, threshold];
    const minVal = Math.min(...allVals) * 0.85;
    const maxVal = Math.max(...allVals) * 1.1;
    return { balances, minVal, maxVal, range: maxVal - minVal || 1 };
  }, [periods, threshold]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || !chartData) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = width + "px";
    canvas.style.height = H + "px";
    canvas.width = width * dpr;
    canvas.height = H * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const PAD_TOP = 20;
    const PAD_BOTTOM = 30;
    const PAD_H = 8;
    const plotH = H - PAD_TOP - PAD_BOTTOM;
    const { balances, minVal, range } = chartData;
    const n = periods.length;

    const yScale = (val: number) => PAD_TOP + plotH - ((val - minVal) / range) * plotH;
    const xScale = (i: number) => PAD_H + (i / (n - 1)) * (width - PAD_H * 2);

    ctx.clearRect(0, 0, width, H);

    // Gridlines
    ctx.strokeStyle = "#F3F4F6";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD_TOP + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PAD_H, y);
      ctx.lineTo(width - PAD_H, y);
      ctx.stroke();
    }

    // Threshold line
    const threshY = yScale(threshold);
    ctx.save();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD_H, threshY);
    ctx.lineTo(width - PAD_H, threshY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Area fill under line
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "rgba(123, 47, 255, 0.15)");
    gradient.addColorStop(1, "rgba(74, 155, 255, 0.15)");

    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(balances[0]));
    for (let i = 1; i < n; i++) {
      const cx = (xScale(i - 1) + xScale(i)) / 2;
      ctx.bezierCurveTo(cx, yScale(balances[i - 1]), cx, yScale(balances[i]), xScale(i), yScale(balances[i]));
    }
    ctx.lineTo(xScale(n - 1), H - PAD_BOTTOM);
    ctx.lineTo(xScale(0), H - PAD_BOTTOM);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
    lineGradient.addColorStop(0, "#7B2FFF");
    lineGradient.addColorStop(1, "#4A9BFF");

    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(balances[0]));
    for (let i = 1; i < n; i++) {
      const cx = (xScale(i - 1) + xScale(i)) / 2;
      ctx.bezierCurveTo(cx, yScale(balances[i - 1]), cx, yScale(balances[i]), xScale(i), yScale(balances[i]));
    }
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots
    balances.forEach((bal, i) => {
      const x = xScale(i);
      const y = yScale(bal);
      ctx.beginPath();
      ctx.arc(x, y, i === 0 ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = bal < threshold ? "#EF4444" : (i === 0 ? "#7B2FFF" : "#4A9BFF");
      ctx.fill();
      if (i === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(123, 47, 255, 0.15)";
        ctx.fill();
      }
    });

    // X-axis labels
    ctx.font = "500 10px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#9CA3AF";
    const step = n <= 6 ? 1 : n <= 12 ? 2 : 3;
    for (let i = 0; i < n; i += step) {
      ctx.fillText(periods[i].label, xScale(i), H - 8);
    }
  }, [periods, chartData, threshold, width]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md">
      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 text-[11px] font-medium text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          Balance
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="h-0.5 w-1.5 rounded-full bg-amber-400" />
            <div className="h-0.5 w-1.5 rounded-full bg-amber-400" />
          </div>
          Min ({formatCurrency(threshold)})
        </div>
      </div>

      <div ref={wrapRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          className="block w-full"
          role="img"
          aria-label={`12-week cash flow projection chart. Current balance: ${formatCurrency(periods[0]?.balance ?? 0)}`}
        />
      </div>
    </div>
  );
}
