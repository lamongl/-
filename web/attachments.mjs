import {validateFile} from './core.mjs';

export async function readAttachments(incoming,existingCount=0){
  const accepted=[],errors=[];
  for(const file of incoming){
    const issue=validateFile(file);
    if(issue){errors.push(file.name+'：'+issue);continue;}
    if(existingCount+accepted.length>=3){errors.push('最多添加 3 份资料，请先移除已有资料。');break;}
    try{
      const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
      if(text.includes('\0'))throw Error('binary');
      if(!text.trim()){errors.push(file.name+'：文件为空。');continue;}
      accepted.push({name:file.name,text});
    }catch{errors.push(file.name+'：无法读取，请使用 UTF-8 编码的文本文件。');}
  }
  return {accepted,errors};
}

export function bindFileDrop({root,zone,onFiles,canAccept=()=>true}){
  let depth=0;
  const isFile=event=>Array.from(event.dataTransfer?.types||[]).includes('Files');
  const inside=event=>zone.contains(event.target);
  const clear=()=>{depth=0;zone.classList.toggle('is-dragging',false);};
  root.addEventListener('dragenter',event=>{
    if(!isFile(event))return;
    event.preventDefault();
    if(inside(event)&&canAccept()){depth++;zone.classList.toggle('is-dragging',true);}
  });
  root.addEventListener('dragover',event=>{
    if(!isFile(event))return;
    event.preventDefault();
    event.dataTransfer.dropEffect=inside(event)&&canAccept()?'copy':'none';
  });
  root.addEventListener('dragleave',event=>{
    if(inside(event)&&depth>0){depth--;if(!depth)clear();}
    if(event.target===root||event.target===root.documentElement)clear();
  });
  root.addEventListener('drop',event=>{
    clear();
    if(!isFile(event))return;
    event.preventDefault();
    if(inside(event)&&canAccept())onFiles(Array.from(event.dataTransfer.files));
  });
  root.addEventListener('dragend',clear);
}
