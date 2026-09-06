// Flat, non-realistic hand illustrations confined to the existing 3D viewport.
import {Vector3} from 'three';
const NS='http://www.w3.org/2000/svg';
export class GestureOverlay {
 constructor(model){this.model=model;this.frets=[0,0,0,0];this.fingers=[0,0,0,0];this.changedAt=0;this.enabled=true;
 this.svg=document.createElementNS(NS,'svg');this.svg.setAttribute('aria-label','弹奏手势示意，彩色手指对应按弦点，右手随拨弦和扫弦移动');this.svg.setAttribute('role','img');Object.assign(this.svg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',overflow:'hidden'});model.host.appendChild(this.svg);
 this.svg.innerHTML='<g id="gesture-left"></g><g id="gesture-right"></g>';
 this.left=this.svg.querySelector('#gesture-left');this.right=this.svg.querySelector('#gesture-right');
 this.toggle=document.createElement('button');this.toggle.type='button';this.toggle.textContent='手势示意：开';this.toggle.setAttribute('aria-pressed','true');Object.assign(this.toggle.style,{position:'absolute',left:'14px',bottom:'34px',fontSize:'10px',padding:'5px 8px',border:'1px solid #d9dfcd',borderRadius:'5px',background:'#fffdf5e8',color:'#6e8362',zIndex:'3'});this.toggle.onclick=()=>{this.enabled=!this.enabled;this.svg.style.display=this.enabled?'':'none';this.toggle.textContent='手势示意：'+(this.enabled?'开':'关');this.toggle.setAttribute('aria-pressed',String(this.enabled));};model.host.appendChild(this.toggle);
 }
 set(frets,fingers){const changed=frets.join()!==this.frets.join()||fingers.join()!==this.fingers.join();this.frets=[...frets];this.fingers=[...fingers];if(changed)this.changedAt=performance.now();}
 project(x,y,z=.35){const v=new Vector3(x,y,z).project(this.model.camera);return {x:(v.x+1)*this.model.host.clientWidth/2,y:(1-v.y)*this.model.host.clientHeight/2};}
 render(elapsed,active){if(!this.enabled)return;const m=this.model,w=m.host.clientWidth,h=m.host.clientHeight;this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const origin=this.project(-2.1,-.35),scale=Math.min(1,Math.max(.65,w/650));const palmY=Math.min(h-46,origin.y+68*scale),palmX=origin.x;const animated=Math.min(1,(performance.now()-this.changedAt)/700);const lift=18*Math.sin(animated*Math.PI);
 let hands='';const colors=['','#de8054','#779575','#6c92ad','#a487ae'];
 // Palm and thumb share a simple off-white line illustration, with no skin or joints.
 hands+=`<path d="M ${palmX-29*scale} ${palmY-9*scale} Q ${palmX-35*scale} ${palmY+20*scale} ${palmX-16*scale} ${palmY+27*scale} L ${palmX+18*scale} ${palmY+27*scale} Q ${palmX+35*scale} ${palmY+10*scale} ${palmX+30*scale} ${palmY-8*scale} L ${palmX+44*scale} ${palmY-23*scale} Q ${palmX+47*scale} ${palmY-32*scale} ${palmX+39*scale} ${palmY-29*scale} L ${palmX+24*scale} ${palmY-16*scale} Z" fill="#f8f7ed" fill-opacity=".94" stroke="#8d9b85" stroke-width="1.4"/>`;
 for(let finger=1;finger<=4;finger++){const x=palmX+(finger-2.5)*15*scale;const string=this.fingers.findIndex(f=>f===finger);const pressed=string>=0&&this.frets[string]>0;let target=pressed?this.project(m.fret(this.frets[string])-.085,-.27+string*.18,.38):{x:x,y:palmY-(finger===4?23:33)*scale};const tipY=target.y-(pressed?lift:0);const path=`M ${x} ${palmY} C ${x} ${palmY-29*scale}, ${target.x} ${tipY+28*scale}, ${target.x} ${tipY}`;
 hands+=`<path d="${path}" fill="none" stroke="${pressed?colors[finger]:'#8d9b85'}" stroke-width="${13*scale}" stroke-linecap="round"/><path d="${path}" fill="none" stroke="${pressed?colors[finger]:'#f8f7ed'}" stroke-width="${10*scale}" stroke-linecap="round"/>`;
 if(pressed)hands+=`<circle cx="${target.x}" cy="${target.y}" r="${9*scale}" stroke="${colors[finger]}" fill="none" stroke-width="1.7"/><text x="${target.x}" y="${tipY+3*scale}" font-size="${8*scale}" fill="white" font-family="sans-serif" text-anchor="middle">${finger}</text>`;
 }
 hands+=`<path d="M ${palmX-15*scale} ${palmY+26*scale}h${34*scale}v${10*scale}h${-34*scale}z" fill="#e3e8db" stroke="#8d9b85" stroke-width="1.2"/>`;
 this.left.innerHTML=hands;
 const base=this.project(1.36,active?m.pick.position.y:-.45,.38);const rightY=base.y+(active?0:12);const c=active?'#d68e57':'#8d9b85';
 this.right.innerHTML=`<g transform="translate(${base.x} ${rightY}) scale(${scale})"><path d="M 0 0 V 28 L 8 23 Q 13 20 17 27 Q 25 20 30 30 Q 38 25 41 34 L 39 57 Q 38 68 26 70 H 8 Q-3 65-10 54 L-21 39 Q-26 29-18 29 L-6 37 V0 Q-6-7 0-7 Q6-7 6 0 V25" fill="#f8f7ed" fill-opacity=".96" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"/><path d="M 8 69h22v10H8z" fill="#e3e8db" stroke="${c}" stroke-width="1.3"/>${active?`<circle cy="-3" r="10" fill="none" stroke="#e4a267" stroke-width="1.8"/>`:''}</g>`;
 }
}
