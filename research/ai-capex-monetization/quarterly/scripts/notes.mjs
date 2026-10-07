import {date} from '../../scripts/contract.mjs';
export function validateNoteSource(source,company,sources){
 const s=sources.find(s=>s.sourceId===source?.sourceId);
 if(!s||s.company!==company||s.sha256!==source.sha256||s.url!==source.url||source.publicationDate&&source.publicationDate!==s.publicationDate||!source.locator)throw Error('NOTE_PINNED_SOURCE');
 if(source.page!==undefined&&source.page!==null&&(!Number.isInteger(source.page)||source.page<1))throw Error('NOTE_PAGE');
 return s;
}
export function validateNotes(input){
 for(const p of input.policies?.policies||[])if(p.source.sha256)validateNoteSource(p.source,p.company,input.sources);
 for(const d of input.policies?.rpoDefinitionHistory||[])if(d.source?.sha256)validateNoteSource(d.source,'GOOG',input.sources);
 const n=input.notes;if(!n)return true;
 if(n.schemaVersion!=='ai-capex-accounting-notes-v0.1'||!n.reviewed||!Array.isArray(n.notes)||!Array.isArray(n.annualObservations))throw Error('NOTE_SCHEMA');
 const ids=new Set();
 for(const a of n.notes){if(!a.noteId||ids.has(a.noteId)||!a.anchors?.length||a.anchors.some(x=>typeof x!=='string'||!x)||!a.conclusion)throw Error('NOTE_IDENTITY');ids.add(a.noteId);validateNoteSource(a.source,a.company,input.sources);}
 for(const a of n.annualObservations){const s=validateNoteSource(a.source,a.company,input.sources);date(a.periodStart);date(a.periodEnd);
  if(a.metric!=='depreciationPpe'||a.periodType!=='FY'||a.frequency!=='ANNUAL'||a.unit!=='USD_MILLIONS'||a.periodStart.slice(5)!=='01-01'||a.periodEnd.slice(5)!=='12-31'||a.periodStart.slice(0,4)!==a.periodEnd.slice(0,4)||a.periodEnd>s.publicationDate||!Number.isFinite(a.value)||a.value<0||!ids.has(a.noteId))throw Error('ANNUAL_NOTE_SEMANTICS');
 }
 return true;
}
