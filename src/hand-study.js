import {t, html, installLanguageControl, setPageLanguage, languageURL} from './i18n.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Ukulele} from './model.js';
import './hand-study.css';
setPageLanguage(true);
document.querySelector('#app').innerHTML=html(`
<header><a href="/">← 返回练习室</a><span>慢慢弹 / 动作小样</span></header>
<main><h1>看清按弦，再慢慢拨响</h1><p class="intro">先暂停看手指落在哪里，再用慢速跟练。切换特写，可以看清按下、抬起和拨动。</p>
<section class="visual-panel"><div class="panel-toolbar"><span class="live-label"></span><div class="segmented" id="views"><button data-view="front">完整琴</button><button data-view="fret">左手</button><button data-view="angle">侧面</button><button id="right-view">右手特写</button></div></div>
<div class="model-stage"><div id="three-host"></div><span class="load-status" role="status">正在载入 Blender 动画…</span></div>
<div class="finger-key"></div><div class="model-help"></div><span id="strum-symbol" hidden>—</span>
<div class="study-transport"><button id="study-play" disabled>播放动作</button><button id="study-step" disabled>前进一帧</button><button id="study-reset" disabled>回到开始</button><label>动作速度 <select id="study-speed"><option value="0.25">¼ 速</option><option value="0.5" selected>½ 速</option><option value="1">正常</option></select></label><label><input id="contacts" type="checkbox">显示按弦位置</label></div>
<div class="scrubber"><input id="study-time" type="range" min="0" max="8" step="0.033333" value="0" aria-label="动画进度" disabled><output id="time-label">0.00 / 8.00 秒</output></div>
<div class="chapters"><button data-time="0">① 按住 G7</button><button data-time="2">② 抬起手指</button><button data-time="3.3">③ 拨 4 弦</button><button data-time="4.3">④ 拨 3 弦</button><button data-time="5.3">⑤ 拨 2 弦</button><button data-time="6.3">⑥ 拨 1 弦</button></div></section>
<aside><strong id="phase">左手按住，右手准备</strong><p>本示意包含 G7 按弦、松开，以及依次拨响 4、3、2、1 弦。</p><p class="reference">动作参考：<a href="https://www.bilibili.com/video/BV1st411q7yc/?p=4&t=135" target="_blank" rel="noopener noreferrer">第 4 节 · 左手特写</a> / <a href="https://www.bilibili.com/video/BV1st411q7yc/?p=5&t=180" target="_blank" rel="noopener noreferrer">第 5 节 · 右手特写</a>。根据画面摆姿势，未做视频动作捕捉。</p></aside></main>`);
const $=s=>document.querySelector(s),model=new Ukulele($('#three-host'),{sketch:false});
// Keep labels from drawing through the hands; contact markers remain optional.
model.group.children.filter(o=>o.isSprite).forEach(o=>o.visible=false);
model.setFingers([0,2,1,2],[0,2,1,3]);model.fingerGroup.visible=false;model.actionGroup.visible=false;model.actionHint.hidden=true;
$('.live-label').textContent=t('G7 按弦 · 逐根拨弦');$('.finger-key').textContent=t('左手按弦 · 右手拨弦 · 拖动转动琴，滚轮缩放');$('.model-help').hidden=true;
let mixer,actions=[],time=0,duration=8,playing=false,last=performance.now();
const status=$('.load-status');
const phases=[[0,t('左手按住 G7，右手准备')],[1,t('左手松开弦，手指抬起')],[2.1,t('手指重新落回 G7')],[3.3,t('右手拨第 4 弦')],[4.3,t('右手拨第 3 弦')],[5.3,t('右手拨第 2 弦')],[6.3,t('右手拨第 1 弦')],[7.1,t('回到准备姿势')]];
function update(){
 actions.forEach(a=>{a.paused=false;a.enabled=true});mixer?.setTime(time);$('#study-time').value=time;$('#time-label').textContent=t('{time} / {duration} 秒',{time:time.toFixed(2),duration:duration.toFixed(2)});
 const pluck=[3.3,4.3,5.3,6.3].findIndex(start=>time>=start&&time<start+.7);model.showAction(pluck<0?'-':'P'+(4-pluck));
 $('#phase').textContent=phases.findLast(p=>time>=p[0])[1];$('#study-play').textContent=playing?t('暂停'):t('播放动作');
 $('.visual-panel').dataset.time=time.toFixed(3);
}
function seek(value){playing=false;time=Math.max(0,Math.min(duration,value));update();}
$('#study-play').onclick=()=>{if(!mixer)return;if(time>=duration)time=0;playing=!playing;last=performance.now();update()};
$('#study-step').onclick=()=>seek(time+1/30);$('#study-reset').onclick=()=>seek(0);$('#study-time').oninput=e=>seek(+e.target.value);
$('#contacts').onchange=e=>{model.fingerGroup.visible=e.target.checked};
document.querySelectorAll('[data-time]').forEach(b=>{b.disabled=true;b.onclick=()=>seek(+b.dataset.time)});
// Normal held pose: the neck rises to the left and the soundboard stays upright.
model.group.scale.y=-1;
model.group.rotation.set(-.12,0,-.38);
model.view=mode=>{
 model.viewMode=mode;model.camera.up.set(0,1,0);
 const aspect=Math.max(.5,model.host.clientWidth/Math.max(1,model.host.clientHeight));
 let target=new THREE.Vector3(0,0,0),span=11.8;
 if(mode==='fret'){target.set(-2.5,.95,-.1);span=3.8}
 if(mode==='right'){target.set(1.55,-.65,.65);span=4.2}
 const distance=Math.max(mode==='front'?10.2:4,span/(1.75*Math.tan(35*Math.PI/360)*aspect));
 const offset=mode==='angle'?new THREE.Vector3(-.55,-.18,.82):mode==='right'?new THREE.Vector3(-.87,-.3,.39):new THREE.Vector3(0,-.12,.993);
 if(mode==='angle'){target.set(-2.35,0,0);offset.multiplyScalar(5.8)}else offset.multiplyScalar(distance);
 model.controls.target.copy(target);model.camera.position.copy(target).add(offset);model.controls.update();
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));$('#right-view').setAttribute('aria-pressed',String(mode==='right'));
};
$('.visual-panel [data-view="front"]').textContent=t('同向示意');
$('.finger-key').textContent=t('同向指法示意 · 琴颈向左上方抬起 · 左手在左、右手在右');
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>model.view(b.dataset.view));
$('#right-view').onclick=()=>model.view('right');
new GLTFLoader().load('/models/hand-study.glb',gltf=>{
 model.group.add(gltf.scene);gltf.scene.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
 if(!gltf.animations.length){status.textContent=t('模型没有可播放的动画。');return}
 mixer=new THREE.AnimationMixer(gltf.scene);actions=gltf.animations.map(c=>{const a=mixer.clipAction(c);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();return a});duration=Math.max(...gltf.animations.map(c=>c.duration));$('#study-time').max=duration;
 try{const restore=JSON.parse(sessionStorage.getItem('slow-strum-study-language')||'null');sessionStorage.removeItem('slow-strum-study-language');if(restore){if(Number.isFinite(restore.time))time=Math.max(0,Math.min(duration,restore.time));if(['0.25','0.5','1'].includes(restore.speed))$('#study-speed').value=restore.speed;if(restore.contacts===true){$('#contacts').checked=true;model.fingerGroup.visible=true;}}}catch{}
 status.hidden=true;document.querySelectorAll('.study-transport button,.chapters button,#study-time').forEach(b=>b.disabled=false);update();model.view('front');
},undefined,()=>{status.textContent=t('动画载入失败，请刷新重试。');status.classList.add('error')});
function tick(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(playing&&mixer){time=Math.min(duration,time+dt*Number($('#study-speed').value));if(time>=duration)playing=false;update()}requestAnimationFrame(tick)}requestAnimationFrame(tick);

import './i18n.css';

document.querySelector('header a').href=languageURL('/');
installLanguageControl(document.querySelector('header'),()=>{
 playing=false;
 try{sessionStorage.setItem('slow-strum-study-language',JSON.stringify({time,speed:$('#study-speed').value,contacts:$('#contacts').checked}));}catch{}
});
