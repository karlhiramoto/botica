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

    // Asking at least 2 relevant clinical questions grants full diagnostic bonus
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
    wallGrad.addColorStop(0.68, '#F3E6CE');
    wallGrad.addColorStop(1, '#D8C3A5');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Hand-painted Sevillian Azulejo ceramic tile border along top wall
    const tileSize = 40;
    for (let x = 0; x < W; x += tileSize) {
      ctx.fillStyle = (x / tileSize) % 2 === 0 ? '#1D4E89' : '#E8EEF5';
      ctx.fillRect(x, 0, tileSize, 26);
      ctx.strokeStyle = '#C85A32';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 3, 3, tileSize - 6, 20);
    }

    // 3. Wooden Apothecary Shelves in background
    ctx.fillStyle = '#6E472B';
    ctx.fillRect(36, 46, 250, 175);
    ctx.fillStyle = '#52331D';
    for (let row = 0; row < 3; row++) {
      const sy = 56 + row * 54;
      ctx.fillRect(46, sy, 230, 42);
      // Porcelain apothecary albarelo jars on shelves
      for (let j = 0; j < 5; j++) {
        const jx = 58 + j * 44;
        ctx.fillStyle = '#FAF5E8';
        ctx.fillRect(jx, sy + 8, 24, 30);
        ctx.fillStyle = '#1D4E89';
        ctx.fillRect(jx + 3, sy + 16, 18, 10);
      }
      ctx.fillStyle = '#52331D';
    }

    // 4. Illuminated Green Maltese Cross (Cruz de Farmacia Gallego)
    const crossCx = 695;
    const crossCy = 98;
    const pulse = 0.85 + 0.15 * Math.sin(this.elapsedSec * 3.5);
    ctx.fillStyle = `rgba(0, 200, 83, ${0.18 * pulse})`;
    ctx.beginPath();
    ctx.arc(crossCx, crossCy, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0A2E1A';
    ctx.strokeStyle = '#00C853';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(crossCx - 58, crossCy - 42, 116, 84, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00E676';
    ctx.fillRect(crossCx - 8, crossCy - 30, 16, 24);
    ctx.fillRect(crossCx - 34, crossCy - 18, 68, 14);
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${ambientTempC}°C • GALLEGO`, crossCx, crossCy + 24);

    // 5. Customer Avatar at the Counter
    const custX = 415;
    const custY = 235;
    const bobOffset = Math.sin(this.elapsedSec * 2.4) * 3;

    // Shoulders / torso
    ctx.fillStyle = this.scenario.avatarColor;
    ctx.beginPath();
    ctx.roundRect(custX - 58, custY - 12 + bobOffset, 116, 98, 28);
    ctx.fill();

    // Head
    const isSunburned = this.scenario.symptomVisual === 'sunburn';
    ctx.fillStyle = isSunburned ? '#F2796B' : '#F4C9A4';
    ctx.beginPath();
    ctx.arc(custX, custY - 52 + bobOffset, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4A3222';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Facial expression & visual symptom indicators
    ctx.fillStyle = '#2B1D14';
    ctx.beginPath();
    ctx.arc(custX - 14, custY - 58 + bobOffset, 4, 0, Math.PI * 2);
    ctx.arc(custX + 14, custY - 58 + bobOffset, 4, 0, Math.PI * 2);
    ctx.fill();

    // Concerned mouth arc
    ctx.beginPath();
    ctx.arc(custX, custY - 34 + bobOffset, 10, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    if (this.scenario.symptomVisual === 'pollen_sneeze') {
      // Olive pollen golden particles around nose
      ctx.fillStyle = '#D4AF37';
      for (let i = 0; i < 7; i++) {
        const angle = this.elapsedSec * 1.8 + i * 0.9;
        const px = custX + Math.cos(angle) * 52;
        const py = custY - 50 + Math.sin(angle * 1.3) * 28;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.scenario.symptomVisual === 'chest_alert') {
      // Red warning pulse ring
      ctx.strokeStyle = 'rgba(217, 48, 37, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(custX, custY - 10, 62 + Math.sin(this.elapsedSec * 6) * 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.scenario.symptomVisual === 'fever_sweat') {
      ctx.fillStyle = '#3898EC';
      ctx.beginPath();
      ctx.arc(custX + 26, custY - 68 + bobOffset, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Mahogany Pharmacy Counter Foreground (Mostrador Farmacia Gallego)
    const counterY = 305;
    const woodGrad = ctx.createLinearGradient(0, counterY, 0, H);
    woodGrad.addColorStop(0, '#8B5A2B');
    woodGrad.addColorStop(0.15, '#6B4226');
    woodGrad.addColorStop(1, '#4A2C18');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, counterY, W, H - counterY);

    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, counterY, W, 6);

    // Brass plaque on counter
    ctx.fillStyle = '#F5E1A4';
    ctx.beginPath();
    ctx.roundRect(26, counterY + 20, 235, 48, 6);
    ctx.fill();
    ctx.strokeStyle = '#8C6D1F';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3B2313';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('FARMACIA GALLEGO', 40, counterY + 41);
    ctx.font = '12px sans-serif';
    ctx.fillText(
      locale === 'es' ? 'Mostrador de Atención' : 'Pharmacist Triage Counter',
      40,
      counterY + 58
    );

    // 7. Customer Nameplate & Patience Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(28, 240, 250, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#1D4E89';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#142B47';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(this.scenario.customerName, 40, 260);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#4A607A';
    ctx.fillText(t(this.scenario.customerRole, locale), 40, 278);

    // Patience gauge on counter
    const patLabel = locale === 'es' ? 'Paciencia:' : 'Patience:';
    ctx.fillStyle = '#FAF5E8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(patLabel, 28, counterY + 90);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(102, counterY + 78, 156, 14);
    ctx.fillStyle = this.patience > 45 ? '#2ECC71' : '#E67E22';
    ctx.fillRect(102, counterY + 78, (156 * this.patience) / 100, 14);

    // 8. Dialogue & Revealed Clinical Notes Card on Counter
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.roundRect(285, counterY + 16, 490, 168, 10);
    ctx.fill();
    ctx.strokeStyle = '#C85A32';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#241911';
    ctx.font = 'italic 14px Georgia, serif';
    wrapCanvasText(
      ctx,
      t(this.scenario.openingComplaint, locale),
      302,
      counterY + 38,
      456,
      19
    );

    // Revealed answers list
    const keysOrder: TriageQuestionKey[] = ['fever', 'allergies', 'meds_pregnancy', 'duration'];
    let ansY = counterY + 86;
    ctx.font = '12.5px sans-serif';
    for (const k of keysOrder) {
      if (this.revealedQuestions.has(k)) {
        ctx.fillStyle = '#1D4E89';
        const line = `• ${t(this.scenario.answers[k], locale)}`;
        ctx.fillText(line.slice(0, 74), 302, ansY);
        ansY += 20;
      }
    }

    if (this.selectedRemedyId) {
      const rem = VADEMECUM_ENTRIES.find((r) => r.id === this.selectedRemedyId);
      if (rem) {
        ctx.fillStyle = '#0A5C36';
        ctx.font = 'bold 12.5px sans-serif';
        ctx.fillText(
          `Rx: ${t(rem.name, locale)}`,
          302,
          counterY + 172
        );
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
): void {
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
  }
}
