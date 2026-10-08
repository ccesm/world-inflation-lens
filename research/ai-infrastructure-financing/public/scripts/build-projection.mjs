import {buildProjection,writeProjection,bytes} from './project.mjs';
const args=process.argv.slice(2);
if(args.some(a=>!['--write','--payload'].includes(a)))throw Error('Only --write and --payload are supported; source clock/ref and research output path are frozen');
const result=buildProjection();
if(args.includes('--write'))writeProjection(result);
process.stdout.write(args.includes('--payload')?bytes(result.projection):JSON.stringify({...result.identity,summary:result.projection.summary,projects:result.projectAudit,sourceCount:result.projection.sources.length},null,2)+'\n');
