import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {prepareProductivity,compareProductivity} from './lib/productivity.mjs'
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1]
if(!args.includes('--input-dir')||!args.includes('--output-dir'))throw Error('Use --input-dir and --output-dir to stage a reviewed import')
const checkedAt=new Date().toISOString(),bundle=await prepareProductivity({input:arg('--input-dir'),checkedAt}),out=resolve(arg('--output-dir'))
let prior;try{prior=JSON.parse(await readFile('data/productivity/series.json','utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
await mkdir(out,{recursive:true});await writeFile(resolve(out,'series.json'),JSON.stringify(bundle)+'\n')
await writeFile(resolve(out,'import-report.json'),JSON.stringify({checkedAt,baseline:!prior,changes:prior?compareProductivity(prior,bundle):[],note:'First import establishes a baseline; no historical revision claim without an earlier site vintage.'},null,2)+'\n')
console.log(bundle.series.map(s=>({id:s.id,coverage:s.coverage,latest:s.observations.findLast(p=>p.value!==null),sourceUpdatedAt:s.sourceUpdatedAt})))
