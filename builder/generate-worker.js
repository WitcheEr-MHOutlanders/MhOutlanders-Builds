"use strict";
self.onmessage=({data})=>{
 const {pieces,sets,priorities,token}=data;
 try{
 const slots=["Head armor","Body armor","Arm armor","Waist armor","Leg armor"];
 const pools=slots.map(slot=>pieces.filter(p=>p.slot===slot));
 if(pools.some(p=>!p.length))throw Error("Missing armor pieces for one or more slots.");
 const caps={};for(const p of pieces)for(const [s,v] of Object.entries(p.max||{}))caps[s]=Math.max(caps[s]||0,Number(v)||0);
 for(const skill of priorities)if(!caps[skill])caps[skill]=7;
 const bonuses=sets.filter(s=>s.bonus?.skill_bonus).map(s=>({set:s.name,required:Number(s.bonus.required_pieces),name:s.bonus.name,skill:s.bonus.skill_bonus[0],value:Number(s.bonus.skill_bonus[1])||0,effect:s.bonus.effect||""}));
 const add=(raw,p)=>{const next={...raw};for(const [skill,v] of Object.entries(p.final||{}))next[skill]=(next[skill]||0)+(Number(v)||0);return next};
 const activeBonuses=(counts)=>bonuses.filter(b=>(counts[b.set]||0)>=b.required);
 const scoreOf=(raw,counts)=>{const totals={...raw};const active=activeBonuses(counts);for(const b of active)totals[b.skill]=(totals[b.skill]||0)+b.value;return {totals,active,score:priorities.map(s=>Math.min(caps[s],totals[s]||0))}};
 const compareScore=(a,b)=>{for(let i=0;i<priorities.length;i++)if(a[i]!==b[i])return b[i]-a[i];return 0};
 const stateRank=(state,depth)=>{const {score}=scoreOf(state.raw,state.counts);let value=0;for(let i=0;i<priorities.length;i++)value+=score[i]*Math.pow(20,priorities.length-i-1);
  // Favor pieces that can complete a relevant set bonus, without outranking a skill level.
  let potential=0;for(const b of bonuses)if(priorities.includes(b.skill)){const n=state.counts[b.set]||0;if(n>0&&n<b.required&&b.required-n<=5-depth)potential+=0.03*n}
  return value+potential;
 };
 let beam=[{ids:[],raw:{},counts:{},names:[],unverified:[]}];
 const WIDTH=180;
 for(let depth=0;depth<5;depth++){
  const expanded=[];
  for(const state of beam)for(const p of pools[depth]){
   const counts={...state.counts,[p.set]:(state.counts[p.set]||0)+1};
   expanded.push({ids:[...state.ids,p.id],raw:add(state.raw,p),counts,names:[...state.names,p.name],unverified:p.unverified?[...state.unverified,p.name]:state.unverified});
  }
  expanded.sort((a,b)=>stateRank(b,depth+1)-stateRank(a,depth+1)||a.names.join("|").localeCompare(b.names.join("|")));
  // Retain varied armor combinations, including alternate set choices.
  const next=[],seen=new Set();
  for(const state of expanded){const key=state.ids.slice(0,-1).join("|")+"|"+state.ids.at(-1);if(seen.has(key))continue;seen.add(key);next.push(state);if(next.length>=WIDTH)break}
  beam=next;
  self.postMessage({type:"progress",token,progress:Math.round((depth+1)*20)});
 }
 const ranked=beam.map(state=>{
  const {totals,active,score}=scoreOf(state.raw,state.counts);
  const extra=Object.entries(totals).filter(([s])=>!priorities.includes(s)).reduce((sum,[s,v])=>sum+Math.min(Number(v)||0,caps[s]||7),0);
  return {ids:state.ids,key:state.names.join("|"),score,extra,totals,active,profile:score.join("|"),unverified:state.unverified};
 }).sort((a,b)=>compareScore(a.score,b.score)||b.extra-a.extra||a.key.localeCompare(b.key));
 const top=[],seen=new Set();
 for(const item of ranked){if(seen.has(item.key))continue;seen.add(item.key);top.push(item);if(top.length===3)break}
 self.postMessage({type:"result",token,top,shortlisted:true});
 }catch(error){self.postMessage({type:"error",token,message:error?.message||"Unable to calculate builds."})}
};