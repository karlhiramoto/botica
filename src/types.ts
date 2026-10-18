export type Locale = 'es' | 'en';
export type LanguagePreference = 'auto' | 'es' | 'en';

export interface LocalizedText {
  es: string;
  en: string;
}

export type ViewportMode = 'mobile-portrait' | 'mobile-landscape' | 'desktop';

export type MiniGameType =
  | 'triage'
  | 'handwriting'
  | 'compounding'
  | 'precinto'
  | 'coldchain';

export type UpgradeId =
  | 'uv_loupe'
  | 'digital_scale'
  | 'laser_cutter'
  | 'climate_control'
  | 'espresso_bar';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: LocalizedText;
  description: LocalizedText;
  costEur: number;
  icon: string;
}

export type TriageQuestionKey = 'fever' | 'allergies' | 'meds_pregnancy' | 'duration';

export type TriageRemedyId =
  | 'paracetamol_650'
  | 'ibuprofeno_400'
  | 'omeprazol_20'
  | 'loratadina_10'
  | 'suero_oral'
  | 'calamina_locion'
  | 'aposito_hidrocoloide'
  | 'colirio_hialuronico'
  | 'refer_urgencias';

export type TriageCounselingId =
  | 'take_with_food'
  | 'hydrate_shade'
  | 'avoid_drowsiness_driving'
  | 'clean_dry_skin'
  | 'emergency_hospital_now';

export interface VademecumEntry {
  id: TriageRemedyId;
  name: LocalizedText;
  activeIngredient: LocalizedText;
  indication: LocalizedText;
  contraindication: LocalizedText;
  recommendedCounseling: TriageCounselingId;
}

export interface TriageScenario {
  id: string;
  customerName: string;
  customerRole: LocalizedText;
  avatarColor: string;
  symptomVisual: 'sunburn' | 'fever_sweat' | 'pollen_sneeze' | 'stomach_ache' | 'blister_limp' | 'chest_alert';
  openingComplaint: LocalizedText;
  answers: Record<TriageQuestionKey, LocalizedText>;
  correctRemedyId: TriageRemedyId;
  correctCounselingId: TriageCounselingId;
  isRedFlagEmergency: boolean;
  clinicalExplanation: LocalizedText;
}

export interface PrescriptionScenario {
  id: string;
  doctorName: string;
  clinicSpecialty: LocalizedText;
  patientName: string;
  patientAge: number;
  patientContext: LocalizedText;
  handwritingText: string;
  watermarkHint: LocalizedText;
  correctDrug: string;
  drugOptions: string[];
  correctStrength: string;
  strengthOptions: string[];
  correctPosologyId: string;
  posologyOptions: Array<{
    id: string;
    label: LocalizedText;
  }>;
  messinessBase: number; // 0.15 to 0.92
}

export interface CompoundingRecipe {
  id: string;
  name: LocalizedText;
  patientIndication: LocalizedText;
  powderName: LocalizedText;
  targetMassGrams: number;
  massToleranceGrams: number;
  targetGrindRpm: number;
  grindDurationSec: number;
  liquidName: LocalizedText;
  targetLiquidMl: number;
  liquidToleranceMl: number;
  targetBathTempC: number;
  bathTempToleranceC: number;
  holdTempDurationSec: number;
  pigmentColor: string;
}

export type CopayTier = 'pensionista_10' | 'activo_40' | 'sin_receta_100';

export interface PrecintoOrder {
  id: string;
  medicationBoxTitle: string;
  activePrinciple: LocalizedText;
  retailPriceEur: number;
  patientRegimeLabel: LocalizedText;
  correctCopayTier: CopayTier;
  expectedCopayEur: number;
  cutMarginPx: number;
  boxColor: string;
}

export type StorageDestination =
  | 'fridge_cold'
  | 'safe_estupefacientes'
  | 'drawer_a_m'
  | 'drawer_n_z'
  | 'sigre_expired';

export interface ColdChainItemSpec {
  id: string;
  name: string;
  subtitle: LocalizedText;
  requiresColdChain: boolean;
  isNarcoticSafe: boolean;
  isExpired: boolean;
  correctDestination: StorageDestination;
  initialTempC: number;
  maxSafeTempC: number;
}

export interface ColdChainWave {
  id: string;
  title: LocalizedText;
  ambientTempC: number;
  items: ColdChainItemSpec[];
}

export interface CampaignTask {
  type: MiniGameType;
  scenarioId: string;
}

export interface CampaignLevel {
  levelNumber: number;
  title: LocalizedText;
  locationSubtitle: LocalizedText;
  seasonalEvent: LocalizedText;
  ambientTempC: number;
  shiftTimeLabel: string;
  timeLimitSec: number;
  difficultyMultiplier: number;
  rewardEur: number;
  tasks: CampaignTask[];
  briefing: LocalizedText;
}

export interface LevelProgress {
  completed: boolean;
  stars: number; // 0..3
  bestScore: number;
}

export interface SaveState {
  version: 1;
  languagePreference: LanguagePreference;
  unlockedLevel: number;
  euros: number;
  reputation: number; // 0..100
  upgrades: UpgradeId[];
  levelProgress: Record<number, LevelProgress>;
  soundMuted: boolean;
  totalPatientsServed: number;
}
