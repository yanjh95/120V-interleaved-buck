# 120V-interleaved-buck

[![Hardware Status](https://img.shields.io/badge/Hardware-In_Development-yellow.svg)](#)

Design and validation repository for a 120 V input multi-rail DC/DC system, starting with an interleaved 48 V synchronous buck and extending to 24 V and 12 V rails. Includes calculations, parts, simulations, measurements, layout notes, and test results.

## High-Level 48 V Converter Requirements
*Note: All design choices, topology selections, and component specifications must be strictly guided by and evaluated against these requirements.*
* **Input:** 95-120 VDC input source.
* **Output:** Regulated 48 VDC output.
* **Power:** Support up to 1.2 kW total output power.
* **Load:** Supply 8 BLDC motors driven by ESCs.
* **Environment:** Operate in a 65 C ambient environment.
* **Enclosure:** Housed in an IP65-rated enclosure.
* **Weight:** Complete converter assembly, including the enclosure, shall weigh less than 1 kg.
* **Volume:** The final assembly shall be smaller than 1500 cm³.
* **Cost:** The total Bill of Materials (BOM) cost must be less than $150.
* **Dynamic Loading:** The 48 V bus shall support dynamic ESC and motor loading, including startup, acceleration, braking, and simultaneous motor load changes.
* **Thermals:** The design shall account for limited airflow and thermal constraints associated with a sealed enclosure.
* **Protection:** Include suitable protection for fault conditions, including overcurrent, short circuit, overtemperature, input undervoltage, and output overvoltage.
* **Telemetry (Optional):** The primary design philosophy is to create a highly robust, deterministic system that relies on hardware-level protection and conservative component derating such that it will not fail under specified constraints. If this level of robustness is achieved, active telemetry reporting to a host controller may be omitted entirely.

## Architecture & Design Documents
* [Topology Trade Study](converter_topologies.md) - A detailed breakdown of the various macro-topologies (LLC, Flyback, Buck) and technologies (GaN vs. Silicon) evaluated against the strict project constraints.
