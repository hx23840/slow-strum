import test from 'node:test';
import assert from 'node:assert/strict';
import {twinkleNotes,songLength,songAt,songFrets,songAction,renderScore} from '../src/song.js';
import {tuning,lessons} from '../src/data.js';
import {readPracticeSession} from '../src/practice-session.js';

test('Twinkle contains the complete six phrases and twelve full bars',()=>{
 assert.equal(twinkleNotes.length,42);
 assert.equal(songLength,96);
 assert.deepEqual(Array.from({length:6},(_,i)=>twinkleNotes.slice(i*7,i*7+7).map(n=>n.pitch).join(' ')),[
  'C C G G A A G','F F E E D D C','G G F F E E D',
  'G G F F E E D','C C G G A A G','F F E E D D C'
 ]);
 assert.equal(twinkleNotes.filter(n=>n.beats===2).length,6);
 for(const note of twinkleNotes)assert.equal(tuning[note.s]+note.f,note.n);
 assert.equal(songAt(96),null);
});
test('held beats neither pluck again nor release the fretted note',()=>{
 let attacks=0;
 for(let step=0;step<songLength;step++){
  const note=songAt(step);
  if(note.attack){attacks++;assert.equal(songAction(step),'P'+(4-note.s));}
  else{assert.equal(songAction(step),'H');assert.deepEqual(songFrets(note),songFrets(songAt(note.start)));}
 }
 assert.equal(attacks,42);
 assert.deepEqual([12,13,14,15].map(s=>songAt(s).pitch),['G','G','G','G']);
 assert.deepEqual(songFrets(songAt(15)),[0,0,3,0]);
});
test('score exposes all 48 beats, playable positions and late-song language state',()=>{
 const markup=renderScore();
 assert.equal((markup.match(/class="score-beat"/g)||[]).length,48);
 assert.equal((markup.match(/class="tab-string"/g)||[]).length,192);
 assert.match(markup,/data-step="94" data-note-start="92"/);
 const index=lessons.findIndex(l=>l.id==='twinkle');
 assert.equal(lessons[index].sequence.length*8,songLength);
 assert.deepEqual(readPracticeSession({lesson:index,step:94},index,songLength),{step:94});
 assert.deepEqual(readPracticeSession({lesson:index,step:96},index,songLength),{});
});
