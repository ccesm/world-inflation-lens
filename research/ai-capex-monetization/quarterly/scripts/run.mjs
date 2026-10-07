import fs from 'node:fs';
import path from 'node:path';
import {load,root,read} from './io.mjs';
import {build,validateGenerated,metricFamilies,quarters} from './panel.mjs';
import {eventTimeline} from './events.mjs';
import {companies,bytes,hash} from '../../scripts/contract.mjs';
import {sha256} from './retrieve.mjs';
const args=process.argv.slice(2),allowed=['--verify-raw'];if(args.some(a=>!allowed.includes(a)))throw Error('Unknown option');
const {input,manifest,definitions,events}=load();
if(args.includes('--verify-raw')){
 const cache=process.env.WIL_AI_CAPEX_CACHE;if(!cache)throw Error('WIL_AI_CAPEX_CACHE required');
 for(const s of input.sources){const file=path.join(cache,'objects',s.sha256.slice(0,2),s.sha256);const b=fs.readFileSync(file);if(sha256(b)!==s.sha256||b.length!==s.byteSize)throw Error('RAW_IDENTITY: '+s.sourceId);}
}
const result=build(input,manifest,definitions);validateGenerated(result,input,manifest,definitions);
const timeline=eventTimeline(events,quarters(),companies,input.sources);
const health=result.content.completeness.map(r=>({company:r.company,metric:r.metric,family:r.family,status:r.status==='QUALIFIED'?'CURRENT':r.status==='PARTIAL'?'PARTIAL':'UNAVAILABLE',observationThrough:result.content.rows.filter(o=>o.company===r.company&&o.metric===r.metric&&o.value!==null).at(-1)?.periodEnd||null,availableQuarters:r.availableQuarters,definitionBreakQuarters:r.definitionBreakQuarters}));
const output=path.join(root,'outputs');fs.mkdirSync(output,{recursive:true});
function write(name,v){fs.writeFileSync(path.join(output,name+'.json'),bytes(v));}
write('panel',result);
const names={financials:'quarterly-company-financials',cashFlow:'quarterly-cash-flow',capex:'quarterly-capex',depreciation:'quarterly-depreciation',cloud:'quarterly-cloud-segments',backlog:'quarterly-backlog',monetization:'quarterly-monetization',guidance:'quarterly-guidance'};
for(const [family,metrics] of Object.entries(metricFamilies))write(names[family],{schemaVersion:result.content.schemaVersion,resultHash:result.resultHash,rows:result.content.rows.filter(r=>metrics.includes(r.metric))});
write('quarterly-derived-metrics',{schemaVersion:result.content.schemaVersion,rows:result.content.rows.filter(r=>!Object.values(metricFamilies).flat().includes(r.metric))});
write('ai-monetization-events',timeline);write('panel-completeness',result.content.completeness);write('reconciliation',result.content.reconciliation);
write('panel-health',{metrics:health,sourceQualification:read('source-qualification')});
write('accounting-definition-history',{...read('accounting-definition-history'),policies:read('accounting-policy-events')});
write('source-vintage-manifest',{sources:input.sources});write('quarterly-selection-manifest',manifest);write('accounting-note-evidence',input.notes);write('recast-review',input.recasts);
const qualification={schemaVersion:result.content.schemaVersion,resultHash:result.resultHash,eventHash:hash(timeline),companyQualification:result.content.qualification,decision:result.content.qualification.every(c=>c.status==='CORE_PANEL_QUALIFIED')&&input.recasts?.reviewed?'READY FOR DESCRIPTIVE AI CAPEX MONETIZATION MONITOR':'QUARTERLY PANEL STILL REQUIRES SOURCE / ACCOUNTING REPAIR',scope:'Native consolidated descriptive panel and explicitly qualified segment/stock evidence; not AI returns or monitor activation.',remainingLimitations:read('source-qualification').remainingGates};
write('qualification',qualification);
console.log(JSON.stringify({resultHash:result.resultHash,decision:qualification.decision,companies:result.content.qualification.map(({company,status,nativeCashPpeQuarters})=>({company,status,nativeCashPpeQuarters})),eventCount:timeline.events.length,rawVerified:args.includes('--verify-raw')},null,2));
