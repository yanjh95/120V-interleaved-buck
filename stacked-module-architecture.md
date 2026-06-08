# Stacked Dual-Module Architecture

[![Status](https://img.shields.io/badge/Status-Architecture_Study-blue.svg)](#)
[![EMI](https://img.shields.io/badge/Goal-Radiated_EMI_Cancellation-green.svg)](#)
[![Modules](https://img.shields.io/badge/Modules-2x_600W-orange.svg)](#)

> [!NOTE]
> This document captures the architectural exploration of stacking two 600W converter modules (each based on the LTC7810 2-phase interleaved buck) with anti-parallel loop geometry to achieve far-field radiated EMI cancellation. Each module operates independently with its own regulated output.

---

## 1. Concept Overview

Two converter PCBs are mounted face-to-face on opposite surfaces of a central aluminum heatsink. The PCB layouts are **mirror images** of each other, and both modules are **synchronized to the same clock** with no phase offset between corresponding phases.

```
  ┌────────────────────────────────────────────┐
  │  PCB 1 (Top)                               │
  │  Phase 1 (0°) │ Phase 2 (180°)             │
  │  Loop:   →→→  │ Loop:   →→→               │
  └────────────────────────────────────────────┘
  ══════════ Aluminum Heatsink (5–10mm) ════════
  ┌────────────────────────────────────────────┐
  │  PCB 2 (Bottom) — mirrored layout          │
  │  Phase 3 (0°) │ Phase 4 (180°)             │
  │  Loop:   ←←←  │ Loop:   ←←←               │
  └────────────────────────────────────────────┘
```

Phase 1 and Phase 3 are directly stacked (separated only by the heatsink), switch at the same instant, and carry equal currents — but their loop current directions are geometrically anti-parallel. Their far-field magnetic dipole moments are therefore **equal and opposite**, achieving near-perfect cancellation.

---

## 2. System-Level Phase Map

| Phase | Module | Timing | Loop Direction | Dipole Pair |
|:---|:---:|:---:|:---:|:---:|
| Phase 1 | PCB 1 | 0° | → (forward) | ↔ cancels with Ph3 |
| Phase 2 | PCB 1 | 180° | → (forward) | ↔ cancels with Ph4 |
| Phase 3 | PCB 2 | 0° | ← (mirrored) | ↔ cancels with Ph1 |
| Phase 4 | PCB 2 | 180° | ← (mirrored) | ↔ cancels with Ph2 |

**Output:** Each PCB operates a fully independent 52V regulated output. The two outputs are not connected — each supplies its own load segment.

---

## 3. The Physics — Far-Field Magnetic Dipole Cancellation

### Why the Heatsink Does Not Prevent Cancellation

The aluminum heatsink blocks **near-field coupling** between the two boards via eddy current shielding. At 150 kHz, the skin depth in aluminum is approximately 0.21 mm. A 5 mm heatsink represents ~24 skin depths, attenuating inter-board near-field coupling by a factor of $e^{-24} \approx 10^{-11}$ — essentially zero. Each module operates completely independently.

However, **far-field radiated EMI** is governed by the net magnetic dipole moment of all sources, evaluated at the receiver (metres away). At 150 kHz:

$$\lambda = \frac{c}{f} = \frac{3 \times 10^8}{150{,}000} = 2{,}000 \text{ m}$$

The two boards are separated by ~10 mm = $\lambda/200{,}000$. To a far-field EMI detector, both boards appear to be at the **same point in space**. The heatsink between them is electromagnetically invisible to the far-field measurement.

### Dipole Cancellation Calculation

For Phase 1 and Phase 3 (0° timing, anti-parallel geometry):

$$\vec{m}_{Ph1} = +M \angle 0° \qquad \vec{m}_{Ph3} = -M \angle 0°$$

$$\vec{m}_{net} = M - M = 0$$

The net magnetic dipole moment is zero at every instant. The residual radiation falls off as a **magnetic quadrupole** — a factor of $(d/\lambda)$ weaker than a dipole at the same distance:

$$\left(\frac{d}{\lambda}\right) = \frac{10 \text{ mm}}{2{,}000 \text{ m}} = 5 \times 10^{-6}$$

### Why a Phase Offset Between Modules Would Be Wrong

For separate (unconnected) outputs, the cancellation **requires 0° phase offset** between corresponding phases. A 90° shift would destroy the cancellation:

$$\vec{m}_{net} = M\angle 0° + (-M\angle 90°) = M(1 - j) \implies |\vec{m}_{net}| = M\sqrt{2}$$

This would produce $\sqrt{2}$ **worse** far-field emissions than a single unmirrored module. A 90° offset is only beneficial when outputs are combined (to achieve 4× ripple frequency cancellation) — it does not apply here.

---

## 4. Expected EMI Improvement

| Frequency | Mechanism | Expected Reduction |
|:---|:---|:---:|
| 150 kHz (fundamental) | Dipole → quadrupole cancellation | **20 – 35 dB** |
| 300 kHz (2nd harmonic) | Same | **20 – 35 dB** |
| 600 kHz – 3 MHz (higher harmonics) | Same, degrades with current mismatch | **15 – 25 dB** |
| 10 – 100 MHz (ringing) | Geometric cancellation less precise | **5 – 15 dB** |

> [!NOTE]
> Practical cancellation is limited by how well-matched the two modules are — MOSFET threshold spread, dead-time variation, and PCB trace length differences all contribute to imperfect cancellation. 20–30 dB improvement is a realistic design target. Perfect cancellation would require trimmed, matched components.

> [!IMPORTANT]
> This technique addresses **radiated** emissions only. Conducted EMI (propagating back onto the 120V input bus) still requires proper input filtering (LC filter + Y-capacitors) on each module independently.

---

## 5. Intra-Module EMI Cancellation (Already Present)

Each 2-phase interleaved module already achieves partial EMI cancellation internally via the AN-136 symmetric layout. By placing the $C_{IN}$ array centrally between both high-side MOSFET drain nodes, the two phases produce opposing magnetic fields that partially cancel within the board's own layer structure.

The stacked-module architecture extends this principle to the system level:

| Level | Mechanism | Scope |
|:---|:---|:---|
| **Intra-layer** | L2 PGND plane eddy currents | Contains switching flux within PCB layer structure |
| **Intra-module** | AN-136 symmetric interleaved layout | Partial cancellation between Ph1 and Ph2 loops |
| **Inter-module** | Anti-parallel stacked geometry | Far-field cancellation between PCB1 and PCB2 |

---

## 6. Synchronization Implementation

Both LTC7810 controllers must share the **exact same switching frequency**. Any frequency offset makes the phase relationship between modules drift continuously, causing the cancellation to oscillate between constructive (additive) and destructive (cancelling) states — far worse than no synchronization at all.

### Recommended Synchronization Architecture

```
Crystal oscillator or clock IC (150 kHz)
        │
        ├──→ LTC7810 #1 PLLIN/MODE pin (PCB1)
        │         Ph1 = 0°, Ph2 = 180° (set by internal 2-phase interleaving)
        │
        └──→ LTC7810 #2 PLLIN/MODE pin (PCB2)
                  Ph3 = 0°, Ph4 = 180° (same as PCB1 — no offset)
```

* The LTC7810 `PLLIN/MODE` pin accepts an external clock to lock the switching frequency.
* Both ICs receive the same rising edge and therefore phase-lock to 0° relative to each other.
* The geometric mirroring (not the clock) creates the EMI cancellation — the clock only ensures the two modules stay locked over temperature and load.
* A simple resistor-set clock oscillator (e.g., 74HC-series CMOS or dedicated clock IC) driving both PLLIN pins is sufficient.

---

## 7. Mechanical & Electrical Implementation

### Heatsink Role

The aluminum heatsink serves **only as a thermal component** in this architecture — it plays no electromagnetic role. Its requirements:

* Must provide adequate thermal resistance from both PCB surfaces to ambient
* Each face receives heat from one module: ~600W total per face in worst case
* Gap pad on each face must be rated for the maximum voltage present on each PCB's Layer 4 (120V for VIN/SW pads — confirm ≥1000V dielectric withstand rating per gap pad datasheet)

### Clamping & Assembly

Both PCBs must maintain controlled contact pressure on the gap pad surfaces for consistent thermal resistance. A metal clamping bracket or standoff array around the perimeter of the sandwich is required. Do not rely on fasteners through the PCBs alone — uneven pressure reduces thermal contact and creates mechanical stress on the solder joints.

### Electrical Isolation

The aluminum heatsink sits between two boards each carrying 120V. The gap pads on both sides must electrically isolate the PCBs from the aluminum:

| Interface | Voltage | Gap Pad Requirement |
|:---|:---:|:---|
| PCB1 → Heatsink | Up to 120V (SW/VIN pads on L4) | ≥1000V dielectric withstand |
| PCB2 → Heatsink | Up to 120V (SW/VIN pads on L4) | ≥1000V dielectric withstand |

The heatsink itself should be connected to chassis ground through the board's Y-capacitor network — this is the same chassis grounding strategy described in [PCB-layout.md §6](PCB-layout.md#6-chassis-grounding--esd-emi-layout-guidelines). Only **one** mounting hole per module should be the active chassis connection.

### Loop Geometry Verification

Before fabrication, verify the mirrored loop direction by tracing the current path on PCB2's Altium layout:

1. Follow the current path: VIN → HS MOSFET drain → HS source (SW) → inductor → VOUT → C_OUT → GND → LS source → LS drain → GND → C_IN → VIN
2. Viewed from the **top** (component side) of PCB2, the high di/dt loop (VIN cap → HS → LS → back) must circulate in the **opposite rotational direction** compared to PCB1 viewed from its top (component side).
3. If the loops appear to circulate in the same direction when both boards are viewed from their respective component sides, the geometry is correct — because PCB2 is flipped upside-down in the sandwich, what appears clockwise from PCB2's component side appears counter-clockwise from the outside of the sandwich.

---

## 8. Summary

| Attribute | Value |
|:---|:---|
| Total system power | 1200W (2× 600W modules) |
| Phases per module | 2 (interleaved, 180° apart) |
| Inter-module phase offset | **0°** (Phase 1 ↔ Phase 3 in sync) |
| Inter-module loop geometry | **Anti-parallel (mirrored layout)** |
| Output topology | **Independent** — two separate 52V outputs, not combined |
| EMI cancellation mechanism | Far-field magnetic dipole cancellation |
| Expected radiated EMI improvement | **20–35 dB** at fundamental and low harmonics |
| Conducted EMI | Not addressed — requires input filter on each module |
| Synchronization | Shared external clock → both LTC7810 PLLIN pins |
| Heatsink role | Thermal only — electromagnetic role is negligible |
| Gap pad voltage requirement | ≥1000V dielectric withstand per face |
