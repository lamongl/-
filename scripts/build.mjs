import {mkdir,copyFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const publicFiles=['index.html','style.css','app.mjs','core.mjs','speech.mjs','favicon.svg'];
export async function build(output=new URL('../dist/',import.meta.url)){
  await mkdir(output,{recursive:true});
  // Fail closed rather than accidentally publishing stale or private files.
  const existing=await readdir(output);
  const unexpected=existing.filter(name=>![...publicFiles,'.nojekyll'].includes(name));
  if(unexpected.length)throw new Error('发布目录含非白名单文件，请改用空目录：'+unexpected.join(', '));
  for(const name of publicFiles)await copyFile(new URL('../web/'+name,import.meta.url),new URL(name,output));
  await writeFile(new URL('.nojekyll',output),'');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await build();
  console.log('静态站点已生成：dist/（仅 '+(publicFiles.length+1)+' 个公开文件）');
}
