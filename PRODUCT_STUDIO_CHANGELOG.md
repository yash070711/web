# Product Studio — Feature & Change Log

This document tracks everything added or changed across the Product Studio prototype for both carrier variants:

- **Futuristic** — `public/ps/`
- **SouthLake Carrier** — `public/ps-southlake/`

Each entry notes which variant(s) it applies to. Unless stated otherwise, "both" means the same behavior was implemented identically in both `public/ps/` and `public/ps-southlake/`.

---

## 1. Eligibility Studio

**Applies to:** Futuristic (primary), with the underlying data model shared by SouthLake.

### Condition Builder rebuild
- Rebuilt the Condition Builder to support a full comparison/operator vocabulary: `=`, `≠`, `>`, `≥`, `<`, `≤`, Contains / Does not contain, Starts with / Does not start with, Ends with / Does not end with, In / Not in, Between / Not between, Is empty / Is not empty, Is true / Is false — filtered dynamically per field data type (text, number, currency, date, boolean, select, multi-select).
- Fixed a broken "+ Add Condition" flow caused by a global "prototype stub" click interceptor in `assets/prototype-app.js` that was hijacking the button before the real handler could run (see §8, Bug Fixes).
- Outcome ("Then apply") moved inline into the Condition Builder as a dropdown; the old standalone Outcome section was removed.
- Removed the "Eligibility data flow" and "About Eligibility Studio" informational sections to declutter the page.

### Wording and terminology
- Renamed all visible "Risk Studio" / "Risk Attribute" text to "Questionnaire" / "Questionnaire Studio" / "Attribute" throughout the studio.
- Renamed "Linked Coverages" to **"Class of Business"**, with a parent/child cover picker (expand a parent cover to select specific child classes).

### Source-of-truth architecture change
- Eligibility Studio's selectable questions are now driven **solely** by the Questionnaire's `questionCategory === 'eligibility'` flag.
- Removed the legacy mechanism that let Risk Studio's `localStorage`-based question selection leak into Eligibility Studio.

### Save flow
- "Save Changes" now runs full validation, advances through per-question configuration, and only navigates to the next studio once every linked question's condition is complete.

### The real rendering engine: `assets/eligibility-rule-builder.js`
Discovered that Eligibility Studio's on-screen UI is actually rendered by a separate script, `public/ps/assets/eligibility-rule-builder.js`, which overrides the native page's `openRuleEditor`, `loadRule`, and `openAddRuleModal`. All of the following changes were made there:

- **One question = one rule.** Selecting multiple Questionnaire questions when creating a rule now creates one independent rule per question instead of bundling them into a single multi-condition rule. Added a one-time migration (`migrateBundledRules`) that automatically splits any old bundled rule already sitting in saved product data.
- Removed the "Selected Questions" navigation sidebar (made obsolete once every rule maps to exactly one question).
- **"+ Add Rule"** now creates a complete rule object immediately with full defaults (Enabled, All coverages, AND logic, Referral outcome, Entire submission scope, one blank condition) — no intermediate "how do you want to create it?" modal.
- **Condition cards** now render fully immediately (never a bare "New Condition / Remove" placeholder row), each with a numbered badge (`#1`, `#2`, ...), a Question/Operator/Value 3-column layout, and a Remove button.
- **Question/field picker**: a searchable modal (search by question, category, or source, plus a category filter) whose results are grouped under source headings — *Questionnaire Studio*, *Product data*, *External data* — pulling real Questionnaire Studio questions plus Risk Studio attributes, with a small hard-coded fallback set (Operating radius, Vehicle age, Fleet size, Commodity type, CDL experience, USDOT status, Coverage requested, Garaging state) only used when not already present in real data.
- **Coverage applicability**: All coverages / Specific coverages toggle; when specific, a parent/child tree (Auto Liability, Physical Damage, Motor Truck Cargo, or real product covers when available) where selecting a parent selects all its children, deselecting a parent clears them, and individual children can still be toggled off.
- **Eligibility outcome**: Result (Ineligible / Referral / Require Information), Affected scope (Entire submission / Affected vehicle / Affected driver), with a Referral queue field (Transportation Underwriting / Senior Underwriter) that only appears when Result = Referral.
- **Messaging & governance**: required Internal reason and Applicant/agent message textareas, plus an "Authorized underwriter may override with reason" checkbox.
- **Validation & toasts** use exact, consistent wording: "Rule name is required.", "Select a question or field.", "Comparison value is required.", "Select at least one coverage.", "Internal reason is required.", "Applicant/agent message is required.", "Referral queue is required.", "Rule saved successfully.", "All eligibility rules are valid."
- Two built-in sample rules remain available via "Add sample rules": *Vehicle age – Physical Damage* (Specific coverages, Vehicle age > 20, Ineligible, Affected vehicle) and *Long operating radius* (All coverages, Operating radius > 500, Referral → Transportation Underwriting, Entire submission).

---

## 2. Risk Studio

**Applies to:** Both Futuristic and SouthLake (identical implementation).

Rebuilt the Risk Configuration detail panel to match a new reference design:

- Top context strip: **Product / Eligibility ("Evaluated first") / Rating Method ("Multiplicative factors")**.
- **"RISK CONFIGURATION"** header with a **Status** toggle (Enabled / Disabled).
- **"QUESTION (PREVIEW ONLY)"** read-only card showing the linked question's label, Category, Source ("Questionnaire"), and Field Type.
- Editable **Rule label** field, separate from the linked question's identity.
- Static info banner: "Eligibility runs first. Answers rejected by Eligibility never reach this rule."
- **Coverage Applicability**: All coverages / Specific coverages, with a coverage checklist dropdown when specific.
- **Risk Conditions**: one card per condition with:
  - Operator (including **Between**, which swaps the single Value field for From value / To value).
  - Risk level (High / Medium / Low).
  - **Rating impact** (No rating impact / Apply factor) — the Rating factor input only appears when "Apply factor" is selected.
  - Underwriting action (No underwriting action / Refer to underwriter / Decline), each with contextual helper text.
  - Remove button per condition, "+ Add Condition" to add more.
- **"If no condition matches"** preset dropdown (e.g. "No risk; factor 1.00", "High risk; factor 2.00", "Refer to underwriter").
- **Underwriting Rationale** textarea.
- **Delete Rule** / **Save Rule** buttons.
- Removed the old "Rating Factors" (per-coverage lookup table) and "Option Risk" UI — it was dead code with no working button to reach it in either variant.
- Fixed "+ Add Condition" being silently intercepted by the same global click-stub interceptor described in §8.

---

## 3. Coverage Studio

**Applies to:** Both Futuristic and SouthLake (identical implementation).

- **Dependencies section** (numbered "6", between Deductible & Co-pay and Claims Behaviour): configure cover-to-cover dependency rules — Requires / Excludes / Bundles with — against another cover on the product, with an optional free-text condition (e.g. "Vehicle Type is Tractor") and a live "Rule Preview" sentence. This existed only in SouthLake's file; ported the exact implementation to Futuristic.
- **Deductible & Co-pay section** (numbered "2"): this section's rendering code already existed in both files but was never wired into the page — fixed so it now actually appears, with Deductible Type (Fixed / Percentage / None) and the fields specific to each.
- **Underwriter Override card** inside Deductible & Co-pay (new, added to both variants):
  - "Allow Underwriter Override" checkbox.
  - "Maximum Override (%)" input (live-updates the footer note as you type).
  - "Allow Override For" — three independent checkboxes: Deductible Amount/Percentage, Deductible Basis, Deductible Applies Per.
  - Footer note: "Maximum allowed change: ±N%".
- **Section order** finalized as: Cover Identity → Insured Items, Valuation & Limits → Deductible & Co-pay → Dependencies → Claims Behaviour → Wording Reference.

---

## 4. Distribution Studio

- **Futuristic**: Reinsurance step removed entirely — the studio now shows only Channel Configuration. Channel Configuration behavior (channel type, approved organization, commission, Class of Business grant authority with checkbox-based parent selection) matches SouthLake's implementation exactly.
- **Both**: Fixed a page-wide styling bug where the shared shell (topbar, logo, sidenav) rendered as plain unstyled links because `distribution-studio.html` never linked `assets/style.css` (every other studio page does). Added the missing stylesheet link to both `public/ps/distribution-studio.html` and `public/ps-southlake/distribution-studio.html`, restoring the correct sidenav/topbar layout without touching the page's own existing inline styles for its form content.
- **Futuristic**: Removed a "DRAFT · Product configuration in progress · Next: X ›" banner from the page header.
- **Approved Channel Organization directory**:
  - **SouthLake**: added **"Futuristic"** as an option under Channel Type = MGU.
  - **Futuristic**: added **"NTA"** as an option under Channel Type = MGA.

---

## 5. Questionnaire Studio

**Applies to:** Futuristic.

- Simplified the question editor: removed "Field Configuration", "Conditional Visibility", and "Evidence Triggers" sections. The Options List (for select / multi-select question types) was kept.
- Renamed "Linked Coverages" to **"Linked Class of Business"** (reuses the existing parent/child coverage picker).
- Added a **Question Category** dropdown (`general` / `risk` / `eligibility`) — this is the field that now drives which questions Eligibility Studio can use (see §1).
- Added a simple **Visibility** dropdown, backed by a new `hiddenFromFlow` property (kept separate from the existing `conditional` property, which is recalculated elsewhere and would otherwise silently reset a manual visibility choice).

---

## 6. Rating & Pricing Studio

**Applies to:** Both Futuristic and SouthLake (`assets/rating-experience.js`).

- **Risk Rating Factors** are now fully dynamic and data-driven from the product's actual Risk Studio attributes, generically looping over whatever attributes exist instead of hard-coding example factors ("Driver age", "Vehicle age", "Where the vehicle is kept", "How the vehicle is used").
- Added orphan detection/handling for rating factors whose underlying Risk Attribute no longer exists.
- Custom pricing rules section now starts empty with no seeded example rules.

---

## 7. Navigation & Header (app-wide)

**Applies to:** Both Futuristic and SouthLake.

- Removed the **"Customer view"** and **"View Product"** buttons from every studio's header. These were injected by shared code (`assets/prototype-app.js`'s `applyProductIdentity()`, plus `assets/studio-hub.js` and `assets/rating-experience.js`) rather than hard-coded per page, so removing them at the shared source removed them everywhere in one change rather than editing every studio HTML file individually.
- Removed the "DRAFT · Product configuration in progress · Next: X ›" status banner from the top of the page (Futuristic only, via `refreshTopbarProductStatus()`).

---

## 8. Bug fixes

- **Global click-interceptor false positives** (`assets/prototype-app.js`, `handleGlobalClick`): a capture-phase click handler treats generic-looking buttons like "+ Add Condition" as unimplemented "prototype stub" actions and injects a fake input row instead of letting the page's real handler run. This silently broke "+ Add Condition" wherever a studio introduced a button with that exact text but wasn't yet on the interceptor's exclusion list. Fixed by excluding `questionnaire-studio.html`, `eligibility-studio.html`, and `risk-studio.html` from that interception.
- **Distribution Studio unstyled shell** — see §4.
- **Coverage Studio "Deductible & Co-pay" never rendering** — see §3.
- **Eligibility rule bundling** — multiple selected Questionnaire questions were being saved as multiple conditions on one rule instead of one rule per question; fixed with an automatic migration for already-saved data — see §1.

---

## Notes on scope

- Southlake (`public/ps-southlake/`) is generally treated as the reference/source-of-truth design for shared components (Distribution Channel Configuration, Coverage Studio's Dependencies section), with Futuristic (`public/ps/`) brought up to match it, per instruction throughout this project.
- Where a change is listed as "Futuristic" only, SouthLake was intentionally left untouched unless a request explicitly asked for both.
