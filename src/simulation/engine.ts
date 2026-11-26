import {
  getPhaseDuration,
  OPTIMAL_RANGES,
  PHASE_METADATA,
} from './constants';
import type {
  ActuatorSettings,
  DayNightTurn,
  DiagnosticIssue,
  DifficultyLevel,
  GameStatus,
  HighlightTarget,
  PlantHealthState,
  SensorReadings,
  SimulationPhase,
  SimulationState,
  TelemetrySample,
} from './types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function classifyHealthState(health: number): PlantHealthState {
  if (health <= 0) return 'muerta';
  if (health < 50) return 'pocha';
  if (health < 80) return 'estres';
  return 'sana';
}

export function computeNDVI(health: number): {
  ndvi: number;
  label: string;
  tone: 'optimal' | 'stress' | 'wilted' | 'dead';
} {
  const h = clamp(health, 0, 100);
  if (h <= 0) {
    return { ndvi: 0.1, label: 'Muerta', tone: 'dead' };
  }
  if (h < 50) {
    // 1..49 -> 0.14..0.38 (30% -> ~0.28)
    const ndvi = Number((0.14 + ((h - 1) / 48) * 0.24).toFixed(2));
    return { ndvi, label: 'Planta Pocha', tone: 'wilted' };
  }
  if (h < 80) {
    // 50..79 -> 0.45..0.67 (62% -> ~0.54)
    const ndvi = Number((0.45 + ((h - 50) / 29) * 0.22).toFixed(2));
    return { ndvi, label: 'Estrés', tone: 'stress' };
  }
  // 80..100 -> 0.75..0.92 (92% -> ~0.85)
  const ndvi = Number((0.75 + ((h - 80) / 20) * 0.17).toFixed(2));
  return { ndvi, label: 'Óptimo', tone: 'optimal' };
}

export function getCycleInfo(
  phase: SimulationPhase,
  elapsedInPhase: number
): { turn: DayNightTurn; cycleNumber: 1 | 2; ambientSun: number; ambientTemp: number } {
  const duration = getPhaseDuration(phase);

  if (phase === 1) {
    const progress = clamp(elapsedInPhase / duration, 0, 1);
    const ambientSun = 72 + Math.sin(progress * Math.PI) * 24;
    const ambientTemp = 16 + Math.sin(progress * Math.PI) * 5.5;
    return { turn: 'dia', cycleNumber: 1, ambientSun, ambientTemp };
  }

  // Phase 2 = 80s (40s/cycle: 20s Day + 20s Night); Phase 3 = 60s (30s/cycle: 15s Day + 15s Night)
  const cycleLength = duration / 2;
  const halfCycle = cycleLength / 2;
  const clamped = clamp(elapsedInPhase, 0, duration - 0.001);
  const cycleNumber: 1 | 2 = clamped < cycleLength ? 1 : 2;
  const inCycle = clamped % cycleLength;
  const isDay = inCycle < halfCycle;

  if (isDay) {
    const dayProgress = inCycle / halfCycle;
    const ambientSun = 54 + Math.sin(dayProgress * Math.PI) * 44;
    const ambientTemp = 18 + Math.sin(dayProgress * Math.PI) * 9;
    return { turn: 'dia', cycleNumber, ambientSun, ambientTemp };
  } else {
    const nightProgress = (inCycle - halfCycle) / halfCycle;
    const ambientSun = 0;
    const ambientTemp = 14 - Math.sin(nightProgress * Math.PI) * 2.5;
    return { turn: 'noche', cycleNumber, ambientSun, ambientTemp };
  }
}

export function computeEC(sensors: SensorReadings): number {
  const macroMean = (sensors.nitrogen + sensors.phosphorus + sensors.potassium) / 3;
  const microContribution =
    sensors.iron * 0.035 + sensors.magnesium * 0.005 + sensors.boronManganese * 0.05;
  const concentrationFactor = sensors.moisture < 40 ? 1 + (40 - sensors.moisture) * 0.012 : 1;
  const raw = (0.3 + macroMean * 0.022 + microContribution) * concentrationFactor;
  return Number(clamp(raw, 0.2, 4.2).toFixed(2));
}

export function computeTransmittance(shadingMesh: number): number {
  return 1 - clamp(shadingMesh, 0, 100) * 0.0062;
}

export function createDefaultActuators(): ActuatorSettings {
  return {
    shadingMesh: 10,
    irrigation: 38,
    heating: 28,
    ventilation: 20,
    co2Injection: false,
    nDosing: 45,
    pDosing: 45,
    kDosing: 45,
  };
}

export function createDefaultSensors(): SensorReadings {
  const base: SensorReadings = {
    light: 67.5,
    ambientSun: 72,
    moisture: 62,
    temperature: 21.5,
    co2: 750,
    o2: 20.8,
    ec: 1.75,
    nitrogen: 64,
    phosphorus: 60,
    potassium: 64,
    iron: 3.4,
    magnesium: 26,
    boronManganese: 1.2,
  };
  base.ec = computeEC(base);
  return base;
}

function buildSample(t: number, health: number, sensors: SensorReadings): TelemetrySample {
  return {
    t: Math.round(t),
    health: Number(health.toFixed(1)),
    light: sensors.light,
    moisture: sensors.moisture,
    temperature: sensors.temperature,
    co2: sensors.co2,
    o2: sensors.o2,
    ec: sensors.ec,
    nitrogen: sensors.nitrogen,
    phosphorus: sensors.phosphorus,
    potassium: sensors.potassium,
    iron: sensors.iron,
    magnesium: sensors.magnesium,
    boronManganese: sensors.boronManganese,
  };
}

export function createInitialState(params: {
  studentNick: string;
  level: DifficultyLevel;
  skipOnboarding?: boolean;
  initialStatus?: GameStatus;
}): SimulationState {
  const sensors = createDefaultSensors();
  const actuators = createDefaultActuators();
  const status: GameStatus =
    params.initialStatus ?? (params.skipOnboarding ? 'playing' : 'onboarding');

  return {
    studentNick: params.studentNick,
    level: params.level,
    phase: 1,
    status,
    elapsedInPhase: 0,
    totalScore: 0,
    phasePoints: 0,
    wentWiltedInPhase: false,
    phaseHistory: [],
    health: 100,
    healthState: 'sana',
    dayNightTurn: 'dia',
    cycleNumber: 1,
    turnBannerTimer: 0,
    co2HumanDanger: false,
    chlorosisActive: false,
    micronutrientZeroSeconds: 0,
    sensors,
    actuators,
    issues: [],
    telemetryHistory: [buildSample(0, 100, sensors)],
    deathReason: null,
    activeTip:
      'Observa los sensores de la izquierda: regula la Malla de Sombreo (%) para mantener la luz entre 55–80 %, el Riego entre 50–75 % y la Temperatura entre 18–25 °C.',
  };
}

export function prepareNextPhaseState(
  prev: SimulationState,
  nextPhase: SimulationPhase
): SimulationState {
  const sensors = createDefaultSensors();
  const actuators = createDefaultActuators();
  const cycle = getCycleInfo(nextPhase, 0);
  sensors.ambientSun = cycle.ambientSun;
  sensors.light = Number(
    clamp(cycle.ambientSun * computeTransmittance(actuators.shadingMesh), 0, 100).toFixed(1)
  );
  const startHealth = Math.max(prev.health, 85);

  return {
    ...prev,
    phase: nextPhase,
    status: 'playing',
    elapsedInPhase: 0,
    phasePoints: 0,
    wentWiltedInPhase: false,
    health: startHealth,
    healthState: classifyHealthState(startHealth),
    dayNightTurn: cycle.turn,
    cycleNumber: cycle.cycleNumber,
    turnBannerTimer: nextPhase >= 2 ? 7 : 0,
    co2HumanDanger: false,
    chlorosisActive: false,
    micronutrientZeroSeconds: 0,
    sensors,
    actuators,
    issues: [],
    telemetryHistory: [buildSample(0, startHealth, sensors)],
    deathReason: null,
    activeTip:
      nextPhase === 2
        ? 'Ciclo Día/Noche iniciado (80 s · 40 s/ciclo): de día despliega la Malla de Sombreo si el sol aprieta e inyecta CO2 (< 1500 ppm); de noche recoge la malla al 0 % y ventila.'
        : 'Control de fertirrigación activo: equilibra los dosificadores N-P-K, vigila que la EC no supere 2,2 mS/cm y pulsa gotas de Fe, Mg y B/Mn antes de que caigan a cero.',
  };
}

export function retryCurrentPhaseState(prev: SimulationState): SimulationState {
  const sensors = createDefaultSensors();
  const actuators = createDefaultActuators();
  const cycle = getCycleInfo(prev.phase, 0);
  sensors.ambientSun = cycle.ambientSun;
  const preservedScore = prev.phaseHistory.reduce(
    (acc, r) => acc + r.pointsEarned + r.noWiltedBonus,
    0
  );

  return {
    ...prev,
    status: 'playing',
    elapsedInPhase: 0,
    phasePoints: 0,
    totalScore: preservedScore,
    wentWiltedInPhase: false,
    health: 100,
    healthState: 'sana',
    dayNightTurn: cycle.turn,
    cycleNumber: cycle.cycleNumber,
    turnBannerTimer: prev.phase >= 2 ? 7 : 0,
    co2HumanDanger: false,
    chlorosisActive: false,
    micronutrientZeroSeconds: 0,
    sensors,
    actuators,
    issues: [],
    telemetryHistory: [buildSample(0, 100, sensors)],
    deathReason: null,
  };
}

export function applyMicrodose(
  state: SimulationState,
  nutrient: 'iron' | 'magnesium' | 'boronManganese'
): SimulationState {
  const nextSensors = { ...state.sensors };
  if (nutrient === 'iron') {
    nextSensors.iron = Number(clamp(nextSensors.iron + 1.6, 0, 8).toFixed(2));
  } else if (nutrient === 'magnesium') {
    nextSensors.magnesium = Number(clamp(nextSensors.magnesium + 12, 0, 60).toFixed(1));
  } else {
    nextSensors.boronManganese = Number(
      clamp(nextSensors.boronManganese + 0.7, 0, 4).toFixed(2)
    );
  }
  nextSensors.ec = computeEC(nextSensors);
  return { ...state, sensors: nextSensors };
}

function buildGuidedTip(
  phase: SimulationPhase,
  turn: DayNightTurn,
  issues: DiagnosticIssue[]
): string {
  if (issues.length > 0) {
    return `${issues[0].title}: ${issues[0].detail}`;
  }
  if (phase === 1) {
    return 'Parámetros estables. Despliega la Malla de Sombreo si el sol sube al mediodía y ajusta el Riego por goteo si la humedad baja del 52 %.';
  }
  if (phase === 2) {
    return turn === 'dia'
      ? 'Turno de DÍA: la planta hace fotosíntesis. Despliega la Malla de Sombreo si el sol pasa del 78 % e inyecta CO2 por debajo de 1400 ppm.'
      : 'Turno de NOCHE: la planta respira y consume O2. Recoge la Malla de Sombreo al 0 %, apaga el CO2 y activa la Ventilación (40–60 %).';
  }
  return turn === 'dia'
    ? 'Turno de DÍA: el consumo de agua y NPK aumenta. Vigila la EC (1,2–2,2 mS/cm) y aplica gotas de micronutrientes si algún nivel baja.'
    : 'Turno de NOCHE: sube la Ventilación (40–60 %) para renovar el O2 y repón micronutrientes en gotas antes del siguiente día.';
}

export function stepSimulation(state: SimulationState, dtSeconds: number): SimulationState {
  if (state.status !== 'playing' || dtSeconds <= 0) {
    return state;
  }

  const phaseDuration = getPhaseDuration(state.phase);
  const dt = Math.min(dtSeconds, 2);
  const nextElapsed = Math.min(phaseDuration, state.elapsedInPhase + dt);

  const prevTurn = state.dayNightTurn;
  const cycle = getCycleInfo(state.phase, nextElapsed);
  const turnJustChanged = state.phase >= 2 && cycle.turn !== prevTurn;
  const nextTurnBannerTimer = turnJustChanged
    ? 8
    : Math.max(0, state.turnBannerTimer - dt);

  const { actuators } = state;
  const prevSensors = state.sensors;

  // 1. Light dynamics driven by ambient sun & unified Shading Mesh (%)
  const transmittance = computeTransmittance(actuators.shadingMesh);
  let targetLight = cycle.ambientSun * transmittance;
  if (cycle.turn === 'noche') {
    targetLight = 0;
  }
  const nextLight = clamp(
    prevSensors.light + (targetLight - prevSensors.light) * Math.min(1, dt * 2.2),
    0,
    100
  );

  // 2. Temperature dynamics
  const solarGain = (nextLight / 100) * 9.5;
  const heaterGain = (actuators.heating / 100) * 14.0;
  const ventCooling = (actuators.ventilation / 100) * 11.5;
  const targetTemp = cycle.ambientTemp + solarGain + heaterGain - ventCooling;
  const nextTemp = clamp(
    prevSensors.temperature + (targetTemp - prevSensors.temperature) * Math.min(1, dt * 0.45),
    5,
    45
  );

  // 3. Substrate moisture dynamics
  const evapRate =
    0.75 +
    Math.max(0, nextTemp - 18) * 0.08 +
    (nextLight / 100) * 0.45 +
    (actuators.ventilation / 100) * 0.25;
  const irrigationGain = (actuators.irrigation / 100) * 3.1;
  const nextMoisture = clamp(
    prevSensors.moisture + (irrigationGain - evapRate) * dt,
    0,
    100
  );

  // 4. Phase 2 & 3 Gas dynamics (CO2 & O2)
  let nextCo2 = prevSensors.co2;
  let nextO2 = prevSensors.o2;

  if (state.phase >= 2) {
    const ventRenewal = actuators.ventilation / 100;
    if (cycle.turn === 'dia') {
      const photoConsumption = nextLight > 25 ? 26 * (nextLight / 70) : 6;
      const injectionRate = actuators.co2Injection ? 135 : 0;
      const ventDiff = (420 - nextCo2) * ventRenewal * 0.45;
      nextCo2 = clamp(nextCo2 + (injectionRate - photoConsumption + ventDiff) * dt, 180, 2600);
      nextO2 = clamp(nextO2 + (0.14 + ventRenewal * 0.35) * dt, 15.0, 21.3);
      if (nextO2 > 20.9) {
        nextO2 = Math.max(20.9, nextO2 - 0.1 * dt);
      }
    } else {
      const respirationO2Drain = 0.32;
      const ventO2Recovery = ventRenewal * 0.65;
      nextO2 = clamp(nextO2 + (ventO2Recovery - respirationO2Drain) * dt, 15.0, 21.1);

      const respirationCo2Gain = 36;
      const injectionRate = actuators.co2Injection ? 110 : 0;
      const ventCo2Purge = (nextCo2 - 420) * ventRenewal * 0.55;
      nextCo2 = clamp(
        nextCo2 + (respirationCo2Gain + injectionRate - ventCo2Purge) * dt,
        220,
        2600
      );
    }
  }

  // 5. Phase 3 Fertigation dynamics (NPK & Micronutrients)
  let nextN = prevSensors.nitrogen;
  let nextP = prevSensors.phosphorus;
  let nextK = prevSensors.potassium;
  let nextFe = prevSensors.iron;
  let nextMg = prevSensors.magnesium;
  let nextBMn = prevSensors.boronManganese;

  if (state.phase === 3) {
    const uptakeMultiplier = cycle.turn === 'dia' ? 1.25 : 0.65;
    const flowFactor = actuators.irrigation > 10 ? 1 : 0.25;

    nextN = clamp(
      nextN + ((actuators.nDosing / 100) * 3.4 * flowFactor - 1.55 * uptakeMultiplier) * dt,
      0,
      100
    );
    nextP = clamp(
      nextP + ((actuators.pDosing / 100) * 3.1 * flowFactor - 1.35 * uptakeMultiplier) * dt,
      0,
      100
    );
    nextK = clamp(
      nextK + ((actuators.kDosing / 100) * 3.4 * flowFactor - 1.5 * uptakeMultiplier) * dt,
      0,
      100
    );

    nextFe = clamp(nextFe - 0.115 * uptakeMultiplier * dt, 0, 8);
    nextMg = clamp(nextMg - 0.85 * uptakeMultiplier * dt, 0, 60);
    nextBMn = clamp(nextBMn - 0.042 * uptakeMultiplier * dt, 0, 4);
  }

  const nextSensors: SensorReadings = {
    light: Number(nextLight.toFixed(1)),
    ambientSun: Number(cycle.ambientSun.toFixed(1)),
    moisture: Number(nextMoisture.toFixed(1)),
    temperature: Number(nextTemp.toFixed(1)),
    co2: Math.round(nextCo2),
    o2: Number(nextO2.toFixed(2)),
    ec: 0,
    nitrogen: Number(nextN.toFixed(1)),
    phosphorus: Number(nextP.toFixed(1)),
    potassium: Number(nextK.toFixed(1)),
    iron: Number(nextFe.toFixed(2)),
    magnesium: Number(nextMg.toFixed(1)),
    boronManganese: Number(nextBMn.toFixed(2)),
  };
  nextSensors.ec = computeEC(nextSensors);

  // 6. Evaluate diagnostic issues, exact actuator targets, and slowed health decay
  const issues: DiagnosticIssue[] = [];
  let healthDeltaPerSec = 0;

  if (cycle.turn === 'dia') {
    if (nextSensors.light > 83) {
      const severe = nextSensors.light > 91;
      healthDeltaPerSec -= severe ? 1.9 : 0.9;
      issues.push({
        id: 'light_high',
        severity: severe ? 'critical' : 'warning',
        title: 'Exceso de radiación solar',
        detail: 'Despliega más la Malla de Sombreo (%) para filtrar la luz y frenar el calor.',
        greenhouseBanner: `Radiación alta (${Math.round(nextSensors.light)}%): sube la Malla de Sombreo entre 40% y 65%`,
        parameter: 'Luz',
        targetActuators: ['shadingMesh'],
      });
    } else if (nextSensors.light < 48) {
      const severe = nextSensors.light < 32;
      healthDeltaPerSec -= severe ? 1.4 : 0.6;
      issues.push({
        id: 'light_low',
        severity: severe ? 'critical' : 'warning',
        title: 'Déficit lumínico diurno',
        detail: 'Recoge la Malla de Sombreo hacia el 0 % para dejar entrar suficiente radiación solar.',
        greenhouseBanner: `Radiación baja (${Math.round(nextSensors.light)}%): baja la Malla de Sombreo hacia 0–15%`,
        parameter: 'Luz',
        targetActuators: ['shadingMesh'],
      });
    }
  } else if (state.phase >= 2 && actuators.shadingMesh > 30) {
    healthDeltaPerSec -= 0.7;
    issues.push({
      id: 'blanket_night',
      severity: 'warning',
      title: 'Malla de sombreo cerrada de noche',
      detail: 'Recoge la Malla de Sombreo al 0 % durante la noche para favorecer la circulación de aire.',
      greenhouseBanner: `Malla cerrada de noche (${Math.round(actuators.shadingMesh)}%): recoge la Malla de Sombreo a 0%`,
      parameter: 'Malla de Sombreo',
      targetActuators: ['shadingMesh'],
    });
  }

  if (nextSensors.moisture > 82) {
    const severe = nextSensors.moisture > 90;
    healthDeltaPerSec -= severe ? 2.1 : 1.0;
    issues.push({
      id: 'moisture_high',
      severity: severe ? 'critical' : 'warning',
      title: 'Encharcamiento del sustrato',
      detail: 'Exceso de agua: baja el mando de Riego (goteo) para evitar asfixia radicular.',
      greenhouseBanner: `Humedad alta (${Math.round(nextSensors.moisture)}%): baja el Riego por debajo de 35%`,
      parameter: 'Humedad',
      targetActuators: ['irrigation'],
    });
  } else if (nextSensors.moisture < 42) {
    const severe = nextSensors.moisture < 28;
    healthDeltaPerSec -= severe ? 2.2 : 1.0;
    issues.push({
      id: 'moisture_low',
      severity: severe ? 'critical' : 'warning',
      title: 'Alerta por sequía en el sustrato',
      detail: 'Aumenta el Riego (goteo / nebulización) para hidratar el cepellón.',
      greenhouseBanner: `Humedad baja (${Math.round(nextSensors.moisture)}%): ajusta el Riego entre 55% y 75%`,
      parameter: 'Humedad',
      targetActuators: ['irrigation'],
    });
  }

  if (nextSensors.temperature > 26.5) {
    const severe = nextSensors.temperature > 30;
    healthDeltaPerSec -= severe ? 2.0 : 0.9;
    const tempTargets: HighlightTarget[] =
      actuators.heating > 15 ? ['heating', 'ventilation'] : ['ventilation'];
    if (cycle.turn === 'dia' && actuators.shadingMesh < 40) {
      tempTargets.push('shadingMesh');
    }
    issues.push({
      id: 'temp_high',
      severity: severe ? 'critical' : 'warning',
      title: 'Exceso de temperatura interior',
      detail: 'Baja la Calefacción, sube la Ventilación y despliega la Malla de Sombreo si es de día.',
      greenhouseBanner: `Temperatura alta (${nextSensors.temperature.toFixed(1)}°C): baja la Calefacción y sube la Ventilación`,
      parameter: 'Temperatura',
      targetActuators: tempTargets,
    });
  } else if (nextSensors.temperature < 16.5) {
    const severe = nextSensors.temperature < 13;
    healthDeltaPerSec -= severe ? 1.9 : 0.85;
    const coldTargets: HighlightTarget[] =
      actuators.ventilation > 25 ? ['heating', 'ventilation'] : ['heating'];
    issues.push({
      id: 'temp_low',
      severity: severe ? 'critical' : 'warning',
      title: 'Bajada térmica / Frío en invernadero',
      detail: 'Sube la Calefacción y modera la Ventilación para mantener entre 18 y 25 °C.',
      greenhouseBanner: `Temperatura baja (${nextSensors.temperature.toFixed(1)}°C): sube la Calefacción entre 40% y 70%`,
      parameter: 'Temperatura',
      targetActuators: coldTargets,
    });
  }

  let co2HumanDanger = false;
  if (state.phase >= 2) {
    if (nextSensors.co2 > 1500) {
      co2HumanDanger = true;
      healthDeltaPerSec -= 1.8;
      issues.push({
        id: 'co2_danger',
        severity: 'critical',
        title: 'Peligro para operarios/personas en el invernadero',
        detail: `CO2 en ${nextSensors.co2} ppm (> 1500 ppm). Apaga la Inyección de CO2 y sube la Ventilación de inmediato.`,
        greenhouseBanner: `CO2 peligroso (${nextSensors.co2} ppm): apaga el CO2 y sube la Ventilación`,
        parameter: 'CO2',
        targetActuators: ['co2Injection', 'ventilation'],
      });
    } else if (cycle.turn === 'dia' && nextSensors.co2 < 360) {
      healthDeltaPerSec -= 0.7;
      issues.push({
        id: 'co2_low',
        severity: 'warning',
        title: 'Déficit de CO2 fotosintético',
        detail: 'Activa la Inyección de CO2 durante el día (manteniendo menos de 1400 ppm).',
        greenhouseBanner: `CO2 bajo (${nextSensors.co2} ppm): activa la Inyección de CO2 (hasta 800–1200 ppm)`,
        parameter: 'CO2',
        targetActuators: ['co2Injection'],
      });
    }

    if (nextSensors.o2 < 19.3) {
      const severe = nextSensors.o2 < 18.3;
      healthDeltaPerSec -= severe ? 2.5 : 1.3;
      issues.push({
        id: 'o2_low',
        severity: severe ? 'critical' : 'warning',
        title: 'Falta de oxígeno nocturno',
        detail: 'La planta respira de noche: sube la Ventilación / Extractores para renovar el O2.',
        greenhouseBanner: `Oxígeno bajo (${nextSensors.o2.toFixed(1)}%): sube la Ventilación entre 45% y 65%`,
        parameter: 'O2',
        targetActuators: ['ventilation'],
      });
    }
  }

  let nextMicroZeroSeconds = state.micronutrientZeroSeconds;
  let chlorosisActive = false;

  if (state.phase === 3) {
    const lowMacros: string[] = [];
    const macroTargets: HighlightTarget[] = [];
    if (nextSensors.nitrogen < 35) {
      lowMacros.push('N');
      macroTargets.push('nDosing');
    }
    if (nextSensors.phosphorus < 35) {
      lowMacros.push('P');
      macroTargets.push('pDosing');
    }
    if (nextSensors.potassium < 35) {
      lowMacros.push('K');
      macroTargets.push('kDosing');
    }

    if (lowMacros.length > 0) {
      healthDeltaPerSec -= 0.8 * lowMacros.length;
      issues.push({
        id: 'macro_low',
        severity: lowMacros.length >= 2 ? 'critical' : 'warning',
        title: `Carencia de macronutrientes (${lowMacros.join(', ')})`,
        detail: `Sube los dosificadores de ${lowMacros.join(', ')} en el panel derecho.`,
        greenhouseBanner: `Falta de ${lowMacros.join(', ')}: sube el dosificador correspondiente al 55–75%`,
        parameter: 'NPK',
        targetActuators: macroTargets,
      });
    }

    if (nextSensors.ec > 2.6) {
      const severe = nextSensors.ec > 3.1;
      healthDeltaPerSec -= severe ? 2.1 : 1.1;
      issues.push({
        id: 'ec_high',
        severity: severe ? 'critical' : 'warning',
        title: 'Sobrefertilización (EC excesiva)',
        detail: `Conductividad en ${nextSensors.ec} mS/cm. Baja los dosificadores NPK para evitar quemadura radicular.`,
        greenhouseBanner: `EC excesiva (${nextSensors.ec.toFixed(2)} mS/cm): baja los dosificadores NPK por debajo del 30%`,
        parameter: 'EC',
        targetActuators: ['nDosing', 'pDosing', 'kDosing'],
      });
    }

    const microTargets: HighlightTarget[] = [];
    if (nextSensors.iron < 1.5) microTargets.push('iron');
    if (nextSensors.magnesium < 12) microTargets.push('magnesium');
    if (nextSensors.boronManganese < 0.4) microTargets.push('boronManganese');

    const anyMicroZero =
      nextSensors.iron <= 0.15 ||
      nextSensors.magnesium <= 1.0 ||
      nextSensors.boronManganese <= 0.05;

    if (anyMicroZero) {
      nextMicroZeroSeconds += dt;
    } else {
      nextMicroZeroSeconds = Math.max(0, nextMicroZeroSeconds - dt * 2);
    }

    if (nextMicroZeroSeconds >= 3.5) {
      chlorosisActive = true;
      healthDeltaPerSec -= 2.4;
      issues.push({
        id: 'chlorosis',
        severity: 'critical',
        title: 'Clorosis férrica por falta de micronutrientes',
        detail: 'Pulsa los botones + Gotas de Hierro (Fe), Magnesio (Mg) y Boro/Mn inmediatamente.',
        greenhouseBanner: 'Clorosis férrica: pulsa los botones [+ Gotas] de los micronutrientes en rojo',
        parameter: 'Micronutrientes',
        targetActuators: microTargets.length > 0 ? microTargets : ['iron', 'magnesium', 'boronManganese'],
      });
    } else if (microTargets.length > 0) {
      healthDeltaPerSec -= 0.6;
      issues.push({
        id: 'micro_low',
        severity: 'warning',
        title: 'Carencia incipiente de micronutrientes',
        detail: 'Pulsa + Gotas de Fe, Mg o B/Mn antes de que caigan a cero.',
        greenhouseBanner: 'Micronutrientes bajos: pulsa [+ Gotas] en los mandos resaltados',
        parameter: 'Micronutrientes',
        targetActuators: microTargets,
      });
    }
  }

  if (healthDeltaPerSec < 0) {
    healthDeltaPerSec = Math.max(-4.3, healthDeltaPerSec);
  } else if (issues.length === 0) {
    healthDeltaPerSec += 2.2;
  }

  const nextHealth = Number(clamp(state.health + healthDeltaPerSec * dt, 0, 100).toFixed(1));
  const nextHealthState = classifyHealthState(nextHealth);
  const wentWiltedInPhase = state.wentWiltedInPhase || nextHealth < 50;

  // Record second-by-second telemetry sample
  const prevLastT =
    state.telemetryHistory.length > 0
      ? state.telemetryHistory[state.telemetryHistory.length - 1].t
      : -1;
  const currentBucket = Math.floor(nextElapsed);
  const nextHistoryTelemetry =
    currentBucket > prevLastT || nextHealth <= 0
      ? [...state.telemetryHistory, buildSample(nextElapsed, nextHealth, nextSensors)]
      : state.telemetryHistory;

  // 7. Scoring
  const meta = PHASE_METADATA[state.phase];
  let scoreDelta = 0;
  if (nextHealth >= 80 && !co2HumanDanger) {
    scoreDelta += meta.pointsPerSecond * dt;
  } else if (nextHealth >= 50 && !co2HumanDanger) {
    scoreDelta += meta.pointsPerSecond * 0.35 * dt;
  }
  if (co2HumanDanger) {
    scoreDelta -= 15 * dt;
  }

  const nextPhasePoints = Math.max(0, Math.round(state.phasePoints + scoreDelta));
  const nextTotalScore = Math.max(
    0,
    state.phaseHistory.reduce((acc, r) => acc + r.pointsEarned + r.noWiltedBonus, 0) +
      nextPhasePoints
  );

  // 8. Check Death or Phase Completion
  if (nextHealth <= 0) {
    const primaryCause =
      issues.length > 0
        ? `${issues[0].title}: ${issues[0].detail}`
        : 'Colapso fisiológico acumulado por desequilibrio climático o nutricional.';
    return {
      ...state,
      elapsedInPhase: nextElapsed,
      health: 0,
      healthState: 'muerta',
      status: 'dead',
      wentWiltedInPhase: true,
      dayNightTurn: cycle.turn,
      cycleNumber: cycle.cycleNumber,
      turnBannerTimer: 0,
      co2HumanDanger,
      chlorosisActive,
      micronutrientZeroSeconds: nextMicroZeroSeconds,
      sensors: nextSensors,
      issues,
      telemetryHistory: nextHistoryTelemetry,
      phasePoints: nextPhasePoints,
      totalScore: nextTotalScore,
      deathReason: primaryCause,
      activeTip: primaryCause,
    };
  }

  if (nextElapsed >= phaseDuration) {
    const bonus = wentWiltedInPhase ? 0 : meta.noWiltedBonus;
    const record = {
      phase: state.phase,
      pointsEarned: nextPhasePoints,
      noWiltedBonus: bonus,
      endHealth: nextHealth,
      wentWilted: wentWiltedInPhase,
    };
    const nextHistory = [...state.phaseHistory, record];
    const finalTotalScore = nextHistory.reduce(
      (acc, r) => acc + r.pointsEarned + r.noWiltedBonus,
      0
    );

    return {
      ...state,
      elapsedInPhase: phaseDuration,
      health: nextHealth,
      healthState: nextHealthState,
      wentWiltedInPhase,
      phaseHistory: nextHistory,
      phasePoints: nextPhasePoints,
      totalScore: finalTotalScore,
      status: state.phase === 3 ? 'completed' : 'phase_complete',
      dayNightTurn: cycle.turn,
      cycleNumber: cycle.cycleNumber,
      turnBannerTimer: 0,
      co2HumanDanger,
      chlorosisActive,
      micronutrientZeroSeconds: nextMicroZeroSeconds,
      sensors: nextSensors,
      issues,
      telemetryHistory: nextHistoryTelemetry,
      activeTip:
        state.phase === 3
          ? 'Has completado las 3 fases con éxito.'
          : 'Fase superada. Pulsa continuar para pasar al siguiente módulo.',
    };
  }

  return {
    ...state,
    elapsedInPhase: nextElapsed,
    health: nextHealth,
    healthState: nextHealthState,
    wentWiltedInPhase,
    phasePoints: nextPhasePoints,
    totalScore: nextTotalScore,
    dayNightTurn: cycle.turn,
    cycleNumber: cycle.cycleNumber,
    turnBannerTimer: nextTurnBannerTimer,
    co2HumanDanger,
    chlorosisActive,
    micronutrientZeroSeconds: nextMicroZeroSeconds,
    sensors: nextSensors,
    issues,
    telemetryHistory: nextHistoryTelemetry,
    activeTip: buildGuidedTip(state.phase, cycle.turn, issues),
  };
}

export function isSensorOptimal(
  sensorKey: keyof typeof OPTIMAL_RANGES,
  value: number
): 'optimal' | 'warning' | 'critical' {
  const range = OPTIMAL_RANGES[sensorKey];
  if (value >= range.min && value <= range.max) return 'optimal';
  const span = range.max - range.min;
  if (value >= range.min - span * 0.4 && value <= range.max + span * 0.4) {
    return 'warning';
  }
  return 'critical';
}
