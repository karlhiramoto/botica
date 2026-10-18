import type { LanguagePreference, Locale, LocalizedText } from '../types';

/**
 * Detects the preferred game locale ('es' or 'en') from browser navigator languages.
 * Defaults to 'es' if Spanish is preferred or if neither Spanish nor English is listed first;
 * returns 'en' when an English locale appears before Spanish.
 */
export function detectBrowserLocale(
  browserLanguages?: readonly string[] | null,
  fallbackLanguage?: string | null
): Locale {
  const candidates: string[] = [];
  if (Array.isArray(browserLanguages) && browserLanguages.length > 0) {
    candidates.push(...browserLanguages);
  } else if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      candidates.push(...navigator.languages);
    } else if (typeof navigator.language === 'string' && navigator.language.length > 0) {
      candidates.push(navigator.language);
    }
  }
  if (typeof fallbackLanguage === 'string' && fallbackLanguage.length > 0) {
    candidates.push(fallbackLanguage);
  }

  for (const raw of candidates) {
    const normalized = raw.trim().toLowerCase();
    const primary = normalized.split(/[-_]/)[0];
    if (primary === 'es') {
      return 'es';
    }
    if (primary === 'en') {
      return 'en';
    }
  }

  return 'en';
}

/**
 * Resolves the active locale given a user's saved LanguagePreference ('auto' | 'es' | 'en').
 */
export function resolveActiveLocale(
  preference: LanguagePreference,
  browserLanguages?: readonly string[] | null
): Locale {
  if (preference === 'es' || preference === 'en') {
    return preference;
  }
  return detectBrowserLocale(browserLanguages);
}

/**
 * Picks the localized text for the active locale.
 */
export function t(text: LocalizedText, locale: Locale): string {
  return locale === 'es' ? text.es : text.en;
}

/**
 * Locale-aware number/currency/unit formatters using standard Web Intl APIs.
 */
function intlTag(locale: Locale): string {
  return locale === 'es' ? 'es-ES' : 'en-US';
}

export function formatCurrencyEur(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMassGrams(grams: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'unit',
    unit: 'gram',
    unitDisplay: 'short',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(grams);
}

export function formatVolumeMl(ml: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'unit',
    unit: 'milliliter',
    unitDisplay: 'short',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ml);
}

export function formatTempC(celsius: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'unit',
    unit: 'celsius',
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(celsius);
}

export function formatPercent(ratioZeroToOne: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(ratioZeroToOne);
}

export const UI_STRINGS = {
  brandTitle: {
    es: 'Farmacia Gallego: Botica de Guardia',
    en: 'Farmacia Gallego: On-Call Pharmacy',
  },
  brandSubtitle: {
    es: 'Andalucía • Salud, Tradición y Fórmulas Magistrales',
    en: 'Andalusia • Health, Tradition & Magistral Compounding',
  },
  navCampaign: {
    es: 'Turnos (Campaña)',
    en: 'Shifts (Campaign)',
  },
  navArcade: {
    es: 'Práctica Libre',
    en: 'Free-Play Arcade',
  },
  navShop: {
    es: 'Mejoras de Botica',
    en: 'Pharmacy Upgrades',
  },
  navVademecum: {
    es: 'Vademécum',
    en: 'Vademecum Guide',
  },
  langLabel: {
    es: 'Idioma',
    en: 'Language',
  },
  langAuto: {
    es: 'Auto',
    en: 'Auto',
  },
  hudReputation: {
    es: 'Prestigio',
    en: 'Reputation',
  },
  hudFunds: {
    es: 'Caja',
    en: 'Funds',
  },
  hudShiftTask: {
    es: 'Tarea',
    en: 'Task',
  },
  hudTimer: {
    es: 'Tiempo',
    en: 'Time',
  },
  soundOn: {
    es: 'Sonido: Sí',
    en: 'Audio: On',
  },
  soundOff: {
    es: 'Sonido: No',
    en: 'Audio: Muted',
  },
  resetProgressBtn: {
    es: 'Reiniciar Partida',
    en: 'Reset Save Data',
  },
  resetConfirmPrompt: {
    es: '¿Seguro que quieres borrar el progreso guardado en este navegador?',
    en: 'Are you sure you want to reset your saved progress in this browser?',
  },
  confirmYes: {
    es: 'Sí, reiniciar',
    en: 'Yes, Reset',
  },
  confirmCancel: {
    es: 'Cancelar',
    en: 'Cancel',
  },
  startShiftBtn: {
    es: 'Iniciar Turno',
    en: 'Start Shift',
  },
  replayShiftBtn: {
    es: 'Repetir Turno',
    en: 'Replay Shift',
  },
  lockedShiftBtn: {
    es: 'Turno Bloqueado',
    en: 'Shift Locked',
  },
  nextLevelBtn: {
    es: 'Siguiente Turno',
    en: 'Next Shift',
  },
  backToHubBtn: {
    es: 'Volver al Mostrador',
    en: 'Back to Pharmacy Hub',
  },
  buyUpgradeBtn: {
    es: 'Adquirir Mejora',
    en: 'Purchase Upgrade',
  },
  ownedUpgradeBadge: {
    es: 'Instalado en Botica',
    en: 'Installed in Pharmacy',
  },
  insufficientFundsBtn: {
    es: 'Saldo Insuficiente',
    en: 'Insufficient Euros',
  },
  miniGameNames: {
    triage: {
      es: '1. Mostrador: Triaje y Consejo',
      en: '1. Counter: Symptom Triage & Advice',
    },
    handwriting: {
      es: '2. Receta Médica Ilegible',
      en: '2. Doctor Handwriting Decoder',
    },
    compounding: {
      es: '3. Rebotica: Fórmula Magistral',
      en: '3. Backroom Lab: Compounding',
    },
    precinto: {
      es: '4. Corte de Cupón Precinto',
      en: '4. Box-Cutter Barcode & Co-Pay',
    },
    coldchain: {
      es: '5. Cajonera y Cadena de Frío',
      en: '5. Apothecary Drawers & Cold Chain',
    },
  },
  triage: {
    askHeader: {
      es: '1. Preguntas de Anamnesis (Pulsa para interrogar al paciente)',
      en: '1. Clinical Questions (Tap to ask patient)',
    },
    qFever: {
      es: '🌡️ ¿Fiebre?',
      en: '🌡️ Fever?',
    },
    qAllergies: {
      es: '⚠️ ¿Alergias?',
      en: '⚠️ Allergies?',
    },
    qMedsPregnancy: {
      es: '💊 ¿Medicación / Embarazo?',
      en: '💊 Other Meds / Pregnancy?',
    },
    qDuration: {
      es: '⏳ ¿Desde cuándo?',
      en: '⏳ How long?',
    },
    remedyHeader: {
      es: '2. Seleccionar Tratamiento o Derivación a Urgencias',
      en: '2. Select Remedy or Emergency Referral',
    },
    counselingHeader: {
      es: '3. Consejo Farmacéutico Obligatorio',
      en: '3. Mandatory Pharmacist Counseling',
    },
    dispenseSubmitBtn: {
      es: 'Dispensar y Aconsejar en Mostrador',
      en: 'Dispense & Advise Customer',
    },
    counselingOptions: {
      take_with_food: {
        es: 'Tomar tras las comidas para proteger el estómago',
        en: 'Take with food to protect gastric mucosa',
      },
      hydrate_shade: {
        es: 'Beber agua/suero a sorbos y evitar el sol directo',
        en: 'Sip fluids/ORS frequently and stay out of direct sun',
      },
      avoid_drowsiness_driving: {
        es: 'Tomar una vez al día; precaución si aparece somnolencia',
        en: 'Take once daily; use caution if drowsy',
      },
      clean_dry_skin: {
        es: 'Aplicar sobre piel limpia y seca sin reventar ampollas',
        en: 'Apply on clean dry skin; never pop blisters',
      },
      emergency_hospital_now: {
        es: 'Signo de alarma: acudir de inmediato a Urgencias / 112',
        en: 'Red-flag symptom: go immediately to Emergency Care / 112',
      },
    },
  },
  handwriting: {
    instructions: {
      es: 'Desliza el dedo o ratón sobre la receta para usar la lupa y descifrar la letra del médico.',
      en: 'Drag your finger or mouse across the prescription to inspect strokes with the magnifying loupe.',
    },
    uvToggleBtn: {
      es: '🔬 Filtro Tinta / UV',
      en: '🔬 Ink Contrast / UV Filter',
    },
    drugHeader: {
      es: '1. Principio Activo / Medicamento',
      en: '1. Active Medication',
    },
    strengthHeader: {
      es: '2. Dosis / Concentración',
      en: '2. Dosage Strength',
    },
    posologyHeader: {
      es: '3. Pauta Posológica',
      en: '3. Dosing Frequency (Posology)',
    },
    verifyBtn: {
      es: 'Validar y Dispensar Receta',
      en: 'Verify & Dispense Prescription',
    },
  },
  compounding: {
    stepWeigh: {
      es: 'Paso 1/4: Pesar principio activo en la balanza analítica',
      en: 'Step 1/4: Weigh active powder on the analytical balance',
    },
    stepGrind: {
      es: 'Paso 2/4: Pulverizar y homogeneizar en mortero de porcelana',
      en: 'Step 2/4: Grind & homogenize in the porcelain mortar',
    },
    stepMeasure: {
      es: 'Paso 3/4: Enrasar menisco en la probeta graduada',
      en: 'Step 3/4: Measure liquid meniscus in the graduated cylinder',
    },
    stepHeat: {
      es: 'Paso 4/4: Emulsionar al Baño María en el rango térmico',
      en: 'Step 4/4: Emulsify in the Water Bath within target temperature',
    },
    pourSmallBtn: {
      es: '+0,25 g Espátula',
      en: '+0.25 g Spatula Scoop',
    },
    pourMicroBtn: {
      es: '+0,05 g Pizca Fina',
      en: '+0.05 g Micro Pinch',
    },
    removePinchBtn: {
      es: '-0,10 g Retirar Exceso',
      en: '-0.10 g Remove Excess',
    },
    lockWeightBtn: {
      es: 'Confirmar Pesada',
      en: 'Confirm Weight',
    },
    grindStrokeBtn: {
      es: '🥣 Giro de Mano de Mortero (o gira en el lienzo)',
      en: '🥣 Swirl Pestle Stroke (or swirl on canvas)',
    },
    addDropBtn: {
      es: '💧 +1,0 ml Pipeta',
      en: '💧 +1.0 ml Pipette',
    },
    addMicroDropBtn: {
      es: '💧 +0,2 ml Gota Fina',
      en: '💧 +0.2 ml Fine Drop',
    },
    drainDropBtn: {
      es: '➖ -0,5 ml Purgar',
      en: '➖ -0.5 ml Drain',
    },
    lockVolumeBtn: {
      es: 'Confirmar Menisco',
      en: 'Confirm Meniscus Volume',
    },
    heatBurnerOnBtn: {
      es: '🔥 Subir Fuego Baño María (+Calor y Agitar)',
      en: '🔥 Pulse Burner Heat (+Heat & Stir)',
    },
    heatCoolStirBtn: {
      es: '❄️ Agitar sin Fuego (Enfriar y Emulsionar)',
      en: '❄️ Stir Off-Heat (Cool & Emulsify)',
    },
  },
  precinto: {
    instructions: {
      es: '1) Desliza el cúter por la línea de puntos del cupón precinto. 2) Sella la hoja. 3) Elige la aportación.',
      en: '1) Drag the box-cutter along the dotted barcode line. 2) Stamp the slip. 3) Select patient co-pay.',
    },
    autoSliceBtn: {
      es: '✂️ Corte Guiado Paso a Paso',
      en: '✂️ Guided Step Cut',
    },
    stampBtn: {
      es: '💮 Estampar Sello Farmacia Gallego',
      en: '💮 Stamp Farmacia Gallego Seal',
    },
    copayHeader: {
      es: 'Régimen de Aportación (Tarjeta Sanitaria Andaluza)',
      en: 'Patient Co-Pay Tier (Andalusian Health Card)',
    },
    copayPensionista: {
      es: 'Pensionista (10%)',
      en: 'Pensioner (10% Co-Pay)',
    },
    copayActivo: {
      es: 'Activo (40%)',
      en: 'Active Worker (40% Co-Pay)',
    },
    copaySinReceta: {
      es: 'Sin Financiación (100%)',
      en: 'Unsubsidized / Private (100%)',
    },
    finishPrecintoBtn: {
      es: 'Cobrar y Entregar Medicamento',
      en: 'Charge Co-Pay & Hand Over Box',
    },
  },
  coldchain: {
    instructions: {
      es: '¡Prioriza las vacunas e insulinas (❄️) antes de que se rompa la cadena de frío! Toca una caja y luego su destino (o arrástrala).',
      en: 'Prioritize vaccines & insulins (❄️) before the Andalusian heat breaks the cold chain! Tap a box then tap its destination (or drag it).',
    },
    destFridge: {
      es: '❄️ Nevera (2°C–8°C)',
      en: '❄️ Fridge (2°C–8°C)',
    },
    destSafe: {
      es: '🔒 Caja Fuerte Estupefacientes',
      en: '🔒 Narcotics Safe',
    },
    destDrawerAM: {
      es: '🗄️ Cajonera A–M',
      en: '🗄️ Drawer A–M',
    },
    destDrawerNZ: {
      es: '🗄️ Cajonera N–Z',
      en: '🗄️ Drawer N–Z',
    },
    destSigre: {
      es: '♻️ Punto SIGRE (Caducados)',
      en: '♻️ Punto SIGRE (Expired)',
    },
  },
} as const;
