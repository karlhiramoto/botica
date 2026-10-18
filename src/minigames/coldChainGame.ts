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

    // 1. Check if player tapped one of the 5 destination zones along top half (y in [74..216])
    const zones: Array<{ dest: StorageDestination; x: number; w: number }> = [
      { dest: 'fridge_cold', x: 16, w: 146 },
      { dest: 'safe_estupefacientes', x: 170, w: 146 },
      { dest: 'drawer_a_m', x: 324, w: 146 },
      { dest: 'drawer_n_z', x: 478, w: 146 },
      { dest: 'sigre_expired', x: 632, w: 152 },
    ];

    if (virtualY >= 72 && virtualY <= 220) {
      for (const z of zones) {
        if (virtualX >= z.x && virtualX <= z.x + z.w) {
          this.routeSelectedItem(z.dest, locale);
          return;
        }
      }
    }

    // 2. Check if player tapped an unrouted item card in the bottom crate area (y >= 245)
    const unrouted = this.items.filter((i) => i.routedDestination === null);
    unrouted.forEach((item, idx) => {
      const cardY = 248 + idx * 48;
      if (virtualY >= cardY && virtualY <= cardY + 44 && virtualX >= 20 && virtualX <= 780) {
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
    ctx.fillStyle = '#0D4A29';
    ctx.fillRect(16, 12, W - 32, 52);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 21px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `❄️ ALMACÉN — ${t(this.wave.title, locale)} (${formatTempC(this.wave.ambientTempC, locale)})`,
      30,
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
        subEs: '2–8 °C',
        subEn: '2–8 °C',
        color: '#0288D1',
        x: 16,
        w: 146,
      },
      {
        dest: 'safe_estupefacientes',
        titleEs: '🔒 Caja ●',
        titleEn: '🔒 Safe ●',
        subEs: 'Narcóticos',
        subEn: 'Narcotics',
        color: '#5D4037',
        x: 170,
        w: 146,
      },
      {
        dest: 'drawer_a_m',
        titleEs: '🗄️ A–M',
        titleEn: '🗄️ A–M',
        subEs: 'Cajón A–M',
        subEn: 'Drawer A–M',
        color: '#166938',
        x: 324,
        w: 146,
      },
      {
        dest: 'drawer_n_z',
        titleEs: '🗄️ N–Z',
        titleEn: '🗄️ N–Z',
        subEs: 'Cajón N–Z',
        subEn: 'Drawer N–Z',
        color: '#2E6B9E',
        x: 478,
        w: 146,
      },
      {
        dest: 'sigre_expired',
        titleEs: '♻️ SIGRE',
        titleEn: '♻️ SIGRE',
        subEs: 'Caducados',
        subEn: 'Expired',
        color: '#558B2F',
        x: 632,
        w: 152,
      },
    ];

    for (const z of zoneSpecs) {
      const countHere = this.items.filter((i) => i.routedDestination === z.dest).length;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(z.x, 74, z.w, 134, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, 74, z.w, 38);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 19px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(locale === 'es' ? z.titleEs : z.titleEn, z.x + z.w / 2, 100);

      ctx.fillStyle = '#263238';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(locale === 'es' ? z.subEs : z.subEn, z.x + z.w / 2, 134);

      ctx.fillStyle = '#0D351E';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`${countHere}`, z.x + z.w / 2, 170);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#455A64';
      ctx.fillText(locale === 'es' ? 'Toca aquí' : 'Tap here', z.x + z.w / 2, 198);
    }

    // Delivery Crate Queue
    ctx.fillStyle = '#0D351E';
    ctx.font = 'bold 21px sans-serif';
    ctx.textAlign = 'left';
    const unrouted = this.items.filter((i) => i.routedDestination === null);
    ctx.fillText(
      locale === 'es'
        ? `Cubeta de Reparto (${unrouted.length} pendientes):`
        : `Delivery Crate (${unrouted.length} remaining):`,
      20,
      236
    );

    unrouted.forEach((item, idx) => {
      const cardY = 248 + idx * 48;
      const isSelected = item.id === this.selectedItemId;

      ctx.fillStyle = isSelected ? '#E8F8EC' : '#FFFFFF';
      ctx.strokeStyle = isSelected ? '#146C38' : '#90A4AE';
      ctx.lineWidth = isSelected ? 3.5 : 2;
      ctx.beginPath();
      ctx.roundRect(20, cardY, 760, 43, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#09351C';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, 34, cardY + 28);

      if (item.requiresColdChain) {
        const tempStr = formatTempC(item.currentTempC, locale);
        const maxStr = formatTempC(item.maxSafeTempC, locale);
        ctx.fillStyle = item.spoiledByHeat ? '#D32F2F' : '#0277BD';
        ctx.font = 'bold 19px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`❄️ ${tempStr}/${maxStr}`, 764, cardY + 28);
      } else {
        ctx.font = 'bold 17px sans-serif';
        ctx.fillStyle = '#2E5A40';
        ctx.textAlign = 'right';
        ctx.fillText(t(item.subtitle, locale).slice(0, 32), 764, cardY + 28);
      }
    });

    ctx.restore();
  }
}
