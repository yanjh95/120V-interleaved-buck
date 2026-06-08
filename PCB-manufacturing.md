# PCB Manufacturing Reference (120V Interleaved Buck)

[![Fab](https://img.shields.io/badge/Fab-PCBWay-blue.svg)](#)
[![Stack-up](https://img.shields.io/badge/Stack--up-4L_1.2mm-orange.svg)](#)
[![HV](https://img.shields.io/badge/Input-120V_DC-red.svg)](#)
[![Standards](https://img.shields.io/badge/Standards-IPC--2221B_|_IEC_60664--1_|_IEC_62368--1-green.svg)](#)

> [!NOTE]
> This document covers the **manufacturing and compliance** side of the design: via specifications, IPC-4761 via treatment types, Altium DRC rule configuration, and the IPC/IEC standards that govern clearance, creepage, and user safety isolation.
> For component placement, routing strategy, grounding, and stack-up layer assignments, see [PCB-layout.md](PCB-layout.md).

---

## 1. 🔩 Via Specifications

Three standardised via types are used across the board. Signal and thermal vias intentionally share the same 0.3 mm drill to minimise fab setup cost and eliminate the risk of using the wrong via type in a critical location.

| Via Type | Drill | Pad | Annular Ring | Pitch / Spacing |
|:---|:---:|:---:|:---:|:---:|
| **Signal** | 0.3 mm | 0.6 mm | 0.15 mm | N/A |
| **Thermal** | 0.3 mm | 0.6 mm | 0.15 mm | 0.9 – 1.2 mm pitch |
| **Edge Stitch** | 0.4 mm | 0.8 mm | 0.20 mm | 3 – 5 mm spacing |

### Signal Vias (0.3 mm drill / 0.6 mm pad)
* 📐 **Aspect Ratio:** 1.2 mm board ÷ 0.3 mm drill = **4:1** — well inside the IPC-6012 Class 2 limit of 8:1. Any standard fab can hold this reliably.
* ⚡ **Inductance:** Approximately **0.4 – 0.6 nH** per via through the 1.2 mm stack-up. For the TG/SW layer-transition pair (see PCB-layout.md §4), route the two vias adjacent to each other — opposing currents partially cancel each other's magnetic fields, reducing effective loop inductance.
* 🛣️ **Usage:** All inter-layer signal transitions: `SENSE+`/`SENSE-` differential pairs, `VFB` feed, `RUN`, `OVLO`, and the TG/SW gate drive pair transitioning to Layer 3.
* 🔩 **IPC-4761 Type:** **Type 1b** (tented both sides) — standard solder mask tenting. Free, keeps barrel clean, no solder wicking risk since no component sits directly on top.

### Thermal Vias (0.3 mm drill / 0.6 mm pad)
* 🌡️ **Thermal Resistance:** Approximately **142 °C/W** per via through 1.2 mm of board. A **4×4 array (16 vias)** reduces this to **~9 °C/W** before accounting for lateral copper spreading resistance — which significantly lowers the effective junction-to-heatsink contribution.
* 📏 **Pitch:** Space at **0.9 – 1.2 mm center-to-center**. Tighter than 0.9 mm reduces the copper land between vias, weakening mechanical adhesion to the pad.
* 🎯 **Placement:** Dense arrays directly beneath the exposed thermal pads of all 4 MOSFETs (FDMS86252) and the LTC7810. Also populate under the inductor terminal pads (Zone A — see PCB-layout.md §11).
* 🔩 **IPC-4761 Type for via-in-pad:**

| Option | IPC-4761 Type | Cost | Thermal | DG-M02 |
|:---|:---:|:---:|:---:|:---:|
| Copper fill + cap (VIPPO) | **Type 7** | $$ adder | ✅ Best | ✅ |
| Non-conductive epoxy fill | Type 5/6 | $ adder | ⚠️ Reduced | ✅ |
| Solder mask tenting (top only) | **Type 1a** | Free | ✅ Unaffected | ✅ |
| Via-not-in-pad | None | Free | ⚠️ Slightly reduced | ✅ |
| No treatment | None | Free | ✅ Unaffected | ❌ Solder bump risk |

**Recommendation:** Use **Type 7** (VIPPO) for MOSFET thermal pads (highest heat load, 5.9W max). Use **Type 1a** (free top-side tenting) for the LTC7810 controller thermal pad (~0.5W). Use **Type 1b** for all signal and edge-stitch vias.

> [!WARNING]
> **Solder wicking on via-in-pad:** Untreated thermal vias under exposed thermal pads (PQFN, eLQFP) allow molten solder to wick down the barrel during reflow, starving the thermal joint. Any solder that exits on Layer 4 also creates a bump that violates DG-M02 (flat heatsink interface). Always specify a via treatment for any via placed inside a thermal pad.

### Edge Stitching Vias (0.4 mm drill / 0.8 mm pad)
* 🛡️ **Purpose:** Connects all four PGND layers along the board perimeter, forming a low-impedance Faraday fence that prevents high-frequency common-mode fields from escaping or entering the board edge.
* 📏 **Spacing:** **3 – 5 mm** around the full perimeter. Satisfies the EMI rule of λ/20 at the highest frequency of concern (switch-node ringing up to ~150 MHz: λ/20 ≈ 100 mm). 5 mm pitch is already conservative; use 3 mm for maximum shielding.
* 📐 **Size Rationale:** Slightly larger than signal vias (0.4 mm vs 0.3 mm) for: (1) improved mechanical durability during depaneling and drone vibration, and (2) marginally lower via impedance for better HF performance.
* 🎯 **Placement:** Keep via centers at least **0.5 mm inside the board outline** to prevent drill breakout through the edge.
* 🔌 **Net Connection:** Connect to `PGND`, stitching through the solid L2 and L4 PGND planes as a minimum. Include L1 and L3 PGND copper if present at the board edge.
* 🔩 **IPC-4761 Type:** **Type 1b** (tented both sides) — standard tenting keeps the barrel clean during assembly.

---

## 2. 📐 Altium Design Rules (PCBWay Baseline + HV Additions)

This section documents the complete Altium Design Rules configuration for this board. It is split into three parts: the **PCBWay baseline rules** (manufacturable, low-voltage defaults), the **high-voltage additions** that must be layered on top for 120V compliance, and the **CASE net safety rules** for user protection. The baseline rules are valid as-is for all low-voltage nets; the additions override them for HV-class nets only.

### Part A — PCBWay Baseline Rules: Rationale

| Altium Rule | Value | Why This Value Is Correct for This Design |
|:---|:---:|:---|
| **Electrical Clearance, general** | 0.15 mm | Correct minimum for low-voltage signal nets (VFB, ITH, SENSE, RUN, OVLO). PCBWay can reliably hold 0.15 mm. **Must be overridden for HV nets — see Part B.** |
| **Routing Width, signal min** | 0.15 mm | Adequate for microamp-level analog signals (VFB divider, ITH, FREQ). Any narrower risks opens during fabrication at PCBWay yield. |
| **Routing Width, signal preferred** | 0.20 mm | The right default for all SGND-referenced signals on this board. Wide enough to be robust, narrow enough to route through the dense IC area. |
| **Routing Width, power preferred** | Set by current | Power trace widths are calculated from IPC-2221 for each net's current (5.77A phase, 11.54A output rail) and set as individual net-class rules, not a single global value. |
| **Via Diameter min** | 0.60 mm | Matches the §1 via specification exactly (0.3 mm drill, 0.6 mm pad, 0.15 mm annular ring). PCBWay can hold this reliably. |
| **Via Hole min** | 0.30 mm | Matches the §1 spec. This drill size gives a 4:1 aspect ratio through the 1.2 mm board — well within IPC-6012 Class 2 limits. |
| **Via Annular Ring** | 0.15 mm | Provides the full 0.15 mm ring around a 0.30 mm drill to reach the 0.60 mm pad diameter. Safely above PCBWay's manufacturing minimum. |
| **Hole-to-hole clearance** | 0.30 mm min | Prevents drill breakout between adjacent vias. At 0.9 mm via pitch (thermal array spacing), edge-to-edge distance = 0.9 − 0.6 = 0.30 mm — this rule exactly catches any pitch violations. |
| **Copper to board edge** | 0.25 mm | Sufficient for internal copper pours. Edge stitching vias are placed 0.50 mm from the board outline (see §1), so they already satisfy this rule with margin. |
| **Solder Mask Expansion** | 0.05 mm | Opens the solder mask 0.05 mm beyond each pad edge. Adequate for PCBWay's 2 mil green mask process. Prevents mask from encroaching onto pads while keeping adjacent mask slivers intact. |
| **Solder Mask Sliver / Bridge** | 0.10 mm | The minimum mask bridge between adjacent pads (e.g., between MOSFET gate and source pins). 0.10 mm is the practical lower limit for green mask; use 0.114 mm if ordering black or colored mask. |
| **Silkscreen Width** | 0.15 mm min (0.18–0.20 mm preferred) | PCBWay can print 0.15 mm silkscreen but yields better at 0.18–0.20 mm. Thicker lines survive wave-cleaning and are more readable for bring-up and debug. |
| **Silkscreen Height** | 1.0 mm min | Text below 1.0 mm becomes unreadable on the finished board. This limit ensures reference designators and test point labels are legible under lab conditions. |
| **Silkscreen to Solder Mask** | 0.10 mm | Keeps silkscreen ink from printing over exposed copper pads. Ink over pads interferes with soldering and causes flux adhesion issues. |
| **Polygon Pour Clearance** | 0.15 mm general / 0.8 mm HV coated / 2.5 mm uncoated | The general 0.15 mm matches low-voltage PGND fill clearances. The HV override (see Part B) governs VIN-to-PGND and SW-to-PGND pour boundaries. |
| **Component Courtyard / Placement** | 0.25–0.50 mm | Not a fab limit — prevents overlapping component bodies during assembly. 0.25 mm is the absolute minimum; 0.50 mm is preferred in the dense IC area for rework access. |

---

### Part B — High-Voltage Additions (Required for 120V Compliance)

> [!CAUTION]
> The 0.15 mm general clearance rule will **pass DRC and still arc over** on the physical board between 120V VIN copper and GND copper. These additional rules must be created in Altium and given higher priority than the baseline rule. They do not replace the baseline — they override it for HV nets only.

**The requirement:** IPC-2221B Table 6-1 specifies minimum electrical clearance for 101–300V DC:

| Layer Type | Uncoated (B1) | Coated — conformal (B3) | Internal (B4) |
|:---|:---:|:---:|:---:|
| External (L1, L4) | 2.5 mm | **0.8 mm** | — |
| Internal (L2, L3) | — | — | **0.5 mm** |

The HV clearance rules below use **0.8 mm for coated external layers** and **0.5 mm for internal layers**, per IPC-2221B. If the board is shipped without conformal coating, increase the external rule to **2.5 mm**. These values govern **PCB conductor-to-conductor** clearance (arc prevention) only — the CASE net is governed separately by IEC 60664-1 for user safety.

#### Step 1 — Create a High Voltage Net Class

In **Design → Classes → Net Classes**, create:

```
Class name: High_Voltage
Members:    VIN, SW_Ph1, SW_Ph2, BOOST_Ph1, BOOST_Ph2
```

> SW nodes are included because they switch 0–120V and can spike to ~130–140V during turn-off ringing. They must observe the same clearance rules as the VIN rail.

#### Step 2 — Add Clearance Rules (Design Rules → Electrical → Clearance)

Create the following rules, each with **higher priority** than the 0.15 mm default rule:

| Rule Name | Where (First Object) | Where (Second Object) | Min Clearance | Applies To | Governing Standard |
|:---|:---|:---|:---:|:---|:---:|
| `HV_External_Coated` | `InNetClass('High_Voltage')` | `All` | **0.8 mm** | L1, L4 — board with conformal coating | IPC-2221B B3 |
| `HV_External_Uncoated` | `InNetClass('High_Voltage')` | `All` | **2.5 mm** | L1, L4 — board without conformal coating | IPC-2221B B1 |
| `HV_Internal_Clearance` | `InNetClass('High_Voltage')` | `All` | **0.5 mm** | L2, L3 (internal layers) | IPC-2221B B4 |
| `Chassis_All_Clearance` | `InNet('Case')` | `All` | **2.0 mm** | All layers | IEC 60664-1 creepage |

> [!NOTE]
> Use either `HV_External_Coated` **or** `HV_External_Uncoated` — not both. Enable the one that matches your final assembly specification. If conformal coating is not confirmed at layout time, use the conservative **2.5 mm uncoated** rule and tighten it later once the coating process is locked.

#### Step 3 — Override Polygon Pour Clearance for HV Nets

In **Design Rules → Electrical → Clearance**, add:

```
Rule name:    HV_Pour_Clearance_Coated
First net:    InNetClass('High_Voltage')
Second net:   All
Clearance:    0.8 mm          ← use 2.5 mm if no conformal coating
Layer scope:  External layers (L1, L4)
Priority:     Higher than baseline polygon clearance rule
```

This prevents Altium from routing VIN or SW copper pours 0.15 mm from the PGND flood on Layer 1 — a violation that would otherwise silently pass DRC under the baseline rule.

#### Summary: Effective Clearance Matrix

| From \ To | PGND / SGND | VIN | SW | CASE |
|:---:|:---:|:---:|:---:|:---:|
| **PGND / SGND** | 0.15 mm | **0.8 mm** (L1/L4 coated) | **0.8 mm** (L1/L4 coated) | 2.0 mm |
| **VIN** | **0.8 mm** (L1/L4 coated) | — | 0.15 mm | 2.0 mm |
| **SW** | **0.8 mm** (L1/L4 coated) | 0.15 mm | — | 2.0 mm |
| **CASE** | 2.0 mm | 2.0 mm | 2.0 mm | — |

> [!NOTE]
> The 0.8 mm HV-to-PGND values apply to **coated external layers (L1, L4) with conformal coating** per IPC-2221B B3. Without conformal coating, increase to **2.5 mm** per IPC-2221B B1. On internal layers (L2, L3), 0.5 mm is sufficient per IPC-2221B B4. The 2.0 mm CASE values are governed by **IEC 60664-1 creepage requirements** (user safety), not by IPC-2221B.

---

### Part C — CASE Net Safety Isolation (User Protection)

#### Why CASE Isolation Is a Safety-Critical Requirement

The aluminum heatsink and IP65 enclosure are physically accessible to the drone operator. The `CASE` net sits at chassis ground potential under normal operation — but if the isolation between any 120V net and `CASE` fails due to inadequate clearance, a solder bridge, or dielectric breakdown, the entire accessible metal enclosure could rise to 120V DC.

* ☠️ **120V DC is a lethal voltage.** Cardiac fibrillation threshold is approximately 60–100 mA through the chest. At 120V and a typical body resistance of 1–2 kΩ, fault current of 60–120 mA is achievable — well above the lethal threshold.
* 🛡️ **These are safety rules, not just electrical rules.** The `CASE` clearance constraints must not be relaxed as a routing convenience.

#### Clearance vs. Creepage — The Two Distances That Matter

Both measurements must be satisfied independently:

| Term | Definition | Where It Applies |
|:---|:---|:---|
| **Clearance** | Shortest through-air distance between two conductors | Gaps between copper pours, via pads, component leads |
| **Creepage** | Shortest distance along the PCB surface between two conductors | Along solder mask, around edges, through slots |

* 💧 Creepage is always ≥ clearance. Contamination (flux residue, moisture) lowers surface resistance and allows current to track at voltages far below the air breakdown level. The IP65 enclosure prevents external ingress, but the PCB surface itself accumulates flux during assembly.
* 🔬 **Creepage is not checked by Altium DRC** — it must be measured manually on the physical board or using a dedicated creepage analysis tool.

---

#### Governing Standards

#### 1. 📘 IEC 60664-1 — Insulation Coordination for Low-Voltage Equipment

The primary standard for clearance and creepage in system-level design. Inputs for this design:

* ⚡ **Working voltage:** 120V DC peak
* 🔌 **Overvoltage Category:** CAT II (equipment connected to fixed installation, e.g., mains-fed drone charging)
* 💨 **Pollution Degree:** PD2 — normally non-conductive, but condensation occurs seasonally on an outdoor drone platform
* 🧱 **Material Group:** IIIb — standard FR4, Comparative Tracking Index (CTI) 175–249

| Insulation Level | Clearance (120V, CAT II, PD2) | Creepage (120V, PD2, Group IIIb) |
|:---|:---:|:---:|
| **Basic insulation** | 0.8 mm | 2.0 mm |
| **Double / Reinforced insulation** | 1.6 mm | 4.0 mm |

The `CASE`-to-VIN boundary requires at minimum **basic insulation**. The `Chassis_All_Clearance` rule of **2.0 mm** satisfies the basic insulation clearance with margin and matches the basic insulation creepage requirement exactly.

> [!IMPORTANT]
> Creepage is not automatically checked by Altium's standard clearance DRC. Ensure no solder mask opening, PCB slot, or board edge creates a surface path shorter than 2.0 mm between any VIN/SW copper and the CASE mounting pad.

---

#### 2. 📗 IEC 62368-1 — AV/IT Equipment Safety
*(Successor to IEC 60950-1 and IEC 60065. Mandatory in EU, increasingly adopted globally)*

IEC 62368-1 classifies energy sources by potential for injury:

| Level | DC Voltage | Classification |
|:---:|:---:|:---|
| **ES1** | ≤ 60V DC | Not hazardous — touch is safe |
| **ES2** | > 60V DC and ≤ **120V DC** | Conditionally hazardous — one safeguard required |
| **ES3** | **> 120V DC** | Hazardous — two safeguards (reinforced insulation) required |

* ⚠️ **120V DC VIN is at the ES2 upper boundary.** It requires at least one safeguard between VIN and any user-accessible part. The PCB clearance/creepage to CASE constitutes that safeguard.
* 🚨 **SW nodes are ES3.** The SW node switches 0–120V and rings to 130–140V during MOSFET turn-off — above the 120V DC ES2 limit. Strictly interpreted, SW-to-CASE isolation should use reinforced insulation (1.6 mm clearance, 4.0 mm creepage). The `Chassis_All_Clearance` rule of 2.0 mm satisfies the clearance requirement, but **creepage must be manually verified to be ≥ 4.0 mm** between any SW copper and the CASE pad if pursuing formal IEC 62368-1 certification.
* 📋 **IEC 62368-1 scope note:** This standard covers AV/IT equipment. A drone power converter may alternatively fall under IEC 61010-1 (measurement/control equipment) or IEC 61204-7 (power supply safety). Confirm the applicable standard with your certification body before pre-compliance testing.

---

#### 3. 📙 IPC-2221B — Generic Standard on Printed Board Design

The IPC standard governs minimum conductor-to-conductor spacing on the PCB itself (arc prevention — not user safety):

| Voltage (DC/AC peak) | External, Uncoated (B1) | External, Coated (B3) | Internal (B4) |
|:---:|:---:|:---:|:---:|
| 101 – 300V | 2.5 mm | **0.8 mm** | 0.5 mm |

* 🔴 **IPC-2221B governs arc prevention only.** It does not govern user safety isolation — that is the role of IEC 60664-1 and IEC 62368-1.
* ✅ **With conformal coating:** 0.8 mm is sufficient for VIN/SW-to-PGND clearance on external layers.
* ⚠️ **Without conformal coating:** 2.5 mm is required on external layers. Choose one Altium rule and enable it based on your final assembly specification.

> [!WARNING]
> If this product will be CE-marked or submitted for UL listing, third-party testing labs will measure actual creepage distances on the physical board — not just check the Altium DRC. Physical clearance to the mounting hole standoff pad, through the gap pad, to the aluminum enclosure must also be evaluated.

> [!NOTE]
> **IPC-2221B vs. IEC 60664-1:** IPC-2221B governs conductor-to-conductor electrical clearance on the PCB (arc prevention). IEC 60664-1 governs insulation for user safety. For non-CASE interfaces (VIN to PGND), IPC-2221B is the relevant standard — 0.8 mm at 120V with conformal coating. For CASE interfaces, IEC 60664-1 + IEC 62368-1 govern — the 2.0 mm Altium rule for CASE is justified by the creepage requirement, not by clearance alone.

---

#### CASE Net Rule Summary

| Net Pair | Governing Standard | Min Clearance | Min Creepage | Altium Rule Value | Basis |
|:---|:---|:---:|:---:|:---:|:---|
| VIN → PGND (external, coated) | **IPC-2221B B3** | 0.8 mm | N/A | **0.8 mm** | Arc prevention between PCB conductors |
| VIN → PGND (external, uncoated) | **IPC-2221B B1** | 2.5 mm | N/A | **2.5 mm** | Same, no coating |
| VIN → PGND (internal L2/L3) | **IPC-2221B B4** | 0.5 mm | N/A | **0.5 mm** | Internal conductors, lower requirement |
| VIN → CASE | **IEC 60664-1** basic insulation | 0.8 mm | **2.0 mm** | **2.0 mm** | 2.0 mm set to satisfy creepage; clearance min is 0.8 mm but 2.0 mm provides margin and partially enforces creepage via DRC |
| SW → CASE | **IEC 60664-1** basic insulation / **IEC 62368-1** ES3 | 0.8 mm | **≥ 4.0 mm** | **2.0 mm** ⚠️ | SW rings to ~130V (ES3) — clearance satisfied, but creepage **must be manually verified ≥ 4.0 mm** for formal IEC 62368-1 certification |
| PGND → CASE | **IEC 60664-1** (conservative) | 0.8 mm | 2.0 mm | **2.0 mm** | PGND is 0V but gap pad is the isolation barrier; uniform CASE clearance simplifies DRC |
| Creepage (all CASE interfaces) | **IEC 60664-1 Table F.4** | — | **≥ 2.0 mm** (VIN/PGND) / **≥ 4.0 mm** (SW) | Manual check required | Altium DRC does not measure surface creepage — must be verified on physical board |
