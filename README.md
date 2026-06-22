# 120V-interleaved-buck

Design and validation repository for a wide-input-range synchronous buck converter based on the **Analog Devices LTC7810** dual-phase interleaved controller. The IC supports a 4V–140V input range with a 1V–60V programmable output, making it well suited for high-voltage battery-powered systems. The first version targets a **95–120V DC input, 52V regulated output**, implemented as two identical 600W modular PCBs running in parallel. Includes calculations, component selection, simulations, PCB layout guidelines, and test results.

## High-Level 52 V Converter Requirements
*Note: All design choices, topology selections, and component specifications must be strictly guided by and evaluated against these requirements.*
* 🔌 **Input:** 95-120 VDC input source.
* 🎯 **Output:** Regulated 52 VDC output.
* ⚡ **Power:** Each PCB delivers **600W** total (**300W per phase**). Two identical PCBs are stacked together to achieve **1.2kW total output power**.
* 🚀 **Load:** Supply 8 BLDC motors driven by ESCs (**4 motors per PCB**).
* 🌡️ **Environment:** Operate in a 65°C ambient environment.
* 🛡️ **Enclosure:** Housed in an IP65-rated enclosure.
* ⚖️ **Weight:** Complete converter assembly, including the enclosure, shall weigh less than 1 kg.
* 📐 **Volume:** The final assembly shall be smaller than 1500 cm³.
* 💰 **Cost:** The total Bill of Materials (BOM) cost must be less than $150.
* 📈 **Dynamic Loading:** The 52 V bus shall support dynamic ESC and motor loading, including startup, acceleration, braking, and simultaneous motor load changes.
* 🔥 **Thermals:** The design shall account for limited airflow and thermal constraints associated with a sealed enclosure.
* 🚨 **Protection:** Include suitable protection for fault conditions, including overcurrent, short circuit, overtemperature, input undervoltage, and output overvoltage.
* 🗺️ **Architecture:** 2-Phase Interleaved Synchronous Buck per PCB (two identical parallel PCBs yielding 4 phases total).
* 📻 **Telemetry (Optional):** The primary design philosophy is to create a highly robust, deterministic system that relies on hardware-level protection and conservative component derating such that it will not fail under specified constraints. If this level of robustness is achieved, active telemetry reporting to a host controller may be omitted entirely.

## Architecture & Design Documents
* [Topology Trade Study](converter_topologies.md) - A detailed breakdown of the various macro-topologies (LLC, Flyback, Buck) and technologies (GaN vs. Silicon) evaluated against the strict project constraints.
* [PCB Layout Guidelines](PCB-layout.md) - Critical routing, grounding, and thermal management rules for the 120V interleaved power stage.
* [Power Stage Calculations](power-stage-calculations.md) - Full component sizing derivations: inductors, capacitors, MOSFETs, loop compensation, and protection circuits.
* [Component Quick Reference](component-reference.md) - Locked-in BOM with part numbers, badge values, and key specifications for every component on the PCB.
* [V1 Simulation Results](v1-simulation.md) - LTpowerCAD average-model simulation: power loss breakdown, efficiency, loop gain (Bode plot), and load transient response.

## Design Guardrails
### 1. Electrical Power Stage
* **DG-E01 (Inductor & Frequency Locked):** The primary inductor is locked to the [Vishay 82 µH](ihlp8787mz51.pdf) inductor (e.g. IHLP-8787MZ-51, 9.0A Saturation). At 52V output, this provides a highly robust 31.8% saturation safety margin under full load. The target switching frequency is **150 kHz** to minimize MOSFET switching losses in the 65°C ambient environment.
* **DG-E02 (Controller IC):** The design uses **one Analog Devices LTC7810** dual-channel synchronous buck controller per PCB. The two channels are natively run 180° out-of-phase to create a robust 2-phase interleaved architecture without requiring external clock synchronization.
* **DG-E03 (MOSFET Array):** The **onsemi FDMS86252** (150V, 51mΩ, 5x6mm PQFN package) is locked in for all 4 positions per PCB (8 positions total across the two PCBs). Total conduction heat is mathematically verified to be ~3.4 Watts per PCB at full load, which is safely managed by thermal vias in the sealed enclosure.
* **DG-E04 (Capacitor Array):** The 2-phase interleaved architecture operating near 50% duty cycle drastically reduces the need for bulk capacitance — the two phases draw current in an alternating pattern that partially cancels the input and output ripple currents, reducing the effective ripple to a fraction of what a single-phase design would require. Specific capacitor values are sized in the Power Stage Design Calculations section. The PCB layout shall reserve **at least one electrolytic capacitor footprint per phase** on both the input and output rails (2 input, 2 output per PCB) to allow bulk capacitance to be tuned during bring-up without a board respin.
* **DG-M01 (Assembly Style):** **Single-Sided SMT (Surface Mount Technology) assembly**. No through-hole (THT) components shall protrude from the bottom layer.
* **DG-M02 (Thermal Interface):** The bottom layer of the PCB will remain completely flat and devoid of components to act as a direct thermal conduction interface to the heatsink.
* **DG-M03 (Thermal Vias):** Dense thermal via arrays will be placed directly beneath all high-dissipation SMD components.

> [!NOTE]
> **V1 Prototype Protection (Starter):** A formal fault and failure analysis is deferred to a later revision. For this first prototype, protection is provided by two mechanisms: (1) a **fuse on the 120V input** to protect against catastrophic overcurrent and short-circuit conditions, and (2) the **LTC7810's built-in cycle-by-cycle overcurrent protection**, which limits phase current by monitoring the voltage drop across the sense resistors and cutting off the high-side gate drive when the threshold is exceeded. More robust protection (OVP comparator, latching fault logic, thermal shutdown integration) will be added once the basic power stage is validated.


---

## Rev1 Hardware

**Status: PCB layout complete — awaiting fabrication and bring-up.**

![Rev1 PCB — 3D render with components placed](Rev1%20layout%20photos/3D%20with%20components.png)

*48V Buck Dual Phase Rev 1 — Altium 3D render, top side with all components placed.*

### Bring-Up
See **[Rev1 Bring-Up Checklist](rev1-bringup-checklist.md)** for the step-by-step power-on, regulation, thermal, and loop stability verification procedure.

### Layer renders
Additional per-layer renders (top copper, inner planes, bottom thermal interface) are in the [`Rev1 layout photos/`](Rev1%20layout%20photos/) folder.

---

## Hardware V2 — Stacked PCB EMI Cancellation Package

**Status: Architecture study complete — pending Rev1 validation before implementation.**

V2 introduces a **mechanical packaging strategy** designed to achieve far-field radiated EMI cancellation across the entire 1.2kW converter assembly. Rather than treating the two 600W PCBs as independent modules mounted side-by-side, V2 **stacks them face-to-face** with a shared aluminum heatsink between them, creating a compact sandwich structure where the electromagnetic fields of opposing phases cancel in all directions.

![Whiteboard sketch — stacked PCB EMI cancellation concept showing mirrored current loops and B-field cancellation](V2%20design%20photos/stacked-pcb-emi-cancellation-whiteboard.png)

*Whiteboard sketch illustrating the stacked PCB concept: two mirrored boards produce anti-parallel current loops (red/blue arrows), resulting in opposing magnetic field vectors (B) that cancel in the far field.*

### Core Principle

The two PCBs use **identical but mirrored layouts**. When stacked face-to-face, the high-di/dt switching current loops on each board circulate in **opposite rotational directions** as seen from outside the sandwich. The 4 phases across both boards are linked as follows:

| Pair | Phases | Timing | Loop Geometry | Result |
|:---|:---:|:---:|:---:|:---|
| **Pair A** | Phase 1 (PCB1) ↔ Phase 3 (PCB2) | Switch at **0°** simultaneously | Anti-parallel (mirrored) | Magnetic dipole cancellation |
| **Pair B** | Phase 2 (PCB1) ↔ Phase 4 (PCB2) | Switch at **180°** simultaneously | Anti-parallel (mirrored) | Magnetic dipole cancellation |

At any given instant, one pair of mirrored phases is conducting while the other pair is 180° offset — and **both pairs independently achieve field cancellation**. The net far-field magnetic dipole moment of the assembly is driven to near zero, with residual radiation falling to the much weaker quadrupole level (**20–35 dB reduction** at the switching fundamental and low harmonics).

### Key Design Elements

* **Synchronized Clocking:** Both LTC7810 controllers share an external clock signal on their `PLLIN/MODE` pins, ensuring Phase 1 and Phase 3 switch on the exact same rising edge (0° offset between modules). The 180° interleaving between phases on each board is handled natively by the LTC7810.
* **Mirrored Layout:** PCB2 is a geometric mirror of PCB1. When flipped upside-down in the sandwich, what appears as a clockwise current loop from PCB2's component side becomes counter-clockwise from outside — creating the anti-parallel geometry needed for cancellation.
* **Thermal Heatsink Sandwich:** A 5–10mm aluminum heatsink between the boards serves purely as a thermal conductor. At 150 kHz, the skin depth in aluminum is ~0.21mm, so the heatsink attenuates inter-board near-field coupling to near zero — but this is irrelevant to far-field cancellation, since both boards appear at the same point in space to any EMI detector (λ = 2,000m at 150 kHz, board separation = λ/200,000).
* **Electrical Isolation:** Gap pads with ≥1000V dielectric withstand rating isolate both PCBs from the aluminum heatsink, which is tied to chassis ground through Y-capacitors.

### Full Architecture Document

See **[Stacked Dual-Module Architecture](stacked-module-architecture.md)** for the complete physics derivation, synchronization implementation details, mechanical assembly requirements, and expected EMI improvement tables.
