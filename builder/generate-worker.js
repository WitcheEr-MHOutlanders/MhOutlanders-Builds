"use strict";
self.onmessage=({data})=>{
 const {pieces,sets,priorities,token}=data;
 const slots=["Head armor","Body armor","Arm armor","Waist armor","Leg armor"];
 const pools=slots.map(slot=>pieces.filter(p=>p.slot===slot).sort((a,b)=>a.name.localeCompare(b.name)));
 const max={};for(const skill of priorities)max[skill]=Math.max(1,...pieces.map(p=>Number(p.max?.[skill]||0)),...sets.map(s=>s.bonus?.skill_bonus?.[0]===skill?7:0));
 const maxima=pools.map(pool=>priorities.map(skill=>Math.max(0,...pool.map(p=>Number(p.final[skill]||0)))));
 const rem=Array.from({length:6},()=>[0,0,0,0]);for(let i=4;i>=0;i--)for(let j=0;j<4;j++)rem[i][j]=rem[i+1][j]+maxima[i][j];
 const possibleBonus=priorities.map(skill=>sets.reduce((s,x)=>s+(x.bonus?.skill_bonus?.[0]===skill?Number(x.bonus.skill_bonus[1]||0):0),0));
 const top=[];let visited=0;let last=-1;
 function cmp(a,b){for(let i=0;i<4;i++)if(a.score[i]!==b.score[i])return a.score[i]-b.score[i];return a.extra-b.extra||b.key.localeCompare(a.key)}
 function evaluate(chosen,raw,counts){
  const totals={...raw},active=[];
  for(const s of sets){const b=s.bonus;if(!b||counts[s.name]<b.required_pieces)continue;active.push({name:b.name,required:b.required_pieces,effect:b.effect||""});if(b.skill_bonus){const [skill,value]=b.skill_bonus;totals[skill]=(totals[skill]||0)+Number(value)}}
  const score=priorities.map(s=>Math.min(max[s],totals[s]||0));
  const extra=Object.entries(totals).filter(([s])=>!priorities.includes(s)).reduce((sum,[s,v])=>sum+Math.min(Number(v)||0,Math.max(1,...pieces.map(p=>Number(p.max?.[s]||0)))),0);
  const ids=chosen.map(p=>p.id),key=chosen.map(p=>p.name).join("|"),profile=score.join("|");
  const result={ids,key,score,extra,totals,active,profile,unverified:chosen.filter(p=>p.unverified).map(p=>p.name)};
  const same=top.findIndex(t=>t.profile===profile);if(same>=0){if(cmp(result,top[same])>0)top.splice(same,1);else return}
  top.push(result);top.sort((a,b)=>cmp(b,a));if(top.length>3)top.length=3;
 }
 function bound(depth,raw){
  if(top.length<3)return true;
  const threshold=top[top.length-1].score;
  for(let j=0;j<4;j++){const skill=priorities[j];const optimistic=Math.min(max[skill],(raw[skill]||0)+rem[depth][j]+possibleBonus[j]);if(optimistic>threshold[j])return true;if(optimistic<threshold[j])return false}
  return true;
 }
 function dfs(depth,chosen,raw,counts){
  if(!bound(depth,raw))return;
  if(depth===5){evaluate(chosen,raw,counts);return}
  for(const p of pools[depth]){
   const next={...raw};for(const [s,v] of Object.entries(p.final))next[s]=(next[s]||0)+Number(v);
   counts[p.set]=(counts[p.set]||0)+1;chosen.push(p);dfs(depth+1,chosen,next,counts);chosen.pop();counts[p.set]--;
   if(depth===0){visited++;const progress=Math.floor(visited*100/pools[0].length);if(progress!==last){last=progress;self.postMessage({type:"progress",token,progress})}}
  }
 }
 dfs(0,[],{},{});
 self.postMessage({type:"result",token,top,visited});
};