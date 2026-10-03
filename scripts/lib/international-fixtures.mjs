import {readFile,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {gunzipSync} from 'node:zlib'
export async function internationalFixtures(root,input){
 for(const file of ['wil-cofer.csv','wil-tic.txt','wil-bis-total.csv','wil-bis-loans.csv','wil-bis-securities.csv']) await writeFile(resolve(input,file),gunzipSync(await readFile(resolve(root,'scripts/fixtures/international-dollar',file+'.gz'))))
 await writeFile(resolve(input,'wil-tic-headers.json'),await readFile(resolve(root,'scripts/fixtures/international-dollar/wil-tic-headers.json')))
}
