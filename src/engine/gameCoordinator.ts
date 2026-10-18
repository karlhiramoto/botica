import {
  CAMPAIGN_LEVELS,
  COLD_CHAIN_WAVES,
  COMPOUNDING_RECIPES,
  getColdChainWaveById,
  getCompoundingRecipeById,
  getPrecintoOrderById,
  getPrescriptionScenarioById,
  getTriageScenarioById,
  PRECINTO_ORDERS,
  PRESCRIPTION_SCENARIOS,
  TRIAGE_SCENARIOS,
  UPGRADE_DEFINITIONS,
} from '../data/campaignData';
import { resolveActiveLocale } from '../i18n/i18n';
import { ColdChainMiniGame } from '../minigames/coldChainGame';
import { CompoundingMiniGame } from '../minigames/compoundingGame';
import { HandwritingMiniGame } from '../minigames/handwritingGame';
import { PrecintoMiniGame } from '../minigames/precintoGame';
import { TriageMiniGame } from '../minigames/triageGame';
import {
  loadSaveState,
  persistSaveState,
  resetSaveState,
} from '../state/storage';
import type {
  CampaignLevel,
  CampaignTask,
  LanguagePreference,
  Locale,
  MiniGameType,
  SaveState,
  UpgradeId,
} from '../types';

export type ActiveMiniGameInstance =
  | { type: 'triage'; game: TriageMiniGame }
  | { type: 'handwriting'; game: HandwritingMiniGame }
  | { type: 'compounding'; game: CompoundingMiniGame }
  | { type: 'precinto'; game: PrecintoMiniGame }
  | { type: 'coldchain'; game: ColdChainMiniGame };

export interface TaskOutcomeRecord {
  taskType: MiniGameType;
  passed: boolean;
  score: number;
  feedback: string;
}

export interface ShiftSummaryResult {
  mode: 'campaign' | 'arcade';
  levelNumber: number;
  passed: boolean;
  averageScore: number;
  stars: number; // 0..3
  earnedEur: number;
  taskOutcomes: TaskOutcomeRecord[];
}

export class GameCoordinator {
  private saveState: SaveState;
  private browserLanguages?: readonly string[] | null;
  private activeLocale: Locale;

  private mode: 'hub' | 'campaign' | 'arcade' | 'summary' = 'hub';
  private activeLevel: CampaignLevel | null = null;
  private activeTasks: CampaignTask[] = [];
  private currentTaskIndex = 0;
  private activeMiniGame: ActiveMiniGameInstance | null = null;
  private remainingTimeSec = 0;
  private taskOutcomes: TaskOutcomeRecord[] = [];
  private lastShiftSummary: ShiftSummaryResult | null = null;
  private storageRef?: Storage;

  constructor(options?: {
    storage?: Storage;
    browserLanguages?: readonly string[] | null;
  }) {
    this.storageRef = options?.storage;
    this.browserLanguages = options?.browserLanguages;
    this.saveState = loadSaveState(this.storageRef);
    this.activeLocale = resolveActiveLocale(
      this.saveState.languagePreference,
      this.browserLanguages
    );
    this.syncDocumentLang();
  }

  private syncDocumentLang(): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = this.activeLocale;
    }
  }

  public getSaveState(): Readonly<SaveState> {
    return this.saveState;
  }

  public getLocale(): Locale {
    return this.activeLocale;
  }

  public getLanguagePreference(): LanguagePreference {
    return this.saveState.languagePreference;
  }

  public setLanguagePreference(pref: LanguagePreference): Locale {
    this.saveState.languagePreference = pref;
    this.activeLocale = resolveActiveLocale(pref, this.browserLanguages);
    this.syncDocumentLang();
    persistSaveState(this.saveState, this.storageRef);
    return this.activeLocale;
  }

  public setBrowserLanguagesForTest(langs: readonly string[]): Locale {
    this.browserLanguages = langs;
    this.activeLocale = resolveActiveLocale(
      this.saveState.languagePreference,
      this.browserLanguages
    );
    this.syncDocumentLang();
    return this.activeLocale;
  }

  public toggleSoundMuted(): boolean {
    this.saveState.soundMuted = !this.saveState.soundMuted;
    persistSaveState(this.saveState, this.storageRef);
    return this.saveState.soundMuted;
  }

  public resetAllProgress(): SaveState {
    const currentLangPref = this.saveState.languagePreference;
    this.saveState = resetSaveState(this.storageRef);
    this.saveState.languagePreference = currentLangPref;
    persistSaveState(this.saveState, this.storageRef);
    this.mode = 'hub';
    this.activeMiniGame = null;
    this.lastShiftSummary = null;
    return this.saveState;
  }

  public hasUpgrade(id: UpgradeId): boolean {
    return this.saveState.upgrades.includes(id);
  }

  public purchaseUpgrade(id: UpgradeId): boolean {
    if (this.hasUpgrade(id)) return false;
    const def = UPGRADE_DEFINITIONS.find((u) => u.id === id);
    if (!def || this.saveState.euros < def.costEur) {
      return false;
    }
    this.saveState.euros = Math.round((this.saveState.euros - def.costEur) * 100) / 100;
    this.saveState.upgrades.push(id);
    persistSaveState(this.saveState, this.storageRef);
    return true;
  }

  public getMode(): 'hub' | 'campaign' | 'arcade' | 'summary' {
    return this.mode;
  }

  public returnToHub(): void {
    this.mode = 'hub';
    this.activeMiniGame = null;
  }

  public getActiveLevel(): CampaignLevel | null {
    return this.activeLevel;
  }

  public getCurrentTaskProgress(): { current: number; total: number } {
    return {
      current: Math.min(this.currentTaskIndex + 1, this.activeTasks.length),
      total: this.activeTasks.length,
    };
  }

  public getRemainingTimeSec(): number {
    return this.remainingTimeSec;
  }

  public getActiveMiniGame(): ActiveMiniGameInstance | null {
    return this.activeMiniGame;
  }

  public getLastShiftSummary(): ShiftSummaryResult | null {
    return this.lastShiftSummary;
  }

  public startCampaignLevel(levelNumber: number): boolean {
    const level = CAMPAIGN_LEVELS.find((l) => l.levelNumber === levelNumber);
    if (!level || levelNumber > this.saveState.unlockedLevel) {
      return false;
    }

    this.mode = 'campaign';
    this.activeLevel = level;
    this.activeTasks = [...level.tasks];
    this.currentTaskIndex = 0;
    this.taskOutcomes = [];
    this.lastShiftSummary = null;

    const espressoBonusSec = this.hasUpgrade('espresso_bar') ? 15 : 0;
    this.remainingTimeSec = level.timeLimitSec + espressoBonusSec;

    this.spawnTaskInstance(this.activeTasks[0], level.difficultyMultiplier);
    return true;
  }

  public startArcadeMiniGame(type: MiniGameType, scenarioIndex = 0): void {
    this.mode = 'arcade';
    this.activeLevel = null;
    this.currentTaskIndex = 0;
    this.taskOutcomes = [];
    this.lastShiftSummary = null;
    this.remainingTimeSec = 95;

    let scenarioId = '';
    if (type === 'triage') {
      scenarioId = TRIAGE_SCENARIOS[scenarioIndex % TRIAGE_SCENARIOS.length].id;
    } else if (type === 'handwriting') {
      scenarioId =
        PRESCRIPTION_SCENARIOS[scenarioIndex % PRESCRIPTION_SCENARIOS.length].id;
    } else if (type === 'compounding') {
      scenarioId = COMPOUNDING_RECIPES[scenarioIndex % COMPOUNDING_RECIPES.length].id;
    } else if (type === 'precinto') {
      scenarioId = PRECINTO_ORDERS[scenarioIndex % PRECINTO_ORDERS.length].id;
    } else {
      scenarioId = COLD_CHAIN_WAVES[scenarioIndex % COLD_CHAIN_WAVES.length].id;
    }

    const task: CampaignTask = { type, scenarioId };
    this.activeTasks = [task];
    this.spawnTaskInstance(task, 1.0);
  }

  private spawnTaskInstance(task: CampaignTask, difficultyMultiplier: number): void {
    if (task.type === 'triage') {
      this.activeMiniGame = {
        type: 'triage',
        game: new TriageMiniGame(
          getTriageScenarioById(task.scenarioId),
          difficultyMultiplier
        ),
      };
    } else if (task.type === 'handwriting') {
      this.activeMiniGame = {
        type: 'handwriting',
        game: new HandwritingMiniGame(
          getPrescriptionScenarioById(task.scenarioId),
          difficultyMultiplier,
          this.hasUpgrade('uv_loupe')
        ),
      };
    } else if (task.type === 'compounding') {
      this.activeMiniGame = {
        type: 'compounding',
        game: new CompoundingMiniGame(
          getCompoundingRecipeById(task.scenarioId),
          difficultyMultiplier,
          this.hasUpgrade('digital_scale')
        ),
      };
    } else if (task.type === 'precinto') {
      this.activeMiniGame = {
        type: 'precinto',
        game: new PrecintoMiniGame(
          getPrecintoOrderById(task.scenarioId),
          difficultyMultiplier,
          this.hasUpgrade('laser_cutter')
        ),
      };
    } else {
      this.activeMiniGame = {
        type: 'coldchain',
        game: new ColdChainMiniGame(
          getColdChainWaveById(task.scenarioId),
          difficultyMultiplier,
          this.hasUpgrade('climate_control')
        ),
      };
    }
  }

  public step(dtSec: number): void {
    if (this.mode !== 'campaign' && this.mode !== 'arcade') return;
    this.remainingTimeSec = Math.max(0, this.remainingTimeSec - dtSec);

    if (this.activeMiniGame?.type === 'triage') {
      this.activeMiniGame.game.step(dtSec);
    } else if (this.activeMiniGame?.type === 'coldchain') {
      this.activeMiniGame.game.step(dtSec);
    }

    if (this.remainingTimeSec <= 0) {
      this.recordCurrentTaskOutcome({
        taskType: this.activeMiniGame?.type ?? 'triage',
        passed: false,
        score: 0,
        feedback:
          this.activeLocale === 'es'
            ? 'Se agotó el tiempo del turno.'
            : 'Shift timer expired.',
      });
    }
  }

  public recordCurrentTaskOutcome(outcome: TaskOutcomeRecord): ShiftSummaryResult | null {
    this.taskOutcomes.push(outcome);
    this.saveState.totalPatientsServed += 1;

    if (outcome.passed) {
      this.saveState.reputation = Math.min(100, this.saveState.reputation + 4);
    } else {
      this.saveState.reputation = Math.max(10, this.saveState.reputation - 15);
    }

    this.currentTaskIndex += 1;
    if (this.currentTaskIndex < this.activeTasks.length && this.remainingTimeSec > 0) {
      const mult = this.activeLevel?.difficultyMultiplier ?? 1.0;
      this.spawnTaskInstance(this.activeTasks[this.currentTaskIndex], mult);
      persistSaveState(this.saveState, this.storageRef);
      return null;
    }

    return this.finalizeShift();
  }

  private finalizeShift(): ShiftSummaryResult {
    const totalTasks = Math.max(1, this.taskOutcomes.length);
    const sumScores = this.taskOutcomes.reduce((acc, o) => acc + o.score, 0);
    const averageScore = Math.round(sumScores / totalTasks);
    const allPassed = this.taskOutcomes.every((o) => o.passed);

    const stars = !allPassed
      ? 0
      : averageScore >= 90
        ? 3
        : averageScore >= 75
          ? 2
          : 1;

    let earnedEur = 0;
    const levelNumber = this.activeLevel?.levelNumber ?? 0;

    if (allPassed) {
      const baseReward = this.activeLevel ? this.activeLevel.rewardEur : 25;
      const tipMultiplier = this.hasUpgrade('espresso_bar') ? 1.15 : 1.0;
      earnedEur = Math.round(baseReward * tipMultiplier);
      this.saveState.euros = Math.round((this.saveState.euros + earnedEur) * 100) / 100;

      if (this.mode === 'campaign' && this.activeLevel) {
        const prev = this.saveState.levelProgress[levelNumber];
        this.saveState.levelProgress[levelNumber] = {
          completed: true,
          stars: Math.max(prev?.stars ?? 0, stars),
          bestScore: Math.max(prev?.bestScore ?? 0, averageScore),
        };
        if (levelNumber >= this.saveState.unlockedLevel && levelNumber < 10) {
          this.saveState.unlockedLevel = levelNumber + 1;
        }
      }
    }

    persistSaveState(this.saveState, this.storageRef);

    const summary: ShiftSummaryResult = {
      mode: this.mode === 'campaign' ? 'campaign' : 'arcade',
      levelNumber,
      passed: allPassed,
      averageScore,
      stars,
      earnedEur,
      taskOutcomes: [...this.taskOutcomes],
    };

    this.lastShiftSummary = summary;
    this.mode = 'summary';
    this.activeMiniGame = null;
    return summary;
  }
}
