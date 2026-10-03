import {SIZE,normalizePaths,offsetPaths,strokePolygons} from './geometry.js';
export const visibleLayers=shapes=>shapes.filter(s=>s.visible!==false);
export const editableLayers=shapes=>shapes.filter(s=>s.visible!==false&&!s.locked);
export function shapePolygons(tool,start,end,size=8,filled=true,constrain=false){
 let [x,y]=end;const [sx,sy]=start;
 if(constrain){if(tool==='line'){const length=Math.hypot(x-sx,y-sy),angle=Math.round(Math.atan2(y-sy,x-sx)/(Math.PI/4))*Math.PI/4;x=sx+Math.cos(angle)*length;y=sy+Math.sin(angle)*length;}else{const side=Math.max(Math.abs(x-sx),Math.abs(y-sy));x=sx+Math.sign(x-sx||1)*side;y=sy+Math.sign(y-sy||1)*side;}}
 x=Math.max(0,Math.min(SIZE,x));y=Math.max(0,Math.min(SIZE,y));
 if(tool==='line')return strokePolygons([[sx,sy,.5],[x,y,.5]],'pen',size);
 const left=Math.min(sx,x),top=Math.min(sy,y),w=Math.abs(x-sx),h=Math.abs(y-sy);if(w<1||h<1)return [];
 const ring=tool==='rectangle'?[[left,top],[left+w,top],[left+w,top+h],[left,top+h]]:Array.from({length:96},(_,i)=>[left+w/2+Math.cos(i/96*Math.PI*2)*w/2,top+h/2+Math.sin(i/96*Math.PI*2)*h/2]);
 return filled?normalizePaths([ring]):normalizePaths([ring,...offsetPaths([ring],-size).map(p=>p.reverse())]);
}
export function snapPoint(point,shapes,tolerance,first=null){let target=null,distance=tolerance;for(const s of editableLayers(shapes))if(s.points&&!s.closed)for(const p of [s.points[0],s.points.at(-1)]){const d=Math.hypot(point[0]-p[0],point[1]-p[1]);if(d<distance){target=p;distance=d;}}if(first){const d=Math.hypot(point[0]-first[0],point[1]-first[1]);if(d<distance)target=first;}return target?{point:[target[0],target[1],...point.slice(2)],target:[target[0],target[1]]}:{point,target:null};}
export function canClose(points,size=8){if(!points||points.length<3)return false;const first=points[0];let length=0,maxDistance=0;for(let i=1;i<points.length;i++){length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);maxDistance=Math.max(maxDistance,Math.hypot(points[i][0]-first[0],points[i][1]-first[1]));}return length>=Math.max(30,size*3)&&maxDistance>=Math.max(12,size*1.5);}
// Reorder the actual drawing stack. A group moves as a block, preserving its order.
export function reorderLayers(shapes,id,direction){const layer=shapes.find(s=>s.id===id);if(!layer)return shapes;const members=shapes.filter(s=>layer.groupId?s.groupId===layer.groupId:s.id===id),ids=new Set(members.map(s=>s.id)),rest=shapes.filter(s=>!ids.has(s.id));if(members.some(s=>s.locked))return shapes;const low=Math.min(...members.map(s=>shapes.indexOf(s))),high=Math.max(...members.map(s=>shapes.indexOf(s)));let target;
 if(direction>0){const next=shapes.slice(high+1).find(s=>!ids.has(s.id));if(!next)return shapes;const neighbors=rest.filter(s=>next.groupId?s.groupId===next.groupId:s.id===next.id);target=Math.max(...neighbors.map(s=>rest.indexOf(s)))+1;}
 else{const next=shapes.slice(0,low).reverse().find(s=>!ids.has(s.id));if(!next)return shapes;const neighbors=rest.filter(s=>next.groupId?s.groupId===next.groupId:s.id===next.id);target=Math.min(...neighbors.map(s=>rest.indexOf(s)));}
 return [...rest.slice(0,target),...members,...rest.slice(target)];
}
