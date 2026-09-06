import {tuning} from './data.js';
export class AudioEngine {
 constructor(){this.ctx=null;this.voices=[];this.muted=false;}
 async init(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.55;this.master.connect(this.ctx.destination);}await this.ctx.resume();}
 get time(){return this.ctx?.currentTime??0;}
 note(midi,delay=0,duration=1.2,soft=false){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay;const freq=440*2**((midi-69)/12);let source;
 if(soft){source=this.ctx.createOscillator();source.type='sine';source.frequency.value=freq;}else{
 const size=Math.round(this.ctx.sampleRate*duration);const buffer=this.ctx.createBuffer(1,size,this.ctx.sampleRate);const out=buffer.getChannelData(0);const period=Math.round(this.ctx.sampleRate/freq);for(let i=0;i<period;i++)out[i]=(Math.random()*2-1)*.7;for(let i=period;i<size;i++)out[i]=.496*(out[i-period]+out[i-period+1]);source=this.ctx.createBufferSource();source.buffer=buffer;}
 const gain=this.ctx.createGain();gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(soft?.22:.5,t+.005);gain.gain.exponentialRampToValueAtTime(.001,t+duration);source.connect(gain);gain.connect(this.master);source.start(t);source.stop(t+duration);this.voices.push({source,gain});source.onended=()=>{source.disconnect();gain.disconnect();this.voices=this.voices.filter(v=>v.source!==source);};}
 chord(frets,direction='D',sweep=.057){const order=direction==='U'?[3,2,1,0]:[0,1,2,3];order.forEach((s,i)=>this.note(tuning[s]+frets[s],i*sweep/3));}
 click(accent=false){this.note(accent?89:84,0,.06,true);}
 stop(){for(const v of this.voices){try{v.source.stop();}catch{}}this.voices=[];}
 mute(){this.stop();if(!this.ctx||this.muted)return;this.note(45,0,.055);}
}
