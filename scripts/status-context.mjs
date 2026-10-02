import { readFile, mkdir, writeFile, appendFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { statusFolder } from './lib/statusFiles.mjs'
const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
const context={version,codeCommit:process.env.WIL_CODE_COMMIT||commit,snapshotCommit:commit}
await mkdir(statusFolder,{recursive:true});await writeFile(`${statusFolder}/build.json`,JSON.stringify(context)+'\n')
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`app_version=${version}\ncode_commit=${context.codeCommit}\nsnapshot_commit=${commit}\n`)
if(process.env.GITHUB_ENV)await appendFile(process.env.GITHUB_ENV,`WIL_CODE_COMMIT=${context.codeCommit}\nWIL_SNAPSHOT_COMMIT=${commit}\n`)
