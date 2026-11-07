import React from 'react';
import {AbsoluteFill, Audio, Composition, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {EpisodeProps, Episode} from '../shared/schema';
import {Clinic3D} from './Clinic3D';

type Scene = Episode['scenes'][number];
const themes = {
  noticias: {label:'NOTÍCIAS', accent:'#58dfc3', bg:'#081d25', kicker:'INFORMAÇÃO QUE APROXIMA'},
  historia: {label:'HISTÓRIA', accent:'#e3ba79', bg:'#211d1c', kicker:'O PASSADO EXPLICA O PRESENTE'},
  'na-pratica': {label:'NA PRÁTICA', accent:'#90ccff', bg:'#102431', kicker:'CONHECIMENTO EM MOVIMENTO'},
};
const font = 'Arial, Helvetica, sans-serif';
const Label: React.FC<{children:React.ReactNode; color?:string; style?:React.CSSProperties}> = ({children,color,style}) => <div style={{fontSize:23,fontWeight:700,letterSpacing:3,color:color??'#a9babd',...style}}>{children}</div>;

function Chart({scene,frame,accent}:{scene:Scene;frame:number;accent:string}) {
  const values=scene.data?.length?scene.data:[24,38,54,71];
  const max=Math.max(...values,1);
  const chartW=760, barW=Math.min(100,chartW/values.length*.54), slot=chartW/values.length;
  return <div style={{height:'100%',padding:'40px 35px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
    <Label color={accent}>{scene.data?.length?'LEITURA DOS DADOS':'DADOS ILUSTRATIVOS'}</Label>
    <svg viewBox="0 0 820 520" width="100%" style={{overflow:'visible',marginTop:28}}>
      {[0,1,2,3,4].map(i=><g key={i}><line x1="30" y1={440-i*88} x2="800" y2={440-i*88} stroke="#ffffff" strokeOpacity=".12"/><text x="15" y={446-i*88} textAnchor="end" fontSize="18" fill="#a3b6b9">{Math.round(max*i/4)}</text></g>)}
      {values.map((v,i)=>{
        const progress=spring({frame:Math.max(0,frame-i*4),fps:30,config:{damping:22,stiffness:100}});
        const h=v/max*345*progress;
        return <g key={i}><rect x={30+i*slot+(slot-barW)/2} y={440-h} width={barW} height={h} rx="7" fill={accent} opacity={.54+i/Math.max(values.length-1,1)*.46}/><text x={30+(i+.5)*slot} y={416-h} fill="#f1f7f2" fontSize={values.length>7?23:31} textAnchor="middle" fontWeight="700">{v}</text><text x={30+(i+.5)*slot} y="480" fill="#bed0d1" fontSize={values.length>7?16:22} textAnchor="middle">{(scene.labels?.[i]??`Grupo ${i+1}`).slice(0,14)}</text></g>;
      })}
    </svg>
  </div>;
}

function MapVisual({frame,accent}:{frame:number;accent:string}) {
  const points=[[380,100],[525,135],[560,215],[660,240],[618,320],[550,365],[518,480],[425,555],[390,635],[335,590],[360,470],[270,405],[225,330],[154,270],[210,213],[175,162],[270,170],[305,110]];
  const markers=[[302,255],[485,249],[465,432],[407,516]];
  return <div style={{height:'100%',padding:35}}>
    <Label color={accent}>TERRITÓRIO & CONTEXTO</Label>
    <svg viewBox="0 0 820 700" width="100%" height="90%">
      <defs><pattern id="mapgrid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke={accent} strokeOpacity=".11"/></pattern></defs>
      <rect x="35" y="35" width="750" height="630" fill="url(#mapgrid)"/>
      <polygon points={points.map(p=>p.join(',')).join(' ')} fill={accent} fillOpacity=".13" stroke={accent} strokeWidth="3"/>
      {markers.map(([x,y],i)=>{
        const phase=(frame+i*15)%70;
        return <g key={i}><circle cx={x} cy={y} r={9+phase*.4} fill="none" stroke={accent} strokeWidth="2" opacity={1-phase/70}/><circle cx={x} cy={y} r="8" fill={accent}/>{i>0&&<path d={`M302 255 Q${x-90} ${y-140} ${x} ${y}`} fill="none" stroke={accent} strokeWidth="2" strokeDasharray="6 9" strokeDashoffset={-frame*.7}/>}</g>;
      })}
      <text x="665" y="610" textAnchor="end" fill="#aac2c4" fontSize="20" letterSpacing="2">MAPA ESQUEMÁTICO</text>
    </svg>
  </div>;
}

function Timeline({scene,frame,accent}:{scene:Scene;frame:number;accent:string}) {
  const labels=scene.labels?.length?scene.labels.slice(0,5):['Arquivo','Contexto','Transformação','Hoje'];
  const progress=interpolate(frame,[0,80],[0,1],{extrapolateRight:'clamp'});
  return <div style={{height:'100%',padding:'42px 48px',position:'relative'}}>
    <Label color={accent}>DOCUMENTOS · MEMÓRIA · CONTEXTO</Label>
    <div style={{position:'absolute',left:70,top:116,bottom:65,width:2,background:'#ffffff20'}}/>
    <div style={{position:'absolute',left:70,top:116,height:440*progress,width:3,background:accent}}/>
    {labels.map((label,i)=>{
      const p=interpolate(frame,[i*12,i*12+18],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
      return <div key={i} style={{position:'relative',marginTop:38,marginLeft:4,display:'flex',alignItems:'center',gap:32,opacity:p,transform:`translateX(${(1-p)*25}px)`}}><div style={{width:16,height:16,borderRadius:100,background:accent,flexShrink:0,boxShadow:`0 0 0 8px ${accent}18`}}/><div style={{padding:'16px 24px',borderLeft:`2px solid ${accent}88`,fontFamily:'Georgia, serif',fontSize:38,color:'#f4e7cf',background:'#ffffff05',maxWidth:650}}>{label}</div></div>;
    })}
    <div style={{position:'absolute',right:34,bottom:30,fontSize:20,letterSpacing:3,color:'#e3ba7988'}}>ACERVO VISUAL ORIGINAL</div>
  </div>;
}

function Headline({scene,frame,accent}:{scene:Scene;frame:number;accent:string}) {
  return <div style={{height:'100%',padding:48,display:'flex',flexDirection:'column',justifyContent:'center',position:'relative',overflow:'hidden'}}>
    {[0,1,2].map(i=><div key={i} style={{position:'absolute',width:450+i*90,height:450+i*90,border:`1px solid ${accent}25`,borderRadius:'50%',right:-180-i*45,top:60-i*45,transform:`rotate(${frame*.15}deg)`}}/>)}
    <div style={{fontSize:150,fontFamily:'Georgia, serif',lineHeight:1,color:accent}}>“</div>
    <div style={{fontSize:47,fontWeight:600,lineHeight:1.25,maxWidth:680,color:'#f0f5ed'}}>{scene.body??scene.title}</div>
    <div style={{height:5,width:120,background:accent,marginTop:38}}/>
    <Label style={{marginTop:28}} color={accent}>MEDICINA DEMOCRÁTICA</Label>
  </div>;
}

function SceneVisual({scene,props,frame,accent,documentary=false}:{scene:Scene;props:EpisodeProps;frame:number;accent:string;documentary?:boolean}) {
  const asset=props.episode.assets.find(a=>a.id===scene.assetId);
  const path=asset?props.assetSources[asset.id]:undefined;
  const src=path?staticFile(path):undefined;
  if(asset&&src) return <div style={{position:'relative',height:'100%',width:'100%',overflow:'hidden'}}>
    {asset.type==='image'?<Img src={src} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<Sequence from={Math.round(scene.start*30)} durationInFrames={Math.max(1,Math.ceil((scene.end-scene.start)*30))} layout="none"><OffthreadVideo src={src} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/></Sequence>}
    {!documentary&&<div style={{position:'absolute',inset:0,background:'linear-gradient(0deg, #081d25aa, transparent 45%)'}}/>}
    {!documentary&&<div style={{position:'absolute',left:28,bottom:24,right:28,fontSize:18,color:'white',textShadow:'0 1px 6px black'}}>{asset.origin} · {asset.license}</div>}
  </div>;
  if(scene.visual==='clinic') return <div style={{height:'100%',position:'relative',background:'#e9f0e9'}}><Clinic3D time={frame/30} accent={accent}/><div style={{position:'absolute',left:28,bottom:22,fontSize:20,fontWeight:700,letterSpacing:1.3,color:'#244b55'}}>ANIMAÇÃO 3D ILUSTRATIVA · MODELOS ORIGINAIS</div></div>;
  if(scene.visual==='chart') return <Chart scene={scene} frame={frame} accent={accent}/>;
  if(scene.visual==='map') return <MapVisual frame={frame} accent={accent}/>;
  if(scene.visual==='timeline') return <Timeline scene={scene} frame={frame} accent={accent}/>;
  return <Headline scene={scene} frame={frame} accent={accent}/>;
}

export const EpisodeVideo: React.FC<EpisodeProps> = (props) => {
  const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig();
  const t=frame/fps;
  const theme=themes[props.episode.series];
  const scene=props.episode.scenes.find(s=>s.start<=t&&s.end>t)??props.episode.scenes[props.episode.scenes.length-1];
  const sceneFrame=scene?frame-Math.round(scene.start*fps):frame;
  const caption=props.captions.find(c=>c.start<=t&&c.end>t);
  const sceneOpacity=scene?interpolate(sceneFrame,[0,8],[0,1],{extrapolateRight:'clamp'}):1;
  if(props.episode.layout==='documental'){
    const asset=props.episode.assets.find(a=>a.id===scene?.assetId);
    const subtitle=caption?.words?.length?caption.words.map((word,i)=><React.Fragment key={i}>
      <span style={{color:word.emphasis?theme.accent:undefined}}>{word.text}</span>{' '}
    </React.Fragment>):caption?.text;
    return <AbsoluteFill style={{background:theme.bg,color:'#fff6e8',fontFamily:font}}>
      {scene&&<SceneVisual key={scene.id} scene={scene} props={props} frame={sceneFrame} accent={theme.accent} documentary/>}
      <AbsoluteFill style={{background:'linear-gradient(180deg,#100c0bc9 0%,transparent 21%,transparent 56%,#100c0bdd 79%,#100c0b 100%)'}}/>
      <div style={{position:'absolute',left:76,right:165,top:113,textShadow:'0 2px 10px #000'}}>
        <Label color={theme.accent}>{theme.label} · MEDICINA DEMOCRÁTICA</Label>
        {scene?.body&&<div style={{fontSize:30,fontWeight:600,marginTop:19,lineHeight:1.2}}>{scene.body}</div>}
      </div>
      {caption&&<div style={{position:'absolute',left:92,right:156,top:1400,fontSize:54,lineHeight:1.13,fontWeight:750,
        textAlign:'center',textWrap:'balance',textShadow:'0 2px 8px #080606, 0 2px 2px #080606'}}>
        {subtitle}
      </div>}
      {asset&&<div style={{position:'absolute',left:82,right:155,top:1635,fontSize:20,color:'#e4d5c3',lineHeight:1.25}}>
        {asset.origin} · {asset.license}
      </div>}
      <div style={{position:'absolute',left:80,right:150,top:1695,height:4,background:'#ffffff38'}}>
        <div style={{height:'100%',width:`${100*(frame+1)/durationInFrames}%`,background:theme.accent}}/>
      </div>
      {props.audioSrc&&<Audio src={staticFile(props.audioSrc)}/>}
    </AbsoluteFill>;
  }
  const captions=caption?.words?.length?caption.words.map((word,i)=><React.Fragment key={i}><span style={{color:t>=word.start&&t<word.end?theme.accent:'white'}}>{word.text}</span>{' '}</React.Fragment>):caption?.text;
  return <AbsoluteFill style={{background:theme.bg,fontFamily:font,color:'#f4f7f3'}}>
    <AbsoluteFill style={{backgroundImage:`radial-gradient(ellipse at 100% 0%, ${theme.accent}18, transparent 60%), linear-gradient(${theme.accent}06 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}06 1px, transparent 1px)`,backgroundSize:'auto, 80px 80px, 80px 80px',backgroundPosition:`0 0, 0 ${frame*.15}px, 0 ${frame*.15}px`}}/>
    <div style={{position:'absolute',left:80,right:145,top:82,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:16}}><svg width="43" height="43" viewBox="0 0 43 43"><rect width="43" height="43" rx="11" fill={theme.accent}/><path d="M11 28V15l10.5 10L32 15v13" fill="none" stroke={theme.bg} strokeWidth="3.5" strokeLinejoin="round"/></svg><div style={{fontSize:23,fontWeight:800,lineHeight:1.05,letterSpacing:1}}>MEDICINA<br/><span style={{fontWeight:400,fontSize:19}}>DEMOCRÁTICA</span></div></div>
      <div style={{fontSize:21,fontWeight:800,color:theme.accent,letterSpacing:2,padding:'12px 16px',border:`1px solid ${theme.accent}66`,borderRadius:8}}>{theme.label}</div>
    </div>
    <div style={{position:'absolute',left:80,right:145,top:203,fontSize:22,fontWeight:600,color:'#bacace',lineHeight:1.4,letterSpacing:1.2}}>{props.episode.title}</div>
    {scene&&<div style={{position:'absolute',left:80,right:145,top:285,opacity:sceneOpacity,transform:`translateY(${(1-sceneOpacity)*15}px)`}}>
      <Label color={theme.accent} style={{marginBottom:22}}>{String(props.episode.scenes.indexOf(scene)+1).padStart(2,'0')} / {String(props.episode.scenes.length).padStart(2,'0')}</Label>
      <div style={{fontFamily:props.episode.series==='historia'?'Georgia, serif':font,fontSize:scene.title.length>90?48:scene.title.length>65?58:68,lineHeight:1.08,fontWeight:props.episode.series==='historia'?500:800,letterSpacing:-1.5,maxHeight:222,overflow:'hidden'}}>{scene.title}</div>
    </div>}
    <div style={{position:'absolute',left:65,right:130,top:585,height:680,border:`1px solid ${theme.accent}35`,borderRadius:22,overflow:'hidden',background:'#ffffff04',opacity:sceneOpacity}}>
      {scene&&<SceneVisual key={scene.id} scene={scene} props={props} frame={sceneFrame} accent={theme.accent}/>}
      {scene?.reconstruction&&<div style={{position:'absolute',top:22,left:22,padding:'10px 16px',background:'#10191fe6',fontSize:20,color:'#fff'}}>RECONSTITUIÇÃO VISUAL</div>}
    </div>
    {scene?.body&&scene.visual!=='headline'&&<div style={{position:'absolute',left:85,right:150,top:1295,color:'#c4d3d3',fontSize:29,lineHeight:1.35,maxHeight:82,overflow:'hidden'}}>{scene.body}</div>}
    {caption&&<div style={{position:'absolute',left:90,right:150,top:1400,minHeight:130,padding:'22px 25px',background:'#06131bec',borderRadius:14,border:`1px solid ${theme.accent}38`,boxShadow:'0 8px 35px #0004',textAlign:'center',fontSize:43,lineHeight:1.3,fontWeight:700,textWrap:'balance'}}>{captions}</div>}
    <div style={{position:'absolute',left:80,right:145,top:1640,display:'flex',justifyContent:'space-between',color:theme.accent,fontSize:18,fontWeight:600,letterSpacing:2}}><span>{theme.kicker}</span><span>{String(Math.floor(t/60)).padStart(2,'0')}:{String(Math.floor(t%60)).padStart(2,'0')}</span></div>
    <div style={{position:'absolute',left:80,right:145,top:1685,height:4,background:'#ffffff21',borderRadius:5,overflow:'hidden'}}><div style={{height:'100%',width:`${100*(frame+1)/durationInFrames}%`,background:theme.accent}}/></div>
    {props.audioSrc&&<Audio src={staticFile(props.audioSrc)}/>}
  </AbsoluteFill>;
};

const defaultProps:EpisodeProps={
  durationInFrames:240, captions:[{start:0,end:4,text:'Demonstração visual. Sem narração.'},{start:4,end:8,text:'Animação tridimensional original e reutilizável.'}],assetSources:{},
  episode:{title:'Estúdio audiovisual automatizado',series:'na-pratica',script:'Demonstração visual sem narração.',visualIdentity:'medicina-democratica',scenes:[{id:'clinic',start:0,end:8,title:'Conhecimento que ganha movimento',body:'Personagens articulados em um cenário tridimensional.',visual:'clinic'}],assets:[]},
};
export const RemotionRoot:React.FC=()=> <Composition id="MedicinaDemocratica" component={EpisodeVideo} width={1080} height={1920} fps={30} durationInFrames={240} defaultProps={defaultProps} calculateMetadata={({props})=>({durationInFrames:props.durationInFrames})}/>;
