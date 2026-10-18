import { describe, expect, it } from 'vitest';
import { BoticarioBot } from '../src/ai/botSolver';
import {
  CAMPAIGN_LEVELS,
  COLD_CHAIN_WAVES,
  COMPOUNDING_RECIPES,
  PRECINTO_ORDERS,
  PRESCRIPTION_SCENARIOS,
  TRIAGE_SCENARIOS,
  UPGRADE_DEFINITIONS,
  VADEMECUM_ENTRIES,
} from '../src/data/campaignData';
import { GameCoordinator } from '../src/engine/gameCoordinator';
import {
  detectBrowserLocale,
  formatCurrencyEur,
  formatMassGrams,
  resolveActiveLocale,
  t,
} from '../src/i18n/i18n';
import { ColdChainMiniGame } from '../src/minigames/coldChainGame';
import { CompoundingMiniGame } from '../src/minigames/compoundingGame';
import { HandwritingMiniGame } from '../src/minigames/handwritingGame';
import { PrecintoMiniGame } from '../src/minigames/precintoGame';
import { TriageMiniGame } from '../src/minigames/triageGame';
import {
  STORAGE_KEY,
  validateAndSanitizeSaveState,
} from '../src/state/storage';
import {
  clientToVirtualCanvas,
  computeViewportMode,
  MOBILE_TOUCH_OFFSET_Y,
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
} from '../src/ui/viewport';

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  public get length(): number {
    return this.map.size;
  }
  public clear(): void {
    this.map.clear();
  }
  public getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  public key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  public removeItem(key: string): void {
    this.map.delete(key);
  }
  public setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('Farmacia Gallego: Botica de Guardia — Automated Playthrough & Verification', () => {
  it('auto-detects Spanish (es) and English (en) from browser locales and allows menu override', () => {
    expect(detectBrowserLocale(['es-ES', 'en-US'])).toBe('es');
    expect(detectBrowserLocale(['es-MX'])).toBe('es');
    expect(detectBrowserLocale(['en-US', 'es-ES'])).toBe('en');
    expect(detectBrowserLocale(['en-GB'])).toBe('en');
    expect(detectBrowserLocale(['fr-FR', 'es-AND'])).toBe('es');

    expect(resolveActiveLocale('auto', ['es-ES'])).toBe('es');
    expect(resolveActiveLocale('auto', ['en-US'])).toBe('en');
    expect(resolveActiveLocale('es', ['en-US'])).toBe('es');
    expect(resolveActiveLocale('en', ['es-ES'])).toBe('en');

    const storage = new MemoryStorage();
    const coordinator = new GameCoordinator({
      storage,
      browserLanguages: ['es-ES'],
    });
    expect(coordinator.getLocale()).toBe('es');
    expect(coordinator.getLanguagePreference()).toBe('auto');

    // User selects English in menu
    coordinator.setLanguagePreference('en');
    expect(coordinator.getLocale()).toBe('en');

    // Reload coordinator from storage and confirm menu language preference persisted
    const reloaded = new GameCoordinator({
      storage,
      browserLanguages: ['es-ES'],
    });
    expect(reloaded.getLanguagePreference()).toBe('en');
    expect(reloaded.getLocale()).toBe('en');

    // Locale-aware formatting via Intl
    expect(formatCurrencyEur(12.5, 'es')).toContain('12,50');
    expect(formatCurrencyEur(12.5, 'en')).toContain('12.50');
    expect(formatMassGrams(2.5, 'es')).toContain('2,50');
    expect(formatMassGrams(2.5, 'en')).toContain('2.50');
  });

  it('has complete bilingual (ES & EN) translations across all 10 levels, 5 mini-games, upgrades, and Vademécum', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(10);
    for (const lvl of CAMPAIGN_LEVELS) {
      expect(t(lvl.title, 'es').length).toBeGreaterThan(5);
      expect(t(lvl.title, 'en').length).toBeGreaterThan(5);
      expect(t(lvl.briefing, 'es').length).toBeGreaterThan(10);
      expect(t(lvl.briefing, 'en').length).toBeGreaterThan(10);
    }

    for (const s of TRIAGE_SCENARIOS) {
      expect(s.openingComplaint.es.length).toBeGreaterThan(10);
      expect(s.openingComplaint.en.length).toBeGreaterThan(10);
      expect(s.clinicalExplanation.es.length).toBeGreaterThan(10);
      expect(s.clinicalExplanation.en.length).toBeGreaterThan(10);
    }

    for (const rx of PRESCRIPTION_SCENARIOS) {
      expect(rx.watermarkHint.es.length).toBeGreaterThan(5);
      expect(rx.watermarkHint.en.length).toBeGreaterThan(5);
    }

    for (const rec of COMPOUNDING_RECIPES) {
      expect(rec.name.es.length).toBeGreaterThan(5);
      expect(rec.name.en.length).toBeGreaterThan(5);
    }

    for (const ord of PRECINTO_ORDERS) {
      expect(ord.patientRegimeLabel.es.length).toBeGreaterThan(5);
      expect(ord.patientRegimeLabel.en.length).toBeGreaterThan(5);
    }

    for (const wave of COLD_CHAIN_WAVES) {
      expect(wave.title.es.length).toBeGreaterThan(5);
      expect(wave.title.en.length).toBeGreaterThan(5);
    }

    for (const v of VADEMECUM_ENTRIES) {
      expect(v.name.es.length).toBeGreaterThan(3);
      expect(v.name.en.length).toBeGreaterThan(3);
    }

    for (const u of UPGRADE_DEFINITIONS) {
      expect(u.name.es.length).toBeGreaterThan(3);
      expect(u.name.en.length).toBeGreaterThan(3);
    }
  });

  it('scales difficulty monotonically across all 10 campaign levels', () => {
    for (let i = 1; i < CAMPAIGN_LEVELS.length; i++) {
      const prev = CAMPAIGN_LEVELS[i - 1];
      const curr = CAMPAIGN_LEVELS[i];
      expect(curr.levelNumber).toBe(prev.levelNumber + 1);
      expect(curr.difficultyMultiplier).toBeGreaterThan(prev.difficultyMultiplier);
      expect(curr.rewardEur).toBeGreaterThan(prev.rewardEur);
    }
  });

  it('plays through all 10 campaign levels sequentially from start to finish via BoticarioBot and persists to localStorage', () => {
    const storage = new MemoryStorage();
    const coordinator = new GameCoordinator({
      storage,
      browserLanguages: ['es-ES'],
    });
    const bot = new BoticarioBot();

    // Initially only Level 1 is unlocked
    expect(coordinator.getSaveState().unlockedLevel).toBe(1);
    expect(coordinator.startCampaignLevel(2)).toBe(false);

    const summaryLog: string[] = [];

    for (const level of CAMPAIGN_LEVELS) {
      const summary = bot.playCompleteLevel(coordinator, level.levelNumber);
      expect(summary.passed).toBe(true);
      expect(summary.stars).toBeGreaterThanOrEqual(2);
      expect(summary.averageScore).toBeGreaterThanOrEqual(85);
      expect(summary.earnedEur).toBeGreaterThanOrEqual(level.rewardEur);

      summaryLog.push(
        `Level ${level.levelNumber.toString().padStart(2, '0')} (${level.title.en}): PASSED | Score ${summary.averageScore}/100 | Stars ${'✚'.repeat(summary.stars)} | +€${summary.earnedEur}`
      );

      // Purchase upgrades as funds become available during the campaign
      for (const upg of UPGRADE_DEFINITIONS) {
        if (
          !coordinator.hasUpgrade(upg.id) &&
          coordinator.getSaveState().euros >= upg.costEur
        ) {
          expect(coordinator.purchaseUpgrade(upg.id)).toBe(true);
        }
      }
    }

    console.info(
      ['', '=== FARMACIA GALLEGO: 10-LEVEL CAMPAIGN PLAYTHROUGH ===', ...summaryLog, ''].join(
        '\n'
      )
    );

    const finalSave = coordinator.getSaveState();
    expect(finalSave.unlockedLevel).toBe(10);
    expect(finalSave.upgrades).toHaveLength(UPGRADE_DEFINITIONS.length);
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(finalSave.levelProgress[lvl]?.completed).toBe(true);
      expect(finalSave.levelProgress[lvl]?.stars).toBeGreaterThanOrEqual(2);
    }

    // Verify localStorage persistence round-trip
    const rawSaved = storage.getItem(STORAGE_KEY);
    expect(rawSaved).toBeTruthy();

    const restoredCoordinator = new GameCoordinator({ storage });
    expect(restoredCoordinator.getSaveState().unlockedLevel).toBe(10);
    expect(restoredCoordinator.getSaveState().upgrades).toHaveLength(5);
    expect(restoredCoordinator.getSaveState().totalPatientsServed).toBeGreaterThanOrEqual(
      28
    );
  });

  it('plays through all 5 mini-games in English mode and verifies clinical/technical failure conditions', () => {
    // 1. Triage: Red-flag antibiotic demand without prescription must fail if given OTC instead of Urgent Care referral
    const antibioticScenario = TRIAGE_SCENARIOS.find(
      (s) => s.id === 'triage_antibiotic_refusal'
    )!;
    const badTriage = new TriageMiniGame(antibioticScenario, 1.2);
    badTriage.selectRemedy('ibuprofeno_400');
    badTriage.selectCounseling('take_with_food');
    const badTriageRes = badTriage.submitDecision('en');
    expect(badTriageRes.passed).toBe(false);

    // 2. Handwriting: Selecting look-alike LASA medication (Enalapril instead of Ebastina) fails verification
    const ebastinaScenario = PRESCRIPTION_SCENARIOS.find(
      (s) => s.id === 'rx_ebastina_10'
    )!;
    const badRx = new HandwritingMiniGame(ebastinaScenario, 1.3, false);
    badRx.selectDrug('Enalapril');
    badRx.selectStrength('10 mg');
    badRx.selectPosology('every_24h');
    const badRxRes = badRx.submitVerification('en');
    expect(badRxRes.passed).toBe(false);
    expect(badRxRes.drugCorrect).toBe(false);

    // 3. Compounding: Grossly overweight powder fails quality control
    const recipe = COMPOUNDING_RECIPES[0];
    const badLab = new CompoundingMiniGame(recipe, 1.2, false);
    badLab.adjustPowderGrams(5.0); // Target is 1.50g
    expect(badLab.isMassWithinTolerance()).toBe(false);
    const badLabRes = badLab.finalizeCompounding('en');
    expect(badLabRes.passed).toBe(false);

    // 4. Precinto: Straying way off the dotted line punctures the aluminum blister foil
    const order = PRECINTO_ORDERS[0];
    const badPrecinto = new PrecintoMiniGame(order, 1.5, false);
    badPrecinto.traceCutAt(500, PrecintoMiniGame.CUT_LINE_Y + 90);
    expect(badPrecinto.isBlisterPunctured()).toBe(true);
    const badPrecintoRes = badPrecinto.submitOrder('en');
    expect(badPrecintoRes.passed).toBe(false);

    // 5. Cold-Chain: Leaving thermolabile vaccine out in 42°C heatwave spoils it
    const heatWave = COLD_CHAIN_WAVES.find((w) => w.id === 'wave_calor_3')!;
    const badCold = new ColdChainMiniGame(heatWave, 2.0, false);
    badCold.step(60); // 60 seconds sitting on warm floor at 42°C
    const badColdRes = badCold.evaluateWave('en');
    expect(badColdRes.passed).toBe(false);
    expect(badColdRes.spoiledCount).toBeGreaterThan(0);
  });

  it('adapts layout and pointer projection accurately across Mobile Phone (390x844) and Desktop (1280x800) viewports', () => {
    // Viewport mode detection
    expect(computeViewportMode(390, 844)).toBe('mobile-portrait');
    expect(computeViewportMode(360, 640)).toBe('mobile-portrait');
    expect(computeViewportMode(844, 390)).toBe('mobile-landscape');
    expect(computeViewportMode(1280, 800)).toBe('desktop');
    expect(computeViewportMode(1920, 1080)).toBe('desktop');

    // Mobile portrait canvas bounding rect (e.g., 360px wide x 225px tall)
    const mobileRect = { left: 10, top: 120, width: 360, height: 225 };
    const centerClientX = 10 + 180;
    const centerClientY = 120 + 112.5;

    // Mouse pointer at center maps to exact virtual center (400, 250)
    const mousePt = clientToVirtualCanvas(
      centerClientX,
      centerClientY,
      mobileRect,
      'mouse',
      true
    );
    expect(mousePt.x).toBeCloseTo(VIRTUAL_CANVAS_WIDTH / 2, 2);
    expect(mousePt.y).toBeCloseTo(VIRTUAL_CANVAS_HEIGHT / 2, 2);
    expect(mousePt.isTouch).toBe(false);

    // Touch pointer at center with precision offset lifts y by MOBILE_TOUCH_OFFSET_Y (-48px)
    // so the player's thumb on a phone never hides the magnifying loupe or scalpel!
    const touchPt = clientToVirtualCanvas(
      centerClientX,
      centerClientY,
      mobileRect,
      'touch',
      true
    );
    expect(touchPt.x).toBeCloseTo(VIRTUAL_CANVAS_WIDTH / 2, 2);
    expect(touchPt.rawY).toBeCloseTo(VIRTUAL_CANVAS_HEIGHT / 2, 2);
    expect(touchPt.y).toBeCloseTo(VIRTUAL_CANVAS_HEIGHT / 2 + MOBILE_TOUCH_OFFSET_Y, 2);
    expect(touchPt.isTouch).toBe(true);
  });

  it('sanitizes untrusted or corrupted localStorage state safely', () => {
    expect(validateAndSanitizeSaveState(null).unlockedLevel).toBe(1);
    expect(validateAndSanitizeSaveState('malicious_string').unlockedLevel).toBe(1);
    expect(
      validateAndSanitizeSaveState({
        version: 1,
        languagePreference: '<script>alert(1)</script>',
        unlockedLevel: 999,
        euros: -500,
        reputation: 5000,
        upgrades: ['uv_loupe', 'fake_hack_upgrade'],
      })
    ).toEqual({
      version: 1,
      languagePreference: 'auto',
      unlockedLevel: 1,
      euros: 60,
      reputation: 100,
      upgrades: ['uv_loupe'],
      levelProgress: {},
      soundMuted: false,
      totalPatientsServed: 0,
    });
  });
});
