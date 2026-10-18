import { t } from '../i18n/i18n';
import type { Locale, PrescriptionScenario } from '../types';
import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '../ui/viewport';

export interface HandwritingEvaluationResult {
  passed: boolean;
  score: number;
  drugCorrect: boolean;
  strengthCorrect: boolean;
  posologyCorrect: boolean;
  inspectedRatio: number;
  feedback: string;
}

export class HandwritingMiniGame {
  public readonly scenario: PrescriptionScenario;
  public readonly effectiveMessiness: number;
  public readonly hasUvUpgrade: boolean;

  private loupeX = 360;
  private loupeY = 235;
  private uvActive = false;
  private readonly inspectedCells = new Set<number>();
  private selectedDrug: string | null = null;
  private selectedStrength: string | null = null;
  private selectedPosologyId: string | null = null;
  private result: HandwritingEvaluationResult | null = null;

  constructor(
    scenario: PrescriptionScenario,
    difficultyMultiplier = 1.0,
    hasUvUpgrade = false
  ) {
    this.scenario = scenario;
    this.hasUvUpgrade = hasUvUpgrade;
    this.effectiveMessiness = Math.min(
      0.95,
      scenario.messinessBase * Math.max(0.85, Math.min(1.25, difficultyMultiplier))
    );
    // Mark initial center cell inspected
    this.moveLoupe(this.loupeX, this.loupeY);
  }

  public moveLoupe(virtualX: number, virtualY: number): void {
    this.loupeX = Math.max(70, Math.min(VIRTUAL_CANVAS_WIDTH - 70, virtualX));
    this.loupeY = Math.max(65, Math.min(VIRTUAL_CANVAS_HEIGHT - 65, virtualY));

    // Prescription handwriting zone spans x in [160..640], y in [180..310]
    if (this.loupeX >= 140 && this.loupeX <= 660 && this.loupeY >= 145 && this.loupeY <= 345) {
      const bucket = Math.floor((this.loupeX - 140) / 52);
      this.inspectedCells.add(Math.max(0, Math.min(9, bucket)));
      if (this.hasUvUpgrade) {
        this.inspectedCells.add(Math.max(0, Math.min(9, bucket + 1)));
      }
    }
  }

  public getLoupePosition(): { x: number; y: number } {
    return { x: this.loupeX, y: this.loupeY };
  }

  public toggleUvFilter(forceState?: boolean): boolean {
    this.uvActive = typeof forceState === 'boolean' ? forceState : !this.uvActive;
    return this.uvActive;
  }

  public isUvActive(): boolean {
    return this.uvActive;
  }

  public getInspectedRatio(): number {
    return Math.min(1, this.inspectedCells.size / 6);
  }

  public selectDrug(drug: string): void {
    if (this.result) return;
    this.selectedDrug = drug;
  }

  public getSelectedDrug(): string | null {
    return this.selectedDrug;
  }

  public selectStrength(strength: string): void {
    if (this.result) return;
    this.selectedStrength = strength;
  }

  public getSelectedStrength(): string | null {
    return this.selectedStrength;
  }

  public selectPosology(posologyId: string): void {
    if (this.result) return;
    this.selectedPosologyId = posologyId;
  }

  public getSelectedPosology(): string | null {
    return this.selectedPosologyId;
  }

  public getResult(): HandwritingEvaluationResult | null {
    return this.result;
  }

  public submitVerification(locale: Locale): HandwritingEvaluationResult {
    if (this.result) return this.result;

    const drugCorrect = this.selectedDrug === this.scenario.correctDrug;
    const strengthCorrect = this.selectedStrength === this.scenario.correctStrength;
    const posologyCorrect = this.selectedPosologyId === this.scenario.correctPosologyId;
    const inspectedRatio = this.getInspectedRatio();

    let score = 0;
    if (drugCorrect) score += 45;
    if (strengthCorrect) score += 25;
    if (posologyCorrect) score += 20;
    if (drugCorrect && strengthCorrect && posologyCorrect) {
      score += Math.round(inspectedRatio * 10);
    }

    const passed = drugCorrect && strengthCorrect && posologyCorrect;
    const posObj = this.scenario.posologyOptions.find(
      (p) => p.id === this.scenario.correctPosologyId
    );
    const posLabel = posObj ? t(posObj.label, locale) : this.scenario.correctPosologyId;

    const feedback = passed
      ? locale === 'es'
        ? `¡Receta descifrada correctamente! ${this.scenario.correctDrug} ${this.scenario.correctStrength} (${posLabel}).`
        : `Prescription decoded accurately! ${this.scenario.correctDrug} ${this.scenario.correctStrength} (${posLabel}).`
      : locale === 'es'
        ? `Lectura incorrecta. La receta prescribía: ${this.scenario.correctDrug} • ${this.scenario.correctStrength} • ${posLabel}.`
        : `Incorrect decoding. The script prescribed: ${this.scenario.correctDrug} • ${this.scenario.correctStrength} • ${posLabel}.`;

    this.result = {
      passed,
      score: Math.min(100, score),
      drugCorrect,
      strengthCorrect,
      posologyCorrect,
      inspectedRatio,
      feedback,
    };
    return this.result;
  }

  public renderCanvas(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const W = VIRTUAL_CANVAS_WIDTH;
    const H = VIRTUAL_CANVAS_HEIGHT;
    ctx.save();

    // 1. Dark olive-wood desk surface
    ctx.fillStyle = '#3B281A';
    ctx.fillRect(0, 0, W, H);

    // 2. Prescription Paper Sheet (Servicio Andaluz de Salud style)
    const paperX = 85;
    const paperY = 34;
    const paperW = 630;
    const paperH = 432;

    ctx.fillStyle = this.uvActive ? '#EBF3FF' : '#FCF9F0';
    ctx.beginPath();
    ctx.roundRect(paperX, paperY, paperW, paperH, 8);
    ctx.fill();
    ctx.strokeStyle = this.uvActive ? '#4A90E2' : '#C9B99B';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Green Andalusian Health Service header stripe
    ctx.fillStyle = '#007A33';
    ctx.fillRect(paperX + 18, paperY + 16, paperW - 36, 38);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      'JUNTA DE ANDALUCÍA • RECETA MÉDICA OFICIAL — FARMACIA GALLEGO',
      paperX + 30,
      paperY + 40
    );

    // Doctor & Patient metadata header
    ctx.fillStyle = '#2B3A42';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(this.scenario.doctorName, paperX + 26, paperY + 76);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#546E7A';
    ctx.fillText(t(this.scenario.clinicSpecialty, locale), paperX + 26, paperY + 94);

    ctx.fillStyle = '#1D4E89';
    ctx.font = 'bold 13px sans-serif';
    const ageLabel = locale === 'es' ? 'años' : 'yrs';
    ctx.fillText(
      `${locale === 'es' ? 'Paciente' : 'Patient'}: ${this.scenario.patientName} (${this.scenario.patientAge} ${ageLabel})`,
      paperX + 26,
      paperY + 120
    );
    ctx.font = '12.5px sans-serif';
    ctx.fillStyle = '#37474F';
    ctx.fillText(t(this.scenario.patientContext, locale), paperX + 26, paperY + 140);

    // Coffee ring stain on right side of paper
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.22)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(paperX + 515, paperY + 115, 36, 0.2, Math.PI * 1.85);
    ctx.stroke();

    // 3. Prescription Handwriting Box (Unmagnified Messy Scrawl)
    const rxBoxX = paperX + 26;
    const rxBoxY = paperY + 158;
    const rxBoxW = paperW - 52;
    const rxBoxH = 165;

    ctx.fillStyle = this.uvActive ? '#DFEFFF' : '#F7F1E1';
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 1.5;
    ctx.fillRect(rxBoxX, rxBoxY, rxBoxW, rxBoxH);
    ctx.strokeRect(rxBoxX, rxBoxY, rxBoxW, rxBoxH);

    // Draw Doctor's messy cursive waveform + skewed text
    ctx.save();
    ctx.translate(rxBoxX + 28, rxBoxY + 76);
    ctx.rotate(-0.045 * this.effectiveMessiness);
    ctx.fillStyle = 'rgba(22, 42, 92, 0.55)';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText(this.scenario.handwritingText, 0, 0);

    // Procedural fountain-pen loops and doctor seismograph squiggles over text
    ctx.strokeStyle = 'rgba(18, 35, 82, 0.72)';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    const waveLen = 470;
    for (let x = 0; x <= waveLen; x += 6) {
      const jitter =
        Math.sin(x * 0.19) * 14 * this.effectiveMessiness +
        Math.cos(x * 0.07) * 9 * this.effectiveMessiness;
      if (x === 0) ctx.moveTo(x, jitter - 8);
      else ctx.lineTo(x, jitter - 8);
    }
    ctx.stroke();
    ctx.restore();

    // Tilted Doctor Rubber Stamp
    ctx.save();
    ctx.translate(rxBoxX + 430, rxBoxY + 125);
    ctx.rotate(-0.18);
    ctx.strokeStyle = 'rgba(180, 40, 45, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-70, -22, 140, 44);
    ctx.fillStyle = 'rgba(180, 40, 45, 0.6)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('COLEGIADO SAS', 0, -4);
    ctx.fillText('FIRMA Y SELLO', 0, 12);
    ctx.restore();

    // 4. Footer Inspection Progress Bar
    const ratio = this.getInspectedRatio();
    ctx.fillStyle = '#263238';
    ctx.font = 'bold 12.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      locale === 'es'
        ? `Claridad de Inspección con Lupa: ${Math.round(ratio * 100)}%`
        : `Loupe Inspection Clarity: ${Math.round(ratio * 100)}%`,
      rxBoxX,
      paperY + 356
    );
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(rxBoxX, paperY + 366, 260, 10);
    ctx.fillStyle = '#00C853';
    ctx.fillRect(rxBoxX, paperY + 366, 260 * ratio, 10);

    if (this.uvActive || this.hasUvUpgrade || ratio >= 0.5) {
      ctx.fillStyle = '#1D4E89';
      ctx.font = 'bold 12.5px sans-serif';
      ctx.fillText(
        `🔎 ${t(this.scenario.watermarkHint, locale)}`,
        rxBoxX,
        paperY + 402
      );
    }

    // 5. Interactive Magnifying Loupe Lens (clarifies doctor handwriting under the lens!)
    const radius = this.hasUvUpgrade ? 78 : 64;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.loupeX, this.loupeY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Bright clarified background inside the lens
    ctx.fillStyle = this.uvActive ? '#D6ECFF' : '#FFFDF7';
    ctx.fillRect(this.loupeX - radius, this.loupeY - radius, radius * 2, radius * 2);

    // Crisp magnified text inside the loupe
    ctx.fillStyle = '#0B1F4D';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.scenario.handwritingText, W / 2, rxBoxY + 76);

    ctx.fillStyle = '#00695C';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(t(this.scenario.watermarkHint, locale), W / 2, rxBoxY + 112);
    ctx.restore();

    // Brass / UV Loupe Rim & Handle
    ctx.strokeStyle = this.uvActive ? '#00B0FF' : '#D4AF37';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(this.loupeX, this.loupeY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(this.loupeX + radius * 0.7, this.loupeY + radius * 0.7);
    ctx.lineTo(this.loupeX + radius * 1.25, this.loupeY + radius * 1.25);
    ctx.stroke();

    ctx.restore();
  }
}
