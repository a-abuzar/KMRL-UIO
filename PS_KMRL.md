Problem Statement ID: **25081**

Problem Statement Title:

AI-Driven Train Induction Planning \& Scheduling for Kochi Metro Rail Limited (KMRL)

**Description**

Kochi Metro must decide every night which of its 25 four-car trainsets will enter revenue service at dawn, which remain on standby, and which are held back in the Inspection Bay Line (IBL) for maintenance. The decision hinges on six inter-dependent variables:

1\. **Fitness Certificates** – validity windows issued by Rolling-Stock, Signalling and Telecom departments.

*2. **Job-Card Status** – open vs. closed work orders exported from IBM Maximo.*

3\. **Branding Priorities** – contractual commitments that dictate exterior wrap exposure hours.

4\. **Mileage Balancing** – kilometre allocation to equalise bogie, brake-pad and HVAC wear.

5\. **Cleaning \& Detailing Slots** – available manpower and bay occupancy for interior deep-cleaning.

6\. **Stabling Geometry** – physical bay positions that minimise nightly shunting and morning turn-out time.



At present these data points reside in siloed spreadsheets, manual logbooks, and daily WhatsApp updates. Supervisors reconcile them in a time-compressed window (21:00–23:00 IST) using ad-hoc filters and experience-based heuristics. The process is opaque, non-repeatable, and highly error-prone:



● Missing a single telecom clearance can force an unscheduled rake withdrawal, eroding the 99.5 % punctuality KPI.

● Uneven mileage assignment accelerates component fatigue, inflating maintenance cost.

● Inadequate visibility into branding priorities risks breaching advertiser SLAs, exposing KMRL to revenue penalties.

● Excessive night-time shunting to rearrange rakes increases energy consumption and track-occupancy safety risk.



With *fleet size slated to grow to 40 trainsets and two depots by 2027*, the existing manual workflow cannot scale linearly—neither in staffing nor in cognitive load.



Therefore, KMRL requires an integrated, algorithm-driven decision-support platform that can:



● Ingest heterogeneous inputs (Maximo exports, IoT fitness sensors, UNS streams, manual overrides) in near-real-time.

● Enforce rule-based constraints and multi-objective optimisation (service readiness, reliability, cost, branding exposure).

● Generate a ranked induction list with explainable reasoning, conflict alerts, and “what-if” simulation.

● Learn from historical outcomes via machine-learning feedback loops to improve forecast accuracy over time.



Such a system will transform induction planning from a manual reconciliation exercise into a reproducible, auditable, data-driven process—delivering higher fleet availability, lower lifecycle cost, and an enhanced passenger experience while freeing operations staff to focus on strategic exceptions rather than routine data wrangling.



Organization	**Government of Kerala**



Department	**Kochi Metro Rail Limited (KMRL)**



Category	Software



Theme	Smart Automation

