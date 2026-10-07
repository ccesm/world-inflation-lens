export const healthStates=['CURRENT','PARTIAL','NO_NEW_DISCLOSURE','DEFINITION_BREAK','LIMITED_COMPARABILITY','FAILED_WITH_LAST_VALID','ACCESS_BLOCKED','UNAVAILABLE'];
// Source/evidence status, never a company quality grade. Only qualified last-valid evidence permits fallback.
export function evidenceHealth({available=0,expected=1,error=false,qualifiedLastValid=false,blocked=false,definitionBreak=false,limited=false,noNewDisclosure=false}={}){
 if(!Number.isInteger(available)||!Number.isInteger(expected)||available<0||expected<1||available>expected)throw Error('HEALTH_COVERAGE');
 if(error)return qualifiedLastValid?'FAILED_WITH_LAST_VALID':blocked?'ACCESS_BLOCKED':'UNAVAILABLE';
 if(blocked)return 'ACCESS_BLOCKED';
 if(available===0)return 'UNAVAILABLE';
 if(definitionBreak)return 'DEFINITION_BREAK';
 if(limited)return 'LIMITED_COMPARABILITY';
 if(available<expected)return 'PARTIAL';
 return noNewDisclosure?'NO_NEW_DISCLOSURE':'CURRENT';
}
