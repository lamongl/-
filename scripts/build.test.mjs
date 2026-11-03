import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build,publicFiles} from './build.mjs';

test('新版发布仅含白名单，真实成果与资源支持仓库子路径',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'delivery-publish-')),output=pathToFileURL(folder+'/');
 try{
  await build(output);
  assert.deepEqual((await readdir(output)).sort(),[...publicFiles,'.nojekyll'].sort());
  const html=await readFile(new URL('index.html',output),'utf8');
  for(const match of html.matchAll(/(?:src|href)="(\.[^"]*)"/g)){
   const asset=match[1],url=new URL(asset,'https://example.github.io/-/');
   assert.ok(url.pathname.startsWith('/-/'));
   assert.ok((await stat(new URL(asset,output))).isFile(),'缺少资源：'+asset);
  }
  assert.ok(html.includes('5 分 34 秒')&&html.includes('9 分 31 秒'));
  assert.ok(!html.includes('Token 消耗</th>'));
  assert.ok(!html.includes('20%')&&!html.includes('10%'));
  for(const name of ['with-skill.pptx','without-skill.pptx','deliver-workbench-v1.3.0.zip']){
   const bytes=await readFile(new URL('downloads/'+name,output));assert.equal(bytes.subarray(0,2).toString(),'PK');assert.ok(bytes.length>10000);
  }
  assert.ok(!publicFiles.includes('.workbench')&&!publicFiles.includes('experiments'));
  await writeFile(new URL('private.txt',output),'must not publish');
  await assert.rejects(build(output),/非白名单/);
 }finally{
  assert.ok(resolve(folder).startsWith(resolve(tmpdir())));
  await rm(folder,{recursive:true,force:true});
 }
});
