import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import * as XLSX from 'xlsx';
import * as parser from './document-parser.mjs';

const office=(name,parts)=>new File([zipSync(Object.fromEntries(Object.entries(parts).map(([path,text])=>[path,strToU8(text)])))],name);
test('Word读取中文段落和表格，不把格式标签当正文',async()=>{
 assert.equal(typeof parser.extractDocumentText,'function');
 const file=office('通知.docx',{'word/document.xml':'<w:document xmlns:w="urn:word"><w:body><w:p><w:r><w:t>通知 &amp; 安排</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>部门</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>销售</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>'});
 const text=await parser.extractDocumentText(file);
 assert.ok(text.includes('通知 & 安排'));assert.ok(text.includes('部门\t销售'));assert.ok(!text.includes('<w:'));
});
test('PPT按演示顺序读取幻灯片并保留备注',async()=>{
 assert.equal(typeof parser.extractDocumentText,'function');
 const file=office('培训.pptx',{
 'ppt/presentation.xml':'<p:presentation xmlns:p="urn:p" xmlns:r="urn:r"><p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId1"/></p:sldIdLst></p:presentation>',
 'ppt/_rels/presentation.xml.rels':'<Relationships><Relationship Id="rId1" Target="slides/slide1.xml" Type="slide"/><Relationship Id="rId2" Target="slides/slide2.xml" Type="slide"/></Relationships>',
 'ppt/slides/slide1.xml':'<p:sld xmlns:p="urn:p" xmlns:a="urn:a"><a:p><a:r><a:t>第二页</a:t></a:r></a:p></p:sld>',
 'ppt/slides/slide2.xml':'<p:sld xmlns:p="urn:p" xmlns:a="urn:a"><a:p><a:r><a:t>第一页</a:t></a:r></a:p></p:sld>',
 'ppt/slides/_rels/slide2.xml.rels':'<Relationships><Relationship Id="n1" Target="../notesSlides/notesSlide1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide"/></Relationships>',
 'ppt/notesSlides/notesSlide1.xml':'<p:notes xmlns:p="urn:p" xmlns:a="urn:a"><a:p><a:r><a:t>演讲备注</a:t></a:r></a:p></p:notes>'
 });
 const text=await parser.extractDocumentText(file);
 assert.ok(text.indexOf('第一页')<text.indexOf('第二页'));assert.ok(text.includes('演讲备注'));
});
for(const ext of ['xlsx','xls'])test('Excel '+ext+'保留多工作表、中文、零值及前导零',async()=>{
 assert.equal(typeof parser.extractDocumentText,'function');
 const workbook=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([['编号','销售额'],['001',0],['002',120]]),'本月');
 XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([['说明'],['待确认']]),'备注');
 const file=new File([XLSX.write(workbook,{type:'array',bookType:ext==='xls'?'biff8':'xlsx'})],'销售.'+ext);
 const text=await parser.extractDocumentText(file);
 for(const value of ['本月','备注','001\t0','002\t120','待确认'])assert.ok(text.includes(value),value);
});
function pdfFixture(text){
 const stream=`BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
 let body='%PDF-1.4\n',offsets=[0];
 objects.forEach((object,i)=>{offsets.push(body.length);body+=`${i+1} 0 obj\n${object}\nendobj\n`;});
 const xref=body.length;body+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
 return new File([body+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`],'材料.pdf');
}
test('真实文字PDF按页读取，空白或扫描PDF不能伪装成功',async()=>{
 assert.equal(typeof parser.extractDocumentText,'function');
 const text=await parser.extractDocumentText(pdfFixture('Sales 120'));
 assert.ok(text.includes('第 1 页'));assert.ok(text.includes('Sales 120'));
 await assert.rejects(parser.extractDocumentText(pdfFixture('')),/OCR|扫描|文字/);
});
test('损坏文档及超过解压上限的压缩文档被拒绝',async()=>{
 assert.equal(typeof parser.extractDocumentText,'function');
 await assert.rejects(parser.extractDocumentText(new File(['not a zip'],'bad.docx')));
 const file=office('large.docx',{'word/document.xml':'x'.repeat(8*1024*1024+1)});
 await assert.rejects(parser.extractDocumentText(file),/过大|上限/);
});
