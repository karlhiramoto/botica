import { formatCurrencyEur, formatPercent, t } from '../i18n/i18n';
import type { CopayTier, Locale, PrecintoOrder } from '../types';
import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '../ui/viewport';

export interface PrecintoEvaluationResult {
  passed: boolean;
  score: number;
  cutComplete: boolean;
  blisterPunctured: boolean;
  stamped: boolean;
  copayCorrect: boolean;
  feedback: string;
}

export class PrecintoMiniGame {
  public readonly order: PrecintoOrder;
  public readonly effectiveCutMarginPx: number;

  // Perforation line spans from x = 440 to x = 680 at y = 175
  public static readonly CUT_START_X = 440;
  public static readonly CUT_END_X = 680;
  public static readonly CUT_LINE_Y = 175;

  private cutProgress = 0; // 0..1
  private maxDeviationPx = 0;
  private blisterPunctured = false;
  private stamped = false;
  private selectedCopayTier: CopayTier | null = null;
  private cutterX = PrecintoMiniGame.CUT_START_X;
  private cutterY = PrecintoMiniGame.CUT_LINE_Y;
  private result: PrecintoEvaluationResult | null = null;

  constructor(
    order: PrecintoOrder,
    difficultyMultiplier = 1.0,
    hasLaserUpgrade = false
  ) {
    this.order = order;
    const upgradeBonus = hasLaserUpgrade ? 1.4 : 1.0;
    const diffScale = Math.max(0.85, Math.min(1.3, difficultyMultiplier));
    this.effectiveCutMarginPx = Math.max(
      8,
      Math.round((order.cutMarginPx * upgradeBonus) / diffScale)
    );
  }

  public getCutProgress(): number {
    return this.cutProgress;
  }

  public isCutComplete(): boolean {
    return this.cutProgress >= 1 - 1e-6;
  }

  public isBlisterPunctured(): boolean {
    return this.blisterPunctured;
  }

  public isStamped(): boolean {
    return this.stamped;
  }

  public getSelectedCopayTier(): CopayTier | null {
    return this.selectedCopayTier;
  }

  public getResult(): PrecintoEvaluationResult | null {
    return this.result;
  }

  /**
   * Processes a pointer drag along the perforated Cupón Precinto cut line.
   */
  public traceCutAt(virtualX: number, virtualY: number): void {
    if (this.result || this.isCutComplete()) return;

    this.cutterX = Math.max(400, Math.min(720, virtualX));
    this.cutterY = Math.max(110, Math.min(260, virtualY));

    const startX = PrecintoMiniGame.CUT_START_X;
    const endX = PrecintoMiniGame.CUT_END_X;
    const lineY = PrecintoMiniGame.CUT_LINE_Y;

    if (virtualX >= startX - 18 && virtualX <= endX + 18) {
      const devY = Math.abs(virtualY - lineY);
      this.maxDeviationPx = Math.max(this.maxDeviationPx, devY);

      if (devY > this.effectiveCutMarginPx * 2.2) {
        this.blisterPunctured = true;
      }

      const normX = Math.max(0, Math.min(1, (virtualX - startX) / (endX - startX)));
      if (normX > this.cutProgress && normX <= this.cutProgress + 0.45) {
        this.cutProgress = normX;
      }
      if (this.cutProgress >= 0.94) {
        this.cutProgress = 1;
      }
    }
  }

  /**
   * Accessible button helper to advance the guided scalpel slice cleanly.
   */
  public stepGuidedCut(stepFraction = 0.35): void {
    if (this.result) return;
    this.cutProgress = Math.min(1, this.cutProgress + Math.max(0.1, stepFraction));
    this.cutterX =
      PrecintoMiniGame.CUT_START_X +
      (PrecintoMiniGame.CUT_END_X - PrecintoMiniGame.CUT_START_X) * this.cutProgress;
    this.cutterY = PrecintoMiniGame.CUT_LINE_Y;
  }

  public applyPharmacyStamp(): void {
    if (this.result) return;
    this.stamped = true;
  }

  public selectCopayTier(tier: CopayTier): void {
    if (this.result) return;
    this.selectedCopayTier = tier;
  }

  public submitOrder(locale: Locale): PrecintoEvaluationResult {
    if (this.result) return this.result;

    const cutComplete = this.isCutComplete();
    const copayCorrect = this.selectedCopayTier === this.order.correctCopayTier;

    let score = 0;
    if (cutComplete && !this.blisterPunctured) score += 40;
    else if (cutComplete) score += 15;

    if (this.stamped) score += 25;
    if (copayCorrect) score += 35;

    const passed =
      cutComplete && !this.blisterPunctured && this.stamped && copayCorrect;

    const copayStr = formatCurrencyEur(this.order.expectedCopayEur, locale);
    const feedback = passed
      ? locale === 'es'
        ? `¡Cupón precinto adherido y sellado en Farmacia Gallego! Aportación cobrada: ${copayStr}.`
        : `Cupón precinto sliced & stamped with Farmacia Gallego seal! Co-pay charged: ${copayStr}.`
      : locale === 'es'
        ? `Revisa el corte del precinto, el sello de la farmacia y el régimen de aportación (${copayStr}).`
        : `Verify the barcode cut, pharmacy stamp, and patient co-pay tier (${copayStr}).`;

    this.result = {
      passed,
      score: Math.min(100, score),
      cutComplete,
      blisterPunctured: this.blisterPunctured,
      stamped: this.stamped,
      copayCorrect,
      feedback,
    };
    return this.result;
  }

  public renderCanvas(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const W = VIRTUAL_CANVAS_WIDTH;
    const H = VIRTUAL_CANVAS_HEIGHT;
    ctx.save();

    // 1. Counter Cutting Mat Background
    ctx.fillStyle = '#1E3F35';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 2. Left Card: Hoja de Comprobación & Tarjeta Sanitaria Andaluza
    ctx.fillStyle = '#FFFDF7';
    ctx.beginPath();
    ctx.roundRect(22, 24, 360, 450, 12);
    ctx.fill();
    ctx.strokeStyle = '#007A33';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#007A33';
    ctx.fillRect(36, 38, 332, 42);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TARJETA SANITARIA ANDALUZA', 48, 66);

    ctx.fillStyle = '#0D351E';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(t(this.order.patientRegimeLabel, locale), 38, 110);
    ctx.font = 'bold 23px sans-serif';
    ctx.fillStyle = '#146C38';
    const pvpStr = formatCurrencyEur(this.order.retailPriceEur, locale);
    ctx.fillText(`PVP: ${pvpStr}`, 38, 144);

    // Barcode Coupon Attachment Box on the Slip
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(42, 165, 320, 102);
    ctx.setLineDash([]);

    if (this.isCutComplete()) {
      ctx.fillStyle = '#F4F6F7';
      ctx.fillRect(52, 175, 300, 82);
      // Barcode stripes
      ctx.fillStyle = '#111111';
      for (let bx = 70; bx < 330; bx += 7) {
        ctx.fillRect(bx, 184, (bx % 3) + 2, 38);
      }
      ctx.font = 'bold 17px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CUPÓN PRECINTO SNS', 202, 246);
    } else {
      ctx.fillStyle = '#455A64';
      ctx.font = 'bold 19px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        locale === 'es' ? 'Pega aquí el Cupón Precinto' : 'Attach Cupón Precinto here',
        202,
        222
      );
    }

    // Rubber Stamp Target Zone (Sello Farmacia Gallego)
    ctx.strokeStyle = '#166938';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(42, 286, 320, 128);
    if (this.stamped) {
      ctx.save();
      ctx.translate(202, 350);
      ctx.rotate(-0.06);
      ctx.strokeStyle = '#146C38';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(-138, -42, 276, 84);
      ctx.fillStyle = '#146C38';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('✚ FARMACIA GALLEGO ✚', 0, -10);
      ctx.font = 'bold 16px monospace';
      ctx.fillText('BOTICA DE GUARDIA', 0, 14);
      ctx.fillText('DISPENSACIÓN VERIFICADA', 0, 34);
      ctx.restore();
    } else {
      ctx.fillStyle = '#455A64';
      ctx.font = 'bold 19px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        locale === 'es'
          ? 'Estampar Sello Farmacia Gallego'
          : 'Stamp Farmacia Gallego Seal',
        202,
        356
      );
    }

    // 3. Right Side: 3D-Styled Medicine Box & Perforated Cupón Precinto Flap
    const boxX = 408;
    const boxY = 85;
    const boxW = 368;
    const boxH = 295;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    ctx.fillStyle = this.order.boxColor;
    ctx.fillRect(boxX, boxY + 135, boxW, 145);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.order.medicationBoxTitle, boxX + 20, boxY + 182);
    ctx.font = 'bold 19px sans-serif';
    ctx.fillStyle = '#E8EEF5';
    ctx.fillText(t(this.order.activePrinciple, locale), boxX + 20, boxY + 216);

    // Cupón Precinto Perforated Flap at top of box (y = 85..175)
    const startX = PrecintoMiniGame.CUT_START_X;
    const endX = PrecintoMiniGame.CUT_END_X;
    const lineY = PrecintoMiniGame.CUT_LINE_Y;

    if (!this.isCutComplete()) {
      ctx.fillStyle = '#F8F9F9';
      ctx.fillRect(startX, boxY + 12, endX - startX, lineY - (boxY + 12));
      ctx.fillStyle = '#111111';
      for (let bx = startX + 18; bx < endX - 18; bx += 7) {
        ctx.fillRect(bx, boxY + 24, (bx % 3) + 2, 32);
      }
      ctx.font = 'bold 17px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORTE AQUÍ ✂️', (startX + endX) / 2, boxY + 76);
    }

    // Safe green cut corridor & dotted perforation line
    ctx.fillStyle = 'rgba(0, 230, 118, 0.22)';
    ctx.fillRect(
      startX,
      lineY - this.effectiveCutMarginPx,
      endX - startX,
      this.effectiveCutMarginPx * 2
    );

    ctx.strokeStyle = '#D9534F';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, lineY);
    ctx.lineTo(endX, lineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Active cut line progress
    const currentCutX = startX + (endX - startX) * this.cutProgress;
    ctx.strokeStyle = '#00E676';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startX, lineY);
    ctx.lineTo(currentCutX, lineY);
    ctx.stroke();

    // Scalpel handle icon
    ctx.fillStyle = '#FFB300';
    ctx.beginPath();
    ctx.arc(this.cutterX, this.cutterY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Footer status
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      locale === 'es'
        ? `Corte del Precinto: ${formatPercent(this.cutProgress, locale)}`
        : `Barcode Cut: ${formatPercent(this.cutProgress, locale)}`,
      boxX + boxW / 2,
      422
    );

    ctx.restore();
  }
}
