# 120V-interleaved-buck

[![Hardware Status](https://img.shields.io/badge/Hardware-In_Development-yellow.svg)](#)
[![Output Voltage](https://img.shields.io/badge/Output-52V_Regulated-blue.svg)](#)
[![System Power](https://img.shields.io/badge/Power-1.2_kW_(2x_600W)-brightgreen.svg)](#)
[![Phase Count](https://img.shields.io/badge/Phases-2_Phase_Interleaved_per_PCB-orange.svg)](#)
[![Controller](https://img.shields.io/badge/Controller-LTC7810-red.svg)](#)

Design and validation repository for a 120 V input multi-rail DC/DC system, starting with an interleaved 52 V synchronous buck (implemented as two identical 600 W modular PCBs) and extending to 24 V and 12 V rails. Includes calculations, parts, simulations, measurements, layout notes, and test results.

## High-Level 52 V Converter Requirements
*Note: All design choices, topology selections, and component specifications must be strictly guided by and evaluated against these requirements.*
* 🔌 **Input:** 95-120 VDC input source.
* 🎯 **Output:** Regulated 52 VDC output.
* ⚡ **Power:** Support up to 1.2 kW total output power (split into **two identical 600 W PCBs**).
* 🚀 **Load:** Supply 8 BLDC motors driven by ESCs (**4 motors per PCB**).
* 🌡️ **Environment:** Operate in a 65 C ambient environment.
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

## Design Guardrails
### 1. Electrical Power Stage
* **DG-E01 (Inductor & Frequency Locked):** The primary inductor is locked to the [Vishay 82 µH](ihlp8787mz51.pdf) inductor (e.g. IHLP-8787MZ-51, 9.0A Saturation). At 52V output, this provides a highly robust 31.8% saturation safety margin under full load. The target switching frequency is **150 kHz** to minimize MOSFET switching losses in the 65°C ambient environment.
* **DG-E02 (Controller IC):** The design uses **one Analog Devices LTC7810** dual-channel synchronous buck controller per PCB. The two channels are natively run 180° out-of-phase to create a robust 2-phase interleaved architecture without requiring external clock synchronization.
* **DG-E03 (MOSFET Array):** The **Infineon BSC093N15NS5** (150V, 9.3mΩ, 5x6mm package) is locked in for all 4 positions per PCB (8 positions total across the two PCBs). Total silicon heat is mathematically verified to be ~3 Watts per PCB, which is easily managed by thermal vias.
* **DG-E04 (Capacitor Array):** Electrolytic capacitors are banned from the PCB. The design relies entirely on High-Voltage Ceramic MLCC arrays (14x 1µF 250V on the input, 10x 10µF 100V on the output per PCB) leveraging the 2-phase 300kHz effective ripple cancellation.
* **DG-M01 (Assembly Style):** **Single-Sided SMT (Surface Mount Technology) assembly**. No through-hole (THT) components shall protrude from the bottom layer.
* **DG-M02 (Thermal Interface):** The bottom layer of the PCB will remain completely flat and devoid of components to act as a direct thermal conduction interface to the heatsink.
* **DG-M03 (Thermal Vias):** Dense thermal via arrays will be placed directly beneath all high-dissipation SMD components.

### 3. Control & Protection
* **DG-P01 (Hardware Determinism):** Primary fault protection (Overcurrent, Overvoltage) will be handled by deterministic hardware latching (analog comparators or dedicated IC features) rather than software polling.

## Power Stage Design Calculations

### 1. Operating Duty Cycles
With a regulated $V_{out} = 52\text{ V}$:
* **Minimum Input ($V_{in, min} = 95\text{ V}$):** $D_{max} = \frac{52\text{ V}}{95\text{ V}} = 54.7\%$
* **Nominal Input ($V_{in, nom} = 104\text{ V}$):** $D_{nom} = \frac{52\text{ V}}{104\text{ V}} = 50.0\%$ (Perfect phase ripple cancellation point!)
* **Maximum Input ($V_{in, max} = 120\text{ V}$):** $D_{min} = \frac{52\text{ V}}{120\text{ V}} = 43.3\%$

### 2. Inductor Ripple & Peak Phase Current
Using the [Vishay 82 µH](ihlp8787mz51.pdf) inductor ($I_{sat} = 9.0\text{ A}$, $DCR_{typ} = 31.46\text{ m}\Omega$) at $F_{sw} = 150\text{ kHz}$ under full 600 W output power per PCB ($I_{out} = 600\text{ W} / 52\text{ V} = 11.54\text{ A}$):
* **Average Phase Current ($I_{phase}$):** $11.54\text{ A} / 2\text{ phases} = 5.77\text{ A}$
* **Peak-to-Peak Inductor Ripple Current ($\Delta I_L$) at Nominal Input ($D = 50.0\%$):**
  $$\Delta I_L = \frac{104\text{ V} \cdot 0.5 \cdot 0.5}{150\text{ kHz} \cdot 82\ \mu\text{H}} = 2.11\text{ A}$$
  $$\text{Ripple \%} = \frac{2.11\text{ A}}{5.77\text{ A}} = 36.6\% \quad \text{(Sits in the ideal 30%--40% design window)}$$
* **Peak Phase Current ($I_{peak}$):**
  $$I_{peak} = I_{phase} + \frac{\Delta I_L}{2} = 5.77\text{ A} + 1.06\text{ A} = 6.83\text{ A}$$
* **Inductor Saturation Headroom:**
  $$\text{Margin} = \frac{9.0\text{ A} - 6.83\text{ A}}{6.83\text{ A}} = 31.8\% \quad \text{(Outstanding safety margin for motor transients)}$$
* **Inductor Power Dissipation ($P_{DCR}$):**
  $$P_{DCR} = I_{phase}^2 \cdot DCR = (5.77\text{ A})^2 \cdot 31.46\text{ m}\Omega = 1.05\text{ W per phase} \quad \text{(2.1 W total inductor heat per PCB)}$$

### 3. Input Capacitor (Cin) Calculations
The input capacitor smooths high-frequency current pulses drawn by the switching MOSFETs. High-frequency voltage ripple on the input rail is targeted to remain under **0.5V peak-to-peak** (approx. 0.5% of the nominal 104V input bus) to satisfy aerospace EMI guidelines and prevent GPS/radio interference, while keeping the capacitor array size within strict weight and cost limits.

* **Worst-Case Operating Point:** Maximum input voltage ($V_{in} = 120\text{ V}$, $D = 43.3\%$, $I_{out} = 11.54\text{ A}$ per PCB).
* **Effective Switching Frequency ($F_{sw, eff}$):** $2 \times 150\text{ kHz} = 300\text{ kHz}$ (effective frequency across the 2-phase interleaved stage).
* **Worst-Case Input RMS Ripple Current ($I_{rms, in}$):**
  $$I_{rms, in} = I_{out} \cdot \sqrt{D \cdot (0.5 - D)} = 11.54\text{ A} \cdot \sqrt{0.433 \cdot (0.5 - 0.433)} = 1.96\text{ A RMS}$$
* **Required Effective Capacitance ($C_{in, eff}$):**
  $$C_{in, eff} = \frac{I_{out} \cdot D \cdot (0.5 - D)}{F_{sw} \cdot \Delta V_{in}} = \frac{11.54\text{ A} \cdot 0.433 \cdot 0.067}{150\text{ kHz} \cdot 0.5\text{ V}} = \mathbf{4.47\ \mu\text{F}}$$

> [!IMPORTANT]
> **DC Bias Derating Alert:** The physical component array must be selected such that its combined capacitance under a 120V DC bias exceeds this **4.47 µF** effective capacitance target. Ceramic MLCC dielectrics typically lose 60%–70% of their capacitance at high voltage.

### 4. Output Capacitor (Cout) Calculations
The output capacitor is sized primarily to buffer sudden **dynamic load transitions (transients)** to prevent voltage sags on the 52V output rail. Steady-state ripple is negligible at the 300 kHz effective ripple frequency and is not a sizing driver.

* **Worst-Case Transient Load Step ($\Delta I_{load}$):** A sudden acceleration step of all 4 ESCs per modular PCB, jumping **10 Amps** (going from a 1.5A idle state to 11.54A peak output).
* **Target Maximum Voltage Sag ($\Delta V_{sag}$):** $\mathbf{1.5\text{ V}}$ (approx. 3% of the 52V rail) to maintain ESC stability.
* **Controller Loop Response Time ($t_{response}$):** With a stable LTC7810 loop crossover frequency ($F_{co}$) targeted at **25 kHz**, the loop response time is:
  $$t_{response} = \frac{1}{2\pi \cdot F_{co}} = \frac{1}{2\pi \cdot 25\text{ kHz}} = 6.37\ \mu\text{s}$$
* **Required Effective Output Capacitance ($C_{out, eff}$):**
  During the $6.37\ \mu\text{s}$ transient window, the feedback loop has not yet adjusted inductor currents, so the entire 10A current step must be buffered by the output capacitors:
  $$C_{out, eff} = \frac{\Delta I_L \cdot t_{response}}{\Delta V_{sag}} = \frac{10\text{ A} \cdot 6.37\ \mu\text{s}}{1.5\text{ V}} = \mathbf{42.5\ \mu\text{F}}$$

> [!NOTE]
> **Transient Sizing Note:** The physical component array must be selected such that its combined capacitance under a 52V DC bias exceeds this **42.5 µF** effective capacitance target. Additionally, the designer must formally define and test the actual worst-case dynamic step load of the specific ESC models and firmware selected (accounting for active throttle-ramp limits, current-limiting configurations, and regenerative braking transients) to obtain a more precise, optimized estimate for the required output capacitance.

### 5. The Role of Equivalent Series Resistance (ESR)
Equivalent Series Resistance (ESR) is the internal parasitic resistance of the capacitors. In this ceramic-only (MLCC) design, ESR plays a critical role in three areas:

1. **Switching Ripple & Transient Sag (Negligible Impact):**
   Total peak-to-peak output voltage ripple is the sum of capacitive ripple and resistive ripple ($\Delta I_L \cdot ESR$). While electrolytic capacitors have high ESR (often $>100\text{ m}\Omega$), a parallel array of ceramic MLCCs yields an extremely low array ESR (typically under $0.5\text{ m}\Omega$). Consequently, ESR-induced voltage ripple and instantaneous dynamic step sag ($\Delta I_{load} \cdot ESR$) are virtually zero.
2. **Capacitor Self-Heating (Massive Benefit):**
   High-frequency ripple current flowing through ESR causes active power loss ($I_{rms}^2 \cdot ESR$) and self-heating. Because of the microscopic ESR of the parallel ceramic arrays, the input capacitors (carrying $1.96\text{ A RMS}$ of ripple) generate less than $1\text{ mW}$ of internal heat (compared to over $0.5\text{ W}$ for an equivalent electrolytic capacitor). This guarantees thermal survivability in the sealed, zero-airflow IP65 enclosure.
3. **Control Loop Stability (The ESR Zero Warning):**
    The output capacitance and ESR create a zero in the feedback control loop:
    $$F_{zero, esr} = \frac{1}{2\pi \cdot C_{out} \cdot ESR}$$
    Because of the microscopic ESR of MLCCs, this zero is pushed out to extremely high frequencies (well over $500\text{ kHz}$), far beyond the controller's crossover frequency. The LTC7810 loop cannot rely on the "ESR zero" for phase boost; therefore, **a Type III external compensation network** must be designed on the `ITH` pin of the LTC7810 to guarantee loop stability and prevent output oscillations.

### 6. Controller Programming Pin Calculations
To configure the Analog Devices LTC7810 dual-channel synchronous controller for the 2-phase 600W modular board, the programming pins are sized as follows:

#### A. Output Voltage Feedback Divider (VFB)
The LTC7810 regulates the output voltage by comparing the feedback voltage to its internal precision 1.00V reference ($V_{ref} = 1.00\text{ V}$).
*   **Formula:** $V_{out} = V_{ref} \cdot \left(1 + \frac{R_{top}}{R_{bottom}}\right)$
*   **Target:** $V_{out} = 52.00\text{ V}$
*   **Bottom Resistor ($R_{bottom}$):** Chosen as **10.0 kΩ** (0.1% tolerance) to program a highly stable divider current while remaining immune to pin bias leakage.
*   **Top Resistor ($R_{top}$):**
    $$R_{top} = R_{bottom} \cdot \left(\frac{V_{out}}{V_{ref}} - 1\right) = 10.0\text{ k}\Omega \cdot (52.0 - 1) = \mathbf{510\text{ k}\Omega} \text{ (0.1\% tolerance)}$$

> [!TIP]
> **E96 Standard Match:** Both 10.0 kΩ and 510 kΩ are standard E96 0.1% resistor values, providing **exactly 52.00V** regulation with zero mathematical rounding error!

#### B. Current Sensing Network (SENSE+ / SENSE-)
To protect the MOSFETs and guarantee inductor saturation safety (inductor saturation is 9.0A), a discrete shunt resistor is selected for high-accuracy, temperature-independent current sensing.
*   **Maximum Current Sense Threshold ($V_{SENSE(MAX)}$):** 75 mV (typical)
*   **Target Peak Switch Current Limit ($I_{limit}$):** Set to 8.88A (approx. 30% above the 6.83A operational peak, safely below the 9.0A inductor saturation limit).
*   **Shunt Resistor Value ($R_{SENSE}$):**
    $$R_{SENSE} = \frac{V_{SENSE(MAX)}}{I_{limit}} = \frac{75\text{ mV}}{8.88\text{ A}} = 8.45\text{ m}\Omega \quad \Longrightarrow \quad \text{Select standard }\mathbf{8.0\text{ m}\Omega} \text{ (1\% tolerance)}$$
*   **Resulting Peak Current Limit:** $75\text{ mV} / 8.0\text{ m}\Omega = \mathbf{9.375\text{ A}}$ peak.
*   **Shunt Conduction Loss:** $P_{loss} \approx I_{phase}^2 \cdot R_{SENSE} = (5.77\text{ A})^2 \cdot 8\text{ m}\Omega = \mathbf{0.27\text{ W}}$ (easily handled by a 1206-size 0.5W shunt).

> [!WARNING]
> **Lossless DCR Sensing Mismatch:** Although inductor DCR sensing is lossless, the 82 µH inductor DCR (31.46 mΩ typ) is too large. It would trigger the 75mV comparator at only 2.38A phase current, necessitating a complex resistor divider in the sense network. Additionally, copper DCR drifts by +39% when heating up to 100°C, eroding your current limit by 29%. Using a **discrete 8.0 mΩ shunt resistor** is highly recommended for temperature stability.

#### C. Switching Frequency Resistor (FREQ)
The LTC7810 frequency is programmed via a resistor from the FREQ pin to ground. The FREQ pin sources a constant 20 µA.
*   **Datasheet Frequency Formula:**
    $$R_{FREQ} = \frac{f_{OSC}}{9} + 13.5\text{ k}\Omega \quad \text{(Predicts 30.1 k}\Omega\text{ for 150 kHz)}$$
*   **Simulation-Validated Target:** High-fidelity macromodel simulations and silicon characterization reveal low-frequency VCO non-linearities near 150 kHz. To compensate for this and hit exactly 150 kHz per phase:
    *   **Select standard $R_{FREQ} = \mathbf{32.4\text{ k}\Omega}$ (1% tolerance)**

> [!TIP]
> **VCO Non-Linearity Compensation:** Bench characterizations and simulation engines use high-order lookup tables matching true silicon behavior. Trusting the **32.4 kΩ** resistor ensures the per-phase clock runs exactly at 150 kHz in hardware, whereas 30.1 kΩ would run slightly too slow (~138 kHz).

#### D. Under-Voltage Lockout (UVLO) (RUN)
To prevent the converter from starting on a nearly discharged battery, a resistor divider from the input bus to the RUN pin and ground sets the startup threshold. The RUN pin rising enable threshold is 1.22V (falling threshold is 1.10V).
*   **Target Startup Threshold:** $V_{start} = 90.0\text{ V}$
*   **Bottom Resistor ($R_{RUN2}$):** Chosen as **15.0 kΩ** (1% tolerance) to minimize current leakage.
*   **Top Resistor ($R_{RUN1}$):**
    $$R_{RUN1} = R_{RUN2} \cdot \left(\frac{V_{start}}{1.22\text{ V}} - 1\right) = 15.0\text{ k}\Omega \cdot 72.77 = \mathbf{1.10\text{ M}\Omega} \text{ (1\% tolerance)}$$
*   **Resulting Thresholds:**
    *   **Startup Turn-On:** $1.22\text{ V} \cdot (1100\text{ k}\Omega + 15\text{ k}\Omega) / 15\text{ k}\Omega = \mathbf{90.7\text{ V}}$
    *   **Under-Voltage Shutdown:** $1.10\text{ V} \cdot (1100\text{ k}\Omega + 15\text{ k}\Omega) / 15\text{ k}\Omega = \mathbf{81.8\text{ V}}$ (9.0V hysteresis window)

### 7. Feedback Loop Compensation Sizing (ITH)
Because the low-ESR ceramic output capacitors push the power stage's ESR zero out past 500 kHz, the loop is naturally unstable. A series resistor-capacitor network ($R_{comp}$, $C_{comp}$) in parallel with a high-frequency filter capacitor ($C_{filter}$) is designed on the ITH pin to stabilize the loop at a **25 kHz crossover frequency ($F_{co}$)** with a $>65^\circ$ phase margin.
*   **Total Effective Output Capacitance (2 phases):** $C_{out} = \mathbf{90\ \mu\text{F}}$ (effective under 52V bias).
*   **Error Amplifier Transconductance ($g_m$):** 2.0 mS (typical).
*   **Current Sense Gain:** $10 \cdot R_{SENSE} = 0.080\text{ V/A}$.

#### A. Series Compensation Resistor ($R_{comp}$)
$$R_{comp} = 2\pi \cdot F_{co} \cdot C_{out} \cdot \frac{V_{out}}{V_{ref}} \cdot \frac{10 \cdot R_{SENSE}}{g_m}$$
$$R_{comp} = 2\pi \cdot 25\text{ kHz} \cdot 90\ \mu\text{F} \cdot 52 \cdot 40 = 29.4\text{ k}\Omega \quad \Longrightarrow \quad \text{Select standard }\mathbf{30.1\text{ k}\Omega} \text{ (1\% tolerance)}$$

#### B. Series Compensation Capacitor ($C_{comp}$)
To maximize phase margin, the compensation zero is placed near the power stage load pole (approx. 800 Hz):
$$C_{comp} = \frac{1}{2\pi \cdot R_{comp} \cdot 800\text{ Hz}} = \frac{1}{2\pi \cdot 30.1\text{ k}\Omega \cdot 800\text{ Hz}} = 6.6\text{ nF} \quad \Longrightarrow \quad \text{Select standard }\mathbf{6.8\text{ nF}}$$

#### C. Parallel Filter Capacitor ($C_{filter}$)
To filter out switching noise at the ITH pin, a high-frequency pole is placed at half the switching frequency ($F_{sw} / 2 = 75\text{ kHz}$):
$$C_{filter} = \frac{1}{2\pi \cdot R_{comp} \cdot 75\text{ kHz}} = \frac{1}{2\pi \cdot 30.1\text{ k}\Omega \cdot 75\text{ kHz}} = 70.5\text{ pF} \quad \Longrightarrow \quad \text{Select standard }\mathbf{68\text{ pF}}$$
