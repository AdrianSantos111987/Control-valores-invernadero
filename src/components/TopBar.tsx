import { BookOpen, FileText, Info, RotateCcw, Sprout } from 'lucide-react';
import { getPhaseDuration } from '../simulation/constants';
import type { SimulationState } from '../simulation/types';

interface TopBarProps {
  state: SimulationState;
  onOpenTutorial: () => void;
  onOpenDatasheet: () => void;
  onOpenInfo: () => void;
  onReset: () => void;
}

const HEALTH_LABEL: Record<SimulationState['healthState'], { text: string; colorClass: string; barClass: string }> = {
  sana: { text: 'Sana', colorClass: 'text-emerald-700', barClass: 'bg-emerald-600' },
  estres: { text: 'Estrés inicial', colorClass: 'text-amber-700', barClass: 'bg-amber-500' },
  pocha: { text: 'Pocha / Marchita', colorClass: 'text-orange-700', barClass: 'bg-orange-600' },
  muerta: { text: 'Muerta', colorClass: 'text-rose-700', barClass: 'bg-rose-600' },
};

export function TopBar({ state, onOpenTutorial, onOpenDatasheet, onOpenInfo, onReset }: TopBarProps) {
  const phaseDuration = getPhaseDuration(state.phase);
  const remaining = Math.max(0, Math.ceil(phaseDuration - state.elapsedInPhase));
  const healthInfo = HEALTH_LABEL[state.healthState];
  const levelLabel = state.level === 'principiante' ? 'Nivel Principiante' : 'Nivel Técnico';

  return (
    <header className="sticky top-0 z-30 bg-[#0F2419] text-slate-100 border-b border-emerald-950/80 shadow-sm no-print">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-x-4 sm:gap-x-6 gap-y-2">
        {/* Left: Brand + Student Nick & Level */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold tracking-tight text-white whitespace-nowrap">
              <span className="truncate">Invernadero Forestal</span>
              <span className="text-emerald-500" aria-hidden="true">·</span>
              <span className="text-emerald-200 font-medium">Fase {state.phase}/3</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-300 whitespace-nowrap">
              <span className="font-medium text-white truncate max-w-[120px] sm:max-w-[140px]" data-testid="student-nick-display">
                {state.studentNick || 'Alumno FP'}
              </span>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span
                className={
                  state.level === 'principiante' ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'
                }
                data-testid="student-level-display"
              >
                {levelLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Health Bar, Phase Timer, Score */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full lg:w-auto justify-between lg:justify-start">
          {/* Health Gauge */}
          <div className="flex-1 min-w-[145px] sm:min-w-[200px] max-w-[240px]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
              <span className="text-slate-300 font-medium">Salud</span>
              <span className="font-mono-lcd font-semibold text-white">
                {Math.round(state.health)}%{' '}
                <span className="text-slate-400 font-sans font-normal">({healthInfo.text})</span>
              </span>
            </div>
            <div
              className="w-full h-2 sm:h-2.5 bg-slate-800 rounded-sm overflow-hidden border border-slate-700"
              role="progressbar"
              aria-label="Salud de la planta"
              aria-valuenow={Math.round(state.health)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full transition-all duration-200 ${healthInfo.barClass}`}
                style={{ width: `${Math.max(0, Math.min(100, state.health))}%` }}
              />
            </div>
          </div>

          {/* Phase Timer & Score */}
          <div className="flex items-center gap-3 sm:gap-5 border-l border-emerald-900/80 pl-3 sm:pl-5 shrink-0">
            <div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 leading-none mb-1">Tiempo fase</div>
              <div className="font-mono-lcd text-sm sm:text-lg font-bold text-emerald-300 leading-none" data-testid="phase-timer">
                {String(remaining).padStart(2, '0')} s
              </div>
            </div>

            <div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 leading-none mb-1">Puntuación</div>
              <div className="font-mono-lcd text-sm sm:text-lg font-bold text-white leading-none" data-testid="total-score">
                {state.totalScore} pts
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tutorial Guiado</span>
          </button>
          <button
            type="button"
            onClick={onOpenDatasheet}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ficha Técnica de Cultivo</span>
          </button>
          <button
            type="button"
            onClick={onOpenInfo}
            data-testid="more-info-btn"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-100 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
            <span>Más info</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium bg-slate-900 hover:bg-rose-950/80 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-800/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
