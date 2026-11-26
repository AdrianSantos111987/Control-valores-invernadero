import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Droplets,
  Fan,
  Flame,
  FlaskConical,
  Minus,
  Plus,
  Umbrella,
  Wind,
} from 'lucide-react';
import type { ActuatorSettings, HighlightTarget, SimulationState } from '../simulation/types';

interface ControlPanelProps {
  state: SimulationState;
  onUpdateActuator: <K extends keyof ActuatorSettings>(
    key: K,
    value: ActuatorSettings[K]
  ) => void;
  onMicrodose: (nutrient: 'iron' | 'magnesium' | 'boronManganese') => void;
}

interface TactileSliderCardProps {
  id: string;
  label: string;
  helperText: string;
  value: number;
  icon: ReactNode;
  onChange: (nextVal: number) => void;
  stepButton?: number;
  isHighlighted?: boolean;
  targetKey: HighlightTarget;
  compact?: boolean;
}

function TactileSliderCard({
  id,
  label,
  helperText,
  value,
  icon,
  onChange,
  stepButton = 5,
  isHighlighted = false,
  targetKey,
  compact = false,
}: TactileSliderCardProps) {
  const clampVal = (v: number) => Math.max(0, Math.min(100, v));

  return (
    <div
      data-actuator-key={targetKey}
      data-highlighted={isHighlighted ? 'true' : 'false'}
      className={`rounded-xl flex flex-col justify-between h-full transition-colors ${
        compact ? 'p-2 gap-1 min-h-[70px]' : 'p-2.5 gap-1.5 min-h-[90px]'
      } ${
        isHighlighted
          ? 'bg-rose-50 border-2 border-rose-600 ring-2 ring-rose-500/20'
          : 'bg-[#F8FAF9] border border-[#D4DFD8]'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <label
          htmlFor={id}
          className={`text-xs font-bold flex items-center gap-1 leading-tight min-w-0 ${
            isHighlighted ? 'text-rose-950' : 'text-slate-900'
          }`}
        >
          {isHighlighted ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          ) : (
            icon
          )}
          <span className="truncate">{label}</span>
        </label>
        <div className="flex items-center gap-1 shrink-0">
          {isHighlighted && (
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-rose-700">
              Ajustar
            </span>
          )}
          <span
            className={`font-mono-lcd text-xs font-bold bg-white rounded px-1.5 py-0.5 border ${
              isHighlighted
                ? 'text-rose-800 border-rose-300'
                : 'text-emerald-900 border-slate-200'
            }`}
          >
            {Math.round(value)}%
          </span>
        </div>
      </div>

      {/* Thick 14px slider flanked by [-] and [+] touch buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(clampVal(value - stepButton))}
          aria-label={`Reducir ${label}`}
          className={`${
            compact ? 'w-7 h-8' : 'w-9 h-9'
          } rounded-md bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0`}
        >
          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 w-full min-w-0 agri-slider"
        />

        <button
          type="button"
          onClick={() => onChange(clampVal(value + stepButton))}
          aria-label={`Aumentar ${label}`}
          className={`${
            compact ? 'w-7 h-8' : 'w-9 h-9'
          } rounded-md bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0`}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div
        className={`text-[10px] leading-tight truncate ${
          isHighlighted ? 'text-rose-800 font-medium' : 'text-slate-500'
        }`}
        title={helperText}
      >
        {helperText}
      </div>
    </div>
  );
}

export function ControlPanel({
  state,
  onUpdateActuator,
  onMicrodose,
}: ControlPanelProps) {
  const { phase, level, actuators, issues } = state;

  // Red actuator guidance is EXCLUSIVE to Nivel Principiante
  const highlightedTargets = new Set<HighlightTarget>(
    level === 'principiante'
      ? issues.flatMap((issue) => issue.targetActuators)
      : []
  );

  const co2Highlighted = highlightedTargets.has('co2Injection');
  const ironHighlighted = highlightedTargets.has('iron');
  const mgHighlighted = highlightedTargets.has('magnesium');
  const boronHighlighted = highlightedTargets.has('boronManganese');

  return (
    <aside
      className={`flex flex-col ${phase === 3 ? 'gap-2' : 'gap-2.5'}`}
      aria-label="Panel de control y actuadores"
      data-testid="actuators-panel"
    >
      {/* Module 1: Actuadores Climáticos (Always visible) */}
      <div className={`bg-white border border-[#D4DFD8] rounded-xl flex flex-col ${phase === 3 ? 'p-2.5 gap-1.5' : 'p-2.5 sm:p-3 gap-2'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Actuadores Climáticos
          </h3>
          <span className="text-[11px] text-slate-500">Mandos de control</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TactileSliderCard
            id="slider-shading-mesh"
            targetKey="shadingMesh"
            label="Malla de Sombreo"
            helperText="0% recogida · 100% cerrada (frena sol)"
            value={actuators.shadingMesh}
            icon={<Umbrella className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />}
            onChange={(val) => onUpdateActuator('shadingMesh', val)}
            isHighlighted={highlightedTargets.has('shadingMesh')}
            compact={phase === 3}
          />

          <TactileSliderCard
            id="slider-irrigation"
            targetKey="irrigation"
            label="Riego (Goteo)"
            helperText="Aporte hídrico al sustrato"
            value={actuators.irrigation}
            icon={<Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-hidden="true" />}
            onChange={(val) => onUpdateActuator('irrigation', val)}
            isHighlighted={highlightedTargets.has('irrigation')}
            compact={phase === 3}
          />

          <TactileSliderCard
            id="slider-heating"
            targetKey="heating"
            label="Calefacción"
            helperText="Eleva la temperatura interior"
            value={actuators.heating}
            icon={<Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" aria-hidden="true" />}
            onChange={(val) => onUpdateActuator('heating', val)}
            isHighlighted={highlightedTargets.has('heating')}
            compact={phase === 3}
          />

          <TactileSliderCard
            id="slider-ventilation"
            targetKey="ventilation"
            label="Ventilación"
            helperText="Refrigera aire y renueva O2 nocturno"
            value={actuators.ventilation}
            icon={<Fan className="w-3.5 h-3.5 text-cyan-700 shrink-0" aria-hidden="true" />}
            onChange={(val) => onUpdateActuator('ventilation', val)}
            isHighlighted={highlightedTargets.has('ventilation')}
            compact={phase === 3}
          />
        </div>
      </div>

      {/* Module 2: Gases (Phase 2 & 3) */}
      {phase >= 2 && (
        <div className={`bg-white border border-[#D4DFD8] rounded-xl flex flex-col ${phase === 3 ? 'p-2.5 gap-1.5' : 'p-2.5 sm:p-3 gap-2'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Inyección de Gases (CO2)
            </h3>
            <span className="text-[11px] text-slate-500">Fase 2–3</span>
          </div>

          <div
            data-actuator-key="co2Injection"
            data-highlighted={co2Highlighted ? 'true' : 'false'}
            className={`rounded-xl p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
              co2Highlighted
                ? 'bg-rose-50 border-2 border-rose-600 ring-2 ring-rose-500/20'
                : 'bg-[#F8FAF9] border border-[#D4DFD8]'
            }`}
          >
            <div className="min-w-0">
              <div
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  co2Highlighted ? 'text-rose-950' : 'text-slate-900'
                }`}
              >
                {co2Highlighted ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
                ) : (
                  <Wind className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
                )}
                <span>Inyección de CO2</span>
                {co2Highlighted && (
                  <span className="text-[9px] font-extrabold uppercase tracking-wide text-rose-700 ml-1">
                    Ajustar
                  </span>
                )}
              </div>
              <p className={`text-[10px] mt-0.5 ${co2Highlighted ? 'text-rose-800 font-medium' : 'text-slate-600'}`}>
                Solo de día para fotosíntesis (&lt; 1500 ppm).
              </p>
            </div>

            <button
              type="button"
              onClick={() => onUpdateActuator('co2Injection', !actuators.co2Injection)}
              aria-pressed={actuators.co2Injection}
              className={`min-h-[34px] px-3 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                actuators.co2Injection
                  ? 'bg-sky-800 text-white border-sky-900'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {actuators.co2Injection ? 'CO2 ACTIVO · APAGAR' : 'CO2 APAGADO · ACTIVAR'}
            </button>
          </div>
        </div>
      )}

      {/* Module 3: Fertirrigación Actuadores (Phase 3) */}
      {phase === 3 && (
        <div className="bg-white border border-[#D4DFD8] rounded-xl p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>Dosificadores de Fertirrigación</span>
            </h3>
            <span className="text-[11px] text-slate-500">Fase 3</span>
          </div>

          {/* Macronutrients NPK in compact 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <TactileSliderCard
              id="slider-n"
              targetKey="nDosing"
              label="Nitrógeno (N)"
              helperText="Crecimiento foliar"
              value={actuators.nDosing}
              icon={<FlaskConical className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />}
              onChange={(val) => onUpdateActuator('nDosing', val)}
              isHighlighted={highlightedTargets.has('nDosing')}
              compact
            />
            <TactileSliderCard
              id="slider-p"
              targetKey="pDosing"
              label="Fósforo (P)"
              helperText="Sistema radicular"
              value={actuators.pDosing}
              icon={<FlaskConical className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />}
              onChange={(val) => onUpdateActuator('pDosing', val)}
              isHighlighted={highlightedTargets.has('pDosing')}
              compact
            />
            <TactileSliderCard
              id="slider-k"
              targetKey="kDosing"
              label="Potasio (K)"
              helperText="Resistencia hídrica"
              value={actuators.kDosing}
              icon={<FlaskConical className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />}
              onChange={(val) => onUpdateActuator('kDosing', val)}
              isHighlighted={highlightedTargets.has('kDosing')}
              compact
            />
          </div>

          {/* Micronutrients Tactile Microdose Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div
              data-actuator-key="iron"
              data-highlighted={ironHighlighted ? 'true' : 'false'}
              className={`rounded-xl p-2 flex flex-col justify-between gap-1.5 h-full transition-colors ${
                ironHighlighted
                  ? 'bg-rose-50 border-2 border-rose-600 ring-2 ring-rose-500/20'
                  : 'bg-[#F8FAF9] border border-[#D4DFD8]'
              }`}
            >
              <div>
                <div className={`text-[11px] font-bold flex items-center gap-1 ${ironHighlighted ? 'text-rose-950' : 'text-slate-900'}`}>
                  {ironHighlighted && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" aria-hidden="true" />}
                  <span>Hierro (Fe)</span>
                </div>
                <div className={`text-[10px] leading-tight ${ironHighlighted ? 'text-rose-800 font-medium' : 'text-slate-500'}`}>
                  Anticlorosis
                </div>
              </div>
              <button
                type="button"
                onClick={() => onMicrodose('iron')}
                className={`w-full py-1.5 px-2 rounded-md text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  ironHighlighted
                    ? 'bg-rose-700 hover:bg-rose-600 active:bg-rose-800'
                    : 'bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900'
                }`}
              >
                + Gotas Fe
              </button>
            </div>

            <div
              data-actuator-key="magnesium"
              data-highlighted={mgHighlighted ? 'true' : 'false'}
              className={`rounded-xl p-2 flex flex-col justify-between gap-1.5 h-full transition-colors ${
                mgHighlighted
                  ? 'bg-rose-50 border-2 border-rose-600 ring-2 ring-rose-500/20'
                  : 'bg-[#F8FAF9] border border-[#D4DFD8]'
              }`}
            >
              <div>
                <div className={`text-[11px] font-bold flex items-center gap-1 ${mgHighlighted ? 'text-rose-950' : 'text-slate-900'}`}>
                  {mgHighlighted && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" aria-hidden="true" />}
                  <span>Magnesio (Mg)</span>
                </div>
                <div className={`text-[10px] leading-tight ${mgHighlighted ? 'text-rose-800 font-medium' : 'text-slate-500'}`}>
                  Clorofila
                </div>
              </div>
              <button
                type="button"
                onClick={() => onMicrodose('magnesium')}
                className={`w-full py-1.5 px-2 rounded-md text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  mgHighlighted
                    ? 'bg-rose-700 hover:bg-rose-600 active:bg-rose-800'
                    : 'bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900'
                }`}
              >
                + Gotas Mg
              </button>
            </div>

            <div
              data-actuator-key="boronManganese"
              data-highlighted={boronHighlighted ? 'true' : 'false'}
              className={`rounded-xl p-2 flex flex-col justify-between gap-1.5 h-full transition-colors ${
                boronHighlighted
                  ? 'bg-rose-50 border-2 border-rose-600 ring-2 ring-rose-500/20'
                  : 'bg-[#F8FAF9] border border-[#D4DFD8]'
              }`}
            >
              <div>
                <div className={`text-[11px] font-bold flex items-center gap-1 ${boronHighlighted ? 'text-rose-950' : 'text-slate-900'}`}>
                  {boronHighlighted && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" aria-hidden="true" />}
                  <span>Boro / Mn</span>
                </div>
                <div className={`text-[10px] leading-tight ${boronHighlighted ? 'text-rose-800 font-medium' : 'text-slate-500'}`}>
                  Brotes
                </div>
              </div>
              <button
                type="button"
                onClick={() => onMicrodose('boronManganese')}
                className={`w-full py-1.5 px-2 rounded-md text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  boronHighlighted
                    ? 'bg-rose-700 hover:bg-rose-600 active:bg-rose-800'
                    : 'bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900'
                }`}
              >
                + Gotas B/Mn
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
