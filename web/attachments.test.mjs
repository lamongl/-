import test from 'node:test';
import assert from 'node:assert/strict';
import * as attachments from './attachments.mjs';
import {composePreview} from './core.mjs';

test('拖入的中文资料被读取并完整进入提示词',async()=>{
  assert.equal(typeof attachments.readAttachments,'function');
  const {accepted,errors}=await attachments.readAttachments([new File(['日期,销售额\n11月,120'],'销售.csv')]);
  assert.deepEqual(errors,[]);
  assert.deepEqual(accepted,[{name:'销售.csv',text:'日期,销售额\n11月,120'}]);
  assert.ok(composePreview({request:'分析变化',category:'report',files:accepted}).includes('日期,销售额\n11月,120'));
});

test('坏文件不阻止后续有效文件，已有附件也计入三份上限',async()=>{
  assert.equal(typeof attachments.readAttachments,'function');
  const {accepted,errors}=await attachments.readAttachments([
    new File(['x'],'a.pdf'),new File([''],'empty.txt'),new File([new Uint8Array([255])],'bad.txt'),
    new File(['a\0b'],'binary.txt'),new File(['x'.repeat(200001)],'large.txt'),
    new File(['有效'],'ok.md'),new File(['超出'],'extra.txt')
  ],2);
  assert.deepEqual(accepted,[{name:'ok.md',text:'有效'}]);
  assert.equal(errors.length,6);
});

class Surface extends EventTarget {
  highlighted=false;
  classList={toggle:(_name,value)=>{this.highlighted=value;}};
  contains(target){return target===this;}
}
function drag(surface,type,files=[],types=['Files'],target=surface){
  const event=new Event(type,{cancelable:true});
  Object.defineProperties(event,{dataTransfer:{value:{types,files}},target:{value:target}});
  surface.dispatchEvent(event);return event;
}
test('拖放高亮、读取全部文件并阻止浏览器打开文件',()=>{
  assert.equal(typeof attachments.bindFileDrop,'function');
  const root=new Surface(),zone=new Surface(),batches=[];
  attachments.bindFileDrop({root,zone,onFiles:files=>batches.push(files)});
  drag(root,'dragenter',[],['Files'],zone);
  drag(root,'dragenter',[],['Files'],zone);
  drag(root,'dragleave',[],['Files'],zone);
  assert.equal(zone.highlighted,true);
  assert.equal(drag(root,'dragover',[],['Files'],zone).defaultPrevented,true);
  const files=[new File(['a'],'a.txt'),new File(['b'],'b.csv')];
  assert.equal(drag(root,'drop',files,['Files'],zone).defaultPrevented,true);
  assert.equal(zone.highlighted,false);
  assert.deepEqual(batches,[files]);
});
test('区域外或忙碌时不接收文件，普通文本拖动不受影响',()=>{
  assert.equal(typeof attachments.bindFileDrop,'function');
  const root=new Surface(),zone=new Surface(),batches=[];
  let available=true;
  attachments.bindFileDrop({root,zone,canAccept:()=>available,onFiles:files=>batches.push(files)});
  assert.equal(drag(root,'dragover',[],['text/plain'],zone).defaultPrevented,false);
  assert.equal(drag(root,'drop',[new File(['a'],'a.txt')]).defaultPrevented,true);
  available=false;
  drag(root,'dragenter',[],['Files'],zone);
  assert.equal(zone.highlighted,false);
  drag(root,'drop',[new File(['a'],'a.txt')],['Files'],zone);
  assert.deepEqual(batches,[]);
});
