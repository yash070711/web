(function () {
  'use strict';
  const esc = htmlEsc;
  const operators = [['=','Equals'],['≠','Does not equal'],['>','Greater than'],['<','Less than'],['CONTAINS','Contains'],['IS EMPTY','Is blank']];
  const outcomes = [['hard','Ineligible'],['refer','Referral'],['info','Require Information']];
  const scopes = ['Entire submission','Affected vehicle','Affected driver'];
  let pickerIndex = 0;
  let pickerFields = [];
  const active = () => RULES.find(r => r.id === activeRuleId);
  // Root-cause fix: earlier versions of this builder (and manual testing
  // before that fix landed) could persist a single rule bundling several
  // Questionnaire questions together as separate conditions. One question
  // must always be exactly one rule. This splits any such bundled rule,
  // already sitting in persisted product data, into one independent rule
  // per distinct linked question the next time rules are loaded/rendered.
  function migrateBundledRules() {
    if (!Array.isArray(RULES) || !RULES.length) return false;
    let changed = false;
    const next = [];
    RULES.forEach(r => {
      const qConditions = (r.conditions || []).filter(c => c && c.sourceQuestionId);
      const distinctQuestionIds = [...new Set(qConditions.map(c => String(c.sourceQuestionId)))];
      if (distinctQuestionIds.length <= 1) { next.push(r); return; }
      changed = true;
      distinctQuestionIds.forEach((qid, i) => {
        const cond = qConditions.find(c => String(c.sourceQuestionId) === qid);
        const question = findQuestionById(qid)?.q;
        const label = question?.label || cond.label || qid;
        const split = JSON.parse(JSON.stringify(r));
        split.id = i === 0 ? r.id : `${r.id}-${i + 1}`;
        while (next.some(x => x.id === split.id) || RULES.some(x => x !== r && x.id === split.id)) {
          split.id = `${split.id}-${Math.random().toString(36).slice(2, 5)}`;
        }
        split.name = label;
        split.linkedQuestionIds = [qid];
        split.conditions = [{ ...cond }];
        next.push(split);
      });
    });
    if (changed) {
      RULES.splice(0, RULES.length, ...next);
      persistRules();
    }
    return changed;
  }
  function covers() {
    return productCovers().map(c => {
      // Class of Business is authoritative for the hierarchy. The first
      // insured item is the parent; only later saved items are child classes.
      const children = Array.isArray(c.insuredItems)
        ? c.insuredItems.slice(1).map(x => x?.type || x?.name).filter(Boolean)
        : [];
      const id = c.id || c.code || c.name;
      return {id:String(id || ''),name:c.name || c.code,children:[...new Set(children)]};
    }).filter(c => c.id && c.name);
  }
  function fields() {
    const result = productQuestionGroups().flatMap(g => (g.questions || []).map(q => ({id:String(q.id),field:questionFieldKey(q),label:q.label || q.name || q.id,category:q.questionCategory || g.label || g.name || 'General',source:'Questionnaire Guide',type:q.fieldType || q.type || 'text',sourceQuestionId:q.id})));
    return result.filter((f, i) => result.findIndex(other => other.id === f.id) === i);
  }
  function prepare(r) {
    r.builderVersion = 1;
    r.conditions ||= [];
    r.coverIds ||= [];
    r.coverageMode ||= r.coverIds.length ? 'specific' : 'all';
    r.coverageChildren ||= {};
    r.affectedScope ||= 'Entire submission';
    // The compact builder intentionally hides the legacy messaging and
    // effective-date fields, but the shared studio-completion check still
    // requires them. Supply stable defaults so a rule that is complete in
    // this UI is also complete to the navigation gate. This also repairs
    // rules created by earlier versions of this builder when they are next
    // opened or saved.
    r.reasonCode ||= r.id || 'ELIGIBILITY-RULE';
    r.internalMsg ||= 'Eligibility rule triggered.';
    if (r.outcomeType === 'hard' || r.outcomeType === 'soft') {
      r.customerMsg ||= 'This risk does not meet eligibility requirements for this product.';
    }
    const dates = typeof defaultEffectiveDates === 'function'
      ? defaultEffectiveDates()
      : { from: '2026-01-01', to: '2099-12-31' };
    if (typeof isPlaceholderDate !== 'function' || isPlaceholderDate(r.effectiveFrom)) r.effectiveFrom = dates.from;
    if (typeof isPlaceholderDate !== 'function' || isPlaceholderDate(r.effectiveTo)) r.effectiveTo = dates.to;
    if (r.coverageMode === 'specific') covers().forEach(c => {
      if (!r.coverIds.map(String).includes(c.id)) return;
      if (!Object.hasOwn(r.coverageChildren,c.id)) {
        r.coverageChildren[c.id] = c.children.slice();
        return;
      }
      // Drop obsolete fallback children while preserving real saved choices.
      r.coverageChildren[c.id] = (Array.isArray(r.coverageChildren[c.id]) ? r.coverageChildren[c.id] : [])
        .filter(name => c.children.includes(name));
    });
    return r;
  }
  function options(list,value) {
    return list.map(item => { const [v,l] = Array.isArray(item) ? item : [item,item]; return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`; }).join('');
  }
  function select(label,key,list,value) {
    return rf(label,`<select class="form-control" ${rulesCanEdit()?'':'disabled'} onchange="EligibilityBuilder.patch('${key}',this.value)">${options(list,value)}</select>`);
  }
  function input(label,key,value,textarea=false) {
    const attrs = `${rulesCanEdit()?'':'readonly'} oninput="EligibilityBuilder.patch('${key}',this.value,false)"`;
    return rf(label,textarea ? `<textarea class="form-control" rows="3" ${attrs}>${esc(value || '')}</textarea>` : `<input class="form-control" value="${esc(value || '')}" ${attrs}>`,true);
  }
  function ruleTitle(r) {
    // A rule linked to a single Questionnaire question is always titled
    // after that question — "Unnamed rule" only applies to a manually
    // created rule with no question linked yet.
    if (r.name) return r.name;
    const q = selectedQuestions(r)[0];
    return (q && conditionLabel(q)) || 'Unnamed rule';
  }
  function list() {
    const host = document.getElementById('eb-rule-list');
    if (!host) return;
    const count = RULES.length;
    document.getElementById('eb-rule-count').textContent = `${count} rule${count === 1 ? '' : 's'}`;
    host.innerHTML = RULES.map((r,i) => {
      const condCount = (r.conditions || []).length;
      return `<div><button type="button" class="rule-item ${r.id===activeRuleId?'active':''}" style="width:100%;text-align:left" onclick="EligibilityBuilder.choose(${i})"><div class="rule-item-body"><div class="rule-item-name">${esc(ruleTitle(r))}</div><div class="rule-item-cond">${condCount} condition${condCount === 1 ? '' : 's'} · ${esc(r.affectedScope || 'Entire submission')}</div><span class="badge">${esc(outcomes.find(x=>x[0]===r.outcomeType)?.[1] || outcomeLabel(r.outcomeType))}</span></div></button><button type="button" class="btn btn-ghost btn-sm" ${rulesCanEdit()?'':'disabled'} onclick="EligibilityBuilder.removeAt(${i})" aria-label="Remove ${esc(ruleTitle(r))}">Remove Rule</button></div>`;
    }).join('') || '<p style="padding:16px">No rules yet. Add a rule to begin.</p>';
  }
  function conditionLabel(c) {
    const question = c.sourceQuestionId ? findQuestionById(c.sourceQuestionId)?.q : null;
    return question?.label || question?.name || c.label || c.field || c.sourceQuestionId || 'Select question or field';
  }
  function selectedQuestions(r) {
    const seen = new Set();
    return (r.conditions || []).filter(c => {
      if (!c.sourceQuestionId || seen.has(String(c.sourceQuestionId))) return false;
      seen.add(String(c.sourceQuestionId));
      return true;
    });
  }
  function detail() {
    const host = document.getElementById('eb-detail');
    if (!host) return;
    const r = active();
    if (!r) { host.innerHTML = '<h2>Rule Builder</h2><p>Select or add a rule.</p>'; return; }
    prepare(r);
    const disabled = rulesCanEdit() ? '' : 'disabled';
    const sectionLabel = text => `<div style="font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--color-muted);margin-bottom:8px">${esc(text)}</div>`;
    host.innerHTML = `<h2 style="font-size:18px;margin:0 0 16px">Rule Builder</h2>
      ${sectionLabel('Basic details')}
      <div class="form-grid-2">${input('Rule name','name',r.name)}${select('Status','status',[['active','Enabled'],['inactive','Disabled']],r.status)}</div>

      <div class="section-card" style="padding:16px;margin-top:16px">
        <h3 style="margin:0 0 12px">Coverage applicability</h3>
        ${select('Coverage applicability','coverageMode',[['all','All coverages'],['specific','Specific coverages']],r.coverageMode)}
        ${r.coverageMode==='specific' ? `<div style="margin-top:12px">${covers().map((c,i) => {
          const checked = r.coverIds.map(String).includes(c.id);
          return `<div class="section-card" style="padding:12px;margin:8px 0"><label><input type="checkbox" ${disabled} ${checked?'checked':''} onchange="EligibilityBuilder.parent(${i},this.checked)"> <strong>${esc(c.name)}</strong></label>${checked&&c.children.length?`<div style="padding:12px 0 0 24px;display:flex;gap:16px;flex-wrap:wrap">${c.children.map((name,j)=>`<label><input type="checkbox" ${disabled} ${(r.coverageChildren[c.id]||[]).includes(name)?'checked':''} onchange="EligibilityBuilder.child(${i},${j},this.checked)"> ${esc(name)}</label>`).join('')}</div>`:''}</div>`;
        }).join('')}</div>`:''}
      </div>

      <div class="section-card" style="padding:16px;margin-top:16px">
        <h3 style="margin:0 0 4px">Conditions</h3>
        <p style="margin:0 0 12px;font-size:12px;color:var(--color-muted)">Define the conditions used to determine eligibility.</p>
        ${select('Logic','logic',[['and','Match ALL conditions (AND)'],['or','Match ANY condition (OR)']],r.logic || 'and')}
        ${r.conditions.map((c,i)=>`
          <div class="section-card" style="padding:12px;margin:12px 0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:var(--color-brand-light);color:var(--color-brand);font-size:11px;font-weight:700">#${i+1}</span>
              <button class="btn btn-ghost btn-sm" type="button" ${disabled} onclick="EligibilityBuilder.removeCondition(${i})">Remove</button>
            </div>
            <div class="form-grid-3">
              ${rf('Question or field',`<button type="button" class="btn btn-secondary" style="width:100%;white-space:normal;text-align:left" ${disabled} onclick="EligibilityBuilder.picker(${i})">${esc(conditionLabel(c))} · Change</button>`)}
              ${rf('Operator',`<select class="form-control" ${disabled} onchange="EligibilityBuilder.condition(${i},'op',this.value)">${options(operators.some(x=>x[0]===c.op)?operators:[[c.op || '',c.op || 'Select operator'],...operators],c.op)}</select>`)}
              ${rf('Comparison value',`<input class="form-control" aria-label="Comparison value" value="${esc(c.value ?? '')}" ${disabled || (c.op==='IS EMPTY'?'disabled':'')} oninput="EligibilityBuilder.condition(${i},'value',this.value,false)">`)}
            </div>
          </div>`).join('')}
        <button class="btn btn-secondary btn-sm" type="button" ${disabled} onclick="EligibilityBuilder.addCondition()">+ Add Condition</button>
        <div style="margin-top:16px">
          ${select('Result','outcomeType',outcomes.some(x=>x[0]===r.outcomeType)?outcomes:[...outcomes,[r.outcomeType,outcomeLabel(r.outcomeType)]],r.outcomeType)}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;gap:12px;margin-top:16px"><button type="button" class="btn btn-ghost" ${disabled} onclick="EligibilityBuilder.remove()">Delete Rule</button><button type="button" class="btn btn-primary" ${disabled} onclick="EligibilityBuilder.save()">Save Rule</button></div>`;
  }
  function render() {
    const host = document.getElementById('studio-hub');
    if (!host) return;
    migrateBundledRules();
    host.innerHTML = `<div class="elig-recreated-home"><aside class="elig-recreated-card elig-rules-panel"><div class="elig-rules-head"><div class="elig-rules-head-row"><div><div class="elig-rules-title">Eligibility Rules</div><div id="eb-rule-count" class="elig-rules-sub"></div></div><button type="button" class="btn btn-secondary btn-sm" ${rulesCanEdit()?'':'disabled'} onclick="EligibilityBuilder.add()">+ Add Rule</button></div></div><div id="eb-rule-list" class="elig-recreated-rule-list"></div><button type="button" class="btn btn-ghost btn-sm" ${rulesCanEdit()?'':'disabled'} onclick="EligibilityBuilder.samples()">Add sample rules</button></aside><section><div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px"><button type="button" class="btn btn-secondary" onclick="EligibilityBuilder.validate()">Validate Rules</button><button type="button" class="btn btn-secondary" ${rulesCanEdit()?'':'disabled'} onclick="EligibilityBuilder.draft()">Save Draft</button></div><div id="eb-detail" class="elig-recreated-card" style="padding:var(--space-5)"></div></section></div>`;
    list(); detail();
  }
  function errors(r) {
    prepare(r);
    const e=[];
    if (!String(r.name || '').trim()) e.push('Rule name is required.');
    if (r.coverageMode==='specific') {
      if (!r.coverIds.length) e.push('Select at least one coverage.');
      r.coverIds.forEach(id => {
        const coverId=String(id),c=covers().find(x=>x.id===coverId);
        const selectedChildren=Array.isArray(r.coverageChildren[coverId])?r.coverageChildren[coverId]:[];
        if (!c || (c.children.length && !selectedChildren.some(x=>c.children.includes(x)))) e.push('Select at least one coverage.');
      });
    }
    if (!r.conditions.length) e.push('Select a question or field.');
    r.conditions.forEach(c=>{ if (!c.field || !c.op) e.push('Select a question or field.'); else if (!['IS EMPTY','Is empty','Is null','IS NOT EMPTY','Is not empty','Is true','Is false'].includes(c.op) && !String(c.value ?? '').trim()) e.push('Comparison value is required.'); });
    return [...new Set(e)];
  }
  function toast(message) {
    let el=document.getElementById('eb-toast');
    if (!el) { el=document.createElement('div');el.id='eb-toast';el.setAttribute('role','status');el.className='section-card';el.style.cssText='position:fixed;bottom:24px;right:24px;z-index:10000;padding:16px;max-width:min(420px,90vw);background:var(--color-surface);color:var(--color-ink);box-shadow:0 4px 18px rgba(0,0,0,.12)';document.body.appendChild(el); }
    el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,5000);
  }
  function newRule(name='') {
    return {...JSON.parse(JSON.stringify(ELIGIBILITY_RULE_TEMPLATE)),id:'ELG-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),name,status:'active',coverageMode:'all',coverIds:[],coverageChildren:{},logic:'and',conditions:[{field:'',op:'=',value:''}],outcomeType:'refer',affectedScope:scopes[0],internalMsg:'Eligibility rule triggered.',customerMsg:'This risk does not meet eligibility requirements for this product.',referralQueue:'',allowOverride:false};
  }
  const api = window.EligibilityBuilder = {
    choose(i) { activeRuleId=RULES[i]?.id;list();detail(); },
    patch(key,value,refresh=true) { if(!rulesCanEdit() || !active())return;active()[key]=value;if(key==='coverageMode'){if(value==='all'){active().coverIds=[];active().coverageChildren={};}active().cover=value==='all'?'All Covers':'Specific coverages';active().category=value==='all'?'Product Eligibility':'Cover Eligibility';}list();if(refresh)detail(); },
    parent(i,on) { if(!rulesCanEdit())return;const r=active(),c=covers()[i];r.coverIds=r.coverIds.filter(id=>String(id)!==c.id);if(on)r.coverIds.push(c.id);r.coverageChildren[c.id]=on?c.children.slice():[];detail(); },
    child(i,j,on) { if(!rulesCanEdit())return;const r=active(),c=covers()[i],name=c.children[j];r.coverageChildren[c.id]=(r.coverageChildren[c.id]||[]).filter(x=>x!==name);if(on)r.coverageChildren[c.id].push(name);detail(); },
    condition(i,key,value,refresh=true) { if(!rulesCanEdit())return;active().conditions[i][key]=value;if(refresh)detail(); },
    addCondition() { if(!rulesCanEdit())return;active().conditions.push({field:'',op:'=',value:''});list();detail(); },
    removeCondition(i) { if(!rulesCanEdit())return;active().conditions.splice(i,1);list();detail(); },
    add() {
      // Create a complete rule object immediately, with full defaults
      // (Enabled, All coverages, AND logic, Referral, Entire submission,
      // one complete condition). No intermediate "how do you want to
      // create it" step — the question/field for the condition is chosen
      // afterward via the "Question or field" picker in the condition card.
      if(!rulesCanEdit())return;
      const r=newRule();
      prepare(r);
      RULES.push(r);
      pendingEligibilityRule=null;
      activeRuleId=r.id;
      persistRules();render();toast('Rule added.');
    },
    removeAt(i) { if(!rulesCanEdit()||!RULES[i])return;const id=RULES[i].id;RULES.splice(i,1);if(activeRuleId===id)activeRuleId=RULES[0]?.id || '';persistRules();render();toast('Rule removed.'); },
    remove() { if(!rulesCanEdit() || !active())return;RULES.splice(RULES.indexOf(active()),1);activeRuleId=RULES[0]?.id || '';persistRules();render();toast('Rule deleted.'); },
    save() { if(!rulesCanEdit() || !active())return;const e=errors(active());if(e.length)return toast(e[0]);persistRules();toast('Rule saved successfully.');list(); },
    draft() { if(!rulesCanEdit())return;persistRules();toast('Draft saved.'); },
    validate() { if(!RULES.length)return toast('Add at least one rule.');const bad=RULES.find(r=>errors(r).length);toast(bad?`${bad.name || 'Unnamed rule'}: ${errors(bad)[0]}`:'All eligibility rules are valid.'); },
    picker(i) {
      if(!rulesCanEdit())return;pickerIndex=i;pickerFields=fields();
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">Select question or field</h2><button type="button" class="btn btn-ghost" onclick="PS.closeModal()">Close</button></div><div class="modal-body"><div class="form-grid-2"><input id="eb-search" class="form-control" placeholder="Search by question, category, or source" aria-label="Search fields" oninput="EligibilityBuilder.filter()"><select id="eb-category" class="form-control" aria-label="Category filter" onchange="EligibilityBuilder.filter()">${options(['All categories',...[...new Set(pickerFields.map(x=>x.category))].sort()],'All categories')}</select></div><div id="eb-fields" style="max-height:50vh;overflow:auto;margin-top:16px"></div></div>`,'modal-lg');api.filter();document.getElementById('eb-search')?.focus();
    },
    filter() {
      const q=document.getElementById('eb-search').value.toLowerCase(),cat=document.getElementById('eb-category').value;
      const matches=pickerFields.map((f,i)=>({f,i})).filter(({f})=>(cat==='All categories'||f.category===cat)&&`${f.label} ${f.category} ${f.source}`.toLowerCase().includes(q));
      const sourceOrder=['Questionnaire Guide','Product data','External data'];
      const groups=new Map();
      matches.forEach(item => {
        const src=item.f.source || 'Other';
        if (!groups.has(src)) groups.set(src, []);
        groups.get(src).push(item);
      });
      const orderedSources=[...groups.keys()].sort((a,b) => {
        const ia=sourceOrder.indexOf(a), ib=sourceOrder.indexOf(b);
        return (ia<0?99:ia) - (ib<0?99:ib) || a.localeCompare(b);
      });
      document.getElementById('eb-fields').innerHTML = orderedSources.length
        ? orderedSources.map(src => `
          <div style="font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--color-muted);margin:14px 0 6px">${esc(src)}</div>
          ${groups.get(src).map(({f,i}) => `<button type="button" class="btn btn-secondary" style="display:block;width:100%;text-align:left;white-space:normal;margin-bottom:8px" onclick="EligibilityBuilder.pick(${i})"><strong>${esc(f.label)}</strong><br><small>${esc(f.category)} · ${esc(f.source)} · ${esc(f.type)}</small></button>`).join('')}
        `).join('')
        : '<p>No matching fields.</p>';
    },
    pick(i) { if(!rulesCanEdit())return;const f=pickerFields[i],c=active().conditions[pickerIndex];Object.assign(c,{field:f.field,label:f.label,fieldType:f.type,source:f.source,category:f.category,sourceQuestionId:f.sourceQuestionId || '',attributeId:f.attributeId || '',value:''});PS.closeModal();detail(); },
    samples() { if(!rulesCanEdit())return;const pd=covers().find(c=>/physical damage/i.test(c.name));if(!pd)return toast('Add Physical Damage in Coverage Guide before adding the sample rules.');const a=newRule('Vehicle age – Physical Damage');Object.assign(a,{coverageMode:'specific',category:'Cover Eligibility',cover:pd.name,coverIds:[pd.id],coverageChildren:{[pd.id]:pd.children.slice()},conditions:[{field:'vehicle_age',label:'Vehicle age',op:'>',value:'20'}],outcomeType:'hard',affectedScope:'Affected vehicle',internalMsg:'Vehicle age exceeds Physical Damage threshold.',customerMsg:'Physical Damage cannot be offered for this vehicle.'});const b=newRule('Long operating radius');Object.assign(b,{conditions:[{field:'operating_radius',label:'Operating radius',op:'>',value:'500'}],referralQueue:'Transportation Underwriting',internalMsg:'Operating radius exceeds 500 miles.',customerMsg:'Underwriting review is required for this operating radius.'});[a,b].forEach(r=>{if(!RULES.some(x=>x.name===r.name))RULES.push(r);});activeRuleId=RULES.find(r=>r.name===a.name).id;render();toast('Sample rules added. Save Draft to keep them.'); }
  };
  window.openRuleEditor = function(id) { PS.closeModal?.();pendingEligibilityRule=null;activeRuleId=id;setEligHubVisible(true);if(PS.studioHub)PS.studioHub.mode='hub';document.getElementById('studio-editor')?.classList.add('hidden');const host=document.getElementById('studio-hub');host?.classList.remove('hidden');host?.closest('.studio-hub-home')?.classList.remove('hidden');render(); };
  window.openAddRuleModal = () => api.add();
  window.validateEligibilityRule = () => !active() || errors(active()).length===0;
  const originalNormalize = window.normalizeEligibilityRule;
  window.normalizeEligibilityRule = function(r) {
    const saved = r?.builderVersion ? JSON.parse(JSON.stringify(r)) : null;
    const normalized = originalNormalize(saved ? JSON.parse(JSON.stringify(r)) : r);
    return saved ? {...normalized, ...saved} : normalized;
  };
  const originalLoad = window.loadRule;
  window.loadRule = function(id) {
    if (document.getElementById('eb-detail')) { window.openRuleEditor(id); return; }
    return originalLoad(id);
  };
  function boot() {
    setTimeout(()=>{if(!active())activeRuleId=RULES[0]?.id || '';window.openRuleEditor(activeRuleId);},120);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
