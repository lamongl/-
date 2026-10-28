import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build,publicFiles} from './build.mjs';

test('发布仅包含白名单文件，资源可在仓库子路径加载',async()=>{
  const path=await mkdtemp(join(tmpdir(),'prompt-publish-'));
  const output=pathToFileURL(path+'/');
  try{
    await build(output);
    assert.deepEqual((await readdir(output)).sort(),[...publicFiles,'.nojekyll'].sort());
    const html=await readFile(new URL('index.html',output),'utf8');
    const assets=[...html.matchAll(/(src|href)="([^"#][^"]*)"/g)].map(match=>({attribute:match[1],path:match[2]}));
    assert.ok(assets.length>=2);
    for(const {attribute,path:asset} of assets){
      if(attribute==='href'&&asset.startsWith('https://'))continue;
      const url=new URL(asset,'https://example.github.io/prompt-workbench/');
      assert.ok(url.pathname.startsWith('/prompt-workbench/'),'资源必须使用相对路径：'+asset);
      assert.ok(publicFiles.includes(asset.replace(/^\.\//,'')));
    }
    assert.ok(html.includes('connect-src &#39;none&#39;')||html.includes("connect-src 'none'"));
    await writeFile(new URL('private.txt',output),'must not publish');
    await assert.rejects(build(output),/非白名单/);
  }finally{await rm(path,{recursive:true,force:true});}
});
