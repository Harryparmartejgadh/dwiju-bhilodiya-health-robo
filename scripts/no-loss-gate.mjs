import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
const run=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const base=process.env.NO_LOSS_BASE || 'origin/main';
const changed=run('diff','--name-status','--find-renames',base,'HEAD').split('\n').filter(Boolean);
const errors=[];
const report={base,head:run('rev-parse','HEAD'),changedFiles:[],deleted:[],renamed:[],baselinePaths:0,currentPaths:0,routeRegressions:[],featureRegressions:[],androidIdentity:null,regression:'NOT_RUN'};
const baseline=run('ls-tree','-r','--name-only',base).split('\n').filter(Boolean);
const current=run('ls-tree','-r','--name-only','HEAD').split('\n').filter(Boolean);
report.baselinePaths=baseline.length;report.currentPaths=current.length;
const scope=process.env.NO_LOSS_SCOPE || '';
const important=(p)=>p.startsWith(scope) && !p.startsWith('.github/') && !p.startsWith('tests/');
for(const line of changed){
 const [status,path,newPath]=line.split('\t');
 report.changedFiles.push({status,path,newPath});
 if(status.startsWith('D')&&important(path)){report.deleted.push(path);errors.push('Deleted baseline source: '+path);}
 if(status.startsWith('R')&&important(path)){report.renamed.push({from:path,to:newPath});errors.push('Renamed baseline source: '+path);}
}
const baselineSet=new Set(baseline);
for(const p of baseline){
 if(important(p)&&!current.includes(p)){errors.push('Baseline path missing: '+p);}
}
function contentAt(ref,path){try{return run('show',ref+':'+path)}catch{return ''}}
function inventory(text,patterns){const found=new Set();for(const pattern of patterns){for(const m of text.matchAll(pattern)){found.add(m[1]);}}return found;}
const routePatterns=[/app\.(?:get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)/g,/router\.(?:get|post|put|patch|delete|use)\s*\(\s*['"`]([^'"`]+)/g,/path\s*=\s*['"`]([^'"`]+)/g];
const featurePatterns=[/<FeatureCard\b[^>]*\btitle\s*=\s*['"]([^'"]+)/g,/<Route\b[^>]*\bpath\s*=\s*['"]([^'"]+)/g];
for(const p of baseline.filter(x=>/\.(js|jsx|ts|tsx)$/.test(x)&&important(x))){
 const before=contentAt(base,p);
 const after=existsSync(p)?readFileSync(p,'utf8'):'';
 for(const [label,patterns] of [['route',routePatterns],['feature',featurePatterns]]){
  const b=inventory(before,patterns),a=inventory(after,patterns);
  for(const item of b)if(!a.has(item)){
   const entry={path:p,value:item};
   if(label==='route')report.routeRegressions.push(entry);else report.featureRegressions.push(entry);
   errors.push(label+' inventory lost: '+p+' :: '+item);
  }
 }
}
if(existsSync('app/build.gradle')&&baselineSet.has('app/build.gradle')){
 const old=contentAt(base,'app/build.gradle'),now=readFileSync('app/build.gradle','utf8');
 const match=(s,k)=>s.match(new RegExp('\\b'+k+'\\s+[\\x27\\x22]([^\\x27\\x22]+)'))?.[1]||null;
 const oldId=match(old,'applicationId'),newId=match(now,'applicationId');
 report.androidIdentity={oldId,newId,preserved:oldId===newId};
 if(oldId!==newId)errors.push('Android applicationId changed without approval');
}
report.regression=errors.length?'FAIL':'PASS';
console.log(JSON.stringify({...report,errors},null,2));
if(errors.length)process.exitCode=1;
