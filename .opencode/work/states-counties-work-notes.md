# Work Notes — Coverage Studio UI changes

## Objective
- Modify the deductible section of Coverage Studio (percentage basis options, "Deductible Applies Per", UW override defaults) and strip the dependency-section texts.
- The States / Counties compact-summary + drawer feature was IMPLEMENTED then UNDONE at the user's request (only States/Counties). Its notes are preserved below for reference.

## Status
### Active — deductible + dependency edits (KEEP)
- `public/ps/coverage-studio.html` + `public/ps-southlake/coverage-studio.html`:
  - `DEDUCTIBLE_PCT_OF = ['Insured Value','Coverage Limit','Claim Amount','Declared Value','Shipment Value']`
  - `DEDUCTIBLE_APPLIES_PER = ['Per Claim','Per Occurrence','Per Vehicle','Per Shipment']`
  - Label `Percentage Of` → `Deductible Basis`
  - "Deductible Applies Per" dropdown on Fixed Amount fields
  - `normalizeCover` legacy map `{'Sum Insured':'Coverage Limit','Item Limit':'Coverage Limit','Loss Amount':'Claim Amount'}` + `c.deductibleAppliesPer ... || 'Per Claim'` + legacy map
  - `saveCover` syncs `deductibleAppliesPer` (both sync blocks)
  - UW override defaults `['amount','basis','appliesPer']` → `['amount']` (2 spots each file)
  - Dependency section: removed "Add a dependency rule" label, "Rule Preview" block, `dependencyPreviewText`, `dep-hero` block
- `public/ps/assets/prototype-app.js` + `public/ps-southlake/assets/prototype-app.js`: new-cover default `deductibleAppliesPer: 'Per Claim'`.

### States / Counties — UNDONE (reverted entirely)
- Reverted `public/ps/assets/distribution-territory.js` to HEAD via `git checkout --`.
- Removed from `public/ps/coverage-studio.html`: the `.sci-*` CSS block (was before main `</style>`), the rewritten `sc === 'in'` branch of `ciJurisdictionPanelHtml` (back to card-list version, keeps `id="ci-distribution-territory"`), and all `sci*` drawer functions after `identityProductContextHtml`.
- Verified: no `sci-`/`sciBuild`/`openSciDrawer`/`SCI_CURRENT` remnants; inline script passes `node --check`; `distribution-territory.js` byte-identical to HEAD.

## Decided at implementation time (now reverted)
- Target only `public/ps/coverage-studio.html` (`ps` profile); `ps-southlake` has its own "Jurisdictions" panel and no `distribution-territory.js`.
- `/coverage-studio` route serves HTML prototypes via `components/HtmlAppPage.tsx`; React `CoverageStudio.tsx` is dead code.
- Plan had been: extend `distribution-territory.js` rows with `cities`/`counties`/`entireState` (mode `local` → merge counties; non-local → `entireState:true`); compact bar `N States · M Counties` + "View All Auto-Selected" button; read-only right drawer (z-index 1200, right slide-in) with header "View All Auto-Selected Locations", subtitle, summary, search, All/Entire State/Selected Counties filter, expandable state rows (`✓ Entire State` vs `N Counties ▾`), tree county list; `refreshDistributionTerritory` preserved via `id="ci-distribution-territory"`.

## Verification
- `node --check` inline script → exit 0 (post-revert).
- Working tree now: 4 modified files (2 coverage HTML + 2 prototype-app.js) = only deductible/dependency edits. `distribution-territory.js` clean.
- Reference: drawer pattern from `public/ps/audit-log.html`; design tokens in `public/ps/assets/style.css` (`.btn.btn-ghost.btn-sm`, `.btn-icon`, `.form-control`).