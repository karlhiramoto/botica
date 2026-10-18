import { VADEMECUM_ENTRIES } from '../data/campaignData';
import { t } from '../i18n/i18n';
import type {
  Locale,
  TriageCounselingId,
  TriageQuestionKey,
  TriageRemedyId,
  TriageScenario,
} from '../types';
import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '../ui/viewport';

export interface TriageEvaluationResult {
  passed: boolean;
  score: number; // 0..100
  remedyCorrect: boolean;
  counselingCorrect: boolean;
  questionsAskedCount: number;
  feedback: string;
}

export class TriageMiniGame {
  public readonly scenario: TriageScenario;
  public readonly difficultyMultiplier: number;
  private readonly revealedQuestions = new Set<TriageQuestionKey>();
  private selectedRemedyId: TriageRemedyId | null = null;
  private selectedCounselingId: TriageCounselingId | null = null;
  private patience = 100; // 0..100
  private elapsedSec = 0;
  private result: TriageEvaluationResult | null = null;

  constructor(scenario: TriageScenario, difficultyMultiplier = 1.0) {
    this.scenario = scenario;
    this.difficultyMultiplier = Math.max(0.8, difficultyMultiplier);
  }

  public step(dtSec: number): void {
    if (this.result) return;
    this.elapsedSec += Math.max(0, dtSec);
    const decayPerSec = 0.85 * this.difficultyMultiplier;
    this.patience = Math.max(10, this.patience - decayPerSec * dtSec);
  }

  public askQuestion(key: TriageQuestionKey): string {
    if (!this.revealedQuestions.has(key)) {
      this.revealedQuestions.add(key);
      this.patience = Math.max(15, this.patience - 3.5 * this.difficultyMultiplier);
    }
    return this.scenario.answers[key].es;
  }

  public isQuestionRevealed(key: TriageQuestionKey): boolean {
    return this.revealedQuestions.has(key);
  }

  public getRevealedQuestions(): ReadonlySet<TriageQuestionKey> {
    return this.revealedQuestions;
  }

  public selectRemedy(remedyId: TriageRemedyId): void {
    if (this.result) return;
    this.selectedRemedyId = remedyId;
  }

  public getSelectedRemedy(): TriageRemedyId | null {
    return this.selectedRemedyId;
  }

  public selectCounseling(counselingId: TriageCounselingId): void {
    if (this.result) return;
    this.selectedCounselingId = counselingId;
  }

  public getSelectedCounseling(): TriageCounselingId | null {
    return this.selectedCounselingId;
  }

  public getPatience(): number {
    return this.patience;
  }

  public getResult(): TriageEvaluationResult | null {
    return this.result;
  }

  public submitDecision(locale: Locale): TriageEvaluationResult {
    if (this.result) {
      return this.result;
    }
    const remedyCorrect = this.selectedRemedyId === this.scenario.correctRemedyId;
    const counselingCorrect =
      this.selectedCounselingId === this.scenario.correctCounselingId;
    const askedCount = this.revealedQuestions.size;

    const investigationBonus = askedCount >= 2 ? 15 : askedCount === 1 ? 8 : 0;
    const patienceBonus = Math.round((this.patience / 100) * 15);

    let score = 0;
    if (remedyCorrect) score += 50;
    if (counselingCorrect) score += 20;
    if (remedyCorrect) score += investigationBonus + patienceBonus;
    score = Math.max(0, Math.min(100, score));

    const passed = remedyCorrect && counselingCorrect;
    const explanation = t(this.scenario.clinicalExplanation, locale);

    this.result = {
      passed,
      score,
      remedyCorrect,
      counselingCorrect,
      questionsAskedCount: askedCount,
      feedback: explanation,
    };
    return this.result;
  }

  public renderCanvas(
    ctx: CanvasRenderingContext2D,
    locale: Locale,
    ambientTempC: number
  ): void {
    const W = VIRTUAL_CANVAS_WIDTH;
    const H = VIRTUAL_CANVAS_HEIGHT;
    ctx.save();

    // 1. Sunlit Andalusian limewashed wall background
    const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
    wallGrad.addColorStop(0, '#FDF8EC');
    wallGrad.addColorStop(0.62, '#F3E6CE');
    wallGrad.addColorStop(1, '#D8C3A5');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Hand-painted Sevillian Azulejo ceramic tile border along top wall
    const tileSize = 40;
    for (let x = 0; x < W; x += tileSize) {
      ctx.fillStyle = (x / tileSize) % 2 === 0 ? '#165B38' : '#E8F5E9';
      ctx.fillRect(x, 0, tileSize, 26);
      ctx.strokeStyle = '#C7B641';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 3, 3, tileSize - 6, 20);
    }

    // 3. Wooden Apothecary Shelves in background (left, compact to leave room for large nameplate)
    ctx.fillStyle = '#6E472B';
    ctx.fillRect(20, 32, 196, 114);
    ctx.fillStyle = '#52331D';
    for (let row = 0; row < 2; row++) {
      const sy = 40 + row * 50;
      ctx.fillRect(28, sy, 180, 40);
      for (let j = 0; j < 4; j++) {
        const jx = 38 + j * 42;
        ctx.fillStyle = '#FAF5E8';
        ctx.fillRect(jx, sy + 6, 22, 28);
        ctx.fillStyle = '#165B38';
        ctx.fillRect(jx + 3, sy + 14, 16, 9);
      }
      ctx.fillStyle = '#52331D';
    }

    // 4. Illuminated Green Maltese Cross (Cruz de Farmacia Gallego)
    const crossCx = 682;
    const crossCy = 84;
    const pulse = 0.85 + 0.15 * Math.sin(this.elapsedSec * 3.5);
    ctx.fillStyle = `rgba(0, 200, 83, ${0.22 * pulse})`;
    ctx.beginPath();
    ctx.arc(crossCx, crossCy, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0A2E1A';
    ctx.strokeStyle = '#00C853';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(crossCx - 96, crossCy - 48, 192, 96, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00E676';
    ctx.fillRect(crossCx - 10, crossCy - 38, 20, 28);
    ctx.fillRect(crossCx - 38, crossCy - 25, 76, 15);
    ctx.font = 'bold 23px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${ambientTempC}°C GALLEGO`, crossCx, crossCy + 30);

    // 5. Customer Avatar at the Counter
    const custX = 435;
    const custY = 152;
    const bobOffset = Math.sin(this.elapsedSec * 2.4) * 3;

    // Shoulders / torso
    ctx.fillStyle = this.scenario.avatarColor;
    ctx.beginPath();
    ctx.roundRect(custX - 64, custY - 6 + bobOffset, 128, 86, 28);
    ctx.fill();

    // Head
    const isSunburned = this.scenario.symptomVisual === 'sunburn';
    ctx.fillStyle = isSunburned ? '#F2796B' : '#F4C9A4';
    ctx.beginPath();
    ctx.arc(custX, custY - 44 + bobOffset, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4A3222';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Eyes & Mouth
    ctx.fillStyle = '#2B1D14';
    ctx.beginPath();
    ctx.arc(custX - 14, custY - 50 + bobOffset, 4.5, 0, Math.PI * 2);
    ctx.arc(custX + 14, custY - 50 + bobOffset, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(custX, custY - 25 + bobOffset, 11, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    if (this.scenario.symptomVisual === 'pollen_sneeze') {
      ctx.fillStyle = '#D4AF37';
      for (let i = 0; i < 7; i++) {
        const angle = this.elapsedSec * 1.8 + i * 0.9;
        const px = custX + Math.cos(angle) * 54;
        const py = custY - 42 + Math.sin(angle * 1.3) * 28;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.scenario.symptomVisual === 'chest_alert') {
      ctx.strokeStyle = 'rgba(217, 48, 37, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(custX, custY - 6, 64 + Math.sin(this.elapsedSec * 6) * 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.scenario.symptomVisual === 'fever_sweat') {
      ctx.fillStyle = '#3898EC';
      ctx.beginPath();
      ctx.arc(custX + 26, custY - 60 + bobOffset, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Mahogany Pharmacy Counter Foreground (Mostrador Farmacia Gallego)
    const counterY = 228;
    const woodGrad = ctx.createLinearGradient(0, counterY, 0, H);
    woodGrad.addColorStop(0, '#784B25');
    woodGrad.addColorStop(0.15, '#5C3719');
    woodGrad.addColorStop(1, '#3D230E');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, counterY, W, H - counterY);

    ctx.fillStyle = '#C7B641';
    ctx.fillRect(0, counterY, W, 6);

    // 7. Extra-Large Phone-Readable Customer Name Banner & Patience Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(16, 152, 412, 70, 12);
    ctx.fill();
    ctx.strokeStyle = '#165B38';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.fillStyle = '#09351C';
    ctx.font = 'bold 27px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.scenario.customerName, 30, 184);
    ctx.font = 'bold 21px sans-serif';
    ctx.fillStyle = '#2B543A';
    ctx.fillText(t(this.scenario.customerRole, locale), 30, 211);

    // Patience pill on top right of counter
    ctx.fillStyle = '#092916';
    ctx.beginPath();
    ctx.roundRect(458, 162, 326, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#00C853';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText(
      locale === 'es'
        ? `Paciencia: ${Math.round(this.patience)}%`
        : `Patience: ${Math.round(this.patience)}%`,
      474,
      198
    );
    ctx.fillStyle = '#1B432C';
    ctx.fillRect(674, 178, 94, 24);
    ctx.fillStyle = this.patience > 45 ? '#00E676' : '#FF9800';
    ctx.fillRect(674, 178, (94 * this.patience) / 100, 24);

    // 8. Extra-Large High-Contrast Patient Speech Box on Counter (30px–34px for Phone Screens!)
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.roundRect(14, counterY + 10, W - 28, H - counterY - 20, 14);
    ctx.fill();
    ctx.strokeStyle = '#84B866';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const hasRevealed = this.revealedQuestions.size > 0;
    ctx.fillStyle = '#0F2418';
    ctx.font = hasRevealed ? 'bold 26px Georgia, serif' : 'bold 33px Georgia, serif';
    const complaintLineHeight = hasRevealed ? 33 : 42;
    const complaintStartY = hasRevealed ? counterY + 46 : counterY + 56;

    const nextY = wrapCanvasText(
      ctx,
      t(this.scenario.openingComplaint, locale),
      32,
      complaintStartY,
      W - 64,
      complaintLineHeight
    );

    // Revealed answers in bold 23px text
    const keysOrder: TriageQuestionKey[] = ['fever', 'allergies', 'meds_pregnancy', 'duration'];
    let ansY = Math.max(counterY + 114, nextY + 6);
    ctx.font = 'bold 22px sans-serif';
    for (const k of keysOrder) {
      if (this.revealedQuestions.has(k) && ansY < H - 24) {
        ctx.fillStyle = '#0B572B';
        const line = `✓ ${t(this.scenario.answers[k], locale)}`;
        ansY = wrapCanvasText(ctx, line, 32, ansY, W - 64, 27);
      }
    }

    if (!hasRevealed && !this.selectedRemedyId) {
      ctx.fillStyle = '#166938';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(
        locale === 'es'
          ? '👇 Usa los botones de abajo para interrogar y dispensar'
          : '👇 Use the buttons below to ask questions & dispense',
        32,
        H - 28
      );
    } else if (this.selectedRemedyId) {
      const rem = VADEMECUM_ENTRIES.find((r) => r.id === this.selectedRemedyId);
      if (rem) {
        ctx.fillStyle = '#084724';
        ctx.font = 'bold 23px sans-serif';
        ctx.fillText(`✚ Rx: ${t(rem.name, locale)}`, 32, H - 24);
      }
    }

    ctx.restore();
  }
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currY);
      line = words[n] + ' ';
      currY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currY);
    currY += lineHeight;
  }
  return currY;
}
