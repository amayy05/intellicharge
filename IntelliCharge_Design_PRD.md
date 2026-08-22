# Design PRD — IntelliCharge (UI/UX)

**Companion to the main IntelliCharge PRD** | v0.1 | Aug 2026

---

## 1. Design Brief (stated plainly, so nothing downstream is guessing)

- **Subject:** a tool that tells an EV driver, in seconds, which charging station to go to and why — not just where one is.
- **Audience:** urban EV drivers in the Mumbai Metropolitan Region, using this mostly on a phone, mostly mid-journey — glancing at it in a car, not sitting at a desk.
- **The screen's one job:** get a driver from "where do I charge?" to a confident decision, faster than they could form the question themselves.

## 2. Why Not the Obvious Direction

I looked at what currently exists in this exact space before choosing a direction — EVPoint, EV Spot, Electrys, and the dozens of similar kits on Dribbble's `ev-charging` tag all converge on the same look: light background, rounded white cards, a leaf-green accent, a battery icon. That's the "eco app" default, and on a product whose entire thesis is *prediction*, not *eco-friendliness*, it undersells the point. It also reads as a template because it is one — most of these are literally UI kits meant to be reskinned.

I'm also deliberately steering around the three looks that AI-generated design clusters around right now (warm cream + terracotta, near-black + acid-green, broadsheet/hairline-rule). None of those are wrong on principle, they're just not *this* brief's answer.

**The direction instead:** ground it in what's actually true about charging — current flows through a copper conductor, a readout tells you the number, and this is happening at night in a parking structure or roadside as often as in daylight. That's a more specific, more honest set of materials to design from than "electric vehicles are green."

## 3. Design Tokens

### Color — "Copper Current"

| Token | Hex | Role |
|---|---|---|
| Asphalt | `#1B1F24` | Base background — dark by default (also the honest choice for a screen used at night, in a car, and it's kinder to a phone's battery and OLED screen) |
| Slate | `#262B32` | Card/surface layer, one step up from Asphalt |
| Copper Current | `#C8712E` | Primary accent — the color of the conductor, not a leaf. Used for the brand mark, primary buttons, focus states |
| Volt Cyan | `#3FD6C4` | "Good" signal — short wait, available charger, live status. Reserved for this meaning only, never decorative |
| Signal Red | `#E85C4A` | "Poor" signal — long wait, unavailable, error. Also reserved, never decorative |
| Fog | `#F0EDE6` | Primary text on dark surfaces — off-white, not pure white, so it doesn't glare at night |

Copper Current is deliberately not the warm terracotta/clay that AI-generated design defaults to — it's pulled toward orange-amber rather than pink-clay, and it's paired with a dark graphite ground instead of a cream one, so the two don't get confused even side by side.

### Typography

| Role | Face | Why |
|---|---|---|
| Display | Space Grotesk | Geometric but slightly mechanical in its letterforms — reads as "instrument," not "startup landing page" |
| Data / numerals | IBM Plex Mono | Wait-time minutes, distances, and battery % are the actual content of this product — set them in a monospace so they read like a readout, not decoration. Tabular figures keep ranked lists aligned |
| Body | IBM Plex Sans | Shares DNA with Plex Mono (same foundry, designed as a family), so data and prose sit together without feeling like two different apps |

### Spacing & shape
- 8px base unit. Cards use a small radius (6px) — enough to feel like a physical panel, not soft enough to feel decorative.
- Hairline 1px borders in a lightened Slate, not shadows — shadows read as "light UI ported to dark mode" if not handled carefully; borders are more honest on a dark surface.

## 4. The Signature Element: the Charge Bar

Every ranked station shows a horizontal bar, styled like a battery/signal-strength meter, but it encodes **predicted wait time**, not charge level — full and Volt Cyan means a short wait, mostly empty and Signal Red means a long one. It's the same visual grammar a driver already reads instinctively from their own dashboard, repurposed to answer the actual question this product exists to answer.

This one element appears everywhere: the ranked list, the map pin tooltip, and inline inside the AI agent's chat responses — so the app has exactly one visual vocabulary for "how good is this option," not three different treatments across three screens.

```
Station A   ▓▓▓▓▓▓▓▓░░   8 min      (mostly Volt Cyan — good)
Station B   ▓▓▓░░░░░░░  22 min      (mostly Signal Red — poor)
```

## 5. Key Screens (wireframes)

### 5.1 Home — Search & Ranked List (primary path, mobile-first)

```
┌───────────────────────────┐
│ IntelliCharge         ⚙   │  <- flat top bar, no shadow
├───────────────────────────┤
│                           │
│        [ MAP VIEW ]       │  <- ~45% of viewport
│   ● pulsing pins, color   │     pulse rate ∝ how good
│     = charge-bar color    │     the wait is (see §7)
│                           │
├───────────────────────────┤
│ 🔋 42%   CCS2 ▾   2.1 km ▾│  <- sticky filter strip
├───────────────────────────┤
│ Station A          8 min  │
│ ▓▓▓▓▓▓▓▓░░  2.1 km  CCS2  │
├───────────────────────────┤
│ Station B          22 min │
│ ▓▓▓░░░░░░░  0.8 km  CCS2  │
├───────────────────────────┤
│  💬  Ask IntelliCharge    │  <- persistent entry to the
└───────────────────────────┘     agent, never hidden
```

### 5.2 Agent — Chat

```
┌───────────────────────────┐
│ ←  IntelliCharge Agent    │
├───────────────────────────┤
│           "20% battery,   │
│  need CCS2, low wait" (you)│
│                           │
│  Checking nearby stations…│  <- quiet, muted meta-text,
│                           │     not a "thinking" theatrical
│  ┌─────────────────────┐ │     effect
│  │ Station A     8 min  │ │  <- same card component
│  │ ▓▓▓▓▓▓▓▓░░  2.1 km   │ │     as the home screen
│  │ [Navigate] [Details] │ │
│  └─────────────────────┘ │
│  Skipped Station C — 0.8  │  <- the reasoning is explicit
│  km closer, but 25 min    │     text, not hidden in a
│  predicted wait           │     model card
├───────────────────────────┤
│ [ Type a message… ]    ➤  │
└───────────────────────────┘
```

## 6. States & Edge Cases

- **Loading:** the charge bars render as a slow shimmer in Slate before data resolves — the loading state literally previews the shape of the signature element, so nothing about the screen looks unfamiliar once real data lands.
- **Empty (no stations in range):** "No stations found within 5 km. Try widening your search radius or checking a different connector type." — states what happened and what to do next, no apology, no dead end.
- **Agent unavailable / API timeout:** "IntelliCharge Agent is taking longer than usual. Here are your nearby stations directly:" and it falls straight into the ranked list — the chat path degrades to the form path, never to a blank screen.

## 7. Motion

One orchestrated moment, not scattered effects: the recommended station's map pin pulses, and the **pulse rate is tied to its charge-bar value** — a short predicted wait pulses faster, a long one slower and duller. This is the one place motion carries information rather than decorating the screen, so it earns its place.

Everything else is still: no hover bounce, no card-entrance animations, no confetti on a good result. Respect `prefers-reduced-motion` — when set, the pulse becomes a static colored ring instead of an animation.

## 8. Accessibility

- Charge-bar color is never the only signal — the numeral (`8 min`) and the bar sit together, so colorblind users read the number, not just the hue.
- Contrast: Fog (`#F0EDE6`) on Asphalt (`#1B1F24`) exceeds WCAG AA for body text; Copper Current on Asphalt is checked for AA on large text/UI elements, not relied on for small body copy.
- Visible keyboard focus ring in Volt Cyan on every interactive element — map pins, list cards, and the chat input included.
- Touch targets sized for one-handed, in-transit use (min 44px), not desk-mouse assumptions.

## 9. Responsive Behavior

- **Mobile (primary):** single column, map stacked above the list, chat as a full-screen view reached from the persistent entry point.
- **Tablet/desktop:** map and ranked list sit side-by-side (list ~35% width), chat becomes a slide-over panel rather than a full navigation — so a driver glancing at a laptop before leaving doesn't lose the map context.

## 10. Voice & Copy

- Buttons say what they do: "Navigate," not "Go." "Ask IntelliCharge," not "Chat now."
- The agent explains itself in plain terms — "closer, but 25 min predicted wait," not "score: 0.42."
- Errors and empty states name what happened and what to do next; they don't apologize and they're never vague.

## 11. Component Inventory → Maps to the Build Sprint

| Component | Where it's used | Sprint day (per main PRD) |
|---|---|---|
| Charge bar | List cards, map tooltip, chat responses | Day 3 (frontend), reused Day 4 (agent UI) |
| Ranked station card | List, chat inline results | Day 3 |
| Map + pulsing pins | Home screen | Day 3 |
| Filter strip (battery/connector/radius) | Home screen | Day 3 |
| Chat panel | Agent screen | Day 4 |
| Loading shimmer, empty state, agent-fallback state | Both screens | Day 4 (remainder) / buffer |

Building this in the same order as the main PRD's sprint means the design system exists by Day 3 and the agent (Day 4) is styling that already-built system, not inventing a second one under time pressure.

## 12. Inspiration & Tools

**What I looked at before choosing the direction in §2** (for reference, not to be copied — these confirm what the *default* looks like, which is exactly what this PRD steers away from):
- [Dribbble — "ev-charging" tag](https://dribbble.com/tags/ev-charging)
- [Dribbble — "electric-vehicle-app" tag](https://dribbble.com/tags/electric-vehicle-app)
- [Dribbble — EVPoint UI Kit](https://dribbble.com/shots/22973987-EVPoint-EV-Charging-Station-Finder-App-UI-Kit)
- [Mobbin — EV Charging flows](https://mobbin.com/@Rodin)

**Adjacent references that informed the readout/gauge direction (not EV-specific, but closer to the actual visual language used here):** automotive instrument-cluster and HMI dashboard design — search "automotive gauge cluster UI" or "vehicle HMI dashboard dark mode" on Dribbble or Pinterest if you want more of this specific texture.

**On "Superdesign" and similar tools:** Superdesign (superdesign.dev) is an open-source, IDE-integrated AI design agent — it takes a natural-language prompt (or a design brief like this one) and generates wireframes/mockups/components, including inside Claude Code or Cursor. A good use of it here: feed it §3 (tokens) and §5 (wireframes) directly as a prompt to get quick clickable variations to react to before committing frontend code — treat its output as a sketch to critique against this PRD, not as the final word, since tools like it default toward generic patterns unless steered by a brief this specific.

**Pinterest**, if you want to keep collecting references, works best as a mood board for *texture* (how copper/graphite materials actually look, automotive readout photography) rather than for full app screens — full-screen EV app pins on Pinterest mostly recirculate the same Dribbble kits linked above.

## 13. Self-Check Before Building

- Is the copper accent doing one job (brand + primary action) and not creeping into decoration? — Yes, confined to §3's stated roles.
- Is the charge bar the one "signature" moment, with everything else quiet? — Yes; motion is confined to §7, one instance.
- Would this be mistaken for a generic EV app kit? — No: the palette, the readout typography, and the wait-time-as-battery-bar reversal are all specific to this product's actual thesis (predict, don't just locate), not to "EV" as a category.
