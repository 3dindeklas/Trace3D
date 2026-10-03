import Module from 'manifold-3d';
import ClipperLib from 'clipper-lib';
import { getStroke } from 'perfect-freehand';
import * as THREE from 'three';
export const SIZE = 800;
const SCALE = 1000;
const C = ClipperLib;
const integerPaths = paths => paths.map(p=>p.map(([x,y])=>({X:Math.round(x*SCALE),Y:Math.round(y*SCALE)}))).filter(p=>p.length>=3);
const floatPaths = paths => paths.map(p=>p.map(q=>[q.X/SCALE,q.Y/SCALE]));
export function booleanPaths(subject, clip=[],operation='union') {
  const c = new C.Clipper(); c.PreserveCollinear = true; c.StrictlySimple = true;
  if(subject.length)c.AddPaths(integerPaths(subject),C.PolyType.ptSubject,true);
  if(clip.length)c.AddPaths(integerPaths(clip),C.PolyType.ptClip,true);
  const tree = new C.PolyTree();
  c.Execute(operation==='difference'?C.ClipType.ctDifference:operation==='intersection'?C.ClipType.ctIntersection:C.ClipType.ctUnion,tree,C.PolyFillType.pftNonZero,C.PolyFillType.pftNonZero);
  return tree;
}
export function flattenTree(tree){return floatPaths(C.Clipper.PolyTreeToPaths(tree));}
export function normalizePaths(paths){return flattenTree(booleanPaths(paths));}
export function strokePolygons(points,tool,size){
  const outline = getStroke(points,{size:size*(tool==='marker'?1.7:1),thinning:tool==='pencil'?.65:0,smoothing:.7,streamline:.35,simulatePressure:tool==='pencil'&&!points.some(p=>p[3]===1),last:true,start:{cap:true},end:{cap:true}});
  if(outline.length<3)return [];
  const paths = floatPaths(C.Clipper.SimplifyPolygons(integerPaths([outline]),C.PolyFillType.pftNonZero));
  return flattenTree(booleanPaths(paths,[[[0,0],[SIZE,0],[SIZE,SIZE],[0,SIZE]]],'intersection')); 
}
export function offsetPaths(paths,distance){const offset=new C.ClipperOffset(2,.1*SCALE);offset.AddPaths(integerPaths(paths),C.JoinType.jtRound,C.EndType.etClosedPolygon);const result=new C.Paths();offset.Execute(result,distance*SCALE);return floatPaths(result);}
export function pointInside(paths,x,y){
  let winding=0;
  for(const path of paths){let inside=false;for(let i=0,j=path.length-1;i<path.length;j=i++){
    const a=path[i],b=path[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }if(inside)winding += signedArea(path)>0?1:-1;}
  return winding!==0;
}
function signedArea(p){let a=0;for(let i=0,j=p.length-1;i<p.length;j=i++)a+=p[j][0]*p[i][1]-p[i][0]*p[j][1];return a/2;}
export function boundsOf(paths){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of paths)for(const [x,y] of p){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};}
export function regionsOf(tree){const regions=[];function walk(n){for(const child of n.Childs()){if(!child.IsHole()){regions.push({outer:floatPaths([child.Contour()])[0],holes:child.Childs().filter(c=>c.IsHole()).map(c=>floatPaths([c.Contour()])[0])});}walk(child);}}walk(tree);return regions;}
export function visibleParts(shapes){let covered=[];const result=[];for(let i=shapes.length-1;i>=0;i--){const tree=booleanPaths(shapes[i].polygons,covered,'difference');if(tree.ChildCount())result.push({shape:shapes[i],regions:regionsOf(tree)});covered=flattenTree(booleanPaths([...covered,...shapes[i].polygons]));}return result;}
function colorAt(shapes,x,y){for(let i=shapes.length-1;i>=0;i--)if(pointInside(shapes[i].polygons,x,y))return shapes[i].color;return shapes[0]?.color||'#4c325b';}
let kernel;
export async function initGeometry(){if(kernel)return;const options={};if(globalThis.__trace3dWasm)options.wasmBinary=Uint8Array.from(atob(globalThis.__trace3dWasm),c=>c.charCodeAt(0));else if(typeof window!=='undefined')options.locateFile=()=>new URL('/node_modules/manifold-3d/manifold.wasm',location.href).href;kernel=await Module(options);kernel.setup();}
// Each layer rises from the print bed. Later layers own overlapping material;
// taller earlier layers remain visible above a shorter later layer.
export function modelData(shapes,width=80,thickness=3,colored=false){
 if(!shapes.length)return null;if(!kernel)throw new Error('Geometry is not initialized');
 const tree=booleanPaths(shapes.flatMap(s=>s.polygons)),paths=flattenTree(tree),regions=regionsOf(tree);if(!regions.length)return null;
 const bounds=boundsOf(paths),scale=width/bounds.width,cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
 const solids=[],parts=[];let covered;
 const meshData=(solid,color)=>{const mesh=solid.getMesh(),triangles=[];for(let i=0;i<mesh.triVerts.length;i+=3)triangles.push([0,1,2].map(j=>{const offset=mesh.triVerts[i+j]*mesh.numProp;return Array.from(mesh.vertProperties.slice(offset,offset+3));}));return {triangles,faceColors:triangles.map(()=>color)};};
 try{
  for(const s of shapes){const cross=new kernel.CrossSection(s.polygons.map(r=>r.map(([x,y])=>[(x-cx)*scale,(cy-y)*scale])),'NonZero');try{solids.push(cross.extrude(s.height??thickness));}finally{cross.delete();}}
  for(let i=shapes.length-1;i>=0;i--){const visible=covered?solids[i].subtract(covered):solids[i];try{if(!visible.isEmpty()){if(visible.status()!=='NoError')throw new Error('Invalid material volume');parts.push({...meshData(visible,shapes[i].color),color:shapes[i].color,name:shapes[i].name||'Layer',layerId:shapes[i].id});}}finally{if(covered)visible.delete();}
   const next=covered?kernel.Manifold.union([solids[i],covered]):solids[i].translate([0,0,0]);if(covered)covered.delete();covered=next;
  }
  if(covered.status()!=='NoError')throw new Error('Invalid solid');
  return {...meshData(covered,shapes[0].color),parts,width,height:bounds.height*scale,thickness:Math.max(...shapes.map(s=>s.height??thickness)),bounds,scale,islands:regions.length};
 }finally{covered?.delete();for(const solid of solids)solid.delete();}
}
export function bufferGeometry(data){const positions=[],colors=[];const triangles=data.parts?.flatMap(p=>p.triangles)||data.triangles,faceColors=data.parts?.flatMap(p=>p.faceColors)||data.faceColors;for(let i=0;i<triangles.length;i++){const color=new THREE.Color(faceColors[i]);for(const p of triangles[i]){positions.push(...p);colors.push(color.r,color.g,color.b);}}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;}
export function binarySTL(data){const bytes=new ArrayBuffer(84+data.triangles.length*50),v=new DataView(bytes);const header=new TextEncoder().encode('3dindeklas Trace3D - units: millimeters');new Uint8Array(bytes).set(header);v.setUint32(80,data.triangles.length,true);let offset=84;
 for(const tri of data.triangles){const [a,b,c]=tri,normal=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c),new THREE.Vector3(...a))).normalize();for(const p of [[normal.x,normal.y,normal.z],...tri])for(const n of p){v.setFloat32(offset,n,true);offset+=4;}v.setUint16(offset,0,true);offset+=2;}return bytes;}
const xmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function objFiles(data,name){
 const parts=data.parts||[{triangles:data.triangles,color:data.faceColors[0],name}],palette=[...new Set(parts.map(p=>p.color))],materials=new Map(palette.map((c,i)=>[c,`color_${i+1}`]));
 let obj=`# Trace3D - millimeters; companion MTL must remain beside this OBJ.\nmtllib ${name}.mtl\n`,offset=0;
 for(const [i,part] of parts.entries()){const vertices=[],indices=[],map=new Map();for(const tri of part.triangles)indices.push(tri.map(p=>{const key=p.map(n=>n.toFixed(6)).join(',');if(!map.has(key)){map.set(key,vertices.length+1);vertices.push(p);}return map.get(key)+offset;}));
 const rgb=[1,3,5].map(n=>parseInt(part.color.slice(n,n+2),16)/255);obj+=`o layer_${i+1}\ng layer_${i+1}\nusemtl ${materials.get(part.color)}\n`;obj+=vertices.map(p=>`v ${[...p,...rgb].map(n=>n.toFixed(6)).join(' ')}`).join('\n')+'\n';obj+=indices.map(f=>`f ${f.join(' ')}`).join('\n')+'\n';offset+=vertices.length;}
 const mtl=palette.map(c=>`newmtl ${materials.get(c)}\nKa 0 0 0\nKd ${[1,3,5].map(i=>(parseInt(c.slice(i,i+2),16)/255).toFixed(6)).join(' ')}\nKs 0 0 0\nd 1\nillum 1\n`).join('\n');return {obj,mtl};
}
// 3MF core + Materials Extension: color volumes are components of one assembly.
export function threeMFEntries(data,name){
 const parts=data.parts,palette=[...new Set(parts.map(p=>p.color))];let objects='';
 for(const [i,part] of parts.entries()){const vertices=[],indices=[],map=new Map();for(const tri of part.triangles)indices.push(tri.map(p=>{const key=p.map(n=>n.toFixed(6)).join(',');if(!map.has(key)){map.set(key,vertices.length);vertices.push(p);}return map.get(key);}));objects+=`<object id="${i+2}" type="model" name="${xmlEscape(part.name)}" pid="1" pindex="${palette.indexOf(part.color)}"><mesh><vertices>${vertices.map(p=>`<vertex x="${p[0]}" y="${p[1]}" z="${p[2]}"/>`).join('')}</vertices><triangles>${indices.map(f=>`<triangle v1="${f[0]}" v2="${f[1]}" v3="${f[2]}"/>`).join('')}</triangles></mesh></object>`;}
 const assembly=parts.length+2;
 return {'[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>',
 '3D/3dmodel.model':`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" requiredextensions="m" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">${xmlEscape(name)}</metadata><resources><m:colorgroup id="1">${palette.map(c=>`<m:color color="${c.toUpperCase()}FF"/>`).join('')}</m:colorgroup>${objects}<object id="${assembly}" type="model" name="${xmlEscape(name)}"><components>${parts.map((_,i)=>`<component objectid="${i+2}"/>`).join('')}</components></object></resources><build><item objectid="${assembly}"/></build></model>`};
}
// Trace a four-connected raster region into vector contours. Only drawing alpha forms walls.
export function floodContours(alpha,resolution,startX,startY){const W=resolution,x=Math.floor(startX),y=Math.floor(startY);if(x<0||y<0||x>=W||y>=W||alpha[y*W+x]>70)return null;
 const seen=new Uint8Array(W*W),queue=new Int32Array(W*W);let head=0,tail=1;queue[0]=y*W+x;seen[queue[0]]=1;let reachesEdge=false;
 while(head<tail){const p=queue[head++],px=p%W,py=Math.floor(p/W);if(px===0||py===0||px===W-1||py===W-1)reachesEdge=true;for(const n of [px>0?p-1:-1,px<W-1?p+1:-1,py>0?p-W:-1,py<W-1?p+W:-1])if(n>=0&&!seen[n]&&alpha[n]<=70){seen[n]=1;queue[tail++]=n;}}
 if(reachesEdge||tail<3)return null;
 const edges=new Map(),key=(x,y)=>y*(W+1)+x;
 function add(x1,y1,x2,y2){const a=key(x1,y1),b=key(x2,y2);if(!edges.has(a))edges.set(a,[]);edges.get(a).push(b);}
 for(let i=0;i<tail;i++){const p=queue[i],x=p%W,y=Math.floor(p/W);if(y===0||!seen[p-W])add(x,y,x+1,y);if(x===W-1||!seen[p+1])add(x+1,y,x+1,y+1);if(y===W-1||!seen[p+W])add(x+1,y+1,x,y+1);if(x===0||!seen[p-1])add(x,y+1,x,y);}
 const loops=[];
 while(edges.size){const start=edges.keys().next().value;let current=start,previous=null,loop=[],guard=0;do{loop.push([current%(W+1),Math.floor(current/(W+1))]);const options=edges.get(current);if(!options?.length)break;let next=options[0];if(options.length>1&&previous!==null){const cx=current%(W+1),cy=Math.floor(current/(W+1)),dx=cx-previous%(W+1),dy=cy-Math.floor(previous/(W+1));let best=-Infinity;for(const n of options){const nx=n%(W+1)-cx,ny=Math.floor(n/(W+1))-cy;const turn=dx*ny-dy*nx,score=turn===1?3:turn===0?2:1;if(score>best){best=score;next=n;}}}options.splice(options.indexOf(next),1);if(!options.length)edges.delete(current);previous=current;current=next;if(++guard>W*W*4)break;}while(current!==start);if(loop.length>=3)loops.push(simplifyClosed(loop,.45).map(p=>p.map(n=>n*SIZE/W)));}
 return normalizePaths(loops);
}
function simplifyClosed(points,tolerance){let clean=points.filter((p,i)=>{const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];return (p[0]-prev[0])*(next[1]-p[1])!==(p[1]-prev[1])*(next[0]-p[0]);});if(clean.length<4)return clean;
 let opposite=1,dist=0;for(let i=1;i<clean.length;i++){const d=(clean[i][0]-clean[0][0])**2+(clean[i][1]-clean[0][1])**2;if(d>dist){dist=d;opposite=i;}}
 return [...rdp(clean.slice(0,opposite+1),tolerance).slice(0,-1),...rdp([...clean.slice(opposite),clean[0]],tolerance).slice(0,-1)];}
function rdp(p,t){if(p.length<3)return p;const a=p[0],b=p[p.length-1],dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;let max=0,index=0;for(let i=1;i<p.length-1;i++){const k=den?Math.max(0,Math.min(1,((p[i][0]-a[0])*dx+(p[i][1]-a[1])*dy)/den)):0,d=Math.hypot(p[i][0]-a[0]-k*dx,p[i][1]-a[1]-k*dy);if(d>max){max=d;index=i;}}return max>t?[...rdp(p.slice(0,index+1),t).slice(0,-1),...rdp(p.slice(index),t)]:[a,b];}
