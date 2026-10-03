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
export function modelData(shapes,width=80,thickness=3,colored=false){
 if(!shapes.length)return null;
 const paths=shapes.flatMap(s=>s.polygons),tree=booleanPaths(paths),regions=regionsOf(tree),union=flattenTree(tree);
 if(!regions.length)return null;
 const bounds=boundsOf(union),scale=width/bounds.width,cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
 const triangles=[],faceColors=[];
 const toWorld=p=>[(p[0]-cx)*scale,(cy-p[1])*scale];
 function triangle(a,b,c,color){const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(a[2]===b[2]&&b[2]===c[2]&&Math.abs(cross)<1e-10)return;triangles.push([a,b,c]);faceColors.push(color);}
 function cap(region,z,up,color){
   const rings=[region.outer,...region.holes].map(r=>r.map(toWorld));
   const flat=rings.flat(),faces=THREE.ShapeUtils.triangulateShape(rings[0].map(p=>new THREE.Vector2(...p)),rings.slice(1).map(r=>r.map(p=>new THREE.Vector2(...p))));
   for(const ids of faces){let [a,b,c]=ids.map(i=>[...flat[i],z]);const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if((cross>0)!==up)[b,c]=[c,b];const x=cx+(a[0]+b[0]+c[0])/3/scale,y=cy-(a[1]+b[1]+c[1])/3/scale;triangle(a,b,c,color||colorAt(shapes,x,y));}
 }
 const tops=[{regions,shape:{color:null}}];
 for(const part of tops)for(const region of part.regions)cap(region,thickness,true,part.shape.color);
 for(const region of regions){cap(region,0,false,null);for(const [idx,ring] of [region.outer,...region.holes].entries()){
   let world=ring.map(toWorld);if((signedArea(world)>0)!==(idx===0))world.reverse();
   for(let i=0;i<world.length;i++){const a=world[i],b=world[(i+1)%world.length],x=cx+(a[0]+b[0])/2/scale,y=cy-(a[1]+b[1])/2/scale;const color=colorAt(shapes,x,y);
    triangle([...a,0],[...b,0],[...b,thickness],color);triangle([...a,0],[...b,thickness],[...a,thickness],color);
   }
 }}
 return {triangles,faceColors,width,height:bounds.height*scale,thickness,bounds,scale,islands:regions.length};
}
export function bufferGeometry(data){const positions=[],colors=[],uv=[];for(let i=0;i<data.triangles.length;i++){const color=new THREE.Color(data.faceColors[i]);for(const p of data.triangles[i]){positions.push(...p);colors.push(color.r,color.g,color.b);uv.push((p[0]/data.scale+(data.bounds.minX+data.bounds.maxX)/2)/SIZE,1-((data.bounds.minY+data.bounds.maxY)/2-p[1]/data.scale)/SIZE);}}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));for(let i=0;i<data.triangles.length;i++)geometry.addGroup(i*3,3,data.triangles[i].every(p=>p[2]===data.thickness)?0:1);geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;}
export function binarySTL(data){const bytes=new ArrayBuffer(84+data.triangles.length*50),v=new DataView(bytes);const header=new TextEncoder().encode('3dindeklas Trace3D - units: millimeters');new Uint8Array(bytes).set(header);v.setUint32(80,data.triangles.length,true);let offset=84;
 for(const tri of data.triangles){const [a,b,c]=tri,normal=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c),new THREE.Vector3(...a))).normalize();for(const p of [[normal.x,normal.y,normal.z],...tri])for(const n of p){v.setFloat32(offset,n,true);offset+=4;}v.setUint16(offset,0,true);offset+=2;}return bytes;}
export function objFiles(data,name,textureFile=null){const vertices=[],indices=[],map=new Map();for(const tri of data.triangles){indices.push(tri.map(p=>{const key=p.map(n=>n.toFixed(6)).join(',');if(!map.has(key)){map.set(key,vertices.length+1);vertices.push(p);}return map.get(key);}));}
 const palette=[...new Set(data.faceColors)],materials=new Map(palette.map((c,i)=>[c,`kleur_${i+1}`]));
 let obj=`# 3dindeklas Trace3D\n# Coordinates in millimeters; set import units to mm.\nmtllib ${name}.mtl\no ${name}\n`;
 obj+=vertices.map(p=>`v ${p.map(n=>n.toFixed(6)).join(' ')}`).join('\n')+'\n';if(textureFile)obj+=vertices.map(p=>`vt ${((p[0]/data.scale+(data.bounds.minX+data.bounds.maxX)/2)/SIZE).toFixed(8)} ${(1-((data.bounds.minY+data.bounds.maxY)/2-p[1]/data.scale)/SIZE).toFixed(8)}`).join('\n')+'\n';let current=null;for(let i=0;i<indices.length;i++){const material=textureFile&&data.triangles[i].every(p=>p[2]===data.thickness)?'tekening':materials.get(data.faceColors[i]);if(material!==current){obj+=`usemtl ${material}\n`;current=material;}obj+=`f ${indices[i].map(index=>textureFile?`${index}/${index}`:index).join(' ')}\n`;}
 const mtl=(textureFile?`newmtl tekening\nKd 1 1 1\nmap_Kd ${textureFile}\nd 1\nillum 2\n\n`:'')+palette.map(c=>{const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);return `newmtl ${materials.get(c)}\nKa 0.1 0.1 0.1\nKd ${rgb.map(n=>n.toFixed(5)).join(' ')}\nKs 0.1 0.1 0.1\nd 1\nillum 2\n`;}).join('\n');return {obj,mtl};}
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
