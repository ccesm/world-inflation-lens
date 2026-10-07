import { readFileSync } from 'node:fs';
import { normalize, bytes } from './contract.mjs';
const path = process.argv[2] ?? new URL('../fixtures/official-anchors.json', import.meta.url);
// Stdout only. No fetch, implicit writes, production import or scheduled execution.
process.stdout.write(bytes(normalize(JSON.parse(readFileSync(path, 'utf8')))));
