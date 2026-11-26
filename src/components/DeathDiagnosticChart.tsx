import { useMemo, useState } from 'react';
import { OPTIMAL_RANGES } from '../simulation/constants';
import type { DiagnosticIssue, SimulationPhase, TelemetrySample } from '../simulation/types';

interface DeathDiagnosticChartProps {
  phase: SimulationPhase;
  telemetryHistory: TelemetrySample[];
  issues: DiagnosticIssue[];
}

interface SeriesConfig {
  key: keyof TelemetrySample;
  label: string;
  unit: string;
  color: string;
  min: number;
  max: number;
  optMin: number;
  optMax: number;
  decimals: number;
  minPhase: SimulationPhase;
  issueMatches: string[];
}

const SERIES_CONFIGS: SeriesConfig[] = [
  {
    key: 'moisture',
    label: 'Humedad Sustrato',
    unit: '%',
    color: '#0284C7',
    min: 0,
    max: 100,
    optMin: OPTIMAL_RANGES.moisture.min,
    optMax: OPTIMAL_RANGES.moisture.max,
    decimals: 0,
    minPhase: 1,
    issueMatches: ['Humedad'],
  },
  {
    key: 'temperature',
    label: 'Temperatura',
    unit: '°C',
    color: '#EA580C',
    min: 8,
    max: 42,
    optMin: OPTIMAL_RANGES.temperature.min,
    optMax: OPTIMAL_RANGES.temperature.max,
    decimals: 1,
    minPhase: 1,
    issueMatches: ['Temperatura'],
  },
  {
    key: 'light',
    label: 'Radiación Solar',
    unit: '%',
    color: '#D97706',
    min: 0,
    max: 100,
    optMin: OPTIMAL_RANGES.light.min,
    optMax: OPTIMAL_RANGES.light.max,
    decimals: 0,
    minPhase: 1,
    issueMatches: ['Luz', 'Malla de Sombreo'],
  },
  {
    key: 'o2',
    label: 'Oxígeno (O2)',
    unit: '%',
    color: '#7C3AED',
    min: 16,
    max: 22,
    optMin: OPTIMAL_RANGES.o2.min,
    optMax: OPTIMAL_RANGES.o2.max,
    decimals: 1,
    minPhase: 2,
    issueMatches: ['O2'],
  },
  {
    key: 'co2',
    label: 'CO2',
    unit: 'ppm',
    color: '#0F766E',
    min: 200,
    max: 2200,
    optMin: OPTIMAL_RANGES.co2Day.min,
    optMax: OPTIMAL_RANGES.co2Day.max,
    decimals: 0,
    minPhase: 2,
    issueMatches: ['CO2'],
  },
  {
    key: 'ec',
    label: 'Conductividad (EC)',
    unit: 'mS/cm',
    color: '#DC2626',
    min: 0,
    max: 4,
    optMin: OPTIMAL_RANGES.ec.min,
    optMax: OPTIMAL_RANGES.ec.max,
    decimals: 2,
    minPhase: 3,
    issueMatches: ['EC'],
  },
  {
    key: 'nitrogen',
    label: 'Nitrógeno (N)',
    unit: '%',
    color: '#65A30D',
    min: 0,
    max: 100,
    optMin: OPTIMAL_RANGES.nitrogen.min,
    optMax: OPTIMAL_RANGES.nitrogen.max,
    decimals: 0,
    minPhase: 3,
    issueMatches: ['NPK'],
  },
  {
    key: 'iron',
    label: 'Hierro (Fe)',
    unit: 'mg/L',
    color: '#B45309',
    min: 0,
    max: 7,
    optMin: OPTIMAL_RANGES.iron.min,
    optMax: OPTIMAL_RANGES.iron.max,
    decimals: 2,
    minPhase: 3,
    issueMatches: ['Micronutrientes'],
  },
];

function normalizeValue(val: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}

export function DeathDiagnosticChart({
  phase,
  telemetryHistory,
  issues,
}: DeathDiagnosticChartProps) {
  const availableSeries = useMemo(
    () => SERIES_CONFIGS.filter((s) => s.minPhase <= phase),
    [phase]
  );

  const criticalKeys = useMemo(() => {
    const issueParams = new Set(issues.map((i) => i.parameter));
    const last = telemetryHistory[telemetryHistory.length - 1];
    const detected = new Set<keyof TelemetrySample>();

    for (const s of availableSeries) {
      const matchedIssue = s.issueMatches.some((m) => issueParams.has(m));
      const lastVal = last ? Number(last[s.key]) : null;
      const outOfRange =
        lastVal !== null &&
        !(s.key === 'light' && phase >= 2 && lastVal === 0) &&
        (lastVal < s.optMin || lastVal > s.optMax);

      if (matchedIssue || outOfRange) {
        detected.add(s.key);
      }
    }

    if (detected.size === 0) {
      detected.add('moisture');
      detected.add('temperature');
    }
    return detected;
  }, [availableSeries, issues, phase, telemetryHistory]);

  const [selectedKeys, setSelectedKeys] = useState<Set<keyof TelemetrySample>>(
    () => new Set(criticalKeys)
  );

  const toggleSeries = (key: keyof TelemetrySample) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (telemetryHistory.length < 2) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        No hay suficientes muestras registradas para dibujar la evolución temporal.
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padLeft = 42;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minT = telemetryHistory[0].t;
  const maxT = Math.max(minT + 1, telemetryHistory[telemetryHistory.length - 1].t);

  const xForT = (t: number) => padLeft + ((t - minT) / (maxT - minT)) * plotW;
  const yForPct = (pct: number) => padTop + (1 - Math.max(0, Math.min(100, pct)) / 100) * plotH;

  const buildPath = (getter: (sample: TelemetrySample) => number) =>
    telemetryHistory
      .map((sample, idx) => {
        const x = xForT(sample.t).toFixed(1);
        const y = yForPct(getter(sample)).toFixed(1);
        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');

  const healthPath = buildPath((s) => s.health);
  const lastSample = telemetryHistory[telemetryHistory.length - 1];
  const firstSample = telemetryHistory[0];
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(minT + (maxT - minT) * r));

  return (
    <div
      className="rounded-xl border border-slate-200 bg-[#F9FBFA] p-3.5 flex flex-col gap-3"
      data-testid="death-diagnostic-chart"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Evolución Temporal hasta el Colapso (0 – {Math.round(maxT)} s)
          </h3>
          <p className="text-[11px] text-slate-600">
            Línea verde: Salud / Vigor (%) · Curvas normalizadas de los parámetros críticos fuera de rango
          </p>
        </div>
        <span className="text-[11px] font-mono-lcd font-semibold text-rose-700">
          Colapso en t = {Math.round(maxT)} s
        </span>
      </div>

      {/* Parameter Toggle Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-900 text-white text-[11px] font-bold">
          <span className="w-2.5 h-0.5 bg-emerald-300 inline-block" />
          Salud / Vigor (%)
        </span>

        {availableSeries.map((s) => {
          const active = selectedKeys.has(s.key);
          const isCritical = criticalKeys.has(s.key);
          return (
            <button
              key={String(s.key)}
              type="button"
              onClick={() => toggleSeries(s.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors ${
                active
                  ? isCritical
                    ? 'bg-rose-50 border-rose-500 text-rose-950'
                    : 'bg-white border-slate-400 text-slate-900'
                  : 'bg-white/70 border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-xs inline-block shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
              {isCritical && (
                <span className="text-[10px] font-bold text-rose-700">(Crítico)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-line SVG Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Gráfica de evolución de la salud y parámetros ambientales"
        >
          {/* Horizontal gridlines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yForPct(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={tick === 50 ? '#F59E0B' : '#E2E8F0'}
                  strokeWidth={tick === 50 ? 1.2 : 1}
                  strokeDasharray={tick === 50 ? '4 4' : undefined}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748B"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Vertical time ticks */}
          {xTicks.map((tTick) => {
            const x = xForT(tTick);
            return (
              <g key={tTick}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={height - padBottom}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748B"
                >
                  {tTick}s
                </text>
              </g>
            );
          })}

          {/* Selected Parameter Curves */}
          {availableSeries
            .filter((s) => selectedKeys.has(s.key))
            .map((s) => {
              const pathD = buildPath((sample) =>
                normalizeValue(Number(sample[s.key]), s.min, s.max)
              );
              const isCrit = criticalKeys.has(s.key);
              const lastY = yForPct(
                normalizeValue(Number(lastSample[s.key]), s.min, s.max)
              );
              return (
                <g key={String(s.key)}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={isCrit ? 2.4 : 1.7}
                    strokeDasharray={isCrit ? undefined : '4 3'}
                  />
                  <circle
                    cx={xForT(lastSample.t)}
                    cy={lastY}
                    r={isCrit ? 4 : 3}
                    fill={s.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}

          {/* Primary Health / Vigor Curve */}
          <path d={healthPath} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
          <circle
            cx={xForT(lastSample.t)}
            cy={yForPct(lastSample.health)}
            r="4.5"
            fill="#E11D48"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Critical Parameter Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {availableSeries
          .filter((s) => criticalKeys.has(s.key) || selectedKeys.has(s.key))
          .map((s) => {
            const startVal = Number(firstSample[s.key]).toFixed(s.decimals);
            const endVal = Number(lastSample[s.key]).toFixed(s.decimals);
            const isCrit = criticalKeys.has(s.key);
            return (
              <div
                key={String(s.key)}
                className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 text-xs ${
                  isCrit
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs inline-block shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Óptimo: {s.optMin}–{s.optMax} {s.unit}
                  </div>
                </div>
                <div className="text-right font-mono-lcd shrink-0">
                  <div className="font-bold">
                    {startVal} → {endVal} {s.unit}
                  </div>
                  {isCrit && (
                    <div className="text-[10px] font-sans font-bold text-rose-700">
                      Fuera de rango
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
