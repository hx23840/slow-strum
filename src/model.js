import {t, html, languageURL} from './i18n.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import './demo.css';
import {CourseHands} from './course-hands.js';
export class Ukulele {
 constructor(host,options={}){
 this.host=host;this.scene=new THREE.Scene();this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label',t('尤克里里 3D 模型，可拖动旋转，滚轮缩放'));
 this.camera=new THREE.PerspectiveCamera(35,1,.1,100);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.minDistance=3;this.controls.maxDistance=18;this.controls.maxPolarAngle=Math.PI*.85;
 this.scene.add(new THREE.HemisphereLight(0xfff8eb,0x6f7b6b,1.65));const light=new THREE.DirectionalLight(0xfff3dc,2.1);light.position.set(-3,5,8);this.scene.add(light);const fill=new THREE.DirectionalLight(0xffffff,1);fill.position.set(5,-3,4);this.scene.add(fill);
 this.group=new THREE.Group();this.scene.add(this.group);this.strings=[];this.fingerGroup=new THREE.Group();this.group.add(this.fingerGroup);this.build();this.group.rotation.z=-.20;this.group.rotation.x=.10;this.setupDemo();if(options.sketch!==false)this.hands=new CourseHands(this);this.view('front');this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.pulseTime=-10;this.direction='D';this.activeString=-1;this.render=this.render.bind(this);this.render();
 }
 material(color,metalness=0){return new THREE.MeshStandardMaterial({color,roughness:metalness?.3:.65,metalness});}
 box(w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);this.group.add(m);return m;}
 label(text,x,y,z,color='#426153',size=.22){const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='bold 68px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,64,64);const texture=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(size,size,1);return sprite;}
 fret(n){return -3.05+7.05*(1-2**(-n/12));}
 build(){
 const woodCanvas=document.createElement('canvas');woodCanvas.width=512;woodCanvas.height=512;const c=woodCanvas.getContext('2d');c.fillStyle='#cf995e';c.fillRect(0,0,512,512);for(let i=0;i<550;i++){c.strokeStyle=`rgba(85,42,17,${.015+Math.random()*.07})`;c.beginPath();let y=Math.random()*512;c.moveTo(0,y);c.bezierCurveTo(160,y+8,360,y-8,512,y+3);c.stroke();}const tex=new THREE.CanvasTexture(woodCanvas);tex.colorSpace=THREE.SRGBColorSpace;const wood=new THREE.MeshStandardMaterial({map:tex,roughness:.43});const side=this.material('#7e4e2e');const dark=this.material('#382b23');const metal=this.material('#bdb9a9',.75);const cream=this.material('#f0e4c8');
 const shape=new THREE.Shape();shape.moveTo(.25,.5);shape.bezierCurveTo(.5,.9,.65,1.12,1.2,1.05);shape.bezierCurveTo(1.6,1,1.65,.72,2,.81);shape.bezierCurveTo(2.5,1.05,2.65,1.43,3.28,1.36);shape.bezierCurveTo(4.3,1.25,4.62,.75,4.62,0);shape.bezierCurveTo(4.62,-.75,4.3,-1.25,3.28,-1.36);shape.bezierCurveTo(2.65,-1.43,2.5,-1.05,2,-.81);shape.bezierCurveTo(1.65,-.72,1.6,-1,1.2,-1.05);shape.bezierCurveTo(.65,-1.12,.5,-.9,.25,-.5);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.52,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:3,steps:1,curveSegments:36});const body=new THREE.Mesh(geo,[wood,side]);body.position.z=-.55;this.group.add(body);
 // A real opening through the thin soundboard, above the dark cavity.
 const face=shape.clone();const hole=new THREE.Path();hole.absarc(1.36,0,.42,0,Math.PI*2,true);face.holes.push(hole);const top=new THREE.Mesh(new THREE.ShapeGeometry(face,40),wood);top.position.z=.032;this.group.add(top);
 const soundhole=new THREE.Mesh(new THREE.CircleGeometry(.418,64),this.material('#251b15'));soundhole.position.set(1.36,0,.035);this.group.add(soundhole);
 for(const r of [.455,.495]){const ring=new THREE.Mesh(new THREE.RingGeometry(r,r+.017,64),dark);ring.position.set(1.36,0,.042);this.group.add(ring);}
 this.box(3.55,.72,.28,-1.47,0,-.08,side);this.box(3.72,.64,.1,-1.23,0,.12,dark);this.box(.07,.7,.12,-3.05,0,.15,cream);
 for(let n=1;n<=12;n++){this.box(.022,.64,.025,this.fret(n),0,.183,metal);if([3,5,7,10,12].includes(n)){const dot=new THREE.Mesh(new THREE.CircleGeometry(.045,20),cream);dot.position.set((this.fret(n)+this.fret(n-1))/2,0,.179);this.group.add(dot);}if(n<=5)this.group.add(this.label(String(n),(this.fret(n)+this.fret(n-1))/2,.5,.2,'#8a8376',.23));}
 this.box(1.28,.8,.24,-3.75,0,-.03,side);this.box(.58,.82,.12,3.86,0,.105,dark);this.box(.075,.68,.08,3.96,0,.2,cream);
 for(let s=0;s<4;s++){let x=-3.5-Math.floor(s/2)*.51,y=s%2?.56:-.56;this.box(.12,.4,.12,x,y,0,metal);this.box(.27,.2,.18,x,y*1.22,0,cream);const peg=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.28,16),metal);peg.rotation.x=Math.PI/2;peg.position.set(x,s%2?.28:-.28,.13);this.group.add(peg);}
 for(let s=0;s<4;s++){const y=-.27+s*.18;const points=Array.from({length:97},(_,i)=>new THREE.Vector3(-3.05+i/96*7.05,y,.255));const g=new THREE.BufferGeometry().setFromPoints(points);const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:s===1?'#e7cf95':'#fff5d6'}));this.group.add(line);this.strings.push(line);this.group.add(this.label(['④ G','③ C','② E','① A'][s],-4.78,y*2.4,.2,'#667267',.44));}
 const pickShape=new THREE.Shape();pickShape.moveTo(0,-.22);pickShape.quadraticCurveTo(-.3,.16,0,.22);pickShape.quadraticCurveTo(.3,.16,0,-.22);this.pick=new THREE.Mesh(new THREE.ShapeGeometry(pickShape),new THREE.MeshBasicMaterial({color:'#dc8258',side:THREE.DoubleSide,transparent:true,opacity:.95}));this.pick.position.set(1.36,.75,.45);this.group.add(this.pick);
 }
 setFingers(frets,fingers){
  this.hands?.set(frets,fingers);
  for(const child of [...this.fingerGroup.children]){this.fingerGroup.remove(child);child.material?.map?.dispose();child.material?.dispose();}
  frets.forEach((f,s)=>{if(!f)return;const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(64,64,55,0,Math.PI*2);ctx.fillStyle=['','#be7750','#66855d','#668ba1','#987fa7'][fingers[s]]||'#557a50';ctx.fill();ctx.lineWidth=7;ctx.strokeStyle='#fffdf1';ctx.stroke();ctx.fillStyle='white';ctx.font='bold 49px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(fingers[s]),64,64);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));marker.position.set(this.fret(f)-.085,-.27+s*.18,.28);marker.scale.set(.32,.32,1);this.fingerGroup.add(marker);});
  this.fretDescription=frets.flatMap((f,s)=>f?[t('{string} 弦 {fret} 品',{string:4-s,fret:f})]:[]).join(' · ')||t('全部空弦，不用按');
  this.renderer.domElement.setAttribute('aria-label',t('尤克里里，左手按弦位置：{positions}。可拖动旋转，滚轮缩放',{positions:this.fretDescription}));
 }
 pulse(action,duration=.5){this.pulseTime=performance.now()/1000;this.showAction(action);this.hands?.trigger(action,duration);}
 pause(keepPose=false){this.pulseTime=-10;this.hands?.pause(keepPose);}
 prepareFingers(frets,duration){this.hands?.prepare(frets,duration);}
 view(v){this.viewMode=v;this.camera.up.set(0,1,0);const aspect=Math.max(.5,this.host.clientWidth/Math.max(1,this.host.clientHeight));let target=new THREE.Vector3(0,.15,0),distance=Math.max(7.2,10.3/(1.82*Math.tan(35*Math.PI/360)*aspect));if(v==='fret'){target.set(-2,.60,.2);distance=Math.max(5.5,4.4/(1.75*Math.tan(35*Math.PI/360)*aspect));}if(v==='angle'){target.set(-2,.4,0);this.camera.position.set(-5.8,-2.2,3.8);}else this.camera.position.set(target.x,target.y-distance*.35,target.z+distance*.94);this.controls.target.copy(target);this.controls.update();}

 setupDemo(){
  const panel=this.host.closest('.visual-panel');
  panel.querySelector('.live-label').innerHTML=html('<span class="dot"></span> 琴上弹奏示意');
  panel.querySelector('[data-view="front"]').textContent=t('完整琴');
  panel.querySelector('[data-view="fret"]').textContent=t('按弦特写');
  panel.querySelector('[data-view="angle"]').textContent=t('侧面');
  panel.querySelector('.finger-key').innerHTML=html('<span><i class="press-key"></i> 手指与圆点同色：按在这里</span><span><i class="play-key"></i> 橙色琴弦：拨响</span><small>箭头：拨弦方向</small>');
  panel.querySelector('.model-help').innerHTML=html('拖动转动琴 · 滚轮缩放 <span>左手按弦 · 右手拨弦</span>');
  this.actionHint=document.createElement('div');this.actionHint.className='demo-action-hint';this.host.append(this.actionHint);
  const expand=document.createElement('button');expand.className='expand-demo';expand.textContent=t('放大');expand.setAttribute('aria-label',t('放大演示区域'));expand.setAttribute('aria-expanded','false');
  const setExpanded=value=>{panel.classList.toggle('demo-expanded',value);expand.textContent=value?t('收起'):t('放大');expand.setAttribute('aria-label',value?t('收起演示区域'):t('放大演示区域'));expand.setAttribute('aria-expanded',String(value));};
  expand.onclick=()=>setExpanded(!panel.classList.contains('demo-expanded'));panel.querySelector('.panel-toolbar').append(expand);
  if(!/\/hand-study(?:\.html)?\/?$/.test(location.pathname)){const study=document.createElement('a');study.className='hand-study-link';study.href=languageURL('/hand-study.html');study.textContent=t('查看手部小样');panel.querySelector('.panel-toolbar').append(study);}
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setExpanded(false);});
  this.actionGroup=new THREE.Group();this.group.add(this.actionGroup);
  this.actionObserver=new MutationObserver(()=>this.syncAction());this.actionObserver.observe(panel.querySelector('#strum-symbol'),{childList:true,characterData:true,subtree:true});this.syncAction();
 }
 syncAction(){const symbol=this.host.closest('.visual-panel').querySelector('#strum-symbol').textContent.trim();this.showAction(({'↓':'D','↑':'U','×':'X','—':'-'})[symbol]||(/^[1-4]$/.test(symbol)?'P'+symbol:'-'));}
 showAction(action){
  this.direction=action;this.activeString=action.startsWith('P')?4-Number(action[1]):-1;
  if(this.shownAction===action)return;this.shownAction=action;
  for(const child of [...this.actionGroup.children]){this.actionGroup.remove(child);child.traverse(obj=>{obj.geometry?.dispose();obj.material?.map?.dispose();obj.material?.dispose();});}
  const color=0xde8054;
  if(action==='D'||action==='U'){
   const sign=action==='D'?1:-1;
   const mat=new THREE.MeshBasicMaterial({color:0xb45c32,depthTest:false});const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.15,12),mat);shaft.position.set(1.36,-sign*.04,.43);const tip=new THREE.Mesh(new THREE.ConeGeometry(.12,.26,16),mat.clone());tip.position.set(1.36,sign*.65,.43);tip.rotation.z=sign===1?0:Math.PI;this.actionGroup.add(shaft,tip);
  }else if(this.activeString>=0){
   const ring=new THREE.Mesh(new THREE.RingGeometry(.105,.14,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,depthTest:false}));ring.position.set(1.36,-.27+this.activeString*.18,.4);this.actionGroup.add(ring);
  }else if(action==='X'){this.actionGroup.add(this.label('×',1.36,0,.48,'#de8054',.7));}
  this.actionHint.textContent=action==='D'?t('向下扫 · 从 4 弦到 1 弦'):action==='U'?t('向上扫 · 从 1 弦到 4 弦'):action==='X'?t('轻触琴弦，让声音停下来'):action==='-'?t('这一拍不拨弦'):t('拨第 {string} 弦 · 看橙色琴弦',{string:action.slice(1)});
 }

 resize(){const {width,height}=this.host.getBoundingClientRect();this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.view(this.viewMode||'front');}
 render(){this.frame=requestAnimationFrame(this.render);let elapsed=performance.now()/1000-this.pulseTime;const active=elapsed<.38;this.pick.visible=false;let p=Math.min(elapsed/.25,1);this.pick.position.y=this.activeString>=0?-.27+this.activeString*.18:(this.direction==='U'?1:-1)*(.62-p*1.24);
 this.strings.forEach((line,s)=>{const pos=line.geometry.attributes.position;const vibrate=active&&(this.activeString<0||s===this.activeString)&&this.direction!=='X'&&this.direction!=='-';for(let i=0;i<pos.count;i++)pos.setZ(i,.255+(vibrate?.023*Math.sin(i/96*Math.PI)*Math.sin(elapsed*110)*Math.exp(-elapsed*10):0));pos.needsUpdate=true;line.material.color.set((this.direction==='D'||this.direction==='U'||s===this.activeString)?'#e69860':s===1?'#e7cf95':'#fff5d6');});this.controls.update();this.hands?.update();this.renderer.render(this.scene,this.camera);}
}
