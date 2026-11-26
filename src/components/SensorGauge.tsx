import { AlertTriangle, CheckCircle2, HeartPulse, XCircle } from 'lucide-react';
import { computeNDVI } from '../simulation/engine';
import type { DifficultyLevel } from '../simulation/types';

interface SensorGaugeProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  level: DifficultyLevel;
  status: 'optimal' | 'warning' | 'critical';
  decimals?: number;
  subtext?: string;
  compact?: boolean;
}

export function SensorGauge({
  label,
  value,
  unit,
  min,
  max,
  optimalMin,
  optimalMax,
  level,
  status,
  decimals = 0,
  subtext,
  compact = false,
}: SensorGaugeProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const optStartPct = Math.max(0, Math.min(100, ((optimalMin - min) / (max - min)) * 100));
  const optWidthPct = Math.max(
    4,
    Math.min(100 - optStartPct, ((optimalMax - optimalMin) / (max - min)) * 100)
  );

  // In Técnico mode, keep LCD neutral phosphor green without diagnostic color spoilers
  const lcdTextClass =
    level === 'tecnico'
      ? 'text-emerald-300'
      : status === 'optimal'
      ? 'text-emerald-400'
      : status === 'warning'
      ? 'text-amber-300'
      : 'text-rose-400';

  const statusText =
    status === 'optimal' ? 'Óptimo' : status === 'warning' ? 'Desviado' : 'Crítico';

  const StatusIcon =
    status === 'optimal' ? CheckCircle2 : status === 'warning' ? AlertTriangle : XCircle;

  return (
    <div
      className={`bg-[#F9FBFA] border border-[#D4DFD8] rounded-lg flex flex-col justify-between h-full ${
        compact ? 'p-1.5 gap-0.5' : 'p-2 gap-1'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-800 leading-tight truncate" title={label}>
            {label}
          </div>
          {subtext && !compact && (
            <div className="text-[10px] text-slate-500 leading-tight truncate">{subtext}</div>
          )}
        </div>
        {level === 'principiante' && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-medium shrink-0 ${
              status === 'optimal'
                ? 'text-emerald-700'
                : status === 'warning'
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            <StatusIcon className="w-3 h-3" aria-hidden="true" />
            {!compact && <span>{statusText}</span>}
          </span>
        )}
      </div>

      {/* LCD Readout */}
      <div
        className={`bg-[#0C1712] border border-slate-800 rounded px-2 flex items-baseline justify-between ${
          compact ? 'py-0.5' : 'py-1'
        }`}
      >
        <span className={`font-mono-lcd text-sm font-bold tracking-tight ${lcdTextClass}`}>
          {value.toFixed(decimals)}
        </span>
        <span className="font-mono-lcd text-[10px] text-slate-400 ml-1">{unit}</span>
      </div>

      {/* Scale Bar with conditional green optimal zone ONLY in Principiante mode */}
      <div className="relative h-1.5 bg-slate-200 rounded-sm overflow-hidden">
        {level === 'principiante' && (
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/35 border-x border-emerald-600/60"
            style={{ left: `${optStartPct}%`, width: `${optWidthPct}%` }}
            title={`Rango óptimo: ${optimalMin} - ${optimalMax} ${unit}`}
            data-testid={`optimal-zone-${label}`}
          />
        )}
        <div
          className={`absolute top-0 bottom-0 w-1.5 -ml-[3px] rounded-xs transition-all duration-150 ${
            level === 'tecnico'
              ? 'bg-slate-800'
              : status === 'optimal'
              ? 'bg-emerald-700'
              : status === 'warning'
              ? 'bg-amber-600'
              : 'bg-rose-600'
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>

      {level === 'principiante' ? (
        <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500 font-mono-lcd">
          <span>{min}</span>
          <span className="text-emerald-700 font-semibold text-center truncate">
            {optimalMin}–{optimalMax}
          </span>
          <span>{max}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1 text-[9px] text-slate-400 font-mono-lcd">
          <span>{min}</span>
          <span>Directa</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

interface VigorNdviGaugeProps {
  health: number;
  level: DifficultyLevel;
  compact?: boolean;
}

export function VigorNdviGauge({ health, level, compact = false }: VigorNdviGaugeProps) {
  const { ndvi, label, tone } = computeNDVI(health);
  const clamped = Math.max(0, Math.min(100, Math.round(health)));

  const toneStyles = {
    optimal: {
      lcd: 'text-emerald-400',
      badge: 'text-emerald-700',
      bar: 'bg-emerald-600',
      Icon: CheckCircle2,
    },
    stress: {
      lcd: 'text-amber-300',
      badge: 'text-amber-700',
      bar: 'bg-amber-500',
      Icon: AlertTriangle,
    },
    wilted: {
      lcd: 'text-orange-400',
      badge: 'text-rose-700',
      bar: 'bg-orange-600',
      Icon: AlertTriangle,
    },
    dead: {
      lcd: 'text-rose-400',
      badge: 'text-rose-800',
      bar: 'bg-rose-600',
      Icon: XCircle,
    },
  }[tone];

  const StatusIcon = toneStyles.Icon;

  return (
    <div
      className={`bg-[#F9FBFA] border border-[#D4DFD8] rounded-lg flex flex-col justify-between h-full ${
        compact ? 'p-1.5 gap-0.5' : 'p-2 gap-1'
      }`}
      data-testid="ndvi-vigor-card"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-800 leading-tight flex items-center gap-1 truncate">
            <HeartPulse className="w-3 h-3 text-emerald-700 shrink-0" aria-hidden="true" />
            <span className="truncate">Vigor / NDVI</span>
          </div>
          {!compact && (
            <div className="text-[10px] text-slate-500 leading-tight truncate">
              Índice vigor vegetal
            </div>
          )}
        </div>
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${toneStyles.badge}`}>
          <StatusIcon className="w-3 h-3" aria-hidden="true" />
          {!compact && <span>{label}</span>}
        </span>
      </div>

      {/* LCD Digital Readout showing Vigor % + NDVI */}
      <div
        className={`bg-[#0C1712] border border-slate-800 rounded px-2 flex items-baseline justify-between gap-1 ${
          compact ? 'py-0.5' : 'py-1'
        }`}
      >
        <span className={`font-mono-lcd text-sm font-bold tracking-tight ${toneStyles.lcd}`}>
          {clamped}%
        </span>
        <span className={`font-mono-lcd text-[11px] font-semibold ${toneStyles.lcd}`}>
          NDVI {ndvi.toFixed(2)}
        </span>
      </div>

      {/* Vigor Scale Bar */}
      <div className="relative h-1.5 bg-slate-200 rounded-sm overflow-hidden">
        {level === 'principiante' && (
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-600/50"
            style={{ left: '80%', width: '20%' }}
            title="Vigor óptimo: 80–100 %"
          />
        )}
        <div
          className={`h-full transition-all duration-150 ${toneStyles.bar}`}
          style={{ width: `${clamped}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500 font-mono-lcd">
        <span>0%</span>
        <span className={`font-semibold text-center truncate ${toneStyles.badge}`}>
          {label} ({ndvi.toFixed(2)})
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
