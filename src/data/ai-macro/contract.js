import publicIdentity from './public-identity.json' with {type:'json'}
import {macroCopy} from '../../i18n/aiMacro.js'
// Fixed narrative publication. There is no source-data loader or numerical contract.
export const CHANNELS=['ENERGY','FINANCING','PRODUCTIVITY','INFLATION']
export const INDICATORS=['EIA_COMM_SALES','EIA_COMM_PRICE','HENRY_HUB','CENSUS_DC','PNFIC1','DFII10','NCBDBIQ027S','OPHNFB','ULCNFB','CPIAUCSL','PCEPILFE','SPF10']
export const CLAIMS=['energy-sales','energy-construction','energy-gas','energy-prices','financing-investment','financing-yield','financing-boundary','productivity-output','productivity-cost','inflation-prices','inflation-boundary','inflation-spf']
const sourceURLs={
 EIA_COMM_SALES:'https://www.eia.gov/electricity/data/eia861m/',EIA_COMM_PRICE:'https://www.eia.gov/electricity/data/eia861m/',HENRY_HUB:'https://www.eia.gov/dnav/ng/hist/rngwhhdm.htm',
 CENSUS_DC:'https://www.census.gov/construction/c30/data/index.html',PNFIC1:'https://www.bea.gov/data/gdp/gross-domestic-product',DFII10:'https://www.federalreserve.gov/releases/h15/',NCBDBIQ027S:'https://www.federalreserve.gov/releases/z1/',
 OPHNFB:'https://www.bls.gov/productivity/',ULCNFB:'https://www.bls.gov/productivity/',CPIAUCSL:'https://www.bls.gov/cpi/',PCEPILFE:'https://www.bea.gov/data/personal-consumption-expenditures-price-index-excluding-food-and-energy',SPF10:'https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/inflation-forecasts',
}
const catalogIds=['PNFIC1','DFII10','NCBDBIQ027S','OPHNFB','ULCNFB','CPIAUCSL','PCEPILFE']
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join('|')===[...keys].sort().join('|')
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)
const short=x=>typeof x==='string'&&x.length>0&&x.length<=320&&!/[<>\u0000-\u001f]/.test(x)
const refs=(a,ids)=>Array.isArray(a)&&a.length>0&&a.length<=ids.length&&new Set(a).size===a.length&&a.every(id=>ids.includes(id))
const forbidden=new Set(['observations','series','historyArtifact','lastRecord','lastNonmissing','value','values','nativeChange','yearChange','rawRowCount','missingRowCount','payload','download','historyURL'])
function narrativeOnly(x){
 if(typeof x==='number'||typeof x==='bigint'||x===null)return false
 if(Array.isArray(x))return x.length<=INDICATORS.length&&x.every(narrativeOnly)
 if(x&&typeof x==='object')return Object.entries(x).every(([k,v])=>!forbidden.has(k)&&narrativeOnly(v))
 return typeof x==='string'||typeof x==='boolean'
}
export const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x
export const canonicalText=x=>JSON.stringify(canonical(x))+'\n'
export async function digest(value,cryptoImpl=globalThis.crypto){
 if(!cryptoImpl?.subtle)throw Error('PUBLICATION_CRYPTO_UNAVAILABLE')
 return [...new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',new TextEncoder().encode(canonicalText(value))))].map(x=>x.toString(16).padStart(2,'0')).join('')
}
export function validPublication(p){try{
 if(!narrativeOnly(p)||!exact(p,['schemaVersion','publicationId','publicationDate','researchAsOf','copyVersion','numericFactPolicy','research','channels','claims','sources']))return false
 if(p.schemaVersion!=='AI_MACRO_RESEARCH_PUBLICATION_1'||p.publicationId!==publicIdentity.publicationId||p.publicationDate!=='2026-10-17'||p.researchAsOf!=='2026-10-09'||p.copyVersion!=='D33_COPY_1'||p.numericFactPolicy!=='NO_ECONOMIC_FIGURES_IN_THIS_EDITION')return false
 if(!exact(p.research,['commit','c2Sha256','inputIdentityHash','outputSetHash'])||p.research.commit!=='362929adfae20b31d8044e5c9a10ae020f0c9eaf'||p.research.c2Sha256!=='ac85a5fe4455112f95f83ae2a650a637578480cf8ec1feba8cd52db15b642ec7'||p.research.inputIdentityHash!=='480e10d32d5d8317589aa279edafe4137b4d1bb8e384093ed0a1a896dcb5018d'||p.research.outputSetHash!=='34eac463e54188e9da70e10cd7ae6758bec5ec2f365b9289b8f396f5cf96a788')return false
 if(!Array.isArray(p.sources)||!same(p.sources.map(s=>s.id),INDICATORS))return false
 for(const s of p.sources){
  const spf=s.id==='SPF10',keys=['id','providerId','datasetIdentifier','officialURL','catalogURL','publicationMode',...(spf?[]:['retainedSourceHash'])]
  if(!exact(s,keys)||!macroCopy.providers[s.providerId]||!short(s.datasetIdentifier)||s.officialURL!==sourceURLs[s.id]||s.catalogURL!==(catalogIds.includes(s.id)?`https://fred.stlouisfed.org/series/${s.id}`:'')||s.publicationMode!==(spf?'EXTERNAL_SOURCE_ONLY':'NARRATIVE_PROVENANCE_ONLY')||(!spf&&!hash(s.retainedSourceHash)))return false
 }
 if(!Array.isArray(p.claims)||!same(p.claims.map(c=>c.id),CLAIMS))return false
 for(const c of p.claims)if(!exact(c,['id','kind','sourceIds','researchLocator'])||!['E1','E2'].includes(c.kind)||!refs(c.sourceIds,INDICATORS)||!short(c.researchLocator)||!macroCopy.claims[c.id]||c.sourceIds.includes('SPF10')&&c.kind!=='E1')return false
 if(!Array.isArray(p.channels)||!same(p.channels.map(c=>c.id),CHANNELS))return false
 const used=[]
 for(const c of p.channels){
  if(!exact(c,['id','sourceIds','observationRefs','counterEvidenceRefs'])||!refs(c.sourceIds,INDICATORS)||!refs(c.observationRefs,CLAIMS)||!refs(c.counterEvidenceRefs,CLAIMS))return false
  for(const id of [...c.observationRefs,...c.counterEvidenceRefs]){used.push(id);if(p.claims.find(x=>x.id===id).sourceIds.some(s=>!c.sourceIds.includes(s)))return false}
 }
 return new Set(used).size===CLAIMS.length&&new Set(p.channels.flatMap(c=>c.sourceIds)).size===INDICATORS.length
}catch{return false}}
export async function verifyPublication(p,cryptoImpl=globalThis.crypto){
 if(!validPublication(p))throw Error('INVALID_RESEARCH_PUBLICATION')
 if(await digest(p,cryptoImpl)!==publicIdentity.publicationSha256)throw Error('PUBLICATION_IDENTITY_MISMATCH')
 if(await digest(macroCopy,cryptoImpl)!==publicIdentity.copySha256)throw Error('PUBLICATION_COPY_IDENTITY_MISMATCH')
 return p
}
export const publicationIdentity=publicIdentity
