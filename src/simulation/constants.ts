import type { SimulationPhase } from './types';

export const PHASE_DURATIONS: Record<SimulationPhase, number> = {
  1: 60,
  2: 80, // 40s por ciclo Día/Noche (20s Día + 20s Noche) x 2 ciclos
  3: 60,
};

export const TOTAL_TEST_DURATION_SECONDS =
  PHASE_DURATIONS[1] + PHASE_DURATIONS[2] + PHASE_DURATIONS[3];

export function getPhaseDuration(phase: SimulationPhase): number {
  return PHASE_DURATIONS[phase];
}

export const OPTIMAL_RANGES = {
  light: { min: 55, max: 80, unit: '%', label: 'Radiación Solar / Luz' },
  moisture: { min: 50, max: 75, unit: '%', label: 'Humedad del Sustrato' },
  temperature: { min: 18, max: 25, unit: '°C', label: 'Temperatura' },
  co2Day: { min: 550, max: 1350, unit: 'ppm', label: 'CO2 (Día)' },
  co2Night: { min: 350, max: 900, unit: 'ppm', label: 'CO2 (Noche)' },
  o2: { min: 19.6, max: 21.2, unit: '%', label: 'Oxígeno (O2)' },
  ec: { min: 1.2, max: 2.2, unit: 'mS/cm', label: 'Conductividad (EC)' },
  nitrogen: { min: 45, max: 80, unit: '%', label: 'Nitrógeno (N)' },
  phosphorus: { min: 45, max: 75, unit: '%', label: 'Fósforo (P)' },
  potassium: { min: 45, max: 80, unit: '%', label: 'Potasio (K)' },
  iron: { min: 2.0, max: 5.0, unit: 'mg/L', label: 'Hierro (Fe)' },
  magnesium: { min: 15, max: 40, unit: 'mg/L', label: 'Magnesio (Mg)' },
  boronManganese: { min: 0.5, max: 2.0, unit: 'mg/L', label: 'Boro / Mn' },
} as const;

export const PHASE_METADATA: Record<
  SimulationPhase,
  {
    title: string;
    shortTitle: string;
    objective: string;
    plantStageName: string;
    pointsPerSecond: number;
    noWiltedBonus: number;
  }
> = {
  1: {
    title: 'Fase 1 · Clima Básico (Sol, Agua y Temperatura)',
    shortTitle: 'Fase 1: Clima Básico',
    objective:
      'Mantén sana la plántula forestal durante 60 s equilibrando radiación solar, humedad del sustrato y temperatura.',
    plantStageName: 'Plántula Forestal (Brote joven)',
    pointsPerSecond: 12,
    noWiltedBonus: 300,
  },
  2: {
    title: 'Fase 2 · Ciclo Día/Noche, Gases (O2/CO2) y Malla de Sombreo',
    shortTitle: 'Fase 2: Ciclo y Gases',
    objective:
      'Supera 2 ciclos completos de Día y Noche (80 s totales · 40 s/ciclo) gestionando la malla de sombreo, inyección de CO2 diurna y ventilación nocturna.',
    plantStageName: 'Plantón Forestal en Desarrollo',
    pointsPerSecond: 14,
    noWiltedBonus: 400,
  },
  3: {
    title: 'Fase 3 · Fertirrigación Completa (NPK y Micronutrientes)',
    shortTitle: 'Fase 3: Fertirrigación',
    objective:
      'Lleva el ejemplar a vigor forestal manteniendo clima, gases y equilibrio de macronutrientes NPK, micronutrientes y EC.',
    plantStageName: 'Ejemplar Forestal Vigoroso',
    pointsPerSecond: 20,
    noWiltedBonus: 500,
  },
};

export interface ForestSpeciesSheet {
  commonName: string;
  scientificName: string;
  climateZone: string;
  temperature: string;
  light: string;
  moisture: string;
  ecAndPh: string;
  notes: string;
}

export const FOREST_SPECIES_DATA: ForestSpeciesSheet[] = [
  {
    commonName: 'Encina (Cultivo base del simulador)',
    scientificName: 'Quercus ilex',
    climateZone: 'Mediterráneo continental · Vivero forestal',
    temperature: '18 °C – 25 °C (máx. estrés > 29 °C)',
    light: '55 % – 80 % (requiere sombreo en picos > 80 %)',
    moisture: '50 % – 75 % (muy sensible a encharcamiento > 85 %)',
    ecAndPh: 'EC 1,2 – 2,2 mS/cm · pH 6,0 – 7,0',
    notes:
      'Especie de raíz pivotante profunda. Requiere buena aireación radicular nocturna (O2 > 19,6 %) y aporte constante de Fe para evitar clorosis.',
  },
  {
    commonName: 'Pino Piñonero',
    scientificName: 'Pinus pinea',
    climateZone: 'Termomediterráneo · Bandeja forestal',
    temperature: '17 °C – 24 °C',
    light: '65 % – 85 % (heliófila, tolera alta radiación)',
    moisture: '45 % – 65 % (riesgo de damping-off si > 80 %)',
    ecAndPh: 'EC 1,0 – 1,8 mS/cm · pH 5,5 – 6,5',
    notes:
      'Menor demanda hídrica; conviene reducir riego en fases nocturnas y vigilar la conductividad eléctrica para evitar quemaduras en micorrizas.',
  },
  {
    commonName: 'Castaño',
    scientificName: 'Castanea sativa',
    climateZone: 'Atlántico / Montaña húmeda',
    temperature: '16 °C – 23 °C',
    light: '50 % – 70 % (agradece manta de sombreo diurna)',
    moisture: '60 % – 78 % (sustrato fresco y bien drenado)',
    ecAndPh: 'EC 1,1 – 1,9 mS/cm · pH 5,0 – 6,0',
    notes:
      'Muy exigente en Hierro (Fe) y Magnesio (Mg); suelos con pH alto bloquean micronutrientes provocando clorosis férrica rápida.',
  },
];

export const TUTORIAL_SECTIONS = [
  {
    phase: 'Fase 1 · Clima Básico (60 s)',
    summary:
      'Regula la Malla de Sombreo (0 % recogida a 100 % desplegada) para mantener la luz entre 55–80 %, ajusta el Riego por goteo (50–75 %) y equilibra Calefacción y Ventilación (18–25 °C).',
    keyRule:
      'Desplegar la malla de sombreo reduce la radiación solar interior y frena el sobrecalentamiento. Tanto la sequía (< 42 %) como el encharcamiento (> 82 %) dañan la raíz.',
  },
  {
    phase: 'Fase 2 · Ciclo Día / Noche y Gases (80 s)',
    summary:
      'Cada ciclo dura 40 s (20 s Día + 20 s Noche). De día despliega la Malla de Sombreo si el sol aprieta e inyecta CO2 (sin superar 1500 ppm).',
    keyRule:
      'De noche recoge la Malla de Sombreo al 0 %, apaga el CO2 y sube la Ventilación (40–60 %) para reponer O2 (> 19,6 %) durante la respiración vegetal.',
  },
  {
    phase: 'Fase 3 · Fertirrigación NPK y Micronutrientes (60 s)',
    summary:
      'Dosifica N, P y K de forma equilibrada (45–80 %) vigilando que la Conductividad Eléctrica (EC) no supere 2,5 mS/cm.',
    keyRule:
      'Aplica microdosis en gotas de Fe, Mg y B/Mn: si cualquier micronutriente cae a 0 durante varios segundos aparecerá clorosis férrica.',
  },
];

export const INITIAL_TUTORIAL_CARDS = [
  {
    step: 1,
    title: '1. Cómo leer los sensores de la izquierda',
    summary:
      'Debajo del invernadero verás en tiempo real los medidores LCD de radiación solar, humedad del sustrato y temperatura (más gases y nutrientes en las fases 2 y 3).',
    detail:
      'En Nivel Principiante cada medidor marca en verde la franja óptima. Si la aguja sale del verde, observa qué parámetro se desvía.',
  },
  {
    step: 2,
    title: '2. Cómo usar los actuadores de la derecha',
    summary:
      'Despliega la Malla de Sombreo (%) para reducir la radiación solar y el calor, regula el Riego por goteo y combina Calefacción y Ventilación.',
    detail:
      'Usa las barras deslizantes gruesas o los botones táctiles [-] y [+] de cada tarjeta. En fases avanzadas activarás la inyección de CO2 y dosificadores NPK/gotas.',
  },
  {
    step: 3,
    title: '3. Qué hacer si la planta se pone pocha',
    summary:
      'Si la salud baja del 80 % verás caer las hojas; por debajo del 50 % la planta entra en estado pocha, pero tienes margen para recuperarla antes de llegar a 0 %.',
    detail:
      'Lee el cuadro de Aviso y Consejo debajo de los sensores: te indicará exactamente qué mando subir o bajar para recuperar la salud de la planta.',
  },
];
