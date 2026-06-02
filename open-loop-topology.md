# Architecture Exploration: 4-Phase Unregulated 50% DCX (Open-Loop)

## Executive Summary
This document explores the viability of replacing a standard regulated Buck Controller with a purely open-loop, 50% fixed-ratio "DC Transformer" (DCX) topology for a 120V to ~60V drone power supply. 

By locking the duty cycle at exactly **50%** across 4 interleaved phases, input and output switching ripple is perfectly mathematically cancelled. This allows for the complete removal of bulky, heat-sensitive electrolytic capacitors from the PCB. The resulting design achieves a microscopic vertical form-factor, near-infinite lifespan, and perfect compatibility with sealed IP65 thermally conductive potting. 

However, this topology requires abandoning analog controller ICs (which cannot run open-loop) in favor of a Microcontroller (STM32) paired with 150V External Gate Drivers. This shifts the engineering burden from hardware to firmware, introducing severe risks surrounding firmware-driven soft-start sequencing and transient voltage spikes. The formal Design FMEA (DFMEA) at the end of this document outlines these critical risks and their necessary hardware mitigations.

---

## 1. The Core Concept (DC Transformer)
A Fixed-Ratio Converter is a standard buck power stage where the "brain" (the feedback control loop) has been completely severed. The Duty Cycle ($D$) is permanently locked in hardware/firmware at **50%** ($D = 0.5$). 

Because there is no feedback loop, it does not regulate the output to a specific voltage. Instead, it acts exactly like an AC transformer, but for DC:
* $V_{out} = V_{in} \times 0.5$ (minus slight resistive losses)
* $I_{out} = I_{in} \times 2$

## 2. The Magic of 50% Phase Cancellation
In a 4-phase interleaved system, the phases are fired exactly 90° apart.
If you lock the duty cycle to exactly **50%**, exactly two High-Side MOSFETs are ON, and exactly two High-Side MOSFETs are OFF at any given microsecond.

Because the current draw from the input is perfectly flat, the input capacitors see **almost zero RMS ripple current**. You can safely remove bulky electrolytic capacitors from your PCB and rely purely on small, flat ceramic MLCCs.

## 3. The Digital Firmware Architecture
Because standard analog buck controllers physically cannot be forced to run "open-loop" at exactly 50% without their error amplifiers panicking, we must completely discard the idea of using a dedicated Controller IC.

* **The Brains:** You use a Microcontroller (STM32, RP2040) running custom C code to output four rigid 50% PWM signals staggered by exactly 90°.
* **The Muscles:** You must use four external **150V Half-Bridge Gate Driver ICs** (like the Texas Instruments UCC27712) to amplify the weak 3.3V microcontroller signals into the 10V punches needed to drive the high-voltage MOSFETs.
* **The Soft-Start Requirement:** You must write flawless firmware to handle the Soft-Start. If you slam a 50% PWM signal onto the MOSFETs while the output capacitors are at 0V, you will draw thousands of amps of inrush current and vaporize the board. Your firmware must carefully ramp the duty cycle from 0% to 50% over a few milliseconds.
* **The Failsafe:** You must build hardware comparators to instantly kill the Gate Drivers if a short circuit occurs, because the microcontroller firmware is too slow to react.

## 4. The Capacitor Trade-Off: What Do You Gain?
If the 50% phase-cancellation and the downstream ESC capacitors allow us to delete all Bulk Electrolytic Capacitors from our PCB, what do we actually gain? 

### The Gains
1. **Extreme Vertical Clearance (Height):** Electrolytic capacitors are massive cylinders (often 15mm to 30mm tall). By removing them, the tallest component on the board becomes the inductors (~5mm to 8mm). The entire board can become incredibly thin, easily fitting into tight IP65 enclosures.
2. **Infinite Lifespan (MTBF):** Electrolytic capacitors contain liquid electrolyte. At 65°C ambient, they slowly dry out and die (usually within 2,000 to 10,000 hours). They are the #1 cause of power supply death. Solid-state Ceramic Capacitors (MLCCs) do not dry out and essentially last forever.
3. **Potting and Sealing Compatibility:** In a sealed IP65 box, heat is trapped. If you pot the board in thermally conductive epoxy, electrolytics can swell, vent, and crack the potting compound. Ceramics are completely inert and thrive in potted environments.

### The Hidden Risks
1. **Zero Margin for Bad ESCs:** You are entirely relying on the ESC manufacturers to put enough bulk capacitance on their boards to handle transient motor surges.
2. **Cable Length Sensitivity:** The physical wire connecting your converter to the ESC has parasitic inductance. If that wire is too long, the inductance acts as a wall, disconnecting the ESC's bulk capacitors from your converter. The tiny ceramics on your PCB will be overwhelmed by high-frequency voltage spikes.

---

## 5. Design FMEA (Failure Mode & Effects Analysis)

**Scoring Legend (1-10):**
* **S (Severity):** 1 = Unnoticeable, 10 = Catastrophic / Fire Hazard.
* **O (Occurrence):** 1 = Extremely Unlikely, 10 = Almost Certain.
* **D (Detection):** 1 = Guaranteed to detect before failure, 10 = Impossible to detect before failure.
* **RPN (Risk Priority Number):** S × O × D (Highest numbers require immediate design mitigation).

| Subsystem | Potential Failure Mode | Potential Effect(s) | S | Potential Cause(s) | O | Current Design Controls | D | RPN |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Firmware (MCU)** | Fails to inject Dead-Time between High/Low FETs | Shoot-through short circuits 120V battery. MOSFETs vaporize. Fire hazard. | 10 | Logic error; Timer register misconfiguration; Clock glitch. | 3 | Use hardware-level dead-time insertion available on advanced MCU timers. | 3 | **90** |
| **1. Firmware (MCU)** | Fails to execute Soft-Start (commands 50% instantly) | Infinite inrush current to uncharged output capacitors. Board traces vaporize. | 10 | Firmware crash during boot; State machine logic error. | 3 | Hardware Overcurrent Comparator tied directly to Gate Driver `EN` pin. | 4 | **120** |
| **2. Gate Drivers** | Bootstrap capacitor undervoltage | High-side FET fails to turn on fully, enters linear region, and overheats. | 8 | Boot cap too small; Firmware duty cycle drifts above 50%, preventing recharge. | 2 | Fixed 50% duty cycle guarantees ample recharge time for boot cap. | 5 | **80** |
| **3. Output Caps** | Ceramic (MLCC) cracking due to PCB flex | Internal short circuit to ground. Catastrophic thermal runaway. | 9 | Mechanical stress from mounting; Thermal expansion cycling. | 4 | Use "Soft-Termination" or "Flex-Term" automotive grade MLCCs. | 3 | **108** |
| **4. System/Wiring** | Wire to ESC is too long (High Parasitic Inductance) | Extreme voltage spiking during motor transients. MLCCs experience overvoltage breakdown. | 8 | User wiring error; Mechanical layout constraints. | 5 | Explicit user manual warnings; Adding a TVS diode to clamp spikes. | 8 | **320** |
| **5. Protection** | Hardware Comparator fails to trip on short-circuit | Short circuit destroys converter before MCU can poll and react. | 10 | Thermal drift of sense resistor; Electrical noise on sense line. | 2 | High precision components; Low-pass filtering on sense traces. | 3 | **60** |
| **6. Inductors** | Magnetic Core Saturation | Inductance drops to nearly zero. MOSFETs experience catastrophic overcurrent and explode. | 10 | Optimized inductor selection leaves only ~24% margin. Hard ESC acceleration at 95V battery exceeds limit. | 4 | Hardware Overcurrent Comparator instantly kills gate drivers; Flight controller telemetry warnings. | 3 | **120** |

### Critical Risk Mitigation
* **Cable Inductance (RPN 320):** Must strictly limit ESC wire lengths and add a massive TVS diode to the 48V output to absorb $L \cdot di/dt$ inductive spikes that the ceramic capacitors cannot handle.
* **Firmware Bugs & Saturation (RPN 120):** The MCU must **never** manually bit-bang the MOSFETs. All PWM must be generated by hardware-locked complementary timers. Because we are running the inductors with a razor-thin 24% margin, an analog hardware overcurrent comparator is non-negotiable for instantly disabling the gate drivers during a fault or saturation event.

---

## 6. Power Stage Components & Math (50% DCX)

Because this is an unregulated 50% fixed-ratio converter, the math changes significantly from a traditional 48V buck. We have locked in the **Vishay 82µH Inductor (10.2A Saturation)** to provide massive headroom for ESC transient spikes.

### 6.1 Operating Parameters
* **Input Voltage Range ($V_{in}$):** 95V to 120V
* **Output Voltage ($V_{out}$):** 47.5V to 60V ($V_{in} \times 0.50$)
* **Target Power:** 1.2 kW
* **Duty Cycle ($D$):** 0.50 (Fixed)
* **Switching Frequency ($F_{sw}$):** 150 kHz

### 6.2 Inductor Math (Worst-Case 95V Battery)
In an unregulated DCX, output voltage drops exactly proportionally to the battery voltage. Because drone motors require a fixed mechanical Power (Watts) to hover, a drop in voltage forces the ESCs to draw *more* current. The worst-case scenario for inductor saturation occurs at the absolute minimum battery voltage.

**Worst-Case Scenario ($V_{in}$ = 95V):**
* $V_{out} = 47.5V$. For 1.2kW, $I_{total} = 25.26A$. Phase Average = **6.31A**.
* $\Delta I_L = \frac{(95 - 47.5) \cdot 0.5}{150000 \cdot 82\times10^{-6}} = \mathbf{1.93\text{ A}}$ peak-to-peak. 
* **Peak Phase Current:** $6.31\text{A} + (1.93\text{A} / 2) = \mathbf{7.27\text{ A}}$.

**Minimum Saturation Current Requirement (20% Bare Minimum Margin):**
To squeeze the maximum possible inductance out of this footprint (which critically lowers the switching frequency), we must drop the mandated safety margin back to the absolute bare minimum of **20%**.
* **Minimum Required $I_{sat}$:** $7.27\text{A} \times 1.20 = \mathbf{8.72\text{ Amps}}$.

**Component Selection:**
The **Vishay IHLP-8787MZ-51 (82µH)** provides a Saturation Current of **9.0 Amps** (and a heat rating of 10.2A). This squeaks past the 8.72A minimum requirement, providing exactly a **23.8% safety margin** at the worst-case 95V battery state. This is highly optimized for efficiency, but pushes the inductor dangerously close to saturation during violent drone maneuvers.

### 6.3 MOSFET Selection (Infineon BSC093N15NS5)
We will use the **Infineon BSC093N15NS5** (150V, 9.3m$\Omega$, SuperSO8 5x6mm package) for all 8 positions.
* **Conduction Loss:** Because the duty cycle is exactly 50%, High-Side and Low-Side FETs share the exact same conduction loss: $I^2 \cdot R_{DS(on)} \cdot 0.5 = 5.0^2 \cdot 0.0093 \cdot 0.5 = \mathbf{0.11\text{ W}}$ per FET.
* **Total Silicon Heat:** The entire 8-MOSFET array will generate less than **5 Watts** of total heat, easily surviving a sealed 65°C enclosure via thermal vias.
