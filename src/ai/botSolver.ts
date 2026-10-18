import type {
  ActiveMiniGameInstance,
  GameCoordinator,
  ShiftSummaryResult,
  TaskOutcomeRecord,
} from '../engine/gameCoordinator';
import { PrecintoMiniGame } from '../minigames/precintoGame';
import type { TriageQuestionKey } from '../types';

/**
 * Autonomous Pharmacist Bot ("BoticarioBot") that plays through any mini-game
 * or full 10-level campaign using legal player actions and pointer trajectories.
 */
export class BoticarioBot {
  public solveActiveTask(coordinator: GameCoordinator): TaskOutcomeRecord {
    const active: ActiveMiniGameInstance | null = coordinator.getActiveMiniGame();
    if (!active) {
      throw new Error('No active mini-game to solve');
    }
    const locale = coordinator.getLocale();

    if (active.type === 'triage') {
      const game = active.game;
      const questions: TriageQuestionKey[] = ['fever', 'allergies', 'meds_pregnancy'];
      for (const q of questions) {
        game.askQuestion(q);
      }
      game.step(1.0);
      game.selectRemedy(game.scenario.correctRemedyId);
      game.selectCounseling(game.scenario.correctCounselingId);
      const res = game.submitDecision(locale);
      return {
        taskType: 'triage',
        passed: res.passed,
        score: res.score,
        feedback: res.feedback,
      };
    }

    if (active.type === 'handwriting') {
      const game = active.game;
      // Sweep the magnifying loupe across the prescription text area
      for (let x = 160; x <= 620; x += 48) {
        game.moveLoupe(x, 235);
      }
      game.toggleUvFilter(true);
      game.selectDrug(game.scenario.correctDrug);
      game.selectStrength(game.scenario.correctStrength);
      game.selectPosology(game.scenario.correctPosologyId);
      const res = game.submitVerification(locale);
      return {
        taskType: 'handwriting',
        passed: res.passed,
        score: res.score,
        feedback: res.feedback,
      };
    }

    if (active.type === 'compounding') {
      const game = active.game;
      // Step 1: Closed-loop analytical balance dosing
      while (
        game.getStep() === 'WEIGH' &&
        game.getCurrentMassGrams() + 0.25 <= game.recipe.targetMassGrams + 1e-6
      ) {
        game.adjustPowderGrams(0.25);
      }
      while (
        game.getStep() === 'WEIGH' &&
        !game.isMassWithinTolerance() &&
        game.getCurrentMassGrams() < game.recipe.targetMassGrams
      ) {
        game.adjustPowderGrams(0.05);
      }
      game.confirmWeighStep();

      // Step 2: Swirl porcelain mortar in circular trajectory
      let angle = 0;
      let guard = 0;
      while (game.getStep() === 'GRIND' && guard < 120) {
        const px = 400 + Math.cos(angle) * 55;
        const py = 265 + Math.sin(angle) * 55;
        game.handleMortarPointerMove(px, py);
        angle += 0.45;
        guard++;
      }
      while (game.getStep() === 'GRIND') {
        game.applyGrindSwirl(0.25);
      }

      // Step 3: Graduated cylinder meniscus control
      while (
        game.getStep() === 'MEASURE' &&
        game.getCurrentLiquidMl() + 1.0 <= game.recipe.targetLiquidMl + 1e-6
      ) {
        game.adjustLiquidMl(1.0);
      }
      while (
        game.getStep() === 'MEASURE' &&
        !game.isVolumeWithinTolerance() &&
        game.getCurrentLiquidMl() < game.recipe.targetLiquidMl
      ) {
        game.adjustLiquidMl(0.2);
      }
      game.confirmMeasureStep();

      // Step 4: Water-bath (Baño María) closed-loop thermostat control
      let heatSteps = 0;
      while (game.getStep() === 'HEAT' && heatSteps < 40) {
        const needHeat = game.getCurrentBathTempC() < game.recipe.targetBathTempC;
        game.pulseWaterBath(needHeat, 0.7, locale);
        heatSteps++;
      }

      const res = game.finalizeCompounding(locale);
      return {
        taskType: 'compounding',
        passed: res.passed,
        score: res.score,
        feedback: res.feedback,
      };
    }

    if (active.type === 'precinto') {
      const game = active.game;
      // Trace the scalpel cleanly along the perforated barcode line
      const startX = PrecintoMiniGame.CUT_START_X;
      const endX = PrecintoMiniGame.CUT_END_X;
      const y = PrecintoMiniGame.CUT_LINE_Y;
      for (let x = startX; x <= endX; x += 20) {
        game.traceCutAt(x, y);
      }
      game.applyPharmacyStamp();
      game.selectCopayTier(game.order.correctCopayTier);
      const res = game.submitOrder(locale);
      return {
        taskType: 'precinto',
        passed: res.passed,
        score: res.score,
        feedback: res.feedback,
      };
    }

    // Cold-Chain Mini-Game: Prioritize thermolabile items first, then route remaining
    const game = active.game;
    const sortedQueue = [...game.items].sort((a, b) =>
      a.requiresColdChain === b.requiresColdChain ? 0 : a.requiresColdChain ? -1 : 1
    );
    for (const item of sortedQueue) {
      game.step(0.4);
      game.routeItem(item.id, item.correctDestination, locale);
    }
    const res = game.evaluateWave(locale);
    return {
      taskType: 'coldchain',
      passed: res.passed,
      score: res.score,
      feedback: res.feedback,
    };
  }

  public playCompleteLevel(
    coordinator: GameCoordinator,
    levelNumber: number
  ): ShiftSummaryResult {
    const started = coordinator.startCampaignLevel(levelNumber);
    if (!started) {
      throw new Error(`Level ${levelNumber} could not be started (locked or invalid)`);
    }

    let summary: ShiftSummaryResult | null = null;
    let safetyCounter = 0;
    while (!summary && safetyCounter < 20) {
      coordinator.step(1.0);
      const outcome = this.solveActiveTask(coordinator);
      summary = coordinator.recordCurrentTaskOutcome(outcome);
      safetyCounter++;
    }

    if (!summary) {
      throw new Error(`Level ${levelNumber} did not terminate within safety limit`);
    }
    return summary;
  }
}
