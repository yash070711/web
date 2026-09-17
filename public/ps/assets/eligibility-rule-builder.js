(function () {
  'use strict';
  const esc = htmlEsc;
  const defaults = [
    {id:'AL',name:'Auto Liability (AL)',children:['Bodily Injury Liability','Property Damage Liability','Hired Auto Liability','Non-Owned Auto Liability']},
    {id:'PD',name:'Physical Damage (PD)',children:['Collision','Comprehensive','Specified Causes of Loss']},
    {id:'MTC',name:'Motor Truck Cargo',children:['Cargo Loss / Damage','Debris Removal','Earned Freight']}
  ];
  const operators = [['=','Equals'],['≠','Does not equal'],['>','Greater than'],['<','Less than'],['CONTAINS','Contains'],['IS EMPTY','Is blank']];
  const outcomes = [['hard','Ineligible'],['refer','Referral'],['info','Require Information']];
  const scopes = ['Entire submission','Affected vehicle','Affected driver'];
  let createFields = [];
  let createSelected = new Set();
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
    const actual = productCovers();
    return (actual.length ? actual : defaults).map(c => {
      const fallback = defaults.find(d => (c.name || '').toLowerCase().includes(d.name.split(' (')[0].toLowerCase()));
      const raw = c.children || c.childCoverages || c.childClasses;
      let children = Array.isArray(raw) ? raw.map(x => typeof x === 'string' ? x : x.name || x.label || x.type).filter(Boolean) : [];
      if (!children.length && c.insuredItems?.length > 1) children = c.insuredItems.slice(1).map(x => x.type || x.name).filter(Boolean);
      if (!children.length) children = fallback?.children || [c.name];
      return {id:String(c.id),name:c.name || c.code,children:[...new Set(children)]};
    });
  }
  function fields() {
    const result = productQuestionGroups().flatMap(g => (g.questions || []).map(q => ({id:String(q.id),field:questionFieldKey(q),label:q.label || q.name || q.id,category:q.questionCategory || g.label || g.name || 'General',source:'Questionnaire Studio',type:q.fieldType || q.type || 'text',sourceQuestionId:q.id})));
    productRiskAttributes().forEach(a => result.push({id:'product:'+a.id,attributeId:a.id,field:a.key || a.internalName || a.id,label:a.name || a.label || a.id,category:a.group || a.category || 'Product',source:'Product data',type:a.type || 'text'}));
    [['Operating radius','Operations','number','Product data'],['Vehicle age','Vehicle','number','Product data'],['Fleet size','Fleet','number','Product data'],['Commodity type','Commodity','text','Product data'],['CDL experience','Driver','number','Product data'],['USDOT status','Compliance','text','External data'],['Coverage requested','Coverage','text','Product data'],['Garaging state','Vehicle','text','Product data']].forEach(([label,category,type,source]) => {
      if (!result.some(x => x.label.toLowerCase() === label.toLowerCase())) result.push({id:slugField(label),field:slugField(label),label,category,type,source});
    });
    return result;
  }
  function prepare(r) {
    r.builderVersion = 1;
    r.conditions ||= [];
    r.coverIds ||= [];
    r.coverageMode ||= r.coverIds.length ? 'specific' : 'all';
    r.coverageChildren ||= {};
    r.affectedScope ||= 'Entire submission';
    if (r.coverageMode === 'specific') covers().forEach(c => {
      if (r.coverIds.map(String).includes(c.id) && !Object.hasOwn(r.coverageChildren,c.id)) r.coverageChildren[c.id] = c.children.slice();
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
    host.innerHTML = `<h2 style="font-size:18px;margin:0 0 16px">Rule Builder</h2>
      <div class="form-grid-2">${input('Rule name','name',r.name)}${select('Status','status',[['active','Enabled'],['inactive','Disabled']],r.status)}
      ${select('Coverage applicability','coverageMode',[['all','All coverages'],['specific','Specific coverages']],r.coverageMode)}</div>
      ${r.coverageMode==='specific' ? `<div>${covers().map((c,i) => {
        const checked = r.coverIds.map(String).includes(c.id);
        return `<div class="section-card" style="padding:12px;margin:8px 0"><label><input type="checkbox" ${disabled} ${checked?'checked':''} onchange="EligibilityBuilder.parent(${i},this.checked)"> <strong>${esc(c.name)}</strong></label>${checked?`<div style="padding:12px 0 0 24px;display:flex;gap:16px;flex-wrap:wrap">${c.children.map((name,j)=>`<label><input type="checkbox" ${disabled} ${(r.coverageChildren[c.id]||[]).includes(name)?'checked':''} onchange="EligibilityBuilder.child(${i},${j},this.checked)"> ${esc(name)}</label>`).join('')}</div>`:''}</div>`;
      }).join('')}</div>`:''}
      <div class="section-card" style="padding:16px;margin-top:16px"><h3>Conditions</h3>
      ${select('Logic','logic',[['and','Match ALL conditions (AND)'],['or','Match ANY condition (OR)']],r.logic || 'and')}
      ${r.conditions.map((c,i)=>`<div class="section-card" style="padding:12px;margin:12px 0"><div class="form-grid-2">${rf('Question or field',`<button type="button" class="btn btn-secondary" style="width:100%;white-space:normal;text-align:left" ${disabled} onclick="EligibilityBuilder.picker(${i})">${esc(conditionLabel(c))} · Change</button>`)}${rf('Operator',`<select class="form-control" ${disabled} onchange="EligibilityBuilder.condition(${i},'op',this.value)">${options(operators.some(x=>x[0]===c.op)?operators:[[c.op || '',c.op || 'Select operator'],...operators],c.op)}</select>`)}${rf('Comparison value',`<input class="form-control" aria-label="Comparison value" value="${esc(c.value ?? '')}" ${disabled || (c.op==='IS EMPTY'?'disabled':'')} oninput="EligibilityBuilder.condition(${i},'value',this.value,false)">`)}<button class="btn btn-ghost btn-sm" type="button" ${disabled} onclick="EligibilityBuilder.removeCondition(${i})">Remove</button></div></div>`).join('')}
      <button class="btn btn-secondary btn-sm" type="button" ${disabled} onclick="EligibilityBuilder.addCondition()">+ Add Condition</button></div>
      <div class="section-card" style="padding:16px;margin-top:16px"><h3>Eligibility outcome</h3><div class="form-grid-2">
      ${select('Result','outcomeType',outcomes.some(x=>x[0]===r.outcomeType)?outcomes:[...outcomes,[r.outcomeType,outcomeLabel(r.outcomeType)]],r.outcomeType)}
      ${select('Affected scope','affectedScope',scopes,r.affectedScope)}
      ${r.outcomeType==='refer'?select('Referral queue','referralQueue',['','Transportation Underwriting','Senior Underwriter'],r.referralQueue || ''):''}
      ${input('Internal reason','internalMsg',r.internalMsg,true)}${input('Applicant/agent message','customerMsg',r.customerMsg,true)}</div>
      <label><input type="checkbox" ${disabled} ${r.allowOverride?'checked':''} onchange="EligibilityBuilder.patch('allowOverride',this.checked,false)"> Authorized underwriter may override with reason</label></div>
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
    if (!String(r.name || '').trim()) e.push('Enter a rule name.');
    if (r.coverageMode==='specific') {
      if (!r.coverIds.length) e.push('Select at least one parent coverage.');
      r.coverIds.forEach(id => { const c=covers().find(x=>x.id===String(id)); if (!c || !(r.coverageChildren[id]||[]).some(x=>c.children.includes(x))) e.push('Select at least one child for each parent coverage.'); });
    }
    if (!r.conditions.length) e.push('Add at least one condition.');
    r.conditions.forEach(c=>{ if (!c.field || !c.op) e.push('Select a field and operator.'); if (!['IS EMPTY','Is empty','Is null','IS NOT EMPTY','Is not empty','Is true','Is false'].includes(c.op) && !String(c.value ?? '').trim()) e.push('Enter a comparison value.'); });
    if (!String(r.internalMsg || '').trim()) e.push('Enter an internal reason.');
    if (!String(r.customerMsg || '').trim()) e.push('Enter an applicant/agent message.');
    if (r.outcomeType==='refer' && !r.referralQueue) e.push('Select a referral queue.');
    return [...new Set(e)];
  }
  function toast(message) {
    let el=document.getElementById('eb-toast');
    if (!el) { el=document.createElement('div');el.id='eb-toast';el.setAttribute('role','status');el.className='section-card';el.style.cssText='position:fixed;bottom:24px;right:24px;z-index:10000;padding:16px;max-width:min(420px,90vw);background:var(--color-surface);color:var(--color-ink);box-shadow:0 4px 18px rgba(0,0,0,.12)';document.body.appendChild(el); }
    el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,5000);
  }
  function newRule(name='') {
    return {...JSON.parse(JSON.stringify(ELIGIBILITY_RULE_TEMPLATE)),id:'ELG-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),name,status:'active',coverageMode:'all',coverIds:[],coverageChildren:{},logic:'and',conditions:[{field:'',op:'=',value:''}],outcomeType:'refer',affectedScope:scopes[0],internalMsg:'',customerMsg:'',referralQueue:'',allowOverride:false};
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
      if(!rulesCanEdit())return;
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">How do you want to create it?</h2><button type="button" class="btn btn-secondary btn-sm" aria-label="Close" onclick="PS.closeModal()">&times;</button></div><div class="modal-body"><div class="form-grid-2">
        <button type="button" class="btn btn-secondary" style="display:block;text-align:left;white-space:normal;padding:20px;border-radius:14px;min-height:158px" onclick="EligibilityBuilder.fromQuestionnaire()"><span class="badge" style="margin-bottom:16px">&#9675;</span><strong style="display:block;font-size:16px;margin-bottom:6px">From Questionnaire</strong><span style="display:block;font-weight:400;color:var(--color-muted)">Select one or more questions configured in Questionnaire Studio</span></button>
        <button type="button" class="btn btn-secondary" style="display:block;text-align:left;white-space:normal;padding:20px;border-radius:14px;min-height:158px" onclick="EligibilityBuilder.manual()"><span class="badge" style="margin-bottom:16px">&#9675;</span><strong style="display:block;font-size:16px;margin-bottom:6px">Create Manually</strong><span style="display:block;font-weight:400;color:var(--color-muted)">Create an Eligibility Rule and define the conditions manually</span></button>
        </div></div><div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button></div>`);
    },
    manual() {
      if(!rulesCanEdit())return;
      const r=newRule();prepare(r);RULES.push(r);pendingEligibilityRule=null;activeRuleId=r.id;
      PS.closeModal();persistRules();render();toast('Draft saved to this product.');
    },
    fromQuestionnaire() {
      if(!rulesCanEdit())return;
      createFields=fields().filter(f=>f.source==='Questionnaire Studio');
      createSelected=new Set();
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">Select questions</h2><button type="button" class="btn btn-ghost" onclick="PS.closeModal()">Cancel</button></div><div class="modal-body">
        <input id="eb-create-mode" type="hidden" value="questions">
        <div id="eb-create-questions"><p style="color:var(--color-muted);margin:0 0 12px">Choose your inputs here. Configure the rule in the next step.</p><input id="eb-create-search" class="form-control" placeholder="Search questions or categories" aria-label="Search questionnaire questions" oninput="EligibilityBuilder.createSearch()"><div id="eb-create-list" style="max-height:36vh;overflow:auto;margin-top:12px;border:1px solid var(--color-border);border-radius:8px"></div></div>
        <p id="eb-create-manual" hidden>Start with a blank condition and configure the field, operator, and value in Rule Builder.</p>
        </div><div class="modal-footer"><span id="eb-selection-count" role="status" style="margin-right:auto;color:var(--color-muted)">0 questions selected</span><button type="button" class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button id="eb-create-continue" type="button" class="btn btn-primary" onclick="EligibilityBuilder.create()">Continue</button></div>`,'modal-lg');
      api.createSearch();api.createCount();
    },
    createMode() {
      const manual=document.getElementById('eb-create-mode').value==='manual';
      document.getElementById('eb-create-questions').hidden=manual;
      document.getElementById('eb-create-manual').hidden=!manual;
      document.querySelector('.modal-title').textContent=manual?'Manual rule':'Select questions';
      api.createCount();
    },
    createSearch() {
      const q=document.getElementById('eb-create-search').value.toLowerCase();
      document.getElementById('eb-create-list').innerHTML=createFields.map((f,i)=>({f,i})).filter(({f})=>(f.label+' '+f.category).toLowerCase().includes(q)).map(({f,i})=>`<label style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--color-border);cursor:pointer"><input type="checkbox" ${createSelected.has(i)?'checked':''} onchange="EligibilityBuilder.selectCreateQuestion(${i},this.checked)"> <span style="flex:1"><strong style="font-size:13px;font-weight:500">${esc(f.label)}</strong><br><small style="color:var(--color-muted)">${esc(f.category)}</small></span><small class="badge">${esc(f.type)}</small></label>`).join('') || '<p>No matching questions. Configure questions in Questionnaire Studio or choose Manual conditions.</p>';
    },
    createCount() {
      const manual=document.getElementById('eb-create-mode').value==='manual';
      document.getElementById('eb-selection-count').textContent=manual?'Configure conditions in Rule Builder':createSelected.size+' questions selected';
      document.getElementById('eb-create-continue').disabled=!manual&&!createSelected.size;
    },
    selectCreateQuestion(i,on) { if(on)createSelected.add(i);else createSelected.delete(i);api.createCount(); },
    create() {
      if(!rulesCanEdit())return;
      const manual=document.getElementById('eb-create-mode').value==='manual';
      if(!manual&&!createSelected.size)return toast('Select at least one questionnaire question.');
      if (manual) {
        const r=newRule();
        prepare(r);RULES.push(r);pendingEligibilityRule=null;activeRuleId=r.id;PS.closeModal();persistRules();render();toast('Draft saved to this product.');
        return;
      }
      // Each selected question becomes its own, independent rule — never
      // bundled together into a single multi-condition rule.
      const selected=[...createSelected].map(i=>createFields[i]);
      const createdRules = selected.map(f => {
        const r = newRule(f.label || '');
        r.linkedQuestionIds=[f.sourceQuestionId];
        r.source='questionnaire';
        r.conditions=[{field:f.field,label:f.label,sourceQuestionId:f.sourceQuestionId,attributeId:'',source:f.source,category:f.category,fieldType:f.type,op:'=',value:'',connector:'AND'}];
        prepare(r);
        return r;
      });
      createdRules.forEach(r=>RULES.push(r));
      pendingEligibilityRule=null;
      activeRuleId=createdRules[0]?.id || activeRuleId;
      PS.closeModal();persistRules();render();
      toast(`${createdRules.length} eligibility rule${createdRules.length===1?'':'s'} created — one per selected question.`);
    },
    removeAt(i) { if(!rulesCanEdit()||!RULES[i])return;const id=RULES[i].id;RULES.splice(i,1);if(activeRuleId===id)activeRuleId=RULES[0]?.id || '';persistRules();render();toast('Rule removed.'); },
    remove() { if(!rulesCanEdit() || !active())return;RULES.splice(RULES.indexOf(active()),1);activeRuleId=RULES[0]?.id || '';persistRules();render();toast('Rule deleted.'); },
    save() { if(!rulesCanEdit() || !active())return;const e=errors(active());if(e.length)return toast(e[0]);persistRules();toast('Rule saved.');list(); },
    draft() { if(!rulesCanEdit())return;persistRules();toast('Draft saved.'); },
    validate() { if(!RULES.length)return toast('Add at least one rule.');const bad=RULES.find(r=>errors(r).length);toast(bad?`${bad.name || 'Unnamed rule'}: ${errors(bad)[0]}`:'All rules are valid.'); },
    picker(i) {
      if(!rulesCanEdit())return;pickerIndex=i;pickerFields=fields();
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">Select question or field</h2><button type="button" class="btn btn-ghost" onclick="PS.closeModal()">Close</button></div><div class="modal-body"><div class="form-grid-2"><input id="eb-search" class="form-control" placeholder="Search name, category, or source" aria-label="Search fields" oninput="EligibilityBuilder.filter()"><select id="eb-category" class="form-control" aria-label="Category filter" onchange="EligibilityBuilder.filter()">${options(['All categories',...[...new Set(pickerFields.map(x=>x.category))].sort()],'All categories')}</select></div><div id="eb-fields" style="max-height:50vh;overflow:auto;margin-top:16px"></div></div>`,'modal-lg');api.filter();document.getElementById('eb-search')?.focus();
    },
    filter() { const q=document.getElementById('eb-search').value.toLowerCase(),cat=document.getElementById('eb-category').value;document.getElementById('eb-fields').innerHTML=pickerFields.map((f,i)=>({f,i})).filter(({f})=>(cat==='All categories'||f.category===cat)&&`${f.label} ${f.category} ${f.source}`.toLowerCase().includes(q)).map(({f,i})=>`<button type="button" class="btn btn-secondary" style="display:block;width:100%;text-align:left;white-space:normal;margin-bottom:8px" onclick="EligibilityBuilder.pick(${i})"><strong>${esc(f.label)}</strong><br><small>${esc(f.category)} · ${esc(f.source)} · ${esc(f.type)}</small></button>`).join('') || '<p>No matching fields.</p>'; },
    pick(i) { if(!rulesCanEdit())return;const f=pickerFields[i],c=active().conditions[pickerIndex];Object.assign(c,{field:f.field,label:f.label,fieldType:f.type,source:f.source,category:f.category,sourceQuestionId:f.sourceQuestionId || '',attributeId:f.attributeId || '',value:''});PS.closeModal();detail(); },
    samples() { if(!rulesCanEdit())return;const pd=covers().find(c=>/physical damage/i.test(c.name));if(!pd)return toast('Add Physical Damage in Coverage Studio before adding the sample rules.');const a=newRule('Vehicle age – Physical Damage');Object.assign(a,{coverageMode:'specific',category:'Cover Eligibility',cover:pd.name,coverIds:[pd.id],coverageChildren:{[pd.id]:pd.children.slice()},conditions:[{field:'vehicle_age',label:'Vehicle age',op:'>',value:'20'}],outcomeType:'hard',affectedScope:'Affected vehicle',internalMsg:'Vehicle age exceeds Physical Damage threshold.',customerMsg:'Physical Damage cannot be offered for this vehicle.'});const b=newRule('Long operating radius');Object.assign(b,{conditions:[{field:'operating_radius',label:'Operating radius',op:'>',value:'500'}],referralQueue:'Transportation Underwriting',internalMsg:'Operating radius exceeds 500 miles.',customerMsg:'Underwriting review is required for this operating radius.'});[a,b].forEach(r=>{if(!RULES.some(x=>x.name===r.name))RULES.push(r);});activeRuleId=RULES.find(r=>r.name===a.name).id;render();toast('Sample rules added. Save Draft to keep them.'); }
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
