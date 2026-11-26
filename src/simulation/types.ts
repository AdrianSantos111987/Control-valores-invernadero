export type DifficultyLevel = 'principiante' | 'tecnico';

export type SimulationPhase = 1 | 2 | 3;

export type GameStatus =
  | 'onboarding'
  | 'initial_tutorial'
  | 'playing'
  | 'paused_tutorial'
  | 'paused_datasheet'
  | 'paused_info'
  | 'phase_complete'
  | 'dead'
  | 'completed';

export type PlantHealthState = 'sana' | 'estres' | 'pocha' | 'muerta';

export type DayNightTurn = 'dia' | 'noche';

export type HighlightTarget =
  | 'shadingMesh'
  | 'irrigation'
  | 'heating'
  | 'ventilation'
  | 'co2Injection'
  | 'nDosing'
  | 'pDosing'
  | 'kDosing'
  | 'iron'
  | 'magnesium'
  | 'boronManganese';

export interface SensorReadings {
  light: number; // % (0 - 100)
  ambientSun: number; // % outside solar intensity
  moisture: number; // % substrate moisture (0 - 100)
  temperature: number; // °C (5 - 45)
  co2: number; // ppm (200 - 2500)
  o2: number; // % (15.0 - 21.5)
  ec: number; // mS/cm (0.2 - 4.0)
  nitrogen: number; // % (0 - 100)
  phosphorus: number; // % (0 - 100)
  potassium: number; // % (0 - 100)
  iron: number; // mg/L (0 - 8)
  magnesium: number; // mg/L (0 - 60)
  boronManganese: number; // mg/L (0 - 4)
}

export interface TelemetrySample {
  t: number; // seconds elapsed in phase
  health: number;
  light: number;
  moisture: number;
  temperature: number;
  co2: number;
  o2: number;
  ec: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  iron: number;
  magnesium: number;
  boronManganese: number;
}

export interface ActuatorSettings {
  shadingMesh: number; // % Malla de sombreo desplegada (0 = recogida, 100 = cerrada)
  irrigation: number; // % caudal de riego (0 - 100)
  heating: number; // % calefacción (0 - 100)
  ventilation: number; // % ventilación / extractores (0 - 100)
  co2Injection: boolean; // Inyección activa de CO2
  nDosing: number; // % dosificador N (0 - 100)
  pDosing: number; // % dosificador P (0 - 100)
  kDosing: number; // % dosificador K (0 - 100)
}

export interface DiagnosticIssue {
  id: string;
  severity: 'warning' | 'critical';
  title: string;
  detail: string;
  greenhouseBanner: string;
  parameter: string;
  targetActuators: HighlightTarget[];
}

export interface PhaseScoreRecord {
  phase: SimulationPhase;
  pointsEarned: number;
  noWiltedBonus: number;
  endHealth: number;
  wentWilted: boolean;
}

export interface SimulationState {
  studentNick: string;
  level: DifficultyLevel;
  phase: SimulationPhase;
  status: GameStatus;
  elapsedInPhase: number;
  totalScore: number;
  phasePoints: number;
  wentWiltedInPhase: boolean;
  phaseHistory: PhaseScoreRecord[];
  health: number; // 0..100
  healthState: PlantHealthState;
  dayNightTurn: DayNightTurn;
  cycleNumber: 1 | 2;
  turnBannerTimer: number; // seconds left to display Day/Night transition banner
  co2HumanDanger: boolean;
  chlorosisActive: boolean;
  micronutrientZeroSeconds: number;
  sensors: SensorReadings;
  actuators: ActuatorSettings;
  issues: DiagnosticIssue[];
  telemetryHistory: TelemetrySample[];
  deathReason: string | null;
  activeTip: string;
}
