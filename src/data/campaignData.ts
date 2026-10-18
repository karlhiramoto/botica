import type {
  CampaignLevel,
  ColdChainWave,
  CompoundingRecipe,
  PrecintoOrder,
  PrescriptionScenario,
  TriageScenario,
  UpgradeDefinition,
  VademecumEntry,
} from '../types';

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'uv_loupe',
    name: {
      es: 'Lupa Óptica con Luz Ultravioleta',
      en: 'UV Optical Magnifying Loupe',
    },
    description: {
      es: 'Amplía el radio de inspección en recetas ilegibles y revela marcas de agua clínicas al instante.',
      en: 'Expands the magnifying loupe radius on illegible prescriptions and reveals clinical watermarks faster.',
    },
    costEur: 80,
    icon: '🔍',
  },
  {
    id: 'digital_scale',
    name: {
      es: 'Balanza Analítica de Rebotica Pro',
      en: 'Pro Backroom Analytical Balance',
    },
    description: {
      es: 'Aumenta el margen de tolerancia en pesadas y probetas de fórmulas magistrales en un +35%.',
      en: 'Widens weighing and meniscus tolerances in backroom lab compounding by +35%.',
    },
    costEur: 110,
    icon: '⚖️',
  },
  {
    id: 'laser_cutter',
    name: {
      es: 'Cúter con Guía Láser para Precintos',
      en: 'Laser-Guided Box Cutter for Barcodes',
    },
    description: {
      es: 'Estabiliza el corte del cupón precinto (+40% margen seguro sin dañar el blíster).',
      en: 'Stabilizes barcode flap slicing (+40% safe cut margin without puncturing the blister foil).',
    },
    costEur: 95,
    icon: '✂️',
  },
  {
    id: 'climate_control',
    name: {
      es: 'Climatización de Almacén Andaluz',
      en: 'Andalusian Storeroom Climate Control',
    },
    description: {
      es: 'Reduce un 35% la velocidad de calentamiento de vacunas e insulinas durante la ola de calor.',
      en: 'Slows down thermal warming of vaccines and insulins by 35% during summer heatwaves.',
    },
    costEur: 130,
    icon: '❄️',
  },
  {
    id: 'espresso_bar',
    name: {
      es: 'Cafetera Express del Barrio',
      en: 'Neighborhood Espresso Machine',
    },
    description: {
      es: 'Un buen café andaluz: añade +15 segundos extra al reloj de cada turno y +15% propinas/recompensa.',
      en: 'Rich Andalusian espresso: adds +15 seconds to every shift timer and +15% Euro shift rewards.',
    },
    costEur: 150,
    icon: '☕',
  },
];

export const VADEMECUM_ENTRIES: readonly VademecumEntry[] = [
  {
    id: 'paracetamol_650',
    name: {
      es: 'Paracetamol Gallego 650 mg',
      en: 'Paracetamol 650 mg Tablets',
    },
    activeIngredient: {
      es: 'Paracetamol (Analgésico / Antipirético)',
      en: 'Acetaminophen / Paracetamol (Analgesic / Antipyretic)',
    },
    indication: {
      es: 'Dolor leve-moderado y fiebre. Seguro en pacientes con úlcera gástrica o gastritis.',
      en: 'Mild-to-moderate pain and fever. Safe choice for patients with gastric ulcers or gastritis.',
    },
    contraindication: {
      es: 'Insuficiencia hepática grave. No superar 3–4 g/día.',
      en: 'Severe hepatic impairment. Do not exceed 3–4 g/day.',
    },
    recommendedCounseling: 'hydrate_shade',
  },
  {
    id: 'ibuprofeno_400',
    name: {
      es: 'Ibuprofeno 400 mg (AINE)',
      en: 'Ibuprofen 400 mg (NSAID)',
    },
    activeIngredient: {
      es: 'Ibuprofeno arginina',
      en: 'Ibuprofen arginine',
    },
    indication: {
      es: 'Dolor inflamatorio muscular, tendinitis o esguince leve sin antecedentes gástricos.',
      en: 'Inflammatory muscle pain, tendonitis, or mild sprain without gastric ulcer history.',
    },
    contraindication: {
      es: 'Úlcera péptica, gastritis aguda, embarazo (3er trimestre) o anticoagulantes.',
      en: 'Peptic ulcer, acute gastritis, pregnancy, or anticoagulant therapy.',
    },
    recommendedCounseling: 'take_with_food',
  },
  {
    id: 'omeprazol_20',
    name: {
      es: 'Antiácido / Alginato de Mostrador',
      en: 'Antacid & Alginate Gastric Relief',
    },
    activeIngredient: {
      es: 'Alginato sódico + Bicarbonato',
      en: 'Sodium alginate + Bicarbonate',
    },
    indication: {
      es: 'Acidez, ardor estomacal y reflujo tras comidas copiosas (tapas, fritura o rebujito).',
      en: 'Heartburn, acid reflux, and indigestion after heavy meals.',
    },
    contraindication: {
      es: 'Si hay dolor torácico opresivo irradiado al brazo/mandíbula, derivar a Urgencias.',
      en: 'If accompanied by crushing chest/jaw pain, refer immediately to Emergency Care.',
    },
    recommendedCounseling: 'take_with_food',
  },
  {
    id: 'loratadina_10',
    name: {
      es: 'Loratadina 10 mg Antihistamínico',
      en: 'Loratadine 10 mg Antihistamine',
    },
    activeIngredient: {
      es: 'Loratadina (2ª generación)',
      en: 'Loratadine (2nd-gen non-drowsy antihistamine)',
    },
    indication: {
      es: 'Rinitis alérgica primaveral (polen de olivo y gramíneas), estornudos y picor nasal.',
      en: 'Seasonal allergic rhinitis (olive tree & grass pollen), sneezing, and itchy nose.',
    },
    contraindication: {
      es: 'Hipersensibilidad al principio activo; precaución al conducir si produce leve sueño.',
      en: 'Hypersensitivity; advise caution when driving if mild drowsiness occurs.',
    },
    recommendedCounseling: 'avoid_drowsiness_driving',
  },
  {
    id: 'suero_oral',
    name: {
      es: 'Suero de Rehidratación Oral Hiposódico',
      en: 'Oral Rehydration Salts (Citrus Flavor)',
    },
    activeIngredient: {
      es: 'Glucosa + Electrolitos OMS',
      en: 'WHO Glucose + Electrolyte Salts',
    },
    indication: {
      es: 'Deshidratación leve por calor andaluz o gastroenteritis sin signos neurológicos.',
      en: 'Mild dehydration from Andalusian heat or mild gastroenteritis without neurological red flags.',
    },
    contraindication: {
      es: 'Si hay confusión mental, anhidrosis y >40 °C (golpe de calor), derivar a Urgencias.',
      en: 'If confusion, dry hot skin, and >40 °C fever (heatstroke), refer to Emergency Care.',
    },
    recommendedCounseling: 'hydrate_shade',
  },
  {
    id: 'calamina_locion',
    name: {
      es: 'Emulsión de Calamina y Aloe Andaluz',
      en: 'Calamine & Andalusian Aloe Soothing Lotion',
    },
    activeIngredient: {
      es: 'Carbonato de zinc + Aloe vera',
      en: 'Zinc carbonate (Calamine) + Aloe vera',
    },
    indication: {
      es: 'Eritema solar leve-moderado (quemadura de playa sin fiebre alta ni delirio).',
      en: 'Mild-to-moderate beach sunburn without high fever or systemic shock.',
    },
    contraindication: {
      es: 'Heridas abiertas profundas o quemaduras de 2º grado extensas infectadas.',
      en: 'Deep open wounds or extensive infected second-degree burns.',
    },
    recommendedCounseling: 'clean_dry_skin',
  },
  {
    id: 'aposito_hidrocoloide',
    name: {
      es: 'Apósito Hidrocoloide para Ampollas',
      en: 'Hydrocolloid Blister Cushion Plaster',
    },
    activeIngredient: {
      es: 'Carboximetilcelulosa hidrocoloide',
      en: 'Hydrocolloid cushioning matrix',
    },
    indication: {
      es: 'Ampollas por roce de calzado (procesiones de Semana Santa o baile en la Feria).',
      en: 'Friction blisters on heels/toes from Holy Week processions or Feria dancing.',
    },
    contraindication: {
      es: 'Infección purulenta o pie diabético ulcerado.',
      en: 'Purulent infection or diabetic foot ulceration.',
    },
    recommendedCounseling: 'clean_dry_skin',
  },
  {
    id: 'colirio_hialuronico',
    name: {
      es: 'Colirio de Ácido Hialurónico Monodosis',
      en: 'Hyaluronic Acid Artificial Tears',
    },
    activeIngredient: {
      es: 'Hialuronato sódico 0,2% sin conservantes',
      en: 'Preservative-free Sodium Hyaluronate 0.2%',
    },
    indication: {
      es: 'Sequedad e irritación ocular por humo de incienso, viento de levante o polvo.',
      en: 'Dry, irritated eyes from incense smoke, Levante wind, or dust.',
    },
    contraindication: {
      es: 'Dolor ocular agudo con pérdida súbita de visión (derivar a Urgencias).',
      en: 'Acute eye pain with sudden vision loss (refer to Emergency Care).',
    },
    recommendedCounseling: 'hydrate_shade',
  },
  {
    id: 'refer_urgencias',
    name: {
      es: '🚨 Derivar a Urgencias / Centro de Salud (No Dispensar Sin Receta)',
      en: '🚨 Refer to Emergency / Clinic (Do Not Dispense OTC)',
    },
    activeIngredient: {
      es: 'Protocolo de Derivación Farmacéutica de Guardia',
      en: 'On-Call Pharmacist Red-Flag Referral Protocol',
    },
    indication: {
      es: 'Signos de alarma (dolor torácico, golpe de calor >40 °C con confusión) o petición de antibiótico sin receta médica.',
      en: 'Red-flag symptoms (chest/jaw pain, >40 °C heatstroke with confusion) or antibiotic requests without a doctor prescription.',
    },
    contraindication: {
      es: 'Nunca dispensar antibióticos sin receta ni retrasar la atención hospitalaria.',
      en: 'Never dispense antibiotics without prescription or delay hospital emergency care.',
    },
    recommendedCounseling: 'emergency_hospital_now',
  },
];

export const TRIAGE_SCENARIOS: readonly TriageScenario[] = [
  {
    id: 'triage_pollen_olivo',
    customerName: 'Don Manuel el Olivarero',
    customerRole: {
      es: 'Agricultor de Jaén',
      en: 'Olive Grower from Jaén',
    },
    avatarColor: '#3B6E4C',
    symptomVisual: 'pollen_sneeze',
    openingComplaint: {
      es: '«¡Buenas! Con la floración del olivo no paro de estornudar, me pica la nariz y me lloran los ojos a mares.»',
      en: '"Good morning! With the olive trees blooming, I cannot stop sneezing and my nose and eyes itch non-stop."',
    },
    answers: {
      fever: {
        es: '«Qué va, ni décimas de fiebre. Es salir al campo y empezar el picor.»',
        en: '"No fever at all. It starts the moment I step outside near the groves."',
      },
      allergies: {
        es: '«Alergia medicamentos ninguna, solo al dichoso polen del olivo.»',
        en: '"No drug allergies—just this blessed olive pollen every spring."',
      },
      meds_pregnancy: {
        es: '«No tomo nada, pero conduzco el tractor por la mañana.»',
        en: '"Taking no other medications, though I drive my tractor in the morning."',
      },
      duration: {
        es: '«Llevo tres días así desde que subió la temperatura.»',
        en: '"Started three days ago when the spring breeze picked up."',
      },
    },
    correctRemedyId: 'loratadina_10',
    correctCounselingId: 'avoid_drowsiness_driving',
    isRedFlagEmergency: false,
    clinicalExplanation: {
      es: 'Rinitis alérgica estacional por polen de olivo: Loratadina 10 mg 1 vez al día y advertir precaución al conducir.',
      en: 'Seasonal olive-pollen allergic rhinitis: Loratadine 10 mg once daily with driving precaution counseling.',
    },
  },
  {
    id: 'triage_caleta_sunburn',
    customerName: 'Barnaby (Turista en Cádiz)',
    customerRole: {
      es: 'Visitante en Playa de la Caleta',
      en: 'Visitor at La Caleta Beach',
    },
    avatarColor: '#D9534F',
    symptomVisual: 'sunburn',
    openingComplaint: {
      es: '«¡Hola! Me quedé dormido al sol en La Caleta sin crema y tengo los hombros rojos como un cangrejo.»',
      en: '"Hello! I fell asleep in the sun at La Caleta beach without sunscreen and my shoulders are lobster-red and stinging!"',
    },
    answers: {
      fever: {
        es: '«No tengo fiebre ni mareo, solo me arde la piel al rozar la camisa.»',
        en: '"No fever or dizziness—just hot, stinging skin where my shirt rubs."',
      },
      allergies: {
        es: '«Ninguna alergia conocida.»',
        en: '"No known allergies."',
      },
      meds_pregnancy: {
        es: '«No tomo medicamentos.»',
        en: '"Not taking any medications."',
      },
      duration: {
        es: '«Fue esta tarde hace unas cuatro horas.»',
        en: '"Happened this afternoon about four hours ago."',
      },
    },
    correctRemedyId: 'calamina_locion',
    correctCounselingId: 'clean_dry_skin',
    isRedFlagEmergency: false,
    clinicalExplanation: {
      es: 'Eritema solar leve sin signos sistémicos: loción calmante de calamina y aloe sobre piel limpia y seca.',
      en: 'Uncomplicated mild sunburn: soothing calamine & aloe lotion applied to clean, dry skin.',
    },
  },
  {
    id: 'triage_nazareno_blister',
    customerName: 'Curro el Costalero',
    customerRole: {
      es: 'Hermandad de Semana Santa',
      en: 'Holy Week Procession Bearer',
    },
    avatarColor: '#5B3E96',
    symptomVisual: 'blister_limp',
    openingComplaint: {
      es: '«Vengo de seis horas de estación de penitencia y tengo una ampolla limpia en el talón que no me deja ni apoyar el pie.»',
      en: '"Just finished a six-hour Holy Week procession and I have a painful friction blister on my heel."',
    },
    answers: {
      fever: {
        es: '«Sin fiebre ni pus; la ampolla está cerrada y transparente.»',
        en: '"No fever or pus; the blister roof is intact and clear."',
      },
      allergies: {
        es: '«Ninguna alergia.»',
        en: '"No allergies."',
      },
      meds_pregnancy: {
        es: '«Sano como un roble, sin medicación.»',
        en: '"Healthy, no medications or diabetes."',
      },
      duration: {
        es: '«Me salió anoche con las alpargatas nuevas.»',
        en: '"Formed last night from my new procession espadrilles."',
      },
    },
    correctRemedyId: 'aposito_hidrocoloide',
    correctCounselingId: 'clean_dry_skin',
    isRedFlagEmergency: false,
    clinicalExplanation: {
      es: 'Ampolla por fricción intacta: apósito hidrocoloide sobre piel limpia y seca sin pinchar la ampolla.',
      en: 'Intact friction blister: apply hydrocolloid cushion plaster on clean, dry skin without popping the blister.',
    },
  },
  {
    id: 'triage_feria_acidez',
    customerName: 'Doña Carmen',
    customerRole: {
      es: 'Vecina de Triana',
      en: 'Neighbor from Triana',
    },
    avatarColor: '#C85A32',
    symptomVisual: 'stomach_ache',
    openingComplaint: {
      es: '«Hijo mío, anoche en la caseta de la Feria cené pescaíto frito tarde y tengo un ardor que me sube del estómago a la garganta.»',
      en: '"My dear, last night at the Feria tent I had late fried fish and now I have sour heartburn rising up my throat."',
    },
    answers: {
      fever: {
        es: '«Nada de fiebre, solo regurgitación ácida cuando me agacho.»',
        en: '"No fever at all, just sour reflux when I bend over."',
      },
      allergies: {
        es: '«Sin alergias. No tengo dolor de pecho ni falta de aire.»',
        en: '"No allergies. No chest pressure or shortness of breath."',
      },
      meds_pregnancy: {
        es: '«Tomo calcio para los huesos por la mañana.»',
        en: '"Just my morning calcium supplement."',
      },
      duration: {
        es: '«Desde que me levanté esta mañana tras la cena pesada.»',
        en: '"Started this morning after last night\'s heavy dinner."',
      },
    },
    correctRemedyId: 'omeprazol_20',
    correctCounselingId: 'take_with_food',
    isRedFlagEmergency: false,
    clinicalExplanation: {
      es: 'Reflujo gastroesofágico puntual postprandial: alginato/antiácido tras las comidas.',
      en: 'Postprandial acid reflux/heartburn: antacid/alginate taken after meals.',
    },
  },
  {
    id: 'triage_ulcer_headache',
    customerName: 'Paco el Guitarrista',
    customerRole: {
      es: 'Tocaor de Flamenco',
      en: 'Flamenco Guitarist',
    },
    avatarColor: '#2E6B9E',
    symptomVisual: 'fever_sweat',
    openingComplaint: {
      es: '«Tengo dolor de cabeza y destemplanza con 38 °C, dame un Ibuprofeno fuerte que esta noche tengo tablao.»',
      en: '"I have a headache and a 38 °C fever—give me strong Ibuprofen so I can play at the flamenco tablao tonight."',
    },
    answers: {
      fever: {
        es: '«Sí, 38,0 °C en casa y dolor de cabeza tensional.»',
        en: '"Yes, 38.0 °C at home with a tension headache."',
      },
      allergies: {
        es: '«Me sientan fatal los antiinflamatorios (AINEs).»',
        en: '"Anti-inflammatories (NSAIDs) tear up my stomach."',
      },
      meds_pregnancy: {
        es: '«¡Tuve una úlcera de estómago el mes pasado y tomo anticoagulante!»',
        en: '"I had a bleeding stomach ulcer last month and take blood thinners!"',
      },
      duration: {
        es: '«Empezó esta mañana.»',
        en: '"Started this morning."',
      },
    },
    correctRemedyId: 'paracetamol_650',
    correctCounselingId: 'hydrate_shade',
    isRedFlagEmergency: false,
    clinicalExplanation: {
      es: '¡El Ibuprofeno está contraindicado en úlcera gástrica y anticoagulantes! Dispensar Paracetamol 650 mg e hidratación.',
      en: 'Ibuprofen (NSAID) is strictly contraindicated with gastric ulcer and blood thinners! Dispense Paracetamol 650 mg and hydration.',
    },
  },
  {
    id: 'triage_antibiotic_refusal',
    customerName: 'Rocío la Impaciente',
    customerRole: {
      es: 'Cliente con Dolor de Garganta',
      en: 'Customer with Sore Throat',
    },
    avatarColor: '#8C4A6B',
    symptomVisual: 'chest_alert',
    openingComplaint: {
      es: '«Vengo sin receta médica pero exijo que me vendas una caja de Amoxicilina 500 mg o Azitromicina ahora mismo.»',
      en: '"I don\'t have a doctor\'s prescription, but I demand you sell me a box of Amoxicillin 500 mg right now!"',
    },
    answers: {
      fever: {
        es: '«Tengo 39,2 °C y placas blancas en las amígdalas.»',
        en: '"I have a 39.2 °C fever and white spots on my tonsils."',
      },
      allergies: {
        es: '«Hace años me salió urticaria con un antibiótico que no recuerdo.»',
        en: '"Years ago I broke out in hives from an antibiotic I can\'t remember."',
      },
      meds_pregnancy: {
        es: '«No traigo tarjeta ni receta del médico.»',
        en: '"I have no prescription from a physician."',
      },
      duration: {
        es: '«Llevo dos días con fiebre alta.»',
        en: '"Two days of high fever."',
      },
    },
    correctRemedyId: 'refer_urgencias',
    correctCounselingId: 'emergency_hospital_now',
    isRedFlagEmergency: true,
    clinicalExplanation: {
      es: 'En España es ilegal y peligroso dispensar antibióticos sin receta médica (y más con sospecha de alergia). Derivar al Centro de Salud / Urgencias.',
      en: 'Dispensing antibiotics without a prescription is illegal in Spain and dangerous with suspected allergy. Refer to Clinic / Urgent Care.',
    },
  },
  {
    id: 'triage_heatstroke_redflag',
    customerName: 'Don Eusebio',
    customerRole: {
      es: 'Jubilado en plena Ola de Calor (43 °C)',
      en: 'Retiree during 43 °C Heatwave',
    },
    avatarColor: '#B8332A',
    symptomVisual: 'chest_alert',
    openingComplaint: {
      es: '«Vengo andando a las tres de la tarde con 43 °C... no sudo nada, veo borroso y me oprime el pecho hacia el brazo izquierdo.»',
      en: '"I walked here at 3 PM in 43 °C heat... I stopped sweating, my vision is blurry, and my chest feels crushed into my left arm."',
    },
    answers: {
      fever: {
        es: '«Piel seca y ardiente a 40,4 °C con confusión y pulso acelerado.»',
        en: '"Hot, dry skin at 40.4 °C with confusion and racing pulse."',
      },
      allergies: {
        es: '«Sin alergias.»',
        en: '"No allergies."',
      },
      meds_pregnancy: {
        es: '«Hipertenso y cardiópata.»',
        en: '"History of hypertension and coronary disease."',
      },
      duration: {
        es: '«Empezó hace 20 minutos al cruzar la plaza al sol.»',
        en: '"Started 20 minutes ago crossing the sun-baked plaza."',
      },
    },
    correctRemedyId: 'refer_urgencias',
    correctCounselingId: 'emergency_hospital_now',
    isRedFlagEmergency: true,
    clinicalExplanation: {
      es: 'Emergencia vital (golpe de calor + síndrome coronario agudo): activar protocolo 112 / derivación inmediata a Urgencias.',
      en: 'Life-threatening emergency (heatstroke + acute coronary symptoms): call 112 / immediate emergency referral.',
    },
  },
];

export const PRESCRIPTION_SCENARIOS: readonly PrescriptionScenario[] = [
  {
    id: 'rx_amoxi_500',
    doctorName: 'Dr. Don Gregorio Morales (Col. 41/8821)',
    clinicSpecialty: {
      es: 'Centro de Salud Macarena • Medicina de Familia',
      en: 'Macarena Health Center • Family Medicine',
    },
    patientName: 'Lucía Vargas',
    patientAge: 34,
    patientContext: {
      es: 'Adulta con otitis media bacteriana confirmada (sin alergias).',
      en: 'Adult with confirmed bacterial otitis media (no allergies).',
    },
    handwritingText: 'Amoxicilina 500mg - 1 comp / 8h',
    watermarkHint: {
      es: 'Sello clínico: Infección ORL • Betalactámico 500 mg cada 8 horas',
      en: 'Clinic watermark: ENT Infection • Beta-lactam 500 mg every 8 hours',
    },
    correctDrug: 'Amoxicilina',
    drugOptions: ['Amoxicilina', 'Amitriptilina', 'Amlodipino'],
    correctStrength: '500 mg',
    strengthOptions: ['50 mg', '500 mg', '5 mg'],
    correctPosologyId: 'every_8h',
    posologyOptions: [
      { id: 'every_8h', label: { es: '1 comp cada 8 horas (7 días)', en: '1 tab every 8 hours (7 days)' } },
      { id: 'every_24h', label: { es: '1 comp cada 24 horas al acostarse', en: '1 tab every 24 hours at bedtime' } },
      { id: 'every_12h', label: { es: '2 gotas cada 12 horas', en: '2 drops every 12 hours' } },
    ],
    messinessBase: 0.25,
  },
  {
    id: 'rx_omeprazol_20',
    doctorName: 'Dra. Elena Mendoza (Col. 11/4092)',
    clinicSpecialty: {
      es: 'Hospital Puerta del Mar • Digestivo',
      en: 'Puerta del Mar Hospital • Gastroenterology',
    },
    patientName: 'Antonio Jiménez',
    patientAge: 58,
    patientContext: {
      es: 'Paciente con esofagitis por reflujo; toma matutina en ayunas.',
      en: 'Patient with reflux esophagitis; morning fasting dose.',
    },
    handwritingText: 'Omeprazol 20mg - 1 caps / 24h',
    watermarkHint: {
      es: 'Sello clínico: IBP Protector Gástrico 20 mg en ayunas (cada 24h)',
      en: 'Clinic watermark: PPI Gastric Protector 20 mg fasting (every 24h)',
    },
    correctDrug: 'Omeprazol',
    drugOptions: ['Omeprazol', 'Oxcarbazepina', 'Olanzapina'],
    correctStrength: '20 mg',
    strengthOptions: ['2 mg', '20 mg', '200 mg'],
    correctPosologyId: 'every_24h',
    posologyOptions: [
      { id: 'every_8h', label: { es: '1 cápsula cada 8 horas', en: '1 capsule every 8 hours' } },
      { id: 'every_24h', label: { es: '1 cápsula cada 24 horas en ayunas', en: '1 capsule every 24h before breakfast' } },
      { id: 'every_6h', label: { es: '1 sobre cada 6 horas', en: '1 sachet every 6 hours' } },
    ],
    messinessBase: 0.38,
  },
  {
    id: 'rx_ebastina_10',
    doctorName: 'Dr. Don Gregorio Morales (Col. 41/8821)',
    clinicSpecialty: {
      es: 'Consultorio de Alergología • Córdoba',
      en: 'Allergy Clinic • Córdoba',
    },
    patientName: 'Marta Serrano',
    patientAge: 29,
    patientContext: {
      es: 'Alergia primaveral severa al polen de olivo (presión arterial normal).',
      en: 'Severe spring olive-pollen allergy (normal blood pressure).',
    },
    handwritingText: 'Ebastina 10mg - 1 comp / 24h',
    watermarkHint: {
      es: 'Sello clínico: Antihistamínico H1 10 mg (¡No confundir con Enalapril!) • 24h',
      en: 'Clinic watermark: H1 Antihistamine 10 mg (Do not confuse with Enalapril!) • 24h',
    },
    correctDrug: 'Ebastina',
    drugOptions: ['Enalapril', 'Ebastina', 'Espiramicina'],
    correctStrength: '10 mg',
    strengthOptions: ['10 mg', '100 mg', '1 mg'],
    correctPosologyId: 'every_24h',
    posologyOptions: [
      { id: 'every_24h', label: { es: '1 comprimido cada 24 horas', en: '1 tablet every 24 hours' } },
      { id: 'every_8h', label: { es: '1 comprimido cada 8 horas', en: '1 tablet every 8 hours' } },
      { id: 'every_4h', label: { es: '1 comprimido cada 4 horas', en: '1 tablet every 4 hours' } },
    ],
    messinessBase: 0.52,
  },
  {
    id: 'rx_metamizol_575',
    doctorName: 'Dr. Rafael Córdoba (Col. 14/9910)',
    clinicSpecialty: {
      es: 'Traumatología • Virgen del Rocío',
      en: 'Orthopedics • Virgen del Rocío Hospital',
    },
    patientName: 'Joaquín Cortés',
    patientAge: 46,
    patientContext: {
      es: 'Cólico nefrítico agudo / dolor postoperatorio intenso (no diabético).',
      en: 'Acute renal colic / severe post-op pain (non-diabetic).',
    },
    handwritingText: 'Metamizol 575mg - 1 caps / 8h',
    watermarkHint: {
      es: 'Sello clínico: Pirazolona Analgésica 575 mg cada 8h (No es Metformina)',
      en: 'Clinic watermark: Analgesic 575 mg every 8h (Not Metformin)',
    },
    correctDrug: 'Metamizol',
    drugOptions: ['Metformina', 'Metamizol', 'Metoprolol'],
    correctStrength: '575 mg',
    strengthOptions: ['575 mg', '850 mg', '50 mg'],
    correctPosologyId: 'every_8h',
    posologyOptions: [
      { id: 'every_8h', label: { es: '1 cápsula cada 8 horas si dolor', en: '1 capsule every 8 hours for pain' } },
      { id: 'every_24h', label: { es: '1 cápsula cada 24 horas', en: '1 capsule every 24 hours' } },
      { id: 'every_12h', label: { es: '1 inhalación cada 12 horas', en: '1 puff every 12 hours' } },
    ],
    messinessBase: 0.65,
  },
  {
    id: 'rx_pediatric_amoxi',
    doctorName: 'Dra. Sofía Alarcón (Col. 29/3315)',
    clinicSpecialty: {
      es: 'Pediatría • Málaga Centro',
      en: 'Pediatrics • Málaga Center',
    },
    patientName: 'Lucas Gallego (Niño)',
    patientAge: 5,
    patientContext: {
      es: 'Niño de 5 años (18 kg) con faringoamigdalitis estreptocócica; requiere jarabe en suspensión.',
      en: '5-year-old child (18 kg) with strep throat; requires liquid oral suspension.',
    },
    handwritingText: 'Amoxicilina Susp 250mg/5ml - 5ml / 8h',
    watermarkHint: {
      es: 'Sello clínico: Pediatría Suspensión Oral 250 mg/5 ml • 5 ml cada 8h',
      en: 'Clinic watermark: Pediatric Oral Suspension 250 mg/5 ml • 5 ml every 8h',
    },
    correctDrug: 'Amoxicilina Suspensión',
    drugOptions: ['Amoxicilina Suspensión', 'Amoxicilina 1g Comprimidos', 'Azitromicina 500mg'],
    correctStrength: '250 mg/5 ml',
    strengthOptions: ['1000 mg', '250 mg/5 ml', '25 mg'],
    correctPosologyId: 'every_8h_5ml',
    posologyOptions: [
      { id: 'every_8h_5ml', label: { es: '5 ml con jeringa dosificadora cada 8 horas', en: '5 ml via oral syringe every 8 hours' } },
      { id: 'every_24h_tab', label: { es: '1 comprimido entero cada 24 horas', en: '1 whole tablet every 24 hours' } },
      { id: 'every_12h_drop', label: { es: '20 ml cada 12 horas', en: '20 ml every 12 hours' } },
    ],
    messinessBase: 0.78,
  },
  {
    id: 'rx_atorvastatina_40',
    doctorName: 'Dr. Don Gregorio Morales (Col. 41/8821)',
    clinicSpecialty: {
      es: 'Cardiología • Sevilla',
      en: 'Cardiology • Seville',
    },
    patientName: 'Esperanza Montes',
    patientAge: 67,
    patientContext: {
      es: 'Hipercolesterolemia familiar; toma nocturna única.',
      en: 'Hypercholesterolemia; single evening dose.',
    },
    handwritingText: 'Atorvastatina 40mg - 1 comp / 24h cena',
    watermarkHint: {
      es: 'Sello clínico: Estatina Hipolipemiante 40 mg • 1 comp cada 24h por la noche',
      en: 'Clinic watermark: Lipid-lowering Statin 40 mg • 1 tab every 24h at night',
    },
    correctDrug: 'Atorvastatina',
    drugOptions: ['Atorvastatina', 'Atomoxetina', 'Azatioprina'],
    correctStrength: '40 mg',
    strengthOptions: ['4 mg', '40 mg', '400 mg'],
    correctPosologyId: 'every_24h_night',
    posologyOptions: [
      { id: 'every_24h_night', label: { es: '1 comprimido cada 24 horas por la noche', en: '1 tablet every 24 hours in the evening' } },
      { id: 'every_8h', label: { es: '1 comprimido cada 8 horas', en: '1 tablet every 8 hours' } },
      { id: 'every_6h', label: { es: '2 comprimidos cada 6 horas', en: '2 tablets every 6 hours' } },
    ],
    messinessBase: 0.88,
  },
];

export const COMPOUNDING_RECIPES: readonly CompoundingRecipe[] = [
  {
    id: 'lab_pomada_azahar',
    name: {
      es: 'Pomada Calmante de Azahar y Aceite de Oliva',
      en: 'Orange Blossom & Olive Oil Soothing Ointment',
    },
    patientIndication: {
      es: 'Dermatitis seca y manos agrietadas del campo andaluz.',
      en: 'Dry dermatitis and chapped hands from the Andalusian countryside.',
    },
    powderName: {
      es: 'Óxido de Zinc Purificado',
      en: 'Purified Zinc Oxide Powder',
    },
    targetMassGrams: 1.5,
    massToleranceGrams: 0.15,
    targetGrindRpm: 60,
    grindDurationSec: 2.0,
    liquidName: {
      es: 'Hidrolato de Azahar y Oleato Virgen',
      en: 'Orange Blossom Hydrosol & Virgin Olive Oleate',
    },
    targetLiquidMl: 5.0,
    liquidToleranceMl: 0.4,
    targetBathTempC: 60,
    bathTempToleranceC: 5,
    holdTempDurationSec: 2.0,
    pigmentColor: '#E5B84B',
  },
  {
    id: 'lab_jarabe_tomillo',
    name: {
      es: 'Jarabe Magistral de Tomillo y Miel de la Sierra',
      en: 'Sierra Honey & Thyme Soothing Throat Syrup',
    },
    patientIndication: {
      es: 'Afonía y tos irritativa de los cantaores en Semana Santa y Feria.',
      en: 'Hoarseness and dry cough for singers during Holy Week and Feria.',
    },
    powderName: {
      es: 'Extracto Seco de Thymus vulgaris',
      en: 'Dry Thymus vulgaris Extract',
    },
    targetMassGrams: 2.0,
    massToleranceGrams: 0.12,
    targetGrindRpm: 70,
    grindDurationSec: 2.4,
    liquidName: {
      es: 'Jarabe Simple F.E. + Agua de Romero',
      en: 'Simple Pharmacopoeia Syrup + Rosemary Water',
    },
    targetLiquidMl: 6.4,
    liquidToleranceMl: 0.35,
    targetBathTempC: 62,
    bathTempToleranceC: 4.5,
    holdTempDurationSec: 2.2,
    pigmentColor: '#C87A28',
  },
  {
    id: 'lab_locion_calamina',
    name: {
      es: 'Loción Mentolada de Calamina Gaditana',
      en: 'Mentholated Cádiz Calamine Cooling Lotion',
    },
    patientIndication: {
      es: 'Prurito solar intenso tras jornada de viento de Levante.',
      en: 'Intense solar itch after a day in the Levante wind.',
    },
    powderName: {
      es: 'Calamina Rosa + Mentol Cristalizado',
      en: 'Pink Calamine + Menthol Crystals',
    },
    targetMassGrams: 2.25,
    massToleranceGrams: 0.1,
    targetGrindRpm: 75,
    grindDurationSec: 2.5,
    liquidName: {
      es: 'Agua Purificada + Glicerina Vegetal',
      en: 'Purified Water + Vegetable Glycerin',
    },
    targetLiquidMl: 7.2,
    liquidToleranceMl: 0.3,
    targetBathTempC: 58,
    bathTempToleranceC: 4.0,
    holdTempDurationSec: 2.5,
    pigmentColor: '#E68A9E',
  },
  {
    id: 'lab_gel_terral',
    name: {
      es: 'Emulsión Hidrogel Termoprotectora del Terral',
      en: 'Terral Heatwave Thermoprotective Hydrogel',
    },
    patientIndication: {
      es: 'Quemaduras térmicas superficiales durante la alerta roja de agosto.',
      en: 'Superficial thermal burns during the August red-alert heatwave.',
    },
    powderName: {
      es: 'Pantenol + Alantoína Micronizada',
      en: 'Panthenol + Micronized Allantoin',
    },
    targetMassGrams: 1.8,
    massToleranceGrams: 0.08,
    targetGrindRpm: 80,
    grindDurationSec: 2.8,
    liquidName: {
      es: 'Gel Base Hialurónico de Farmacia Gallego',
      en: 'Farmacia Gallego Hyaluronic Base Gel',
    },
    targetLiquidMl: 5.6,
    liquidToleranceMl: 0.25,
    targetBathTempC: 64,
    bathTempToleranceC: 3.5,
    holdTempDurationSec: 2.8,
    pigmentColor: '#4BA3C3',
  },
];

export const PRECINTO_ORDERS: readonly PrecintoOrder[] = [
  {
    id: 'precinto_pensionista_1',
    medicationBoxTitle: 'Enalapril Gallego 20 mg EFG (28 comp.)',
    activePrinciple: {
      es: 'Enalapril maleato • Antihipertensivo',
      en: 'Enalapril maleate • Antihypertensive',
    },
    retailPriceEur: 4.8,
    patientRegimeLabel: {
      es: 'Tarjeta Sanitaria Andaluza: PENSIONISTA (TSI 002 • Aportación 10%)',
      en: 'Andalusian Health Card: PENSIONER (TSI 002 • 10% Co-Pay)',
    },
    correctCopayTier: 'pensionista_10',
    expectedCopayEur: 0.48,
    cutMarginPx: 22,
    boxColor: '#1D4E89',
  },
  {
    id: 'precinto_activo_2',
    medicationBoxTitle: 'Amoxicilina/Clavulánico 875/125 mg EFG',
    activePrinciple: {
      es: 'Amoxicilina + Ácido Clavulánico • Antibiótico con Receta',
      en: 'Amoxicillin + Clavulanic Acid • Prescription Antibiotic',
    },
    retailPriceEur: 7.5,
    patientRegimeLabel: {
      es: 'Tarjeta Sanitaria Andaluza: ACTIVO (TSI 003 • Aportación 40%)',
      en: 'Andalusian Health Card: ACTIVE WORKER (TSI 003 • 40% Co-Pay)',
    },
    correctCopayTier: 'activo_40',
    expectedCopayEur: 3.0,
    cutMarginPx: 18,
    boxColor: '#2E7D32',
  },
  {
    id: 'precinto_privado_3',
    medicationBoxTitle: 'Colirio Lágrima Artificial Hialurónico (Sin Financiación)',
    activePrinciple: {
      es: 'Hialuronato sódico • Receta Privada No Financiada',
      en: 'Sodium hyaluronate • Private Unsubsidized Prescription',
    },
    retailPriceEur: 9.2,
    patientRegimeLabel: {
      es: 'Receta Privada: SIN FINANCIACIÓN SNS (Aportación 100%)',
      en: 'Private Prescription: UNSUBSIDIZED (100% Patient Payment)',
    },
    correctCopayTier: 'sin_receta_100',
    expectedCopayEur: 9.2,
    cutMarginPx: 15,
    boxColor: '#C85A32',
  },
  {
    id: 'precinto_pensionista_4',
    medicationBoxTitle: 'Atorvastatina 40 mg EFG (28 comprimidos)',
    activePrinciple: {
      es: 'Atorvastatina cálcica • Hipolipemiante',
      en: 'Atorvastatin calcium • Cholesterol Statin',
    },
    retailPriceEur: 6.4,
    patientRegimeLabel: {
      es: 'Tarjeta Sanitaria Andaluza: PENSIONISTA (TSI 002 • Aportación 10%)',
      en: 'Andalusian Health Card: PENSIONER (TSI 002 • 10% Co-Pay)',
    },
    correctCopayTier: 'pensionista_10',
    expectedCopayEur: 0.64,
    cutMarginPx: 12,
    boxColor: '#6A3D9A',
  },
];

export const COLD_CHAIN_WAVES: readonly ColdChainWave[] = [
  {
    id: 'wave_mediodia_1',
    title: {
      es: 'Reparto de Bidafarma de las 13:30',
      en: '13:30 Bidafarma Midday Delivery',
    },
    ambientTempC: 28,
    items: [
      {
        id: 'item_insulina_glargina',
        name: 'Insulina Glargina 100 UI/ml ❄️',
        subtitle: {
          es: 'Termolábil: conservar en nevera entre 2 °C y 8 °C',
          en: 'Thermolabile: store in 2 °C–8 °C refrigerator immediately',
        },
        requiresColdChain: true,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'fridge_cold',
        initialTempC: 4.5,
        maxSafeTempC: 8.0,
      },
      {
        id: 'item_ibuprofeno_drawer',
        name: 'Ibuprofeno 600 mg (Inicial I)',
        subtitle: {
          es: 'Ambiente • Cajonera Alfabética A–M',
          en: 'Room temp • Alphabetical Drawer A–M',
        },
        requiresColdChain: false,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'drawer_a_m',
        initialTempC: 22.0,
        maxSafeTempC: 30.0,
      },
      {
        id: 'item_omeprazol_drawer',
        name: 'Omeprazol 20 mg (Inicial O)',
        subtitle: {
          es: 'Ambiente • Cajonera Alfabética N–Z',
          en: 'Room temp • Alphabetical Drawer N–Z',
        },
        requiresColdChain: false,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'drawer_n_z',
        initialTempC: 22.0,
        maxSafeTempC: 30.0,
      },
      {
        id: 'item_jarabe_caducado',
        name: 'Jarabe Caducado (Lote 2023) ♻️',
        subtitle: {
          es: 'Caducado: depositar en contenedor blanco Punto SIGRE',
          en: 'Expired batch: dispose in white Punto SIGRE bin',
        },
        requiresColdChain: false,
        isNarcoticSafe: false,
        isExpired: true,
        correctDestination: 'sigre_expired',
        initialTempC: 23.0,
        maxSafeTempC: 35.0,
      },
    ],
  },
  {
    id: 'wave_primavera_2',
    title: {
      es: 'Remesa de Vacunas de Alergia y Estupefacientes',
      en: 'Allergy Immunotherapy & Controlled Safe Delivery',
    },
    ambientTempC: 32,
    items: [
      {
        id: 'item_vacuna_olivo',
        name: 'Vacuna Sublingual Polen de Olivo ❄️',
        subtitle: {
          es: 'Termolábil: conservar en nevera (2 °C–8 °C)',
          en: 'Thermolabile: store in 2 °C–8 °C refrigerator',
        },
        requiresColdChain: true,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'fridge_cold',
        initialTempC: 5.0,
        maxSafeTempC: 8.0,
      },
      {
        id: 'item_fentanilo_safe',
        name: 'Morfina Sulfato 10 mg ● (Estupefaciente)',
        subtitle: {
          es: 'Círculo negro ●: guardar bajo llave en Caja Fuerte',
          en: 'Black circle ● narcotic: lock inside Narcotics Safe',
        },
        requiresColdChain: false,
        isNarcoticSafe: true,
        isExpired: false,
        correctDestination: 'safe_estupefacientes',
        initialTempC: 23.0,
        maxSafeTempC: 35.0,
      },
      {
        id: 'item_amoxicilina_am',
        name: 'Amoxicilina 500 mg (Inicial A)',
        subtitle: {
          es: 'Ambiente • Cajonera Alfabética A–M',
          en: 'Room temp • Alphabetical Drawer A–M',
        },
        requiresColdChain: false,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'drawer_a_m',
        initialTempC: 23.0,
        maxSafeTempC: 35.0,
      },
      {
        id: 'item_paracetamol_nz',
        name: 'Paracetamol 1 g (Inicial P)',
        subtitle: {
          es: 'Ambiente • Cajonera Alfabética N–Z',
          en: 'Room temp • Alphabetical Drawer N–Z',
        },
        requiresColdChain: false,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'drawer_n_z',
        initialTempC: 23.0,
        maxSafeTempC: 35.0,
      },
    ],
  },
  {
    id: 'wave_calor_3',
    title: {
      es: 'Urgencia Térmica de Agosto (42 °C al Sol)',
      en: 'August 42 °C Heatwave Cold-Chain Emergency',
    },
    ambientTempC: 42,
    items: [
      {
        id: 'item_vacuna_meningococo',
        name: 'Vacuna Pediátrica Meningococo B ❄️',
        subtitle: {
          es: '¡CRÍTICO! Cadena de frío 2 °C–8 °C en plena ola de calor',
          en: 'CRITICAL! 2 °C–8 °C cold chain during 42 °C heatwave',
        },
        requiresColdChain: true,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'fridge_cold',
        initialTempC: 5.5,
        maxSafeTempC: 8.0,
      },
      {
        id: 'item_insulina_asparta',
        name: 'Insulina Rápida Asparta Pluma ❄️',
        subtitle: {
          es: '¡CRÍTICO! Cadena de frío 2 °C–8 °C',
          en: 'CRITICAL! 2 °C–8 °C cold chain refrigerator',
        },
        requiresColdChain: true,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'fridge_cold',
        initialTempC: 5.2,
        maxSafeTempC: 8.0,
      },
      {
        id: 'item_oxicodona_safe',
        name: 'Oxicodona 20 mg ● (Estupefaciente)',
        subtitle: {
          es: 'Custodia obligatoria en Caja Fuerte de Estupefacientes',
          en: 'Mandatory custody in Locked Narcotics Safe',
        },
        requiresColdChain: false,
        isNarcoticSafe: true,
        isExpired: false,
        correctDestination: 'safe_estupefacientes',
        initialTempC: 25.0,
        maxSafeTempC: 38.0,
      },
      {
        id: 'item_colirio_caducado',
        name: 'Colirio Abierto Hace 6 Meses ♻️',
        subtitle: {
          es: 'Caducado: reciclar en Punto SIGRE',
          en: 'Expired eye drops: recycle in Punto SIGRE bin',
        },
        requiresColdChain: false,
        isNarcoticSafe: false,
        isExpired: true,
        correctDestination: 'sigre_expired',
        initialTempC: 25.0,
        maxSafeTempC: 38.0,
      },
      {
        id: 'item_simvastatina_nz',
        name: 'Simvastatina 20 mg (Inicial S)',
        subtitle: {
          es: 'Ambiente • Cajonera Alfabética N–Z',
          en: 'Room temp • Alphabetical Drawer N–Z',
        },
        requiresColdChain: false,
        isNarcoticSafe: false,
        isExpired: false,
        correctDestination: 'drawer_n_z',
        initialTempC: 25.0,
        maxSafeTempC: 38.0,
      },
    ],
  },
];

export const CAMPAIGN_LEVELS: readonly CampaignLevel[] = [
  {
    levelNumber: 1,
    title: {
      es: 'Nivel 1: Mañana en el Pueblo Blanco',
      en: 'Level 1: White Village Morning',
    },
    locationSubtitle: {
      es: 'Arcos de la Frontera • Apertura de Farmacia Gallego',
      en: 'Arcos de la Frontera • Opening Farmacia Gallego',
    },
    seasonalEvent: {
      es: 'Brisa de Primavera',
      en: 'Early Spring Breeze',
    },
    ambientTempC: 21,
    shiftTimeLabel: '09:30',
    timeLimitSec: 120,
    difficultyMultiplier: 1.0,
    rewardEur: 45,
    briefing: {
      es: '¡Bienvenido a Farmacia Gallego! Atiende a Don Manuel en el mostrador y descifra la primera receta del Dr. Gregorio.',
      en: 'Welcome to Farmacia Gallego! Triage Don Manuel at the counter and decode your first prescription from Dr. Gregorio.',
    },
    tasks: [
      { type: 'triage', scenarioId: 'triage_pollen_olivo' },
      { type: 'handwriting', scenarioId: 'rx_amoxi_500' },
    ],
  },
  {
    levelNumber: 2,
    title: {
      es: 'Nivel 2: Martes de Receta Electrónica',
      en: 'Level 2: Prescription & Barcode Tuesday',
    },
    locationSubtitle: {
      es: 'Barrio de Santa Cruz • Sevilla',
      en: 'Santa Cruz Quarter • Seville',
    },
    seasonalEvent: {
      es: 'Consulta de Mañana',
      en: 'Morning Clinic Rush',
    },
    ambientTempC: 23,
    shiftTimeLabel: '11:00',
    timeLimitSec: 120,
    difficultyMultiplier: 1.12,
    rewardEur: 55,
    briefing: {
      es: 'Descifra la receta de digestivo y corta con precisión el cupón precinto de la caja sin dañar el blíster.',
      en: 'Decode the gastro prescription and carefully slice the barcode flap (cupón precinto) off the medicine box.',
    },
    tasks: [
      { type: 'handwriting', scenarioId: 'rx_omeprazol_20' },
      { type: 'precinto', scenarioId: 'precinto_pensionista_1' },
    ],
  },
  {
    levelNumber: 3,
    title: {
      es: 'Nivel 3: El Secreto de la Rebotica',
      en: 'Level 3: Secret of the Backroom Lab',
    },
    locationSubtitle: {
      es: 'Patios de Córdoba • Laboratorio Magistral',
      en: 'Córdoba Patios • Magistral Compounding Bench',
    },
    seasonalEvent: {
      es: 'Fiesta de los Patios',
      en: 'Festival of the Patios',
    },
    ambientTempC: 25,
    shiftTimeLabel: '12:15',
    timeLimitSec: 135,
    difficultyMultiplier: 1.22,
    rewardEur: 65,
    briefing: {
      es: 'Atiende a un turista quemado por el sol en La Caleta y entra en la rebotica para elaborar la Pomada de Azahar y Oliva.',
      en: 'Triage a sunburned tourist from La Caleta and step into the backroom lab to compound Orange Blossom & Olive Ointment.',
    },
    tasks: [
      { type: 'triage', scenarioId: 'triage_caleta_sunburn' },
      { type: 'compounding', scenarioId: 'lab_pomada_azahar' },
    ],
  },
  {
    levelNumber: 4,
    title: {
      es: 'Nivel 4: Reparto Antes de la Siesta',
      en: 'Level 4: Pre-Siesta Delivery Rush',
    },
    locationSubtitle: {
      es: 'Jerez de la Frontera • Almacén y Mostrador',
      en: 'Jerez de la Frontera • Storeroom & Counter',
    },
    seasonalEvent: {
      es: 'Llegada de Cubetas Bidafarma',
      en: 'Midday Wholesaler Delivery',
    },
    ambientTempC: 28,
    shiftTimeLabel: '13:45',
    timeLimitSec: 140,
    difficultyMultiplier: 1.35,
    rewardEur: 75,
    briefing: {
      es: '¡Ha llegado la furgoneta de reparto! Guarda la insulina en la nevera antes de que se caliente y despacha el mostrador.',
      en: 'The delivery van has arrived! Refrigerate the insulin before it warms up, then clear the counter queue.',
    },
    tasks: [
      { type: 'coldchain', scenarioId: 'wave_mediodia_1' },
      { type: 'triage', scenarioId: 'triage_feria_acidez' },
      { type: 'precinto', scenarioId: 'precinto_activo_2' },
    ],
  },
  {
    levelNumber: 5,
    title: {
      es: 'Nivel 5: Domingo de Semana Santa',
      en: 'Level 5: Holy Week Procession Shift',
    },
    locationSubtitle: {
      es: 'Carrera Oficial • Guardia de Tarde',
      en: 'Procession Route • Afternoon Duty',
    },
    seasonalEvent: {
      es: 'Semana Santa en Andalucía',
      en: 'Andalusian Holy Week',
    },
    ambientTempC: 26,
    shiftTimeLabel: '18:30',
    timeLimitSec: 150,
    difficultyMultiplier: 1.48,
    rewardEur: 85,
    briefing: {
      es: 'Curro llega cojeando tras la procesión. Cuida su ampolla, descifra una receta de traumatología y prepara el jarabe de tomillo.',
      en: 'Curro arrives limping from the procession. Treat his heel blister, decode an orthopedic script, and compound thyme syrup.',
    },
    tasks: [
      { type: 'triage', scenarioId: 'triage_nazareno_blister' },
      { type: 'handwriting', scenarioId: 'rx_metamizol_575' },
      { type: 'compounding', scenarioId: 'lab_jarabe_tomillo' },
    ],
  },
  {
    levelNumber: 6,
    title: {
      es: 'Nivel 6: Primavera en los Olivares',
      en: 'Level 6: Spring in the Olive Groves',
    },
    locationSubtitle: {
      es: 'Úbeda y Baeza • Alerta de Polen',
      en: 'Úbeda & Baeza • High Pollen Alert',
    },
    seasonalEvent: {
      es: 'Pico de Polen del Olivo',
      en: 'Olive Pollen Peak',
    },
    ambientTempC: 29,
    shiftTimeLabel: '10:45',
    timeLimitSec: 150,
    difficultyMultiplier: 1.6,
    rewardEur: 95,
    briefing: {
      es: '¡Cuidado con los medicamentos que se parecen al leer la receta y con las úlceras de estómago en el mostrador!',
      en: 'Watch out for look-alike medication names on prescriptions and gastric ulcer contraindications at the counter!',
    },
    tasks: [
      { type: 'handwriting', scenarioId: 'rx_ebastina_10' },
      { type: 'coldchain', scenarioId: 'wave_primavera_2' },
      { type: 'triage', scenarioId: 'triage_ulcer_headache' },
    ],
  },
  {
    levelNumber: 7,
    title: {
      es: 'Nivel 7: Noche de Feria de Abril',
      en: 'Level 7: April Fair Late-Night Shift',
    },
    locationSubtitle: {
      es: 'Real de la Feria • Los Remedios',
      en: 'Fairgrounds • Los Remedios',
    },
    seasonalEvent: {
      es: 'Feria de Abril (Alumbrao)',
      en: 'April Fair Midnight Lights',
    },
    ambientTempC: 31,
    shiftTimeLabel: '23:15',
    timeLimitSec: 155,
    difficultyMultiplier: 1.75,
    rewardEur: 110,
    briefing: {
      es: 'Una clienta exige antibióticos sin receta médica. ¡Aplica la ley farmacéutica, corta el precinto y elabora loción de calamina!',
      en: 'A customer demands antibiotics without a prescription. Enforce pharmacy safety rules, slice the barcode flap, and compound calamine lotion!',
    },
    tasks: [
      { type: 'triage', scenarioId: 'triage_antibiotic_refusal' },
      { type: 'precinto', scenarioId: 'precinto_privado_3' },
      { type: 'compounding', scenarioId: 'lab_locion_calamina' },
    ],
  },
  {
    levelNumber: 8,
    title: {
      es: 'Nivel 8: Agosto en La Caleta',
      en: 'Level 8: August Rush at La Caleta',
    },
    locationSubtitle: {
      es: 'Cádiz Casco Antiguo • Pleno Verano',
      en: 'Cádiz Old Town • High Summer',
    },
    seasonalEvent: {
      es: 'Viento de Levante y Playa',
      en: 'Levante Wind & Beach Crowds',
    },
    ambientTempC: 36,
    shiftTimeLabel: '13:00',
    timeLimitSec: 155,
    difficultyMultiplier: 1.9,
    rewardEur: 125,
    briefing: {
      es: 'El calor aprieta en Cádiz: protege la cadena de frío, atiende a los bañistas y valida la dosis pediátrica exacta.',
      en: 'Temperatures are soaring in Cádiz: protect the cold chain, care for beachgoers, and verify an exact pediatric suspension dose.',
    },
    tasks: [
      { type: 'coldchain', scenarioId: 'wave_primavera_2' },
      { type: 'triage', scenarioId: 'triage_caleta_sunburn' },
      { type: 'handwriting', scenarioId: 'rx_pediatric_amoxi' },
    ],
  },
  {
    levelNumber: 9,
    title: {
      es: 'Nivel 9: Alerta Roja: Ola de Calor (El Terral)',
      en: 'Level 9: Red Alert: Terral Heatwave',
    },
    locationSubtitle: {
      es: 'Málaga y Valle del Guadalquivir • 42 °C',
      en: 'Málaga & Guadalquivir Valley • 42 °C',
    },
    seasonalEvent: {
      es: 'Ola de Calor Extrema',
      en: 'Extreme August Heatwave',
    },
    ambientTempC: 42,
    shiftTimeLabel: '15:30',
    timeLimitSec: 175,
    difficultyMultiplier: 2.1,
    rewardEur: 145,
    briefing: {
      es: '42 °C a la sombra: salva las vacunas pediátricas, detecta el golpe de calor vital en mostrador y emulsiona el hidrogel.',
      en: '42 °C in the shade: save the pediatric vaccines, catch a life-threatening heatstroke emergency, and emulsify the hydrogel.',
    },
    tasks: [
      { type: 'coldchain', scenarioId: 'wave_calor_3' },
      { type: 'triage', scenarioId: 'triage_heatstroke_redflag' },
      { type: 'compounding', scenarioId: 'lab_gel_terral' },
      { type: 'precinto', scenarioId: 'precinto_pensionista_4' },
    ],
  },
  {
    levelNumber: 10,
    title: {
      es: 'Nivel 10: Gran Guardia Nocturna de Farmacia Gallego',
      en: 'Level 10: Farmacia Gallego Grand Night-Duty Exam',
    },
    locationSubtitle: {
      es: 'Cruz de Malta Encendida • Examen de Titular',
      en: 'Glowing Maltese Cross • Master Pharmacist Exam',
    },
    seasonalEvent: {
      es: 'Guardia de 24 Horas (Las 5 Pruebas)',
      en: '24-Hour On-Call Shift (All 5 Challenges)',
    },
    ambientTempC: 39,
    shiftTimeLabel: '02:00',
    timeLimitSec: 210,
    difficultyMultiplier: 2.3,
    rewardEur: 200,
    briefing: {
      es: 'La prueba definitiva: supera las 5 disciplinas de Farmacia Gallego en una sola noche de guardia para graduarte como Boticario Titular.',
      en: 'The ultimate test: master all 5 disciplines of Farmacia Gallego in a single night shift to graduate as Master Titular Pharmacist.',
    },
    tasks: [
      { type: 'coldchain', scenarioId: 'wave_calor_3' },
      { type: 'triage', scenarioId: 'triage_ulcer_headache' },
      { type: 'handwriting', scenarioId: 'rx_atorvastatina_40' },
      { type: 'compounding', scenarioId: 'lab_gel_terral' },
      { type: 'precinto', scenarioId: 'precinto_pensionista_4' },
    ],
  },
];

export function getTriageScenarioById(id: string): TriageScenario {
  const found = TRIAGE_SCENARIOS.find((s) => s.id === id);
  return found ?? TRIAGE_SCENARIOS[0];
}

export function getPrescriptionScenarioById(id: string): PrescriptionScenario {
  const found = PRESCRIPTION_SCENARIOS.find((s) => s.id === id);
  return found ?? PRESCRIPTION_SCENARIOS[0];
}

export function getCompoundingRecipeById(id: string): CompoundingRecipe {
  const found = COMPOUNDING_RECIPES.find((r) => r.id === id);
  return found ?? COMPOUNDING_RECIPES[0];
}

export function getPrecintoOrderById(id: string): PrecintoOrder {
  const found = PRECINTO_ORDERS.find((o) => o.id === id);
  return found ?? PRECINTO_ORDERS[0];
}

export function getColdChainWaveById(id: string): ColdChainWave {
  const found = COLD_CHAIN_WAVES.find((w) => w.id === id);
  return found ?? COLD_CHAIN_WAVES[0];
}
