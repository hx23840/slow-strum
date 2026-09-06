import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chords,lessons,patterns,scaleNotes,tuning,lyrics,melody} from '../src/data.js';
import {transitionPose,rightPose,strokeDuration} from '../src/hand-motion.js';
import {AudioEngine} from '../src/audio.js';
const library=JSON.parse(fs.readFileSync(new URL('../public/models/course-poses.json',import.meta.url)));

test('all lesson chords and scale notes have matching finger poses',()=>{
 for(const [name,c] of Object.entries(chords)){
  const pose=library.left[c.frets.join('-')];assert.ok(pose,name);assert.deepEqual(pose.fingers,c.fingers);
 }
 for(const note of scaleNotes){const frets=[0,0,0,0];frets[note.s]=note.f;assert.ok(library.left[frets.join('-')]);assert.equal(tuning[note.s]+note.f,note.n)}
 assert.ok(library.left['0-0-0-0']);
 for(const l of lessons){assert.ok(patterns[l.pattern]);l.sequence.forEach(c=>assert.ok(chords[c]));}
 for(const p of Object.values(patterns)){assert.equal(p.length,8);p.forEach(a=>assert.match(a,/^(D|U|X|-|P[1-4])$/))}
 lyrics.forEach((line,i)=>{assert.equal(line.length,8);assert.equal(melody[i].length,8)});
});

test('Am to F keeps the supporting middle finger fixed through the transition',()=>{
 const am=library.left['2-0-0-0'],f=library.left['2-0-1-0'];
 for(let i=0;i<=24;i++){
  const pose=transitionPose(am,f,i/24);
  for(const name of Object.keys(am.held).filter(n=>n==='wrist'||n.startsWith('middle-'))){
   const a=pose[name],b=am.held[name];
   a.p.forEach((n,j)=>assert.ok(Math.abs(n-b.p[j])<1e-5));
   assert.ok(Math.abs(Math.abs(a.q.reduce((sum,n,j)=>sum+n*b.q[j],0))-1)<1e-5);
  }
 }
});

test('left transitions land on the selected pose, with finite normalized joints',()=>{
 const poses=Object.values(library.left);
 for(const from of poses)for(const to of poses){
  for(const t of [0,.25,.5,.75,1]){
   const value=transitionPose(from,to,t);
   for(const v of Object.values(value)){assert.ok([...v.p,...v.q].every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...v.q)-1)<1e-5)}
   if(t===0||t===1){const expected=t===0?from.held:to.held;value.wrist.p.forEach((n,j)=>assert.ok(Math.abs(n-expected.wrist.p[j])<1e-5))}
  }
 }
});

test('up and down sweeps follow opposite string order; a rest stays off the strings',()=>{
 for(const duration of [.25,.5,.75]){
  const end=strokeDuration(duration)/duration;
  const down0=rightPose(library.right,'D',0,duration),down1=rightPose(library.right,'D',end,duration);
  const up0=rightPose(library.right,'U',0,duration),up1=rightPose(library.right,'U',end,duration);
  assert.ok(down1.wrist.p[1]>down0.wrist.p[1]);assert.ok(up1.wrist.p[1]<up0.wrist.p[1]);
  assert.ok(rightPose(library.right,'-',.5,duration).wrist.p[2]>library.right.sweep.wrist.p[2]+.3);
 }
});

test('audio uses the chord frets and the same sweep duration in both directions',()=>{
 const audio=new AudioEngine(),notes=[];audio.note=(midi,delay)=>notes.push([midi,delay]);
 const duration=strokeDuration(.5);audio.chord(chords.F.frets,'D',duration);
 assert.deepEqual(notes.map(n=>n[0]),[69,60,65,69]);assert.ok(Math.abs(notes.at(-1)[1]-duration)<1e-9);
 notes.length=0;audio.chord(chords.G.frets,'U',duration);
 assert.deepEqual(notes.map(n=>n[0]),[71,67,62,67]);assert.ok(Math.abs(notes.at(-1)[1]-duration)<1e-9);
});
