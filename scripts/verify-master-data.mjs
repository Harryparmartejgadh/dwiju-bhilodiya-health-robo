import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const specs=[['features','data/features.json',4410],['benefits','data/benefits.json',75867]];
const datasets=new Map();
let failed=false;
for(const [name,path,expected] of specs){
  if(!existsSync(path)){console.error(name+': BLOCKED original dataset missing at '+path);failed=true;continue;}
  const bytes=readFileSync(path);let rows;
  try{rows=JSON.parse(bytes.toString('utf8'))}catch{console.error(name+': INVALID_JSON');failed=true;continue;}
  if(!Array.isArray(rows)){console.error(name+': NOT_ARRAY');failed=true;continue;}
  const ids=rows.map(x=>x?.id);
  const duplicates=ids.length-new Set(ids).size;
  const missing=ids.filter(x=>x===undefined||x===null||x==='').length;
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const pass=rows.length===expected&&duplicates===0&&missing===0;
  console.log(JSON.stringify({name,actual:rows.length,expected,duplicates,missing,sha256,pass}));
  if(!pass)failed=true;
  datasets.set(name,rows);
}
if(datasets.has('features')&&datasets.has('benefits')){
  const features=datasets.get('features'), benefits=datasets.get('benefits');
  const featureIds=new Set(features.map(x=>String(x.id)));
  const missingNames=features.filter(x=>!String(x.name??'').trim()).length;
  const brokenReferences=benefits.filter(x=>!featureIds.has(String(x.featureId))).length;
  const emptyGujarati=benefits.filter(x=>!String(x.gujaratiBenefit??'').trim()).length;
  const coveredFeatureIds=new Set(benefits.map(x=>String(x.featureId)).filter(x=>featureIds.has(x)));
  const uncoveredFeatures=featureIds.size-coveredFeatureIds.size;
  const pass=missingNames===0&&brokenReferences===0&&emptyGujarati===0&&uncoveredFeatures===0;
  console.log(JSON.stringify({name:'cross-file-referential-integrity',missingNames,brokenReferences,emptyGujarati,uncoveredFeatures,pass}));
  if(!pass)failed=true;
}
if(failed)process.exitCode=1;
