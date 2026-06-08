# Locked-In Component Quick Reference

Verified component reference card for all active and passive components on each 600W PCB.
Companion to the [main README](README.md) and [Power Stage Calculations](power-stage-calculations.md).

---

## 📋 Locked-In Component Quick Reference

Below is the verified, simulation-synchronized component reference card for both active and passive components on each 600W PCB:

### 1. Active Silicon & Power Semiconductors

| Component Function | Design Reference | Locked-In Part/Badge | Key Specifications & Package |
| :--- | :--- | :--- | :--- |
| **Dual-Channel Controller** | U1 | ![](https://img.shields.io/badge/IC-LTC7810-red.svg) | Analog Devices, dual-phase interleaved, 6V-10V programmable gate drive (QFN-48) |
| **Power MOSFETs** | Q1, Q2, Q3, Q4 | ![](https://img.shields.io/badge/MOSFET-FDMS86252-green.svg) | onsemi, N-Channel, 150V, 51mΩ max, Qg = 11nC typical, RθJC = 2.5 °C/W (8-PQFN 5x6) |
| **Bootstrap Diodes** | D_BOOT1, D_BOOT2 | ![](https://img.shields.io/badge/Diode-CMPD3003-orange.svg) | Central Semi, Ultra-low Leakage (10nA @ 180V max), 180V, 200mA (SOT-23) |
| **Output TVS Diode** | D_TVS | ![](https://img.shields.io/badge/Diode-SMCJ60A-red.svg) | Littelfuse, TVS, 60V Standoff, 96.8V max clamp, 1500W (SMC) |


### 2. Primary Passive Programming & Power Stage Components

| Component Function | Design Reference | Locked-In Value Badge | Specification & Tolerances |
| :--- | :--- | :--- | :--- |
| **Power Inductor** | L1, L2 | ![](https://img.shields.io/badge/Value-82_%CE%BCH-brightgreen.svg) | [Vishay IHLP-8787MZ-51](ihlp8787mz51.pdf) (9.0A Saturation) |
| **Current Sense Shunt** | R_SENSE1, R_SENSE2 | ![](https://img.shields.io/badge/Value-9.0_m%CE%A9-orange.svg) | High-Precision Shunt (1% Tolerance, 1206 Size, 0.5W) |
| **Switching Frequency Resistor** | R_FREQ | ![](https://img.shields.io/badge/Value-30.1_k%CE%A9-blue.svg) | VCO Programming Resistor (1% Tolerance, 0603 Size) |
| **Feedback Divider (Top)** | R_top | ![](https://img.shields.io/badge/Value-510_k%CE%A9-purple.svg) | Precision Feedback (0.1% Tolerance, E96 Standard) |
| **Feedback Divider (Bottom)** | R_bottom | ![](https://img.shields.io/badge/Value-10.0_k%CE%A9-blueviolet.svg) | Precision Feedback (0.1% Tolerance, E96 Standard) |
| **RUN/OVLO Divider (Top)** | R3 | ![](https://img.shields.io/badge/Value-1.2_M%CE%A9-red.svg) | High-Voltage UV/OV Programming (1% Tolerance, 0603 Size) |
| **RUN/OVLO Divider (Middle)** | R4 | ![](https://img.shields.io/badge/Value-7.5_k%CE%A9-blue.svg) | UV/OV Programming (1% Tolerance, 0603 Size) |
| **RUN/OVLO Divider (Bottom)** | R5 | ![](https://img.shields.io/badge/Value-11_k%CE%A9-blueviolet.svg) | Low-Side UV/OV Programming (1% Tolerance, 0603 Size) |
| **Loop Compensation Resistor** | R_comp | ![](https://img.shields.io/badge/Value-23.7_k%CE%A9-blue.svg) | Series ITH Compensation — Case B full array (1% Tolerance, 0603 Size). See [power-stage-calculations.md](power-stage-calculations.md) §7 for Case A. |
| **Loop Compensation Capacitor** | C_comp | ![](https://img.shields.io/badge/Value-12_nF-yellowgreen.svg) | Series ITH Loop Compensation (X7R, 10% / &ge;16V) |
| **Loop Noise Filter Capacitor** | C_filter | ![](https://img.shields.io/badge/Value-91_pF-yellowgreen.svg) | Parallel ITH High-Frequency Filter — Case B full array (C0G, 5% / ≥16V). |
| **Bootstrap Capacitor** | C_BOOT1, C_BOOT2 | ![](https://img.shields.io/badge/Value-0.1_%CE%BCF-yellowgreen.svg) | High-Side Floating Supply (X7R, 10% / 50V, 0603 Size) |
| **RUN Delay Capacitor** | C_RUN | ![](https://img.shields.io/badge/Value-0.1_%CE%BCF-yellowgreen.svg) | UVLO Debounce Filter (X7R, 10% / &ge;16V, 0603 Size) |
| **Input Capacitor Array (MLCC)** | C_IN_MLCC | ![](https://img.shields.io/badge/Value-4×2.2_µF-brightgreen.svg) | TDK CGA9P3X7T2E225K250KA — 4x 2.2µF 250V **X7T** (2220), ~4.4µF effective at 120V bias |
| **Output Capacitor Array (MLCC)** | C_OUT_MLCC | ![](https://img.shields.io/badge/Value-4×10_µF-brightgreen.svg) | C1210X106K101T — 4x 10µF 100V X7R (1210), ~16–24µF effective at 52V bias |
| **Chassis Y-Capacitors** | C_Y1, C_Y2 | ![](https://img.shields.io/badge/Value-10_nF-blue.svg) | Knowles Syfer 1808Y2500103KXT, Class X1/Y2 Safety MLCC, FlexiCap (1808 size) |
| **Chassis Bleed Resistors** | R_CH_BLEED1, R_CH_BLEED2 | ![](https://img.shields.io/badge/Value-1.0_M%CE%A9-blue.svg) | Two 1.0 MΩ thick-film resistors in series (PGND to chassis, 1%, 0805 or 1206 size) |
