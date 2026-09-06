import {Vector3} from 'three';

// Same mapped teaching view as the accepted study. It is not a literal eye camera.
export function installPlayingView(model){
 model.group.scale.y=-1;
 model.group.rotation.set(-.12,0,-.38);
 model.controls.maxDistance=55;
 model.group.children.filter(o=>o.isSprite).forEach(o=>o.visible=false);
 model.view=mode=>{
  model.viewMode=mode;model.camera.up.set(0,1,0);
  const aspect=Math.max(.3,model.host.clientWidth/Math.max(1,model.host.clientHeight));
  let target=new Vector3(0,0,0),span=11.8;
  if(mode==='fret'){target.set(-2.3,.9,-.05);span=4.2}
  if(mode==='right'){target.set(1.55,-.65,.65);span=4.2}
  if(mode==='angle'){target.set(-2.35,.7,0);span=4.4}
  const distance=Math.max(mode==='front'?10.2:4,span/(1.75*Math.tan(35*Math.PI/360)*aspect));
  const offset=mode==='angle'?new Vector3(-.55,-.18,.82):mode==='right'?new Vector3(-.87,-.3,.39):new Vector3(0,-.12,.993);
  model.controls.target.copy(target);model.camera.position.copy(target).addScaledVector(offset,distance);model.controls.update();
  model.host.closest('.visual-panel').querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 };
}
