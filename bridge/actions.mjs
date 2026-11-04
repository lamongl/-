import {openWorkbenchWindow} from './window.mjs';

export async function callWorkbenchTool(bridge,name,args={}){
 switch(name){
  case 'create_job': {
   const job=await bridge.createJob(args);
   job.window=process.env.WORKBENCH_OPEN_WINDOW==='0'
    ? {status:'disabled'} : await openWorkbenchWindow(job.ui_url);
   return job;
  }
  case 'get_job': return bridge.getJob(args.job_id);
  case 'wait_for_submission': return bridge.waitForSubmission(args.job_id,args.timeout_ms);
  case 'read_material': return bridge.readMaterial(args.job_id,args.file_index,args.offset,args.length);
  case 'ask_questions': return bridge.askQuestions(args.job_id,args.questions);
  case 'set_progress': return bridge.setProgress(args.job_id,args.status,args.message);
  case 'publish_result': return bridge.publishResult(args.job_id,args.paths,args.message);
  default: throw Error('未知工作台操作。');
 }
}
