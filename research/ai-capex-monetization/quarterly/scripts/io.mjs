import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function read(name){return JSON.parse(fs.readFileSync(path.join(root,'inputs',name+'.json'),'utf8'));}
export function load(){return {input:{schemaVersion:'ai-capex-quarterly-input-v0.1',sources:read('source-vintage-manifest').sources,observations:read('accepted-observations').observations,policies:read('accounting-policy-events'),recasts:read('recast-review'),notes:read('accounting-note-evidence')},manifest:read('quarterly-selection-manifest'),definitions:read('accounting-definition-history').definitions,events:read('monetization-events')};}
