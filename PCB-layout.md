# PCB Layout Guidelines (120V Interleaved Buck)

> [!WARNING]
> **High-Voltage Design Alert:** Given the high input voltage (120V), extreme power density (600W per PCB), and reliance on bottom-side conduction cooling, strict adherence to these layout practices is mandatory for the board to function correctly and survive.

> [!TIP]
> **Gold Standard Reference Architecture:** When placing your power stage components, use the symmetric layout architecture detailed in **[Analog Devices App Note AN-136: PCB Layout Considerations for Non-Isolated Switching Power Supplies](https://www.analog.com/en/resources/app-notes/an-136.html)**. Specifically, study the "Figure 11" dual-phase layout: by placing the $V_{IN}$ capacitors directly between the two Top MOSFETs, the high $di/dt$ loops create opposing magnetic fields that cancel each other out, drastically reducing parasitic inductance and 120V ringing.

---

## 1. High $di/dt$ Switching Loops (Critical)
The most critical loop in any buck converter is the path connecting the input capacitors, the high-side MOSFET, and the low-side MOSFET back to ground. Because this loop handles rapidly switching 120V currents ($di/dt$), any parasitic trace inductance will cause massive voltage ringing that can easily exceed the 150V MOSFET rating.
* ⚡ **Tight Placement:** Place the 4x 2.2µF input ceramic capacitors as physically close to the drains of the high-side MOSFETs and the sources of the low-side MOSFETs as possible. For a 2-phase interleaved layout, place the $C_{IN}$ array centrally **between** the two high-side MOSFET drain nodes (AN-136 Figure 11) so the opposing switching loops cancel each other's magnetic fields.
* 🛡️ **Magnetic Shielding:** Use a solid, unbroken PGND plane on Layer 2 (immediately beneath Layer 1) to contain high-frequency magnetic fields. **Do not place any cutouts, slots, or islands in Layer 2** — any gap in the shield forces high-frequency return currents to detour around the gap, dramatically increasing effective loop area and causing deadly 150V ringing spikes.

---

## 2. Thermal Management & Conduction Cooling
Per the Design Guardrails (DG-M01/M02), this is a single-sided board that relies on bottom-surface contact with the IP65 aluminum enclosure for cooling.
* 🔥 **Thermal Vias:** Place a dense array of thermal vias (0.3mm drill, 0.6mm pad) directly beneath the thermal pads of all 4 MOSFETs and under the terminal pads of both Inductors. See [Section 11](#11--via-specifications) for complete via specifications and IPC-4761 type guidance.
* 📏 **Bottom Layer Flatness:** Keep the bottom layer completely free of components, test points, or exposed traces to allow a flat, uniform application of a thermal gap pad against the enclosure. Per-component copper polygons for thermal via landing pads are acceptable — see [Section 9](#9--layer-4-polygon-strategy-per-component-copper) for the complete Layer 4 strategy.
* 🧲 **Inductor Copper Strategy:** The copper fill strategy under the inductors requires special consideration. See [Section 10](#10--inductor-copper-management-vishay-ihlp-8787mz) for the full guidance.

---

## 3. Current Sensing (Differential Routing)
The LTC7810 current limit relies on the microscopic 75mV threshold across the $9.0\text{ m}\Omega$ sense resistors.
* 🛣️ **Coupled Pairs:** Route the `SENSE+` and `SENSE-` traces as a **tightly coupled differential pair** all the way from the sense resistor back to the controller.
* 🔕 **Noise Avoidance:** Do not route these traces near the noisy `SW` node or the inductor magnetic fields.
* 🎯 **Kelvin Connections:** Kelvin-connect the traces directly to the inside edges of the sense resistor pads to avoid picking up voltage drops across the heavy copper pours.

---

## 4. Controller Decoupling, Gate Drive & Bootstrap Loops

### VIN Decoupling Cap
Place a **100 nF, 250V, X7R, 0603** ceramic capacitor immediately adjacent to the `VIN` and `PGND` pins of the LTC7810. This is a local high-frequency bypass for the IC's internal LDO — it is separate from and in addition to the bulk $C_{IN}$ array. The cap's GND leg returns to **PGND** (the pin nearest to `VIN` on the IC), not to the SGND island.

> [!IMPORTANT]
> **Use a 250V-rated MLCC here.** A 100V-rated cap at 120V bias loses 70–80% of its capacitance due to DC voltage derating, making it effectively useless as a decoupling cap.

### INTVCC Capacitor
Place the INTVCC ceramic bypass capacitor physically adjacent to the `INTVCC` and `PGND` pins of the LTC7810. This provides the instantaneous high-current pulses needed by the gate drivers.

### Bootstrap Circuit
The bootstrap circuit has **two separate loops with very different timing requirements**:

**Critical loop (every switching cycle — minimize loop area):**
```
LTC7810 TG pin → [short trace] → MOSFET Gate
LTC7810 SW pin → [short trace] → MOSFET Source
                CBOOT cap between BOOST and SW pins (sits at the IC)
```

**Non-critical loop (charges only during off-time):**
```
INTVCC → [CMPD3003 diode] → BOOST node (top of CBOOT)
```

**Placement rules:**
* 🔋 Place **CBOOT** immediately between the `BOOST` and `SW` pins of the LTC7810 — this is the highest priority placement on the entire gate drive circuit.
* 🔀 The `CMPD3003` bootstrap diode charges CBOOT only during the off-time (non-switching period). It does **not** need to be physically next to the IC — it can be routed around obstacles. A few extra mm of trace inductance on the `INTVCC → diode → BOOST` path is acceptable.
* 🚫 **Do not** place CBOOT at the MOSFET end of the gate drive traces. CBOOT must be at the IC's `BOOST` and `SW` pins.

### Gate Drive Routing — TG and SW as a Matched Pair

Per AN-136, `TG` (top gate) and `SW` (switch node sense) should be routed **together as a tightly coupled matched pair**. This is not about routing them parallel for a long distance — it is about minimizing the gate drive return loop area by having the outgoing current (TG → gate) and return current (source → SW pin) run side by side.

**When TG must transition to another layer:**
* Transition both `TG` and `SW` to the same inner layer using **adjacent via pairs** — the opposing currents partially cancel each other's magnetic fields.
* Keep the via transition as close to the **MOSFET gate pad** as possible (not near the IC), so the high-inductance buried segment is short.
* Do **not** route `TG` on Layer 2 — this cuts through the solid PGND shield.
* Do **not** run `TG` parallel and adjacent to the `SW` copper pour on the same layer for any significant length — the 120V dV/dt on SW (~8 V/ns) will capacitively inject noise into the gate trace.

**SW sense trace (IC to power stage):**
The LTC7810's `SW` pin is a sense pin only — it carries no phase current. It connects to the actual power switch node (MOSFET source) via a **thin, dedicated trace** (0.2–0.3 mm). Keep it away from `TG` on Layer 1 but route them as a pair when transitioning layers. The maximum acceptable trace length from the IC `SW` pin to the actual power switch node is approximately **25 mm** before dead-time sensing accuracy degrades.

### NC Pin Handling
For NC (No Connect) pins on the LTC7810:
* **NC with no datasheet note:** Safe to tie to PGND (prevents capacitive coupling to nearby noisy nodes) or leave floating.
* **NC — Do Not Connect (reserved pins):** Leave strictly floating — these may be factory test/trim connections.
* **Never** connect NC pins to VIN, SW, BOOST, or any switching node.

---

## 5. Grounding Separation (SGND vs. PGND)
The LTC7810 contains highly sensitive analog circuitry (reference, error amp, oscillators) and high-current noisy circuitry (gate drivers).
* 🤫 **Signal Ground (SGND):** Connect all sensitive control components (VFB divider, ITH compensation, FREQ resistor, RUN divider) to a dedicated, quiet SGND copper island **on Layer 1 only**. The SGND island does not extend to inner layers — inner layers are solid PGND.
* 💪 **Power Ground (PGND):** Connect the input caps, output caps, TVS diodes, and low-side MOSFET sources to the rugged PGND plane.
* 📍 **Star Connection:** Connect the SGND island to the PGND plane at exactly **one single point**, located directly at the **negative terminal of the output capacitor array (C_OUT)**. This is the most electrically accurate reference point for the VFB divider and ITH compensation network, since any noise voltage between the star point and the output cap negative terminal appears as false ripple to the IC's error amplifier. Do **not** use the IC thermal pad as the star point — the thermal pad vias under the LTC7810 are for thermal conduction only and are not a substitute for the output-cap star connection.
* 🔩 **Thermal Pad Vias:** The LTC7810 exposed thermal pad (AGND) connects to the SGND island on Layer 1. The thermal vias beneath it pass through the PGND planes on L2, L3, and L4 for heat extraction. This does not create a second star point — all vias cluster at the same geographic node.
* 🔋 **Inner Layer Ground:** Layer 2 and Layer 4 are solid PGND everywhere. The SGND vs. PGND separation is a **Layer 1 concern only**. Never create an SGND island on an inner layer — it breaks the solid PGND shield on L2 and degrades the thermal spreader on L4.

---

## 6. Chassis Grounding & ESD/EMI Layout Guidelines
To implement the hybrid grounding strategy (single active mounting hole with dual Y-capacitors and a bleed resistor) for the metal heatsink/enclosure:

* 📍 **Single Active Mounting Point:** Select exactly **one** mounting hole (typically the one closest to the 120V input power connector) to serve as the chassis electrical connection point. Keep the other three mounting holes completely floating (use unplated mounting holes or floating copper pads with no electrical connections).
* 🔋 **Input-Connector Filter Placement:** Place the Y-capacitors (C_Y1, C_Y2) and the bleed resistors (R_CH_BLEED1, R_CH_BLEED2) immediately adjacent to the input power connector.
* 🛣️ **Low-Inductance Paths:** Route the connection from the active mounting hole pad to the chassis-side pads of the Y-capacitors with a very short, wide copper pour (minimum 1.5 mm width) to minimize parasitic trace inductance. Trace inductance degrades the high-frequency shunting effectiveness of the Y-capacitors.
* 🛡️ **HV Clearance and Keepouts:** Maintain a strict clearance gap of at least **2.0 mm** on all layers around the active mounting hole standoff pad and the Chassis-connected traces to prevent high-voltage arcing to surrounding PGND, VIN, or VOUT copper pours. Ensure no signal or power traces on Layer 2 or Layer 3 pass through this keepout zone.
* 🔀 **Bleed Resistor Parallel Routing:** Route the two 1.0 MΩ bleed resistors in series directly in parallel with the PGND-to-chassis Y-capacitor (bridging the Chassis net to the PGND plane). Do **not** place any bleed resistor on the VIN-to-chassis path to prevent exposing the chassis to 120V DC.

---

## 7. 📋 Official LTC7810 Layout Checklist
*(Adapted from the LTC7810 Datasheet Recommendations and design-specific discussion)*

### Chassis & Safety
- [ ] **Active Chassis Connection:** Is exactly one mounting hole electrically connected to the chassis, while the other three are floating?
- [ ] **Chassis Y-Caps and Bleed Resistors:** Are C_Y1 and C_Y2 placed right at the input connector? Is the bleed resistor pair strictly in parallel with the PGND Y-cap (and NOT the VIN Y-cap)?
- [ ] **Chassis Copper Clearances:** Is there at least 2.0 mm of creepage/clearance distance on all layers around the active mounting hole pad and the Chassis net trace?
- [ ] **Gap Pad Voltage Rating:** Is the thermal gap pad rated for the maximum voltage present on Layer 4 (120V for VIN drain pads, 120V peak for SW pads)? Confirm ≥1000V dielectric withstand rating.

### Power Stage
- [ ] **Shared Input Decoupling:** Are the High-Side MOSFETs for both phases located close together (within 1cm) sharing a common drain connection at the $C_{IN}$ array centrally placed between both HS MOSFET drains? Do not split the input decoupling.
- [ ] **L2 Solid PGND Plane:** Is Layer 2 a completely solid, unbroken PGND pour with zero cutouts, slots, or islands? Any gap in L2 directly under the switching loops will cause destructive 150V ringing.
- [ ] **L4 Per-Component Polygons:** Are non-PGND copper areas on Layer 4 (VIN drain pads, SW inductor terminal pads, VOUT inductor terminal pads) bounded tightly to each component's footprint? These areas must not flood large regions of L4 — PGND must dominate the layer.

### Grounding
- [ ] **Ground Separation & Routing:** Is the `SGND` island on Layer 1 only (not replicated on inner layers)? Do the `SGND` and `INTVCC` decoupling grounds return directly to the $C_{OUT}$ (−) terminals? Are the input and output capacitors placed close to each other to minimize ground loop area?
- [ ] **Star Ground Location:** Does the single SGND→PGND star connection occur at the **C_OUT negative terminal**, not at the IC thermal pad?
- [ ] **PGND Perimeter Stitching:** Are perimeter PGND vias (0.4mm drill) spaced at 3–5mm around the full board edge, connecting all four layers?

### Controller & Signal
- [ ] **VIN Decoupling Cap:** Is a 100nF / 250V / X7R local bypass cap placed adjacent to the LTC7810 VIN pin, returning to the nearest PGND pin?
- [ ] **Feedback Routing:** Is the $V_{FB}$ resistive divider connected directly to the positive terminal of the output capacitors ($C_{OUT}$)? Ensure it returns to `SGND` and is routed far away from the noisy, high-current input traces.
- [ ] **Current Sense (Kelvin):** Are `SENSE+` and `SENSE-` routed as tightly coupled differential pairs? Are the connections strictly Kelvin-connected to the sensing resistors? Is the sense filter capacitor placed directly at the IC pins?
- [ ] **INTVCC Decoupling:** Is the `INTVCC` decoupling capacitor placed intimately close to the `INTVCC` and `PGND` pins to handle high-frequency driver current peaks?
- [ ] **CBOOT Placement:** Is CBOOT placed immediately between the `BOOST` and `SW` pins of the LTC7810 (at the IC, not at the MOSFET)?
- [ ] **Gate Drive Pair Routing:** Are `TG` and `SW` routed as a tightly coupled matched pair? If they transition to an inner layer, are the via pairs adjacent to each other and as close to the MOSFET gate pad as possible?
- [ ] **Noise Isolation:** Are the noisy `SW`, top gate (`TG`), and `BOOST` nodes strictly isolated from sensitive small-signal pins (like $V_{FB}$ and `ITH`)? Is `TG` free of long parallel runs adjacent to the `SW` copper pour?
- [ ] **NC Pins:** Are all NC (No Connect) pins either left floating or tied to PGND? None should connect to VIN, SW, BOOST, or any switching node.

### Manufacturing
- [ ] **Via-in-Pad Treatment:** Are thermal vias under exposed thermal pads specified with IPC-4761 Type 7 (copper fill + cap) or at minimum Type 1a (top-side solder mask tenting)?
- [ ] **Bottom Layer:** Is Layer 4 completely free of components, test points, and signal traces?

---

## 8. 🥞 Recommended Board Stack-Up

Given the 120V input, 600W power density, and the strict bottom-side conduction cooling requirement, a standard 2-layer board will completely fail thermally and electrically.

A **4-Layer PCB** with thick copper is the absolute optimal choice to balance thermal performance, magnetic shielding, and BOM cost.

### Key Manufacturing Parameters
* 🔢 **Layer Count:** 4 Layers
* 📏 **PCB Thickness:** **1.2 mm** — Standard is 1.6 mm, but 1.2 mm reduces via thermal resistance by 25% and tightens the L1–L2 prepreg spacing, improving the L2 PGND shield effectiveness. Do not go thinner than 1.2 mm — 1.0 mm creates stack-up constraints with 2 oz copper and reduces mechanical rigidity in a high-vibration drone environment.
* ⚖️ **Copper Weight:** See trade-off analysis below.

### ⚖️ Copper Weight Trade-Off Analysis

Full 2 oz on all layers is thermally ideal but expensive at prototype fabs. The table below summarises the viable options and their impact on this design:

| Stack-Up | L1 | L2 | L3 | L4 | Cost | L4 Thermal | L3 Current |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **2 oz all layers** | 2 oz | 2 oz | 2 oz | 2 oz | $$$ | ✅ Best | ✅ Best |
| **2 oz outer / 1 oz inner** | 2 oz | 1 oz | 1 oz | 2 oz | $$ | ✅ Good | ⚠️ Wider pours needed |
| **1 oz outer / 1.5 oz inner** | 1 oz | 1.5 oz | 1.5 oz | 1 oz | $ | ⚠️ Weak | ✅ Good |
| **1 oz all layers** | 1 oz | 1 oz | 1 oz | 1 oz | Free | ❌ Poor | ❌ Poor |

**For this design, 2 oz outer / 1 oz inner is the better budget option** because Layer 4 thermal spreading is the primary bottleneck — not Layer 3 current capacity. If that option is unavailable or too costly, the 1 oz outer / 1.5 oz inner option is the next best choice and is a meaningful improvement over all-1 oz.

#### Layer 4 Spreading Resistance Calculation

The lateral spreading resistance of the Layer 4 copper determines how efficiently heat from the via array exit points spreads to the full heatsink contact area. This resistance scales **inversely** with copper thickness — 1 oz copper has exactly 2× the spreading resistance of 2 oz copper:

$$R_{spread} \approx \frac{\ln(r_2 / r_1)}{2\pi \cdot k_{Cu} \cdot t_{Cu}}$$

Using the FDMS86252 PQFN geometry (4×4 via array → $r_1$ = 1.7 mm, MOSFET footprint → $r_2$ = 4.5 mm, $k_{Cu}$ = 385 W/m·K):

| Copper Weight | Thickness | $R_{spread}$ | ΔT per MOSFET at 5W |
|:---:|:---:|:---:|:---:|
| 2 oz | 70 µm | 5.8 °C/W | +29°C (model max) |
| 1.5 oz | 52 µm | 7.8 °C/W | +39°C (model max) |
| 1 oz | 35 µm | 11.6 °C/W | +58°C (model max) |

> [!NOTE]
> These are conservative 2D cylindrical spreading model estimates (point-source assumption). The gap pad and aluminum enclosure also provide lateral spreading beyond L4, so practical junction temperature deltas are approximately **half** these values — roughly **+15°C** additional rise going from 2 oz → 1 oz on Layer 4. The design was thermally verified at ~107.5°C junction temperature assuming 2 oz on L4; 1 oz L4 brings this to ~122°C, leaving a 28°C margin to the 150°C MOSFET absolute maximum.

#### Compensating for Thinner Copper

If using 1 oz on Layer 4, partially offset the reduced spreading resistance by **increasing thermal via density** under the MOSFETs. Increasing from a 4×4 (16 via) array to a 5×5 (25 via) array reduces the via cluster exit radius on L4, shrinking the required spreading distance and cutting the effective spreading resistance by ~20%.

### Layer Assignments

#### 🔴 Layer 1 (Top): Components, Power & Signals
* 🏗️ **Purpose:** All physical SMT components are placed here. Contains the noisy `SW` (Switch) nodes, gate drive traces, and small-signal routing.
* 🎯 **Strategy:** Keep `SW` copper pours just large enough to carry the 6A phase current. Primary location for sensitive analog routing (`SENSE+`/`SENSE-`, `VFB`, `ITH`). The ITH compensation network must reside entirely here directly at the IC pin. If space is constrained, `SENSE` and the `VFB` 52V feed can transition to Layer 3 following strict isolation rules. Flood remaining empty space with `PGND`. The SGND island lives on this layer only.

#### 🟡 Layer 2 (Inner 1): Solid Ground Plane
* 🛡️ **Purpose:** The primary high-frequency magnetic shield and thermal spreader.
* 🚫 **Strategy:** Must be a **solid, unbroken `PGND` plane** — no cutouts, slots, or copper islands of any kind. Physical proximity to Layer 1 (thin prepreg) cancels the magnetic fields of the high $di/dt$ switching loops and prevents deadly 150V ringing spikes. Extends under the entire board including beneath the LTC7810 — do **not** create a separate SGND island on this layer. Do **not** route any traces here.

#### 🟢 Layer 3 (Inner 2): Power Routing ($V_{IN}$ / $V_{OUT}$) & Signal Routing
* 💪 **Purpose:** Heavy current delivery, lateral thermal spreading, and shielded signal routing.
* 🔀 **Strategy:** Split into massive copper pours for $V_{IN}$ (120V) and $V_{OUT}$ (52V). The **only** permitted layer for signal traces (`SENSE`, `VFB`, `RUN`, `OVLO`) that cannot fit on Layer 1.
  * 🛣️ **SENSE lines:** Tightly coupled differential pair, flanked by PGND guard traces stitched to L2 and L4.
  * 📐 **VFB lines:** Place divider resistors at the IC pin on Layer 1; route only the low-impedance 52V feedback feed here.
  * 🔩 **Stitching Vias:** Every signal transition to Layer 3 must have a PGND stitching via within 1.0 mm for return path continuity.
  * ⚡ **Clearance:** Minimum 0.5 mm to VOUT pour; strict 2.0 mm to the 120V VIN pour.
  * 🏗️ **Under the IC:** Place PGND fill under the LTC7810 footprint on Layer 3. Do not route VIN or VOUT pours directly under the IC body.

#### 🔵 Layer 4 (Bottom): Thermal Interface & Ground
* 🌡️ **Purpose:** Direct thermal conduction to the IP65 aluminum enclosure.
* 🚫 **Strategy:** **NO COMPONENTS. NO SIGNAL TRACES.** Dominated by a solid `PGND` pour. Thermal via arrays punch straight down from the MOSFETs and Inductors above, spreading heat laterally to the gap pad.
* 📦 **Per-Component Polygons:** Non-PGND pads (inductor SW/VOUT terminals, HS MOSFET drains) require matching-net copper on L4 for via landing — electrically unavoidable. Keep each polygon tightly bounded to its component footprint and confirm the gap pad is rated ≥1000V dielectric withstand. PGND must dominate this layer.

---

## 9. 🔵 Layer 4 Polygon Strategy (Per-Component Copper)

Because thermal vias carry the net of their source pad through all layers, Layer 4 will contain small copper polygons of multiple nets beneath the power components. This section documents the required per-component L4 polygon strategy.

| Component | Pad | Net on L4 | Notes |
|:---|:---|:---:|:---|
| FDMS86252 HS MOSFET | Exposed thermal pad | `PGND` | ✅ Thermal pad is PGND — no voltage on L4 |
| FDMS86252 HS MOSFET | Drain pads | `VIN` | ⚠️ 120V DC — keep polygon tight to footprint |
| FDMS86252 LS MOSFET | Exposed thermal pad | `PGND` | ✅ Thermal pad is PGND |
| Vishay IHLP-8787MZ | Input terminal pad | `SW` | ⚠️ 0–120V switching — keep polygon tight |
| Vishay IHLP-8787MZ | Output terminal pad | `VOUT` | ⚠️ 52V DC — keep polygon tight |
| LTC7810 (IC) | Exposed thermal pad | `PGND` (via star point) | ✅ Connects to PGND via thermal vias |

**Design rules for non-PGND polygons on Layer 4:**
* 📐 **Footprint Bounding:** Keep each polygon within the component courtyard — do not allow it to spread beyond the footprint boundary.
* ⚡ **Clearance:** Maintain ≥0.5 mm copper clearance between non-PGND polygons and the surrounding PGND pour.
* 🔋 **Gap Pad Rating:** Confirm the thermal gap pad has ≥1000V dielectric withstand (Bergquist, Fujipoly, Laird standard silicone pads are typically rated 1000–3000V — verify the specific datasheet value).
* 🌡️ **PGND Dominance:** PGND copper must constitute at least 60–70% of total Layer 4 area for adequate lateral heat spreading.

---

## 10. 🔬 Critical Test Points (Top Layer Only)

To safely bring up, debug, and tune the 120V board on the bench, you must scatter dedicated Test Points (TP) across the board during layout.

> [!WARNING]
> **No Bottom-Layer Probing:** Per your conduction cooling guardrails (DG-M02), the bottom layer must remain perfectly flat. Place all test points exclusively on the **Top Layer**.

### Power & Ground References
- [ ] **`TP_VIN` (120V):** Monitor input voltage sagging during high transient loads. *(Use extreme caution when probing).*
- [ ] **`TP_VOUT` (52V):** Main output voltage monitor.
- [ ] **`TP_PGND` (x4):** Place multiple Power Ground test points around the board. Crucially, place one immediately next to each `SW` node test point so you can use a high-frequency "ground spring" on your oscilloscope probe. *(Do NOT use the long alligator clip for SW node measurements!)*
- [ ] **`TP_SGND`:** A dedicated Signal Ground test point located near the LTC7810 for cleanly probing sensitive analog pins without picking up power stage noise.

### Controller Bring-Up (Analog Signals)
- [ ] **`TP_INTVCC`:** Crucial for verifying the internal LDO is outputting the correct gate-drive voltage before the MOSFETs begin switching.
- [ ] **`TP_RUN`:** Monitor the UVLO divider to verify exactly when the board decides the 120V input is high enough to safely turn on.
- [ ] **`TP_SS` (Soft-Start):** Probe the `TRACK/SS` pin to capture the soft-start voltage ramp during initial power-on.
- [ ] **`TP_ITH`:** The compensation node. You will probe this during dynamic step-load testing to verify loop stability and check for oscillation.
- [ ] **`TP_VFB`:** Verify the feedback pin is holding perfectly at the 1.0V internal reference.

### Power Stage Diagnostics (High Voltage/Noisy)
- [ ] **`TP_SW1` & `TP_SW2`:** The Switch Nodes. These are the most important diagnostic points on the board. Keep the copper pads small (e.g., 0402 size) to avoid turning them into EMI antennas. You will probe these to measure duty cycle, dead-time, and check for destructive 150V ringing spikes.
- [ ] **`TP_BG1` & `TP_BG2`:** Bottom Gate drives. Useful for verifying the controller is firing the low-side synchronous MOSFETs correctly.
- [ ] **(Optional) `TP_TG1` & `TP_TG2`:** Top Gate drives. *Warning:* These nodes float 10V above the 120V `SW` node (meaning they rapidly swing up to 130V). Only add these if you own an isolated high-voltage differential probe. A standard passive oscilloscope probe ground clip will cause a dead short.

---

## 11. 🧲 Inductor Copper Management (Vishay IHLP-8787MZ)

The copper fill strategy under the power inductors is one of the most nuanced decisions in this layout. The answer depends on the type of inductor, and the correct approach here is different from a naive solid fill or a full keepout.

### ❌ Why Not a Full Keepout?
This is an IP65 conduction-cooled design with no airflow — **heat must exit through the PCB**. Removing all copper under the inductor eliminates the primary thermal path to the enclosure, causing the inductor to overheat.

### ❌ Why Not a Solid Copper Pour?
Even though the **Vishay IHLP-8787MZ** uses a fully shielded soft magnetic composite (SMC) core, a large solid copper polygon directly beneath the core body creates closed loops for **eddy currents**:
* 📉 A measurable reduction in effective inductance.
* 🌡️ Additional $I^2R$ losses in the copper — adding heat to an already thermally constrained design.

> [!NOTE]
> The IHLP series is significantly less sensitive to nearby copper than unshielded drum-core or toroidal inductors. For unshielded inductors, a full keepout on all layers is mandatory. For the IHLP, the zone-based compromise below is the optimal approach.

### ✅ Recommended Strategy: Zone-Based Copper Fill

Divide the inductor footprint into two distinct zones:

#### Zone A — Under the Pads/Terminals (Solid Fill + Thermal Vias)
* 🟥 **Solid Fill:** Use a solid copper pour directly under each inductor terminal pad.
* 🔌 **Net Connection:** Connect to the appropriate net — `SW` for the input terminal, `VOUT` for the output terminal.
* 🔥 **Thermal Vias:** Populate a dense array (0.3 mm drill, 0.6 mm pad) in this zone. This is your primary heat extraction path — do not compromise on via density here.
* 🔗 **Layer Continuity:** Carry these per-net polygons through all layers to Layer 4 (see [Section 9](#9--layer-4-polygon-strategy-per-component-copper)).

#### Zone B — Under the Core Body (Hatched Fill → PGND)
* 🟫 **Hatched Fill:** Use a hatched (mesh) copper fill in the area directly beneath the inductor core body.
* 🛡️ **Net Connection:** **Always connect the hatched fill to `PGND`.** Never leave it floating — a floating copper island capacitively couples to the alternating field and radiates EMI like an antenna.
* ✂️ **Eddy Current Suppression:** The hatch pattern interrupts the large continuous loops eddy currents need to flow, minimising losses while still providing a thermal spreading path.

#### Recommended Hatch Parameters
| Parameter | Value | Reason |
|:---|:---:|:---|
| Line width | 0.2 – 0.3 mm | Narrow lines break large eddy current loops |
| Line spacing | 0.5 – 1.0 mm | Enough copper remaining for heat spreading |
| Pattern angle | 45° diagonal | Less likely to align with the inductor's primary flux axis |
| Net connection | `PGND` | Stable 0V reference, suppresses capacitive EMI coupling |

---

> [!TIP]
> **Component Reference:** Always refer back to the [Locked-In Component Quick Reference](README.md#locked-in-component-quick-reference) in the main README file when making schematic symbol or footprint assignments during layout.

---

## See Also

For via specifications, IPC-4761 via treatment types, Altium DRC rule configuration, and the IPC/IEC clearance and creepage standards (IPC-2221B, IEC 60664-1, IEC 62368-1), refer to the companion document:

➡️ **[PCB-manufacturing.md](PCB-manufacturing.md)**

