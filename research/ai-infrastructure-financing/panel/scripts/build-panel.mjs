import {build,loadInput,summary,writePanel} from './panel.mjs';
const args=process.argv.slice(2),idx=args.indexOf('--as-of'),asOf=idx>=0?args[idx+1]:null;
const input=loadInput(),panel=build(input,{asOf}),result=summary(panel,input);
if(args.includes('--write')){if(!result.valid)throw Error(result.errors.join('\n'));writePanel(panel);}
console.log(JSON.stringify(result,null,2));if(!result.valid)process.exitCode=1;
