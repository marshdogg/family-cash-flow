"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { formatCurrency } from "@/lib/format";

interface Period {
  label: string;
  income: number;
  expense: number;
  invested: number;
  balance: number;
}

interface ProjectionChartProps {
  periods: Period[];
  threshold: number;
}

interface HitArea {
  x: number;
  y: number;
  radius: number;
  period: Period;
  index: number;
}

export function ProjectionChart({ periods, threshold }: ProjectionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hitAreasRef = useRef<HitArea[]>([]);
  const rafRef = useRef(0);
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

    // Dots + hit areas
    const hitAreas: HitArea[] = [];
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
      hitAreas.push({ x, y, radius: 20, period: periods[i], index: i });
    });
    hitAreasRef.current = hitAreas;

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

  // Tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const tooltip = tooltipRef.current;
      if (!canvas || !tooltip) return;

      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      let closest: HitArea | null = null;
      let closestDist = Infinity;

      for (const area of hitAreasRef.current) {
        const dist = Math.sqrt((mx - area.x) ** 2 + (my - area.y) ** 2);
        if (dist < area.radius && dist < closestDist) {
          closest = area;
          closestDist = dist;
        }
      }

      if (closest) {
        const p = closest.period;
        const net = p.income - p.expense - p.invested;
        tooltip.style.display = "block";
        tooltip.style.left = clientX + 16 + "px";
        tooltip.style.top = clientY - 16 + "px";
        canvas.style.cursor = "pointer";

        const investedRow = p.invested > 0 ? `
          <div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
            <span style="color:rgba(255,255,255,0.6);">Invested</span>
            <span style="font-family:'JetBrains Mono',monospace;font-weight:600;color:#C4B5FD;">−${formatCurrency(p.invested)}</span>
          </div>` : '';

        tooltip.innerHTML = `
          <div style="font-weight:700;font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">${p.label}</div>
          <div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
            <span style="color:rgba(255,255,255,0.6);">Balance</span>
            <span style="font-family:'JetBrains Mono',monospace;font-weight:600;color:${p.balance < threshold ? '#FCA5A5' : '#C4B5FD'};">${formatCurrency(p.balance)}</span>
          </div>
          <div style="height:1px;background:rgba(255,255,255,0.1);margin:6px 0;"></div>
          <div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
            <span style="color:rgba(255,255,255,0.6);">Inflows</span>
            <span style="font-family:'JetBrains Mono',monospace;font-weight:600;color:#86EFAC;">+${formatCurrency(p.income)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
            <span style="color:rgba(255,255,255,0.6);">Outflows</span>
            <span style="font-family:'JetBrains Mono',monospace;font-weight:600;color:#FCA5A5;">−${formatCurrency(p.expense)}</span>
          </div>
          ${investedRow}
          <div style="height:1px;background:rgba(255,255,255,0.1);margin:6px 0;"></div>
          <div style="display:flex;justify-content:space-between;gap:20px;">
            <span style="color:rgba(255,255,255,0.6);">Net</span>
            <span style="font-family:'JetBrains Mono',monospace;font-weight:600;color:${net >= 0 ? '#86EFAC' : '#FCA5A5'};">${net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(net))}</span>
          </div>
        `;
      } else {
        tooltip.style.display = "none";
        canvas.style.cursor = "default";
      }
    });
  }, [threshold]);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const tooltip = tooltipRef.current;
    if (tooltip) tooltip.style.display = "none";
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="block w-full"
          role="img"
          aria-label={`Cash flow projection chart. Current balance: ${formatCurrency(periods[0]?.balance ?? 0)}`}
        />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-[1000] hidden min-w-[180px] rounded-xl bg-[#1E1B2E] px-4 py-3 text-[12px] text-white shadow-xl"
        style={{ backdropFilter: "blur(8px)" }}
      />
    </div>
  );
}
