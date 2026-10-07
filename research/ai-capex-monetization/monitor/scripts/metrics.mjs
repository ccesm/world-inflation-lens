import {hash,bytes} from '../../scripts/contract.mjs';

// Definitions of leaves, rather than a derived metric's stable ID, govern comparisons.
export function lineage(record, byId, stack = new Set()) {
 if (!record || record.value === null) return [];
 if (!record.observationId || stack.has(record.observationId)) throw Error('BROKEN_OR_CYCLIC_LINEAGE');
 const next = new Set([...stack,record.observationId]);
 if (!record.calculation) return [record];
 return record.calculation.operandIds.flatMap(id => {
  const operand=byId.get(id); if (!operand) throw Error('MISSING_OPERAND:'+id);
  return lineage(operand,byId,next);
 });
}
export function comparisonBasis(record,byId) {
 const leaves=lineage(record,byId);
 return {
  signature:hash({definition:record.definitionVersion,scope:record.scope,unit:record.unit,
   leaves:[...new Set(leaves.map(r=>bytes([r.metric,r.definitionVersion,r.scope,r.unit])))].sort()}),
  status:leaves.some(r=>r.comparabilityStatus==='NOT_COMPARABLE')?'NOT_COMPARABLE':
   leaves.some(r=>r.comparabilityStatus==='LIMITED_COMPARABILITY')?'LIMITED_COMPARABILITY':'COMPARABLE'
 };
}
export function compare(current,prior,expectedPeriod) {
 const empty={priorPeriod:expectedPeriod,priorValue:prior?.value??null,currentValue:current?.value??null,
  delta:null,percentChange:null,deltaUnit:current?.unit==='PERCENT'?'PERCENTAGE_POINTS':current?.unit??null};
 if (!current || !prior || current.value===null || prior.value===null) return {...empty,state:'UNAVAILABLE',reason:'EXACT_PERIOD_OR_DISCLOSURE_MISSING'};
 if (prior.period!==expectedPeriod || current.company!==prior.company || current.metric!==prior.metric || current.frequency!=='QUARTERLY' || prior.frequency!=='QUARTERLY') throw Error('EXACT_COMPARISON_IDENTITY');
 if (current.basis.signature!==prior.basis.signature) return {...empty,state:'DEFINITION_BREAK',reason:'OPERAND_DEFINITION_OR_SCOPE_CHANGED'};
 if (current.basis.status!=='COMPARABLE'||prior.basis.status!=='COMPARABLE'||current.policyAffected||prior.policyAffected||hash(current.policyReferences??[])!==hash(prior.policyReferences??[])) return {...empty,state:'LIMITED_COMPARABILITY',reason:'SOURCE_OR_ACCOUNTING_POLICY_QUALIFICATION'};
 const delta=current.value-prior.value;
 return {...empty,delta,percentChange:current.unit!=='PERCENT'&&prior.value>0?100*delta/prior.value:null,
  state:delta>0?'RISING':delta<0?'FALLING':'STABLE',reason:'EXACT_NUMERICAL_DIRECTION_ONLY'};
}
export function quarterOffset(period,offset) {
 if (!/^\d{4}Q[1-4]$/.test(period)) throw Error('QUARTER');
 const n=Number(period.slice(0,4))*4+Number(period.at(-1))-1+offset;
 return `${Math.floor(n/4)}Q${n%4+1}`;
}
export function ratio(numerator,denominator,metric,byId,{multiple=false,pure=false}={}) {
 if (!numerator||!denominator||numerator.value===null||denominator.value===null) return null;
 if (pure&&denominator.metric!=='depreciationPpe') return null;
 for (const k of ['company','periodStart','periodEnd','scope','unit','restatementBasis']) if(numerator[k]!==denominator[k])return null;
 if (numerator.scope!=='CONSOLIDATED'||numerator.unit!=='USD_MILLIONS'||numerator.precision!=='EXACT'||denominator.precision!=='EXACT'||denominator.value<=0) return null;
 const row={...numerator,metric,observationId:`monitor:${metric}:${hash([numerator.observationId,denominator.observationId])}`,
  value:(multiple?1:100)*numerator.value/denominator.value,unit:multiple?'MULTIPLE':'PERCENT',
  definitionVersion:`${numerator.company}_${metric}_MONITOR_V1`,evidenceClass:'CALCULATED_FROM_DISCLOSED_VALUES',
  nativeLabel:metric,calculation:{operandIds:[numerator.observationId,denominator.observationId],formula:`${multiple?'':'100 * '}numerator / denominator`},
  limitations:[pure?'Cash PP&E / pure PP&E depreciation; flow-to-expense descriptive ratio, not capital stock or AI return.':'Native expense / revenue; broad D&A is never substituted for pure PP&E depreciation.']};
 byId.set(row.observationId,row); return row;
}
