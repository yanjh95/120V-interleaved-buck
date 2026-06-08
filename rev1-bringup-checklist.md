# Rev1 Bring-Up Checklist

Step-by-step bring-up procedure for the **120V → 52V 2-Phase Interleaved Synchronous Buck — PCB Rev 1**.
Work through each phase sequentially. Do not advance to the next phase until all items in the current phase are confirmed.

> [!CAUTION]
> This board operates at **up to 120V DC input**. This is a lethal voltage. Use a fully insulated bench enclosure, one-hand rule, and never touch the board while powered. Use a bench supply with a current limit set before applying power.

---

## Equipment Required

| Equipment | Minimum Spec |
|:---|:---|
| Variable DC bench supply | 0–130V, ≥ 3A, current-limiting |
| Digital multimeter (×2) | 4.5-digit, 200V DC range |
| Oscilloscope | 4-channel, ≥ 200 MHz BW, ≥ 1 GSa/s |
| Differential probe | ≥ 500V, ≥ 100 MHz BW (for SW node at 120V) |
| Current probe | DC–50 MHz, ≥ 10A |
| Electronic load | 52V rated, ≥ 15A continuous |
| IR camera or thermocouple | For MOSFET and inductor thermal check |
| Network analyser *(optional)* | For Bode plot / phase margin measurement |

---

## Phase 0 — Pre-Power Visual & Resistance Checks

> [!IMPORTANT]
> Board must be completely unpowered. Perform all resistance checks with a DMM in Ω mode.

### 0A. Visual Inspection
- [ ] No solder bridges visible on QFN pads (U1 LTC7810), MOSFET pads (Q1–Q4), or sense resistor pads
- [ ] All polarised capacitors (C16, C17 electrolytics; C29 input electrolytic) installed with correct polarity
- [ ] All MOSFETs (Q1–Q4) installed in correct orientation (gate pad identified)
- [ ] No missing components (compare to [component-reference.md](component-reference.md))
- [ ] DNP components (RC snubber) are **not** populated
- [ ] Fuse F1 installed

### 0B. Resistance Checks (DMM, board unpowered)
- [ ] **VIN to GND:** > 100 kΩ (should not be shorted — fuse and input capacitors only)
- [ ] **VOUT to GND:** > 10 kΩ (electrolytics and MLCCs only)
- [ ] **SW1 to GND:** ~0 Ω (low-side MOSFET Q2 body diode path — expected)
- [ ] **SW2 to GND:** ~0 Ω (low-side MOSFET Q4 body diode path — expected)
- [ ] **INTVCC (U1 pin) to GND:** > 1 kΩ (bypass cap only)
- [ ] **VCCIN (U1 pin) to GND:** > 1 kΩ
- [ ] **RUN (U1 pin) to GND:** ~1.2 MΩ (R3 only, before C_RUN charges)

---

## Phase 1 — Low-Voltage Controller Bias Check (No Switching)

**Goal:** Verify the LTC7810 powers up, INTVCC regulates, and the RUN/UVLO thresholds are correct — all at a safe, low input voltage before applying 120V.

> [!NOTE]
> The LTC7810 VCCIN range is 4V–140V. Apply 15V for this phase to keep things safe while the internal 5V LDO regulates INTVCC.

**Setup:** Bench supply → VIN (current limit: 150 mA). No load on VOUT.

- [ ] Apply **15V** to VIN
- [ ] Verify **INTVCC = 5.0V ± 0.25V** (TP8 or U1 INTVCC pin)
- [ ] Verify **VCCIN = 15V** at the U1 VCCIN bypass cap
- [ ] Verify **RUN pin voltage** is above 1.22V (UVLO comparator threshold) — should be ~1.35V at 15V input based on R3/R4/R5 divider
- [ ] Verify **no output voltage** on VOUT (switching should not occur without valid VIN)
- [ ] Check **IMON / ITH pin:** should be close to 0V (no current command)
- [ ] Remove 15V supply

---

## Phase 2 — UVLO Threshold Verification

**Goal:** Confirm the programmed undervoltage lockout window is correct (turn-on ≥ 90V, turn-off ≤ 85V).

**Setup:** Bench supply → VIN (current limit: 100 mA). Oscilloscope on VOUT.

- [ ] Slowly ramp VIN from 0V upward, monitor RUN pin
- [ ] Record **VIN at which RUN pin crosses 1.22V** (controller enables) — target: **90V ± 3V**
- [ ] Verify VOUT begins to rise once RUN crosses threshold
- [ ] Slowly ramp VIN back down, record **VIN at which VOUT collapses** (hysteresis) — target: ~**85V**
- [ ] Confirm turn-on and turn-off thresholds match [power-stage-calculations.md](power-stage-calculations.md) Section 6A

> [!NOTE]
> If thresholds are off, trim R4 (middle divider resistor) to adjust. See Section 6A of the calculations document.

---

## Phase 3 — First Switch-On (No Load, Nominal VIN)

**Goal:** Verify the converter switches correctly at no load, both phases operating, correct frequency and 180° interleaving.

**Setup:** Bench supply → VIN at **98V** (nominal). Current limit: **500 mA**. No load on VOUT. Oscilloscope on SW1 (TP1), SW2 (TP10), VOUT.

> [!WARNING]
> Use a **differential probe** for the SW nodes — they switch between 0V and ~98V. A standard 10× passive probe referenced to GND is acceptable only if the scope ground clip is on PGND.

- [ ] Apply **98V** to VIN
- [ ] Verify **VOUT = 52V ± 0.5V** (< 1% error)
- [ ] Probe SW1: verify **square wave at ~150 kHz**, duty cycle ~50%
- [ ] Probe SW2: verify **square wave at ~150 kHz**, duty cycle ~50%, **180° phase-shifted from SW1**
- [ ] Record actual **switching frequency** from oscilloscope (target: 150–160 kHz)
- [ ] Check SW node waveforms for excessive ringing (overshoot > 20% above VIN = concern)
- [ ] Verify **VOUT ripple** at no load is < 500 mV pk-pk (mostly inductor DCM ripple at no load)
- [ ] Check **gate drive waveforms** (TG1, BG1) — clean transitions, no shoot-through overlap

---

## Phase 4 — Input Voltage Sweep (No Load)

**Goal:** Confirm regulation holds across the full 95–120V input range.

- [ ] With VOUT oscilloscope probe connected, sweep VIN from **95V → 120V** in ~5V steps
- [ ] Record VOUT at each step — should remain **52.0V ± 0.5V**
- [ ] Verify duty cycle changes as expected: D = 52/VIN (54.7% at 95V → 43.3% at 120V)
- [ ] Check for any instability or oscillation at any operating point

---

## Phase 5 — Load Stepping & Regulation

**Goal:** Verify load regulation and transient response under increasing load.

**Setup:** Electronic load on VOUT. Oscilloscope on VOUT (AC-coupled, 50 mV/div) and inductor current (current probe on L1).

Apply load in steps, allowing temperature to stabilise between each step:

| Step | Load Current | Expected VOUT | Action |
|:---:|:---:|:---:|:---|
| 1 | 1 A | 52.0V ± 0.5V | Check ripple, waveforms |
| 2 | 3 A | 52.0V ± 0.5V | Monitor MOSFET temp |
| 3 | 6 A | 52.0V ± 0.5V | Full single-rail load |
| 4 | 9 A | 52.0V ± 1.0V | Over-rated — OCP should trigger |
| 5 | **12 A** | 52.0V ± 0.5V | Two PCBs in parallel only |

- [ ] **Step 1:** VOUT in regulation, no ringing
- [ ] **Step 2:** VOUT in regulation, inductor current sharing between phases confirmed
- [ ] **Step 3:** VOUT in regulation, efficiency measured: η = VOUT × IOUT / (VIN × IIN) — target **> 96%**
- [ ] **Step 4:** Confirm OCP trips (LTC7810 cycle-by-cycle) — VOUT folds back or hiccups
- [ ] **Load step transient:** Step load 0 A → 6 A at 10 A/µs, measure ΔVout — target **< 5% (< 2.6V)**

---

## Phase 6 — Thermal Verification

**Goal:** Confirm all devices are within safe temperature limits at full load in the target thermal environment.

**Setup:** Sustained full load (6A per rail), VIN = 110V. Run for **10 minutes minimum**. Use IR camera or thermocouple.

- [ ] **Q1, Q3 (high-side MOSFETs):** Case temperature < **100°C** — if above, consider Rev2 parallel MOSFET option
- [ ] **Q2, Q4 (low-side MOSFETs):** Case temperature < **85°C**
- [ ] **L1, L2 (inductors):** Surface temperature < **100°C** (Vishay IHLP-8787MZ rated to 125°C)
- [ ] **U1 (LTC7810):** Package top temperature < **85°C**
- [ ] **R_SENSE1, R_SENSE2:** Temperature < **80°C** (0.5W rated, expected ~0.3W dissipation)
- [ ] **Board surface (bottom):** Check for any unexpected hot spots using IR camera

> [!NOTE]
> The high-side MOSFET thermal result here determines whether a Rev2 redesign with parallel high-side MOSFETs is necessary. See [power-stage-calculations.md](power-stage-calculations.md) Section 9 for the thermal analysis.

---

## Phase 7 — Loop Stability (Bode Plot)

**Goal:** Measure the actual loop gain to verify phase margin ≥ 45°. The LTpowerCAD simulation shows only 26° with the initial component values — bench tuning is expected.

**Setup:** Network analyser injection transformer on the compensation network (ITH node). See [v1-simulation.md](v1-simulation.md) for simulation baseline.

- [ ] Inject small AC perturbation at ITH node, sweep 100 Hz – 1 MHz
- [ ] Record **crossover frequency** — target ~25 kHz
- [ ] Record **phase margin** — target ≥ 45°
- [ ] If phase margin < 45°: increase C_comp (try 22 nF, 47 nF) and re-measure
- [ ] If bandwidth is too low: decrease C_comp or increase R_comp
- [ ] Document final tuned values of R_comp, C_comp, C_filter

---

## Phase 8 — Protection Verification

### 8A. Overcurrent Protection
- [ ] With current-limiting electronic load, gradually increase load beyond 7.5A per rail
- [ ] Confirm LTC7810 enters hiccup / fold-back mode (LED or VOUT collapse visible)
- [ ] Verify the board recovers cleanly once overcurrent condition is removed

### 8B. Input Undervoltage Lockout
- [ ] At full load, ramp VIN down from 98V until VOUT collapses
- [ ] Record turn-off voltage — target ~85V
- [ ] Confirm clean shutdown (no latch-up or shoot-through)

### 8C. Output Overvoltage (TVS)
- [ ] With no load, briefly force VOUT above 60V using an external supply (simulate regenerative motor energy)
- [ ] Confirm SMCJ60A TVS clamps and limits VOUT — TVS should become warm
- [ ] Verify no damage to MOSFETs or controller

---

## Phase 9 — EXTVCC Bias Option Evaluation

Two bias options are available on the U2 footprint. Evaluate one at a time:

- [ ] **Option A (Zener dropper):** Populate SMAZ12 or 1SMA5937 Zener. Measure EXTVCC pin voltage. Verify LTC7810 draws ~14 mA from EXTVCC.
- [ ] **Option B (Buck module TPSM365R6):** Populate buck module and feedback divider. Verify 12V regulated output on EXTVCC.
- [ ] Compare thermal dissipation of U1 between both options (Option B should run cooler)

---

## Sign-Off Summary

| Phase | Description | Pass / Fail | Notes |
|:---:|:---|:---:|:---|
| 0 | Pre-power visual & resistance | | |
| 1 | Low-voltage controller bias | | |
| 2 | UVLO thresholds | | |
| 3 | First switch-on, no load | | |
| 4 | Input voltage sweep | | |
| 5 | Load stepping & regulation | | |
| 6 | Thermal verification | | |
| 7 | Loop stability (Bode plot) | | |
| 8 | Protection verification | | |
| 9 | EXTVCC bias evaluation | | |

**Board serial number / date:** _______________

**Tester:** _______________

**Final status:** ☐ Pass — proceed to Rev1 system integration &nbsp;&nbsp; ☐ Fail — see notes above
