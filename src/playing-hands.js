import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {HandRig} from './hand-rig.js';
import poses from './hand-poses.json';
import rightPoses from './right-hand-poses.json';

const smooth=t=>t*t*(3-2*t);
export class PlayingHands {
 constructor(model){
  this.model=model;this.enabled=true;this.loaded=false;this.frets=[0,0,0,0];this.fingers=[0,0,0,0];
  this.changedAt=0;this.lastPulse=-1;this.handGroup=new THREE.Group();model.group.add(this.handGroup);this.makeControls();
  const loader=new GLTFLoader();
  Promise.all([loader.loadAsync('/models/left.glb'),loader.loadAsync('/models/right.glb')]).then(([l,r])=>{
   this.left=new HandRig(l,'left',this.handGroup);this.right=new HandRig(r,'right',this.handGroup);
   this.left.apply(poses.open);this.right.apply(rightPoses.D);this.right.highlight([0]);
   this.loaded=true;model.host.dataset.hands='loaded';this.set(this.frets,this.fingers);
  }).catch(error=>{model.host.dataset.hands='unavailable';this.toggle.textContent='手部加载失败，点击重试';this.toggle.onclick=()=>location.reload();console.error('Hand models unavailable',error);});
 }
 makeControls(){
  const host=this.model.host;
  this.toggle=document.createElement('button');this.toggle.className='hands-toggle';this.toggle.textContent='示范手：开';this.toggle.setAttribute('aria-pressed','true');
  this.toggle.onclick=()=>{this.enabled=!this.enabled;this.handGroup.visible=this.enabled;this.toggle.textContent='示范手：'+(this.enabled?'开':'关');this.toggle.setAttribute('aria-pressed',String(this.enabled));};host.appendChild(this.toggle);
  const panel=host.closest('.visual-panel'),toolbar=panel?.querySelector('.panel-toolbar');
  if(toolbar){
   const expand=document.createElement('button');expand.className='expand-demo';expand.textContent='⤢ 放大';expand.setAttribute('aria-label','放大演示区域');toolbar.appendChild(expand);
   const toggle=()=>{const expanded=panel.classList.toggle('demo-expanded');expand.textContent=expanded?'⤡ 收起':'⤢ 放大';expand.setAttribute('aria-label',expanded?'收起演示区域':'放大演示区域');};
   expand.onclick=toggle;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('demo-expanded'))toggle();});
  }
  const near=document.createElement('span');near.className='player-position';near.textContent='彩色手指：当前按弦';host.appendChild(near);
 }
 set(frets,fingers){
  const key=frets.join()+':'+fingers.join();
  this.frets=[...frets];this.fingers=[...fingers];
  if(!this.loaded||this.poseKey===key)return;
  this.poseKey=key;
  const pose=Object.values(poses).find(p=>p.frets.join()===frets.join()&&p.fingers.join()===fingers.join())||poses.open;
  this.from=this.left.snapshot();this.to=pose;this.changedAt=performance.now();
  this.keepContact=this.previousPose&&pose.frets.some((f,i)=>f>0&&f===this.previousPose.frets[i]&&pose.fingers[i]===this.previousPose.fingers[i]);
  this.previousPose=pose;
  this.left.highlight([...new Set(fingers.filter(f=>f>0).map(f=>f-1))]);
 }
 render(elapsed,active){
  if(!this.loaded||!this.enabled)return;
  const t=Math.min(1,(performance.now()-this.changedAt)/480);
  if(this.from&&this.to){this.left.blend(this.from,this.to,smooth(t));if(!this.keepContact)this.left.root.position.z+=.13*Math.sin(t*Math.PI);}
  const action=this.model.direction==='U'?'D':this.model.direction;
  const pose=rightPoses[action]||rightPoses.D;
  if(this.lastPulse!==this.model.pulseTime){this.lastPulse=this.model.pulseTime;this.rightFrom=this.right.snapshot();this.right.highlight([pose.finger]);}
  if(this.rightFrom)this.right.blend(this.rightFrom,pose,smooth(Math.min(1,Math.max(0,elapsed)/.07)));
  else this.right.apply(pose);
  if(action==='D'){
   const p=active?Math.min(1,elapsed/.25):.5;
   const angle=(this.model.direction==='U'?-1:1)*(-.46+.92*p);
   this.right.root.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),angle));
   this.right.root.position.z-=(pose.position[2]-.34)*(1-Math.cos(angle));
  }else if(active&&action.startsWith('P')){
   const p=Math.min(1,elapsed/.3),joint=this.right.chains[pose.finger][2];
   this.right.bones[joint].rotation.x-=.18*Math.sin(p*Math.PI);
  }else if(active&&action==='X')this.right.root.position.z+=.08*(1-Math.sin(Math.min(1,elapsed/.3)*Math.PI));
 }
}
