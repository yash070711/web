// Acord form versions.
// A form is edited freely, but a coverage never uses the live form: attaching a form pins the coverage to a
// version, a frozen copy of the form as it was. Editing the form later does not change coverages that already
// use it; they move to the new version only when the user chooses to update.
//
//   attachment = { formId, versionId, excluded: [questionId] }
//   form_versions record = { id, formId, number, name, description, layout, status, sections, createdAt }
import { api } from './api.js';

const versionsApi = api('form_versions');
const cache = new Map();

// What makes two versions of a form the same.
const content = (f) => JSON.stringify({ name: f.name, description: f.description ?? '', layout: f.layout ?? 'stacked', sections: f.sections });

export const loadFormVersions = async () => {
  cache.clear();
  (await versionsApi.list()).forEach((v) => cache.set(v.id, v));
  return cache;
};

export const versionsOfForm = (formId) => [...cache.values()].filter((v) => v.formId === formId).sort((a, b) => b.number - a.number);

// The form a coverage uses: its pinned version (shaped like a form, with the form's id), else the live form
// for attachments made before versions existed.
export const formFor = (att, forms) => {
  const v = att.versionId && cache.get(att.versionId);
  return v ? { ...v, id: v.formId, versionId: v.id } : forms.find((f) => f.id === att.formId);
};

// Does the live form differ from the version this attachment uses?
export const hasNewerVersion = (att, form) => {
  if (!form) return false;
  const v = att.versionId && cache.get(att.versionId);
  return !v || content(v) !== content(form);
};

// The version that matches the form as it is now; created if the form changed since its last version.
export const ensureVersion = async (form) => {
  await loadFormVersions();
  const [latest] = versionsOfForm(form.id);
  if (latest && content(latest) === content(form)) return latest;
  const created = await versionsApi.create({
    formId: form.id,
    number: (latest?.number ?? 0) + 1,
    name: form.name,
    description: form.description ?? '',
    layout: form.layout ?? 'stacked',
    status: form.status,
    sections: structuredClone(form.sections),
    createdAt: new Date().toISOString(),
  });
  cache.set(created.id, created);
  return created;
};

// Attach a form to a coverage at its current state.
export const attachForm = async (form, excluded = []) => ({ formId: form.id, versionId: (await ensureVersion(form)).id, excluded });

export const versionLabel = (att) => {
  const v = att.versionId && cache.get(att.versionId);
  return v ? `v${v.number}` : 'unversioned';
};
