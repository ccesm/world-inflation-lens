import { fixture } from './helpers.mjs'
import { evaluate } from '../engine/engine.mjs'
import { serialize } from '../engine/core.mjs'
const f=fixture();process.stdout.write(serialize(evaluate(f.archive,f.env,f.request)))
