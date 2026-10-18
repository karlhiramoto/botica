import {
  formatMassGrams,
  formatPercent,
  formatTempC,
  formatVolumeMl,
  t,
} from '../i18n/i18n';
import type { CompoundingRecipe, Locale } from '../types';
import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '../ui/viewport';

export type CompoundingStep = 'WEIGH' | 'GRIND' | 'MEASURE' | 'HEAT' | 'DONE';

export interface CompoundingEvaluationResult {
  passed: boolean;
  score: number;
  massErrorGrams: number;
  grindProgress: number;
  volumeErrorMl: number;
  thermalProgress: number;
  feedback: string;
}

export class CompoundingMiniGame {
  public readonly recipe: CompoundingRecipe;
  public readonly effectiveMassTolerance: number;
  public readonly effectiveLiquidTolerance: number;
  public readonly effectiveTempTolerance: number;

  private stepState: CompoundingStep = 'WEIGH';
  private currentMassGrams = 0;
  private grindProgress = 0; // 0..1
  private pestleAngleRad = 0;
  private lastPointerAngleRad: number | null = null;
  private currentLiquidMl = 0;
  private currentBathTempC = 25;
  private thermalHoldProgress = 0; // 0..1
  private result: CompoundingEvaluationResult | null = null;

  constructor(
    recipe: CompoundingRecipe,
    difficultyMultiplier = 1.0,
    hasScaleUpgrade = false
  ) {
    this.recipe = recipe;
    const upgradeFactor = hasScaleUpgrade ? 1.35 : 1.0;
    const diffScale = Math.max(0.85, Math.min(1.3, difficultyMultiplier));

    this.effectiveMassTolerance =
      Math.round(((recipe.massToleranceGrams * upgradeFactor) / diffScale) * 1000) / 1000;
    this.effectiveLiquidTolerance =
      Math.round(((recipe.liquidToleranceMl * upgradeFactor) / diffScale) * 100) / 100;
    this.effectiveTempTolerance =
      Math.round(((recipe.bathTempToleranceC * upgradeFactor) / diffScale) * 10) / 10;
  }

  public getStep(): CompoundingStep {
    return this.stepState;
  }

  public getCurrentMassGrams(): number {
    return this.currentMassGrams;
  }

  public getGrindProgress(): number {
    return this.grindProgress;
  }

  public getCurrentLiquidMl(): number {
    return this.currentLiquidMl;
  }

  public getCurrentBathTempC(): number {
    return this.currentBathTempC;
  }

  public getThermalHoldProgress(): number {
    return this.thermalHoldProgress;
  }

  public getResult(): CompoundingEvaluationResult | null {
    return this.result;
  }

  public adjustPowderGrams(deltaGrams: number): void {
    if (this.stepState !== 'WEIGH') return;
    this.currentMassGrams = Math.max(
      0,
      Math.min(10, Math.round((this.currentMassGrams + deltaGrams) * 100) / 100)
    );
  }

  public isMassWithinTolerance(): boolean {
    return (
      Math.abs(this.currentMassGrams - this.recipe.targetMassGrams) <=
      this.effectiveMassTolerance + 1e-6
    );
  }

  public confirmWeighStep(): boolean {
    if (this.stepState !== 'WEIGH') return false;
    this.stepState = 'GRIND';
    return this.isMassWithinTolerance();
  }

  public applyGrindSwirl(deltaProgress = 0.22): void {
    if (this.stepState !== 'GRIND') return;
    this.pestleAngleRad += 0.9;
    this.grindProgress = Math.min(1, this.grindProgress + Math.max(0.02, deltaProgress));
    if (this.grindProgress >= 1 - 1e-6) {
      this.grindProgress = 1;
      this.stepState = 'MEASURE';
    }
  }

  public handleMortarPointerMove(virtualX: number, virtualY: number): void {
    if (this.stepState !== 'GRIND') return;
    const mortarCx = 400;
    const mortarCy = 265;
    const dx = virtualX - mortarCx;
    const dy = virtualY - mortarCy;
    const dist = Math.hypot(dx, dy);
    if (dist < 12 || dist > 155) {
      this.lastPointerAngleRad = null;
      return;
    }
    const angle = Math.atan2(dy, dx);
    if (this.lastPointerAngleRad !== null) {
      let deltaAngle = Math.abs(angle - this.lastPointerAngleRad);
      if (deltaAngle > Math.PI) {
        deltaAngle = Math.PI * 2 - deltaAngle;
      }
      if (deltaAngle > 0.04) {
        this.pestleAngleRad = angle;
        const increment = deltaAngle / (Math.PI * 2 * 2.2);
        this.grindProgress = Math.min(1, this.grindProgress + increment);
        if (this.grindProgress >= 1 - 1e-6) {
          this.grindProgress = 1;
          this.stepState = 'MEASURE';
        }
      }
    }
    this.lastPointerAngleRad = angle;
  }

  public adjustLiquidMl(deltaMl: number): void {
    if (this.stepState !== 'MEASURE') return;
    this.currentLiquidMl = Math.max(
      0,
      Math.min(15, Math.round((this.currentLiquidMl + deltaMl) * 10) / 10)
    );
  }

  public isVolumeWithinTolerance(): boolean {
    return (
      Math.abs(this.currentLiquidMl - this.recipe.targetLiquidMl) <=
      this.effectiveLiquidTolerance + 1e-6
    );
  }

  public confirmMeasureStep(): boolean {
    if (this.stepState !== 'MEASURE') return false;
    this.stepState = 'HEAT';
    this.currentBathTempC = this.recipe.targetBathTempC - 6;
    return this.isVolumeWithinTolerance();
  }

  public isBathTempInBand(): boolean {
    return (
      Math.abs(this.currentBathTempC - this.recipe.targetBathTempC) <=
      this.effectiveTempTolerance + 1e-6
    );
  }

  public pulseWaterBath(burnerOn: boolean, dtSec = 0.6, locale: Locale = 'es'): void {
    if (this.stepState !== 'HEAT') return;
    if (burnerOn) {
      this.currentBathTempC = Math.min(95, this.currentBathTempC + 3.0);
    } else {
      this.currentBathTempC = Math.max(22, this.currentBathTempC - 1.5);
    }

    if (this.isBathTempInBand()) {
      const stepFrac = dtSec / Math.max(1.0, this.recipe.holdTempDurationSec);
      this.thermalHoldProgress = Math.min(1, this.thermalHoldProgress + stepFrac);
      if (this.thermalHoldProgress >= 1 - 1e-6) {
        this.thermalHoldProgress = 1;
        this.stepState = 'DONE';
        this.finalizeCompounding(locale);
      }
    }
  }

  public finalizeCompounding(locale: Locale): CompoundingEvaluationResult {
    if (this.result) return this.result;

    const massErr = Math.abs(this.currentMassGrams - this.recipe.targetMassGrams);
    const massOk = massErr <= this.effectiveMassTolerance + 1e-6;
    const grindOk = this.grindProgress >= 0.99;
    const volErr = Math.abs(this.currentLiquidMl - this.recipe.targetLiquidMl);
    const volOk = volErr <= this.effectiveLiquidTolerance + 1e-6;
    const heatOk = this.thermalHoldProgress >= 0.99;

    let score = 0;
    if (massOk) score += 25;
    else score += Math.max(0, Math.round(25 - massErr * 40));

    if (grindOk) score += 25;
    if (volOk) score += 25;
    else score += Math.max(0, Math.round(25 - volErr * 25));

    if (heatOk) score += 25;

    const passed = massOk && grindOk && volOk && heatOk;
    const formulaTitle = t(this.recipe.name, locale);
    const feedback = passed
      ? locale === 'es'
        ? `¡Fórmula magistral «${formulaTitle}» elaborada con calidad de farmacopea en la Rebotica!`
        : `Magistral formula "${formulaTitle}" compounded to Pharmacopoeia perfection!`
      : locale === 'es'
        ? `Desviación en la fórmula «${formulaTitle}». Revisa los márgenes de pesada y enrasado.`
        : `Formula deviation in "${formulaTitle}". Check analytical balance and meniscus tolerances.`;

    this.result = {
      passed,
      score: Math.min(100, score),
      massErrorGrams: massErr,
      grindProgress: this.grindProgress,
      volumeErrorMl: volErr,
      thermalProgress: this.thermalHoldProgress,
      feedback,
    };
    return this.result;
  }

  public renderCanvas(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const W = VIRTUAL_CANVAS_WIDTH;
    const H = VIRTUAL_CANVAS_HEIGHT;
    ctx.save();

    // 1. Tiled Andalusian Rebotica Laboratory Wall
    ctx.fillStyle = '#EEF5F3';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#D5E5E0';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 360);
      ctx.stroke();
    }
    for (let y = 0; y < 360; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Marble Lab Bench Surface
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(0, 360, W, H - 360);
    ctx.fillStyle = '#90A4AE';
    ctx.fillRect(0, 360, W, 8);

    // Header Banner
    ctx.fillStyle = '#1D4E89';
    ctx.fillRect(24, 18, W - 48, 52);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `⚗️ REBOTICA FARMACIA GALLEGO — ${t(this.recipe.name, locale)}`,
      40,
      41
    );
    ctx.font = '12.5px sans-serif';
    ctx.fillStyle = '#D6EAF8';
    ctx.fillText(t(this.recipe.patientIndication, locale), 40, 60);

    // 2. Render Active Station
    if (this.stepState === 'WEIGH') {
      this.renderWeighStation(ctx, locale);
    } else if (this.stepState === 'GRIND') {
      this.renderGrindStation(ctx, locale);
    } else if (this.stepState === 'MEASURE') {
      this.renderMeasureStation(ctx, locale);
    } else {
      this.renderHeatStation(ctx, locale);
    }

    ctx.restore();
  }

  private renderWeighStation(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const cx = 400;
    // Analytical Balance Base
    ctx.fillStyle = '#37474F';
    ctx.beginPath();
    ctx.roundRect(cx - 140, 290, 280, 75, 10);
    ctx.fill();

    // LCD Digital Screen
    ctx.fillStyle = '#0D2B1D';
    ctx.fillRect(cx - 95, 306, 190, 42);
    ctx.fillStyle = this.isMassWithinTolerance() ? '#00E676' : '#FFD54F';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatMassGrams(this.currentMassGrams, locale), cx, 335);

    // Weighing pan & powder mound
    ctx.fillStyle = '#B0BEC5';
    ctx.fillRect(cx - 80, 268, 160, 12);
    ctx.fillRect(cx - 12, 280, 24, 12);

    const moundRadius = Math.min(62, Math.sqrt(this.currentMassGrams) * 28);
    if (moundRadius > 1) {
      ctx.fillStyle = this.recipe.pigmentColor;
      ctx.beginPath();
      ctx.arc(cx, 268, moundRadius, Math.PI, 0);
      ctx.fill();
    }

    // Target card
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1D4E89';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(120, 96, 560, 76, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1B2631';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(t(this.recipe.powderName, locale), cx, 124);
    ctx.font = '14px sans-serif';
    const targetStr = formatMassGrams(this.recipe.targetMassGrams, locale);
    const tolStr = formatMassGrams(this.effectiveMassTolerance, locale);
    ctx.fillText(
      locale === 'es'
        ? `Objetivo: ${targetStr} (± ${tolStr})`
        : `Target Mass: ${targetStr} (± ${tolStr})`,
      cx,
      152
    );
  }

  private renderGrindStation(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const cx = 400;
    const cy = 265;

    // Ceramic Porcelain Mortar (Top-down angled view)
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1D4E89';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 98, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner mortar bowl with pigment emulsion
    ctx.fillStyle = this.recipe.pigmentColor;
    ctx.globalAlpha = 0.35 + 0.55 * this.grindProgress;
    ctx.beginPath();
    ctx.arc(cx, cy, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Pestle head rotating along circular trajectory
    const px = cx + Math.cos(this.pestleAngleRad) * 42;
    const py = cy + Math.sin(this.pestleAngleRad) * 42;
    ctx.fillStyle = '#ECEFF1';
    ctx.strokeStyle = '#455A64';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Progress bar
    ctx.fillStyle = '#1B2631';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      locale === 'es'
        ? `Homogeneización en Mortero: ${formatPercent(this.grindProgress, locale)}`
        : `Mortar Homogenization: ${formatPercent(this.grindProgress, locale)}`,
      cx,
      115
    );
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(cx - 150, 128, 300, 16);
    ctx.fillStyle = '#00C853';
    ctx.fillRect(cx - 150, 128, 300 * this.grindProgress, 16);
  }

  private renderMeasureStation(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const cx = 400;
    const cylTop = 140;
    const cylBottom = 350;
    const cylH = cylBottom - cylTop;
    const maxMl = 10;

    // Graduated Cylinder Glass
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = '#1D4E89';
    ctx.lineWidth = 3;
    ctx.fillRect(cx - 48, cylTop, 96, cylH);
    ctx.strokeRect(cx - 48, cylTop, 96, cylH);

    // Liquid column
    const fillRatio = Math.min(1, this.currentLiquidMl / maxMl);
    const fillH = cylH * fillRatio;
    ctx.fillStyle = 'rgba(56, 152, 236, 0.55)';
    ctx.fillRect(cx - 45, cylBottom - fillH, 90, fillH);

    // Target graduation band
    const targetY = cylBottom - (this.recipe.targetLiquidMl / maxMl) * cylH;
    ctx.strokeStyle = '#00C853';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 62, targetY);
    ctx.lineTo(cx + 62, targetY);
    ctx.stroke();

    // Info banner
    ctx.fillStyle = '#1B2631';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    const currentStr = formatVolumeMl(this.currentLiquidMl, locale);
    const targetStr = formatVolumeMl(this.recipe.targetLiquidMl, locale);
    ctx.fillText(
      `${t(this.recipe.liquidName, locale)} — ${currentStr} / ${targetStr}`,
      cx,
      112
    );
  }

  private renderHeatStation(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const cx = 400;

    // Water Bath Vessel (Baño María)
    ctx.fillStyle = '#78909C';
    ctx.fillRect(cx - 110, 230, 220, 120);
    ctx.fillStyle = this.recipe.pigmentColor;
    ctx.fillRect(cx - 70, 210, 140, 110);

    // Thermometer & Target Band
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(120, 96, 560, 92, 8);
    ctx.fill();
    ctx.stroke();

    const tempStr = formatTempC(this.currentBathTempC, locale);
    const targetStr = formatTempC(this.recipe.targetBathTempC, locale);
    const tolStr = formatTempC(this.effectiveTempTolerance, locale);

    ctx.fillStyle = this.isBathTempInBand() ? '#007A33' : '#C85A32';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      locale === 'es'
        ? `Baño María: ${tempStr} (Rango: ${targetStr} ± ${tolStr})`
        : `Water Bath: ${tempStr} (Target: ${targetStr} ± ${tolStr})`,
      cx,
      128
    );

    ctx.fillStyle = '#263238';
    ctx.font = '14px sans-serif';
    ctx.fillText(
      locale === 'es'
        ? `Emulsión Completada: ${formatPercent(this.thermalHoldProgress, locale)}`
        : `Emulsion Hold Progress: ${formatPercent(this.thermalHoldProgress, locale)}`,
      cx,
      155
    );
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(cx - 140, 164, 280, 12);
    ctx.fillStyle = '#00C853';
    ctx.fillRect(cx - 140, 164, 280 * this.thermalHoldProgress, 12);
  }
}
