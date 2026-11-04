import {mkdir,copyFile,writeFile,readdir,readFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const publicFiles=['index.html','site.css','site.mjs','assets','downloads','favicon.svg','deliver-workbench'];
const directoryFiles={
 assets:[...['with','without'].flatMap(arm=>Array.from({length:8},(_,i)=>`${arm}-${i+1}.jpg`)),...['input','questions','working','done'].map(stage=>`workbench-${stage}.png`)],
 downloads:['with-skill.pptx','without-skill.pptx','comparison.md','protocol.md','blind-review.md','token-usage.json']
};
const skillDocs=['SKILL.md','INSTALL.md','references/setup.md','references/quality.md'];
const runtimeFiles=['LICENSE','bridge/core.mjs','bridge/server.mjs','bridge/actions.mjs','bridge/cli.mjs','bridge/local-service.mjs','bridge/window.mjs','bridge/ui/index.html','bridge/ui/ui.css','bridge/ui/ui.mjs','web/core.mjs','web/attachments.mjs','web/document-parser.mjs','scripts/verify-install.mjs','scripts/verify-tarball.mjs'];
const repo=new URL('../',import.meta.url);

async function publishSkill(target){
 await mkdir(target,{recursive:true});
 const allowed=[...skillDocs,'CONNECTOR.md','references'];
 const existing=(await readdir(target,{recursive:true})).map(file=>file.replaceAll('\\','/'));
 if(existing.some(file=>!allowed.includes(file)))throw new Error('Skill 发布目录含非白名单文件');
 for(const file of skillDocs){
  const destination=new URL(file,target);
  await mkdir(new URL('.',destination),{recursive:true});
  await copyFile(new URL('skills/deliver-workbench/'+file,repo),destination);
 }
 const {version,engines,dependencies,license,type}=JSON.parse(await readFile(new URL('package.json',repo),'utf8'));
 const manifest={name:'delivery-workbench',version,engines,dependencies,license,type,private:true};
 const lock=JSON.parse(await readFile(new URL('package-lock.json',repo),'utf8'));
 Object.assign(lock,{name:manifest.name,version});
 lock.packages['']={name:manifest.name,version,engines,dependencies,license};
 const files={};
 for(const file of runtimeFiles)files[file]=await readFile(new URL(file,repo),'utf8');
 files['agents/openai.yaml']=await readFile(new URL('skills/deliver-workbench/agents/openai.yaml',repo),'utf8');
 files['package.json']=JSON.stringify(manifest,null,2);
 files['package-lock.json']=JSON.stringify(lock,null,2);
 const payload=JSON.stringify(files,null,2);
 const fence='`'.repeat(Math.max(2,...(payload.match(/`+/g)||[]).map(run=>run.length))+1);
 await writeFile(new URL('CONNECTOR.md',target),`# 成品工作台连接器\n\n按 INSTALL.md 安装。下面的 JSON 对象以相对路径为键，以完整 UTF-8 文件内容为值。\n\n${fence}json\n${payload}\n${fence}\n`);
}
export async function build(output=new URL('../site-dist/',import.meta.url)){
 await mkdir(output,{recursive:true});
 const unexpected=(await readdir(output)).filter(name=>![...publicFiles,'.nojekyll'].includes(name));
 if(unexpected.length)throw new Error('发布目录含非白名单文件，请改用空目录：'+unexpected.join(', '));
 for(const name of publicFiles){
  const source=new URL('../site/'+name,import.meta.url),target=new URL(name,output);
  if(name==='deliver-workbench'){
   await publishSkill(new URL('deliver-workbench/',output));
  }else if(directoryFiles[name]){
   await mkdir(target,{recursive:true});
   if(name==='downloads'){
    for(const file of ['deliver-workbench-v1.3.0.zip','delivery-workbench-codex-v1.1.0.zip']){
     await rm(new URL(file,new URL('downloads/',output)),{force:true});
     await rm(new URL(file+'.sha256',new URL('downloads/',output)),{force:true});
    }
   }
   const extra=(await readdir(target)).filter(file=>!directoryFiles[name].includes(file));
   if(extra.length)throw new Error('发布子目录含非白名单文件：'+extra.join(', '));
   for(const file of directoryFiles[name])await copyFile(new URL(name+'/'+file,new URL('../site/',import.meta.url)),new URL(name+'/'+file,output));
  }
  else await copyFile(source,target);
 }
 await writeFile(new URL('.nojekyll',output),'');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 await build();console.log('成品工作台发布站点已生成：site-dist/');
}
