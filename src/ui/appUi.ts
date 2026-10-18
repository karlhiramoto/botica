import { SoundEngine } from '../audio/soundEngine';
import {
  CAMPAIGN_LEVELS,
  COLD_CHAIN_WAVES,
  COMPOUNDING_RECIPES,
  PRECINTO_ORDERS,
  PRESCRIPTION_SCENARIOS,
  TRIAGE_SCENARIOS,
  UPGRADE_DEFINITIONS,
  VADEMECUM_ENTRIES,
} from '../data/campaignData';
import type { GameCoordinator, ShiftSummaryResult } from '../engine/gameCoordinator';
import {
  formatCurrencyEur,
  formatMassGrams,
  formatPercent,
  formatTempC,
  formatVolumeMl,
  t,
  UI_STRINGS,
} from '../i18n/i18n';
import type {
  CopayTier,
  LanguagePreference,
  MiniGameType,
  StorageDestination,
  TriageCounselingId,
  TriageQuestionKey,
  ViewportMode,
} from '../types';
import {
  clientToVirtualCanvas,
  computeViewportMode,
  syncCanvasHiDpi,
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
} from './viewport';

type HubTab = 'campaign' | 'arcade' | 'shop' | 'vademecum';

export class FarmaciaAppUi {
  private readonly root: HTMLElement;
  private readonly coordinator: GameCoordinator;
  private readonly sound: SoundEngine;

  private activeTab: HubTab = 'campaign';
  private viewportMode: ViewportMode = 'desktop';
  private canvasEl: HTMLCanvasElement | null = null;
  private isPointerDragging = false;
  private showResetConfirmModal = false;
  private lastFeedbackBanner: { passed: boolean; text: string } | null = null;
  private animFrameId: number | null = null;
  private lastFrameTimestamp = 0;

  constructor(root: HTMLElement, coordinator: GameCoordinator) {
    this.root = root;
    this.coordinator = coordinator;
    this.sound = new SoundEngine(coordinator.getSaveState().soundMuted);

    this.updateViewportMode();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateViewportMode();
        this.syncCanvasSize();
      });
    }

    this.render();
    this.startLoop();
  }

  public updateViewportMode(widthPx?: number, heightPx?: number): ViewportMode {
    const w =
      widthPx ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const h =
      heightPx ?? (typeof window !== 'undefined' ? window.innerHeight : 800);
    this.viewportMode = computeViewportMode(w, h);
    this.root.setAttribute('data-viewport-mode', this.viewportMode);
    return this.viewportMode;
  }

  public getViewportMode(): ViewportMode {
    return this.viewportMode;
  }

  public getCanvasElement(): HTMLCanvasElement | null {
    return this.canvasEl;
  }

  private startLoop(): void {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return;
    }
    const tick = (timestamp: number) => {
      if (this.lastFrameTimestamp === 0) {
        this.lastFrameTimestamp = timestamp;
      }
      const dtSec = Math.min(0.1, Math.max(0, (timestamp - this.lastFrameTimestamp) / 1000));
      this.lastFrameTimestamp = timestamp;

      const prevMode = this.coordinator.getMode();
      this.coordinator.step(dtSec);
      if (this.coordinator.getMode() !== prevMode) {
        this.render();
      } else {
        this.updateHudDynamicValues();
        this.drawActiveCanvasFrame();
      }
      this.animFrameId = window.requestAnimationFrame(tick);
    };
    this.animFrameId = window.requestAnimationFrame(tick);
  }

  public stopLoop(): void {
    if (this.animFrameId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public render(): void {
    const locale = this.coordinator.getLocale();
    this.root.replaceChildren();
    this.root.setAttribute('data-locale', locale);
    this.root.setAttribute('data-viewport-mode', this.viewportMode);

    const shell = el('div', 'farmacia-shell');
    shell.appendChild(this.buildHeaderBar());

    if (this.lastFeedbackBanner) {
      const banner = el(
        'div',
        this.lastFeedbackBanner.passed
          ? 'feedback-banner feedback-pass'
          : 'feedback-banner feedback-fail'
      );
      banner.id = 'feedback-banner';
      banner.textContent = this.lastFeedbackBanner.text;
      shell.appendChild(banner);
    }

    const mode = this.coordinator.getMode();
    if (mode === 'hub') {
      shell.appendChild(this.buildHeroBanner());
      shell.appendChild(this.buildHubNavigation());
      shell.appendChild(this.buildHubContent());
    } else if (mode === 'campaign' || mode === 'arcade') {
      shell.appendChild(this.buildShiftStage());
    } else {
      shell.appendChild(this.buildSummaryView());
    }

    if (this.showResetConfirmModal) {
      shell.appendChild(this.buildResetConfirmModal());
    }

    this.root.appendChild(shell);
    this.syncCanvasSize();
    this.drawActiveCanvasFrame();
  }

  private buildHeaderBar(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const save = this.coordinator.getSaveState();
    const header = el('header', 'azulejo-header');

    // Left: Official Farmacia Gallego Logo + Brand Title
    const brandWrap = el('div', 'brand-wrap');
    const logoBadge = el('div', 'brand-logo-card');
    const logoImg = el('img', 'brand-logo-img');
    logoImg.src = './farmacia-gallego-logo.png';
    logoImg.alt = 'Farmacia Gallego Logo';
    logoBadge.appendChild(logoImg);

    const titleBox = el('div', 'brand-titles');
    const h1 = el('h1', 'brand-h1', t(UI_STRINGS.brandTitle, locale));
    const sub = el('p', 'brand-sub', t(UI_STRINGS.brandSubtitle, locale));
    titleBox.append(h1, sub);
    brandWrap.append(logoBadge, titleBox);

    // Center: Status Pills (Euros & Reputation)
    const statsBar = el('div', 'header-stats');
    const fundsPill = el(
      'div',
      'stat-pill stat-funds',
      `💶 ${t(UI_STRINGS.hudFunds, locale)}: ${formatCurrencyEur(save.euros, locale)}`
    );
    fundsPill.id = 'hud-funds-pill';

    const repPill = el(
      'div',
      'stat-pill stat-reputation',
      `✚ ${t(UI_STRINGS.hudReputation, locale)}: ${save.reputation}%`
    );
    repPill.id = 'hud-reputation-pill';
    statsBar.append(fundsPill, repPill);

    // Right: Language Switcher (Auto | ES | EN) + Audio Mute
    const actionsWrap = el('div', 'header-actions');

    const langGroup = el('div', 'lang-switcher');
    langGroup.setAttribute('role', 'group');
    langGroup.setAttribute('aria-label', t(UI_STRINGS.langLabel, locale));

    const prefs: Array<{ pref: LanguagePreference; label: string; id: string }> = [
      { pref: 'auto', label: `🌐 ${t(UI_STRINGS.langAuto, locale)}`, id: 'lang-btn-auto' },
      { pref: 'es', label: 'ES • Español', id: 'lang-btn-es' },
      { pref: 'en', label: 'EN • English', id: 'lang-btn-en' },
    ];

    for (const item of prefs) {
      const btn = el(
        'button',
        save.languagePreference === item.pref ? 'lang-btn active' : 'lang-btn',
        item.label
      );
      btn.id = item.id;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        this.sound.playClickTick();
        this.coordinator.setLanguagePreference(item.pref);
        this.render();
      });
      langGroup.appendChild(btn);
    }

    const soundBtn = el(
      'button',
      'icon-action-btn',
      save.soundMuted ? `🔇 ${t(UI_STRINGS.soundOff, locale)}` : `🔊 ${t(UI_STRINGS.soundOn, locale)}`
    );
    soundBtn.id = 'toggle-sound-btn';
    soundBtn.type = 'button';
    soundBtn.addEventListener('click', () => {
      const muted = this.coordinator.toggleSoundMuted();
      this.sound.setMuted(muted);
      if (!muted) this.sound.playClickTick();
      this.render();
    });

    actionsWrap.append(langGroup, soundBtn);
    header.append(brandWrap, statsBar, actionsWrap);
    return header;
  }

  private buildHeroBanner(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const save = this.coordinator.getSaveState();
    const currentLevel =
      CAMPAIGN_LEVELS.find((l) => l.levelNumber === save.unlockedLevel) ??
      CAMPAIGN_LEVELS[0];

    let totalStars = 0;
    let completedCount = 0;
    for (let i = 1; i <= 10; i++) {
      const p = save.levelProgress[i];
      if (p?.completed) completedCount++;
      totalStars += p?.stars ?? 0;
    }

    const hero = el('section', 'farmacia-hero-banner');

    const heroLogoPanel = el('div', 'hero-logo-panel');
    const heroLogoImg = el('img', 'hero-logo-img');
    heroLogoImg.src = './farmacia-gallego-logo.png';
    heroLogoImg.alt = 'Farmacia Gallego';
    const guardiaPill = el(
      'div',
      'guardia-neon-pill',
      locale === 'es' ? '✚ ABIERTA 24H • DE GUARDIA' : '✚ OPEN 24H • ON-CALL DUTY'
    );
    heroLogoPanel.append(heroLogoImg, guardiaPill);

    const heroCopy = el('div', 'hero-copy-col');
    const welcomeTag = el(
      'span',
      'hero-kicker',
      locale === 'es'
        ? 'BOTICA TRADICIONAL Y LABORATORIO EN ANDALUCÍA'
        : 'TRADITIONAL APOTHECARY & LAB IN ANDALUSIA'
    );
    const headline = el(
      'h2',
      'hero-headline',
      locale === 'es'
        ? `Próximo Turno: ${t(currentLevel.title, locale)}`
        : `Next Shift: ${t(currentLevel.title, locale)}`
    );
    const desc = el('p', 'hero-desc', t(currentLevel.briefing, locale));

    const metricsRow = el('div', 'hero-metrics-row');
    const m1 = el(
      'div',
      'hero-metric-chip',
      locale === 'es'
        ? `🏥 Turnos: ${completedCount}/10`
        : `🏥 Shifts: ${completedCount}/10`
    );
    const m2 = el(
      'div',
      'hero-metric-chip',
      locale === 'es'
        ? `✚ Cruces: ${totalStars}/30`
        : `✚ Crosses: ${totalStars}/30`
    );
    const m3 = el(
      'div',
      'hero-metric-chip',
      locale === 'es'
        ? `👥 Pacientes: ${save.totalPatientsServed}`
        : `👥 Patients: ${save.totalPatientsServed}`
    );
    metricsRow.append(m1, m2, m3);
    heroCopy.append(welcomeTag, headline, desc, metricsRow);

    const heroCtaCol = el('div', 'hero-cta-col');
    const playNowBtn = el(
      'button',
      'hero-cta-btn',
      locale === 'es'
        ? `▶ Entrar de Guardia (Nivel ${currentLevel.levelNumber})`
        : `▶ Start Shift (Level ${currentLevel.levelNumber})`
    );
    playNowBtn.id = 'hero-quick-start-btn';
    playNowBtn.type = 'button';
    playNowBtn.addEventListener('click', () => {
      this.sound.playBellChime();
      this.lastFeedbackBanner = null;
      this.coordinator.startCampaignLevel(currentLevel.levelNumber);
      this.render();
    });
    heroCtaCol.appendChild(playNowBtn);

    hero.append(heroLogoPanel, heroCopy, heroCtaCol);
    return hero;
  }

  private buildHubNavigation(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const nav = el('nav', 'hub-tabs-nav');

    const tabs: Array<{ tab: HubTab; label: string; id: string }> = [
      { tab: 'campaign', label: `🏥 ${t(UI_STRINGS.navCampaign, locale)}`, id: 'tab-btn-campaign' },
      { tab: 'arcade', label: `🎮 ${t(UI_STRINGS.navArcade, locale)}`, id: 'tab-btn-arcade' },
      { tab: 'shop', label: `⚡ ${t(UI_STRINGS.navShop, locale)}`, id: 'tab-btn-shop' },
      { tab: 'vademecum', label: `📖 ${t(UI_STRINGS.navVademecum, locale)}`, id: 'tab-btn-vademecum' },
    ];

    for (const item of tabs) {
      const btn = el(
        'button',
        this.activeTab === item.tab ? 'hub-tab-btn active' : 'hub-tab-btn',
        item.label
      );
      btn.id = item.id;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        this.sound.playClickTick();
        this.activeTab = item.tab;
        this.lastFeedbackBanner = null;
        this.render();
      });
      nav.appendChild(btn);
    }

    const resetBtn = el(
      'button',
      'hub-tab-btn reset-tab-btn',
      `🗑️ ${t(UI_STRINGS.resetProgressBtn, locale)}`
    );
    resetBtn.id = 'open-reset-modal-btn';
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => {
      this.showResetConfirmModal = true;
      this.render();
    });
    nav.appendChild(resetBtn);

    return nav;
  }

  private buildHubContent(): HTMLElement {
    const container = el('section', 'hub-content-section');
    if (this.activeTab === 'campaign') {
      container.appendChild(this.buildCampaignGrid());
    } else if (this.activeTab === 'arcade') {
      container.appendChild(this.buildArcadeGrid());
    } else if (this.activeTab === 'shop') {
      container.appendChild(this.buildShopGrid());
    } else {
      container.appendChild(this.buildVademecumList());
    }
    return container;
  }

  private buildCampaignGrid(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const save = this.coordinator.getSaveState();
    const grid = el('div', 'campaign-grid');

    for (const lvl of CAMPAIGN_LEVELS) {
      const isUnlocked = lvl.levelNumber <= save.unlockedLevel;
      const prog = save.levelProgress[lvl.levelNumber];
      const stars = prog?.stars ?? 0;

      const card = el(
        'article',
        isUnlocked ? 'level-card unlocked' : 'level-card locked'
      );
      card.id = `campaign-card-${lvl.levelNumber}`;

      const topRow = el('div', 'level-card-header');
      const titleEl = el('h2', 'level-title', t(lvl.title, locale));
      const tempBadge = el(
        'span',
        lvl.ambientTempC >= 36 ? 'temp-badge hot' : 'temp-badge',
        `🌡️ ${formatTempC(lvl.ambientTempC, locale)} • ${lvl.shiftTimeLabel}`
      );
      topRow.append(titleEl, tempBadge);

      const locEl = el('p', 'level-location', t(lvl.locationSubtitle, locale));
      const briefEl = el('p', 'level-brief', t(lvl.briefing, locale));

      const taskBadges = el('div', 'task-badges-row');
      lvl.tasks.forEach((task, i) => {
        const rawName = t(UI_STRINGS.miniGameNames[task.type], locale).replace(
          /^\d+\.\s*/,
          ''
        );
        const b = el('span', 'task-chip', `${i + 1}. ${rawName}`);
        taskBadges.appendChild(b);
      });

      const footer = el('div', 'level-card-footer');
      const starDisplay = el(
        'span',
        'star-rating',
        `${'✚'.repeat(stars)}${'·'.repeat(3 - stars)} (${formatCurrencyEur(lvl.rewardEur, locale)})`
      );

      const startBtn = el(
        'button',
        isUnlocked ? 'primary-btn start-level-btn' : 'disabled-btn',
        !isUnlocked
          ? `🔒 ${t(UI_STRINGS.lockedShiftBtn, locale)}`
          : prog?.completed
            ? `↻ ${t(UI_STRINGS.replayShiftBtn, locale)}`
            : `▶ ${t(UI_STRINGS.startShiftBtn, locale)}`
      );
      startBtn.id = `start-level-btn-${lvl.levelNumber}`;
      startBtn.type = 'button';
      startBtn.disabled = !isUnlocked;

      if (isUnlocked) {
        startBtn.addEventListener('click', () => {
          this.sound.playBellChime();
          this.lastFeedbackBanner = null;
          this.coordinator.startCampaignLevel(lvl.levelNumber);
          this.render();
        });
      }

      footer.append(starDisplay, startBtn);
      card.append(topRow, locEl, briefEl, taskBadges, footer);
      grid.appendChild(card);
    }

    return grid;
  }

  private buildArcadeGrid(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const grid = el('div', 'arcade-grid');

    const games: Array<{
      type: MiniGameType;
      count: number;
      descEs: string;
      descEn: string;
    }> = [
      {
        type: 'triage',
        count: TRIAGE_SCENARIOS.length,
        descEs: 'Interroga al paciente en el mostrador, detecta signos de alarma y dispensa con consejo.',
        descEn: 'Question customers at the counter, catch red-flag emergencies, and dispense with advice.',
      },
      {
        type: 'handwriting',
        count: PRESCRIPTION_SCENARIOS.length,
        descEs: 'Inspecciona la caligrafía médica con la lupa óptica y el filtro UV para evitar errores.',
        descEn: 'Inspect messy doctor handwriting with the magnifying loupe and UV filter.',
      },
      {
        type: 'compounding',
        count: COMPOUNDING_RECIPES.length,
        descEs: 'Pesa polvos, pulveriza en mortero, enrasa la probeta y emulsiona al Baño María.',
        descEn: 'Weigh powders, swirl the porcelain mortar, read the meniscus, and heat the water bath.',
      },
      {
        type: 'precinto',
        count: PRECINTO_ORDERS.length,
        descEs: 'Corta el cupón precinto con el cúter, estampa el sello de Farmacia Gallego y cobra la aportación.',
        descEn: 'Slice the barcode flap with the box-cutter, stamp the Farmacia Gallego seal, and charge co-pay.',
      },
      {
        type: 'coldchain',
        count: COLD_CHAIN_WAVES.length,
        descEs: 'Clasifica vacunas termolábiles (2–8 °C), estupefacientes, cajoneras y Punto SIGRE.',
        descEn: 'Sort thermolabile vaccines (2–8 °C), narcotics safe, drawers, and Punto SIGRE bin.',
      },
    ];

    for (const g of games) {
      const card = el('article', 'arcade-card');
      const title = el('h2', 'level-title', t(UI_STRINGS.miniGameNames[g.type], locale));
      const desc = el('p', 'level-brief', locale === 'es' ? g.descEs : g.descEn);
      const btnRow = el('div', 'arcade-btn-row');

      for (let i = 0; i < g.count; i++) {
        const playBtn = el(
          'button',
          'secondary-btn',
          locale === 'es' ? `Caso #${i + 1}` : `Case #${i + 1}`
        );
        playBtn.id = `arcade-${g.type}-${i}`;
        playBtn.type = 'button';
        playBtn.addEventListener('click', () => {
          this.sound.playBellChime();
          this.lastFeedbackBanner = null;
          this.coordinator.startArcadeMiniGame(g.type, i);
          this.render();
        });
        btnRow.appendChild(playBtn);
      }

      card.append(title, desc, btnRow);
      grid.appendChild(card);
    }

    return grid;
  }

  private buildShopGrid(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const save = this.coordinator.getSaveState();
    const grid = el('div', 'shop-grid');

    for (const upg of UPGRADE_DEFINITIONS) {
      const owned = this.coordinator.hasUpgrade(upg.id);
      const canAfford = save.euros >= upg.costEur;

      const card = el('article', owned ? 'shop-card owned' : 'shop-card');
      card.id = `upgrade-card-${upg.id}`;

      const head = el('h2', 'level-title', `${upg.icon} ${t(upg.name, locale)}`);
      const desc = el('p', 'level-brief', t(upg.description, locale));
      const price = el('p', 'upgrade-price', formatCurrencyEur(upg.costEur, locale));

      const buyBtn = el(
        'button',
        owned ? 'owned-btn' : canAfford ? 'primary-btn' : 'disabled-btn',
        owned
          ? `✓ ${t(UI_STRINGS.ownedUpgradeBadge, locale)}`
          : canAfford
            ? `${t(UI_STRINGS.buyUpgradeBtn, locale)} (${formatCurrencyEur(upg.costEur, locale)})`
            : t(UI_STRINGS.insufficientFundsBtn, locale)
      );
      buyBtn.id = `buy-upgrade-btn-${upg.id}`;
      buyBtn.type = 'button';
      buyBtn.disabled = owned || !canAfford;

      if (!owned && canAfford) {
        buyBtn.addEventListener('click', () => {
          if (this.coordinator.purchaseUpgrade(upg.id)) {
            this.sound.playSuccessChord();
            this.render();
          }
        });
      }

      card.append(head, desc, price, buyBtn);
      grid.appendChild(card);
    }

    return grid;
  }

  private buildVademecumList(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const list = el('div', 'vademecum-grid');

    for (const entry of VADEMECUM_ENTRIES) {
      const card = el('article', 'vademecum-card');
      const title = el('h3', 'vademecum-title', t(entry.name, locale));
      const active = el(
        'p',
        'vademecum-active',
        `🧪 ${t(entry.activeIngredient, locale)}`
      );
      const ind = el('p', 'vademecum-ind', `✅ ${t(entry.indication, locale)}`);
      const contra = el(
        'p',
        'vademecum-contra',
        `⚠️ ${t(entry.contraindication, locale)}`
      );
      card.append(title, active, ind, contra);
      list.appendChild(card);
    }
    return list;
  }

  private buildShiftStage(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const active = this.coordinator.getActiveMiniGame();
    const level = this.coordinator.getActiveLevel();
    const prog = this.coordinator.getCurrentTaskProgress();

    const wrapper = el('section', 'shift-stage-wrapper');

    // Shift Top Bar
    const shiftBar = el('div', 'shift-status-bar');
    const backBtn = el(
      'button',
      'secondary-btn compact-btn',
      `← ${t(UI_STRINGS.backToHubBtn, locale)}`
    );
    backBtn.id = 'shift-back-hub-btn';
    backBtn.type = 'button';
    backBtn.addEventListener('click', () => {
      this.coordinator.returnToHub();
      this.render();
    });

    const shiftTitle = el(
      'div',
      'shift-stage-title',
      level
        ? `${t(level.title, locale)} — ${t(UI_STRINGS.hudShiftTask, locale)} ${prog.current}/${prog.total}`
        : active
          ? t(UI_STRINGS.miniGameNames[active.type], locale)
          : ''
    );

    const timerBadge = el(
      'div',
      'shift-timer-badge',
      `⏱️ ${Math.ceil(this.coordinator.getRemainingTimeSec())}s`
    );
    timerBadge.id = 'shift-timer-badge';

    shiftBar.append(backBtn, shiftTitle, timerBadge);
    wrapper.appendChild(shiftBar);

    // Responsive 2-pane split: Left/Top Canvas + Right/Bottom Interactive Controls
    const splitPane = el('div', 'shift-split-pane');

    const canvasWrap = el('div', 'canvas-stage-container');
    const canvas = document.createElement('canvas');
    canvas.id = 'farmacia-canvas';
    canvas.className = 'farmacia-canvas';
    canvas.width = VIRTUAL_CANVAS_WIDTH;
    canvas.height = VIRTUAL_CANVAS_HEIGHT;
    canvas.setAttribute('aria-label', 'Interactive Pharmacy Mini-Game Canvas');
    this.bindCanvasPointerEvents(canvas);
    this.canvasEl = canvas;
    canvasWrap.appendChild(canvas);

    const controlPanel = el('div', 'minigame-control-panel');
    controlPanel.id = 'minigame-control-panel';
    if (active) {
      controlPanel.appendChild(this.buildMiniGameControls(active));
    }

    splitPane.append(canvasWrap, controlPanel);
    wrapper.appendChild(splitPane);
    return wrapper;
  }

  private bindCanvasPointerEvents(canvas: HTMLCanvasElement): void {
    const handlePointer = (ev: PointerEvent, isDown: boolean, isMove: boolean) => {
      const active = this.coordinator.getActiveMiniGame();
      if (!active) return;

      const rect = canvas.getBoundingClientRect();
      const usesTouchOffset =
        active.type === 'handwriting' || active.type === 'precinto';
      const pt = clientToVirtualCanvas(
        ev.clientX,
        ev.clientY,
        rect,
        ev.pointerType || 'mouse',
        usesTouchOffset
      );

      if (active.type === 'handwriting') {
        if (isDown || (isMove && this.isPointerDragging) || ev.pointerType === 'mouse') {
          const prevRatio = active.game.getInspectedRatio();
          active.game.moveLoupe(pt.x, pt.y);
          if (prevRatio < 0.4 && active.game.getInspectedRatio() >= 0.4) {
            this.render();
            return;
          }
          this.drawActiveCanvasFrame();
        }
      } else if (active.type === 'compounding') {
        if (active.game.getStep() === 'GRIND' && (isDown || this.isPointerDragging)) {
          const prevStep = active.game.getStep();
          active.game.handleMortarPointerMove(pt.x, pt.y);
          if (active.game.getStep() !== prevStep) {
            this.sound.playSuccessChord();
            this.render();
            return;
          }
          this.drawActiveCanvasFrame();
        }
      } else if (active.type === 'precinto') {
        if (isDown || (isMove && this.isPointerDragging)) {
          const wasDone = active.game.isCutComplete();
          active.game.traceCutAt(pt.x, pt.y);
          if (!wasDone && active.game.isCutComplete()) {
            this.sound.playClickTick();
            this.render();
            return;
          }
          this.drawActiveCanvasFrame();
        }
      } else if (active.type === 'coldchain') {
        if (isDown) {
          active.game.handleCanvasTap(pt.x, pt.rawY, this.coordinator.getLocale());
          const res = active.game.getResult();
          if (res) {
            this.completeCurrentTaskWithFeedback({
              taskType: 'coldchain',
              passed: res.passed,
              score: res.score,
              feedback: res.feedback,
            });
            return;
          }
          this.render();
        }
      }
    };

    canvas.addEventListener('pointerdown', (ev) => {
      this.isPointerDragging = true;
      handlePointer(ev, true, false);
    });
    canvas.addEventListener('pointermove', (ev) => {
      handlePointer(ev, false, true);
    });
    canvas.addEventListener('pointerup', () => {
      this.isPointerDragging = false;
    });
    canvas.addEventListener('pointercancel', () => {
      this.isPointerDragging = false;
    });
  }

  private buildMiniGameControls(
    active: NonNullable<ReturnType<GameCoordinator['getActiveMiniGame']>>
  ): HTMLElement {
    const locale = this.coordinator.getLocale();
    const box = el('div', 'controls-inner');

    if (active.type === 'triage') {
      const game = active.game;

      // Mobile-First High-Legibility Patient Card (Large 17px-19px text for iPhone!)
      const patientCard = el('div', 'patient-dialogue-card');
      const patHeader = el('div', 'patient-card-header');
      const patName = el(
        'h2',
        'patient-card-name',
        `🗣️ ${game.scenario.customerName} (${t(game.scenario.customerRole, locale)})`
      );
      patHeader.appendChild(patName);

      const complaintText = el(
        'p',
        'patient-complaint-quote',
        t(game.scenario.openingComplaint, locale)
      );
      patientCard.append(patHeader, complaintText);

      // Show revealed clinical answers in large, readable cards
      const keysOrder: TriageQuestionKey[] = [
        'fever',
        'allergies',
        'meds_pregnancy',
        'duration',
      ];
      const revealedList = el('div', 'patient-answers-list');
      for (const k of keysOrder) {
        if (game.isQuestionRevealed(k)) {
          const ansItem = el(
            'div',
            'patient-answer-item',
            `• ${t(game.scenario.answers[k], locale)}`
          );
          revealedList.appendChild(ansItem);
        }
      }
      if (revealedList.childElementCount > 0) {
        patientCard.appendChild(revealedList);
      }
      box.appendChild(patientCard);

      box.appendChild(el('h3', 'panel-section-title', t(UI_STRINGS.triage.askHeader, locale)));

      const qRow = el('div', 'button-chip-grid');
      const questions: Array<{ key: TriageQuestionKey; label: string }> = [
        { key: 'fever', label: t(UI_STRINGS.triage.qFever, locale) },
        { key: 'allergies', label: t(UI_STRINGS.triage.qAllergies, locale) },
        { key: 'meds_pregnancy', label: t(UI_STRINGS.triage.qMedsPregnancy, locale) },
        { key: 'duration', label: t(UI_STRINGS.triage.qDuration, locale) },
      ];

      for (const q of questions) {
        const revealed = game.isQuestionRevealed(q.key);
        const btn = el(
          'button',
          revealed ? 'chip-btn active' : 'chip-btn',
          revealed ? `✓ ${q.label}` : q.label
        );
        btn.id = `triage-ask-${q.key}`;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.askQuestion(q.key);
          this.render();
        });
        qRow.appendChild(btn);
      }
      box.appendChild(qRow);

      // Remedy selector
      box.appendChild(
        el('h3', 'panel-section-title', t(UI_STRINGS.triage.remedyHeader, locale))
      );
      const remGrid = el('div', 'choice-list');
      for (const rem of VADEMECUM_ENTRIES) {
        const isSel = game.getSelectedRemedy() === rem.id;
        const btn = el(
          'button',
          isSel ? 'choice-btn selected' : 'choice-btn',
          `${t(rem.name, locale)} — ${t(rem.indication, locale)}`
        );
        btn.id = `triage-remedy-${rem.id}`;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.selectRemedy(rem.id);
          this.render();
        });
        remGrid.appendChild(btn);
      }
      box.appendChild(remGrid);

      // Counseling selector
      box.appendChild(
        el('h3', 'panel-section-title', t(UI_STRINGS.triage.counselingHeader, locale))
      );
      const counselGrid = el('div', 'choice-list');
      const counselKeys: TriageCounselingId[] = [
        'take_with_food',
        'hydrate_shade',
        'avoid_drowsiness_driving',
        'clean_dry_skin',
        'emergency_hospital_now',
      ];
      for (const cId of counselKeys) {
        const isSel = game.getSelectedCounseling() === cId;
        const btn = el(
          'button',
          isSel ? 'choice-btn selected' : 'choice-btn',
          t(UI_STRINGS.triage.counselingOptions[cId], locale)
        );
        btn.id = `triage-counsel-${cId}`;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.selectCounseling(cId);
          this.render();
        });
        counselGrid.appendChild(btn);
      }
      box.appendChild(counselGrid);

      // Submit button
      const canSubmit =
        game.getSelectedRemedy() !== null && game.getSelectedCounseling() !== null;
      const submitBtn = el(
        'button',
        canSubmit ? 'primary-btn full-width-btn' : 'disabled-btn full-width-btn',
        `✚ ${t(UI_STRINGS.triage.dispenseSubmitBtn, locale)}`
      );
      submitBtn.id = 'triage-submit-btn';
      submitBtn.type = 'button';
      submitBtn.disabled = !canSubmit;
      submitBtn.addEventListener('click', () => {
        const res = game.submitDecision(locale);
        this.completeCurrentTaskWithFeedback({
          taskType: 'triage',
          passed: res.passed,
          score: res.score,
          feedback: res.feedback,
        });
      });
      box.appendChild(submitBtn);
      return box;
    }

    if (active.type === 'handwriting') {
      const game = active.game;

      // Mobile-First Prescription Patient Card
      const rxCard = el('div', 'patient-dialogue-card');
      const ageUnit = locale === 'es' ? 'años' : 'yrs';
      const patHeadline = el(
        'h2',
        'patient-card-name',
        `📋 ${game.scenario.patientName} (${game.scenario.patientAge} ${ageUnit})`
      );
      const docLine = el(
        'p',
        'patient-card-sub',
        `${game.scenario.doctorName} • ${t(game.scenario.clinicSpecialty, locale)}`
      );
      const contextLine = el(
        'p',
        'patient-complaint-quote',
        t(game.scenario.patientContext, locale)
      );
      rxCard.append(patHeadline, docLine, contextLine);

      if (
        game.isUvActive() ||
        game.hasUvUpgrade ||
        game.getInspectedRatio() >= 0.4
      ) {
        const clueBox = el(
          'div',
          'patient-answer-item',
          `🔎 ${t(game.scenario.watermarkHint, locale)}`
        );
        rxCard.appendChild(clueBox);
      }
      box.appendChild(rxCard);

      const hint = el('p', 'control-hint', t(UI_STRINGS.handwriting.instructions, locale));
      box.appendChild(hint);

      const uvBtn = el(
        'button',
        game.isUvActive() ? 'chip-btn active' : 'chip-btn',
        t(UI_STRINGS.handwriting.uvToggleBtn, locale)
      );
      uvBtn.id = 'handwriting-uv-btn';
      uvBtn.type = 'button';
      uvBtn.addEventListener('click', () => {
        this.sound.playClickTick();
        game.toggleUvFilter();
        for (let x = 180; x <= 600; x += 60) {
          game.moveLoupe(x, 235);
        }
        this.render();
      });
      box.appendChild(uvBtn);

      // 1. Drug
      box.appendChild(
        el('h3', 'panel-section-title', t(UI_STRINGS.handwriting.drugHeader, locale))
      );
      const drugRow = el('div', 'button-chip-grid');
      for (const d of game.scenario.drugOptions) {
        const btn = el(
          'button',
          game.getSelectedDrug() === d ? 'chip-btn active' : 'chip-btn',
          d
        );
        btn.id = `rx-drug-${d.replace(/\s+/g, '_')}`;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.selectDrug(d);
          this.render();
        });
        drugRow.appendChild(btn);
      }
      box.appendChild(drugRow);

      // 2. Strength
      box.appendChild(
        el('h3', 'panel-section-title', t(UI_STRINGS.handwriting.strengthHeader, locale))
      );
      const strRow = el('div', 'button-chip-grid');
      for (const s of game.scenario.strengthOptions) {
        const btn = el(
          'button',
          game.getSelectedStrength() === s ? 'chip-btn active' : 'chip-btn',
          s
        );
        btn.id = `rx-strength-${s.replace(/\s+/g, '_')}`;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.selectStrength(s);
          this.render();
        });
        strRow.appendChild(btn);
      }
      box.appendChild(strRow);

      // 3. Posology
      box.appendChild(
        el('h3', 'panel-section-title', t(UI_STRINGS.handwriting.posologyHeader, locale))
      );
      const posCol = el('div', 'choice-list');
      for (const p of game.scenario.posologyOptions) {
        const btn = el(
          'button',
          game.getSelectedPosology() === p.id ? 'choice-btn selected' : 'choice-btn',
          t(p.label, locale)
        );
        btn.id = `rx-posology-${p.id}`;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.selectPosology(p.id);
          this.render();
        });
        posCol.appendChild(btn);
      }
      box.appendChild(posCol);

      const canVerify =
        game.getSelectedDrug() !== null &&
        game.getSelectedStrength() !== null &&
        game.getSelectedPosology() !== null;
      const submitBtn = el(
        'button',
        canVerify ? 'primary-btn full-width-btn' : 'disabled-btn full-width-btn',
        `✓ ${t(UI_STRINGS.handwriting.verifyBtn, locale)}`
      );
      submitBtn.id = 'handwriting-submit-btn';
      submitBtn.type = 'button';
      submitBtn.disabled = !canVerify;
      submitBtn.addEventListener('click', () => {
        const res = game.submitVerification(locale);
        this.completeCurrentTaskWithFeedback({
          taskType: 'handwriting',
          passed: res.passed,
          score: res.score,
          feedback: res.feedback,
        });
      });
      box.appendChild(submitBtn);
      return box;
    }

    if (active.type === 'compounding') {
      const game = active.game;
      const step = game.getStep();

      // Mobile-First Lab Formula Card
      const labCard = el('div', 'patient-dialogue-card');
      const labTitle = el(
        'h2',
        'patient-card-name',
        `⚗️ ${t(game.recipe.name, locale)}`
      );
      const labInd = el(
        'p',
        'patient-complaint-quote',
        t(game.recipe.patientIndication, locale)
      );
      labCard.append(labTitle, labInd);
      box.appendChild(labCard);

      if (step === 'WEIGH') {
        box.appendChild(
          el('h3', 'panel-section-title', t(UI_STRINGS.compounding.stepWeigh, locale))
        );
        const status = el(
          'div',
          'patient-answer-item',
          `${t(game.recipe.powderName, locale)}: ${formatMassGrams(game.getCurrentMassGrams(), locale)} / ${formatMassGrams(game.recipe.targetMassGrams, locale)} (± ${formatMassGrams(game.effectiveMassTolerance, locale)})`
        );
        box.appendChild(status);

        const row = el('div', 'button-chip-grid');
        const add25 = el('button', 'chip-btn', t(UI_STRINGS.compounding.pourSmallBtn, locale));
        add25.id = 'lab-weigh-add-025';
        add25.type = 'button';
        add25.addEventListener('click', () => {
          this.sound.playClickTick();
          game.adjustPowderGrams(0.25);
          this.render();
        });

        const add05 = el('button', 'chip-btn', t(UI_STRINGS.compounding.pourMicroBtn, locale));
        add05.id = 'lab-weigh-add-005';
        add05.type = 'button';
        add05.addEventListener('click', () => {
          this.sound.playClickTick();
          game.adjustPowderGrams(0.05);
          this.render();
        });

        const sub10 = el('button', 'chip-btn', t(UI_STRINGS.compounding.removePinchBtn, locale));
        sub10.id = 'lab-weigh-sub-010';
        sub10.type = 'button';
        sub10.addEventListener('click', () => {
          this.sound.playClickTick();
          game.adjustPowderGrams(-0.1);
          this.render();
        });

        row.append(add25, add05, sub10);
        box.appendChild(row);

        const lockBtn = el(
          'button',
          'primary-btn full-width-btn',
          `⚖️ ${t(UI_STRINGS.compounding.lockWeightBtn, locale)}`
        );
        lockBtn.id = 'lab-weigh-confirm-btn';
        lockBtn.type = 'button';
        lockBtn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.confirmWeighStep();
          this.render();
        });
        box.appendChild(lockBtn);
      } else if (step === 'GRIND') {
        box.appendChild(
          el('h3', 'panel-section-title', t(UI_STRINGS.compounding.stepGrind, locale))
        );
        const status = el(
          'div',
          'patient-answer-item',
          `${locale === 'es' ? 'Homogeneización' : 'Homogenization'}: ${formatPercent(game.getGrindProgress(), locale)}`
        );
        box.appendChild(status);

        const swirlBtn = el(
          'button',
          'primary-btn full-width-btn',
          t(UI_STRINGS.compounding.grindStrokeBtn, locale)
        );
        swirlBtn.id = 'lab-grind-swirl-btn';
        swirlBtn.type = 'button';
        swirlBtn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.applyGrindSwirl(0.34);
          this.render();
        });
        box.appendChild(swirlBtn);
      } else if (step === 'MEASURE') {
        box.appendChild(
          el('h3', 'panel-section-title', t(UI_STRINGS.compounding.stepMeasure, locale))
        );
        const status = el(
          'div',
          'patient-answer-item',
          `${t(game.recipe.liquidName, locale)}: ${formatVolumeMl(game.getCurrentLiquidMl(), locale)} / ${formatVolumeMl(game.recipe.targetLiquidMl, locale)} (± ${formatVolumeMl(game.effectiveLiquidTolerance, locale)})`
        );
        box.appendChild(status);

        const row = el('div', 'button-chip-grid');
        const add1 = el('button', 'chip-btn', t(UI_STRINGS.compounding.addDropBtn, locale));
        add1.id = 'lab-measure-add-10';
        add1.type = 'button';
        add1.addEventListener('click', () => {
          this.sound.playClickTick();
          game.adjustLiquidMl(1.0);
          this.render();
        });

        const add02 = el(
          'button',
          'chip-btn',
          t(UI_STRINGS.compounding.addMicroDropBtn, locale)
        );
        add02.id = 'lab-measure-add-02';
        add02.type = 'button';
        add02.addEventListener('click', () => {
          this.sound.playClickTick();
          game.adjustLiquidMl(0.2);
          this.render();
        });

        const sub05 = el('button', 'chip-btn', t(UI_STRINGS.compounding.drainDropBtn, locale));
        sub05.id = 'lab-measure-sub-05';
        sub05.type = 'button';
        sub05.addEventListener('click', () => {
          this.sound.playClickTick();
          game.adjustLiquidMl(-0.5);
          this.render();
        });

        row.append(add1, add02, sub05);
        box.appendChild(row);

        const lockBtn = el(
          'button',
          'primary-btn full-width-btn',
          `💧 ${t(UI_STRINGS.compounding.lockVolumeBtn, locale)}`
        );
        lockBtn.id = 'lab-measure-confirm-btn';
        lockBtn.type = 'button';
        lockBtn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.confirmMeasureStep();
          this.render();
        });
        box.appendChild(lockBtn);
      } else {
        box.appendChild(
          el('h3', 'panel-section-title', t(UI_STRINGS.compounding.stepHeat, locale))
        );
        const status = el(
          'div',
          'patient-answer-item',
          `🌡️ ${formatTempC(game.getCurrentBathTempC(), locale)} / ${formatTempC(game.recipe.targetBathTempC, locale)} (± ${formatTempC(game.effectiveTempTolerance, locale)}) • ${formatPercent(game.getThermalHoldProgress(), locale)}`
        );
        box.appendChild(status);

        const heatBtn = el(
          'button',
          'primary-btn full-width-btn',
          t(UI_STRINGS.compounding.heatBurnerOnBtn, locale)
        );
        heatBtn.id = 'lab-heat-pulse-btn';
        heatBtn.type = 'button';
        heatBtn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.pulseWaterBath(true, 0.9, locale);
          const res = game.getResult();
          if (res) {
            this.completeCurrentTaskWithFeedback({
              taskType: 'compounding',
              passed: res.passed,
              score: res.score,
              feedback: res.feedback,
            });
            return;
          }
          this.render();
        });

        const coolBtn = el(
          'button',
          'secondary-btn full-width-btn',
          t(UI_STRINGS.compounding.heatCoolStirBtn, locale)
        );
        coolBtn.id = 'lab-cool-stir-btn';
        coolBtn.type = 'button';
        coolBtn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.pulseWaterBath(false, 0.9, locale);
          const res = game.getResult();
          if (res) {
            this.completeCurrentTaskWithFeedback({
              taskType: 'compounding',
              passed: res.passed,
              score: res.score,
              feedback: res.feedback,
            });
            return;
          }
          this.render();
        });
        box.append(heatBtn, coolBtn);
      }
      return box;
    }

    if (active.type === 'precinto') {
      const game = active.game;

      // Mobile-First Patient Tarjeta Sanitaria & Box Card
      const precintoCard = el('div', 'patient-dialogue-card');
      const boxTitle = el(
        'h2',
        'patient-card-name',
        `📦 ${game.order.medicationBoxTitle}`
      );
      const regimeQuote = el(
        'p',
        'patient-complaint-quote',
        t(game.order.patientRegimeLabel, locale)
      );
      const pvpLine = el(
        'div',
        'patient-answer-item',
        `PVP: ${formatCurrencyEur(game.order.retailPriceEur, locale)} • ${t(game.order.activePrinciple, locale)}`
      );
      precintoCard.append(boxTitle, regimeQuote, pvpLine);
      box.appendChild(precintoCard);

      box.appendChild(el('p', 'control-hint', t(UI_STRINGS.precinto.instructions, locale)));

      const sliceBtn = el(
        'button',
        game.isCutComplete() ? 'chip-btn active' : 'chip-btn',
        game.isCutComplete()
          ? `✓ ${t(UI_STRINGS.precinto.autoSliceBtn, locale)}`
          : t(UI_STRINGS.precinto.autoSliceBtn, locale)
      );
      sliceBtn.id = 'precinto-guided-cut-btn';
      sliceBtn.type = 'button';
      sliceBtn.addEventListener('click', () => {
        this.sound.playClickTick();
        game.stepGuidedCut(0.5);
        this.render();
      });

      const stampBtn = el(
        'button',
        game.isStamped() ? 'chip-btn active' : 'chip-btn',
        game.isStamped()
          ? `✓ ${t(UI_STRINGS.precinto.stampBtn, locale)}`
          : t(UI_STRINGS.precinto.stampBtn, locale)
      );
      stampBtn.id = 'precinto-stamp-btn';
      stampBtn.type = 'button';
      stampBtn.addEventListener('click', () => {
        this.sound.playStampThud();
        game.applyPharmacyStamp();
        this.render();
      });

      const actionRow = el('div', 'button-chip-grid');
      actionRow.append(sliceBtn, stampBtn);
      box.appendChild(actionRow);

      box.appendChild(
        el('h3', 'panel-section-title', t(UI_STRINGS.precinto.copayHeader, locale))
      );
      const copayList = el('div', 'choice-list');
      const tiers: Array<{ id: CopayTier; label: string }> = [
        { id: 'pensionista_10', label: t(UI_STRINGS.precinto.copayPensionista, locale) },
        { id: 'activo_40', label: t(UI_STRINGS.precinto.copayActivo, locale) },
        { id: 'sin_receta_100', label: t(UI_STRINGS.precinto.copaySinReceta, locale) },
      ];
      for (const tier of tiers) {
        const btn = el(
          'button',
          game.getSelectedCopayTier() === tier.id ? 'choice-btn selected' : 'choice-btn',
          tier.label
        );
        btn.id = `precinto-copay-${tier.id}`;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          this.sound.playClickTick();
          game.selectCopayTier(tier.id);
          this.render();
        });
        copayList.appendChild(btn);
      }
      box.appendChild(copayList);

      const canFinish =
        game.isCutComplete() && game.isStamped() && game.getSelectedCopayTier() !== null;
      const submitBtn = el(
        'button',
        canFinish ? 'primary-btn full-width-btn' : 'disabled-btn full-width-btn',
        `💶 ${t(UI_STRINGS.precinto.finishPrecintoBtn, locale)}`
      );
      submitBtn.id = 'precinto-submit-btn';
      submitBtn.type = 'button';
      submitBtn.disabled = !canFinish;
      submitBtn.addEventListener('click', () => {
        const res = game.submitOrder(locale);
        this.completeCurrentTaskWithFeedback({
          taskType: 'precinto',
          passed: res.passed,
          score: res.score,
          feedback: res.feedback,
        });
      });
      box.appendChild(submitBtn);
      return box;
    }

    // Cold-Chain Mini-Game Controls
    const game = active.game;
    box.appendChild(el('p', 'control-hint', t(UI_STRINGS.coldchain.instructions, locale)));

    const unrouted = game.items.filter((i) => i.routedDestination === null);
    const itemList = el('div', 'choice-list');
    for (const item of unrouted) {
      const isSel = game.getSelectedItemId() === item.id;
      const btn = el(
        'button',
        isSel ? 'choice-btn selected' : 'choice-btn',
        `${item.name} — ${t(item.subtitle, locale)}`
      );
      btn.id = `coldchain-item-${item.id}`;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        this.sound.playClickTick();
        game.selectItem(item.id);
        this.render();
      });
      itemList.appendChild(btn);
    }
    box.appendChild(itemList);

    const destGrid = el('div', 'button-chip-grid');
    const dests: Array<{ dest: StorageDestination; label: string }> = [
      { dest: 'fridge_cold', label: t(UI_STRINGS.coldchain.destFridge, locale) },
      { dest: 'safe_estupefacientes', label: t(UI_STRINGS.coldchain.destSafe, locale) },
      { dest: 'drawer_a_m', label: t(UI_STRINGS.coldchain.destDrawerAM, locale) },
      { dest: 'drawer_n_z', label: t(UI_STRINGS.coldchain.destDrawerNZ, locale) },
      { dest: 'sigre_expired', label: t(UI_STRINGS.coldchain.destSigre, locale) },
    ];
    for (const d of dests) {
      const btn = el('button', 'chip-btn', d.label);
      btn.id = `coldchain-dest-${d.dest}`;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        this.sound.playClickTick();
        game.routeSelectedItem(d.dest, locale);
        const res = game.getResult();
        if (res) {
          this.completeCurrentTaskWithFeedback({
            taskType: 'coldchain',
            passed: res.passed,
            score: res.score,
            feedback: res.feedback,
          });
          return;
        }
        this.render();
      });
      destGrid.appendChild(btn);
    }
    box.appendChild(destGrid);
    return box;
  }

  private completeCurrentTaskWithFeedback(outcome: {
    taskType: MiniGameType;
    passed: boolean;
    score: number;
    feedback: string;
  }): void {
    if (outcome.passed) {
      this.sound.playSuccessChord();
    } else {
      this.sound.playErrorBuzzer();
    }
    this.lastFeedbackBanner = {
      passed: outcome.passed,
      text: `${outcome.passed ? '✅' : '❌'} ${outcome.feedback}`,
    };
    this.coordinator.recordCurrentTaskOutcome(outcome);
    this.render();
  }

  private buildSummaryView(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const summary: ShiftSummaryResult | null = this.coordinator.getLastShiftSummary();
    const card = el('section', 'summary-card');
    card.id = 'shift-summary-card';

    if (!summary) {
      return card;
    }

    const heading = el(
      'h2',
      'summary-title',
      summary.passed
        ? locale === 'es'
          ? '¡Turno de Guardia Completado con Éxito!'
          : 'On-Call Pharmacy Shift Completed!'
        : locale === 'es'
          ? 'Incidencia en el Turno de Guardia'
          : 'Shift Completed with Clinical Errors'
    );

    const starsLine = el(
      'p',
      'summary-stars',
      `Cruces de Farmacia: ${'✚'.repeat(summary.stars)}${'·'.repeat(3 - summary.stars)} (${summary.averageScore}/100)`
    );

    const rewardLine = el(
      'p',
      'summary-reward',
      locale === 'es'
        ? `Facturación del Turno: +${formatCurrencyEur(summary.earnedEur, locale)}`
        : `Shift Earnings: +${formatCurrencyEur(summary.earnedEur, locale)}`
    );

    const breakdownList = el('div', 'summary-outcomes-list');
    for (const item of summary.taskOutcomes) {
      const row = el(
        'div',
        item.passed ? 'outcome-row passed' : 'outcome-row failed',
        `${item.passed ? '✅' : '❌'} ${t(UI_STRINGS.miniGameNames[item.taskType], locale)} (${item.score} pts) — ${item.feedback}`
      );
      breakdownList.appendChild(row);
    }

    const btnRow = el('div', 'summary-btn-row');
    const hubBtn = el(
      'button',
      'secondary-btn',
      `🏥 ${t(UI_STRINGS.backToHubBtn, locale)}`
    );
    hubBtn.id = 'summary-back-hub-btn';
    hubBtn.type = 'button';
    hubBtn.addEventListener('click', () => {
      this.lastFeedbackBanner = null;
      this.coordinator.returnToHub();
      this.render();
    });
    btnRow.appendChild(hubBtn);

    if (
      summary.mode === 'campaign' &&
      summary.passed &&
      summary.levelNumber >= 1 &&
      summary.levelNumber < 10
    ) {
      const nextBtn = el(
        'button',
        'primary-btn',
        `▶ ${t(UI_STRINGS.nextLevelBtn, locale)} (#${summary.levelNumber + 1})`
      );
      nextBtn.id = 'summary-next-level-btn';
      nextBtn.type = 'button';
      nextBtn.addEventListener('click', () => {
        this.sound.playBellChime();
        this.lastFeedbackBanner = null;
        this.coordinator.startCampaignLevel(summary.levelNumber + 1);
        this.render();
      });
      btnRow.appendChild(nextBtn);
    }

    card.append(heading, starsLine, rewardLine, breakdownList, btnRow);
    return card;
  }

  private buildResetConfirmModal(): HTMLElement {
    const locale = this.coordinator.getLocale();
    const overlay = el('div', 'modal-overlay');
    overlay.id = 'reset-confirm-modal';

    const dialog = el('div', 'modal-dialog');
    const prompt = el('p', 'modal-prompt', t(UI_STRINGS.resetConfirmPrompt, locale));
    const btnRow = el('div', 'modal-btn-row');

    const confirmBtn = el(
      'button',
      'danger-btn',
      t(UI_STRINGS.confirmYes, locale)
    );
    confirmBtn.id = 'confirm-reset-yes-btn';
    confirmBtn.type = 'button';
    confirmBtn.addEventListener('click', () => {
      this.coordinator.resetAllProgress();
      this.showResetConfirmModal = false;
      this.lastFeedbackBanner = null;
      this.render();
    });

    const cancelBtn = el(
      'button',
      'secondary-btn',
      t(UI_STRINGS.confirmCancel, locale)
    );
    cancelBtn.id = 'confirm-reset-cancel-btn';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', () => {
      this.showResetConfirmModal = false;
      this.render();
    });

    btnRow.append(confirmBtn, cancelBtn);
    dialog.append(prompt, btnRow);
    overlay.appendChild(dialog);
    return overlay;
  }

  private updateHudDynamicValues(): void {
    const timerEl = this.root.querySelector('#shift-timer-badge');
    if (timerEl) {
      timerEl.textContent = `⏱️ ${Math.ceil(this.coordinator.getRemainingTimeSec())}s`;
    }
  }

  private syncCanvasSize(): void {
    if (!this.canvasEl) return;
    const parent = this.canvasEl.parentElement;
    const cssWidth = parent && parent.clientWidth > 0 ? parent.clientWidth : 640;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    syncCanvasHiDpi(this.canvasEl, cssWidth, dpr);
  }

  public drawActiveCanvasFrame(): void {
    if (!this.canvasEl) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = this.canvasEl.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    const scale = this.canvasEl.width / VIRTUAL_CANVAS_WIDTH;
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const active = this.coordinator.getActiveMiniGame();
    const locale = this.coordinator.getLocale();
    const tempC = this.coordinator.getActiveLevel()?.ambientTempC ?? 25;

    if (active?.type === 'triage') {
      active.game.renderCanvas(ctx, locale, tempC);
    } else if (active?.type === 'handwriting') {
      active.game.renderCanvas(ctx, locale);
    } else if (active?.type === 'compounding') {
      active.game.renderCanvas(ctx, locale);
    } else if (active?.type === 'precinto') {
      active.game.renderCanvas(ctx, locale);
    } else if (active?.type === 'coldchain') {
      active.game.renderCanvas(ctx, locale);
    }
    ctx.restore();
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  textContent?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }
  if (typeof textContent === 'string') {
    node.textContent = textContent;
  }
  return node;
}
