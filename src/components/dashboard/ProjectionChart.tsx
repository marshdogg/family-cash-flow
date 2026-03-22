"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { formatCurrency } from "@/lib/format";

interface EventMarker {
  name: string;
  icon: string;
  amount: number;
}

interface Period {
  label: string;
  income: number;
  expense: number;
  invested: number;
  balance: number;
  plannedEventItems?: EventMarker[];
}

interface ProjectionChartProps {
  periods: Period[];
  whatIfPeriods?: Period[];
  threshold: number;
  onPeriodClick?: (index: number) => void;
  selectedIndex?: number | null;
}

interface HitArea {
  x: number;
  y: number;
  radius: number;
  period: Period;
  whatIfPeriod?: Period;
  index: number;
}

export function ProjectionChart({ periods, whatIfPeriods, threshold, onPeriodClick, selectedIndex }: ProjectionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hitAreasRef = useRef<HitArea[]>([]);
  const rafRef = useRef(0);
  const [width, setWidth] = useState(0);
  const H = 340;

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
    const whatIfBalances = whatIfPeriods?.map((p) => p.balance) ?? [];
    const allVals = [...balances, ...whatIfBalances, threshold];
    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const padding = (rawMax - rawMin) * 0.1 || rawMax * 0.1 || 1000;
    const minVal = rawMin - padding;
    const maxVal = rawMax + padding;
    return { balances, whatIfBalances, minVal, maxVal, range: maxVal - minVal || 1 };
  }, [periods, whatIfPeriods, threshold]);

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

    const PAD_TOP = 48;
    const PAD_BOTTOM = 30;
    const PAD_LEFT = 52;
    const PAD_RIGHT = 8;
    const plotH = H - PAD_TOP - PAD_BOTTOM;
    const { balances, minVal, maxVal, range } = chartData;
    const n = periods.length;

    const yScale = (val: number) => PAD_TOP + plotH - ((val - minVal) / range) * plotH;
    const xScale = (i: number) => PAD_LEFT + (i / (n - 1)) * (width - PAD_LEFT - PAD_RIGHT);

    ctx.clearRect(0, 0, width, H);

    // Format Y-axis label (compact: $1k, $10.5k, $100k)
    const formatYLabel = (val: number) => {
      const abs = Math.abs(val);
      if (abs >= 1000) {
        const k = val / 1000;
        return "$" + (Number.isInteger(Math.round(k)) ? Math.round(k) : k.toFixed(1)) + "k";
      }
      return "$" + Math.round(val);
    };

    // Gridlines + Y-axis labels
    ctx.strokeStyle = "#F3F4F6";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD_TOP + (plotH / 4) * i;
      const val = maxVal - (range * i) / 4;

      // Gridline
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(width - PAD_RIGHT, y);
      ctx.stroke();

      // Y-axis label
      ctx.font = "600 11px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#9CA3AF";
      ctx.fillText(formatYLabel(val), PAD_LEFT - 10, y);
    }

    // Threshold line
    const threshY = yScale(threshold);
    ctx.save();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD_LEFT, threshY);
    ctx.lineTo(width - PAD_RIGHT, threshY);
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

    // What-if dashed line
    const { whatIfBalances } = chartData;
    if (whatIfBalances.length > 0) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xScale(0), yScale(whatIfBalances[0]));
      for (let i = 1; i < whatIfBalances.length; i++) {
        const cx = (xScale(i - 1) + xScale(i)) / 2;
        ctx.bezierCurveTo(cx, yScale(whatIfBalances[i - 1]), cx, yScale(whatIfBalances[i]), xScale(i), yScale(whatIfBalances[i]));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // What-if dots
      whatIfBalances.forEach((bal, i) => {
        const x = xScale(i);
        const y = yScale(bal);
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = bal < threshold ? "#EF4444" : "#F59E0B";
        ctx.fill();
      });
      ctx.restore();
    }

    // Dots + hit areas
    const hitAreas: HitArea[] = [];
    balances.forEach((bal, i) => {
      const x = xScale(i);
      const y = yScale(bal);
      ctx.beginPath();
      ctx.arc(x, y, i === 0 ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = bal < threshold ? "#EF4444" : (i === 0 ? "#7B2FFF" : "#4A9BFF");
      ctx.fill();
      if (i === 0 || i === selectedIndex) {
        ctx.beginPath();
        ctx.arc(x, y, i === selectedIndex ? 9 : 7, 0, Math.PI * 2);
        ctx.fillStyle = i === selectedIndex ? "rgba(123, 47, 255, 0.25)" : "rgba(123, 47, 255, 0.15)";
        ctx.fill();
      }
      hitAreas.push({ x, y, radius: 20, period: periods[i], whatIfPeriod: whatIfPeriods?.[i], index: i });
    });
    hitAreasRef.current = hitAreas;

    // Planned event markers
    periods.forEach((p, i) => {
      const events = p.plannedEventItems;
      if (!events || events.length === 0) return;
      const x = xScale(i);
      const y = yScale(balances[i]);

      // Draw a flag line down from the dot
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y - 28);
      ctx.stroke();

      // Draw a label pill
      const label = events.length === 1
        ? `${events[0].icon} ${events[0].name}`
        : `${events[0].icon} ${events.length} events`;

      ctx.font = "600 10px 'Plus Jakarta Sans', system-ui, sans-serif";
      const textWidth = ctx.measureText(label).width;
      const pillW = textWidth + 12;
      const pillH = 18;
      const pillX = Math.min(Math.max(x - pillW / 2, PAD_LEFT), width - PAD_RIGHT - pillW);
      const pillY = y - 28 - pillH;

      // Pill background
      ctx.fillStyle = "#FFFBEB";
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
      ctx.fill();
      ctx.stroke();

      // Pill text
      ctx.fillStyle = "#92400E";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, pillX + pillW / 2, pillY + pillH / 2);
    });

    // X-axis labels
    ctx.font = "500 10px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#9CA3AF";
    const step = n <= 6 ? 1 : n <= 12 ? 2 : 3;
    for (let i = 0; i < n; i += step) {
      ctx.fillText(periods[i].label, xScale(i), H - 8);
    }
  }, [periods, whatIfPeriods, chartData, threshold, width, selectedIndex]);

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
        const w = closest.whatIfPeriod;
        const net = p.income - p.expense - p.invested;
        tooltip.style.display = "block";
        tooltip.style.left = clientX + 16 + "px";
        tooltip.style.top = clientY - 16 + "px";
        canvas.style.cursor = "pointer";

        const mono = "font-family:'JetBrains Mono',monospace;font-weight:600;";
        const row = (label: string, value: string, color: string) =>
          `<div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
            <span style="color:rgba(255,255,255,0.6);">${label}</span>
            <span style="${mono}color:${color};">${value}</span>
          </div>`;
        const divider = `<div style="height:1px;background:rgba(255,255,255,0.1);margin:6px 0;"></div>`;

        let html = `<div style="font-weight:700;font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">${p.label}</div>`;
        html += row("Balance", formatCurrency(p.balance), p.balance < threshold ? '#FCA5A5' : '#C4B5FD');

        // What-if balance comparison
        if (w) {
          const diff = w.balance - p.balance;
          html += row(
            "What If",
            formatCurrency(w.balance),
            w.balance < threshold ? '#FCA5A5' : '#FCD34D'
          );
          html += `<div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
            <span style="color:rgba(255,255,255,0.4);font-size:11px;">Difference</span>
            <span style="${mono}font-size:11px;color:${diff >= 0 ? '#86EFAC' : '#FCA5A5'};">${diff >= 0 ? '+' : '−'}${formatCurrency(Math.abs(diff))}</span>
          </div>`;
        }

        html += divider;
        html += row("Inflows", "+" + formatCurrency(p.income), "#86EFAC");
        html += row("Outflows", "−" + formatCurrency(p.expense), "#FCA5A5");
        if (p.invested > 0) {
          html += row("Invested", "−" + formatCurrency(p.invested), "#C4B5FD");
        }
        html += divider;
        html += row("Net", (net >= 0 ? '+' : '−') + formatCurrency(Math.abs(net)), net >= 0 ? '#86EFAC' : '#FCA5A5');

        tooltip.innerHTML = html;
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

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPeriodClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const area of hitAreasRef.current) {
      const dist = Math.sqrt((mx - area.x) ** 2 + (my - area.y) ** 2);
      if (dist < area.radius) {
        onPeriodClick(area.index);
        return;
      }
    }
  }, [onPeriodClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!onPeriodClick || periods.length === 0) return;
    const current = selectedIndex ?? -1;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(current + 1, periods.length - 1);
      onPeriodClick(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(current - 1, 0);
      onPeriodClick(prev);
    } else if (e.key === "Escape") {
      onPeriodClick(selectedIndex ?? 0); // toggle off
    }
  }, [onPeriodClick, selectedIndex, periods.length]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Build a screen-reader-accessible summary of the chart data
  const srSummary = periods.length > 0
    ? `Cash flow projection chart with ${periods.length} periods. Current balance: ${formatCurrency(periods[0].balance)}. Final projected balance: ${formatCurrency(periods[periods.length - 1].balance)}. Use arrow keys to navigate periods.`
    : "Cash flow projection chart. No data available.";

  return (
    <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md">
      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 text-[11px] font-medium text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          Balance
        </div>
        {whatIfPeriods && whatIfPeriods.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <div className="h-0.5 w-2 rounded-full bg-amber-400" />
              <div className="h-0.5 w-1 rounded-full bg-amber-400" />
              <div className="h-0.5 w-2 rounded-full bg-amber-400" />
            </div>
            What If
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="h-0.5 w-1.5 rounded-full bg-amber-400" />
            <div className="h-0.5 w-1.5 rounded-full bg-amber-400" />
          </div>
          Min ({formatCurrency(threshold)})
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-50" />
          Planned Event
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="application"
        aria-label={srSummary}
        aria-roledescription="interactive chart"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="block w-full"
          aria-hidden="true"
        />
        {/* Screen reader live region for selected period */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {selectedIndex != null && periods[selectedIndex] && (() => {
            const p = periods[selectedIndex];
            const net = p.income - p.expense - p.invested;
            return `${p.label}: Balance ${formatCurrency(p.balance)}, Income ${formatCurrency(p.income)}, Expenses ${formatCurrency(p.expense)}, Net ${net >= 0 ? "+" : "−"}${formatCurrency(Math.abs(net))}`;
          })()}
        </div>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-[1000] hidden min-w-[180px] rounded-xl bg-[#1E1B2E] px-4 py-3 text-[12px] text-white shadow-xl"
        style={{ backdropFilter: "blur(8px)" }}
        role="tooltip"
      />
    </div>
  );
}
