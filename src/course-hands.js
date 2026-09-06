import {t, html} from './i18n.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {blendPose,transitionPose,rightPose,poseKey} from './hand-motion.js';
import {installPlayingView} from './playing-view.js';

export class CourseHands{
 constructor(model){
  this.model=model;this.key='0-0-0-0';this.last=performance.now();this.paused=true;
  installPlayingView(model);
  const panel=model.host.closest('.visual-panel');
  panel.querySelector('[data-view="front"]').textContent=t('同向示意');
  panel.querySelector('[data-view="fret"]').textContent=t('左手特写');
  const button=document.createElement('button');button.dataset.view='right';button.textContent=t('右手特写');panel.querySelector('#views').append(button);
  panel.querySelector('.live-label').innerHTML=html('<span class="dot"></span> 琴上弹奏示意');
  panel.querySelector('.finger-key').innerHTML=html('<span>左手在左 · 右手在右</span><span>橙色琴弦：这一拍拨响</span><label><input type="checkbox" class="show-contacts"> 显示按弦位置</label>');
  panel.querySelector('.show-contacts').onchange=e=>{model.fingerGroup.visible=e.target.checked};
  model.fingerGroup.visible=false;model.actionGroup.visible=false;
  panel.querySelector('.model-help').innerHTML=html('拖动转动琴 · 滚轮缩放 <span>可暂停或单步看动作</span>');
  this.status=document.createElement('div');this.status.className='hand-load-status';this.status.setAttribute('role','status');model.host.append(this.status);
  this.load();
 }
 async load(){
  this.model.host.dataset.handState='loading';this.status.textContent=t('正在载入手部演示…');
  try{
   const base=import.meta.env.BASE_URL+'models/';
   const [gltf,response]=await Promise.all([new GLTFLoader().loadAsync(base+'hand-study.glb'),fetch(base+'course-poses.json')]);
   if(!response.ok)throw new Error('Pose library unavailable');
   this.library=await response.json();this.rigs={};
   gltf.scene.traverse(o=>{if(o.isSkinnedMesh){o.frustumCulled=false;const side=o.name.startsWith('left')?'left':'right';this.rigs[side]=Object.fromEntries(o.skeleton.bones.map(b=>[b.name.replace(/_1$/,''),b]))}});
   if(!this.rigs.left?.wrist||!this.rigs.right?.wrist)throw new Error('Incomplete hand rig');
   this.model.group.add(gltf.scene);this.scene=gltf.scene;
   this.apply('left',this.library.left[this.key].held);this.apply('right',this.library.right.rest);
   this.model.host.dataset.handState='ready';this.status.hidden=true;
  }catch(error){
   this.model.host.dataset.handState='error';this.status.replaceChildren(document.createTextNode(t('手部演示未能载入，仍可使用右侧指法图。 ')));
   const retry=document.createElement('button');retry.textContent=t('重试');retry.onclick=()=>this.load();this.status.append(retry);
   this.model.fingerGroup.visible=true;
  }
 }
 apply(side,pose){
  if(!this.rigs)return;
  for(const [name,value] of Object.entries(pose)){const b=this.rigs[side][name];if(b){b.position.fromArray(value.p);b.quaternion.fromArray(value.q)}}
  if(side==='right')this.rightCurrent=pose;
 }
 set(frets){
  const key=poseKey(frets);this.key=key;this.transition=null;
  this.model.host.dataset.handPose=key;
  if(this.library){const pose=this.library.left[key];if(pose)this.apply('left',pose.held)}
 }
 prepare(frets,duration){
  const key=poseKey(frets);
  if(!this.library||key===this.key||!this.library.left[key])return;
  this.transition={from:this.library.left[this.key],to:this.library.left[key],key,elapsed:0,delay:duration*.55,duration:duration*.45};
 }
 trigger(action,duration=.5){
  this.motion={action,duration,elapsed:0,from:this.rightCurrent};this.paused=false;this.last=performance.now();
  this.model.host.dataset.handAction=action;
 }
 pause(keepPose=false){this.paused=true;this.model.host.dataset.handPaused='true';if(!keepPose){this.motion=null;this.transition=null;if(this.library)this.apply('right',this.library.right.rest)}}
 update(){
  const now=performance.now(),dt=Math.min(.1,(now-this.last)/1000);this.last=now;
  if(this.paused||!this.library)return;
  this.model.host.dataset.handPaused='false';
  if(this.transition){
   const t=this.transition;t.elapsed+=dt;
   const progress=Math.max(0,Math.min(1,(t.elapsed-t.delay)/t.duration));
   this.apply('left',transitionPose(t.from,t.to,progress));
   if(progress===1){this.key=t.key;this.model.host.dataset.handPose=t.key;this.transition=null}
  }
  if(this.motion){
   const m=this.motion;m.elapsed=Math.min(m.duration,m.elapsed+dt);
   let pose=rightPose(this.library.right,m.action,m.elapsed/m.duration,m.duration);
   if(m.from&&m.elapsed<.035)pose=blendPose(m.from,pose,m.elapsed/.035);
   this.apply('right',pose);
   if(m.elapsed===m.duration)this.motion=null;
  }
 }
}
