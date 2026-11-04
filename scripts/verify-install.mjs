import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const dataDir=await mkdtemp(join(tmpdir(),'delivery-install-check-'));
const client=new Client({name:'delivery-install-check',version:'1.4.0'});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../bridge/server.mjs',import.meta.url))],env:{...process.env,WORKBENCH_DATA_DIR:dataDir,WORKBENCH_OPEN_WINDOW:'0'}});
try{
 await client.connect(transport);
 const {tools}=await client.listTools();
 const expected=['create_job','wait_for_submission','get_job','read_material','ask_questions','set_progress','publish_result'];
 if(expected.some(name=>!tools.some(tool=>tool.name===name)))throw Error('连接器工具不完整');
 const result=await client.callTool({name:'create_job',arguments:{title:'安装自检',outputKind:'text'}});
 if(result.isError)throw Error(JSON.stringify(result));
 const data=JSON.parse(result.content.find(item=>item.type==='text').text);
 const response=await fetch(data.api_url,{headers:{'X-Workbench-Token':data.token}});
 if(!response.ok||(await response.json()).status!=='awaiting_input')throw Error('本地任务界面不可访问');
 console.log(JSON.stringify({ok:true,tools:expected.length,localInterface:true,node:process.execPath,hostToolsVerified:false,note:'仅服务端自检通过。还需在宿主实际调用MCP工具，才算MCP接入成功。'}));
}finally{
 await client.close();
 const target=resolve(dataDir),base=resolve(tmpdir())+sep;
 if(!target.startsWith(base)||!target.split(sep).at(-1).startsWith('delivery-install-check-'))throw Error('临时目录边界错误');
 await rm(target,{recursive:true,force:true});
}
