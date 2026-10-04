import assert from 'node:assert/strict'
import {readFile,mkdtemp,rm,writeFile} from 'node:fs/promises'
import {gunzipSync} from 'node:zlib'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {execFileSync} from 'node:child_process'
import {parseCofer,readCoferCsv,validateCofer,compareCofer} from './lib/international-cofer.mjs'
import {parseTic,validateTic,compareTic} from './lib/international-tic.mjs'
import {parseBisCsv,validateBisSnapshot,reviewBisRevisions} from './lib/international-bis.mjs'
import {internationalFiles,internationalSummary,prepareInternational,compareInternational} from './lib/international.mjs'
import {internationalFixtures} from './lib/international-fixtures.mjs'
import {seriesMetadata} from '../src/data/seriesContract.js'
import {seriesRegistry} from '../src/data/seriesRegistry.js'
import {freshness} from '../src/utils/freshness.js'
import {internationalCsv} from '../src/utils/internationalDollar.js'
import {internationalCopy} from '../src/i18n/internationalDollar.js'
import {routes,primaryRoutes} from '../src/utils/routing.js'
const root=resolve(import.meta.dirname,'..'),read=async p=>JSON.parse(await readFile(join(root,p),'utf8'))
const bundles=Object.fromEntries(await Promise.all(Object.entries(internationalFiles).map(async([id,file])=>[id,await read(`data/international-dollar/${file}.json`)])))
validateCofer(bundles.cofer);validateTic(bundles.tic);validateBisSnapshot(bundles.bis)
assert.deepEqual(await read('data/international-dollar/summary.json'),internationalSummary(bundles),'Homepage summaries must be mechanically generated from the exact full snapshots')
const compressed=async file=>gunzipSync(await readFile(join(root,'scripts/fixtures/international-dollar',file+'.gz'))).toString()
const [cofer,tic,bis]=await Promise.all(['wil-cofer.csv','wil-tic.txt','wil-bis-total.csv'].map(compressed))
const at='2026-10-02T23:59:00Z'
const parsedCofer=parseCofer(cofer,at)
assert.equal(parsedCofer.series.find(s=>s.id==='COFER_CNY').observations[0].sourcePeriod,'2016-Q4')
assert.equal(parsedCofer.series.find(s=>s.id==='COFER_AUD').observations[0].sourcePeriod,'2012-Q4')
assert.equal(parsedCofer.series[0].observations.at(-1).date,'2026-04')
assert.equal(parsedCofer.series[0].observations.at(-1).value,56.704761505127)
// Write independently modified SDMX rows with correct quoting for adversarial adapter input.
const rows=readCoferCsv(cofer),headers=Object.keys(rows[0]);
const csv=rows=>[headers,...rows.map(r=>headers.map(h=>r[h]))].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')
for(const [field,value] of [['FREQUENCY','M'],['SCALE','6'],['UNIT','USD'],['COUNTRY','USA'],['TYPE_OF_TRANSFORMATION','IX'],['METHODOLOGY_NOTES','legacy allocated reserves'],['TIME_PERIOD','2026-Q5']]){const r=structuredClone(rows);r[0][field]=value;assert.throws(()=>parseCofer(csv(r),at),undefined,`Reject changed COFER ${field}`)}
assert.throws(()=>parseCofer(csv([...rows,rows[0]]),at),/duplicate|unordered/)
assert.throws(()=>parseCofer(csv(rows.filter(r=>r.FXR_CURRENCY!=='CI_JPY')),at),/missing category/)
assert.throws(()=>parseCofer(csv(rows.slice(1)),at),/coverage|begin/)
const missing=structuredClone(rows);missing.find(r=>r.FXR_CURRENCY==='CI_USD'&&r.TIME_PERIOD==='2000-Q2').OBS_VALUE='';assert.equal(parseCofer(csv(missing),at).series[0].observations[1].value,null)
const revised=structuredClone(parsedCofer);revised.series[0].observations[0].value-=.1;revised.series.find(s=>s.id==='COFER_EUR').observations[0].value+=.1;assert.equal(compareCofer(parsedCofer,revised)[0].revised,1)
const wrongDenom=structuredClone(parsedCofer);wrongDenom.metadata.denominator='All central bank assets';assert.throws(()=>validateCofer(wrongDenom),/denominator/)
const parsedTic=parseTic(tic,{checkedAt:at});assert.equal(parsedTic.series[0].observations.at(-1).value,9248126)
assert.equal(parsedTic.metadata.sourceUpdatedAt,null,'Missing source file-update time is not replaced by retrieval')
for(const [a,b] of [['Millions of dollars','Billions of dollars'],['for_treas_pos','for_treas_flow'],['country_code','owner_code'],['Japan\t42609','Japan\t00000']])assert.throws(()=>parseTic(tic.replace(a,b),{checkedAt:at}))
const ticLines=tic.split(/\r?\n/),index=ticLines.findIndex(line=>line.startsWith('Japan\t42609'))
assert.ok(index>0);const duplicate=[...ticLines];duplicate.splice(index,0,ticLines[index]);assert.throws(()=>parseTic(duplicate.join('\n'),{checkedAt:at}),/Duplicate/)
const noMonth=[...ticLines];noMonth.splice(index+1,1);assert.throws(()=>parseTic(noMonth.join('\n'),{checkedAt:at}),/month|coverage/)
const unknown=[...ticLines],cells=unknown[index+1].split('\t');cells[3]='n.a.';unknown[index+1]=cells.join('\t');assert.ok(parseTic(unknown.join('\n'),{checkedAt:at}).series[1].observations.some(p=>p.value===null))
const revisedTic=structuredClone(parsedTic);revisedTic.series[1].observations[1].value+=1;assert.equal(compareTic(parsedTic,revisedTic)[1].revised,1)
const regressedTic=structuredClone(parsedTic);for(const s of regressedTic.series)s.observations.pop();regressedTic.metadata.coverage.end=regressedTic.series[0].observations.at(-1).date;assert.throws(()=>compareTic(parsedTic,regressedTic),/latest observation regressed/)
const parsedBis=parseBisCsv(bis,'BIS_USD_TOTAL');assert.equal(parsedBis.observations.at(-1).value,14747653.746);assert.equal(parsedBis.observations.at(-1).date,'2026-01')
for(const [a,b] of [['Q,USD,3P,N,A,I,B,USD','Q,EUR,3P,N,A,I,B,USD'],['Q,USD,3P,N,A,I,B,USD','Q,USD,US,N,A,I,B,USD'],['Q,USD,3P,N,A,I,B,USD','Q,USD,3P,A,A,I,B,USD'],[',6,0,',',3,0,'],['2000-Q1','2000-Q5']])assert.throws(()=>parseBisCsv(bis.replace(a,b),'BIS_USD_TOTAL'))
const bisRows=bis.trim().split('\n');assert.throws(()=>parseBisCsv([...bisRows,bisRows[1]].join('\n'),'BIS_USD_TOTAL'),/duplicate|unordered/)
assert.throws(()=>parseBisCsv([bisRows[0],...bisRows.slice(2)].join('\n'),'BIS_USD_TOTAL'),/coverage|history start/)
const badComponents=structuredClone(bundles.bis);badComponents.series[1].observations[1].value+=1;assert.throws(()=>validateBisSnapshot(badComponents),/component mismatch/)
const revision=structuredClone(bundles.bis);revision.series[0].observations[0].value*=1.06;assert.equal(reviewBisRevisions(bundles.bis,revision).requiresReview,true)
assert.ok(compareInternational(bundles,bundles).every(c=>c.total===0))
const flagRevision=structuredClone(bundles);flagRevision.bis.series[0].observations[1].sourceFlag='E';assert.equal(compareInternational(bundles,flagRevision).find(s=>s.id==='BIS_USD_TOTAL').revised,1)
for(const d of Object.values(bundles))for(const s of d.series){const source={...d.metadata,...s},m=seriesMetadata(source);assert.equal(m.automationType,'AUTOMATIC');assert.equal(m.observationDate.precision,s.frequency==='quarterly'?'quarter':'month');assert.ok(m.title.en&&m.title.zh);assert.equal(m.freshnessPolicy.allowUnknownSourceUpdate,true);assert.notEqual(freshness(source,{now:new Date(at)}).state,'UNKNOWN');assert.equal(freshness(source,{now:new Date('2030-01-01')}).state,'STALE');assert.equal(freshness(source,{now:new Date(at),check:{completedAt:at,changed:false}}).state,'CHECKED_NO_NEW_RELEASE');assert.equal(freshness(source,{now:new Date(at),refreshResult:'FAILED'}).state,'REFRESH_FAILED');assert.equal(freshness(source,{now:new Date(at),probe:{latestAvailableObservationDate:'2027-01'}}).state,'SOURCE_UPDATED_NOT_YET_CAPTURED');const exported=internationalCsv(source,s.observations);assert.ok(exported.includes('"denominator"'));assert.ok(exported.includes(s.denominator));assert.ok(exported.includes(s.observations[0].sourcePeriod||s.observations[0].date))}
assert.equal(freshness({...bundles.bis.metadata,...bundles.bis.series[0]},{now:new Date(at)}).state,'CURRENT')
assert.deepEqual(primaryRoutes,['home','dollar','fiscal','history','scenarios','research']);assert.ok(routes.includes('research/international-dollar'));assert.equal(routes.length,23);assert.ok(routes.includes('research/signal-engine'))
assert.deepEqual(Object.keys(internationalCopy.en).sort(),Object.keys(internationalCopy.zh).sort())
// Existing registry entries must retain identical meanings, not merely pass new-policy tests.
const old=execFileSync('git',['show','494ae75:src/data/seriesRegistry.js'],{cwd:root,encoding:'utf8'});const oldRegistry=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).seriesRegistry
for(const [id,value] of Object.entries(oldRegistry))assert.deepEqual(seriesRegistry[id],value,`Protected registry meaning changed: ${id}`)
const temp=await mkdtemp(join(tmpdir(),'wil-international-fixture-'));try{await internationalFixtures(root,temp);const prepared=await prepareInternational({input:temp,checkedAt:at});assert.equal(prepared.bis.series.length,3);assert.ok(compareInternational(bundles,prepared).every(c=>c.total===0))}finally{await rm(temp,{recursive:true,force:true})}
console.log('PASS: official COFER/TIC/BIS schemas, dimensions, denominator, periods, missingness, revisions, source-aware freshness, exact summary/CSV, bilingual route and protected registry meanings')
