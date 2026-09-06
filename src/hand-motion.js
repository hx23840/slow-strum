import {Quaternion} from 'three';

const clamp=t=>Math.max(0,Math.min(1,t));
export const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
export const poseKey=frets=>frets.join('-');
export const strokeDuration=stepDuration=>Math.min(.18,stepDuration*.55);

export function blendPose(a,b,t){
 t=clamp(t);const out={};
 for(const name of Object.keys(b)){
  const from=a[name]||b[name],to=b[name];
  out[name]={p:to.p.map((n,i)=>from.p[i]+(n-from.p[i])*t),q:new Quaternion().fromArray(from.q).slerp(new Quaternion().fromArray(to.q),t).toArray()};
 }
 return out;
}

export function transitionPose(from,to,t){
 const shared=new Set();
 from.frets.forEach((f,s)=>{if(f&&f===to.frets[s]&&from.fingers[s]===to.fingers[s])shared.add(['index','middle','ring','pinky'][from.fingers[s]-1])});
 // Am and F share the same wrist and supporting middle finger in the library.
 const sameWrist=from.held.wrist.p.every((n,i)=>Math.abs(n-to.held.wrist.p[i])<1e-5)&&from.held.wrist.q.every((n,i)=>Math.abs(n-to.held.wrist.q[i])<1e-5);
 const lift=pose=>Object.fromEntries(Object.entries(pose.lift).map(([name,value])=>[name,sameWrist&&[...shared].some(f=>name.startsWith(f+'-'))?pose.held[name]:value]));
 const a=lift(from),b=lift(to);
 let pose=t<.25?blendPose(from.held,a,ease(t/.25)):t<.75?blendPose(a,b,ease((t-.25)/.5)):blendPose(b,to.held,ease((t-.75)/.25));
 // Give the supporting thumb space around the neck while changing hand position.
 if(!sameWrist)pose=moveWrist(pose,.7*Math.sin(Math.PI*clamp(t))**2,0);
 return pose;
}

function moveWrist(pose,y=0,z=0){
 return {...pose,wrist:{...pose.wrist,p:pose.wrist.p.map((n,i)=>n+(i===1?y:i===2?z:0))}};
}

export function rightPose(poses,action,progress,duration=.5){
 const p=clamp(progress);
 if(/^P[1-4]$/.test(action)){
  const pull=Math.sin(Math.PI*clamp(p*duration/Math.min(.3,duration)))**2;
  return blendPose(poses.rest,poses[action],pull);
 }
 if(action==='D'||action==='U'){
  const t=clamp(p*duration/strokeDuration(duration));
  const sign=action==='D'?1:-1;
  // One sweep across the four strings, then lift away from the soundboard.
  return moveWrist(poses.sweep,sign*(-.38+.76*t)+.1,t===1?.18*ease((p*duration-strokeDuration(duration))/Math.max(.01,duration-strokeDuration(duration))):0);
 }
 if(action==='X')return moveWrist(poses.rest,0,-.035*Math.sin(Math.PI*p));
 return moveWrist(poses.sweep,.55*Math.cos(Math.PI*p),.32);
}
