# Power Stage Design Calculations

Detailed component sizing, operating-point analysis, and selection rationale for the 120V → 52V interleaved synchronous buck converter.
Companion to the [main README](README.md) and [PCB Layout Guidelines](PCB-layout.md).

---

## Power Stage Design Calculations

### 1. Operating Duty Cycles
With a regulated $V_{out} = 52\text{ V}$:
* **Minimum Input ($V_{in, min} = 95\text{ V}$):** $D_{max} = \frac{52\text{ V}}{95\text{ V}} = 54.7\%$
* **Nominal Input ($V_{in, nom} = 104\text{ V}$):** $D_{nom} = \frac{52\text{ V}}{104\text{ V}} = 50.0\%$ (Perfect phase ripple cancellation point!)
* **Maximum Input ($V_{in, max} = 120\text{ V}$):** $D_{min} = \frac{52\text{ V}}{120\text{ V}} = 43.3\%$

### 2. Inductor Ripple & Peak Phase Current

The peak-to-peak inductor ripple current is given by:

$$\Delta I_L = \frac{V_{in} \cdot D \cdot (1-D)}{F_{sw} \cdot L}$$

With $V_{out}$ regulated constant and $D = V_{out}/V_{in}$, this simplifies to:

$$\Delta I_L = \frac{V_{out}}{F_{sw} \cdot L} \cdot \left(1 - \frac{V_{out}}{V_{in}}\right)$$

This form makes it clear that ripple is a monotonically increasing function of $V_{in}$ — the higher the input voltage, the larger the ripple. Worst case is always at **maximum input voltage**, not at D = 50%.

> [!TIP]
> **Inductor & Frequency Selection Tool:** Use the [Ripple Calculator App](calculator-app/index.html) to interactively visualise how inductor value and switching frequency trade off against ripple current, peak current, and saturation margin across the full 95–120V input range.


Using the [Vishay 82 µH](ihlp8787mz51.pdf) inductor ($I_{sat} = 9.0\text{ A}$, $DCR_{typ} = 31.46\text{ m}\Omega$) at $F_{sw} = 150\text{ kHz}$ under full 600 W output power per PCB ($I_{out} = 600\text{ W} / 52\text{ V} = 11.54\text{ A}$):

* **Average Phase Current ($I_{phase}$):** $11.54\text{ A} / 2\text{ phases} = 5.77\text{ A}$
* **Worst-Case Peak-to-Peak Ripple ($\Delta I_L$) at $V_{in} = 120\text{ V}$, $D = 43.3\%$:**
  $$\Delta I_L = \frac{52\text{ V}}{150\text{ kHz} \cdot 82\ \mu\text{H}} \cdot \left(1 - \frac{52}{120}\right) = \mathbf{2.40\text{ A}}$$
  $$\text{Ripple \%} = \frac{2.40\text{ A}}{5.77\text{ A}} = 41.6\% \quad \text{(Within the acceptable 30\%–50\% design window)}$$
* **Worst-Case Peak Phase Current ($I_{peak}$):**
  $$I_{peak} = I_{phase} + \frac{\Delta I_L}{2} = 5.77\text{ A} + 1.20\text{ A} = \mathbf{6.97\text{ A}}$$
* **Inductor Saturation Headroom:**
  $$\text{Margin} = \frac{9.0\text{ A} - 6.97\text{ A}}{6.97\text{ A}} = \mathbf{29.1\%} \quad \text{(Sufficient margin for motor transients)}$$
* **Inductor Power Dissipation ($P_{DCR}$):**
  $$P_{DCR} = I_{phase}^2 \cdot DCR = (5.77\text{ A})^2 \cdot 31.46\text{ m}\Omega = 1.05\text{ W per phase} \quad \text{(2.1 W total inductor heat per PCB)}$$


### 3. Input Capacitor (Cin) Calculations
The input capacitor provides a low-impedance local current source for the pulsed current drawn by the switching MOSFETs, preventing that current from flowing back through the battery cable inductance and causing voltage spikes. Sizing follows two sequential steps: **RMS ripple current first** (thermal/reliability), then **voltage ripple verification** from the chosen caps.

**Worst-Case Operating Point:** $V_{in} = 120\text{ V}$, $D = 43.3\%$, $I_{out} = 11.54\text{ A}$ per PCB, $F_{sw,eff} = 300\text{ kHz}$.

**Step 1 — RMS Ripple Current (Primary Constraint):**
This governs how many capacitors are needed in parallel. The input cap must handle without overheating:
$$I_{rms,in} = I_{out} \cdot \sqrt{D \cdot (0.5 - D)} = 11.54\text{ A} \cdot \sqrt{0.433 \times 0.067} = \mathbf{1.96\text{ A RMS}}$$
Choose capacitors whose **combined RMS ripple current rating at 300kHz ≥ 1.96A RMS**. This determines the number of caps in parallel; the capacitance value is secondary.

**Step 2 — Voltage Ripple & Transient Verification (with Chosen Components):**
Once caps are chosen, back-calculate effective capacitance and verify both steady-state ripple and input transient sag.

**Effective capacitance breakdown at 120V DC bias, 65°C:**

| Component | Qty | Nominal | Effective (derated) |
|:---|:---:|:---:|:---:|
| TDK CGA9P3X7T2E225K250KA (X7T MLCC) | 4 | 2.2 µF | ~1.1 µF/cap → **4.4 µF** |
| Nichicon ULV2D120MNL1GS (electrolytic) | 2 | 12 µF | ~12 µF/cap → **24 µF** |
| **Total effective** | | | **~28.4 µF** |

*MLCC derating read from TDK DC Bias Characteristic graph at 120V. Electrolytic has no significant DC bias derating.*

**Steady-state ripple voltage:**
$$\Delta V_{in} = \frac{I_{out} \cdot D \cdot (0.5 - D)}{C_{in,eff} \cdot F_{sw}} = \frac{11.54 \times 0.433 \times 0.067}{28.4\text{ µF} \times 150\text{ kHz}} = \frac{0.335}{4.26} = \mathbf{79\text{ mV}} \approx \mathbf{0.07\%}\text{ of }120\text{ V}$$

**Input transient voltage sag** (10A load step, 6.37µs loop response):
$$\Delta V_{in,sag} = \frac{\Delta I_{in} \cdot t_{response}}{C_{in,eff}} = \frac{(10\text{ A} \times 0.433) \times 6.37\text{ µs}}{28.4\text{ µF}} = \frac{4.33 \times 6.37\text{ µs}}{28.4\text{ µF}} = \mathbf{0.97\text{ V}} \approx \mathbf{0.81\%}\text{ of }120\text{ V}$$

Both results are well within the 1–2% industry target. The electrolytic contribution (24µF) dominates the total and is what keeps the transient sag below 1%.

> [!IMPORTANT]
> **DC Bias Derating — Input Array:** The input capacitor array consists of two sections:
> * **4x 2.2µF 250V X7T MLCC — [TDK CGA9P3X7T2E225K250KA](https://product.tdk.com/en/search/capacitor/ceramic/mlcc/info?part_no=CGA9P3X7T2E225K250KA&utm_source=mlcc_automotive_midvoltage_en.pdf&utm_medium=catalog) (2 per phase, placed local to each phase's high-side MOSFET):** Placing the caps directly at each switching loop is the correct approach — it minimises the parasitic inductance in the high-frequency current path and prevents di/dt voltage spikes on the drain. Because each set of 2 caps primarily serves its own phase's switching loop, they do **not** benefit from the full interleaving current cancellation; instead, each cap sees its phase's individual switching RMS current:
>   $$I_{rms,local} = I_{phase} \times \sqrt{D \times (1-D)} = 5.77\text{A} \times \sqrt{0.433 \times 0.567} = 2.86\text{ A RMS per phase set} \rightarrow \mathbf{1.43\text{ A per cap}}$$
>   The following observations are drawn directly from the characteristic graphs on the TDK product page:
>   * **ESR at 300kHz ≈ 5–15 mΩ (ESR graph):** The ESR curve reads approximately 5–15 mΩ at 300kHz. Self-heating per cap at 1.43A RMS: P = (1.43)² × 0.010 ≈ **20 mW** — still negligible.
>   * **Impedance at 300kHz well below resonance (Impedance graph):** The self-resonant frequency (impedance minimum) occurs around 1–5 MHz. At 300kHz the cap is deep in its capacitive region — it behaves as a proper capacitor at the switching frequency.
>   * **No capacitance loss at 300kHz (Capacitance vs Frequency graph):** The capacitance curve is completely flat up to ~1 MHz. There is zero frequency-related derating at 300kHz.
>   * **~1.0–1.2µF retained per cap at 120V (DC Bias Characteristic graph):** The curve peaks near 2.4µF at 0V bias and drops to approximately 1.0–1.2µF at 120V (≈ 48% of the 250V rated voltage). Each phase's 2 caps in parallel give **~2.2µF effective** at 120V. This is significantly better than standard X7R, which would typically retain only 20–30% of nominal at this voltage ratio.
>   * **Temperature-stable under bias (Temperature Characteristic graph):** The DC=125V curve stays flat at approximately 1.0–1.2µF across the full -55°C to +125°C range. At 65°C ambient with 120V bias, temperature adds no additional derating.
>   * **Small but finite self-heating at 1.43A (Ripple Temperature Rising graph):** Re-read this graph at 1.43A per cap (not 0.49A). At 300kHz (interpolate between the 100kHz and 500kHz curves), the temperature rise should be approximately **2–5°C** — well within acceptable limits for a part rated to 125°C.
> * **2x 12µF 200V aluminum electrolytic (bulk storage) — [Nichicon ULV2D120MNL1GS](https://datasheet.octopart.com/ULV2D120MNL1GS-Nichicon-datasheet-169250478.pdf?src-supplier=IHS):** 12µF, 200V, AEC-Q200, -40°C to +105°C, 10,000h life at 105°C, SMD 8×10mm.
>   * **Why this part fits:** The ULV (Ultra Low impedance, long-life) series is a good match. The 200V rating gives a 60% voltage stress ratio at 120V — electrolytics are typically derated to 80%, so 60% is conservative. The 105°C rating provides 40°C of headroom above the 65°C ambient. AEC-Q200 qualification guarantees reliability in a harsh sealed enclosure.
>   * **Role in this design:** The electrolytics provide **bulk energy storage and low-frequency transient buffering** only. They are NOT responsible for handling the 300kHz switching ripple current — the MLCCs absorb that.
>   * **Why the 80mA ripple current rating is not the constraint:** The datasheet rates ripple current at 50mA @ 120Hz and 80mA @ 10kHz. At 300kHz, an aluminum electrolytic's ESR is very high (hundreds of mΩ), so its impedance far exceeds that of the MLCCs (whose ESR at 300kHz is ~5mΩ total). In a parallel MLCC + electrolytic bank, current divides inversely with impedance — the electrolytic sees roughly <1% of the 1.96A switching ripple (≈ 20mA), well within its rating. The MLCCs absorb the rest.
>   * **Practical selection rationale:** The 12µF value and this specific package were selected for two practical reasons: (1) **Height compatibility** — the ULV2D120MNL1GS in the 8×10mm SMD package has a height (10mm) that closely matches the Vishay IHLP-8787MZ-51 inductor, allowing the top heatsink/enclosure cover to make direct thermal contact with both components simultaneously without requiring a stepped interface or custom spacers. (2) **Cost** — at 12µF in this voltage rating and package, this part offered a favourable price-to-performance ratio compared to higher-value alternatives.

### 4. Output Capacitor (Cout) Calculations
Output capacitor sizing is governed by **two independent constraints**. Both are calculated; the one requiring more capacitance wins.

**Constraint 1 — Steady-State Output Voltage Ripple:**
A 1–2% peak-to-peak output voltage ripple is the standard engineering target for power converter design. Targeting 1%:
$$\Delta V_{out,target} = 1\% \times 52\text{ V} = \mathbf{0.52\text{ V}}$$
At the 300 kHz effective switching frequency, the 2-phase interleaved architecture operating near 50% duty cycle provides significant ripple current cancellation at the output. The residual peak-to-peak ripple current reaching the output cap at $D = 43.3\%$ is approximately:
$$\Delta I_{out,ripple} \approx \Delta I_L \times (1 - 2D) = 2.40\text{ A} \times (1 - 0.866) = \mathbf{0.32\text{ A}}$$
For ceramic MLCCs with negligible ESR, the capacitance required to meet the ripple target is:
$$C_{out,ripple} = \frac{\Delta I_{out,ripple}}{8 \times F_{sw,eff} \times \Delta V_{out,target}} = \frac{0.32\text{ A}}{8 \times 300\text{ kHz} \times 0.52\text{ V}} = \mathbf{0.26\text{ µF}}$$
The steady-state ripple constraint is trivially small. It is **not the sizing driver**.

**Constraint 2 — Transient Load Step (Dominant Constraint):**
During a sudden load step, the control loop cannot respond instantaneously. The output capacitor must supply the full current deficit until the inductor current catches up.
* **Worst-Case Load Step ($\Delta I_{load}$):** 4 ESCs simultaneously accelerating → **10A step** (from 1.5A idle to 11.54A peak).
* **Maximum Voltage Sag Budget ($\Delta V_{sag}$):** $\mathbf{2.6\text{ V}}$ (5% of the 52V rail). Modern ESCs tolerate ±5% supply variation without stability issues, making this a practical and achievable target.
* **Loop Response Time:** With the LTC7810 crossover frequency targeted at $F_{co} = 25\text{ kHz}$:
  $$t_{response} = \frac{1}{2\pi \cdot F_{co}} = \frac{1}{2\pi \times 25\text{ kHz}} = 6.37\ \mu\text{s}$$
* **Required Output Capacitance:**
  $$C_{out,transient} = \frac{\Delta I_{load} \times t_{response}}{\Delta V_{sag}} = \frac{10\text{ A} \times 6.37\ \mu\text{s}}{2.6\text{ V}} = \mathbf{24.5\ \mu\text{F}}$$

**Result: Transient constraint governs. Minimum required $C_{out,eff} = 24.5\text{ µF}$.**

> [!NOTE]
> **Sensitivity to Loop Crossover Frequency:** The required capacitance scales directly with loop response time. If the actual compensated crossover frequency differs from the 25kHz target, the requirement changes as follows:
>
> | F_co (achieved) | t_response | C required | MLCC only (~16–24µF) | MLCC + electrolytics (~60–68µF) |
> |:---:|:---:|:---:|:---:|:---:|
> | 15 kHz | 10.6 µs | 40.8 µF | ❌ Insufficient | ✅ 1.5–1.7× |
> | 25 kHz | 6.37 µs | **24.5 µF** | ⚠️ Borderline | ✅ **2.4–2.8×** |
> | 35 kHz | 4.55 µs | 17.5 µF | ✅ Marginal | ✅ 3.4–3.9× |
>
> The X7R DC bias derating on the output MLCCs is more severe than X7T on the input side. The electrolytics are **load-bearing** across the full crossover frequency range, not just a safety buffer.

> [!IMPORTANT]
> **DC Bias Derating — Output Array:** The output capacitor array consists of two sections:
> * **4x 10µF 100V X7R MLCC — C1210X106K101T (2 per phase, placed local to each phase's output filter):** The 1210 package X7R dielectric has more aggressive DC bias derating than the X7T used on the input side. At 52V DC bias on a 100V-rated X7R cap (52% of rated voltage), retained capacitance is typically **40–60%** of nominal — significantly worse than X7T:
>   * **Effective capacitance range:** 4 × 10µF × (40–60%) = **16–24µF effective** at 52V
>   * **At 25kHz crossover:** 16–24µF vs 24.5µF required → ⚠️ **borderline — the MLCC array alone may not meet the requirement depending on exact derating**
>   * **Action required:** Find the manufacturer's DC bias characteristic curve for C1210X106K101T and read the retained capacitance at 52V. If the retained value is below 6µF per cap (~24µF total), the electrolytics are essential (not optional) to meet the transient specification.
>   * **Per-phase ripple current:** Each phase's 2 output MLCCs see the inductor ripple RMS current per phase: $I_{rms} = \Delta I_L / (2\sqrt{3}) = 2.40 / 3.46 = 0.69\text{ A RMS per phase} \rightarrow 0.35\text{ A per cap}$ — not a concern for the 1210 package.
> * **2x 22µF 100V aluminum electrolytic (transient buffer) — United Chemi-Con EMVH101ARA220MJA0G:** 22µF, 100V, AEC-Q200, -40°C to +125°C, 2,000h life at 125°C (≈ 128,000h at 65°C by Arrhenius), SMD 10×10mm.
>   * **Voltage headroom:** 52V operating on a 100V-rated cap = 52% stress ratio — well within the 80% derating guideline.
>   * **Height compatibility:** The 10mm seated height matches both the Vishay IHLP-8787MZ-51 inductor and the input Nichicon electrolytic, allowing the heatsink/top cover to make contact with all tall components at the same level — same practical rationale as the input electrolytic selection.
>   * **ESR (550mΩ max):** High ESR is common for aluminum electrolytics and is not a concern here. The 4x MLCC array has an array ESR of ~5mΩ — orders of magnitude lower — so the MLCCs absorb virtually all instantaneous transient current. The electrolytic's role is slower bulk charge delivery where its ESR-induced voltage drop is negligible.
>   * **Ripple current (115mA @ 100kHz):** Same reasoning as the input electrolytics — at 300kHz, the electrolytic's impedance is far higher than the MLCCs, so it sees only a small fraction of the switching ripple current, well within its rating.




### 5. The Role of Equivalent Series Resistance (ESR)
Equivalent Series Resistance (ESR) is the internal parasitic resistance of the capacitors. In this ceramic-only (MLCC) design, ESR plays a critical role in three areas:

1. **Switching Ripple & Transient Sag (Negligible Impact):**
   Total peak-to-peak output voltage ripple is the sum of capacitive ripple and resistive ripple ($\Delta I_L \cdot ESR$). A parallel array of ceramic MLCCs yields an extremely low array ESR (typically under $0.5\text{ m}\Omega$). Consequently, ESR-induced voltage ripple and instantaneous dynamic step sag ($\Delta I_{load} \cdot ESR$) are virtually zero.
2. **Capacitor Self-Heating (Massive Benefit):**
   High-frequency ripple current flowing through ESR causes active power loss ($I_{rms}^2 \cdot ESR$) and self-heating. Because of the microscopic ESR of the parallel ceramic arrays, the input capacitors generate less than $1\text{ mW}$ of internal heat. This guarantees thermal survivability in the sealed, zero-airflow IP65 enclosure.
3. **Control Loop Stability — Hybrid MLCC + Electrolytic Array:**
    The output capacitor array is a parallel combination of the 4x MLCC array and the 2x electrolytic bank. These two types behave very differently at the frequencies relevant to loop compensation, and together they create a more complex — but potentially useful — output impedance profile.

    * **MLCC contribution (HF):** The MLCC array has an array ESR of approximately **5–20 mΩ**. The ESR zero of the MLCC section alone sits at:
      $$f_{z,MLCC} = \frac{1}{2\pi \times R_{ESR,mlcc} \times C_{mlcc,eff}} \approx \frac{1}{2\pi \times 0.010 \times 20\text{ µF}} \approx \mathbf{800\text{ kHz}}$$
      This is far above the target crossover frequency. The MLCCs cannot provide phase boost; they look like a pure integrator up to the switching frequency.

    * **Electrolytic contribution (LF):** The 2x electrolytic bank has a combined ESR of approximately **275 mΩ** (550 mΩ / 2 in parallel). Its ESR zero is:
      $$f_{z,elec} = \frac{1}{2\pi \times R_{ESR,elec} \times C_{elec}} \approx \frac{1}{2\pi \times 0.275 \times 44\text{ µF}} \approx \mathbf{13\text{ kHz}}$$
      This falls **within the crossover frequency range (15–35 kHz)** — so the electrolytics **do** provide a natural ESR zero that could assist phase boost near crossover.

    * **The complication:** The exact frequency and magnitude of this ESR zero depends on the electrolytic ESR (which varies with temperature) and on how much capacitance the MLCCs are actually contributing after DC bias derating (which affects the relative weight of the two parallel branches). The loop behaviour is therefore **sensitive to the final cap configuration**.

    * **Compensation approach:** A **Type II compensation network** on the `ITH` pin is required regardless — the MLCC branch provides no ESR zero near crossover. However, the electrolytic ESR zero may provide useful natural phase boost. The optimal compensation values (R, C on ITH) **must be determined empirically** by measuring the actual open-loop Bode plot on the bench with the final assembled cap array, as the effective ESR zero frequency will shift with temperature and the MLCC DC bias derating may differ from estimates.

> [!TIP]
> When tuning compensation on the bench, measure the Bode plot at both cold start (25°C) and after thermal soak (65°C). The electrolytic ESR drops with temperature, shifting the ESR zero to a higher frequency — the phase margin at 65°C may differ noticeably from the room-temperature measurement.

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
*   **Shunt Resistor Value ($R_{SENSE}$):** Selected as **9.0 mΩ (1% tolerance)** — the nearest safe standard value. This sets the hardware peak current limit at:
    $$I_{limit} = \frac{V_{SENSE(MAX)}}{R_{SENSE}} = \frac{75\text{ mV}}{9.0\text{ m}\Omega} = \mathbf{8.33\text{ A peak}}$$
*   **Margin analysis** (using $I_{peak} = 6.97\text{ A}$ from Section 2):
    $$\text{Margin above operating peak} = \frac{8.33 - 6.97}{6.97} = \mathbf{19.5\%}$$
    $$\text{Headroom below inductor saturation (9.0 A)} = \frac{9.0 - 8.33}{9.0} = \mathbf{7.4\%}$$
    The 7.4% saturation headroom is tight — the inductor will not saturate under normal operation, but this leaves minimal margin for current overshoots during hard transients. Monitor peak inductor current on the first board bring-up.
*   **Shunt Conduction Loss:** $P_{loss} \approx I_{phase}^2 \cdot R_{SENSE} = (5.77\text{ A})^2 \cdot 9\text{ m}\Omega = \mathbf{0.30\text{ W}}$ (easily handled by a 1206-size 0.5W shunt).

> [!WARNING]
> **Lossless DCR Sensing Mismatch:** Although inductor DCR sensing is lossless, the 82 µH inductor DCR (31.46 mΩ typ) is too large. It would trigger the 75mV comparator at only 2.38A phase current, necessitating a complex resistor divider in the sense network. Additionally, copper DCR drifts by +39% when heating up to 100°C, eroding your current limit by 29%. Using a **discrete 9.0 mΩ shunt resistor** is highly recommended for temperature stability.


#### C. Switching Frequency Resistor (FREQ)
The LTC7810 frequency is programmed via a resistor from the FREQ pin to ground. The FREQ pin sources a constant 20 µA.
*   **Datasheet Frequency Formula:**
    $$R_{FREQ} = \frac{f_{OSC}\text{ [kHz]}}{9} + 13.5\text{ k}\Omega = \frac{150}{9} + 13.5 = \mathbf{30.1\text{ k}\Omega}$$
*   **Selected Value:** $\mathbf{30.1\text{ k}\Omega}$ **(1% tolerance, E96 standard value)** — consistent with the schematic annotation (R10 ≈ 30k) and the datasheet formula.

> [!TIP]
> **Bench Verification Required:** The LTC7810 VCO may exhibit some non-linearity near 150 kHz. Measure the actual per-phase switching frequency on the first assembled board with an oscilloscope at the TG pin. If the frequency is off target, trim R_FREQ up or down by one E96 step (30.1kΩ → 30.9kΩ or 29.4kΩ).

#### D. Under-Voltage Lockout (UVLO) and Over-Voltage Lockout (OVLO) via RUN/OVLO Pins
To protect both the battery pack (against deep discharge) and the converter components (against high-voltage spikes), a single **3-resistor divider** ($R3$, $R4$, $R5$) is configured as shown in Figure 5 of the LTC7810 datasheet:
*   **Startup Enable Threshold (UVLO Rising):** Set to **$80.0\text{ V}$** ($2.86\text{ V/cell}$).
*   **Over-Voltage Protection Threshold (OVLO Rising):** Set to **$135.0\text{ V}$** (safely above the 120V battery charge limit, well below the 150V silicon max).
*   **Total Divider Resistance ($R_{TOTAL}$):** Fixed at **$1.218\text{ M}\Omega$** ($1218.5\text{ k}\Omega$) using standard E24 values.

Using standard, high-volume E24 resistor values:
1.  **Bottom Resistor ($R5$, OVLO to GND):**
    *   **Select standard $\mathbf{11\text{ k}\Omega}$ (1% tolerance)** (targets $135.0\text{V}$ OVLO rising)
2.  **Middle Resistor ($R4$, RUN to OVLO):**
    *   **Select standard $\mathbf{7.5\text{ k}\Omega}$ (1% tolerance)** (targets $80.0\text{V}$ UVLO rising)
3.  **Top Resistor ($R3$, $V_{IN}$ to RUN):**
    *   **Select standard $\mathbf{1.2\text{ M}\Omega}$ (1% tolerance)**

*Resulting Operational Thresholds:*
*   **Startup (UVLO Rising):** $1.22\text{ V} \times \frac{1218.5\text{ k}\Omega}{7.5\text{ k}\Omega + 11.0\text{ k}\Omega} = \mathbf{80.4\text{ V}}$ ($2.87\text{ V/cell}$)
*   **Shutdown (UVLO Falling):** $1.10\text{ V} \times \frac{1218.5\text{ k}\Omega}{18.5\text{ k}\Omega} = \mathbf{72.5\text{ V}}$ ($2.59\text{ V/cell}$)
*   **Over-Voltage Disable (OVLO Rising):** $1.22\text{ V} \times \frac{1218.5\text{ k}\Omega}{11.0\text{ k}\Omega} = \mathbf{135.1\text{ V}}$
*   **Over-Voltage Recovery (OVLO Falling):** $1.155\text{ V} \times \frac{1218.5\text{ k}\Omega}{11.0\text{ k}\Omega} = \mathbf{127.9\text{ V}}$ (with 65mV internal hysteresis)

#### E. 2-Phase Mode Pin Strapping & Control Pins (VFB2, ITH2, TRACK/SS1, TRACK/SS2, PLLIN)
To configure the LTC7810 for a single-output 2-phase interleaved converter (paralleling the two channels), several pins must be strapped or configured specifically:
*   **VFB2 (Channel 2 Feedback):** Tie directly to **INTVCC**. This disables the error amplifier of Channel 2 and configures the controller to run in 2-phase single-output mode. In this mode, both channels share the feedback, compensation, and tracking/soft-start controls of Channel 1 internally.
*   **RUN2:** Tie directly to **RUN1**. This ensures that both phases start up and shut down simultaneously.
*   **ITH2 (Channel 2 Compensation):** Since Channel 2's error amplifier is disabled and the current control loop internally references `ITH1`, the `ITH2` pin is unused. To prevent high-frequency noise from coupling into this pin, it **should be grounded**. Tying it directly to ground is acceptable, but connecting it to ground via a **1 nF capacitor** is recommended to achieve the lowest Burst Mode quiescent current. Do **not** tie `ITH1` and `ITH2` together (unlike some older controllers).
*   **TRACK/SS2 (Channel 2 Soft-Start):** This pin is unused because Channel 2 follows Channel 1's soft-start ramp internally. Just like `ITH2`, it should be grounded or connected to ground via a **1 nF capacitor** to prevent noise coupling.
*   **TRACK/SS1 (Channel 1 Soft-Start):** This controls the soft-start ramp of the combined 2-phase output. Connect a capacitor ($C_{SS}$) from `TRACK/SS1` to ground to program the soft-start time. With the internal 10 µA current source charging $C_{SS}$:
    $$t_{SS} = C_{SS} \times \frac{1\text{ V}}{10\ \mu\text{A}}$$
    *Select a standard **0.1 µF (100 nF, 16V, X7R, 0603)** capacitor to set a stable and gentle **10 ms** soft-start ramp.*
*   **PLLIN/SPREAD:** This pin controls external synchronization and spread-spectrum frequency dithering:
    *   **Disable Spread Spectrum (Default):** Tie `PLLIN/SPREAD` directly to **GND** to run at a fixed 150 kHz frequency set by $R_{FREQ}$.
    *   **Enable Spread Spectrum:** Tie `PLLIN/SPREAD` directly to **INTVCC** to enable spread-spectrum clock dithering. This helps reduce peak EMI signature near the 150 kHz fundamental and harmonics.

### 7. Feedback Loop Compensation Sizing (ITH)

> [!WARNING]
> **Preliminary values only — bench tuning required.** All compensation values below are calculated from estimated component parameters. Measure the open-loop Bode plot on the first assembled board at both 25°C and 65°C and adjust R_comp and C_comp to achieve the target crossover and phase margin.

The compensation formula for the LTC7810 Type II network (R_comp, C_comp, C_filter on ITH):
$$R_{comp} = 2\pi \cdot F_{co} \cdot C_{out} \cdot \frac{V_{out}}{V_{ref}} \cdot \frac{10 \cdot R_{SENSE}}{g_m} \qquad C_{comp} = \frac{1}{2\pi \cdot R_{comp} \cdot f_{p,out}} \qquad C_{filter} = \frac{1}{2\pi \cdot R_{comp} \cdot F_{sw}/2}$$

**Fixed parameters (common to both cases):**

| Parameter | Value |
|:---|:---:|
| Target $F_{co}$ | 25 kHz |
| $g_m$ (error amplifier) | 2.0 mS |
| $10 \times R_{SENSE}$ (current sense gain) | 0.090 V/A |
| $V_{out}/V_{ref}$ | 52 |
| $R_{load}$ at full load | 52V / 11.54A = 4.51 Ω |

---

#### Case A — MLCC Array Only (no electrolytic bulk caps)

**Output capacitance:** 4x C1210X106K101T (X7R, 10µF 100V) at 52V DC bias → **~20µF effective** (40–60% retention, mid-estimate).

No natural ESR zero near crossover — the MLCC array ESR zero sits at ~800kHz, well above $F_{co}$.

$$f_{p,out} = \frac{1}{2\pi \cdot C_{out} \cdot R_{load}} = \frac{1}{2\pi \times 20\text{ µF} \times 4.51\text{ Ω}} = \mathbf{1{,}764\text{ Hz}}$$

| Component | Calculation | Standard Value |
|:---|:---|:---:|
| $R_{comp}$ | $2\pi \times 25\text{k} \times 20\text{µF} \times 52 \times 45 = 7.35\text{ kΩ}$ | **7.32 kΩ (E96, 1%)** |
| $C_{comp}$ | $1/(2\pi \times 7.32\text{k} \times 1764\text{ Hz}) = 12.3\text{ nF}$ | **12 nF** |
| $C_{filter}$ | $1/(2\pi \times 7.32\text{k} \times 75\text{ kHz}) = 290\text{ pF}$ | **270 pF** |

> [!CAUTION]
> **Transient sag exceeds budget in this configuration.** With only 20µF of output capacitance, a 10A load step at 25kHz crossover produces:
> $$\Delta V_{sag} = \frac{10\text{ A} \times 6.37\text{ µs}}{20\text{ µF}} = \mathbf{3.19\text{ V} = 6.1\%} \quad \text{(budget: 5\% = 2.6V)}$$
> To meet the 5% sag budget with MLCC-only, the loop crossover must be at least:
> $$F_{co,min} = \frac{\Delta I}{2\pi \cdot C_{out} \cdot \Delta V_{sag}} = \frac{10}{2\pi \times 20\text{ µF} \times 2.6} \approx \mathbf{30.6\text{ kHz}}$$
> This configuration is only viable if the compensated crossover is tuned above ~31kHz on the bench.

---

#### Case B — Full Array (MLCC + Electrolytic Bulk Caps)

**Output capacitance:** 4x MLCCs (~20µF effective) + 2x EMVH101ARA220MJA0G (22µF each, no significant DC bias derating) → **~64µF effective total**.

The 2x electrolytics introduce a natural ESR zero at ~13kHz (combined ESR ≈ 275mΩ, 44µF):
$$f_{z,ESR} = \frac{1}{2\pi \times 0.275\text{ Ω} \times 44\text{ µF}} \approx \mathbf{13\text{ kHz}}$$
This falls within the crossover region and provides useful phase boost near $F_{co}$.

$$f_{p,out} = \frac{1}{2\pi \cdot C_{out} \cdot R_{load}} = \frac{1}{2\pi \times 64\text{ µF} \times 4.51\text{ Ω}} = \mathbf{551\text{ Hz}}$$

| Component | Calculation | Standard Value |
|:---|:---|:---:|
| $R_{comp}$ | $2\pi \times 25\text{k} \times 64\text{µF} \times 52 \times 45 = 23.5\text{ kΩ}$ | **23.7 kΩ (E96, 1%)** |
| $C_{comp}$ | $1/(2\pi \times 23.7\text{k} \times 551\text{ Hz}) = 12.2\text{ nF}$ | **12 nF** |
| $C_{filter}$ | $1/(2\pi \times 23.7\text{k} \times 75\text{ kHz}) = 89.5\text{ pF}$ | **91 pF** |

Transient sag with 64µF at 25kHz crossover: $10\text{A} \times 6.37\text{µs} / 64\text{µF} = \mathbf{1.0\text{ V} = 1.9\%}$ — well within the 5% budget.

> [!NOTE]
> **Interesting coincidence:** $C_{comp} = 12\text{ nF}$ in both cases. This is mathematically expected: when the compensation zero is placed at the load pole, $C_{comp}$ simplifies to $R_{load} / (2\pi \cdot F_{co} \cdot (V_{out}/V_{ref}) \cdot A_i)$, which is independent of $C_{out}$. Only $R_{comp}$ and $C_{filter}$ change between cases.



### 8. Bootstrap Capacitor (Cboot) Calculations
The high-side gate driver requires a floating bootstrap capacitor to provide the charge to fully enhance the high-side N-channel MOSFET (**onsemi FDMS86252**).

* **High-Side MOSFET Parameters:** $Q_g = 11\text{ nC}$ typical / $15\text{ nC}$ maximum total gate charge (at $V_{GS} = 10\text{ V}$).
* **Gate Drive Supply Voltage ($V_{boot}$):** $10\text{ V}$ (from INTVCC).
* **Maximum ON-Time ($t_{on, max}$):** $3.65\ \mu\text{s}$ at $V_{in} = 95\text{ V}$ ($D = 54.7\%$, $F_{sw} = 150\text{ kHz}$).
* **Total High-Side Charge Consumed ($Q_{total}$):** Includes gate charge, high-side driver quiescent current ($1\text{ mA} \cdot 3.65\ \mu\text{s} = 3.65\text{ nC}$), and bootstrap diode reverse recovery ($2\text{ nC}$):
  $$Q_{total} = Q_g + Q_{driver} + Q_{rr\_diode} \approx 15\text{ nC} + 3.65\text{ nC} + 2\text{ nC} = \mathbf{20.65\text{ nC}}$$
* **Target Maximum Bootstrap Voltage Droop ($\Delta V_{boot}$):** $\mathbf{0.5\text{ V}}$ (5% of supply) to maintain high-side MOSFET enhancement and minimize $R_{DS(on)}$ conduction loss.
* **Required Minimum Capacitance ($C_{boot, min}$):**
  $$C_{boot, min} = \frac{Q_{total}}{\Delta V_{boot}} = \frac{20.65\text{ nC}}{0.5\text{ V}} = \mathbf{41.3\text{ nF}}$$
* **Stability Design Margin (20x Rule-of-Thumb):**
  $$C_{boot} \ge 20 \cdot \frac{Q_g}{V_{GS}} = 20 \cdot \frac{15\text{ nC}}{10\text{ V}} = \mathbf{30\text{ nF}}$$

*Note: Selecting a standard **0.1 µF, 50V, X7R (0603 size)** ceramic capacitor provides a highly robust effective capacitance of **0.09 µF** under 10V DC bias. This keeps the actual voltage droop at a microscopic 0.23V, ensuring cool, high-efficiency high-side gate enhancement.*

### 9. MOSFET Selection and Power Dissipation Calculations (onsemi FDMS86252)
To achieve high robustness and fit within the strict BOM cost constraints, the design utilizes the **onsemi FDMS86252** N-channel shielded gate PowerTrench® MOSFET. Each of the two 600W PCBs utilizes 4 MOSFETs (2 per phase: 1 high-side and 1 low-side).

#### A. Key MOSFET Parameters (at $V_{GS} = 10\text{ V}$)
*   **Drain-to-Source Voltage ($V_{DSS}$):** $150\text{ V}$
*   **On-Resistance ($R_{DS(on)}$):** $43.9\text{ m}\Omega$ typical / $51.0\text{ m}\Omega$ maximum (at $T_J = 25^\circ\text{C}$)
*   **Junction-to-Case Thermal Resistance ($R_{\theta JC}$):** $2.5\text{ }^\circ\text{C/W}$
*   **Total Gate Charge ($Q_g$):** $11\text{ nC}$ typical / $15\text{ nC}$ maximum
*   **Gate-to-Drain Miller Charge ($Q_{gd}$):** $2.4\text{ nC}$ typical
*   **Gate-to-Source Charge ($Q_{gs}$):** $2.8\text{ nC}$ typical
*   **Input Capacitance ($C_{iss}$):** $678\text{ pF}$ typical / $905\text{ pF}$ maximum (at $V_{DS} = 75\text{ V}, V_{GS} = 0\text{ V}, f = 1\text{ MHz}$)
*   **Output Capacitance ($C_{oss}$):** $74\text{ pF}$ typical / $115\text{ pF}$ maximum (at $V_{DS} = 75\text{ V}, V_{GS} = 0\text{ V}, f = 1\text{ MHz}$)
*   **Reverse Transfer Capacitance ($C_{rss}$):** $4.3\text{ pF}$ typical / $10.0\text{ pF}$ maximum (at $V_{DS} = 75\text{ V}, V_{GS} = 0\text{ V}, f = 1\text{ MHz}$)
*   **Body Diode Reverse Recovery Charge ($Q_{rr}$):** $61\text{ nC}$ typical / $98\text{ nC}$ maximum (at $I_F = 4.6\text{ A}, di/dt = 100\text{ A/}\mu\text{s}$)

#### B. Worst-Case Operating Loss Calculations per Phase
Operating at nominal input voltage ($V_{in} = 104\text{ V}$, $D = 50.0\%$), full load ($I_{phase} = 5.77\text{ A}$ per phase), $F_{sw} = 150\text{ kHz}$, and a programmed gate drive voltage of $10\text{ V}$:

##### 1. Temperature-Derated On-Resistance
At full load within the sealed $65^\circ\text{C}$ ambient IP65 enclosure, the junction temperature is estimated to rise to $T_J \approx 120^\circ\text{C}$. The $R_{DS(on)}$ increases by a temperature factor of $1.75\times$:
$$R_{DS(on), hot, typ} = 43.9\text{ m}\Omega \times 1.75 = 76.83\text{ m}\Omega$$
$$R_{DS(on), hot, max} = 51.0\text{ m}\Omega \times 1.75 = 89.25\text{ m}\Omega$$

##### 2. High-Side (HS) MOSFET Losses
*   **Conduction Loss ($P_{cond, HS}$):**
    $$P_{cond, HS, max} = I_{phase}^2 \times R_{DS(on), hot, max} \times D = (5.77\text{ A})^2 \times 89.25\text{ m}\Omega \times 0.50 = \mathbf{1.49\text{ W}}$$
    $$P_{cond, HS, typ} = (5.77\text{ A})^2 \times 76.83\text{ m}\Omega \times 0.50 = \mathbf{1.28\text{ W}}$$
*   **Switching Loss ($P_{sw, HS}$):**
    Switching transitions are extremely fast due to the LTC7810's strong gate drive. Sizing for a conservative $15\text{ ns}$ turn-on/turn-off cross-over window to account for gate drive loop inductance and rise/fall slew controls:
    $$P_{sw, HS} = V_{in} \times I_{phase} \times F_{sw} \times t_{sw} = 104\text{ V} \times 5.77\text{ A} \times 150\text{ kHz} \times 15\text{ ns} = \mathbf{1.35\text{ W}}$$
*   **Body Diode Reverse Recovery Loss ($P_{rr, HS}$):**
    The high-side switch must sweep away the opposing low-side body diode reverse recovery charge during turn-on:
    $$P_{rr, HS, max} = V_{in} \times Q_{rr, max} \times F_{sw} = 104\text{ V} \times 98\text{ nC} \times 150\text{ kHz} = \mathbf{1.53\text{ W}}$$
    $$P_{rr, HS, typ} = V_{in} \times Q_{rr, typ} \times F_{sw} = 104\text{ V} \times 61\text{ nC} \times 150\text{ kHz} = \mathbf{0.95\text{ W}}$$
*   **Total High-Side MOSFET Loss ($P_{total, HS}$):**
    $$P_{total, HS, max} = 1.49\text{ W} + 1.35\text{ W} + 1.53\text{ W} = \mathbf{4.37\text{ W}}$$
    $$P_{total, HS, typ} = 1.28\text{ W} + 1.35\text{ W} + 0.95\text{ W} = \mathbf{3.58\text{ W}}$$

> [!NOTE]
> **High-side loss: conservative hand calculation vs simulation**
>
> The **4.4W worst-case figure above is a deliberate upper bound**, not the expected operating loss. Two sources of conservatism:
> 1. **Maximum-spec Qrr (98nC):** The datasheet's maximum reverse recovery charge is used. The typical value is 61nC, which reduces the Qrr loss from 1.53W → 0.95W. Real silicon will sit between these.
> 2. **Conservative 15ns switching window:** The actual LTC7810 gate drive is quite aggressive. In practice, the switching transition time may be shorter, reducing switching loss.
>
> **LTpowerCAD simulation** accounts for realistic gate drive waveforms, actual device timing, and die temperature — and shows noticeably lower losses than the hand calculation. The simulation result should be treated as the primary design reference; the hand calculation defines the worst-case thermal ceiling.
>
> **Thermal resistance context:** The datasheet's RθJA values (50°C/W on a 1 in² 2oz copper pad, 125°C/W on a minimum pad) are based on a standard FR-4 test board with **no heatsink**. This design uses:
> - Dense thermal via arrays under the PQFN exposed pad
> - Direct copper conduction through the bottom layer
> - Mechanical contact to an external enclosure heatsink (RθCS ≪ 50°C/W)
>
> The actual junction-to-ambient thermal resistance will be substantially lower than the datasheet test conditions. Verify with an infrared camera or thermocouple on first bring-up.
>
> **Rev2 parallel MOSFET consideration:** If sustained full-load thermal testing shows the high-side device running above ~100°C case temperature, a second parallel high-side MOSFET footprint per phase would halve the per-device losses and is the recommended Rev2 path.





##### 3. Low-Side (LS) MOSFET Losses
*   **Conduction Loss ($P_{cond, LS}$):**
    $$P_{cond, LS, max} = I_{phase}^2 \times R_{DS(on), hot, max} \times (1 - D) = (5.77\text{ A})^2 \times 89.25\text{ m}\Omega \times 0.50 = \mathbf{1.49\text{ W}}$$
    $$P_{cond, LS, typ} = (5.77\text{ A})^2 \times 76.83\text{ m}\Omega \times 0.50 = \mathbf{1.28\text{ W}}$$
*   **Switching Loss ($P_{sw, LS}$):**
    $$P_{sw, LS} \approx \mathbf{0\text{ W}} \quad \text{(Zero Voltage Switching - current is naturally diverted through body diode first)}$$
*   **Body Diode Conduction Loss ($P_{diode, LS}$):**
    With a programmed LTC7810 dead-time of $t_{dead} \approx 35\text{ ns}$ per transition, the load current conducts through the internal body diode ($V_{F, typ} \approx 0.8\text{ V}$):
    $$P_{diode, LS} = 2 \times V_F \times I_{phase} \times t_{dead} \times F_{sw} = 2 \times 0.8\text{ V} \times 5.77\text{ A} \times 35\text{ ns} \times 150\text{ kHz} = \mathbf{0.05\text{ W}}$$
*   **Total Low-Side MOSFET Loss ($P_{total, LS}$):**
    $$P_{total, LS, max} = 1.49\text{ W} + 0.05\text{ W} = \mathbf{1.54\text{ W}}$$
    $$P_{total, LS, typ} = 1.28\text{ W} + 0.05\text{ W} = \mathbf{1.33\text{ W}}$$

##### 4. Combined MOSFET Losses per Phase
*   **Total MOSFET Dissipation per Phase:** $P_{total, phase} = 4.91\text{ W}$ typical / $5.91\text{ W}$ worst-case.
*   **Thermal Verification:** With dense thermal via arrays placed under the 8-PQFN DFN packages and direct conduction through the bottom layer to the enclosure (external heatsink thermal resistance path $R_{\theta CS} \approx 1.5\text{ }^\circ\text{C/W}$), the worst-case junction temperature rise above the heatsink is:
    For a maximum heatsink case temperature of $90^\circ\text{C}$, the junction temperature stabilizes at a safe $107.5^\circ\text{C}$, leaving massive headroom under the MOSFET's $150^\circ\text{C}$ absolute maximum rating.

### 10. Parasitic Ringing & RC Snubber Design (Optional / DNP)
To prevent high-frequency voltage ringing (typically $50\text{ MHz} - 150\text{ MHz}$) on the switch node (`SW`) and suppress radiated electromagnetic interference (EMI) that could jam drone GPS/telemetry, placeholders for a series RC snubber are added across the low-side switch node (parallel to the low-side MOSFET, from `SW` to `GND`). 

*   **DNP Status:** These footprints are marked as **DNP (Do Not Populate)** by default and are only populated if bench testing reveals excessive switch node overshoot or EMI.
*   **Capacitor Sizing ($C_{snub}$):** Sized to $\approx 6\times$ the MOSFET's output capacitance ($C_{oss} = 74\text{ pF}$) to absorb resonant energy without introducing excessive switching loss:
    $$C_{snub} = \mathbf{470\text{ pF}} \quad \text{(250V, C0G, 0805 or 1205 Size)}$$
*   **Resistor Sizing ($R_{snub}$):** Sized to match the characteristic impedance of the parasitics:
    $$R_{snub} = \mathbf{10\ \Omega\text{ to }22\ \Omega} \quad \text{(1\% Tolerance, 1W or 2W, 2512 Size)}$$
*   **Power Dissipation ($P_{snub}$):** Recalculated snubber loss at nominal operating conditions is extremely low:
    $$P_{snub} = C_{snub} \times V_{in}^2 \times F_{sw} = 470\text{ pF} \times (104\text{ V})^2 \times 150\text{ kHz} = \mathbf{0.76\text{ W per phase}}$$
    *(Using a standard $0.1\ \mu\text{F}$ capacitor in this position would dissipate an unacceptable $162\text{ W}$ of heat, destroying the board).*
*   **Layout Placement:** The RC snubber loop must be placed physically directly adjacent to the low-side MOSFET drain and source pins to minimize path loop inductance. (Refer to [PCB-layout.md](PCB-layout.md) for critical placement guidelines).

### 11. Output Clamping & Transient Protection Diodes
To protect the buck converter stage, output MLCC array, and the LTC7810 controller against inductive load spikes and motor-related transient energy, two types of protection diodes are added to the 52V output rail:

#### A. Overvoltage Protection: TVS Diode (D_TVS)
*   **The Hazard:** BLDC motors driven by ESCs can inject large amounts of energy back onto the 52V rail during regenerative braking or abrupt deceleration. Because this design utilizes a low-capacitance ceramic-only output array ($42.5\ \mu\text{F}$ effective under bias), returned energy can cause the output voltage to spike rapidly. If the voltage exceeds the $150\text{V}$ rating of the MOSFETs or the absolute maximum voltage of the controller, the silicon will fail.
*   **The Solution:** A high-power Transient Voltage Suppressor (TVS) diode is placed directly from the 52V output rail to ground.
*   **Component Selection:** **Littelfuse SMCJ60A** (SMC package) is selected.
    *   **Reverse Standoff Voltage ($V_{RWM}$):** $60.0\text{ V}$ (safely above the $52\text{V}$ output, ensuring zero leakage during normal operation).
    *   **Breakdown Voltage ($V_{BR}$):** $66.7\text{ V}$ minimum / $73.7\text{ V}$ maximum.
    *   **Clamping Voltage ($V_{CL}$):** Clamps high-current transients to a maximum of **$96.8\text{ V}$**, which is safely below the $150\text{V}$ MOSFET limit.
*   **Note on Continuous Regeneration:** A TVS diode only protects against *microsecond-scale* transient spikes. If the ESCs perform sustained high-energy regenerative braking, the TVS will overheat. For sustained braking, the system relies on the motor controller's current/braking limits, the main battery pack's ability to absorb charge, or an external brake chopper.


### 12. EXTVCC Auxiliary Bias Supply (Optional / Dual Placeholder)
To supply the gate drive voltage to the internal driver LDO on the `EXTVCC` pin of the LTC7810, the PCB layout includes dual footprints as placeholders. This allows evaluating two options during testing:

#### Option A: Active Step-Down Buck Module
*   **Component:** **TI TPSM365R6FRDNR** (adjustable synchronous buck power module).
*   **Description:** Steps the regulated $52\text{ V}$ rail down to a clean $12.0\text{ V}$ output to feed `EXTVCC`.
*   **Passives Required:** $10\ \mu\text{F}$ input capacitor, $22\ \mu\text{F}$ output capacitor, $1\ \mu\text{F}$ VCC bypass capacitor, and a feedback divider ($110\text{ k}\Omega$ / $10\text{ k}\Omega$).
*   **Pros/Cons:** Highest efficiency, lowest thermal dissipation, but higher component count and BOM cost.

#### Option B: Passive Series Zener Dropper
*   **Component:** **Diodes Inc. SMAZ12-13-F** ($12\text{ V}$, 1W Zener diode in SMA package) connected in series from the $52\text{ V}$ output to `EXTVCC`.
*   **Description:** Drops the $52\text{ V}$ rail by $12\text{ V}$, supplying $40\text{ V}$ to the `EXTVCC` pin.
    *   **Zener Dissipation:** $P_Z \approx 12\text{ V} \times 14\text{ mA} = 0.17\text{ W}$ (very cool for the 1W SMA package).
    *   **LTC7810 LDO Dissipation:** $P_{LDO} \approx (40\text{ V} - 10\text{ V}) \times 14\text{ mA} = 0.42\text{ W}$ in the controller.
*   **Alternate Values:** To keep the LTC7810 cooler, a **$33\text{ V}$ Zener** (e.g. 1SMA5937 / 1SMB5937) can be substituted to drop `EXTVCC` to $19\text{ V}$. This shifts the heat dissipation ($P_Z \approx 0.49\text{ W}$) onto the Zener diode, reducing the controller's internal LDO loss to just $126\text{ mW}$.
*   **Bleed Resistor ($R_{bleed}$):** A $22\text{ k}\Omega$ 0603 pull-down resistor to GND is added at the `EXTVCC` pin to maintain Zener breakdown conduction and prevent the node from floating to $52\text{ V}$ during sleep mode.

### 13. Chassis Grounding & Common-Mode EMI Mitigation
To safely mount the PCB to the metal enclosure (which also serves as the heatsink) while suppressing high-frequency electromagnetic interference (EMI) and avoiding ground loops, a hybrid grounding architecture is implemented.

*   **The Hazard:** The high dV/dt switching node (SW) on Layer 4 couples capacitively to the metal chassis through the Thermal Interface Material (TIM). With a dV/dt of approx. 8 V/ns (120V switching in 15 ns) and an estimated SW-to-chassis parasitic capacitance of 20 pF, this path drives high-frequency common-mode return currents (exceeding 100 mA peak) into the chassis.
*   **The Grounding Strategy:** 
    *   Three of the board's four mounting holes are left electrically isolated (floating).
    *   One single mounting hole (closest to the input connector) is electrically active and serves as the single point of contact between the PCB ground and the chassis, preventing low-frequency ground loops.
    *   To suppress EMI on both power lines, Y-capacitors are placed from both the 120V input (VIN) and Power Ground (PGND) to the chassis right at the power entry point.
*   **AC Grounding (Y-Capacitors):** 
    *   A Y-capacitor from VIN to the chassis and a Y-capacitor from PGND to the chassis provide low-impedance AC return paths back to the PCB, shunting common-mode noise back to its source before it can radiate from the input cables.
    *   **Component Selection:** Standard surface-mount Class X1/Y2 safety-certified capacitors (e.g., **Knowles Syfer 1808Y2500103KXT**, 10 nF, 250 VAC / 1000 VDC) are used. The 1808 package footprint saves space, and Knowles' FlexiCap flexible polymer termination protects the ceramic body against board flex and motor vibration cracks.
*   **DC Safety (Bleed Resistors):**
    *   To prevent electrostatic charge or leakage from raising the chassis to a hazardous potential, a high-value static bleed resistor (2.0 MΩ total) is connected in parallel with the PGND Y-capacitor (bridging the chassis node directly to PGND).
    *   **Crucial Safety Rule:** No bleed resistor is placed on the VIN-to-chassis path. This ensures that the chassis remains locked to the safe PGND (0V) potential, and the VIN-to-chassis path remains a complete DC open-circuit.
    *   **Component Selection:** Two **1.0 MΩ, 0805 (or 1206) 1% thick-film resistors are placed in series** to provide redundant shock protection and double the physical voltage clearance rating (400V combined) against transient voltage surges.

