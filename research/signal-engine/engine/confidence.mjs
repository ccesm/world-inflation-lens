// Ordered noncompensating evidence quality; never an outcome probability.
export function confidenceFromReasons(reasons,{eligible=true}={}) {
 if(!eligible)return 'UNASSESSED'
 if(reasons.includes('REVISION_SENSITIVE'))return 'LOW'
 return reasons.length?'MEDIUM':'HIGH'
}
