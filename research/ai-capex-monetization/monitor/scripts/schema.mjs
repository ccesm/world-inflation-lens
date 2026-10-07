import fs from 'node:fs';
// Deliberately bounded JSON Schema subset used by the two committed draft contracts.
// Semantic validation separately rebuilds all content from the pinned archive.
export function validateShape(value,schema,where='$'){
 const kind=value===null?'null':Array.isArray(value)?'array':typeof value;
 if(schema.type&&!([schema.type].flat().includes(kind)||kind==='number'&&Number.isInteger(value)&&[schema.type].flat().includes('integer')))throw Error('SCHEMA_TYPE:'+where);
 if(schema.const!==undefined&&value!==schema.const)throw Error('SCHEMA_CONST:'+where);
 if(schema.enum&&!schema.enum.includes(value))throw Error('SCHEMA_ENUM:'+where);
 if(kind==='number'&&!Number.isFinite(value))throw Error('SCHEMA_NONFINITE:'+where);
 if(kind==='string'&&schema.pattern&&!new RegExp(schema.pattern).test(value))throw Error('SCHEMA_PATTERN:'+where);
 if(kind==='array'){
  if(schema.minItems!==undefined&&value.length<schema.minItems||schema.maxItems!==undefined&&value.length>schema.maxItems)throw Error('SCHEMA_LENGTH:'+where);
  if(schema.items)value.forEach((item,i)=>validateShape(item,schema.items,`${where}[${i}]`));
 }
 if(kind==='object'){
  for(const key of schema.required??[])if(!Object.hasOwn(value,key))throw Error('SCHEMA_REQUIRED:'+where+'.'+key);
  for(const [key,item]of Object.entries(value)){
   const field=schema.properties?.[key];
   if(field)validateShape(item,field,where+'.'+key);
   else if(schema.additionalProperties===false)throw Error('SCHEMA_EXTRA:'+where+'.'+key);
  }
 }
 return true;
}
export function validateContract(value,name){return validateShape(value,JSON.parse(fs.readFileSync(new URL(`../schemas/${name}.schema.draft.json`,import.meta.url),'utf8')));}
