import {t} from './i18n.js';
// Traditional melody, independently transcribed in C major. One step is half a beat.
const pitches={
 C:{n:60,s:1,f:0,degree:1,solfege:'do'}, D:{n:62,s:1,f:2,degree:2,solfege:'re'},
 E:{n:64,s:2,f:0,degree:3,solfege:'mi'}, F:{n:65,s:2,f:1,degree:4,solfege:'fa'},
 G:{n:67,s:2,f:3,degree:5,solfege:'sol'}, A:{n:69,s:3,f:0,degree:6,solfege:'la'}
};
const phrases=['C C G G A A G','F F E E D D C','G G F F E E D','G G F F E E D','C C G G A A G','F F E E D D C'];
let cursor=0;
export const twinkleNotes=phrases.flatMap(phrase=>phrase.split(' ').map((pitch,i)=>{
 const beats=i===6?2:1,start=cursor;cursor+=beats*2;
 return {...pitches[pitch],pitch,beats,start,end:cursor};
}));
export const songLength=cursor;
export function songAt(step){
 const note=twinkleNotes.find(note=>step>=note.start&&step<note.end);
 return note?{...note,attack:step===note.start}:null;
}
export function songFrets(note){const frets=[0,0,0,0];frets[note.s]=note.f;return frets;}
export function songAction(step){const note=songAt(step);return note?.attack?'P'+(4-note.s):'H';}
export const twinkleLesson={type:'song',id:'twinkle',pattern:'pluck',bpm:60,sequence:Array(12).fill('C'),
title:t("小星星 · 第一首旋律"),
tag:t("小星星曲谱"),
subtitle:t("看简谱认旋律，看四线谱找弦和品，一次只弹一个音。"),
source:t("传统旋律 · 小星星"),
goal:t("弹完 12 小节的《小星星》，学会读空弦、品位和两拍长音。"),
tip:t("横线表示继续听上一个音，不要再拨一次。按弦的手指保持到下一个音之前。"),
steps:[t("先点曲谱中的音，听声音，再看琴上的按弦和拨弦示意。"),t("四线谱从上到下是 1、2、3、4 弦。线上的数字是品位，0 表示不用按弦。"),t("每个简谱数字弹一拍；数字后有横线，就连同横线保持两拍。先用慢速，再试着跟完整首。")],
sourceURL:"https://commons.wikimedia.org/wiki/File:Twinkle_Twinkle_Little_Star.png"};
export function scoreBar(bar){
 const label=t('第 {bar} 小节',{bar:bar+1});
 return `<div class="score-bar"><div class="score-bar-heading"><span>${label}</span><small>1 = C · 4/4</small></div><div class="score-staves"><div class="score-labels"><span>${t('简谱')}</span><small>A · 1</small><small>E · 2</small><small>C · 3</small><small>G · 4</small><span>${t('数拍')}</span></div>${Array.from({length:4},(_,beat)=>{
 const step=bar*8+beat*2,note=songAt(step);
 const label=t('第{bar}小节第{beat}拍',{bar:bar+1,beat:beat+1})+' · '+(note.attack?`${note.pitch} · ${t('{string} 弦 {fret} 品',{string:4-note.s,fret:note.f})}`:t('保持余音，不再拨弦'));
 return `<button class="score-beat" data-step="${step}" data-note-start="${note.start}" aria-label="${label}"><strong>${note.attack?note.degree:'—'}</strong>${[3,2,1,0].map(s=>`<span class="tab-string"><b>${note.attack&&note.s===s?note.f:''}</b></span>`).join('')}<small>${beat+1}</small></button>`;
 }).join('')}</div></div>`;
}
export function renderScore(){return Array.from({length:12},(_,bar)=>scoreBar(bar)).join('');}
