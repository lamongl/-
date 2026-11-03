import {unzipSync,strFromU8} from 'fflate';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import * as XLSX from 'xlsx';

const MAX_TEXT=1_000_000;
const xmlParser=new XMLParser({preserveOrder:true,ignoreAttributes:false,trimValues:false,parseTagValue:false});
const local=key=>key.split(':').pop();
function xml(text){
 if(/<!DOCTYPE|<!ENTITY/i.test(text)||XMLValidator.validate(text)!==true)throw Error('文档 XML 无效或含不支持的声明。');
 return xmlParser.parse(text);
}
function find(nodes,tag){
 const found=[];
 for(const node of nodes||[])for(const [key,value] of Object.entries(node)){
  if(key===':@'||!Array.isArray(value))continue;
  if(local(key)===tag)found.push({children:value,attrs:node[':@']||{}});
  else found.push(...find(value,tag));
 }
 return found;
}
function inline(nodes){
 let text='';
 for(const node of nodes||[])for(const [key,value] of Object.entries(node)){
  if(key===':@')continue;
  const tag=local(key);
  if(tag==='del')continue;
  if(tag==='#text')text+=String(value);
  else if(tag==='tab')text+='\t';
  else if(tag==='br'||tag==='cr')text+='\n';
  else if(Array.isArray(value))text+=inline(value);
 }
 return text;
}
function blocks(nodes){
 const output=[];
 for(const node of nodes||[])for(const [key,value] of Object.entries(node)){
  if(!Array.isArray(value)||key===':@'||local(key)==='del')continue;
  if(local(key)==='p')output.push(inline(value));
  else if(local(key)==='tr')output.push(find(value,'tc').map(cell=>blocks(cell.children).trim()).join('\t'));
  else output.push(blocks(value));
 }
 return output.filter(Boolean).join('\n');
}
function unzipOffice(data){
 let total=0,entries=0;
 return unzipSync(new Uint8Array(data),{filter:entry=>{
  if(++entries>10000)throw Error('文档条目过多，无法读取。');
  if(!/^(word|ppt|xl)\/.*\.(xml|rels)$/.test(entry.name))return false;
  total+=entry.originalSize;
  if(entry.originalSize>8*1024*1024||total>50*1024*1024)throw Error('文档解压内容过大，超过读取上限。');
  return true;
 }});
}
function xmlPart(parts,path){
 if(!parts[path])throw Error('文档缺少必要内容：'+path);
 return xml(strFromU8(parts[path]));
}
function resolvePart(base,target){
 const url=new URL(target,new URL(base,'https://office.invalid/'));
 if(url.origin!=='https://office.invalid')throw Error('不支持外部文档关系。');
 return decodeURIComponent(url.pathname.slice(1));
}
function relationships(parts,path){
 return parts[path]?find(xmlPart(parts,path),'Relationship').map(r=>r.attrs):[];
}
function presentationText(parts){
 const ids=find(xmlPart(parts,'ppt/presentation.xml'),'sldId');
 const rels=relationships(parts,'ppt/_rels/presentation.xml.rels');
 return ids.map((id,index)=>{
  const rel=rels.find(r=>r['@_Id']===id.attrs['@_r:id']);
  if(!rel||rel['@_TargetMode']==='External')throw Error('幻灯片关系无效。');
  const path=resolvePart('ppt/presentation.xml',rel['@_Target']);
  let text=`第 ${index+1} 页\n`+blocks(xmlPart(parts,path));
  const slash=path.lastIndexOf('/');
  const note=relationships(parts,path.slice(0,slash+1)+'_rels/'+path.slice(slash+1)+'.rels').find(r=>r['@_Type']?.endsWith('/notesSlide'));
  if(note&&note['@_TargetMode']!=='External')text+='\n演讲备注\n'+blocks(xmlPart(parts,resolvePart(path,note['@_Target'])));
  return text;
 }).join('\n\n');
}
function spreadsheetText(data,ext){
 if(ext==='xlsx')unzipOffice(data);
 const book=XLSX.read(data,{type:'array',cellDates:true,cellText:true});
 return book.SheetNames.map(name=>{
  const sheet=book.Sheets[name];
  for(const [address,cell] of Object.entries(sheet))if(!address.startsWith('!')&&cell.f&&cell.v===undefined)throw Error('工作表含没有缓存结果的公式，请先用 Excel 重新计算并保存。');
  return '工作表：'+name+'\n'+XLSX.utils.sheet_to_csv(sheet,{FS:'\t',RS:'\n',blankrows:false});
 }).join('\n\n');
}
async function pdfText(data){
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
 const inNode=typeof process!=='undefined'&&!!process.versions?.node;
 pdfjs.GlobalWorkerOptions.workerSrc=inNode?import.meta.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs'):new URL('./pdf.worker.mjs',import.meta.url).href;
 const resources=inNode?{}:{cMapUrl:new URL('./pdf-cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./pdf-fonts/',import.meta.url).href};
 const task=pdfjs.getDocument({data:new Uint8Array(data),...resources,isEvalSupported:false,useWasm:false,useSystemFonts:true,disableFontFace:true,verbosity:0});
 try{
  const doc=await task.promise,output=[];let length=0;
  for(let pageNo=1;pageNo<=doc.numPages;pageNo++){
   const page=await doc.getPage(pageNo);
   const content=await page.getTextContent();
   const text=content.items.map(item=>item.str?(item.str+(item.hasEOL?'\n':' ')):'').join('').trim();
   if(!text)throw Error(`第 ${pageNo} 页没有可读取文字，可能是扫描件或空白页；请先 OCR 后再导入。`);
   length+=text.length;if(length>MAX_TEXT)throw Error('提取文字超过 100 万字符，请拆分文件后再读取。');
   output.push(`第 ${pageNo} 页\n${text}`);page.cleanup();
  }
  return output.join('\n\n');
 }catch(error){
  if(error.name==='PasswordException')throw Error('PDF 已加密，请先解除密码保护后再导入。');
  throw error;
 }finally{await task.destroy();}
}
export async function extractDocumentText(file){
 const ext=file.name.split('.').pop().toLowerCase(),data=await file.arrayBuffer();
 let text;
 if(ext==='docx')text=blocks(xmlPart(unzipOffice(data),'word/document.xml'));
 else if(ext==='pptx')text=presentationText(unzipOffice(data));
 else if(ext==='xlsx'||ext==='xls')text=spreadsheetText(data,ext);
 else if(ext==='pdf')text=await pdfText(data);
 else throw Error('不支持此文档格式。');
 if(text.length>MAX_TEXT)throw Error('提取文字超过 100 万字符，请拆分文件后再读取。');
 if(!text.trim())throw Error('文档中没有可读取的文字。');
 return text;
}
