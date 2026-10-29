// The browser owns recognition. This module never records, uploads or stores audio.
export function appendDictation(current,text,limit=12000){
 const addition=text.trim();const value=current+(current&&addition?'\n':'')+addition;
 return value.length>limit?{value:current,overflow:addition}:{value,overflow:''};
}
const errors={
 'not-allowed':'麦克风权限未获允许，请在浏览器设置中检查权限，或使用键盘输入。',
 'service-not-allowed':'浏览器不允许语音识别服务，请使用输入法语音或键盘输入。',
 'audio-capture':'未找到可用麦克风，请检查设备后重试。',
 'network':'语音识别服务连接失败，请重试，或使用输入法语音输入。',
 'no-speech':'没有识别到语音，请靠近麦克风重试。',
 'language-not-supported':'本机中文语音模型不可用。可明确允许浏览器在线识别后重试，或使用输入法语音输入。',
 'aborted':'语音输入已取消。',
};
export function createDictation({Recognition,onText=()=>{},onStatus=()=>{},onState=()=>{}}={}){
 let current=null;
 function cancel(){const old=current;current=null;try{old?.abort();}catch{}onState(false);}
 return {
  start({allowRemote=false}={}){
   if(current)return false;
   if(!Recognition){onStatus('此浏览器不支持网页语音识别。手机可使用输入法上的麦克风按钮，或直接输入。');return false;}
   let r;
   try{r=new Recognition();}catch{onStatus('无法启动浏览器语音服务，请使用输入法语音或键盘输入。');return false;}
   const local='processLocally' in r;
   if(!local&&!allowRemote){onStatus('此浏览器无法保证本机识别。请先明确允许在线识别，或使用输入法语音输入。');return false;}
   if(local)r.processLocally=!allowRemote;
   r.lang='zh-CN';r.continuous=true;r.interimResults=true;
   const seen=new Set();let heard=false;
   current=r;onState(true);
   r.onstart=()=>{if(current===r)onStatus(allowRemote?'正在听，请说话。浏览器可能使用在线识别；点击结束停止。':'正在本机识别中文，请说话；点击结束停止。');};
   r.onresult=event=>{
    if(current!==r)return;
    let interim='';
    for(let i=event.resultIndex;i<event.results.length;i++){
     const result=event.results[i],text=result[0]?.transcript||'';
     if(result.isFinal&&!seen.has(i)){seen.add(i);heard=true;onText(text);}
     else if(!result.isFinal)interim+=text;
    }
    if(interim)onStatus('正在识别：'+interim);
   };
   r.onerror=event=>{if(current!==r)return;current=null;onState(false);try{r.abort();}catch{}onStatus(errors[event.error]||'语音识别失败，请重试或使用键盘输入。');};
   r.onend=()=>{if(current!==r)return;current=null;onState(false);onStatus(heard?'语音输入已结束，请检查识别文字后继续。':'未收到完整识别文字，请重试或使用输入法语音输入。');};
   try{r.start();return true;}catch{current=null;onState(false);onStatus('无法启动麦克风，请检查浏览器权限后重试。');return false;}
  },
  stop(){try{current?.stop();}catch{cancel();}},
  cancel,
 };
}
