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
  case 'wait_for_submission': {
   const job=await bridge.waitForSubmission(args.job_id,args.timeout_ms);
   const waiting=['awaiting_input','uploading','needs_clarification'].includes(job.status);
   return {...job,waiting_for_user:waiting,next_action:waiting?'wait_for_submission':job.status==='submitted'?'get_job':job.status,
    continuation_hint:waiting?'本次等待结束，任务仍待用户操作。保持同一job_id继续等待；单次25秒上限不是会话必须结束。宿主允许时可在约3分钟内重复等待，实际总时长到期再暂停。':'读取当前状态和真实回答，按任务流程继续。'};
  }
  case 'read_material': return bridge.readMaterial(args.job_id,args.file_index,args.offset,args.length);
  case 'ask_questions': return bridge.askQuestions(args.job_id,args.questions);
  case 'set_progress': return bridge.setProgress(args.job_id,args.status,args.message);
  case 'publish_result': return bridge.publishResult(args.job_id,args.paths,args.message);
  default: throw Error('未知工作台操作。');
 }
}
