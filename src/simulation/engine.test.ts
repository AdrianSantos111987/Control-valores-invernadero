import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMicrodose,
  classifyHealthState,
  computeNDVI,
  createInitialState,
  getCycleInfo,
  prepareNextPhaseState,
  retryCurrentPhaseState,
  stepSimulation,
} from './engine';

test('health state classification and NDVI mapping match reference bands', () => {
  assert.equal(classifyHealthState(100), 'sana');
  assert.equal(classifyHealthState(80), 'sana');
  assert.equal(classifyHealthState(79.9), 'estres');
  assert.equal(classifyHealthState(50), 'estres');
  assert.equal(classifyHealthState(49.9), 'pocha');
  assert.equal(classifyHealthState(20), 'pocha');
  assert.equal(classifyHealthState(0), 'muerta');

  const opt = computeNDVI(92);
  assert.equal(opt.tone, 'optimal');
  assert.equal(opt.label, 'Óptimo');
  assert.ok(opt.ndvi >= 0.8 && opt.ndvi <= 0.9);

  const stress = computeNDVI(62);
  assert.equal(stress.tone, 'stress');
  assert.equal(stress.label, 'Estrés');
  assert.ok(stress.ndvi >= 0.5 && stress.ndvi <= 0.6);

  const wilted = computeNDVI(30);
  assert.equal(wilted.tone, 'wilted');
  assert.equal(wilted.label, 'Planta Pocha');
  assert.ok(wilted.ndvi >= 0.22 && wilted.ndvi <= 0.34);

  const dead = computeNDVI(0);
  assert.equal(dead.tone, 'dead');
  assert.equal(dead.ndvi, 0.1);
});

test('Phase 1 survives initial seconds without input and records telemetry history', () => {
  let state = createInitialState({
    studentNick: 'Carlos FP',
    level: 'principiante',
    skipOnboarding: true,
  });

  for (let i = 0; i < 5; i++) {
    state = stepSimulation(state, 1);
  }

  assert.equal(state.status, 'playing');
  assert.ok(state.health >= 80);
  assert.ok(state.totalScore > 0);
  assert.equal(state.telemetryHistory.length, 6); // 0s..5s
  assert.equal(state.telemetryHistory[5].t, 5);
});

test('Shading mesh (%) reduces interior solar radiation and heat', () => {
  let openState = createInitialState({
    studentNick: 'Ana FP',
    level: 'principiante',
    skipOnboarding: true,
  });
  openState = { ...openState, actuators: { ...openState.actuators, shadingMesh: 0 } };

  let shadedState = createInitialState({
    studentNick: 'Ana FP',
    level: 'principiante',
    skipOnboarding: true,
  });
  shadedState = { ...shadedState, actuators: { ...shadedState.actuators, shadingMesh: 80 } };

  for (let i = 0; i < 5; i++) {
    openState = stepSimulation(openState, 1);
    shadedState = stepSimulation(shadedState, 1);
  }

  assert.ok(shadedState.sensors.light < openState.sensors.light - 20);
  assert.ok(shadedState.sensors.temperature < openState.sensors.temperature);
});

test('Critical health drain gives ~20-25 seconds reaction margin before death', () => {
  let state = createInitialState({
    studentNick: 'Mateo FP',
    level: 'principiante',
    skipOnboarding: true,
  });
  state = {
    ...state,
    sensors: { ...state.sensors, moisture: 10, temperature: 36, light: 96 },
    actuators: { ...state.actuators, irrigation: 0, heating: 100, ventilation: 0, shadingMesh: 0 },
  };

  for (let i = 0; i < 15; i++) {
    state = stepSimulation(state, 1);
  }
  assert.equal(state.status, 'playing');
  assert.ok(state.health > 20 && state.health < 65);

  for (let i = 0; i < 15; i++) {
    state = stepSimulation(state, 1);
  }
  assert.equal(state.status, 'dead');
  assert.ok(state.telemetryHistory.length > 15);
  assert.equal(state.telemetryHistory[state.telemetryHistory.length - 1].health, 0);
});

test('Phase 1 over-irrigation highlights irrigation actuator and reports waterlogging', () => {
  let state = createInitialState({
    studentNick: 'Elena FP',
    level: 'principiante',
    skipOnboarding: true,
  });
  state = { ...state, actuators: { ...state.actuators, irrigation: 100 } };

  for (let i = 0; i < 20; i++) {
    state = stepSimulation(state, 1);
  }

  const issue = state.issues.find((i) => i.id === 'moisture_high');
  assert.ok(issue, 'Should report waterlogging issue');
  assert.ok(issue.targetActuators.includes('irrigation'), 'Should highlight irrigation actuator');
});

test('Phase 2 lasts 80s total with 40s per Day/Night cycle', () => {
  assert.equal(getCycleInfo(2, 5).turn, 'dia');
  assert.equal(getCycleInfo(2, 5).cycleNumber, 1);
  assert.equal(getCycleInfo(2, 22).turn, 'noche');
  assert.equal(getCycleInfo(2, 22).cycleNumber, 1);
  assert.equal(getCycleInfo(2, 42).turn, 'dia');
  assert.equal(getCycleInfo(2, 42).cycleNumber, 2);
  assert.equal(getCycleInfo(2, 65).turn, 'noche');
  assert.equal(getCycleInfo(2, 65).cycleNumber, 2);
});

test('Phase 2 turn change activates turnBannerTimer for Day/Night guidance', () => {
  let state = createInitialState({
    studentNick: 'Lucía',
    level: 'principiante',
    skipOnboarding: true,
  });
  state = prepareNextPhaseState(state, 2);
  state = { ...state, elapsedInPhase: 19, dayNightTurn: 'dia', turnBannerTimer: 0 };

  state = stepSimulation(state, 1); // crosses 20s into noche!
  assert.equal(state.dayNightTurn, 'noche');
  assert.equal(state.turnBannerTimer, 8);
});

test('Phase 2 excessive CO2 triggers safety alarm and highlights CO2 + ventilation', () => {
  let state = createInitialState({
    studentNick: 'Marcos',
    level: 'principiante',
    skipOnboarding: true,
  });
  state = prepareNextPhaseState(state, 2);
  state = { ...state, actuators: { ...state.actuators, co2Injection: true, ventilation: 0 } };

  for (let i = 0; i < 12; i++) {
    state = stepSimulation(state, 1);
  }

  assert.equal(state.co2HumanDanger, true);
  const issue = state.issues.find((i) => i.id === 'co2_danger');
  assert.ok(issue);
  assert.ok(issue.targetActuators.includes('co2Injection'));
  assert.ok(issue.targetActuators.includes('ventilation'));
});

test('Phase 2 nighttime without ventilation causes O2 depletion and highlights ventilation', () => {
  let state = createInitialState({
    studentNick: 'Sofía',
    level: 'tecnico',
    skipOnboarding: true,
  });
  state = prepareNextPhaseState(state, 2);
  state = {
    ...state,
    elapsedInPhase: 21,
    dayNightTurn: 'noche',
    actuators: { ...state.actuators, ventilation: 0, heating: 35 },
  };

  for (let i = 0; i < 8; i++) {
    state = stepSimulation(state, 1);
  }

  assert.ok(state.sensors.o2 < 19.3);
  const issue = state.issues.find((i) => i.id === 'o2_low');
  assert.ok(issue);
  assert.ok(issue.targetActuators.includes('ventilation'));
});

test('Phase 3 zero micronutrients triggers chlorosis and microdosing recovers', () => {
  let state = createInitialState({
    studentNick: 'Hugo',
    level: 'principiante',
    skipOnboarding: true,
  });
  state = prepareNextPhaseState(state, 3);
  state = { ...state, sensors: { ...state.sensors, iron: 0 } };

  for (let i = 0; i < 5; i++) {
    state = stepSimulation(state, 1);
  }

  assert.equal(state.chlorosisActive, true);
  const issue = state.issues.find((i) => i.id === 'chlorosis');
  assert.ok(issue);
  assert.ok(issue.targetActuators.includes('iron'));

  state = applyMicrodose(state, 'iron');
  state = applyMicrodose(state, 'iron');
  state = stepSimulation(state, 1);
  assert.ok(state.sensors.iron > 2.0);
});

test('Phase completion grants no-wilted bonus and Phase 3 finishes simulation', () => {
  let state = createInitialState({
    studentNick: 'Lucía',
    level: 'principiante',
    skipOnboarding: true,
  });
  state = prepareNextPhaseState(state, 3);
  state = {
    ...state,
    elapsedInPhase: 59,
    health: 92,
    wentWiltedInPhase: false,
  };

  state = stepSimulation(state, 1);
  assert.equal(state.status, 'completed');
  assert.equal(state.phaseHistory[0].noWiltedBonus, 500);
});

test('Plant death stops phase with diagnostic reason and retry resets telemetryHistory', () => {
  let state = createInitialState({
    studentNick: 'Diego',
    level: 'tecnico',
    skipOnboarding: true,
  });
  state = {
    ...state,
    health: 1.5,
    actuators: { ...state.actuators, irrigation: 0, heating: 100, ventilation: 0, shadingMesh: 0 },
    sensors: { ...state.sensors, moisture: 10, temperature: 36 },
  };

  state = stepSimulation(state, 1);
  assert.equal(state.status, 'dead');
  assert.equal(state.health, 0);

  state = {
    ...state,
    phase: 2,
    phasePoints: 140,
    totalScore: 940,
    phaseHistory: [
      { phase: 1, pointsEarned: 500, noWiltedBonus: 300, endHealth: 95, wentWilted: false },
    ],
  };

  const retried = retryCurrentPhaseState(state);
  assert.equal(retried.status, 'playing');
  assert.equal(retried.phase, 2);
  assert.equal(retried.health, 100);
  assert.equal(retried.phasePoints, 0);
  assert.equal(retried.totalScore, 800);
  assert.equal(retried.telemetryHistory.length, 1);
});
