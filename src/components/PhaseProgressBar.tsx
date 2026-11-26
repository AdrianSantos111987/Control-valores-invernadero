import { Moon, Sun } from 'lucide-react';
import {
  getPhaseDuration,
  PHASE_DURATIONS,
  TOTAL_TEST_DURATION_SECONDS,
} from '../simulation/constants';
import type { SimulationState } from '../simulation/types';

interface PhaseProgressBarProps {
  state: SimulationState;
}

export function PhaseProgressBar({ state }: PhaseProgressBarProps) {
  const phaseDuration = getPhaseDuration(state.phase);
  const elapsed = Math.min(phaseDuration, Math.max(0, Math.round(state.elapsedInPhase)));
  const remaining = Math.max(0, phaseDuration - elapsed);
  const phasePct = Math.min(100, Math.max(0, (state.elapsedInPhase / phaseDuration) * 100));

  const priorDuration =
    state.phase === 1
      ? 0
      : state.phase === 2
      ? PHASE_DURATIONS[1]
      : PHASE_DURATIONS[1] + PHASE_DURATIONS[2];

  const totalElapsed = Math.min(
    TOTAL_TEST_DURATION_SECONDS,
    priorDuration + Math.min(phaseDuration, state.elapsedInPhase)
  );
  const globalPct = Math.min(
    100,
    Math.max(0, Math.round((totalElapsed / TOTAL_TEST_DURATION_SECONDS) * 100))
  );

  const hasDayNight = state.phase >= 2;
  const halfCycleSeconds = phaseDuration / 4;

  return (
    <section
      className="bg-white border-b border-[#D4DFD8] no-print"
      aria-label="Progreso temporal de la fase y de la prueba"
      data-testid="phase-progress-section"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5 items-center">
        {/* Left/Main: Current Phase Progress with Day/Night visual blocks */}
        <div className="lg:col-span-8 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-900 font-mono-lcd" data-testid="phase-progress-text">
              Fase {state.phase}: {elapsed}s / {phaseDuration}s — Faltan {remaining}s para completar la fase
            </span>
            {hasDayNight ? (
              <span className="text-[11px] font-medium text-slate-600">
                2 ciclos Día/Noche ({halfCycleSeconds}s por tramo)
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-600">
                Ciclo diurno continuo
              </span>
            )}
          </div>

          <div
            className="relative h-6 w-full rounded-md overflow-hidden border border-slate-300 bg-amber-100 select-none"
            role="progressbar"
            aria-label={`Progreso de la Fase ${state.phase}`}
            aria-valuenow={elapsed}
            aria-valuemin={0}
            aria-valuemax={phaseDuration}
          >
            {/* Background Timeline Segments */}
            {hasDayNight ? (
              <div className="absolute inset-0 grid grid-cols-4">
                <div className="bg-amber-100 border-r border-amber-300/80 flex items-center justify-center gap-1 text-[11px] font-bold text-amber-950">
                  <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>DÍA 1</span>
                </div>
                <div className="bg-[#172554] border-r border-indigo-800 flex items-center justify-center gap-1 text-[11px] font-bold text-sky-100">
                  <Moon className="w-3.5 h-3.5 text-sky-300 shrink-0" aria-hidden="true" />
                  <span>NOCHE 1</span>
                </div>
                <div className="bg-amber-100 border-r border-amber-300/80 flex items-center justify-center gap-1 text-[11px] font-bold text-amber-950">
                  <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>DÍA 2</span>
                </div>
                <div className="bg-[#172554] flex items-center justify-center gap-1 text-[11px] font-bold text-sky-100">
                  <Moon className="w-3.5 h-3.5 text-sky-300 shrink-0" aria-hidden="true" />
                  <span>NOCHE 2</span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-amber-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-950">
                <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                <span>DÍA CONTINUO · CLIMA BÁSICO</span>
              </div>
            )}

            {/* Elapsed Fill Overlay */}
            <div
              className="absolute inset-y-0 left-0 bg-emerald-500/40 transition-all duration-300 pointer-events-none"
              style={{ width: `${phasePct}%` }}
            />

            {/* Crisp Playhead Cursor */}
            <div
              className="absolute inset-y-0 w-1 bg-emerald-600 shadow-[0_0_0_1px_rgba(255,255,255,0.85)] transition-all duration-300 pointer-events-none"
              style={{ left: `calc(${phasePct}% - 2px)` }}
            />
          </div>
        </div>

        {/* Right: Global Challenge Progress */}
        <div className="lg:col-span-4 flex flex-col gap-1.5 lg:border-l lg:border-slate-200 lg:pl-5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-900 font-mono-lcd" data-testid="global-progress-text">
              Progreso total: Fase {state.phase} de 3 — {globalPct}% completado
            </span>
          </div>

          <div
            className="h-3.5 w-full rounded-md bg-slate-100 border border-slate-300 overflow-hidden flex"
            role="progressbar"
            aria-label="Progreso global de la prueba"
            aria-valuenow={globalPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-emerald-700 transition-all duration-300"
              style={{ width: `${globalPct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
