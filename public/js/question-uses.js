// What a question is used for. A question can be ticked for any mix of:
//   eligibility - rules on the answer (Eligibility rules step)
//   rating      - a rating factor on the answer (Rating factors step)
//   account     - an account-level factor (recorded now; its own step comes later)
// A stage lists only the questions ticked for it, so a question ticked for several stages shows in all of them.
//
// Storage (so it survives copying a version):
//   product + coverage questions -> question.uses
//   form questions               -> coverage.formUses["<formId>:<questionId>"]
// Questions saved before categories existed have no stored value: they count as eligibility when they have rules
// and as rating when they have a factor, so nothing already configured drops out of its stage.

export const USES = [
  { key: 'eligibility', label: 'Eligibility question', short: 'Eligibility', hint: 'Appears in Eligibility rules, to refer a risk on the answer.' },
  { key: 'rating', label: 'Rating factor', short: 'Rating factor', hint: 'Appears in Rating factors, to adjust the premium by the answer. Needs a choice, number or currency answer.' },
  { key: 'account', label: 'Account-level factor', short: 'Account-level', hint: 'Marks the question for account-level evaluation.' },
];

// Answer types a rating factor can be defined on (the same ones factors.js accepts).
export const RATING_TYPES = ['dropdown', 'radio', 'yesno', 'checkbox', 'number', 'currency'];
// Answer types an account-level factor can use: choice answers get an adjustment per answer, number and currency answers
// an adjustment per range (the same types combination rating factors accept).
export const ACCOUNT_TYPES = RATING_TYPES;
// The types a stage can use, or null when the stage takes any.
export const typesFor = (use) => (use === 'rating' ? RATING_TYPES : use === 'account' ? ACCOUNT_TYPES : null);

const derive = (rules, factors) => ({ eligibility: rules.length > 0, rating: factors.length > 0, account: false });
const configuredCount = (rules, factors, use) => (use === 'eligibility' ? rules.length : use === 'rating' ? factors.length : 0);

// A handle reads and writes the categories of one question and knows what configuration a category holds.
//   uses() -> { eligibility, rating, account }   setUses(obj)   configured(use) -> count   clear(use)
export const questionHandle = (q) => ({
  uses: () => ({ ...(q.uses ?? derive(q.rules ?? [], q.factors ?? [])) }),
  setUses: (u) => (q.uses = { ...u }),
  configured: (use) => configuredCount(q.rules ?? [], q.factors ?? [], use),
  clear: (use) => {
    if (use === 'eligibility') q.rules = [];
    if (use === 'rating') q.factors = [];
  },
});

// Same, for a question of a form attached to a coverage (rk = "<formId>:<questionId>").
// The form builder sets a default on the form question itself (formQ.uses); a coverage can override it (coverage.formUses).
// Whatever is already configured on the coverage always counts, so it never drops out of its stage.
export const formHandle = (cov, rk, formQ) => ({
  uses: () => {
    if (cov.formUses?.[rk]) return { ...cov.formUses[rk] };
    const set = derive(cov.formRules?.[rk] ?? [], cov.formFactors?.[rk] ?? []);
    return Object.fromEntries(Object.keys(set).map((k) => [k, Boolean(set[k] || formQ?.uses?.[k])]));
  },
  setUses: (u) => ((cov.formUses ??= {})[rk] = { ...u }),
  configured: (use) => configuredCount(cov.formRules?.[rk] ?? [], cov.formFactors?.[rk] ?? [], use),
  clear: (use) => {
    if (use === 'eligibility' && cov.formRules) cov.formRules[rk] = [];
    if (use === 'rating' && cov.formFactors) cov.formFactors[rk] = [];
  },
});

// Turning a category off also removes what was configured under it.
export const toggleUse = (handle, use, on) => {
  const next = { ...handle.uses(), [use]: on };
  handle.setUses(next);
  if (!on) handle.clear(use);
};

export const confirmUntick = (handle, use) => {
  const n = handle.configured(use);
  const name = USES.find((u) => u.key === use).label.toLowerCase();
  return !n || confirm(`Remove this question from ${name}? Its ${use === 'eligibility' ? `${n} eligibility rule${n === 1 ? '' : 's'}` : 'rating factor'} will be deleted.`);
};
