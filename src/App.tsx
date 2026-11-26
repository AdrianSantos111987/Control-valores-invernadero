import { useEffect, useState } from 'react';
import { CertificateScreen } from './components/CertificateScreen';
import { ControlPanel } from './components/ControlPanel';
import { GreenhouseStage } from './components/GreenhouseStage';
import {
  DatasheetModal,
  DeadPlantModal,
  InitialTutorialModal,
  MoreInfoModal,
  OnboardingModal,
  PhaseCompleteModal,
  TutorialModal,
} from './components/Modals';
import { PhaseProgressBar } from './components/PhaseProgressBar';
import { TopBar } from './components/TopBar';
import {
  applyMicrodose,
  createInitialState,
  prepareNextPhaseState,
  retryCurrentPhaseState,
  stepSimulation,
} from './simulation/engine';
import type { ActuatorSettings, DifficultyLevel, SimulationPhase, SimulationState } from './simulation/types';

function getInitialSimulationState(): SimulationState {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const lvl = params.get('level') === 'tecnico' ? 'tecnico' : 'principiante';
      let state = createInitialState({
        studentNick: 'Alumno Demo',
        level: lvl,
        skipOnboarding: true,
      });
      const targetPhase = Number(params.get('phase'));
      if (targetPhase === 2 || targetPhase === 3) {
        state = prepareNextPhaseState(state, targetPhase);
      }
      const advanceSec = Math.min(75, Math.max(0, Number(params.get('t')) || 0));
      for (let i = 0; i < advanceSec && state.status === 'playing'; i += 1) {
        state = stepSimulation(state, 1);
      }
      return state;
    }
  }
  return createInitialState({
    studentNick: '',
    level: 'principiante',
    skipOnboarding: false,
  });
}

export default function App() {
  const [state, setState] = useState<SimulationState>(getInitialSimulationState);

  // Real-time simulation loop (1 tick/second matching timer & industrial sensor polling)
  useEffect(() => {
    if (state.status !== 'playing') return;

    const timer = window.setInterval(() => {
      setState((prev) => stepSimulation(prev, 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.status]);

  const handleStartSimulation = (nick: string, level: DifficultyLevel) => {
    setState(
      createInitialState({
        studentNick: nick,
        level,
        initialStatus: level === 'principiante' ? 'initial_tutorial' : 'playing',
      })
    );
  };

  const handleUpdateActuator = <K extends keyof ActuatorSettings>(
    key: K,
    value: ActuatorSettings[K]
  ) => {
    setState((prev) => ({
      ...prev,
      actuators: {
        ...prev.actuators,
        [key]: value,
      },
    }));
  };

  const handleMicrodose = (nutrient: 'iron' | 'magnesium' | 'boronManganese') => {
    setState((prev) => applyMicrodose(prev, nutrient));
  };

  const handleOpenTutorial = () => {
    setState((prev) =>
      prev.status === 'playing' || prev.status === 'paused_datasheet' || prev.status === 'paused_info'
        ? { ...prev, status: 'paused_tutorial' }
        : prev
    );
  };

  const handleOpenDatasheet = () => {
    setState((prev) =>
      prev.status === 'playing' || prev.status === 'paused_tutorial' || prev.status === 'paused_info'
        ? { ...prev, status: 'paused_datasheet' }
        : prev
    );
  };

  const handleOpenInfo = () => {
    setState((prev) =>
      prev.status === 'playing' || prev.status === 'paused_tutorial' || prev.status === 'paused_datasheet'
        ? { ...prev, status: 'paused_info' }
        : prev
    );
  };

  const handleResumePlaying = () => {
    setState((prev) => ({ ...prev, status: 'playing' }));
  };

  const handleReset = () => {
    setState(
      createInitialState({
        studentNick: state.studentNick,
        level: state.level,
        skipOnboarding: false,
      })
    );
  };

  const handleNextPhase = () => {
    setState((prev) => {
      const next = (prev.phase + 1) as SimulationPhase;
      return prepareNextPhaseState(prev, next);
    });
  };

  const handleRetryPhase = () => {
    setState((prev) => retryCurrentPhaseState(prev));
  };

  const lastCompletedRecord =
    state.phaseHistory.length > 0
      ? state.phaseHistory[state.phaseHistory.length - 1]
      : null;

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F3F6F4] text-slate-900"
      data-status={state.status}
      data-phase={state.phase}
    >
      <TopBar
        state={state}
        onOpenTutorial={handleOpenTutorial}
        onOpenDatasheet={handleOpenDatasheet}
        onOpenInfo={handleOpenInfo}
        onReset={handleReset}
      />

      {state.status === 'completed' ? (
        <CertificateScreen state={state} onRestart={handleReset} />
      ) : (
        <>
          <PhaseProgressBar state={state} />
          <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-5 py-2.5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              <div className="lg:col-span-7">
                <GreenhouseStage state={state} />
              </div>
              <div className="lg:col-span-5">
                <ControlPanel
                  state={state}
                  onUpdateActuator={handleUpdateActuator}
                  onMicrodose={handleMicrodose}
                />
              </div>
            </div>
          </main>
        </>
      )}

      {state.status === 'onboarding' && (
        <OnboardingModal
          initialNick={state.studentNick}
          initialLevel={state.level}
          onStart={handleStartSimulation}
        />
      )}

      {state.status === 'initial_tutorial' && (
        <InitialTutorialModal
          studentNick={state.studentNick}
          onStartPhase1={handleResumePlaying}
        />
      )}

      {state.status === 'paused_tutorial' && (
        <TutorialModal onClose={handleResumePlaying} />
      )}

      {state.status === 'paused_datasheet' && (
        <DatasheetModal onClose={handleResumePlaying} />
      )}

      {state.status === 'paused_info' && (
        <MoreInfoModal
          studentNick={state.studentNick}
          level={state.level}
          phase={state.phase}
          onClose={handleResumePlaying}
        />
      )}

      {state.status === 'phase_complete' && lastCompletedRecord && state.phase < 3 && (
        <PhaseCompleteModal
          completedRecord={lastCompletedRecord}
          nextPhase={(state.phase + 1) as SimulationPhase}
          onContinue={handleNextPhase}
        />
      )}

      {state.status === 'dead' && (
        <DeadPlantModal
          phase={state.phase}
          deathReason={state.deathReason ?? 'Colapso fisiológico del cultivo.'}
          telemetryHistory={state.telemetryHistory}
          issues={state.issues}
          onRetryPhase={handleRetryPhase}
          onRestartAll={handleReset}
        />
      )}
    </div>
  );
}
