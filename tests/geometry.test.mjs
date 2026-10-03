import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initGeometry,modelData,binarySTL,objFiles,bufferGeometry,normalizePaths,strokePolygons,floodContours } from '../src/geometry.js';
await initGeometry();
const shape=(polygons,color='#4c325b')=>({id:'test',type:'fill',color,polygons});
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function inspect(data){const edges=new Map();let volume=0;for(const [a,b,c] of data.triangles){volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;for(const [p,q] of [[a,b],[b,c],[c,a]]){const keys=[p,q].map(p=>p.map(n=>n.toFixed(6)).join(','));const edge=[...keys].sort().join('|');const current=edges.get(edge)||{count:0,direction:0};current.count++;current.direction+=keys[0]<keys[1]?1:-1;edges.set(edge,current);}}
 const bad=[...edges.values()].filter(e=>e.count!==2||e.direction!==0);return {bad:bad.length,volume};}
const square=modelData([shape([rect(0,0,100,100)])],80,3);assert.equal(square.width,80);assert.equal(square.height,80);assert.equal(inspect(square).bad,0);assert.ok(Math.abs(inspect(square).volume-80*80*3)<1e-7);
const overlap=modelData([shape([rect(0,0,100,100)]),shape([rect(50,0,100,100)],'#fbbd30')],150,3);assert.equal(inspect(overlap).bad,0);assert.ok(Math.abs(inspect(overlap).volume-45000)<1e-7);
const withHole=shape(normalizePaths([rect(0,0,100,100),rect(25,25,50,50).reverse()]));const hole=modelData([withHole],100,4);assert.equal(inspect(hole).bad,0);assert.ok(Math.abs(inspect(hole).volume-30000)<1e-7);
const disconnected=modelData([shape([rect(0,0,20,20)]),shape([rect(40,0,20,20)])],60,2);assert.equal(disconnected.islands,2);assert.equal(inspect(disconnected).bad,0);
const crossing=[shape(strokePolygons([[10,10,.5],[90,90,.5]],'pen',10)),shape(strokePolygons([[10,90,.5],[90,10,.5]],'pen',10))];assert.equal(inspect(modelData(crossing,80,3)).bad,0);
const dot=modelData([shape(strokePolygons([[30,30,.5]],'pencil',10))],20,2);assert.ok(dot);assert.equal(inspect(dot).bad,0);
const crossingStress=[];for(let i=0;i<8;i++)crossingStress.push(shape(strokePolygons([[50,100+i*60,.5],[750,700-i*60,.5]],'pen',15),i%2?'#5ab3b1':'#4c325b'));assert.equal(inspect(modelData(crossingStress,80,3,true)).bad,0);
for(const part of modelData(crossingStress,80,3,true).parts)assert.equal(inspect(part).bad,0);
const binary=binarySTL(hole);assert.equal(binary.byteLength,84+hole.triangles.length*50);assert.equal(new DataView(binary).getUint32(80,true),hole.triangles.length);
const offsetOverlap=modelData([shape([rect(0,0,100,100)]),shape([rect(50,30,100,100)],'#5ab3b1')],100,3,true);assert.equal(inspect(offsetOverlap).bad,0);
const colorCrossing=modelData(crossing.map((s,i)=>({...s,color:i?'#5ab3b1':'#4c325b'})),80,3,true);assert.equal(inspect(colorCrossing).bad,0);
const colored=modelData([shape([rect(0,0,100,100)]),shape([rect(25,25,50,50)],'#5ab3b1')],100,3,true);const obj=objFiles(colored,'test');assert.ok(obj.obj.includes('mtllib test.mtl'));assert.ok(obj.obj.includes('usemtl color_1'));assert.ok(obj.obj.includes('usemtl color_2'));assert.equal((obj.mtl.match(/newmtl/g)||[]).length,2);assert.equal(colored.parts.length,2);for(const part of colored.parts)assert.equal(inspect(part).bad,0);
const relief=modelData([{...shape([rect(0,0,100,100)]),height:2},{...shape([rect(25,25,50,50)],'#5ab3b1'),height:5}],100,3,true);assert.equal(relief.thickness,5);assert.equal(inspect(relief).bad,0);assert.ok(Math.abs(inspect(relief).volume-27500)<1e-6);for(const part of relief.parts)assert.equal(inspect(part).bad,0);
const offsetRelief=modelData([{...shape([rect(0,0,100,100)]),height:2},{...shape([rect(50,30,100,100)],'#5ab3b1'),height:5}],150,3,true);assert.equal(inspect(offsetRelief).bad,0);for(const part of offsetRelief.parts)assert.equal(inspect(part).bad,0);
const preview=bufferGeometry(colored);assert.equal(preview.attributes.position.count,colored.parts.reduce((n,p)=>n+p.triangles.length*3,0));assert.equal(preview.attributes.color.count,preview.attributes.position.count);preview.dispose();
const stressRelief=modelData(crossingStress.map((s,i)=>({...s,height:2+i*.4})),80,3,true);assert.equal(inspect(stressRelief).bad,0);for(const part of stressRelief.parts)assert.equal(inspect(part).bad,0);
const res=40,alpha=new Uint8Array(res*res);for(let y=10;y<=30;y++)for(let x=10;x<=30;x++)if(x===10||x===30||y===10||y===30)alpha[y*res+x]=255;assert.ok(floodContours(alpha,res,20,20)?.length);assert.equal(floodContours(alpha,res,0,0),null);alpha[10*res+20]=0;assert.equal(floodContours(alpha,res,20,20),null);
assert.equal(modelData([],80,3),null);
fs.mkdirSync('tests/output',{recursive:true});fs.writeFileSync('tests/output/hole.stl',Buffer.from(binary));fs.writeFileSync('tests/output/colored.obj',obj.obj);fs.writeFileSync('tests/output/colored.mtl',obj.mtl);fs.writeFileSync('tests/output/colored.stl',Buffer.from(binarySTL(colored)));
console.log('Geometry checks passed: manifold closed STL, holes, overlap, crossing lines, separate islands, dot, scale, OBJ materials and bounded flood fill.');console.log('Colored mesh edge check:',inspect(colored));
