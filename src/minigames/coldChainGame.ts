import { formatTempC, t } from '../i18n/i18n';
import type { ColdChainWave, Locale, StorageDestination } from '../types';
import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '../ui/viewport';

export interface LiveDeliveryItem {
  id: string;
  name: string;
  subtitle: { es: string; en: string };
  requiresColdChain: boolean;
  isNarcoticSafe: boolean;
  isExpired: boolean;
  correctDestination: StorageDestination;
  currentTempC: number;
  maxSafeTempC: number;
  routedDestination: StorageDestination | null;
  spoiledByHeat: boolean;
}

export interface ColdChainEvaluationResult {
  passed: boolean;
  score: number;
  correctCount: number;
  totalCount: number;
  spoiledCount: number;
  feedback: string;
}

export class ColdChainMiniGame {
  public readonly wave: ColdChainWave;
  public readonly items: LiveDeliveryItem[];
  public readonly hasClimateUpgrade: boolean;
  public readonly difficultyMultiplier: number;

  private selectedItemId: string | null = null;
  private result: ColdChainEvaluationResult | null = null;

  constructor(
    wave: ColdChainWave,
    difficultyMultiplier = 1.0,
    hasClimateUpgrade = false
  ) {
    this.wave = wave;
    this.difficultyMultiplier = Math.max(0.85, difficultyMultiplier);
    this.hasClimateUpgrade = hasClimateUpgrade;

    this.items = wave.items.map((spec) => ({
      id: spec.id,
      name: spec.name,
      subtitle: spec.subtitle,
      requiresColdChain: spec.requiresColdChain,
      isNarcoticSafe: spec.isNarcoticSafe,
      isExpired: spec.isExpired,
      correctDestination: spec.correctDestination,
      currentTempC: spec.initialTempC,
      maxSafeTempC: spec.maxSafeTempC,
      routedDestination: null,
      spoiledByHeat: false,
    }));

    const firstUnrouted = this.items.find((i) => i.routedDestination === null);
    this.selectedItemId = firstUnrouted ? firstUnrouted.id : null;
  }

  public getSelectedItemId(): string | null {
    return this.selectedItemId;
  }

  public selectItem(itemId: string): void {
    const found = this.items.find((i) => i.id === itemId && i.routedDestination === null);
    if (found) {
      this.selectedItemId = found.id;
    }
  }

  public step(dtSec: number): void {
    if (this.result) return;
    const climateFactor = this.hasClimateUpgrade ? 0.65 : 1.0;
    const heatRate = 0.065 * this.difficultyMultiplier * climateFactor;

    for (const item of this.items) {
      if (item.routedDestination !== null) continue;
      if (item.requiresColdChain) {
        item.currentTempC = Math.min(
          this.wave.ambientTempC,
          item.currentTempC + heatRate * dtSec
        );
        if (item.currentTempC > item.maxSafeTempC) {
          item.spoiledByHeat = true;
        }
      }
    }
  }

  public routeItem(
    itemId: string,
    destination: StorageDestination,
    locale: Locale = 'es'
  ): boolean {
    if (this.result) return false;
    const item = this.items.find((i) => i.id === itemId);
    if (!item || item.routedDestination !== null) return false;

    item.routedDestination = destination;

    const nextPending = this.items.find((i) => i.routedDestination === null);
    this.selectedItemId = nextPending ? nextPending.id : null;

    if (!nextPending) {
      this.evaluateWave(locale);
    }
    return item.correctDestination === destination && !item.spoiledByHeat;
  }

  public routeSelectedItem(
    destination: StorageDestination,
    locale: Locale = 'es'
  ): boolean {
    if (!this.selectedItemId) return false;
    return this.routeItem(this.selectedItemId, destination, locale);
  }

  public handleCanvasTap(virtualX: number, virtualY: number, locale: Locale): void {
    if (this.result) return;

    // 1. Check if player tapped one of the 5 destination zones along top half (y in [82..220])
    const zones: Array<{ dest: StorageDestination; x: number; w: number }> = [
      { dest: 'fridge_cold', x: 24, w: 144 },
      { dest: 'safe_estupefacientes', x: 178, w: 144 },
      { dest: 'drawer_a_m', x: 332, w: 144 },
      { dest: 'drawer_n_z', x: 486, w: 144 },
      { dest: 'sigre_expired', x: 640, w: 136 },
    ];

    if (virtualY >= 78 && virtualY <= 228) {
      for (const z of zones) {
        if (virtualX >= z.x && virtualX <= z.x + z.w) {
          this.routeSelectedItem(z.dest, locale);
          return;
        }
      }
    }

    // 2. Check if player tapped an unrouted item card in the bottom crate area (y >= 250)
    const unrouted = this.items.filter((i) => i.routedDestination === null);
    unrouted.forEach((item, idx) => {
      const cardY = 262 + idx * 44;
      if (virtualY >= cardY && virtualY <= cardY + 38 && virtualX >= 32 && virtualX <= 768) {
        this.selectedItemId = item.id;
      }
    });
  }

  public getResult(): ColdChainEvaluationResult | null {
    return this.result;
  }

  public evaluateWave(locale: Locale): ColdChainEvaluationResult {
    if (this.result) return this.result;

    let correctCount = 0;
    let spoiledCount = 0;
    for (const item of this.items) {
      if (item.spoiledByHeat) {
        spoiledCount++;
      }
      if (item.routedDestination === item.correctDestination && !item.spoiledByHeat) {
        correctCount++;
      }
    }

    const total = this.items.length;
    const score = Math.round((correctCount / Math.max(1, total)) * 100);
    const passed = correctCount === total && spoiledCount === 0;

    const feedback = passed
      ? locale === 'es'
        ? `¡Cadena de frío intacta y almacén de Farmacia Gallego perfectamente ordenado (${correctCount}/${total})!`
        : `Cold chain preserved and Farmacia Gallego storeroom sorted (${correctCount}/${total})!`
      : locale === 'es'
        ? `Incidencia en almacén (${correctCount}/${total} correctos, ${spoiledCount} termolábiles dañados por calor).`
        : `Storeroom sorting issue (${correctCount}/${total} correct, ${spoiledCount} cold-chain items overheated).`;

    this.result = {
      passed,
      score,
      correctCount,
      totalCount: total,
      spoiledCount,
      feedback,
    };
    return this.result;
  }

  public renderCanvas(ctx: CanvasRenderingContext2D, locale: Locale): void {
    const W = VIRTUAL_CANVAS_WIDTH;
    const H = VIRTUAL_CANVAS_HEIGHT;
    ctx.save();

    // Storeroom background
    ctx.fillStyle = '#F5EFE6';
    ctx.fillRect(0, 0, W, H);

    // Header bar
    ctx.fillStyle = '#1D4E89';
    ctx.fillRect(24, 16, W - 48, 48);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `❄️ ALMACÉN FARMACIA GALLEGO — ${t(this.wave.title, locale)} (${formatTempC(this.wave.ambientTempC, locale)})`,
      38,
      45
    );

    // 5 Destination Zones along top row
    const zoneSpecs: Array<{
      dest: StorageDestination;
      titleEs: string;
      titleEn: string;
      subEs: string;
      subEn: string;
      color: string;
      x: number;
      w: number;
    }> = [
      {
        dest: 'fridge_cold',
        titleEs: '❄️ Nevera',
        titleEn: '❄️ Fridge',
        subEs: '2 °C – 8 °C',
        subEn: '2 °C – 8 °C',
        color: '#0288D1',
        x: 24,
        w: 144,
      },
      {
        dest: 'safe_estupefacientes',
        titleEs: '🔒 Caja Fuerte',
        titleEn: '🔒 Safe ●',
        subEs: 'Estupefacientes',
        subEn: 'Narcotics',
        color: '#5D4037',
        x: 178,
        w: 144,
      },
      {
        dest: 'drawer_a_m',
        titleEs: '🗄️ Cajonera A–M',
        titleEn: '🗄️ Drawer A–M',
        subEs: 'Alfabético A–M',
        subEn: 'Letters A–M',
        color: '#3B6E4C',
        x: 332,
        w: 144,
      },
      {
        dest: 'drawer_n_z',
        titleEs: '🗄️ Cajonera N–Z',
        titleEn: '🗄️ Drawer N–Z',
        subEs: 'Alfabético N–Z',
        subEn: 'Letters N–Z',
        color: '#2E6B9E',
        x: 486,
        w: 144,
      },
      {
        dest: 'sigre_expired',
        titleEs: '♻️ Punto SIGRE',
        titleEn: '♻️ SIGRE Bin',
        subEs: 'Caducados',
        subEn: 'Expired Meds',
        color: '#689F38',
        x: 640,
        w: 136,
      },
    ];

    for (const z of zoneSpecs) {
      const countHere = this.items.filter((i) => i.routedDestination === z.dest).length;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(z.x, 80, z.w, 138, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, 80, z.w, 34);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(locale === 'es' ? z.titleEs : z.titleEn, z.x + z.w / 2, 102);

      ctx.fillStyle = '#37474F';
      ctx.font = '12px sans-serif';
      ctx.fillText(locale === 'es' ? z.subEs : z.subEn, z.x + z.w / 2, 136);

      ctx.fillStyle = '#1B2631';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${countHere}`, z.x + z.w / 2, 172);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#607D8B';
      ctx.fillText(locale === 'es' ? 'Toca para guardar' : 'Tap to store', z.x + z.w / 2, 202);
    }

    // Delivery Crate Queue
    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 13.5px sans-serif';
    ctx.textAlign = 'left';
    const unrouted = this.items.filter((i) => i.routedDestination === null);
    ctx.fillText(
      locale === 'es'
        ? `Cubeta de Reparto (${unrouted.length} pendientes):`
        : `Delivery Crate (${unrouted.length} remaining):`,
      32,
      248
    );

    unrouted.forEach((item, idx) => {
      const cardY = 260 + idx * 44;
      const isSelected = item.id === this.selectedItemId;

      ctx.fillStyle = isSelected ? '#FFF8E1' : '#FFFFFF';
      ctx.strokeStyle = isSelected ? '#C85A32' : '#B0BEC5';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(32, cardY, 736, 38, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1B2631';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, 48, cardY + 17);

      ctx.font = '11.5px sans-serif';
      ctx.fillStyle = '#546E7A';
      ctx.fillText(t(item.subtitle, locale), 48, cardY + 32);

      if (item.requiresColdChain) {
        const tempStr = formatTempC(item.currentTempC, locale);
        const maxStr = formatTempC(item.maxSafeTempC, locale);
        ctx.fillStyle = item.spoiledByHeat ? '#D32F2F' : '#0277BD';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`❄️ ${tempStr} / max ${maxStr}`, 752, cardY + 24);
      }
    });

    ctx.restore();
  }
}
