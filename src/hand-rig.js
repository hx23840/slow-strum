import * as THREE from 'three';
import {CCDIKSolver} from 'three/addons/animation/CCDIKSolver.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const basis=new THREE.Matrix4().set(0,0,1,0,0,-1,0,0,1,0,0,0,0,0,0,1);
const fingers=['index-finger','middle-finger','ring-finger','pinky-finger'];
const parts=['metacarpal','phalanx-proximal','phalanx-intermediate','phalanx-distal','tip'];
const thumb=['thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'];
export class HandRig {
  constructor(gltf,side,parent){
    this.side=side;
    this.root=new THREE.Group();parent.add(this.root);
    let source;gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(o=>{if(o.isSkinnedMesh)source=o;});
    source.skeleton.update();
    const wrist=source.skeleton.bones.find(b=>b.name==='wrist').getWorldPosition(V());
    const transform=new THREE.Matrix4().makeScale(14,14,14).multiply(basis).multiply(new THREE.Matrix4().makeTranslation(-wrist.x,-wrist.y,-wrist.z));
    this.rest={};this.bones={};
    const boneList=source.skeleton.bones.map(b=>{
      const bone=new THREE.Bone();bone.name=b.name;
      const p=b.getWorldPosition(V()).applyMatrix4(transform);
      this.rest[b.name]=p;bone.position.copy(p);this.bones[b.name]=bone;return bone;
    });
    const chains=[...fingers.map(f=>parts.map(p=>`${f}-${p}`)),thumb];
    this.root.add(this.bones.wrist);
    for(const names of chains){let previous='wrist';for(const name of names){this.bones[previous].add(this.bones[name]);this.bones[name].position.copy(this.rest[name]).sub(this.rest[previous]);previous=name;}}
    // WebXR assets store independent tracked joints. Rebuild the hierarchy and
    // bind to its unchanged rest surface before applying rotational animation.
    const geometry=source.geometry.clone();
    const positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const p=V().fromBufferAttribute(source.geometry.attributes.position,i);
      source.applyBoneTransform(i,p);p.applyMatrix4(source.matrixWorld).applyMatrix4(transform);
      positions.setXYZ(i,p.x,p.y,p.z);
    }
    geometry.attributes.normal.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(transform.clone().multiply(source.matrixWorld)));
    this.mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.92,metalness:0}));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(positions.count*3).fill(1),3));
    this.mesh.frustumCulled=false;this.root.add(this.mesh);
    this.root.updateMatrixWorld(true);
    this.mesh.bind(new THREE.Skeleton(boneList));
    this.chains=chains;this.constraints=[];
    this.targetBones=[];
    for(let fi=0;fi<5;fi++){
      const target=new THREE.Bone();target.name=`target-${fi}`;this.root.add(target);
      const index=boneList.length;boneList.push(target);this.targetBones.push(target);
      const names=chains[fi];
      const links=fi<4?[3,2,1].map((j)=>({index:boneList.indexOf(this.bones[names[j]]),rotationMin:V(j===1?-1.65:j===2?-1.95:-1.25,0,j===1?-.55:0),rotationMax:V(j===1?-.12:j===2?-.45:-.20,0,j===1?.55:0)})):
        [2,1,0].map(j=>({index:boneList.indexOf(this.bones[names[j]]),rotationMin:V(-1.2,j===0?-.8:0,j===0?-1.6:-.3),rotationMax:V(.4,j===0?.8:0,j===0?.6:.3)}));
      if(side==='left')for(const link of links){const lo=link.rotationMin.x;link.rotationMin.x=-link.rotationMax.x;link.rotationMax.x=-lo;}
      this.constraints.push({target:index,effector:boneList.indexOf(this.bones[names.at(-1)]),links,iteration:64,maxAngle:.12});
    }
    // Add targets without changing the original skin index ordering.
    this.mesh.skeleton=new THREE.Skeleton(boneList,[...this.mesh.skeleton.boneInverses,...this.targetBones.map(()=>new THREE.Matrix4())]);
    this.solver=new CCDIKSolver(this.mesh,this.constraints);
    this.limits=this.constraints.flatMap(ik=>ik.links);
    const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.29,.34,.9,40),new THREE.MeshStandardMaterial({color:'#809386',roughness:1}));
    cuff.position.set(-.02,-.42,0);cuff.scale.z=.72;this.root.add(cuff);
    this.highlight([]);
    this.reset();
  }
  reset(){for(const b of Object.values(this.bones))b.quaternion.identity();}
  curl(fi,a,b,c,splay=0){const chain=this.chains[fi];this.bones[chain[1]].rotation.set(a,0,splay);this.bones[chain[2]].rotation.set(b,0,0);this.bones[chain[3]].rotation.set(c,0,0);}
  place(position,rotation){this.root.position.fromArray(position);this.root.rotation.set(...rotation);this.root.updateMatrixWorld(true);}
  solve(targets){this.root.updateMatrixWorld(true);for(const [fi,p] of Object.entries(targets)){this.targetBones[fi].position.copy(this.root.worldToLocal(p.clone()));this.root.updateMatrixWorld(true);this.solver.updateOne(this.constraints[fi]);}this.root.updateMatrixWorld(true);}
  tip(fi){return this.bones[this.chains[fi].at(-1)].getWorldPosition(V());}
  snapshot(){return {position:this.root.position.toArray(),rotation:this.root.quaternion.toArray(),bones:Object.fromEntries(Object.entries(this.bones).map(([n,b])=>[n,b.quaternion.toArray()]))};}
  highlight(active){
    const color=this.mesh.geometry.attributes.color,indices=this.mesh.geometry.attributes.skinIndex,weights=this.mesh.geometry.attributes.skinWeight;
    const base=new THREE.Color('#d8ceba'),palette=['#df956f','#96ad85','#83a9bf','#b39abc','#df956f'].map(c=>new THREE.Color(c));
    for(let i=0;i<color.count;i++){
      const result=base.clone();let selected=-1,amount=0;
      for(const fi of active){const chain=this.chains[fi].slice(1);let weight=0;
        for(let j=0;j<4;j++)if(chain.includes(this.mesh.skeleton.bones[indices.getComponent(i,j)]?.name))weight+=weights.getComponent(i,j);
        if(weight>amount){amount=weight;selected=fi;}
      }
      if(selected>=0)result.lerp(palette[selected],Math.min(1,amount*1.1));
      color.setXYZ(i,result.r,result.g,result.b);
    }
    color.needsUpdate=true;
  }
  apply(pose){this.root.position.fromArray(pose.position);this.root.quaternion.fromArray(pose.rotation);for(const [name,q] of Object.entries(pose.bones))this.bones[name].quaternion.fromArray(q);}
  blend(a,b,t){this.root.position.fromArray(a.position).lerp(V().fromArray(b.position),t);this.root.quaternion.fromArray(a.rotation).slerp(new THREE.Quaternion().fromArray(b.rotation),t);for(const [name,q] of Object.entries(b.bones)){const from=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(a.bones[name]));const to=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().fromArray(q));this.bones[name].rotation.set(THREE.MathUtils.lerp(from.x,to.x,t),THREE.MathUtils.lerp(from.y,to.y,t),THREE.MathUtils.lerp(from.z,to.z,t));}}
}
