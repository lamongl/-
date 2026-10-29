import {categories,nextQuestion,composePreview,validateFile,parseSourceLinks,draftStats,scenarioExample} from './core.mjs';
import {createDictation,appendDictation} from './speech.mjs';
const $=id=>document.getElementById(id);
let category='report',answers={},files=[],links=[],question=null,revision='',reading=false;
let pendingReplacement=null,frozenRequest='',frozenCategory='',dirty=false;
let dictating=false;
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const dictation=createDictation({Recognition,
 onText:text=>{const result=appendDictation($('request').value,text);$('request').value=result.value;dirty=true;count();fieldError('request','');if(result.overflow)announce('voice-overflow',($('voice-overflow').textContent||'未写入的完整语音文字（输入已超出12,000字符上限，请先精简或复制保留）：')+'\n'+result.overflow);},
 onStatus:text=>announce('voice-status',text),
 onState:active=>{dictating=active;$('voice-label').textContent=active?'结束语音输入':'语音输入';$('voice').setAttribute('aria-pressed',String(active));for(const b of [$('start'),$('new-task'),$('attach'),$('use-scenario'),...document.querySelectorAll('[data-example]')])b.disabled=active||reading;},
});
function announce(id,text){$(id).textContent=text;$(id).hidden=!text;}
function fieldError(id,text){announce(id+'-error',text);$(id).setAttribute('aria-invalid',String(!!text));if(text)$(id).focus();}
function stage(value){
  const stages=['input','question','result'];
  for(const p of stages)$(p+'-panel').hidden=p!==value;
  document.querySelectorAll('[data-step]').forEach(el=>{
    if(el.dataset.step===value)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');
    el.classList.toggle('complete',stages.indexOf(el.dataset.step)<stages.indexOf(value));
  });
  $('examples').hidden=value!=='input';$('workbench').classList.toggle('focused',value!=='input');
}
function renderCategories(){
  $('categories').replaceChildren();
  for(const [id,c] of Object.entries(categories)){
    const b=document.createElement('button');b.type='button';b.textContent=c.name;b.dataset.category=id;
    b.setAttribute('aria-pressed',String(id===category));
    b.onclick=()=>{if(category!==id)answers={};category=id;updateScenario();document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.category===id)));};
    $('categories').append(b);
  }
  updateScenario();
}
function updateScenario(){$('request').placeholder=scenarioExample(category);$('scenario-example').textContent=categories[category].sample;$('use-scenario').textContent='使用'+categories[category].name+'示例';}
function count(){$('count').textContent=$('request').value.length.toLocaleString('zh-CN')+' / 12,000';}
function clearFeedback(){for(const id of ['request','answer','revision','source-links'])fieldError(id,'');for(const id of ['file-error','copy-status','revision-status'])announce(id,'');$('copy-label').textContent='复制完整提示词';}
function reset(){
  dictation.cancel();announce('voice-status','');announce('voice-overflow','');
  category='report';answers={};files=[];links=[];revision='';question=null;frozenRequest='';frozenCategory='';dirty=false;
  for(const id of ['request','answer','result','revision','format','style','source-links'])$(id).value='';
  document.querySelector('.preferences').open=false;
  clearFeedback();renderCategories();renderFiles();count();stage('input');
  $('input-title').tabIndex=-1;$('input-title').focus();
}
function requestReplacement(action,example=false){
  if(!dirty&&!files.length){action();return;}
  pendingReplacement=action;
  $('replace-description').textContent=example?'使用示例会替换当前需求，并清除附件与草稿。':'当前需求、附件与草稿会被清除。';
  $('confirm-replace').textContent=example?'替换为示例':'开始新任务';
  $('replace-dialog').showModal();
}
function renderFiles(){
  $('files').replaceChildren();
  files.forEach((f,i)=>{
    const row=document.createElement('div');row.className='file';
    const name=document.createElement('span');name.textContent=f.name+' · 已读取 '+f.text.length.toLocaleString('zh-CN')+' 字符';
    const remove=document.createElement('button');remove.type='button';remove.textContent='移除';remove.setAttribute('aria-label','移除 '+f.name);
    remove.onclick=()=>{files.splice(i,1);dirty=true;renderFiles();$('attach').focus();};
    row.append(name,remove);$('files').append(row);
  });
}
function updateOptionSelection(){$('options').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===$('answer').value)));}
function writeDraft(){
  $('result').value=composePreview({request:$('request').value,category,answers,files,revision,format:$('format').value,style:$('style').value,links});
  const stats=draftStats($('result').value,files);
  $('result-meta').textContent=`全文 ${stats.characters.toLocaleString('zh-CN')} 字符 · ${stats.materials} 份资料原文 · ${links.length} 个链接`;
  $('size-warning').hidden=!stats.large;
  $('copy-label').textContent='复制完整提示词';announce('copy-status','');
}
function generate(){
  if(reading)return;
  fieldError('answer','');question=nextQuestion($('request').value,category,answers);
  if(question){
    stage('question');$('question-context').textContent=$('request').value;$('question-text').textContent=question.text;
    $('answer').value='';$('options').replaceChildren();
    question.options.forEach(option=>{
      const b=document.createElement('button');b.type='button';b.textContent=option;b.setAttribute('aria-pressed','false');
      b.onclick=()=>{$('answer').value=option;fieldError('answer','');updateOptionSelection();};$('options').append(b);
    });
    $('question-text').focus();
  }else{stage('result');writeDraft();$('result-title').focus();}
}
$('request-form').onsubmit=event=>{
  event.preventDefault();if(reading||dictating)return;
  if(!$('request').value.trim()){fieldError('request','先说说你想完成什么任务。');return;}
  try{links=parseSourceLinks($('source-links').value);fieldError('source-links','');}
  catch(error){document.querySelector('.preferences').open=true;fieldError('source-links',error.message);return;}
  fieldError('request','');
  if(frozenRequest!==$('request').value||frozenCategory!==category){answers={};revision='';announce('revision-status','');}
  frozenRequest=$('request').value;frozenCategory=category;dirty=true;generate();
};
$('answer-form').onsubmit=event=>{
  event.preventDefault();if(!question)return;
  if(!$('answer').value.trim()){fieldError('answer','请选择一个选项，或写下你的回答。');return;}
  answers[question.key]=$('answer').value.trim();generate();
};
for(const id of ['back','edit-input'])$(id).onclick=()=>{stage('input');$('request').focus();};
$('request').addEventListener('input',()=>{dirty=true;count();fieldError('request','');});
$('answer').addEventListener('input',()=>{fieldError('answer','');updateOptionSelection();});
$('revision').addEventListener('input',()=>fieldError('revision',''));
for(const id of ['format','style','source-links'])$(id).addEventListener('input',()=>{dirty=true;if(id==='source-links')fieldError('source-links','');});
$('new-task').onclick=()=>requestReplacement(reset);
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>requestReplacement(()=>{
  reset();category=b.dataset.example;$('request').value=categories[category].sample;dirty=true;renderCategories();count();$('request').focus();
},true));
$('use-scenario').onclick=()=>requestReplacement(()=>{const selected=category;reset();category=selected;$('request').value=categories[category].sample;dirty=true;renderCategories();count();$('request').focus();},true);
$('voice').onclick=()=>{
 if(dictating){dictation.stop();return;}
 if(!Recognition||!window.isSecureContext){announce('voice-status','此浏览器暂不支持网页语音识别。手机可使用输入法上的麦克风按钮；也可在支持语音识别的HTTPS浏览器中打开本站。');return;}
 $('voice-online').checked=false;announce('voice-dialog-error','');$('voice-dialog').showModal();
};
$('voice-cancel').onclick=()=>$('voice-dialog').close();
$('voice-begin').onclick=()=>{
 let local=false;try{local='processLocally' in new Recognition();}catch{}
 if(!local&&!$('voice-online').checked){announce('voice-dialog-error','此浏览器无法保证本机识别。若要继续，请明确勾选允许在线识别；否则可取消并使用输入法语音。');return;}
 $('voice-dialog').close();dictation.start({allowRemote:$('voice-online').checked});
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&dictating){dictation.cancel();announce('voice-status','页面已切到后台，语音输入已停止。');}});
window.addEventListener('pagehide',()=>dictation.cancel());
$('cancel-replace').onclick=()=>{pendingReplacement=null;$('replace-dialog').close();};
$('confirm-replace').onclick=()=>{const action=pendingReplacement;pendingReplacement=null;$('replace-dialog').close();action?.();};
$('replace-dialog').addEventListener('cancel',()=>{pendingReplacement=null;});
$('attach').onclick=()=>$('file-input').click();
$('file-input').onchange=async event=>{
  reading=true;const controls=[$('start'),$('new-task'),$('attach'),$('voice'),$('use-scenario'),...document.querySelectorAll('[data-example]')];
  controls.forEach(b=>b.disabled=true);$('attach-label').textContent='正在读取资料…';$('attach').setAttribute('aria-busy','true');
  const errors=[];
  try{
    for(const file of event.target.files){
      const issue=validateFile(file);if(issue){errors.push(file.name+'：'+issue);continue;}
      if(files.length>=3){errors.push('此预览最多添加 3 份资料。');break;}
      try{
        const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());
        if(text.includes('\0'))throw Error('binary');
        if(!text.trim()){errors.push(file.name+'：文件为空。');continue;}
        files.push({name:file.name,text});dirty=true;
      }catch{errors.push(file.name+'：请使用 UTF-8 编码的文本文件。');}
    }
  }finally{
    reading=false;controls.forEach(b=>b.disabled=false);$('attach-label').textContent='添加参考资料';$('attach').removeAttribute('aria-busy');
    event.target.value='';renderFiles();announce('file-error',errors.join(' '));
  }
};
$('copy').onclick=async()=>{
  try{await navigator.clipboard.writeText($('result').value);$('copy-label').textContent='已复制完整提示词';announce('copy-status','复制成功。可以粘贴到目标 AI 中使用；当前草稿未经 AI 评审。');}
  catch{$('result').focus();$('result').select();announce('copy-status','自动复制不可用，已选中文本，请手动复制。');}
};
$('download').onclick=()=>{
  try{
    const url=URL.createObjectURL(new Blob([$('result').value],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='prompt-workbench.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    announce('copy-status','已发起 TXT 下载，文件包含完整提示词与资料原文。请在浏览器下载列表确认。');
  }catch{announce('copy-status','无法下载，请复制上方完整文本。');}
};
$('share').hidden=typeof navigator.share!=='function';
$('share').onclick=async()=>{
  $('share').disabled=true;
  try{await navigator.share({title:'提示词助手 · 完整提示词',text:$('result').value});announce('copy-status','已交给系统分享。是否发送由你选择的应用决定。');}
  catch(error){if(error.name!=='AbortError')announce('copy-status','此设备无法分享这段文本，请复制或下载 TXT。');}
  finally{$('share').disabled=false;}
};
$('revision-form').onsubmit=event=>{
  event.preventDefault();const text=$('revision').value.trim();
  if(!text){fieldError('revision','请写下需要调整的要求。');return;}
  fieldError('revision','');revision=revision?revision+'\n'+text:text;writeDraft();$('revision').value='';
  announce('revision-status','调整要求已纳入草稿。当前为模板整理，尚未调用 AI 重写。');
};
$('about').onclick=()=>$('about-dialog').showModal();$('close-dialog').onclick=()=>$('about-dialog').close();
window.addEventListener('beforeunload',event=>{if(dirty||files.length){event.preventDefault();event.returnValue='';}});
renderCategories();count();stage('input');
