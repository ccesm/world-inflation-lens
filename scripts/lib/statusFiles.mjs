import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { checkReport } from '../../src/utils/systemStatus.js'
export const statusFolder=resolve(import.meta.dirname,'../../.refresh')
export async function writeCheckReport(value) {
  const path=resolve(process.env.WIL_CHECK_REPORT || `${statusFolder}/check.json`)
  await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(checkReport(value),null,2)+'\n')
}
export async function readCheckReport() { try{return checkReport(JSON.parse(await readFile(resolve(process.env.WIL_CHECK_REPORT||`${statusFolder}/check.json`),'utf8')))}catch{return null} }
export async function notificationOutput(result) {
  if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`notification_result=${result}\n`)
  const path=resolve(`${statusFolder}/notification.json`);await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify({result})+'\n')
}
