import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseGpr, parseGscpi, parseFao, parseSipri, validateExternal, compareExternal, replaceBundle, csvRows } from './lib/external.mjs'
import { transmissionCsv, changeAt, direction, assessment, windowPoints } from '../src/utils/transmission.js'
const root = resolve(import.meta.dirname, '..')
const datasets = await Promise.all(['gpr','gscpi','fao-food','sipri-military'].map(async id => validateExternal(JSON.parse(await readFile(resolve(root, `data/external/${id}.json`), 'utf8')))))
const [gpr,gscpi,fao,sipri] = datasets
assert.deepEqual(parseGpr({ header:['month','GPR','GPRT','GPRA'], labels:{ GPR:'1985:2019=100',GPRT:'1985:2019=100',GPRA:'1985:2019=100' },rows:[['2026-08',1,2,3]] }).map(s=>s.observations[0].value),[1,2,3])
assert.throws(()=>parseGpr({header:['bad']}))
const supply = parseGscpi('Date,Aug-26,Sep-26\n2026-06-01,-1,-0.5\n2026-07-01,0.79,0.94\n2026-08-01,#N/A,1.06')
assert.equal(supply.series[0].observations[0].value,-.5); assert.equal(supply.sourceVintageComparison.revised,2)
assert.ok(gscpi.series[0].observations.some(p=>p.value<0));assert.ok(gscpi.series[0].observations.some(p=>p.value>0))
assert.deepEqual(parseFao('FAO Food Price Index\n2014-2016=100\nDate,Food Price Index,Meat,Dairy,Cereals,Oils,Sugar\n2026-08,133.3,127.9,119.2,116.3,196.9,106.4').map(s=>s.observations[0].value),[133.3,127.9,119.2,116.3,196.9,106.4])
assert.throws(()=>parseFao('FAO Food Price Index\n2000=100'))
const rawSipri = {usFootnote:'All figures for the USA are for financial year',sheets:Object.fromEntries(['Share of GDP','Share of Govt. spending','Constant (2024) US$','Regional totals'].map((s,i)=>[s,{row:i===3?'World':'United States of America',title:'SIPRI 2026',notes:['constant 2024'],cells:[{date:'2025',value:i<2?.03:100,sourceFormat:i<2?'0.0%':'0',sourceColor:null}]}]))}
assert.deepEqual(parseSipri(rawSipri).map(s=>s.observations[0].value),[3,3,100,100]);rawSipri.sheets['Share of GDP'].cells[0].sourceFormat='0';assert.throws(()=>parseSipri(rawSipri),/fractions/)
assert.equal(sipri.series[3].observations.find(p=>p.date==='1991').value,null)
assert.equal(sipri.series[0].periodBasis,'us_fiscal_year_ending_september'); assert.equal(sipri.series[3].units,'billion_2024_usd')
for(const mutation of ['duplicate','negative','units','truncated']) {const broken=structuredClone(gpr);if(mutation==='duplicate')broken.series[0].observations[1].date='1985-01';if(mutation==='negative')broken.series[0].observations[0].value=-1;if(mutation==='units')broken.series[0].units='percent';if(mutation==='truncated')broken.series[0].observations=broken.series[0].observations.slice(0,20);assert.throws(()=>validateExternal(broken))}
const revised=structuredClone(gpr);revised.series[0].observations.at(-1).value+=1;assert.equal(compareExternal(gpr,revised)[0].revised,1)
revised.series[0].observations.shift();assert.throws(()=>compareExternal(gpr,revised))
const s={frequency:'monthly',points:[{date:'2026-06',value:100},{date:'2026-07',value:null},{date:'2026-08',value:110}]}
assert.equal(changeAt(s,'2026-08'),null);assert.equal(direction(s).label,'unavailable');assert.equal(windowPoints(s,'2026-05','2026-08')[0].value,null)
assert.equal(changeAt({frequency:'annual',points:[{date:'2020',value:100},{date:'2025',value:150}]},'2025',5,true),50)
const complete={frequency:'monthly',points:[{date:'2026-07',value:100},{date:'2026-08',value:110}]}, bundle=Object.fromEntries(['GPR','GSCPI','oil','FAO_FOOD'].map(id=>[id,structuredClone(complete)]))
assert.equal(assessment(bundle,new Date('2026-09-16')).code,'broad');assert.equal(assessment(bundle,new Date('2027-01-01')).code,'insufficient');bundle.GSCPI.points[1].value=90;assert.equal(assessment(bundle,new Date('2026-09-16')).code,'prices');bundle.oil.points[1].value=90;assert.equal(assessment(bundle,new Date('2026-09-16')).code,'mixed');bundle.GPR.points[0].value=null;assert.equal(assessment(bundle,new Date('2026-09-16')).code,'insufficient')
for (const fail of ['write','build']) { const store={a:'old A',b:'old B'};let failed=false;await assert.rejects(replaceBundle({a:'new A',b:'new B'},{read:async p=>store[p],write:async(p,v)=>{if(fail==='write'&&p==='b'&&!failed){failed=true;throw Error('write failed')}store[p]=v},check:async()=>{if(fail==='build')throw Error('build failed')}}));assert.deepEqual(store,{a:'old A',b:'old B'}) }
assert.deepEqual(csvRows('a,"b,c"\n"d""e",f'),[['a','b,c'],['d"e','f']])
console.log('PASS: official parsers, identities, annual units, missing periods, revisions, common-month rules, staleness, full rollback after write/build failure')

const exported = csvRows(transmissionCsv({...sipri.series[3],points:sipri.series[3].observations,frequency:'annual',metadata:sipri.metadata}).replace(/^\ufeff/,''))
assert.equal(exported.find(r=>r[1]==='1991')[2],'');assert.equal(exported[1][3],'billion_2024_usd');assert.equal(exported[1][5],'calendar_year');assert.ok(exported[1].includes(sipri.metadata.attribution))
console.log('PASS: CSV preserves missing cells, annual basis, original units and attribution')
