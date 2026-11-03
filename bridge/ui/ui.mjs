const $=id=>document.getElementById(id),jobId=location.pathname.split('/')[2];
const token=location.hash.slice(1)||sessionStorage.getItem('workbench:'+jobId);
if(token)sessionStorage.setItem('workbench:'+jobId,token);
history.replaceState(null,'',location.pathname);
const api='/api/jobs/'+jobId;
let files=[],busy=false,lastState='',currentQuestions=[],poll,active=true,refreshing=false;
const showError=(id,text)=>{$(id).textContent=text;$(id).hidden=!text;};
const size=bytes=>bytes<1024*1024?Math.max(1,Math.round(bytes/1024))+' KB':(bytes/1024/1024).toFixed(1)+' MB';
async function request(path='',options={}){
 const response=await fetch(api+path,{...options,headers:{'X-Workbench-Token':token||'',...options.headers}});
 if(!response.ok){const data=await response.json().catch(()=>({error:'无法连接，请重试。'}));throw Error(data.error);}
 return response;
}
function stage(value){
 for(const id of ['input','questions','working','done'])$(id+'-panel').hidden=id!==value;
 document.querySelectorAll('[data-step]').forEach(item=>{if(item.dataset.step===value)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
}
function renderFiles(){
 $('file-list').replaceChildren();
 files.forEach((file,index)=>{const row=document.createElement('div');row.className='file-row';const name=document.createElement('span');name.textContent=file.name+' · '+size(file.size);const remove=document.createElement('button');remove.type='button';remove.textContent='移除';remove.disabled=busy;remove.onclick=()=>{files.splice(index,1);renderFiles();};row.append(name,remove);$('file-list').append(row);});
}
function addFiles(incoming){
 if(busy)return;const errors=[];
 for(const file of incoming){
  if(files.length>=5){errors.push('最多添加5份资料。');break;}
  if(!/\.(docx|xlsx|xls|pptx|pdf|txt|md|csv)$/i.test(file.name)){errors.push(file.name+'：格式暂不支持。');continue;}
  if(file.size>20*1024*1024){errors.push(file.name+'：每份最多20 MB。');continue;}
  files.push(file);
 }
 renderFiles();showError('form-error',errors.join('\n'));
}
$('choose-files').onclick=()=>$('files-input').click();
$('files-input').onchange=event=>{addFiles(Array.from(event.target.files));event.target.value='';};
let depth=0;
for(const type of ['dragenter','dragover','dragleave','drop'])document.addEventListener(type,event=>{
 const hasFiles=Array.from(event.dataTransfer?.types||[]).includes('Files');if(!hasFiles)return;
 event.preventDefault();const inside=$('dropzone').contains(event.target);
 if(type==='dragenter'&&inside&&!busy){depth++;$('dropzone').classList.add('is-dragging');}
 if(type==='dragleave'&&inside){depth=Math.max(0,depth-1);if(!depth)$('dropzone').classList.remove('is-dragging');}
 if(type==='drop'){depth=0;$('dropzone').classList.remove('is-dragging');if(inside)addFiles(Array.from(event.dataTransfer.files));}
});
$('task-form').onsubmit=async event=>{
 event.preventDefault();if(busy)return;
 const text=$('request').value.trim();if(!text){showError('form-error','先说说你想做什么。');return;}
 busy=true;$('submit').disabled=true;$('choose-files').disabled=true;$('submit').textContent='正在读取并提交…';renderFiles();showError('form-error','');
 try{
  const body=new FormData();body.set('request',text);body.set('outputKind',$('output-kind').value);files.forEach(file=>body.append('files',file));
  const response=await request('/submit',{method:'POST',body});apply(await response.json());
 }catch(error){showError('form-error',error.message);}
 finally{busy=false;$('submit').disabled=false;$('choose-files').disabled=false;$('submit').textContent='交给 AI 制作 →';renderFiles();}
};
function renderQuestions(questions){
 currentQuestions=questions;$('questions').replaceChildren();
 for(const q of questions){
  const group=document.createElement('div');group.className='question-field';const label=document.createElement('label');label.htmlFor='question-'+q.id;label.textContent=q.title;
  const input=document.createElement('textarea');input.id='question-'+q.id;input.maxLength=2000;input.required=true;input.placeholder='选择一个方向，或写下你的想法；也可让 AI 按合理默认处理。';
  const options=document.createElement('div');options.className='options';
  for(const choice of q.options){const button=document.createElement('button');button.type='button';button.textContent=choice;button.setAttribute('aria-pressed','false');button.onclick=()=>{input.value=choice;options.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};options.append(button);}
  group.append(label,options,input);$('questions').append(group);
 }
}
$('answers-form').onsubmit=async event=>{
 event.preventDefault();$('answer-submit').disabled=true;showError('answer-error','');
 try{
  const answers=Object.fromEntries(currentQuestions.map(q=>[q.id,$('question-'+q.id).value.trim()]));
  const response=await request('/answers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers})});apply(await response.json());
 }catch(error){showError('answer-error',error.message);}finally{$('answer-submit').disabled=false;}
};
function apply(state){
 $('connection').textContent='任务已连接';const signature=JSON.stringify([state.status,state.questions,state.clarifications,state.artifacts,state.message]);
 if(signature===lastState)return;lastState=signature;
 const confirmed=state.clarifications||[];
 $('confirmed-brief').hidden=!confirmed.length;
 $('confirmed-count').textContent='已确认 '+confirmed.length+' 项思路 · 展开查看';
 $('confirmed-answers').replaceChildren();
 for(const answer of confirmed){
  const title=document.createElement('dt'),value=document.createElement('dd');
  title.textContent=answer.title;value.textContent=answer.answer;
  $('confirmed-answers').append(title,value);
 }
 if(state.status==='awaiting_input'){stage('input');if(!$('request').value)$('request').value=state.request||'';$('output-kind').value=state.output_kind;}
 else if(state.status==='needs_clarification'){stage('questions');renderQuestions(state.questions);}
 else if(state.status==='completed'){
  stage('done');$('delivery-note').textContent=state.message||'选择下面的文件下载。';$('artifacts').replaceChildren();
  state.artifacts.forEach((artifact,index)=>{
   const row=document.createElement('div');row.className='artifact';const detail=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=artifact.name;meta.textContent=size(artifact.size);detail.append(name,meta);
   const download=document.createElement('button');download.className='primary';download.type='button';download.textContent='下载成品 ↓';download.onclick=async()=>{
    download.disabled=true;try{const response=await request('/artifacts/'+index),url=URL.createObjectURL(await response.blob()),link=document.createElement('a');link.href=url;link.download=artifact.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){showError('download-error',error.message);}finally{download.disabled=false;}
   };row.append(detail,download);$('artifacts').append(row);
  });
 }else{
  stage('working');$('submitted-files').textContent=state.files.map(file=>file.name+' · '+file.characters.toLocaleString('zh-CN')+' 字符已读取').join('\n');
  $('status-kicker').textContent=state.status==='processing'?'AI 正在制作':state.status==='failed'?'需要处理的问题':'资料已提交';
  $('status-title').textContent=state.status==='processing'?'思路已明确，正在完成你的任务。':state.status==='failed'?'这次制作未能完成。':'等待 AI 接收任务';
  $('status-description').textContent=state.status==='processing'?(state.message||'AI 正在使用材料制作并检查成品，请保持当前对话开启。'):state.status==='failed'?(state.message||'请回到 AI 对话处理。'):'提交已保存。请保持当前 AI 对话开启；如对话已结束，回到对话说“继续完成工作台任务”。';
 }
}
async function refresh(){
 if(!active||refreshing)return;refreshing=true;
 try{apply(await (await request()).json());}
 catch(error){$('connection').textContent='连接暂时不可用';showError('form-error',error.message);}
 finally{refreshing=false;if(active)poll=setTimeout(refresh,2500);}
}
window.addEventListener('pagehide',()=>{active=false;clearTimeout(poll);});
window.addEventListener('pageshow',()=>{active=true;clearTimeout(poll);if(token)refresh();});
if(!token){$('connection').textContent='请从 AI 对话中打开';showError('form-error','缺少任务访问凭证。请回到 AI 对话，使用它提供的工作台链接。');$('submit').disabled=true;}else refresh();
