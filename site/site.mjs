let arm='with',slide=3;
const $=id=>document.getElementById(id);
const titles={with:['封面','研究问题与方法','证据与边界','角色与协作','学习路径','验证与责任','贡献与局限','结论'],without:['封面','研究问题与方法','开发协调者','学习路径','判断与责任','证据边界','贡献与局限','结论']};
function render(){
 const label=arm==='with'?'使用 Skill':'未使用工作台 Skill';
 $('preview').src=`./assets/${arm}-${slide}.jpg`;
 $('preview').alt=`${label}，第${slide}页：${titles[arm][slide-1]}`;
 $('preview-caption').textContent=label+' · '+titles[arm][slide-1];
 $('slide-count').textContent=`第 ${slide} / 8 页`;
 $('choose-with').setAttribute('aria-pressed',String(arm==='with'));
 $('choose-without').setAttribute('aria-pressed',String(arm==='without'));
}
$('choose-with').onclick=()=>{arm='with';render();};
$('choose-without').onclick=()=>{arm='without';render();};
$('prev').onclick=()=>{slide=slide===1?8:slide-1;render();};
$('next').onclick=()=>{slide=slide===8?1:slide+1;render();};
$('copy-invoke').onclick=async()=>{
 try{await navigator.clipboard.writeText($('invoke-text').textContent);$('copy-status').textContent='已复制';}
 catch{$('copy-status').textContent='请选中上方语句复制';}
};
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const story=document.querySelector('.scroll-story'),hero=document.querySelector('.hero-product');
const scenes=[...document.querySelectorAll('[data-scene]')],chapters=[...document.querySelectorAll('[data-chapter]')],bars=[...document.querySelectorAll('.story-progress span')];
const clamp=n=>Math.max(0,Math.min(1,n));
let scheduled=false,chapter=-1,lockedUntil=0,lastGesture=0,touchStart=null;
const topInset=()=>innerWidth<=650?60:68;
function selectChapter(next){
 if(next===chapter)return;chapter=next;story.dataset.stage=String(next);
 document.querySelector('.story-visual').style.setProperty('--phase',next);
 scenes.forEach((scene,i)=>{
  const active=i===next,distance=i-next;
  scene.classList.toggle('visible',active);scene.style.setProperty('--distance',distance);
  scene.inert=!active;scene.setAttribute('aria-hidden',String(!active));
  chapters[i].classList.toggle('active',active);chapters[i].style.setProperty('--distance',distance);
  chapters[i].setAttribute('aria-hidden',String(!active));bars[i].classList.toggle('active',active);
 });
}
function paint(){
 scheduled=false;if(motion.matches)return;
 hero.style.setProperty('--hero-p',clamp(scrollY/750));
 if(performance.now()<lockedUntil)return;
 const rect=story.getBoundingClientRect(),range=Math.max(1,story.offsetHeight-innerHeight+topInset());
 selectChapter(Math.round(clamp((topInset()-rect.top)/range)*2));
}
function schedule(){if(!scheduled&&!motion.matches){scheduled=true;requestAnimationFrame(paint);}}
function configure(){
 document.documentElement.classList.toggle('scroll-ready',!motion.matches);chapter=-1;lockedUntil=0;
 scenes.forEach(scene=>{scene.removeAttribute('style');scene.inert=false;scene.removeAttribute('aria-hidden');});
 chapters.forEach(item=>{item.removeAttribute('style');item.removeAttribute('aria-hidden');});
 if(!motion.matches)paint();
}
function isPinned(){const rect=story.getBoundingClientRect();return rect.top<=topInset()+3&&rect.bottom>=innerHeight-3;}
function advance(direction){
 const next=chapter+direction;if(next<0||next>2)return false;
 const now=performance.now();if(now<lockedUntil)return true;
 const start=scrollY+story.getBoundingClientRect().top-topInset(),range=story.offsetHeight-innerHeight+topInset();
 lockedUntil=now+800;selectChapter(next);
 scrollTo({top:start+(next/2)*range,behavior:'smooth'});
 setTimeout(schedule,850);return true;
}
// Capture gestures only inside this pinned three-scene demonstration.
// The first/last boundary releases native scrolling to the surrounding page.
addEventListener('wheel',event=>{
 if(motion.matches||event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!isPinned())return;
 const direction=Math.sign(event.deltaY);if(!direction)return;
 const now=performance.now(),previous=lastGesture;lastGesture=now;
 if(now<lockedUntil){event.preventDefault();return;}
 if((chapter===0&&direction<0)||(chapter===2&&direction>0))return;
 if(now-previous<150){event.preventDefault();return;}
 if(advance(direction))event.preventDefault();
},{passive:false});
story.addEventListener('touchstart',event=>{touchStart=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY,pinned:isPinned()}:null;},{passive:true});
story.addEventListener('touchmove',event=>{
 if(!touchStart?.pinned||motion.matches||event.touches.length!==1)return;
 const y=touchStart.y-event.touches[0].clientY,x=touchStart.x-event.touches[0].clientX;
 if(Math.abs(y)<10||Math.abs(y)<Math.abs(x))return;
 if(performance.now()<lockedUntil||(chapter<2&&y>0)||(chapter>0&&y<0))event.preventDefault();
},{passive:false});
story.addEventListener('touchend',event=>{
 if(!touchStart?.pinned||motion.matches)return;
 const y=touchStart.y-event.changedTouches[0].clientY,x=touchStart.x-event.changedTouches[0].clientX;
 touchStart=null;if(Math.abs(y)>35&&Math.abs(y)>Math.abs(x))advance(Math.sign(y));
},{passive:true});
configure();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);motion.addEventListener('change',configure);
const sectionAnimations=new Set();
if('IntersectionObserver' in window){
 const sectionObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const section=entry.target;sectionObserver.unobserve(section);
   section.dataset.animated='true';if(motion.matches||!section.animate)continue;
   const surface=section.animate([
    {opacity:.38,transform:'translateY(58px)',clipPath:'inset(4% 0 0 round 28px)'},
    {opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0 round 0px)'}
   ],{duration:1000,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
   sectionAnimations.add(surface);surface.onfinish=()=>sectionAnimations.delete(surface);
   const parts=section.querySelectorAll('.section-intro h2,.section-intro>p,.section-intro>div,.process li,.findings h3,.install-body h3,.promise h2,.promise-pictures img,.final-cta h2,.final-cta .button');
   parts.forEach((part,i)=>{
    const rest=getComputedStyle(part).transform,base=rest==='none'?'':rest;
    const animation=part.animate([
     {opacity:.3,transform:`translateY(${part.matches('img')?40:26}px) ${base}`},
     {opacity:1,transform:base||'translateY(0)'}
    ],{duration:850,delay:Math.min(i*70,280),easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
    sectionAnimations.add(animation);animation.onfinish=()=>sectionAnimations.delete(animation);
   });
  }
 },{threshold:.06});
 document.querySelectorAll('main>section:not(.hero):not(.scroll-story)').forEach(section=>sectionObserver.observe(section));
}
motion.addEventListener('change',()=>{if(motion.matches){for(const animation of sectionAnimations)animation.cancel();sectionAnimations.clear();}});
