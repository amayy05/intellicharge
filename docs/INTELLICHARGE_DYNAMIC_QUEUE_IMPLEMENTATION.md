# IntelliCharge — Dynamic Queue & Hybrid Wait-Time Engine
## Implementation Specification for Antigravity

> **Repository:** https://github.com/amayy05/intellicharge  
> **Goal:** Extend the existing IntelliCharge project with a realistic, user-centric EV charging queue engine without unnecessarily breaking the existing ML/recommendation system.

---

# 1. Objective

Upgrade IntelliCharge from primarily **historical wait-time prediction** into a **Hybrid EV Charging Queue Prediction System**.

The upgraded system must combine:

1. **Real-time/current charging state**
2. **Dynamic virtual queue simulation**
3. **EV-specific charging-duration estimation**
4. **Multi-charger scheduling**
5. **Historical ML-based demand/wait forecasting**
6. **Travel-time and battery-reachability information**
7. **Station recommendation**

The final user-facing purpose is:

> **Tell an EV driver where they can start charging earliest, not merely which station is closest.**

Do NOT build a system that requires users to manually enter excessive information every time they charge.

---

# 2. Product Principle

The user should receive a clear benefit.

Bad UX:

> "Enter your EV information so that our system can predict queues."

Good UX:

> "Find the charging station where you can start charging earliest."

The user's EV model/specifications should be saved once in their profile.

For each charging session, only ask for information that is realistically useful and easy to provide:

- Current battery percentage
- Desired battery percentage
- Connector/charging type if not already known

If vehicle telemetry/API integration becomes available later, current SOC can be obtained automatically.

---

# 3. Existing Architecture — Preserve It

The current IntelliCharge project contains:

- React/Vite frontend
- FastAPI backend
- SQLAlchemy
- SQLite
- Charging-station data
- Queue snapshots/history
- ML wait-time predictor
- Battery-aware station recommendation
- Station ranking
- AI assistant/agent functionality

Do NOT rewrite the application from scratch.

Extend the existing architecture incrementally.

Do NOT remove the existing ML predictor or QueueSnapshot functionality.

---

# 4. New High-Level Architecture

Implement this architecture:

```text
                    USER / EV DRIVER
                           |
                           v
                 Charging Request
                           |
             +-------------+-------------+
             |                           |
             v                           v
       EV Profile                  Current SOC
       EV Model                    Target SOC
       Battery Capacity
       Max Charging Power
       Connector
             |                           |
             +-------------+-------------+
                           |
                           v
              EV Charging Duration
                    Estimator
                           |
                           v
             Dynamic Queue Engine
                           |
             +-------------+-------------+
             |                           |
             v                           v
       Active Sessions            Waiting Queue
             |                           |
             +-------------+-------------+
                           |
                           v
               Multi-Charger Scheduler
                           |
                           v
                 Current Wait Estimate
                           |
                           v
              Historical ML Forecast
                           |
                           v
               Hybrid Wait Estimate
                           |
                           v
               Recommendation Engine
                           |
                           v
                BEST CHARGING STATION
```

---

# 5. Core Design Decision

The queue engine and ML predictor have different responsibilities.

## Dynamic Queue Engine

Answers:

> "Given what is currently happening at this station, when can this EV probably start charging?"

## ML Forecast

Answers:

> "How is station demand likely to change around the time the user arrives?"

Therefore:

```text
Current Queue Simulation
          +
Historical/Future Demand Forecast
          =
Hybrid Wait-Time Estimate
```

Do not make ML responsible for everything.

---

# 6. Database Changes

## 6.1 EVVehicle table

Create a model similar to:

```python
class EVVehicle(Base):
    __tablename__ = "ev_vehicles"

    id
    user_id
    model_name
    battery_capacity_kwh
    max_charging_power_kw
    connector_type
    created_at
```

If authentication/user relationships already exist, integrate with the existing user model.

Do not duplicate user data unnecessarily.

---

# 6.2 ChargingSession table

Create:

```python
class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id
    station_id
    charger_id
    vehicle_id

    start_soc
    target_soc

    started_at
    estimated_end_at
    actual_end_at

    estimated_duration_minutes
    actual_duration_minutes

    status
```

Possible status values:

```text
WAITING
CHARGING
COMPLETED
CANCELLED
```

Use an enum if the existing project convention supports it.

---

# 6.3 QueueEntry table

Create:

```python
class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id
    station_id
    vehicle_id

    joined_at

    estimated_duration_minutes
    estimated_start_at
    estimated_end_at

    status
    priority
```

Possible status:

```text
WAITING
ASSIGNED
CHARGING
COMPLETED
CANCELLED
```

Do not allow completed/cancelled entries to remain active in queue calculations.

---

# 6.4 Preserve QueueSnapshot

Keep the existing QueueSnapshot model.

It remains useful for:

- Historical analytics
- ML training
- Monitoring
- Station demand trends
- Model evaluation

The new queue engine should generate/update snapshots from real queue state.

---

# 7. EV Charging Duration Calculation

Given:

```text
battery_capacity_kwh
current_soc
target_soc
charger_power_kw
```

Calculate energy required:

```text
energy_required_kwh =
battery_capacity_kwh * (target_soc - current_soc) / 100
```

Basic ideal duration:

```text
duration_hours =
energy_required_kwh / effective_charging_power_kw
```

Convert to minutes.

However, DO NOT assume real EV charging is perfectly linear.

Charging power can decrease at higher SOC.

Therefore create a charging-duration service that supports:

### Level 1 — MVP

Use:

```text
effective_power = min(vehicle_max_power, charger_power)
```

plus a configurable efficiency/overhead factor.

Example:

```text
duration =
energy_required / effective_power
* efficiency_factor
```

Keep the factor configurable.

### Level 2 — Better implementation

Allow EV-specific charging curves:

```text
SOC range -> approximate charging power
```

For example:

```text
0-50%   -> high power
50-80%  -> medium/high power
80-100% -> lower power
```

Do not invent manufacturer-specific charging curves unless the dataset/source provides them.

---

# 8. Multi-Charger Queue Logic

This is CRITICAL.

Do NOT simply sum all waiting vehicles.

Example:

```text
Station = 4 chargers

Charger 1 -> busy for 30 min
Charger 2 -> busy for 10 min
Charger 3 -> available
Charger 4 -> busy for 20 min
```

A new EV should NOT get:

```text
30 + 10 + 20 = 60 min
```

It can use the earliest available charger.

Therefore:

```text
New EV estimated wait = 0 min
```

if an appropriate charger is currently available.

If all chargers are occupied:

```text
Charger 1 -> available in 30 min
Charger 2 -> available in 10 min
Charger 3 -> available in 20 min
Charger 4 -> available in 15 min

New EV wait = 10 min
```

Then assign the new EV to the charger becoming available earliest, subject to connector/power compatibility.

---

# 9. Charger Assignment Algorithm

Create a service such as:

```text
queue_engine.py
```

or an appropriate existing service/module.

For every active charger:

```text
available_at
charger_power
connector_type
current_session
```

For a new charging request:

1. Filter compatible chargers.
2. Find chargers already available.
3. If one is available, assign immediately.
4. Otherwise find the charger with the earliest `available_at`.
5. The difference between `now` and `available_at` is estimated waiting time.
6. Create/update the queue entry.
7. Recalculate affected queue entries.

Pseudo-logic:

```python
compatible = get_compatible_chargers(station, vehicle)

available = [
    charger for charger in compatible
    if charger.available_at <= now
]

if available:
    selected = choose_best_available_charger(available)
    wait_minutes = 0
else:
    selected = min(compatible, key=lambda c: c.available_at)
    wait_minutes = minutes_between(now, selected.available_at)
```

---

# 10. Queue Recalculation

Every time any of these events happen:

- New EV joins
- Charging session starts
- Charging session completes
- User cancels
- Station status changes
- Charger becomes unavailable
- Charger becomes available

recalculate the station queue.

Do NOT recalculate the entire database unnecessarily.

Only recalculate affected station(s).

---

# 11. Example Queue

Station:

```text
3 chargers
```

Current sessions:

```text
Charger 1:
EV-A
Remaining = 25 min

Charger 2:
EV-B
Remaining = 10 min

Charger 3:
Available
```

New EV C arrives.

Result:

```text
EV-C wait = 0 min
```

It is assigned to Charger 3.

Now EV D arrives:

```text
Charger 1 -> 25 min
Charger 2 -> 10 min
Charger 3 -> EV-C charging for 30 min
```

EV-D wait:

```text
10 min
```

Assign EV-D behind Charger 2.

This is a **multi-server scheduling problem**, not a single linear queue.

---

# 12. Virtual Queue

Not every station will expose real-time queue information.

Therefore IntelliCharge should support a virtual queue.

When an IntelliCharge user chooses:

> "I'm going to charge here"

and provides:

```text
current_soc
target_soc
vehicle
connector
```

the system estimates their charging duration and adds them to the virtual queue.

Important:

Do NOT claim that this represents every vehicle at the physical station.

Clearly distinguish:

```text
Observed/real station state
```

from:

```text
IntelliCharge virtual queue
```

and:

```text
ML-predicted demand
```

---

# 13. Real-Time Station Data

If an operator/API provides:

- occupied chargers
- available chargers
- active charging sessions
- charger status

use it as the highest-confidence current state.

If no live session API exists:

Use:

```text
last known station state
+
IntelliCharge virtual queue
+
historical ML forecast
```

Never falsely claim that every charging station provides live queue/session data.

---

# 14. Hybrid Wait-Time Formula

Create a clear separation between:

### Current wait

From dynamic queue simulation:

```text
current_queue_wait
```

### Future demand adjustment

From ML:

```text
predicted_additional_wait
```

Then calculate:

```text
hybrid_wait =
current_queue_wait
+
predicted_additional_wait
```

But avoid double-counting.

If the ML model already includes current occupancy/wait state, do not blindly add the values.

Instead, implement a configurable hybrid strategy.

For MVP:

```text
hybrid_wait =
alpha * queue_engine_wait
+
(1 - alpha) * ml_predicted_wait
```

where:

```text
0 <= alpha <= 1
```

Recommended starting value:

```text
alpha = 0.7
```

because real-time queue state should generally have more weight than historical prediction.

Make alpha configurable.

Later, evaluate different alpha values using validation data.

---

# 15. Arrival-Time Prediction

This is important.

The user is not asking:

> "What is the queue right now?"

They are asking:

> "What will happen when I reach the station?"

Calculate:

```text
travel_time = routing/travel estimate

arrival_time = current_time + travel_time
```

Then estimate station state around `arrival_time`.

Conceptually:

```text
Current queue
      +
Vehicles expected to finish before arrival
      +
Vehicles expected to arrive before/around arrival
      +
Historical demand forecast
      =
Expected queue at arrival
```

Do not promise perfect future prediction.

Use language such as:

> "Estimated wait"

not:

> "Guaranteed wait"

---

# 16. Recommendation Engine

The recommendation engine should rank stations using:

```text
travel_time
+
hybrid_wait
+
battery reachability
+
charger compatibility
+
charger availability
+
charging suitability
```

A simple score can be:

```text
total_time =
travel_time
+
hybrid_wait
```

Then incorporate existing project factors such as battery safety and charger capacity.

Example:

```text
Station A
Travel = 8 min
Wait = 40 min
Total = 48 min

Station B
Travel = 12 min
Wait = 8 min
Total = 20 min

Station C
Travel = 15 min
Wait = 15 min
Total = 30 min
```

Recommend:

```text
Station B
```

even though Station A is closer.

This is the core user value.

---

# 17. API Changes

Extend the backend with endpoints similar to:

```text
POST /vehicles
GET  /vehicles
GET  /vehicles/{id}
PUT  /vehicles/{id}
DELETE /vehicles/{id}
```

Charging session:

```text
POST /charging-sessions
GET  /charging-sessions/{id}
POST /charging-sessions/{id}/complete
POST /charging-sessions/{id}/cancel
```

Queue:

```text
GET  /stations/{station_id}/queue
POST /stations/{station_id}/queue/join
POST /stations/{station_id}/queue/leave
GET  /stations/{station_id}/wait-estimate
```

Recommendation:

Extend the existing recommendation API rather than replacing it.

Potential request:

```json
{
  "lat": 19.07,
  "lng": 72.87,
  "battery_pct": 23,
  "target_soc": 80,
  "vehicle_id": 1,
  "connector_type": "CCS2",
  "radius": 20
}
```

Use the existing project naming conventions wherever possible.

---

# 18. Frontend Changes

Do NOT make the UI complicated.

## EV Profile

Add:

```text
My EV

Vehicle:
[Tata Nexon EV]

Battery Capacity:
40.5 kWh

Max Charging Power:
XX kW

Connector:
CCS2
```

Allow editing.

---

# 19. Charging Request UI

When the user selects a station:

```text
Current battery
[ 23% ]

Charge until
[ 80% ]

        Find Charging Time
```

Show:

```text
Estimated charging duration:
~35 minutes

Estimated waiting time:
~12 minutes

Expected charging start:
~24 minutes from now
```

Use "~" and "estimated" to communicate uncertainty.

---

# 20. Station Card

Improve station cards to show:

```text
Station Name

Distance: 5.2 km
Drive time: 11 min

Available chargers: 2 / 6

Estimated wait: 8 min

Expected charging start:
~19 min from now

Total estimated time:
~19 min

[ Navigate ]
[ Join Virtual Queue ]
```

The recommendation should clearly identify:

```text
BEST OPTION
```

and explain why:

> "12 minutes farther than Station A, but estimated 32 minutes faster overall."

This makes the system understandable.

---

# 21. Queue Visualization

Create a simple visual timeline.

Example:

```text
NOW
 |
 |---- EV A charging ----|
                       10 min
                            |--- EV B ---|
                                      35 min
                                            |--- YOUR EV ---|
```

For multiple chargers:

```text
Charger 1  |==== EV A ====| 
Charger 2  |== EV B ==|
Charger 3  | AVAILABLE |
```

Then:

```text
Your estimated start:
NOW
```

if a charger is available.

---

# 22. Queue Status

Expose:

```text
Current active sessions
Waiting virtual EVs
Available chargers
Estimated earliest charger availability
```

Do not show unnecessary personal information about other drivers.

Use anonymous queue IDs:

```text
EV #A12
EV #B42
```

or simply:

```text
2 vehicles ahead
```

---

# 23. Data Privacy

Do not expose:

- User identity
- Vehicle owner identity
- Exact personal details
- Other users' account information

Only use anonymized operational information for queue calculation.

For example:

```text
2 vehicles ahead
Estimated wait: 14 min
```

is preferable to exposing another driver's information.

---

# 24. Handling Users Who Leave

A major real-world problem:

A user may join the virtual queue and never arrive.

Therefore add:

```text
Queue expiration
```

Possible rule:

```text
If ETA expires and user has not checked in:
    mark queue entry as EXPIRED
```

Also allow:

```text
Leave Queue
```

button.

Do not let stale virtual entries permanently inflate the queue.

---

# 25. Check-In

For a more realistic future flow:

```text
Join Queue
      ↓
Navigate to station
      ↓
Arrive/check in
      ↓
Charging starts
      ↓
Session monitored
      ↓
Charging completes
      ↓
Queue updated
```

For the MVP, check-in can simply be simulated.

Do not require physical hardware integration unless already available.

---

# 26. Charging Completion

When a session completes:

```text
status = COMPLETED
actual_end_at = now
```

Then:

```text
free charger
      ↓
assign next waiting EV
      ↓
recalculate queue
      ↓
update waiting estimates
```

This should happen automatically.

---

# 27. Background/Periodic Updates

Implement a lightweight update mechanism.

Possible MVP:

```text
poll every 15–30 seconds
```

or use WebSocket/SSE if the existing architecture can support it cleanly.

Do not introduce WebSockets purely for complexity.

Polling is acceptable for an academic MVP.

---

# 28. ML Integration

Keep the current ML predictor.

Improve its feature set gradually.

Possible features:

```text
station_id
hour
day_of_week
occupied_chargers
total_chargers
current_queue_wait
virtual_queue_length
current_queue_energy_demand
connector_demand
historical_average_wait
```

Only add features that can actually be populated reliably.

Do not train on fake features and then claim they are real-world data.

---

# 29. Training Data

Maintain historical QueueSnapshot records.

When queue/session data changes, store snapshots such as:

```text
timestamp
station_id
occupied_chargers
available_chargers
queue_length
estimated_wait
```

This creates a history that can eventually improve ML.

For the current academic project, synthetic data may be used, but clearly label it as synthetic.

Do not present synthetic data as live operator data.

---

# 30. Simulation Mode

Because real charging station APIs may not expose all required information, implement a simulation mode for demonstration.

Example:

```text
Station A
4 chargers

EV 1 -> 30 min
EV 2 -> 15 min
EV 3 -> 25 min
```

The system should simulate:

- EV arrival
- charger assignment
- charging
- completion
- queue movement

This allows the panel to see the engine working even without physical station integration.

---

# 31. Demo Scenario

Create a reproducible demo.

### Initial state

```text
Station Alpha
4 chargers

Charger 1 -> EV-A -> 20 min remaining
Charger 2 -> EV-B -> 8 min remaining
Charger 3 -> EV-C -> 15 min remaining
Charger 4 -> Available
```

New user:

```text
Current SOC: 25%
Target SOC: 80%
EV: Example EV
```

Because Charger 4 is available:

```text
Predicted wait = 0 min
```

Then fill all chargers.

New EV arrives:

```text
Charger 1 -> 20 min
Charger 2 -> 8 min
Charger 3 -> 15 min
Charger 4 -> 30 min
```

New EV gets:

```text
Predicted wait = 8 min
```

After 8 minutes:

```text
Charger 2 becomes available
```

The waiting EV automatically moves into charging.

This demonstrates the engine clearly.

---

# 32. Testing Requirements

Write unit tests for:

## Charging duration

Test:

```text
20% -> 80%
```

with known battery capacity/power.

Test:

```text
50% -> 80%
```

Test:

```text
80% -> 100%
```

Test invalid input:

```text
target < current
target > 100
current < 0
```

---

## Queue engine

Test:

```text
1 charger
1 EV
```

```text
1 charger
3 EVs
```

```text
4 chargers
2 EVs
```

```text
4 chargers
4 EVs
```

```text
4 chargers
5+ EVs
```

Test charger completion.

Test cancellation.

Test queue expiration.

---

## Connector compatibility

A vehicle should not be assigned to an incompatible charger.

---

# 33. Edge Cases

Handle:

- No available chargers
- No compatible chargers
- Station closed
- Charging session missing data
- Current SOC >= target SOC
- Battery percentage outside 0–100
- Missing EV model
- Unknown battery capacity
- Unknown charger power
- User cancels queue
- User does not arrive
- Station goes offline
- Charger becomes unavailable
- Multiple EVs arriving simultaneously
- Multiple sessions completing simultaneously

---

# 34. Important Product Limitation

Do NOT claim:

> "Our system knows the exact queue at every station."

Instead:

> "Our system estimates charging wait time by combining available real-time station information, active charging sessions, IntelliCharge virtual queue data, and historical demand patterns."

This is more technically accurate.

---

# 35. Recommended Final Feature Set

## MVP

Implement:

- EV profile
- Current SOC + target SOC
- Charging-duration calculator
- ChargingSession model
- QueueEntry model
- Multi-charger queue engine
- Join queue
- Leave queue
- Charging completion
- Dynamic wait-time calculation
- Station recommendation using wait + travel time
- Queue visualization
- Simulation mode

## Phase 2

Implement:

- ML demand forecasting
- Arrival-time prediction
- Hybrid wait estimation
- Historical analytics
- Better charging curves
- Notifications
- WebSocket/SSE

## Phase 3

Potential future:

- Real charger/operator APIs
- OCPP integration
- Vehicle telemetry
- Reservation/payment integration
- Dynamic pricing
- Station operator dashboard

Do not attempt Phase 3 unless time permits.

---

# 36. Recommended Development Order

Follow this exact order.

### Step 1

Inspect the entire existing repository.

Identify:

```text
models
schemas
services
API routes
ML modules
recommendation logic
frontend components
database initialization
tests
```

Do not overwrite working functionality.

### Step 2

Create EVVehicle model.

### Step 3

Create ChargingSession model.

### Step 4

Create QueueEntry model.

### Step 5

Implement charging-duration service.

### Step 6

Implement multi-charger queue engine.

### Step 7

Implement queue API endpoints.

### Step 8

Implement charging session lifecycle.

### Step 9

Implement EV profile UI.

### Step 10

Implement charging request UI.

### Step 11

Integrate queue wait into recommendation engine.

### Step 12

Preserve existing ML prediction.

### Step 13

Add hybrid ML + queue logic.

### Step 14

Add simulation/demo mode.

### Step 15

Add tests.

### Step 16

Update README and architecture documentation.

---

# 37. Code Quality Requirements

Use the existing project's coding conventions.

Requirements:

- Do not duplicate business logic.
- Keep calculation logic in services.
- Keep API routes thin.
- Use Pydantic schemas for API validation.
- Use SQLAlchemy models for persistence.
- Add type hints where appropriate.
- Handle errors cleanly.
- Do not hard-code station-specific values.
- Do not hard-code EV-specific values unless they are clearly demo data.
- Keep configuration in environment/config files.
- Add comments only where the logic is non-obvious.

---

# 38. Do Not Break Existing Features

Before changing code, identify and preserve:

- Station search
- Map
- Recommendation endpoint
- Battery filtering
- Existing ML predictor
- Queue snapshots
- AI assistant
- Existing database seed process

After implementation, run the existing application and verify all existing features still work.

---

# 39. Acceptance Criteria

The implementation is complete only when:

### EV

- User can save an EV.
- Battery capacity is available.
- Charging power is available.
- Connector is available.

### Charging request

- User can enter current SOC.
- User can enter target SOC.
- System calculates estimated charging duration.

### Queue

- User can join a virtual queue.
- User can leave it.
- Queue updates dynamically.
- Completed sessions disappear.
- Multiple chargers are handled correctly.

### Recommendation

- Wait time is included in station ranking.
- A farther station can beat a closer station when it has a significantly shorter wait.
- Battery reachability is still respected.

### ML

- Existing ML functionality remains operational.
- ML is not falsely described as real-time.
- Hybrid prediction can be evaluated separately.

### UX

- User does not repeatedly enter EV specifications.
- User receives a tangible benefit from the system.
- Estimated values are clearly labeled as estimates.

---

# 40. Final User Journey

The intended final experience:

```text
OPEN INTELLICHARGE
       ↓
Select / remember EV
       ↓
"Battery: 23%"
"Charge to: 80%"
       ↓
Find Best Charger
       ↓
System checks:
    • Battery reachability
    • Compatible chargers
    • Current charger state
    • Dynamic queue
    • Charging duration
    • Travel time
    • Historical demand
       ↓
Rank stations
       ↓
Recommended:
Station B
       ↓
Drive: 12 min
Estimated wait: 8 min
Total time to charging: ~20 min
       ↓
Join virtual queue (optional)
       ↓
Navigate
       ↓
Check in
       ↓
Charging
       ↓
Complete
       ↓
Queue automatically updates
```

---

# 41. Panel Explanation

If asked what changed, explain:

> "Originally, IntelliCharge primarily estimated waiting time using historical station patterns. We extended it with a dynamic queue engine. When an EV requests charging, the system uses its vehicle characteristics, current SOC and target SOC to estimate the charging duration. We then simulate charger availability and maintain a multi-charger virtual queue. When a charging session starts or completes, the queue is recalculated. We combine this real-time queue estimate with historical demand prediction to estimate the waiting time when the user arrives. Finally, the recommendation engine compares travel time, waiting time, battery reachability and charger compatibility to recommend where the user can start charging earliest."

---

# 42. Panel Question: Why Would Users Use It?

Answer:

> "The user is not using IntelliCharge just to provide queue data. They use it because it gives them a direct benefit: before driving to a charging station, they can estimate how long they will wait and compare stations based on total time to start charging. Their EV information is saved once, and during a charging request they only provide current and target battery percentage. This reduces uncertainty and can save significant waiting time."

---

# 43. Panel Question: Why Not Just Use Google Maps?

Answer:

> "Navigation tells the user where the station is and how long it takes to reach it. Our system adds the charging-side decision: how long the charger is expected to be unavailable and which nearby station minimizes the total time until charging begins."

Do not claim that Google Maps has no charging information. Focus on IntelliCharge's specific decision layer.

---

# 44. Panel Question: Why ML If You Already Have a Queue Engine?

Answer:

> "The queue engine estimates the current operational state, while ML helps forecast how demand may change by the time the user arrives. They solve different parts of the problem. The combination gives us a hybrid estimate rather than relying only on historical patterns or only on the current queue."

---

# 45. Panel Question: What Is Novel?

Do not claim that dynamic charging queues themselves are completely novel.

Instead say:

> "Our contribution is the integration of EV-specific charging-duration estimation, multi-charger queue simulation, future demand prediction and travel-aware station recommendation into one user-facing charging decision system."

---

# 46. Final Technical Principle

The system should answer:

```text
WHERE SHOULD I CHARGE?
```

not merely:

```text
WHERE IS A CHARGER?
```

And:

```text
WHEN CAN I START CHARGING?
```

not merely:

```text
HOW MANY CHARGERS ARE THERE?
```

That distinction should drive the entire implementation.

---

# 47. Instructions to Antigravity

Before editing:

1. Inspect the repository completely.
2. Map the existing architecture.
3. Identify reusable models/services/endpoints.
4. Do not blindly create duplicate functionality.
5. Create a short implementation plan based on the actual repository.
6. Implement incrementally.
7. Run backend tests.
8. Run frontend build/tests.
9. Fix regressions.
10. Update documentation.

After implementation, provide:

```text
1. Files changed
2. Files created
3. Database migrations/schema changes
4. New API endpoints
5. Queue algorithm explanation
6. ML integration explanation
7. Frontend changes
8. Tests added
9. Known limitations
10. How to run the demo
```

**Most important:** do not replace working IntelliCharge functionality. Extend it into the hybrid dynamic queue architecture described above.
