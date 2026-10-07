import {validateContract} from './schema.mjs';
import {bytes,hash} from '../../scripts/contract.mjs';
import {researchSummaries,validateMonitor} from './monitor.mjs';
export function projectPublic(monitor){
 const c=monitor.content;
 return {schemaVersion:'ai-capex-public-draft-v0.1',publicationStatus:'RESEARCH_ONLY_NOT_PUBLISHED',
  asOf:c.disclosureThrough,asOfBasis:'LATEST_ACCEPTED_DISCLOSURE_DATE_NOT_HISTORICAL_AVAILABILITY',dataThrough:c.dataThrough,mode:c.asOfMode,ruleVersion:c.ruleVersion,
  metricCatalog:c.metricCatalog.map(m=>({id:m.id,family:m.family,label:m.label})),
  inputSnapshotHash:c.inputHash,monitorHash:monitor.resultHash,configHash:c.configHash,
  companies:c.latest.map(company=>({company:company.company,latestEconomicQuarter:company.latestEconomicQuarter,
   latestFinancialFiling:company.latestFinancialFiling.map(s=>({sourceId:s.sourceId,sourceUrl:s.sourceUrl,publicationDate:s.publicationDate,sourceHash:s.sha256})),
   metrics:Object.values(company.metrics).map(r=>({company:r.company,metric:r.metric,value:r.value,unit:r.unit??null,
    period:r.period,frequency:r.frequency??'QUARTERLY',nativeLabel:r.nativeLabel??null,scope:r.scope??null,
    evidenceClass:r.evidenceClass??'UNAVAILABLE',definitionVersion:r.definitionVersion??null,
    comparability:r.policyAffected?'LIMITED_COMPARABILITY':r.basis?.status??'UNAVAILABLE',policyAffected:r.policyAffected??false,
    sourceId:r.sourceId??null,sourceUrl:r.sourceUrl??null,
    lineageReference:r.observationId??null,yoy:r.comparisons?.yoy??null,
    limitations:r.limitations??[r.reason],
    sources:r.provenance?.map(s=>({sourceId:s.sourceId,sourceUrl:s.sourceUrl,publisher:s.publisher,sourceHash:s.sha256,publicationDate:s.publicationDate,retrievedAt:s.retrievedAt}))??[]})),
   eventReferences:[company.latestMonetizationDisclosure,company.latestDirectAiDisclosure,company.latestGuidance,company.latestBacklogObservation,company.latestCapacity].filter(Boolean).map(e=>e.eventId).filter((id,i,a)=>a.indexOf(id)===i),
   limitations:company.accountingLimitations})),
  events:c.events.map(e=>({eventId:e.eventId,company:e.company,eventDate:e.date,referencePeriod:e.observationPeriod,referencePeriodBasis:e.observationPeriodBasis,
   reportingQuarter:e.reportingQuarter,eventType:e.kind,evidenceClass:e.evidenceClass,sourceQualificationLevel:e.sourceQualificationLevel,
   evidenceLevel:e.monetizationEvidenceLevel,scope:e.scope,periodType:e.periodType,frequency:e.frequency,nativeValue:e.nativeValue,unit:e.unit,precision:e.precision,
   rangeLower:e.rangeLower??null,rangeUpper:e.rangeUpper??null,guidanceHorizon:e.guidanceHorizon??null,definitionVersion:e.definitionVersion??null,
   recognizedRevenue:e.recognizedRevenue,sourceId:e.sourceId,sourceUrl:e.sourceUrl,sourceHash:e.sourceHash,
   statement:e.nativeWordingSummary,limitations:e.limitations,qualificationClarification:e.qualificationClarification})),
  health:c.health,summaries:researchSummaries(monitor),guardrail:c.guardrail};
}
export function publicArtifact(monitor){const content=projectPublic(monitor);const artifact={content,resultHash:hash(content)};validateContract(artifact,'public-snapshot');return artifact;}
export function validatePublic(actual,monitor,data){
 validateMonitor(monitor,data);
 if(bytes(actual)!==bytes(publicArtifact(monitor)))throw Error('PUBLIC_PINNED_SEMANTICS');
 if(/\/Users\/|\/private\/|file:\/\/|cachePath|accessToken|password/i.test(bytes(actual)))throw Error('PUBLIC_PRIVATE_FIELD');
 return true;
}
