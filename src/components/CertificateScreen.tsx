import { Award, Download, Printer, RotateCcw, Sprout } from 'lucide-react';
import { PHASE_METADATA } from '../simulation/constants';
import type { SimulationState } from '../simulation/types';

interface CertificateScreenProps {
  state: SimulationState;
  onRestart: () => void;
}

function downloadCertificateImage(state: SimulationState) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 820;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Crisp botanical technical diploma canvas
  ctx.fillStyle = '#F4F7F5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border & header band
  ctx.strokeStyle = '#14532D';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 1152, 772);

  ctx.fillStyle = '#0F2419';
  ctx.fillRect(28, 28, 1144, 145);

  ctx.fillStyle = '#6EE7B7';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('FORMACIÓN PROFESIONAL · FAMILIA AGRARIA Y FORESTAL', 68, 76);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('Comprobante de Práctica: Invernadero Forestal', 68, 130);

  // Student info block
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Alumno / Nick en clase:', 68, 232);
  ctx.fillStyle = '#14532D';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(state.studentNick, 68, 274);

  const levelText =
    state.level === 'principiante' ? 'Nivel Principiante' : 'Nivel Técnico';
  ctx.fillStyle = '#334155';
  ctx.font = '22px sans-serif';
  ctx.fillText(`Modalidad superada: ${levelText}`, 68, 318);
  ctx.fillText(
    `Salud final del ejemplar forestal: ${Math.round(state.health)} % (${state.healthState.toUpperCase()})`,
    68,
    352
  );

  // Date
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  ctx.fillStyle = '#475569';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Fecha de emisión: ${dateStr}`, 840, 232);

  // Score breakdown table
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(68, 392, 1064, 250);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(68, 392, 1064, 250);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Desglose de Puntuación por Fase', 94, 432);

  let y = 478;
  state.phaseHistory.forEach((rec) => {
    const label = PHASE_METADATA[rec.phase].shortTitle;
    ctx.fillStyle = '#1E293B';
    ctx.font = '20px sans-serif';
    ctx.fillText(label, 94, y);

    ctx.fillStyle = '#475569';
    ctx.font = '18px monospace';
    ctx.fillText(`Salud final: ${Math.round(rec.endHealth)}%`, 470, y);
    ctx.fillText(`Puntos: ${rec.pointsEarned}`, 680, y);
    ctx.fillText(`Bonus: +${rec.noWiltedBonus}`, 860, y);

    ctx.fillStyle = '#14532D';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`${rec.pointsEarned + rec.noWiltedBonus} pts`, 1015, y);
    y += 48;
  });

  // Total Score Banner
  ctx.fillStyle = '#14532D';
  ctx.fillRect(68, 668, 1064, 86);
  ctx.fillStyle = '#ECFDF5';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('PUNTUACIÓN TOTAL ACUMULADA', 98, 720);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px monospace';
  ctx.fillText(`${state.totalScore} pts`, 920, 724);

  const safeNick = state.studentNick
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '');
  const link = document.createElement('a');
  link.download = `comprobante-invernadero-${safeNick || 'alumno'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function CertificateScreen({ state, onRestart }: CertificateScreenProps) {
  const levelText =
    state.level === 'principiante' ? 'Nivel Principiante' : 'Nivel Técnico';

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div
        className="bg-white border-2 border-emerald-900 rounded-xl shadow-md overflow-hidden"
        data-testid="certificate-screen"
      >
        {/* Header */}
        <div className="bg-[#0F2419] px-6 py-6 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-800 border border-emerald-600 flex items-center justify-center">
              <Award className="w-7 h-7 text-emerald-300" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs text-emerald-300 font-semibold">
                FP Agraria y Forestal · Práctica Superada
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Certificado de Control de Invernadero
              </h1>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-300">Puntuación Total</div>
            <div className="font-mono-lcd text-3xl font-bold text-emerald-300">
              {state.totalScore} pts
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="text-xs text-slate-500">Alumno / Nick en clase</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{state.studentNick}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Nivel superado</div>
              <div className="text-base font-semibold text-emerald-900 mt-0.5">{levelText}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Salud final del ejemplar</div>
              <div className="font-mono-lcd text-lg font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <Sprout className="w-4 h-4" aria-hidden="true" />
                <span>{Math.round(state.health)} %</span>
              </div>
            </div>
          </div>

          {/* Phase Score Breakdown Table */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Desglose de puntuación de las 3 fases
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Fase</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Salud final</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Puntos base</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Bonus sin pocha</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {state.phaseHistory.map((rec) => (
                    <tr key={rec.phase}>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">
                        {PHASE_METADATA[rec.phase].shortTitle}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono-lcd text-slate-700">
                        {Math.round(rec.endHealth)} %
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono-lcd text-slate-700">
                        {rec.pointsEarned}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono-lcd text-emerald-700">
                        +{rec.noWiltedBonus}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono-lcd font-bold text-slate-900">
                        {rec.pointsEarned + rec.noWiltedBonus} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => downloadCertificateImage(state)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Descargar Comprobante (.PNG)</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Nueva Simulación</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
