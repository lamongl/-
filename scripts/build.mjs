import {mkdir,copyFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const publicFiles=['index.html','site.css','site.mjs','assets','downloads','favicon.svg'];
const directoryFiles={
 assets:['with','without'].flatMap(arm=>Array.from({length:8},(_,i)=>`${arm}-${i+1}.jpg`)),
 downloads:['with-skill.pptx','without-skill.pptx','delivery-workbench-codex-v1.1.0.zip','delivery-workbench-codex-v1.1.0.zip.sha256','deliver-workbench-v1.3.0.zip','deliver-workbench-v1.3.0.zip.sha256','comparison.md','protocol.md','blind-review.md']
};
export async function build(output=new URL('../site-dist/',import.meta.url)){
 await mkdir(output,{recursive:true});
 const unexpected=(await readdir(output)).filter(name=>![...publicFiles,'.nojekyll'].includes(name));
 if(unexpected.length)throw new Error('发布目录含非白名单文件，请改用空目录：'+unexpected.join(', '));
 for(const name of publicFiles){
  const source=new URL('../site/'+name,import.meta.url),target=new URL(name,output);
  if(directoryFiles[name]){
   await mkdir(target,{recursive:true});
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
