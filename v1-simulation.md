# V1 LTpowerCAD Simulation Results

LTpowerCAD average-model simulation of the LTC7810 dual 2-phase synchronous buck.
Tool: **LTpowerCAD** (Analog Devices) using the built-in LTC7810 Demo Board template (DC2529A).

> [!WARNING]
> **Phase margin is low (26.24°).** The current compensation network requires bench tuning before this design should be considered stable under all operating conditions. See the Loop Gain section below.

---

## 1. Circuit Configuration

![LTpowerCAD circuit schematic view](LTpowerCAD-sim/LTpowerCAD%20Circuit%20picture.png)

### Key simulation parameters

| Parameter | Value |
|:---|:---:|
| Vin min / nom / max | 95 V / 110 V / 120 V |
| Vout (both rails) | 52 V |
| Iout per rail | 6 A |
| Switching Frequency (actual) | **157 kHz** |
| R_FREQ (programmed) | 32.4 kΩ |
| Inductor | Vishay IHLP-8787MZE — 82 µH, DCR 31.46 mΩ |
| Control MOSFET | FDMS86252 — 1× per position |
| Sync MOSFET | FDMS86252 — 1× per position |
| R_SENSE | 9.0 mΩ (actual) |
| Compensation (Rth / Cth / Cthp) | 30.1 kΩ / 6800 pF / 68 pF |

> [!NOTE]
> The simulation uses **Rfreq = 32.4 kΩ**, which LTpowerCAD resolves to an **actual Fsw of 157 kHz** — slightly above the 150 kHz design target. This is consistent with the VCO characteristic of the LTC7810. The schematic places **30.1 kΩ** (formula value), which will produce a slightly lower frequency. Verify on the bench.

---

## 2. Power Loss & Efficiency

![LTpowerCAD power loss breakdown at full load](LTpowerCAD-sim/LTpowerCAD%20power%20loss.png)

### Full-load summary (one 52V rail, 6A output, Vin = 98.1 V)

| Loss Component | Simulated (W) | Share |
|:---|:---:|:---:|
| Control FET Conduction | 0.812 | 20.7% |
| Control FET Turn-On | 0.305 | 7.8% |
| Control FET Turn-Off | 0.069 | 1.8% |
| Control FET Gate Drive | 0.011 | 0.3% |
| **Control FET Total** | **1.197** | **30.5%** |
| Sync FET Conduction | 0.905 | 23.1% |
| Sync FET Gate Drive | 0.011 | 0.3% |
| Sync FET Body Diode | 0.051 | 1.3% |
| **Sync FET Total** | **0.967** | **24.7%** |
| Inductor DCR | 1.144 | 29.2% |
| R_SENSE | 0.327 | 8.3% |
| IC LDO | 0.285 | 7.3% |
| **Total PLoss** | **3.921 W** | — |
| Output Power | 312 W | — |
| **Efficiency** | **98.76%** | — |

### Simulation vs. hand calculation comparison

| Loss Item | Hand Calc (worst case) | LTpowerCAD Sim |
|:---|:---:|:---:|
| Control FET (high-side) total | **4.37 W** | **1.197 W** |
| Sync FET (low-side) total | 1.54 W | 0.967 W |
| Total FET losses | 5.91 W | 2.164 W |

> [!NOTE]
> The 3.7× gap between the hand calculation (4.37W) and simulation (1.197W) for the high-side FET is expected. The hand calculation uses **maximum datasheet Qrr (98 nC)** and a **conservative 15 ns switching window**, while LTpowerCAD uses realistic average-model waveforms at nominal Vin (98V) with typical device parameters. The hand calculation is a safe thermal ceiling; the simulation reflects the expected operating point.

---

## 3. Loop Gain (Bode Plot) & Load Transient

![LTpowerCAD loop gain and load transient](LTpowerCAD-sim/LTpowerCAD%20transient.png)

### Loop gain summary

| Parameter | Value | Target |
|:---|:---:|:---:|
| Crossover Frequency (BW) | 25.12 kHz | 25 kHz ✅ |
| Phase Margin | **26.24°** | **≥ 45°** ⚠️ |
| Gain @ Fsw/2 (75 kHz) | −19.77 dB | < −20 dB ✅ |
| Gain Margin (@ −180°) | −8.58 dB | < −10 dB ⚠️ |

> [!CAUTION]
> **Phase margin of 26.24° is below the minimum recommended 45°.** This compensation network (Rth = 30.1 kΩ, Cth = 6800 pF, Cthp = 68 pF) will be marginally stable and may exhibit ringing or oscillation under load transients, component variation, or temperature change. The compensation **must be re-tuned on the bench** using a Bode plot analyser before extended operation.

### Load transient summary

| Parameter | Value | Budget |
|:---|:---:|:---:|
| Load step | 0 A → 6 A (10 A/µs) | — |
| Output ripple (ΔVo ripple) | 0.05% = 26 mV | — |
| Output step deviation (ΔVo step) | 2.63% = 1.37 V | 5% |
| **Total ΔVo** | **2.68% = 1.39 V** | **5% ✅** |

The transient response is within the 5% sag budget even with the low phase margin, primarily because the 22 µF bulk electrolytic provides most of the initial charge. However, the oscillatory recovery visible in the Vout trace confirms the low phase margin.

---

## 4. Open Items from Simulation

| # | Finding | Action |
|:---|:---|:---|
| 1 | Phase margin 26.24° — below target 45° | Re-tune Cth (try 12 nF) and/or increase Rth on the bench |
| 2 | Actual Fsw 157 kHz with 32.4 kΩ vs 150 kHz target | Measure TG frequency on Rev1 board; trim R_FREQ if needed |
| 3 | Control FET losses 1.2 W (sim) vs 4.37 W (hand calc) | IR camera verification on Rev1 — expect significantly lower junction temp than worst-case hand calc |
| 4 | Gain margin only −8.58 dB | Will improve once phase margin is corrected |
