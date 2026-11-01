import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const files=[['features','data/features.json',4410],['benefits','data/benefits.json',75867]];
let failed=false;
for(const [name,path,expected] of files){
 if(!existsSync(path)){console.error(name+': BLOCKED original dataset missing at '+path);failed=true;continue;}
 const bytes=readFileSync(path);let rows;
 try{rows=JSON.parse(bytes.toString('utf8'));}catch{console.error(name+': INVALID_JSON');failed=true;continue;}
 if(!Array.isArray(rows)){console.error(name+': NOT_ARRAY');failed=true;continue;}
 const ids=rows.map(x=>x?.id);
 const duplicates=ids.length-new Set(ids).size;
 const missing=ids.filter(x=>x===undefined||x===null||x==='').length;
 const sha256=createHash('sha256').update(bytes).digest('hex');
 console.log(JSON.stringify({name,actual:rows.length,expected,duplicates,missing,sha256,pass:rows.length===expected&&duplicates===0&&missing===0}));
 if(rows.length!==expected||duplicates||missing)failed=true;
}
if(failed)process.exitCode=1;
