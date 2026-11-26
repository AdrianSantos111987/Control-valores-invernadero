import { AlertOctagon, AlertTriangle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { OPTIMAL_RANGES, PHASE_METADATA } from '../simulation/constants';
import { computeTransmittance, isSensorOptimal } from '../simulation/engine';
import type { SimulationState } from '../simulation/types';
import { SensorGauge, VigorNdviGauge } from './SensorGauge';

interface GreenhouseStageProps {
  state: SimulationState;
}

export function GreenhouseStage({ state }: GreenhouseStageProps) {
  const { phase, level, health, healthState, dayNightTurn, cycleNumber, actuators, sensors, issues } =
    state;
  const meta = PHASE_METADATA[phase];
  const isNight = dayNightTurn === 'noche';

  const leafColors = (() => {
    if (healthState === 'muerta') {
      return { main: '#6B4423', dark: '#4A2E16', accent: '#8C6239', stem: '#5C4033' };
    }
    if (state.chlorosisActive) {
      return { main: '#EAB308', dark: '#CA8A04', accent: '#FEF08A', stem: '#71713A' };
    }
    if (healthState === 'pocha') {
      return { main: '#A16207', dark: '#713F12', accent: '#CA8A04', stem: '#655A2A' };
    }
    if (healthState === 'estres') {
      return { main: '#65A30D', dark: '#3F6212', accent: '#A3E635', stem: '#3F6212' };
    }
    return { main: '#16A34A', dark: '#14532D', accent: '#4ADE80', stem: '#166534' };
  })();

  const droopDeg =
    healthState === 'sana'
      ? 0
      : healthState === 'estres'
      ? 12
      : healthState === 'pocha'
      ? 28
      : 48;

  const plantScale = phase === 1 ? 0.78 : phase === 2 ? 0.88 : 0.96;

  const soilColor =
    sensors.moisture > 82
      ? '#1E293B'
      : sensors.moisture < 40
      ? '#A8896C'
      : '#4A3525';

  // Shading mesh visual coverage across greenhouse roof (810px span from x=85 to x=895)
  const meshWidth = Math.max(26, (actuators.shadingMesh / 100) * 810);
  const sunBeamOpacity = isNight
    ? 0
    : Math.max(0.14, (sensors.ambientSun / 100) * computeTransmittance(actuators.shadingMesh) * 0.9);

  const primaryIssue = issues[0] ?? null;
  const showTurnBanner = level === 'principiante' && phase >= 2 && state.turnBannerTimer > 0;
  const showAdviceWarning =
    level === 'principiante' && primaryIssue !== null && (health < 75 || issues.length > 0);

  const lightStatus = isNight ? 'optimal' : isSensorOptimal('light', sensors.light);

  const co2Status =
    sensors.co2 > 1500
      ? 'critical'
      : dayNightTurn === 'dia'
      ? isSensorOptimal('co2Day', sensors.co2)
      : isSensorOptimal('co2Night', sensors.co2);

  return (
    <section
      className="bg-white border border-[#D4DFD8] rounded-xl overflow-hidden flex flex-col"
      aria-label="Visualización del invernadero y telemetría de sensores"
    >
      {/* Compact Stage Header */}
      <div className="px-3.5 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-[#F9FBFA]">
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{meta.title}</h2>
          <p className="text-[11px] text-slate-600 leading-tight">
            Estadio: <span className="font-medium text-slate-800">{meta.plantStageName}</span>
            {phase >= 2 && (
              <>
                <span className="mx-1 text-slate-400" aria-hidden="true">·</span>
                <span>Ciclo {cycleNumber} de 2</span>
              </>
            )}
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold shrink-0 ${
            isNight
              ? 'bg-slate-900 text-sky-200 border-slate-700'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
          data-testid="day-night-indicator"
        >
          {isNight ? (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
              <span>NOCHE · Respiración celular</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>DÍA · Fotosíntesis activa</span>
            </>
          )}
        </div>
      </div>

      {/* CO2 Human Safety Alarm (explicit operational safety requirement in Phase 2+) */}
      {state.co2HumanDanger && (
        <div
          className="px-3.5 py-1.5 bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 border-b border-rose-800"
          role="alert"
          data-testid="co2-safety-alarm"
        >
          <AlertOctagon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            ALARMA DE SEGURIDAD: Peligro para operarios en el invernadero (CO2 a {sensors.co2} ppm).
          </span>
        </div>
      )}

      {/* Compact Proportional SVG Greenhouse (208px high, zero floating overlays) */}
      <div
        className={`relative w-full h-[204px] sm:h-[208px] overflow-hidden ${
          isNight ? 'bg-[#101D38]' : 'bg-[#D6EEFC]'
        }`}
        data-testid="greenhouse-svg-container"
      >
        <svg
          viewBox="0 0 980 290"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full block"
          role="img"
          aria-label={`Interior del invernadero en turno de ${dayNightTurn} con planta en estado ${healthState} al ${Math.round(health)}% de salud`}
        >
          <defs>
            <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="65%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
            <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#091124" />
              <stop offset="70%" stopColor="#132242" />
              <stop offset="100%" stopColor="#1E3A5F" />
            </linearGradient>
            <linearGradient id="sunBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE047" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nightGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
            </linearGradient>
            <pattern id="meshWeave" width="10" height="8" patternUnits="userSpaceOnUse">
              <rect width="10" height="8" fill="#1E293B" fillOpacity="0.82" />
              <line x1="0" y1="4" x2="10" y2="4" stroke="#64748B" strokeWidth="1" />
              <line x1="5" y1="0" x2="5" y2="8" stroke="#475569" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Full-bleed Exterior Sky extending smoothly across wide aspect ratios */}
          <rect
            x="-400"
            y="-40"
            width="1780"
            height="370"
            fill={isNight ? 'url(#skyNight)' : 'url(#skyDay)'}
          />

          {/* Sun or Moon */}
          {isNight ? (
            <g>
              <circle cx="170" cy="48" r="2.5" fill="#E2E8F0" opacity="0.8" />
              <circle cx="265" cy="30" r="2" fill="#E2E8F0" opacity="0.7" />
              <circle cx="680" cy="38" r="2.5" fill="#E2E8F0" opacity="0.8" />
              <circle cx="810" cy="54" r="2" fill="#E2E8F0" opacity="0.6" />
              <circle cx="670" cy="52" r="20" fill="#E0F2FE" />
              <circle cx="679" cy="47" r="17" fill="#0B152C" />
              <polygon points="240,86 740,86 840,270 140,270" fill="url(#nightGlow)" />
            </g>
          ) : (
            <g>
              <circle
                cx="680"
                cy="52"
                r={17 + (sensors.ambientSun / 100) * 7}
                fill="#FACC15"
                opacity="0.95"
              />
              <circle
                cx="680"
                cy="52"
                r={27 + (sensors.ambientSun / 100) * 10}
                fill="#FDE047"
                opacity="0.28"
              />
              <polygon
                points="230,88 750,88 840,270 140,270"
                fill="url(#sunBeam)"
                opacity={sunBeamOpacity}
              />
            </g>
          )}

          {/* Greenhouse Back Frame & Roof Truss */}
          <rect
            x="65"
            y="88"
            width="850"
            height="192"
            fill={isNight ? '#0F172A' : '#F8FAFC'}
            fillOpacity="0.16"
          />
          <polygon
            points="52,90 490,14 928,90"
            fill={isNight ? '#1E293B' : '#FFFFFF'}
            fillOpacity="0.14"
            stroke="#64748B"
            strokeWidth="3.5"
          />
          <line x1="490" y1="14" x2="490" y2="90" stroke="#64748B" strokeWidth="2.5" />
          <line x1="490" y1="14" x2="265" y2="90" stroke="#64748B" strokeWidth="2" />
          <line x1="490" y1="14" x2="715" y2="90" stroke="#64748B" strokeWidth="2" />

          {/* Unified Malla de Sombreo (%) across Roof */}
          <g>
            <line x1="85" y1="93" x2="895" y2="93" stroke="#475569" strokeWidth="2.5" strokeDasharray="6 4" />
            <rect
              x="85"
              y="87"
              width={meshWidth}
              height="12"
              rx="2.5"
              fill={actuators.shadingMesh > 5 ? 'url(#meshWeave)' : '#475569'}
              stroke="#1E293B"
              strokeWidth="1.5"
            />
            <rect x={85 + meshWidth - 5} y="85" width="7" height="16" rx="2" fill="#0F172A" />
            <text
              x="92"
              y="79"
              textAnchor="start"
              fill={isNight ? '#E2E8F0' : '#1E293B'}
              fontSize="12"
              fontWeight="700"
            >
              Malla de sombreo: {Math.round(actuators.shadingMesh)}%
            </text>
          </g>

          {/* Greenhouse Side Walls */}
          <rect x="65" y="90" width="850" height="190" fill="none" stroke="#475569" strokeWidth="4" />
          <line x1="265" y1="90" x2="265" y2="280" stroke="#64748B" strokeWidth="1.8" opacity="0.5" />
          <line x1="715" y1="90" x2="715" y2="280" stroke="#64748B" strokeWidth="1.8" opacity="0.5" />

          {/* Exhaust / Ventilation Fan (Right Wall) */}
          <g transform="translate(835, 148)">
            <circle cx="0" cy="0" r="24" fill="#1E293B" stroke="#475569" strokeWidth="2.5" />
            <g className={actuators.ventilation > 5 ? 'anim-fan-spin' : ''}>
              <path d="M -3.5,-17 L 5,-17 L 1.5,0 L -1.5,0 Z" fill={actuators.ventilation > 5 ? '#38BDF8' : '#64748B'} />
              <path d="M 17,-3.5 L 17,5 L 0,1.5 L 0,-1.5 Z" fill={actuators.ventilation > 5 ? '#38BDF8' : '#64748B'} />
              <path d="M 3.5,17 L -5,17 L -1.5,0 L 1.5,0 Z" fill={actuators.ventilation > 5 ? '#38BDF8' : '#64748B'} />
              <path d="M -17,3.5 L -17,-5 L 0,-1.5 L 0,1.5 Z" fill={actuators.ventilation > 5 ? '#38BDF8' : '#64748B'} />
            </g>
            <circle cx="0" cy="0" r="4.5" fill="#94A3B8" />
            <text x="0" y="36" textAnchor="middle" fill={isNight ? '#CBD5E1' : '#334155'} fontSize="11" fontWeight="700">
              Ventilación {Math.round(actuators.ventilation)}%
            </text>
          </g>

          {/* Heating Pipes (Left Wall) */}
          <g transform="translate(96, 204)">
            <rect x="0" y="0" width="84" height="34" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />
            <rect x="8" y="7" width="68" height="6" rx="3" fill={actuators.heating > 20 ? '#F97316' : '#475569'} />
            <rect x="8" y="20" width="68" height="6" rx="3" fill={actuators.heating > 20 ? '#FB923C' : '#475569'} />
            <text x="42" y="47" textAnchor="middle" fill={isNight ? '#CBD5E1' : '#334155'} fontSize="11" fontWeight="700">
              Calefacción {Math.round(actuators.heating)}%
            </text>
          </g>

          {/* Phase 3 Fertigation Tank (Left Rear) */}
          {phase === 3 && (
            <g transform="translate(106, 112)">
              <rect x="0" y="0" width="58" height="68" rx="5" fill="#0F172A" stroke="#334155" strokeWidth="2" />
              <rect
                x="5"
                y={64 - Math.min(56, (sensors.ec / 3.5) * 52)}
                width="48"
                height={Math.min(56, (sensors.ec / 3.5) * 52)}
                rx="2.5"
                fill={sensors.ec > 2.6 ? '#F59E0B' : '#0EA5E9'}
                opacity="0.78"
              />
              <text x="29" y="31" textAnchor="middle" fill="#F8FAFC" fontSize="10.5" fontWeight="700">
                NPK
              </text>
              <text x="29" y="45" textAnchor="middle" fill="#E2E8F0" fontSize="9.5">
                EC {sensors.ec.toFixed(2)}
              </text>
              <path d="M 58,56 L 230,56 L 230,224" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.7" />
            </g>
          )}

          {/* Floor & Grow Bench */}
          <rect x="-400" y="268" width="1780" height="30" fill="#334155" />
          <rect x="285" y="236" width="410" height="44" rx="5" fill="#475569" stroke="#334155" strokeWidth="2.5" />

          {/* Forest Container / Pot & Soil Substrate */}
          <polygon points="370,216 610,216 592,265 388,265" fill="#1E293B" stroke="#0F172A" strokeWidth="2.5" />
          <ellipse cx="490" cy="216" rx="120" ry="13" fill={soilColor} stroke="#1E293B" strokeWidth="2" />

          {sensors.moisture > 82 && (
            <ellipse cx="490" cy="217" rx="102" ry="8" fill="#0EA5E9" opacity="0.4" />
          )}

          {/* Irrigation Drip Pipe & Droplets */}
          <g>
            <line x1="340" y1="204" x2="438" y2="204" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="542" y1="204" x2="640" y2="204" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
            {actuators.irrigation > 10 && (
              <g fill="#38BDF8">
                <circle cx="424" cy="210" r="3" className="anim-drip" />
                <circle cx="556" cy="210" r="3" className="anim-drip" />
              </g>
            )}
          </g>

          {/* CO2 Diffuser Mist (Phase 2/3) */}
          {phase >= 2 && actuators.co2Injection && (
            <g fill="#E0F2FE" opacity="0.55">
              <circle cx="430" cy="182" r="3.5" className="anim-mist" />
              <circle cx="550" cy="176" r="4" className="anim-mist" />
            </g>
          )}

          {/* Forest Plant SVG */}
          <g transform={`translate(490, 216) scale(${plantScale})`}>
            <g transform={`rotate(${healthState === 'pocha' ? 6 : healthState === 'muerta' ? 14 : 0})`}>
              <path
                d={
                  phase === 1
                    ? 'M 0,0 Q -3,-38 0,-76'
                    : phase === 2
                    ? 'M -4,0 Q -5,-52 0,-106 L 4,-106 Q 2,-52 5,0 Z'
                    : 'M -6,0 Q -6,-60 0,-120 L 5,-120 Q 3,-60 6,0 Z'
                }
                fill={phase === 1 ? 'none' : leafColors.stem}
                stroke={leafColors.stem}
                strokeWidth={phase === 1 ? 5.5 : 2}
                strokeLinecap="round"
              />

              {phase === 1 && (
                <g>
                  <g transform={`translate(-3, -34) rotate(${-22 - droopDeg})`}>
                    <ellipse cx="-14" cy="0" rx="14" ry="6.5" fill={leafColors.dark} />
                  </g>
                  <g transform={`translate(3, -34) rotate(${22 + droopDeg})`}>
                    <ellipse cx="14" cy="0" rx="14" ry="6.5" fill={leafColors.dark} />
                  </g>
                  <g transform={`translate(-2, -60) rotate(${-28 - droopDeg})`}>
                    <path d="M 0,0 C -16,-12 -34,-7 -38,4 C -32,14 -12,12 0,0 Z" fill={leafColors.main} />
                    <path d="M -4,0 L -30,3" stroke={leafColors.accent} strokeWidth="1.4" opacity="0.7" />
                  </g>
                  <g transform={`translate(2, -62) rotate(${28 + droopDeg})`}>
                    <path d="M 0,0 C 16,-12 34,-7 38,4 C 32,14 12,12 0,0 Z" fill={leafColors.main} />
                    <path d="M 4,0 L 30,3" stroke={leafColors.accent} strokeWidth="1.4" opacity="0.7" />
                  </g>
                  <g transform={`translate(0, -77) rotate(${droopDeg * 0.5})`}>
                    <path d="M 0,0 C -9,-19 0,-26 0,-26 C 0,-26 9,-19 0,0 Z" fill={leafColors.accent} />
                  </g>
                </g>
              )}

              {phase >= 2 && (
                <g>
                  <path d="M -2,-48 Q -24,-62 -40,-70" fill="none" stroke={leafColors.stem} strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 2,-56 Q 24,-70 42,-78" fill="none" stroke={leafColors.stem} strokeWidth="3.5" strokeLinecap="round" />

                  <g transform={`translate(-38, -70) rotate(${-15 - droopDeg})`}>
                    <ellipse cx="-14" cy="0" rx="19" ry="10" fill={leafColors.dark} />
                    <ellipse cx="-22" cy="-6" rx="15" ry="8.5" fill={leafColors.main} />
                  </g>
                  <g transform={`translate(40, -78) rotate(${15 + droopDeg})`}>
                    <ellipse cx="14" cy="0" rx="19" ry="10" fill={leafColors.dark} />
                    <ellipse cx="22" cy="-6" rx="15" ry="8.5" fill={leafColors.main} />
                  </g>

                  <g transform={`translate(-20, -90) rotate(${-droopDeg * 0.8})`}>
                    <circle cx="-8" cy="0" r="18" fill={leafColors.dark} />
                    <circle cx="-15" cy="-6" r="14" fill={leafColors.main} />
                  </g>
                  <g transform={`translate(22, -94) rotate(${droopDeg * 0.8})`}>
                    <circle cx="8" cy="0" r="18" fill={leafColors.dark} />
                    <circle cx="15" cy="-6" r="14" fill={leafColors.main} />
                  </g>

                  <g transform={`translate(0, -110) rotate(${droopDeg * 0.5})`}>
                    <circle cx="0" cy="0" r="23" fill={leafColors.main} />
                    <circle cx="-11" cy="-6" r="14" fill={leafColors.accent} opacity="0.6" />
                    <circle cx="12" cy="-3" r="13" fill={leafColors.dark} opacity="0.45" />
                  </g>
                </g>
              )}

              {phase === 3 && (
                <g>
                  <path d="M -2,-86 Q -30,-104 -52,-112" fill="none" stroke={leafColors.stem} strokeWidth="3" strokeLinecap="round" />
                  <path d="M 2,-92 Q 30,-110 54,-118" fill="none" stroke={leafColors.stem} strokeWidth="3" strokeLinecap="round" />
                  <g transform={`translate(-50, -112) rotate(${-droopDeg})`}>
                    <circle cx="0" cy="0" r="16" fill={leafColors.main} />
                    <circle cx="-6" cy="-6" r="10" fill={leafColors.accent} opacity="0.7" />
                  </g>
                  <g transform={`translate(52, -118) rotate(${droopDeg})`}>
                    <circle cx="0" cy="0" r="16" fill={leafColors.main} />
                    <circle cx="6" cy="-6" r="10" fill={leafColors.accent} opacity="0.7" />
                  </g>
                  {state.chlorosisActive && (
                    <g stroke="#166534" strokeWidth="1.5" opacity="0.85">
                      <line x1="-16" y1="-112" x2="16" y2="-112" />
                      <line x1="0" y1="-128" x2="0" y2="-94" />
                    </g>
                  )}
                </g>
              )}

              {healthState === 'muerta' && (
                <g fill="#78350F">
                  <ellipse cx="-48" cy="4" rx="9" ry="3.5" transform="rotate(-12 -48 4)" />
                  <ellipse cx="42" cy="5" rx="10" ry="3.5" transform="rotate(18 42 5)" />
                  <ellipse cx="-16" cy="7" rx="8" ry="3" transform="rotate(8 -16 7)" />
                </g>
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Principiante-ONLY Compact Notice / Advice Strip strictly BETWEEN Greenhouse & Telemetry */}
      {level === 'principiante' && (
        <div
          className="border-t border-slate-200 bg-[#F9FBFA] px-3 py-1.5 flex flex-col gap-1"
          data-testid="principiante-advice-area"
        >
          {showTurnBanner && (
            <div
              className={`rounded-md px-2.5 py-1 border text-[11px] font-semibold flex items-center gap-2 ${
                isNight
                  ? 'bg-indigo-950 border-indigo-700 text-indigo-100'
                  : 'bg-amber-100 border-amber-300 text-amber-950'
              }`}
              role="status"
              data-testid="greenhouse-turn-banner"
            >
              {isNight ? (
                <Moon className="w-3.5 h-3.5 text-sky-300 shrink-0" aria-hidden="true" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
              )}
              <span className="leading-snug">
                {isNight
                  ? 'Ha llegado la NOCHE (respiración vegetal): recoge la Malla de Sombreo (0%), mantén el CO2 apagado y activa la Ventilación (40-60%) para renovar el Oxígeno.'
                  : 'Ha llegado el DÍA (fotosíntesis activa): ajusta la Malla de Sombreo según la radiación solar y activa la Inyección de CO2 (sin superar 1500 ppm).'}
              </span>
            </div>
          )}

          {showAdviceWarning && primaryIssue ? (
            <div
              className={`rounded-md px-2.5 py-1 border flex items-center gap-2 text-[11px] ${
                primaryIssue.severity === 'critical' || health < 65
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
              role="status"
              data-testid="greenhouse-advice-banner"
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 shrink-0 ${
                  primaryIssue.severity === 'critical' || health < 65
                    ? 'text-rose-600'
                    : 'text-amber-700'
                }`}
                aria-hidden="true"
              />
              <span className="leading-snug">
                <strong className="font-bold">{primaryIssue.title}:</strong>{' '}
                {primaryIssue.greenhouseBanner}
              </span>
            </div>
          ) : (
            !showTurnBanner && (
              <div className="rounded-md px-2.5 py-1 border border-emerald-200 bg-emerald-50 text-emerald-950 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span className="leading-snug">
                  <strong className="font-semibold">Parámetros en rango:</strong> {state.activeTip}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {/* Integrated Live Telemetry Monitor Panel (with Vigor / NDVI as 1st LCD card) */}
      <div className="p-2 sm:p-2.5 bg-white border-t border-slate-200 flex flex-col gap-1.5" data-testid="telemetry-panel">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-900">
            Panel de Telemetría y Sensores en Tiempo Real
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {level === 'principiante' ? 'Con marcas de rango óptimo' : 'Lectura técnica sin ayudas'}
          </span>
        </div>

        {/* Phase 1: 4 cards in 1 row | Phase 2: 6 cards in 2x3 | Phase 3: 13 cards in compact 5-col grid */}
        <div
          className={
            phase === 1
              ? 'grid grid-cols-2 sm:grid-cols-4 gap-2'
              : phase === 2
              ? 'grid grid-cols-2 sm:grid-cols-3 gap-2'
              : 'grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-1.5'
          }
        >
          {/* 1st Digital Card: Vigor / NDVI */}
          <VigorNdviGauge health={health} level={level} compact={phase === 3} />

          {/* Climate Sensors (All Phases) */}
          <SensorGauge
            label={phase === 3 ? 'Radiación' : 'Radiación Solar'}
            subtext={`Sol ext: ${Math.round(sensors.ambientSun)} %`}
            value={sensors.light}
            unit="%"
            min={0}
            max={100}
            optimalMin={OPTIMAL_RANGES.light.min}
            optimalMax={OPTIMAL_RANGES.light.max}
            level={level}
            status={lightStatus}
            compact={phase === 3}
          />
          <SensorGauge
            label={phase === 3 ? 'Humedad' : 'Humedad Sustrato'}
            subtext="Cepellón / Raíz"
            value={sensors.moisture}
            unit="%"
            min={0}
            max={100}
            optimalMin={OPTIMAL_RANGES.moisture.min}
            optimalMax={OPTIMAL_RANGES.moisture.max}
            level={level}
            status={isSensorOptimal('moisture', sensors.moisture)}
            compact={phase === 3}
          />
          <SensorGauge
            label="Temperatura"
            subtext="Ambiente interior"
            value={sensors.temperature}
            unit="°C"
            min={10}
            max={40}
            optimalMin={OPTIMAL_RANGES.temperature.min}
            optimalMax={OPTIMAL_RANGES.temperature.max}
            level={level}
            status={isSensorOptimal('temperature', sensors.temperature)}
            decimals={1}
            compact={phase === 3}
          />

          {/* Gas Sensors (Phase 2 & 3) */}
          {phase >= 2 && (
            <>
              <SensorGauge
                label="CO2"
                subtext={isNight ? 'Respiración' : 'Fotosíntesis'}
                value={sensors.co2}
                unit="ppm"
                min={200}
                max={2200}
                optimalMin={isNight ? OPTIMAL_RANGES.co2Night.min : OPTIMAL_RANGES.co2Day.min}
                optimalMax={isNight ? OPTIMAL_RANGES.co2Night.max : OPTIMAL_RANGES.co2Day.max}
                level={level}
                status={co2Status}
                compact={phase === 3}
              />
              <SensorGauge
                label="Oxígeno (O2)"
                subtext={isNight ? 'Nocturno' : 'Renovación'}
                value={sensors.o2}
                unit="%"
                min={16}
                max={21.5}
                optimalMin={OPTIMAL_RANGES.o2.min}
                optimalMax={OPTIMAL_RANGES.o2.max}
                level={level}
                status={isSensorOptimal('o2', sensors.o2)}
                decimals={1}
                compact={phase === 3}
              />
            </>
          )}

          {/* Fertigation & Nutrient Sensors (Phase 3) */}
          {phase === 3 && (
            <>
              <SensorGauge
                label="EC (Sales)"
                value={sensors.ec}
                unit="mS/cm"
                min={0.4}
                max={3.8}
                optimalMin={OPTIMAL_RANGES.ec.min}
                optimalMax={OPTIMAL_RANGES.ec.max}
                level={level}
                status={sensors.ec > 2.6 ? 'critical' : isSensorOptimal('ec', sensors.ec)}
                decimals={2}
                compact
              />
              <SensorGauge
                label="Nitrógeno (N)"
                value={sensors.nitrogen}
                unit="%"
                min={0}
                max={100}
                optimalMin={OPTIMAL_RANGES.nitrogen.min}
                optimalMax={OPTIMAL_RANGES.nitrogen.max}
                level={level}
                status={isSensorOptimal('nitrogen', sensors.nitrogen)}
                compact
              />
              <SensorGauge
                label="Fósforo (P)"
                value={sensors.phosphorus}
                unit="%"
                min={0}
                max={100}
                optimalMin={OPTIMAL_RANGES.phosphorus.min}
                optimalMax={OPTIMAL_RANGES.phosphorus.max}
                level={level}
                status={isSensorOptimal('phosphorus', sensors.phosphorus)}
                compact
              />
              <SensorGauge
                label="Potasio (K)"
                value={sensors.potassium}
                unit="%"
                min={0}
                max={100}
                optimalMin={OPTIMAL_RANGES.potassium.min}
                optimalMax={OPTIMAL_RANGES.potassium.max}
                level={level}
                status={isSensorOptimal('potassium', sensors.potassium)}
                compact
              />
              <SensorGauge
                label="Hierro (Fe)"
                value={sensors.iron}
                unit="mg/L"
                min={0}
                max={7}
                optimalMin={OPTIMAL_RANGES.iron.min}
                optimalMax={OPTIMAL_RANGES.iron.max}
                level={level}
                status={isSensorOptimal('iron', sensors.iron)}
                decimals={2}
                compact
              />
              <SensorGauge
                label="Magnesio (Mg)"
                value={sensors.magnesium}
                unit="mg/L"
                min={0}
                max={55}
                optimalMin={OPTIMAL_RANGES.magnesium.min}
                optimalMax={OPTIMAL_RANGES.magnesium.max}
                level={level}
                status={isSensorOptimal('magnesium', sensors.magnesium)}
                decimals={1}
                compact
              />
              <SensorGauge
                label="Boro / Mn"
                value={sensors.boronManganese}
                unit="mg/L"
                min={0}
                max={3.5}
                optimalMin={OPTIMAL_RANGES.boronManganese.min}
                optimalMax={OPTIMAL_RANGES.boronManganese.max}
                level={level}
                status={isSensorOptimal('boronManganese', sensors.boronManganese)}
                decimals={2}
                compact
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
