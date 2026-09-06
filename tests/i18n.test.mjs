import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseAst} from 'rollup/parseAst';
import english from '../src/locales/en.js';
import {translate,resolveLocale,html} from '../src/i18n.js';
import {lessons,chords,lyrics} from '../src/data.js';
import {readPracticeSession} from '../src/practice-session.js';

test('English is the default; explicit and saved valid choices take precedence',()=>{
 assert.equal(resolveLocale(null,null),'en');
 assert.equal(resolveLocale('fr','broken'),'en');
 assert.equal(resolveLocale(null,'zh-CN'),'zh-CN');
 assert.equal(resolveLocale('en','zh-CN'),'en');
 assert.equal(resolveLocale('zh-CN','en'),'zh-CN');
});
test('dynamic prompts use complete sentences in both languages',()=>{
 const key='拨第 {string} 弦，{position}。每半拍弹一个音。';
 assert.equal(translate(key,{string:3,position:translate('按 {fret} 品',{fret:2},'en')},'en'),'Pluck string 3, press fret 2. Play one note per half beat.');
 assert.equal(translate(key,{string:3,position:translate('按 {fret} 品',{fret:2},'zh-CN')},'zh-CN'),'拨第 3 弦，按 2 品。每半拍弹一个音。');
 assert.equal(translate('第{bar}小节第{beat}拍后半拍',{bar:2,beat:4},'en'),'Bar 2, beat 4, offbeat');
 for(const [key,value] of Object.entries(english))assert.deepEqual([...key.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...value.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),key);
});
test('render messages have English coverage, including text and accessible labels',()=>{
 const missing=new Set();
 const check=source=>{const key=source.trim();if(/\p{Script=Han}/u.test(key)&&!Object.hasOwn(english,key))missing.add(key)};
 const markup=source=>{
  for(const m of source.matchAll(/(?:^|>)([^<>]*)(?=<|$)/g))check(m[1]);
  for(const m of source.matchAll(/(?:aria-label|title)="([^"]*)"/g))check(m[1]);
 };
 for(const file of ['data.js','studio.js','model.js','course-hands.js','hand-study.js']){
  function visit(n){
   if(!n||typeof n!=='object')return;
   if(n.type==='Literal'&&typeof n.value==='string')n.value.includes('<')?markup(n.value):check(n.value);
   if(n.type==='TemplateLiteral')n.quasis.forEach(q=>q.value.cooked.includes('<')?markup(q.value.cooked):check(q.value.cooked));
   for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v)}
  }
  visit(parseAst(fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8')));
 }
 assert.deepEqual([...missing],[]);
 assert.equal(html('<button aria-label="下一半拍">开始跟练</button>'),'<button aria-label="Next half beat">Start practice</button>');
});
test('all courses and chords are localized; singing stays at eight single-syllable words per line',()=>{
 for(const lesson of lessons)for(const key of ['title','tag','subtitle','source','goal','tip'])assert.doesNotMatch(lesson[key],/\p{Script=Han}/u);
 for(const lesson of lessons)lesson.steps.forEach(s=>assert.doesNotMatch(s,/\p{Script=Han}/u));
 for(const chord of Object.values(chords))for(const key of ['name','hint','why'])assert.doesNotMatch(chord[key],/\p{Script=Han}/u);
 assert.deepEqual(lyrics.map(line=>line.length),[8,8,8,8]);
 assert.equal(lyrics[0].join(' '),'Soft winds blow through leaves up in trees');
});
test('language-switch snapshots preserve practice choices and reject corrupt state',()=>{
 assert.equal(readPracticeSession(null,3),null);assert.equal(readPracticeSession({lesson:2},3),null);
 const valid={lesson:3,step:17,bpm:84,pattern:'mute',mode:'single',selectedChord:'G7',loop:false,metronome:false,melody:true,sound:false,contacts:true,view:'fret'};
 const {lesson,...settings}=valid;assert.deepEqual(readPracticeSession(valid,3),settings);
 assert.deepEqual(readPracticeSession({lesson:3,step:-1,bpm:999,view:'invalid',sound:'false',selectedChord:'<x>'},3),{});
});
