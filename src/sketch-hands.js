import {Vector3} from 'three';
const NS='http://www.w3.org/2000/svg';
const colors=['','#be7750','#66855d','#668ba1','#987fa7'];
const mix=(a,b,t)=>a+(b-a)*t;
// Deliberately flat line drawings. Two fixed-length segments per finger, no skin mesh.
export class SketchHands {
 constructor(model){
  this.model=model;this.frets=[0,0,0,0];this.fingers=[0,0,0,0];this.targets=null;this.previous=null;this.changed=0;
  this.svg=document.createElementNS(NS,'svg');this.svg.setAttribute('role','img');this.svg.setAttribute('aria-label','琴上的简笔画手指：左手按弦，右手拨动');this.svg.classList.add('sketch-hands');
  this.svg.innerHTML='<g class="sketch-left"></g><g class="sketch-right"></g>';model.host.append(this.svg);this.left=this.svg.firstElementChild;this.right=this.svg.lastElementChild;
 }
 set(frets,fingers){if(frets.join()!==this.frets.join()||fingers.join()!==this.fingers.join()){this.previous=this.targets;this.changed=performance.now();}this.frets=[...frets];this.fingers=[...fingers];}
 project(x,y,z=.30){const v=new Vector3(x,y,z).applyMatrix4(this.model.group.matrixWorld).project(this.model.camera);return{x:(v.x+1)*this.model.host.clientWidth/2,y:(1-v.y)*this.model.host.clientHeight/2};}
 render(elapsed,active){
  const m=this.model;const w=m.host.clientWidth,h=m.host.clientHeight;this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const near=this.project(m.fret(2),0),far=this.project(m.fret(1),0);const scale=Math.max(.4,Math.min(3,Math.hypot(near.x-far.x,near.y-far.y)/35));
  const pressed=this.frets.flatMap((f,s)=>f?[{finger:this.fingers[s],...this.project(m.fret(f)-.085,-.27+s*.18)}]:[]);
  const origin=pressed.length?{x:pressed.reduce((n,p)=>n+p.x,0)/pressed.length,y:Math.max(...pressed.map(p=>p.y))+42*scale}:this.project(-2,-.8);
  const progress=Math.min(1,(performance.now()-this.changed)/350);const t=progress*progress*(3-2*progress);const lift=Math.sin(progress*Math.PI)*8*scale;
  let drawing='';this.targets=[];
  // A small palm outline links the four fingers, while keeping the fretboard visible.
  drawing+=`<path d="M${origin.x-29*scale} ${origin.y} Q${origin.x-34*scale} ${origin.y+30*scale} ${origin.x-15*scale} ${origin.y+37*scale} L${origin.x+20*scale} ${origin.y+37*scale} Q${origin.x+38*scale} ${origin.y+21*scale} ${origin.x+30*scale} ${origin.y} Z" fill="#fffdf3" fill-opacity=".88" stroke="#71816c" stroke-width="${1.6*scale}"/>`;
  for(let f=1;f<=4;f++){
   const root={x:origin.x+(f-2.5)*16*scale,y:origin.y+3*scale};const hit=pressed.find(p=>p.finger===f);
   let tip=hit?{x:hit.x,y:hit.y}:{x:root.x+(f-2.5)*9*scale,y:root.y-(f===4?22:30)*scale};
   if(this.previous?.[f-1]&&progress<1){tip={x:mix(this.previous[f-1].x,tip.x,t),y:mix(this.previous[f-1].y,tip.y,t)-lift};}
   this.targets.push(tip);
   const l1=43*scale,l2=36*scale;let dx=tip.x-root.x,dy=tip.y-root.y;const distance=Math.hypot(dx,dy);const d=Math.max(Math.abs(l1-l2)+.01,Math.min(l1+l2-.01,distance));
   // Locate the knuckle without stretching either finger segment.
   const a=Math.atan2(dy,dx);const bend=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
   const joint={x:root.x+Math.cos(a+(f<3?-1:1)*bend)*l1,y:root.y+Math.sin(a+(f<3?-1:1)*bend)*l1};
   const end=distance>d?{x:root.x+dx*d/distance,y:root.y+dy*d/distance}:tip;
   const before={x:mix(root.x,joint.x,.83),y:mix(root.y,joint.y,.83)},after={x:mix(joint.x,end.x,.17),y:mix(joint.y,end.y,.17)};
   const path=hit?`M${root.x} ${root.y} L${before.x} ${before.y} Q${joint.x} ${joint.y} ${after.x} ${after.y} L${end.x} ${end.y}`:`M${root.x} ${root.y} Q${root.x+13*scale} ${root.y-28*scale} ${root.x+17*scale} ${root.y-10*scale} Q${root.x+18*scale} ${root.y+2*scale} ${root.x+5*scale} ${root.y+1*scale}`;
   const color=hit?colors[f]:'#9ba591';
   drawing+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="${11*scale}" stroke-linecap="round" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="#fffdf3" stroke-width="${7.5*scale}" stroke-linecap="round" stroke-linejoin="round"/>`;
   if(hit)drawing+=`<circle cx="${end.x}" cy="${end.y}" r="${4.3*scale}" fill="${color}"/><circle cx="${tip.x}" cy="${tip.y}" r="${7*scale}" fill="none" stroke="${color}" stroke-width="${1.4*scale}" opacity="${.4+.6*t}"/>`;
  }
  drawing+=`<path d="M${origin.x+23*scale} ${origin.y+20*scale} Q${origin.x+45*scale} ${origin.y+7*scale} ${origin.x+44*scale} ${origin.y-7*scale}" fill="none" stroke="#71816c" stroke-width="${11*scale}" stroke-linecap="round"/><path d="M${origin.x+23*scale} ${origin.y+20*scale} Q${origin.x+45*scale} ${origin.y+7*scale} ${origin.x+44*scale} ${origin.y-7*scale}" fill="none" stroke="#fffdf3" stroke-width="${7.5*scale}" stroke-linecap="round"/>`;
  this.left.innerHTML=drawing;
  const action=m.direction;const single=action.startsWith('P');const moving=active&&action!=='-'&&action!=='X';const y=single?-.27+m.activeString*.18:moving?m.pick.position.y:-.43;
  const tip=this.project(1.36,y,.29);const color=action==='-'?'#829077':'#bc7950';
  const outline=action==='X'?'M0 0L40 0Q47 1 46 7L30 10L43 12Q50 17 42 21L28 22L38 26Q43 32 35 35L22 32L29 38Q32 45 23 44L-1 34L-16 15Q-20 6-13 5L0 15Z':single?'M0 0Q-7-4-9 2Q-10 7-4 12L16 31L24 55Q29 64 44 61Q58 59 57 44L51 26Q47 18 41 23Q36 15 30 21Q25 13 20 20L14 14Z':'M0 0Q-7-2-8 5L-8 35L-16 29Q-23 27-22 35L-8 55Q-3 65 12 65L30 64Q39 62 40 50L40 32Q39 23 31 28Q27 20 20 26Q15 17 8 24L7 5Q7-1 0 0Z';
  this.right.innerHTML=`<g transform="translate(${tip.x} ${tip.y}) scale(${scale*.85})"><path d="${outline}" fill="#fffdf3" fill-opacity=".93" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><path d="M12 34V46M23 32V46M32 35V45" fill="none" stroke="${color}" stroke-width="1.3"/>${moving?'<circle cx="0" cy="4" r="5" fill="#d99560"/>':''}</g>`;
 }
}
