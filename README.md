# Farmacia Gallego: Botica de Guardia

An interactive 2D pharmacy simulation and mini-game collection set in **Andalucía, Spain**, written in **TypeScript** with **HTML5 `<canvas>`**, responsive **Mobile & Desktop UI**, **Spanish (`es`) & English (`en`) multilingual support**, and `localStorage` persistence.

## Five Playable Mini-Games

1. **Mostrador: Triaje y Consejo (Counter Symptom Triage & Advice)** — Question patients at the counter, check for red-flag emergencies (*Urgencias*) or drug contraindications (such as NSAIDs in gastric ulcer patients or illegal antibiotic demands without a prescription), and dispense the right remedy + counseling.
2. **Receta Médica Ilegible (Doctor's Bad Handwriting Decoder)** — Sweep the magnifying loupe and UV ink-contrast filter across Dr. Gregorio's messy cursive prescriptions to decode the active principle, dosage strength, and posology.
3. **Rebotica: Laboratorio de Fórmulas Magistrales (Backroom Lab Compounding)** — Weigh active powders on the analytical balance, micronize in the porcelain mortar & pestle, align the liquid meniscus in the graduated cylinder, and emulsify in the *Baño María* water bath.
4. **Corte de Cupón Precinto y Receta Electrónica (Box-Cutter Barcode Slicing & Co-Pay)** — Slice the perforated *cupón precinto* barcode flap off Spanish medicine boxes without puncturing the blister foil, stamp the **Farmacia Gallego** seal, and charge the right *Tarjeta Sanitaria Andaluza* co-pay tier.
5. **Cajonera y Cadena de Frío (Apothecary Drawers & Cold-Chain Rush)** — Protect thermolabile vaccines and insulins (`2°C–8°C`) from the `42°C` Andalusian *terral* heatwave while routing narcotics (`●`) to the safe and expired boxes to the **Punto SIGRE** bin.

## Development & Automated Playthrough Testing

```bash
npm install
npm test          # Run Vitest suite + 10-Level Autonomous BoticarioBot Playthrough
npm run dev       # Start local dev server on http://127.0.0.1:5173
npm run build     # Build self-contained static bundle in dist/
```
