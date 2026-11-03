// Interactive MCP client for testing in an already-running Codex chat.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {createInterface} from 'node:readline';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const client=new Client({name:'workbench-current-chat',version:'1.0.0'});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],env:process.env,stderr:'inherit'});
await client.connect(transport);
const call=async(name,args={})=>{
 const result=await client.callTool({name,arguments:args});if(result.isError)throw Error(result.content[0]?.text||'MCP调用失败');return JSON.parse(result.content[0].text);
};
const job=await call('create_job',{title:'新的制作任务',outputKind:'auto'});
await mkdir(new URL('../.workbench/',import.meta.url),{recursive:true});
await writeFile(new URL('../.workbench/current-job.json',import.meta.url),JSON.stringify(job,null,2));
console.log(JSON.stringify({ready:true,...job}));
const input=createInterface({input:process.stdin,terminal:false});
for await(const line of input){
 try{const command=JSON.parse(line);if(command.name==='close')break;console.log(JSON.stringify({result:await call(command.name,{job_id:job.job_id,...command.arguments})}));}
 catch(error){console.log(JSON.stringify({error:error.message}));}
}
await client.close();
