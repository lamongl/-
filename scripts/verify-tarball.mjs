import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

try{
 const [file,packageName='xlsx']=process.argv.slice(2);
 if(!file)throw Error('用法：node scripts/verify-tarball.mjs 文件.tgz [包名]');
 const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'));
 const integrity=lock.packages['node_modules/'+packageName]?.integrity;
 const match=/^(sha256|sha384|sha512)-([A-Za-z0-9+/=]+)$/.exec(integrity||'');
 if(!match)throw Error('锁文件缺少可用的包完整性信息。');
 const actual=createHash(match[1]).update(await readFile(file)).digest('base64');
 if(actual!==match[2])throw Error('下载文件与锁文件校验值不一致，停止安装。');
 console.log(JSON.stringify({ok:true,package:packageName,integrity}));
}catch(error){console.error(error.message);process.exitCode=1;}
