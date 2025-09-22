
# Questions for Kochi Metro Rail Limited (KMRL)

## Introduction

This document lists key questions for our contact at Kochi Metro Rail Limited (KMRL). The goal is to gather detailed, real-world data and business rules to customize and refine our AI-Driven Train Induction Planning & Scheduling platform. The answers to these questions will be critical in transforming the current prototype into a production-ready system that accurately models and optimizes KMRL's daily operations.

---

## Section 1: General Infrastructure & Operational Constraints

This section focuses on the physical layout of the depot and high-level operational rules.

### Fleet Composition
1.  What is the exact number of trainsets in the current operational fleet?
2.  How are trainsets uniquely identified? (e.g., a number like "T-1", "T-2", etc.)
3.  Are all trainsets identical? If not, what are the key differences (e.g., capacity, age, specific equipment) that might affect scheduling?

### Depot Layout & Capacity
4.  How many depots are currently in operation?
5.  How many **Inspection Bay Lines (IBLs)** are available for maintenance work each night? What is the maximum number of trains that can be on these lines simultaneously?
6.  How many **Stabling Bay Lines** are used for parking trains overnight? What is their capacity?
7.  How many lines are dedicated to **Cleaning & Detailing**? How many trains can be cleaned at the same time?
8.  Are there any other specialized tracks or bays we should be aware of (e.g., for heavy repair, wheel profiling)?

### Daily Operations
9.  What is the standard number of trainsets required for daily revenue service? How does this number vary for weekdays, weekends, and public holidays?
10. What is the mandatory minimum number of trainsets that must be available on **Standby**?
11. The problem statement mentions a planning window of 21:00–23:00 IST. Is this accurate? When does the final decision need to be locked in?
12. Who are the key personnel (roles) involved in making the final induction decision?

---

## Section 2: Detailed Data Input Questions

This section dives into the specifics of the six key data variables. For each variable, we need to understand its source, format, update frequency, and the business rules that govern it.

### 1. Fitness Certificates
1.  **Data Source:** Where does this data originate? (e.g., a specific software, a digital logbook, paper certificates that are manually logged)
2.  **Data Format:** In what format is this data available? (e.g., Excel/CSV file, a database table, an API from another system)
3.  **Update Frequency:** How often is this data updated? (e.g., daily, in real-time as certificates are issued)
4.  **Data Fields:** For a single certificate, what information can we get? We assume: `Trainset_ID`, `Certificate_Type` (Rolling-Stock, Signalling, Telecom), `Issue_Date`, `Expiry_Date`, `Issuing_Authority`, `Certificate_ID`. Is there anything else?
5.  **Business Rules:**
    *   What is the exact definition of "Expired"? Does a certificate expiring today make the train unavailable for tomorrow's service?
    *   Is there a "grace period" for renewal, or is the expiry date a hard deadline?
    *   Are there any warning periods (e.g., "Expires in 7 days") that supervisors act on?

### 2. Job-Card Status (from IBM Maximo)
1.  **Data Source:** Is it possible to get a direct, automated data feed from IBM Maximo (e.g., via an API)? Or will it always be a manual data export?
2.  **Data Format:** If it's an export, what is the file format? (e.g., CSV, XML, Excel)
3.  **Update Frequency:** How often can we receive this data? (e.g., a daily dump at a specific time, hourly, or in real-time)
4.  **Data Fields:** For a job card, we assume: `Work_Order_ID`, `Trainset_ID`, `Description`, `Work_Status` (Open, In Progress, Closed), `Priority_Level`, `Date_Created`. What else is available?
5.  **Business Rules:**
    *   What are all the possible "Priority Levels"? The problem statement mentions "Critical." What are the others (e.g., High, Medium, Low)?
    *   What is the precise rule for a "Critical" job card? Does it absolutely prevent the train from entering service?
    *   Can a train with an "Open" but non-critical job card be used for service? Are there any restrictions?

### 3. Branding Priorities
1.  **Data Source:** How is this information currently tracked? (e.g., a central spreadsheet, a contracts management system)
2.  **Data Format:** In what format can we access this data?
3.  **Update Frequency:** How often does this data change or get updated?
4.  **Data Fields:** For each contract, we assume: `Contract_ID`, `Advertiser_Name`, `Trainset_ID`, `Required_Exposure_Hours` (per week/month?), `Accumulated_Hours`, `Contract_Start_Date`, `Contract_End_Date`. Is this correct?
5.  **Business Rules:**
    *   How is the "Penalty Risk Level" (e.g., Critical, High) calculated? We need the specific formula or logic. For example, is it "Critical" when SLA compliance is below 80% with 3 days left in the month?
    *   Is "exposure" only counted during revenue service hours?
    *   Are some routes or times of day more valuable for advertisers than others?

### 4. Mileage Balancing
1.  **Data Source:** How is train mileage recorded? (e.g., automatically from the train's systems, manual entry by operators)
2.  **Data Format:** In what format is this data available?
3.  **Update Frequency:** How often is the mileage data updated? (e.g., after each trip, at the end of the day)
4.  **Data Fields:** We assume: `Trainset_ID`, `Total_Kilometers`, and `Kilometers_Since_Last_Maintenance` for key components (e.g., bogies, brake-pads, HVAC). Is this level of detail available?
5.  **Business Rules:**
    *   What are the specific maintenance thresholds (in kilometers) for the most important components?
    *   How is the "Urgency Level" (Critical, High, etc.) determined? We need the exact logic. For example, is "Critical" when mileage is >95% of the threshold?
    *   Is the primary goal to ensure no train exceeds its maintenance threshold, or is there also a secondary goal to keep the total mileage of all trains relatively equal?

### 5. Cleaning & Detailing Slots
1.  **Data Source:** How is the cleaning schedule and status currently managed? (e.g., a physical logbook, a shared spreadsheet)
2.  **Data Format:** In what format can we get this data?
3.  **Update Frequency:** How often is this information updated?
4.  **Data Fields:** For each train, we need to know its `Last_Deep_Clean_Date`. What other information is tracked?
5.  **Business Rules:**
    *   What is the mandatory frequency for a "deep clean"? (Our prototype assumes 15 days, is this correct?)
    *   How is the "Compliance Status" (e.g., Overdue) determined?
    *   What is the maximum number of trains that can be cleaned in a single night? Is this limited by manpower or the number of cleaning bays?
    *   How long does a deep clean take? Does it render a train unavailable for the entire night?

### 6. Stabling Geometry
1.  **Data Source:** Is there a digital map or database of the depot layout that shows the tracks and positions? How is the current position of each train at night recorded?
2.  **Data Format:** How can we get this data? Is it static (the layout) and dynamic (the train positions)?
3.  **Update Frequency:** We assume the layout is static. How often is the train position data updated?
4.  **Data Fields:** For each train, we need its current location, for example: `Trainset_ID`, `Track_ID`, `Position_On_Track`. Is this available?
5.  **Business Rules:**
    *   How is "Estimated Shunting Time" calculated? Is it based on the distance from the exit, the number of trains blocking it, or something else? We need to understand this logic to model it accurately.
    *   Are there any physical or safety constraints? (e.g., a specific train cannot be parked on a certain track).
    *   Are there preferred positions for standby trains versus trains scheduled for morning service?
    *   Our data mentions an "Accessibility Score." What is this, how is it calculated, and what does it represent?
