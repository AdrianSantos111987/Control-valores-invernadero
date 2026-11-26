import { useState, type FormEvent } from 'react';
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  FileText,
  GraduationCap,
  Info,
  MessageSquarePlus,
  RotateCcw,
  Sprout,
  X,
} from 'lucide-react';
import {
  FOREST_SPECIES_DATA,
  INITIAL_TUTORIAL_CARDS,
  PHASE_METADATA,
  TUTORIAL_SECTIONS,
} from '../simulation/constants';
import type {
  DiagnosticIssue,
  DifficultyLevel,
  PhaseScoreRecord,
  SimulationPhase,
  TelemetrySample,
} from '../simulation/types';
import { DeathDiagnosticChart } from './DeathDiagnosticChart';

interface OnboardingModalProps {
  initialNick: string;
  initialLevel: DifficultyLevel;
  onStart: (nick: string, level: DifficultyLevel) => void;
}

export function OnboardingModal({
  initialNick,
  initialLevel,
  onStart,
}: OnboardingModalProps) {
  const [nick, setNick] = useState(initialNick);
  const [level, setLevel] = useState<DifficultyLevel>(initialLevel);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nick.trim();
    if (!trimmed) {
      setError('Introduce tu nick o nombre en clase para registrar tu práctica.');
      return;
    }
    setError('');
    onStart(trimmed, level);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full shadow-xl overflow-hidden">
        <div className="bg-[#0F2419] px-6 py-5 text-white">
          <div className="flex items-center gap-2.5 text-emerald-300 text-xs font-semibold mb-1.5">
            <Sprout className="w-4 h-4" aria-hidden="true" />
            <span>FP Familia Agraria y Forestal</span>
          </div>
          <h1 id="onboarding-title" className="text-xl sm:text-2xl font-bold leading-snug text-white">
            Simulador de Invernadero Forestal
          </h1>
          <p className="text-sm text-emerald-100/85 mt-1">
            Control Climático, Ciclo Día/Noche, Gases y Fertirrigación
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label
              htmlFor="student-nick-input"
              className="block text-sm font-semibold text-slate-900 mb-1.5"
            >
              Tu nick o nombre en clase
            </label>
            <input
              id="student-nick-input"
              type="text"
              value={nick}
              onChange={(e) => {
                setNick(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ej. Lucía_FP1 o CarlosG"
              maxLength={40}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
            />
            {error && (
              <p className="mt-1.5 text-xs font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900 mb-2">
              Selecciona tu nivel de práctica
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`rounded-lg border p-3.5 cursor-pointer transition-colors flex flex-col gap-1.5 ${
                  level === 'principiante'
                    ? 'border-emerald-700 bg-emerald-50/70'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    Nivel Principiante
                  </span>
                  <input
                    type="radio"
                    name="difficulty"
                    value="principiante"
                    checked={level === 'principiante'}
                    onChange={() => setLevel('principiante')}
                    className="accent-emerald-700"
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Muestra zonas verdes de rango óptimo en todos los medidores y consejos guiados paso a paso.
                </p>
              </label>

              <label
                className={`rounded-lg border p-3.5 cursor-pointer transition-colors flex flex-col gap-1.5 ${
                  level === 'tecnico'
                    ? 'border-amber-700 bg-amber-50/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-700" aria-hidden="true" />
                    Nivel Técnico
                  </span>
                  <input
                    type="radio"
                    name="difficulty"
                    value="tecnico"
                    checked={level === 'tecnico'}
                    onChange={() => setLevel('tecnico')}
                    className="accent-amber-700"
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Oculta las marcas verdes de ayuda en los sensores; ajusta los parámetros por criterio técnico propio.
                </p>
              </label>
            </div>
          </fieldset>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">3 fases · 60 s / 80 s / 60 s</span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Iniciar Simulación</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TutorialModalProps {
  onClose: () => void;
}

export function TutorialModal({ onClose }: TutorialModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-none flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-[#0F2419] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-300" aria-hidden="true" />
            <div>
              <h2 id="tutorial-title" className="text-base font-bold">
                Tutorial Guiado del Invernadero
              </h2>
              <p className="text-xs text-emerald-200">
                Simulación en pausa mientras consultas esta guía
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar tutorial"
            className="p-1.5 rounded-md hover:bg-emerald-900 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {TUTORIAL_SECTIONS.map((item) => (
            <div
              key={item.phase}
              className="rounded-lg border border-slate-200 bg-[#F9FBFA] p-4"
            >
              <h3 className="text-sm font-bold text-emerald-950">{item.phase}</h3>
              <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                {item.summary}
              </p>
              <p className="text-xs text-emerald-900 font-medium mt-2">
                Clave técnica: {item.keyRule}
              </p>
            </div>
          ))}

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              Estados fisiológicos y puntuación
            </h3>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>80–100 % (Sana): suma puntos continuamente cada segundo.</li>
              <li>50–79 % (Estrés inicial): hojas algo caídas; corrige el parámetro desviado.</li>
              <li>20–49 % (Pocha / Marchita): pierdes el bonus de fase si bajas del 50 %.</li>
              <li>0 % (Planta Muerta): detiene la fase con diagnóstico y opción de reintento.</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            Reanudar Simulación
          </button>
        </div>
      </div>
    </div>
  );
}

interface DatasheetModalProps {
  onClose: () => void;
}

export function DatasheetModal({ onClose }: DatasheetModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-none flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="datasheet-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-[#0F2419] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-300" aria-hidden="true" />
            <div>
              <h2 id="datasheet-title" className="text-base font-bold">
                Ficha Técnica de Cultivo Forestal
              </h2>
              <p className="text-xs text-emerald-200">
                Parámetros óptimos de referencia · Simulación en pausa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha técnica"
            className="p-1.5 rounded-md hover:bg-emerald-900 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {FOREST_SPECIES_DATA.map((sp) => (
            <div
              key={sp.scientificName}
              className="rounded-lg border border-slate-200 bg-[#F9FBFA] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2 mb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  {sp.commonName}{' '}
                  <span className="italic font-normal text-slate-600">({sp.scientificName})</span>
                </h3>
                <span className="text-xs text-emerald-800 font-medium">{sp.climateZone}</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="font-semibold text-slate-700">Temperatura óptima</dt>
                  <dd className="text-slate-600 font-mono-lcd">{sp.temperature}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Radiación solar / Luz</dt>
                  <dd className="text-slate-600 font-mono-lcd">{sp.light}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Humedad del sustrato</dt>
                  <dd className="text-slate-600 font-mono-lcd">{sp.moisture}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Conductividad y pH</dt>
                  <dd className="text-slate-600 font-mono-lcd">{sp.ecAndPh}</dd>
                </div>
              </dl>
              <p className="text-xs text-slate-700 mt-2.5 pt-2 border-t border-slate-200/80">
                <span className="font-semibold">Manejo en vivero:</span> {sp.notes}
              </p>
            </div>
          ))}

          <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-700">
            <div className="font-bold text-slate-900 mb-1">
              Referencia de gases y micronutrientes (Vivero Forestal)
            </div>
            <p>
              CO2 óptimo diurno: 550–1350 ppm (alarma laboral &gt; 1500 ppm) · O2 mínimo seguro: &gt;
              19,6 % · Hierro (Fe): 2,0–5,0 mg/L · Magnesio (Mg): 15–40 mg/L · Boro/Mn: 0,5–2,0 mg/L.
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            Volver al Control
          </button>
        </div>
      </div>
    </div>
  );
}

interface PhaseCompleteModalProps {
  completedRecord: PhaseScoreRecord;
  nextPhase: SimulationPhase;
  onContinue: () => void;
}

export function PhaseCompleteModal({
  completedRecord,
  nextPhase,
  onContinue,
}: PhaseCompleteModalProps) {
  const nextMeta = PHASE_METADATA[nextPhase];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase-complete-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-xl overflow-hidden">
        <div className="bg-emerald-900 px-6 py-4 text-white flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" aria-hidden="true" />
          <div>
            <h2 id="phase-complete-title" className="text-lg font-bold">
              Fase {completedRecord.phase} completada
            </h2>
            <p className="text-xs text-emerald-200">
              Salud final de la planta: {Math.round(completedRecord.endHealth)} %
            </p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-slate-200 bg-[#F9FBFA] p-3">
              <div className="text-xs text-slate-500">Puntos en la fase</div>
              <div className="font-mono-lcd text-xl font-bold text-slate-900 mt-0.5">
                +{completedRecord.pointsEarned}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-[#F9FBFA] p-3">
              <div className="text-xs text-slate-500">Bonus sin estado pocha</div>
              <div
                className={`font-mono-lcd text-xl font-bold mt-0.5 ${
                  completedRecord.noWiltedBonus > 0 ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {completedRecord.noWiltedBonus > 0
                  ? `+${completedRecord.noWiltedBonus}`
                  : '0 pts'}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Award className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>Siguiente etapa: {nextMeta.shortTitle}</span>
            </div>
            <p className="leading-relaxed text-emerald-900">{nextMeta.objective}</p>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
          >
            <span>Comenzar Fase {nextPhase}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeadPlantModalProps {
  phase: SimulationPhase;
  deathReason: string;
  telemetryHistory: TelemetrySample[];
  issues: DiagnosticIssue[];
  onRetryPhase: () => void;
  onRestartAll: () => void;
}

export function DeadPlantModal({
  phase,
  deathReason,
  telemetryHistory,
  issues,
  onRetryPhase,
  onRestartAll,
}: DeadPlantModalProps) {
  const [showChart, setShowChart] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dead-plant-title"
    >
      <div
        className={`bg-white border border-rose-200 rounded-xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          showChart ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="bg-rose-800 px-6 py-4 text-white flex items-center gap-3 shrink-0">
          <AlertOctagon className="w-6 h-6 text-rose-200 shrink-0" aria-hidden="true" />
          <div>
            <h2 id="dead-plant-title" className="text-lg font-bold">
              Planta Muerta (0 % de salud)
            </h2>
            <p className="text-xs text-rose-100">Simulación detenida en la Fase {phase}</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-950">
            <div className="font-bold mb-1">Diagnóstico de mortalidad:</div>
            <p className="leading-relaxed">{deathReason}</p>
          </div>

          {showChart && (
            <DeathDiagnosticChart
              phase={phase}
              telemetryHistory={telemetryHistory}
              issues={issues}
            />
          )}

          <button
            type="button"
            onClick={() => setShowChart((prev) => !prev)}
            data-testid="toggle-death-chart-btn"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-emerald-800" aria-hidden="true" />
            <span>{showChart ? 'Ocultar gráfica de datos' : 'Ver gráfica de datos'}</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onRetryPhase}
              data-testid="retry-phase-btn"
              className="inline-flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Repetir Fase {phase}</span>
              </span>
              <span className="text-[10px] font-normal text-emerald-100">
                Conserva puntos de fases anteriores
              </span>
            </button>

            <button
              type="button"
              onClick={onRestartAll}
              data-testid="restart-all-btn"
              className="inline-flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Empezar desde el principio</span>
              </span>
              <span className="text-[10px] font-normal text-slate-300">
                Fase 1 · 0 puntos · Elegir nivel
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InitialTutorialModalProps {
  studentNick: string;
  onStartPhase1: () => void;
}

export function InitialTutorialModal({
  studentNick,
  onStartPhase1,
}: InitialTutorialModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="initial-tutorial-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0F2419] px-6 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-emerald-300 shrink-0" aria-hidden="true" />
            <div>
              <h2 id="initial-tutorial-title" className="text-base sm:text-lg font-bold">
                Guía Rápida Inicial · Nivel Principiante
              </h2>
              <p className="text-xs text-emerald-200">
                Hola {studentNick} · El cronómetro arrancará cuando cierres este tutorial
              </p>
            </div>
          </div>
          <span className="font-mono-lcd text-xs text-emerald-300 shrink-0">
            Tarjeta {activeIndex + 1} / {INITIAL_TUTORIAL_CARDS.length}
          </span>
        </div>

        {/* 3 Interactive Cards */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {INITIAL_TUTORIAL_CARDS.map((card, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={card.step}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-pressed={isActive}
                  className={`text-left rounded-xl border p-4 transition-colors flex flex-col justify-between gap-2 cursor-pointer ${
                    isActive
                      ? 'border-emerald-700 bg-emerald-50/75'
                      : 'border-slate-200 bg-[#F9FBFA] hover:border-slate-300'
                  }`}
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                      {card.summary}
                    </p>
                  </div>
                  <p className="text-[11px] font-medium text-emerald-900 pt-2 border-t border-slate-200/80">
                    {card.detail}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-45 text-xs font-semibold text-slate-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              disabled={activeIndex === INITIAL_TUTORIAL_CARDS.length - 1}
              onClick={() =>
                setActiveIndex((i) => Math.min(INITIAL_TUTORIAL_CARDS.length - 1, i + 1))
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-45 text-xs font-semibold text-slate-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onStartPhase1}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>Comenzar Fase 1</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MoreInfoModalProps {
  studentNick: string;
  level: DifficultyLevel;
  phase: SimulationPhase;
  onClose: () => void;
}

const FEEDBACK_TYPES = [
  'Sugerencia de mejora',
  'Nueva especie/parámetro',
  'Reportar fallo',
] as const;

export function MoreInfoModal({
  studentNick,
  level,
  phase,
  onClose,
}: MoreInfoModalProps) {
  const [feedbackType, setFeedbackType] = useState<(typeof FEEDBACK_TYPES)[number]>(
    'Sugerencia de mejora'
  );
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyFeedback = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setFormError('Escribe brevemente tu sugerencia o incidencia antes de copiarla.');
      setCopied(false);
      return;
    }

    setFormError('');
    const formatted = [
      `[Simulador de Invernadero Forestal - ${feedbackType}]`,
      `Usuario: ${studentNick || 'Alumno/Docente FP'} · Nivel: ${
        level === 'principiante' ? 'Principiante' : 'Técnico'
      } · Fase ${phase}/3`,
      `Mensaje: ${trimmed}`,
    ].join('\n');

    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formatted);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = formatted;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    setCopied(true);
    if (!success) {
      setFormError('No se pudo acceder al portapapeles automático; copia el texto manualmente.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-info-title"
      data-testid="more-info-modal"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-[#0F2419] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Info className="w-5 h-5 text-emerald-300 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id="more-info-title" className="text-sm sm:text-base font-bold leading-snug">
                Simulador de Invernadero Forestal — Recurso Educativo Abierto
              </h2>
              <p className="text-xs text-emerald-200">
                Simulación en pausa mientras consultas esta información
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar información"
            className="p-1.5 rounded-md hover:bg-emerald-900 text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3">
          {/* 1. Autoría y propósito educativo */}
          <section className="rounded-xl border border-slate-200 bg-[#F9FBFA] p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Autoría y Propósito Educativo</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed">
              <strong className="font-semibold text-slate-900">Autoría:</strong> Desarrollado por{' '}
              <strong className="font-semibold text-emerald-950">Adrián Santos</strong> para alumnado
              y profesorado de Formación Profesional de las familias Agraria y Forestal (
              <em>Aprovechamiento y Conservación del Medio Natural</em>,{' '}
              <em>Gestión Forestal y del Medio Natural</em>, y{' '}
              <em>Producción Agropecuaria</em>).
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong className="font-semibold text-slate-900">Propósito pedagógico:</strong>{' '}
              Herramienta interactiva diseñada para entrenar el control climático, el manejo de
              ciclos día/noche e intercambio gaseoso (O2/CO2), la fertirrigación (NPK y
              micronutrientes) y la interpretación del vigor vegetal (NDVI) en viveros e
              invernaderos de producción de planta forestal.
            </p>
          </section>

          {/* 2. Buzón de Sugerencias y Reporte de Mejoras */}
          <section className="rounded-xl border border-[#D4DFD8] bg-white p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <MessageSquarePlus className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Buzón de Sugerencias y Reporte de Mejoras</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Echas en falta alguna especie forestal, quieres proponer ajustes en los parámetros
              agronómicos o has detectado alguna incidencia? Docentes y estudiantes pueden enviar
              propuestas copiando su mensaje formateado desde aquí.
            </p>

            <form onSubmit={handleCopyFeedback} className="flex flex-col gap-2.5">
              <div>
                <label
                  htmlFor="feedback-type-select"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Tipo de aportación
                </label>
                <select
                  id="feedback-type-select"
                  value={feedbackType}
                  onChange={(e) => {
                    setFeedbackType(e.target.value as (typeof FEEDBACK_TYPES)[number]);
                    if (copied) setCopied(false);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                >
                  {FEEDBACK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="feedback-message-input"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Tu mensaje o propuesta
                </label>
                <textarea
                  id="feedback-message-input"
                  rows={2}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (formError) setFormError('');
                    if (copied) setCopied(false);
                  }}
                  placeholder="Ej. Añadir ficha y parámetros de Pinus halepensis o ajustar umbral nocturno de O2..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 resize-y"
                />
                {formError && (
                  <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                    {formError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="submit"
                  data-testid="copy-suggestion-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-200" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>Preparar envío / Copiar sugerencia</span>
                </button>
              </div>

              {copied && (
                <div
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-950 font-medium flex items-start gap-2"
                  role="status"
                  data-testid="suggestion-copied-alert"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    ¡Sugerencia copiada! Ya puedes enviársela al profesor o pegarla en el
                    correo/formulario del aula
                  </span>
                </div>
              )}
            </form>
          </section>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            data-testid="close-more-info-btn"
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Volver al invernadero
          </button>
        </div>
      </div>
    </div>
  );
}
