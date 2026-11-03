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
let scheduled=false;
function paint(){
 scheduled=false;
 if(motion.matches)return;
 const top=innerWidth<=650?60:68,rect=story.getBoundingClientRect();
 const progress=clamp((top-rect.top)/Math.max(1,story.offsetHeight-innerHeight+top)),phase=progress*2;
 hero.style.setProperty('--hero-p',clamp(scrollY/750));
 document.querySelector('.story-visual').style.setProperty('--phase',phase);
 scenes.forEach((scene,i)=>{
  const distance=i-phase,alpha=clamp(1-Math.abs(distance));
  scene.style.opacity=String(alpha);
  scene.style.transform=`translateY(calc(-50% + ${distance*85}px)) scale(${.91+alpha*.09}) rotateY(${distance*-7}deg)`;
  scene.style.zIndex=String(Math.round(alpha*10));
  scene.classList.toggle('visible',alpha>.5);scene.inert=alpha<=.5;scene.setAttribute('aria-hidden',String(alpha<=.1));
  chapters[i].style.opacity=String(alpha);
  chapters[i].style.transform=`translateY(${distance*22}px)`;
  chapters[i].setAttribute('aria-hidden',String(alpha<=.1));
  bars[i].classList.toggle('active',i===Math.round(phase));
 });
}
function schedule(){if(!scheduled&&!motion.matches){scheduled=true;requestAnimationFrame(paint);}}
function configure(){
 document.documentElement.classList.toggle('scroll-ready',!motion.matches);
 scenes.forEach(scene=>{scene.removeAttribute('style');scene.inert=false;scene.removeAttribute('aria-hidden');});
 chapters.forEach(chapter=>{chapter.removeAttribute('style');chapter.removeAttribute('aria-hidden');});
 if(!motion.matches)paint();
}
configure();
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);motion.addEventListener('change',configure);
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}},{threshold:.12});
 document.querySelectorAll('.section-intro h2,.section-intro>p,.section-intro>div,.process li,.findings h3,.findings>div,.install-body h3,.promise h2,.promise-pictures img,.faq details,.final-cta h2').forEach(element=>observer.observe(element));
}
