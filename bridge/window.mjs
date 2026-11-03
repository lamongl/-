import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

export function windowLaunchPlan(value,{platform=process.platform,env=process.env,exists=existsSync}={}){
 let url;try{url=new URL(value);}catch{throw Error('无效的本地工作台链接。');}
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!url.port||url.username||url.password||url.search||!/^\/jobs\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\/$/.test(url.pathname)||!/^#[0-9a-f]{64}$/.test(url.hash))throw Error('只能打开带访问凭证的本地工作台任务。');
 const args=['--app='+url.href,'--new-window','--window-size=1120,860'];
 if(platform==='win32'){
  const candidates=[
   env['ProgramFiles(x86)']&&join(env['ProgramFiles(x86)'],'Microsoft','Edge','Application','msedge.exe'),
   env.ProgramFiles&&join(env.ProgramFiles,'Microsoft','Edge','Application','msedge.exe'),
   env.ProgramFiles&&join(env.ProgramFiles,'Google','Chrome','Application','chrome.exe'),
   env.LOCALAPPDATA&&join(env.LOCALAPPDATA,'Google','Chrome','Application','chrome.exe')
  ].filter(Boolean);
  const command=candidates.find(exists);
  return command?{command,args,mode:'app'}:null;
 }
 if(platform==='darwin'){
  const command=['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'].find(exists);
  return command?{command,args,mode:'app'}:{command:'/usr/bin/open',args:[url.href],mode:'browser'};
 }
 if(platform==='linux'){
  const command=['/usr/bin/google-chrome','/usr/bin/microsoft-edge','/usr/bin/chromium','/usr/bin/chromium-browser'].find(exists);
  return command?{command,args,mode:'app'}:{command:'xdg-open',args:[url.href],mode:'browser'};
 }
 return null;
}

export async function openWorkbenchWindow(url,{spawnProcess=spawn,...options}={}){
 const plan=windowLaunchPlan(url,options);
 if(!plan)return {status:'unavailable',message:'未找到可用的桌面浏览器，请使用宿主打开工作台链接。'};
 return new Promise(resolve=>{
  let settled=false,child;
  const done=result=>{if(!settled){settled=true;resolve(result);}};
  try{
   child=spawnProcess(plan.command,plan.args,{detached:true,stdio:'ignore',shell:false,windowsHide:false});
   child.once('error',()=>done({status:'unavailable',message:'窗口启动失败，请使用宿主打开工作台链接。'}));
   child.once('spawn',()=>{child.unref();done({status:'requested',mode:plan.mode,message:'已请求桌面打开工作台；若未显示，请使用ui_url打开。'});});
  }catch{done({status:'unavailable',message:'窗口启动失败，请使用宿主打开工作台链接。'});}
 });
}
