import {mkdir,copyFile,writeFile,readdir,cp,readFile} from 'node:fs/promises';
import {build as bundle} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const publicFiles=['index.html','style.css','app.mjs','core.mjs','speech.mjs','attachments.mjs','document-parser.mjs','pdf.worker.mjs','pdf-cmaps','pdf-fonts','third-party-notices.txt','favicon.svg'];
export async function build(output=new URL('../dist/',import.meta.url)){
  await mkdir(output,{recursive:true});
  // Fail closed rather than accidentally publishing stale or private files.
  const existing=await readdir(output);
  const unexpected=existing.filter(name=>![...publicFiles,'.nojekyll'].includes(name));
  if(unexpected.length)throw new Error('发布目录含非白名单文件，请改用空目录：'+unexpected.join(', '));
  for(const name of ['index.html','style.css','app.mjs','core.mjs','speech.mjs','attachments.mjs','favicon.svg'])await copyFile(new URL('../web/'+name,import.meta.url),new URL(name,output));
  await bundle({entryPoints:[fileURLToPath(new URL('../web/document-parser.mjs',import.meta.url))],outfile:fileURLToPath(new URL('document-parser.mjs',output)),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'inline'});
  await copyFile(new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',import.meta.url),new URL('pdf.worker.mjs',output));
  await cp(new URL('../node_modules/pdfjs-dist/cmaps/',import.meta.url),new URL('pdf-cmaps/',output),{recursive:true});
  await cp(new URL('../node_modules/pdfjs-dist/standard_fonts/',import.meta.url),new URL('pdf-fonts/',output),{recursive:true});
  const notices=[];
  for(const [name,path] of [['fflate','fflate/LICENSE'],['fast-xml-parser','fast-xml-parser/LICENSE'],['SheetJS','xlsx/LICENSE'],['PDF.js','pdfjs-dist/LICENSE']])notices.push(name+'\n'+await readFile(new URL('../node_modules/'+path,import.meta.url),'utf8'));
  await writeFile(new URL('third-party-notices.txt',output),notices.join('\n\n'));
  await writeFile(new URL('.nojekyll',output),'');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await build();
  console.log('静态站点已生成：dist/（仅 '+(publicFiles.length+1)+' 个公开文件）');
}
