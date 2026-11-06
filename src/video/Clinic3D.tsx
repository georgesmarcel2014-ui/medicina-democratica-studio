import React from 'react';

/** Original procedural low-poly scene. Every visible face is projected from 3D
 * world coordinates; this is not a still image, a zoom or a pre-rendered asset. */
type V = [number, number, number];
type Face = {points: V[]; fill: string; opacity?: number};
const add = (a: V, b: V): V => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const mul = (a: V, b: number): V => [a[0]*b,a[1]*b,a[2]*b];
const cross = (a: V, b: V): V => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = (a: V): V => mul(a, 1/Math.hypot(...a));
const shade = (hex: string, factor: number) => {
  const n = parseInt(hex.replace('#',''),16);
  return `rgb(${[n>>16,(n>>8)&255,n&255].map(v=>Math.round(Math.min(255,v*factor))).join(',')})`;
};
function box(faces: Face[], center: V, size: V, color: string) {
  const [x,y,z]=size.map(v=>v/2);
  const p: V[]=[[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]].map(v=>add(center,v as V));
  [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]].forEach((indices,i)=>faces.push({points:indices.map(j=>p[j]),fill:shade(color,[.75,.95,.6,1.12,.86,.7][i])}));
}
function limb(faces: Face[], a: V, b: V, radius: number, color: string, endRadius=radius) {
  const axis = norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
  const u=norm(cross(axis, Math.abs(axis[1])>.9?[1,0,0]:[0,1,0]));
  const v=cross(axis,u);
  const ring=(center: V,r: number)=>Array.from({length:8},(_,i)=>add(center,add(mul(u,Math.cos(i*Math.PI/4)*r),mul(v,Math.sin(i*Math.PI/4)*r))));
  const ar=ring(a,radius),br=ring(b,endRadius);
  for(let i=0;i<8;i++) faces.push({points:[ar[i],ar[(i+1)%8],br[(i+1)%8],br[i]],fill:shade(color,.77+.22*Math.cos(i*Math.PI/4))});
  faces.push({points:ar,fill:shade(color,.78)},{points:br,fill:color});
}
function head(faces: Face[], c: V, color: string, nod: number) {
  const rings: V[][]=[];
  for(let j=0;j<=4;j++) {
    const lat=Math.PI*j/4;
    rings.push(Array.from({length:8},(_,i)=>{
      const angle=i*Math.PI/4;
      const x=Math.sin(lat)*Math.cos(angle)*.105;
      const y=Math.cos(lat)*.14;
      const z=Math.sin(lat)*Math.sin(angle)*.105;
      return add(c,[x,y*Math.cos(nod)-z*Math.sin(nod),y*Math.sin(nod)+z*Math.cos(nod)]);
    }));
  }
  for(let j=0;j<4;j++) for(let i=0;i<8;i++) faces.push({points:[rings[j][i],rings[j][(i+1)%8],rings[j+1][(i+1)%8],rings[j+1][i]],fill:shade(color,.78+.18*Math.cos(i*Math.PI/4)+.08*(4-j))});
  // Hair is a small low-poly cap, rather than an oversized cartoon head.
  box(faces,add(c,[0,.11,-.012]),[.165,.055,.15],'#263b42');
}
function human(faces: Face[], base: V, time: number, doctor: boolean) {
  const breathing=Math.sin(time*1.8)*.006;
  const local=(v: V)=>add(base,[v[0],v[1]+breathing,v[2]]);
  const skin=doctor?'#b98265':'#d5a489';
  const shirt=doctor?'#f0f5ed':'#56849c';
  // Adult body ratio: 1.78 m tall, head 0.28 m, shoulders 0.43 m.
  box(faces,local([0,1.22,0]),[.40,.53,.22],shirt);
  box(faces,local([0,.92,0]),[.35,.16,.23],doctor?'#203c4b':'#344b62');
  limb(faces,local([0,1.49,0]),local([0,1.57,0]),.048,skin);
  head(faces,local([0,1.69,0]),skin,Math.sin(time*1.25)*.07);
  for(const side of [-1,1]) {
    const hip=local([side*.105,.87,0]);
    const knee=local([side*.11,.48,.025]);
    const ankle=local([side*.12,.09,0]);
    limb(faces,hip,knee,.088,doctor?'#264958':'#344b62',.062);
    limb(faces,knee,ankle,.063,doctor?'#264958':'#344b62',.043);
    box(faces,local([side*.12,.045,.055]),[.13,.09,.25],'#243746');
    const shoulder=local([side*.25,1.43,0]);
    const gesture=doctor&&side===1;
    const phase=(Math.sin(time*1.2)+1)/2;
    const elbow=local([side*(gesture?.42:.28),gesture?1.17+phase*.08:1.11,.04]);
    const wrist=local([side*(gesture?.63+phase*.06:.28),gesture?1.29+phase*.12:.83,gesture?.16:.04]);
    limb(faces,shoulder,elbow,.071,shirt,.055);
    limb(faces,elbow,wrist,.05,doctor?shirt:skin,.035);
    box(faces,wrist,[.07,.11,.065],skin);
  }
  if(doctor) {
    box(faces,local([-.10,1.34,.125]),[.09,.07,.012],'#32b9ae');
    // Coat lapels and a stethoscope indicate the clinician without props from third parties.
    limb(faces,local([-.10,1.47,.13]),local([-.07,1.20,.14]),.012,'#233e47');
    limb(faces,local([.10,1.47,.13]),local([.07,1.20,.14]),.012,'#233e47');
    limb(faces,local([-.07,1.20,.14]),local([.07,1.20,.14]),.012,'#233e47');
  }
}
function camera(p: V, time: number): V {
  const azimuth=-.42+Math.sin(time*.25)*.025, elevation=.34;
  const x=p[0]*Math.cos(azimuth)+p[2]*Math.sin(azimuth);
  const z=-p[0]*Math.sin(azimuth)+p[2]*Math.cos(azimuth);
  return [x,p[1]*Math.cos(elevation)-z*Math.sin(elevation),-z*Math.cos(elevation)-p[1]*Math.sin(elevation)];
}
function project(p: V, time: number): [number,number] {
  const [x,y,z]=camera(p,time), perspective=9/(9+z);
  return [480+x*185*perspective,640-y*185*perspective];
}
export const Clinic3D: React.FC<{time:number; accent:string}> = ({time,accent}) => {
  const faces: Face[]=[];
  box(faces,[0,-.08,0],[4.8,.14,3.5],'#b8d3d0');
  box(faces,[0,1.25,-1.8],[4.8,2.5,.08],'#d8e8e4');
  box(faces,[-2.4,1.25,0],[.08,2.5,3.5],'#b6d0d0');
  // Window, cabinet and monitor.
  box(faces,[-1.5,1.5,-1.73],[1.10,.88,.04],'#72abae');
  box(faces,[-1.5,1.5,-1.69],[.035,.88,.04],'#e8f4ee');
  box(faces,[-1.5,1.5,-1.69],[1.1,.035,.04],'#e8f4ee');
  box(faces,[1.65,.47,-1.32],[.95,.94,.6],'#eff3e9');
  box(faces,[1.65,.96,-1.32],[1.02,.06,.66],'#78a5a4');
  box(faces,[1.65,1.28,-1.42],[.61,.43,.08],'#173e4b');
  box(faces,[1.65,1.28,-1.365],[.50,.31,.02],'#43c6b7');
  box(faces,[1.65,1.03,-1.42],[.05,.14,.05],'#38595d');
  // Examination table: separate 3D legs, mattress, and pillow.
  for(const x of [-.40,.4]) for(const z of [-.52,.52]) box(faces,[x,.31,z+.65],[.06,.62,.06],'#719091');
  box(faces,[0,.67,.65],[1.10,.18,1.55],'#edf3e8');
  box(faces,[0,.80,.18],[.72,.10,.40],'#8fc3bd');
  human(faces,[-1.06,0,.44],time,true);
  human(faces,[1.07,0,.54],time+.7,false);
  faces.sort((a,b)=>{
    const depth=(f:Face)=>f.points.reduce((s,p)=>s+camera(p,time)[2],0)/f.points.length;
    return depth(b)-depth(a);
  });
  return <svg viewBox="0 0 960 760" width="100%" height="100%" aria-label="Animação tridimensional original de profissional de saúde orientando paciente">
    <defs><radialGradient id="clinicGlow"><stop stopColor={accent} stopOpacity=".14"/><stop offset="1" stopColor={accent} stopOpacity="0"/></radialGradient></defs>
    <ellipse cx="480" cy="480" rx="450" ry="280" fill="url(#clinicGlow)"/>
    {faces.map((face,i)=><polygon key={i} points={face.points.map(p=>project(p,time).join(',')).join(' ')} fill={face.fill} stroke={face.fill} strokeWidth=".55" strokeLinejoin="round"/>)}
  </svg>;
};
