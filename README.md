# dwiju-bhilodiya-health-robo
"World-class Gujarati AI Voice Robo with 180+ modules."

## Original master data verification
CI intentionally fails until the **original, source-traceable** datasets are provided:
- `data/features.json` — JSON array of 4,410 distinct feature records with stable `id`.
- `data/benefits.json` — JSON array of 75,867 distinct benefit records with stable `id`.

Do not generate synthetic rows or change the expected counts to make CI green.
The verifier prints SHA-256 and checks missing/duplicate IDs. Provenance and cross-file references still require a separate audit.
