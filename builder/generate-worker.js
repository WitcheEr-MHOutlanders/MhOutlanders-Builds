"use strict";
self.onmessage=({data})=>{
 const {pieces,sets,priorities,token}=data;
 try{
 const slots=["Head armor","Body armor","Arm armor","Waist armor","Leg armor"];
 const pools=slots.map(slot=>pieces.filter(p=>p.slot===slot));
 if(pools.some(pool=>!pool.length))throw Error("Missing armor in a required slot");
 const caps={};
 for(const p of pieces)for(const [s,v] of Object.entries(p.max||{}))caps[s]=Math.max(caps[s]||0,Number(v)||0);
 for(const s of priorities)if(!caps[s])caps[s]=7;
 const bonuses=sets.filter(s=>s.bonus?.skill_bonus).map(s=>({set:s.name,required:Number(s.bonus.required_pieces),name:s.bonus.name,skill:s.bonus.skill_bonus[0],value:Number(s.bonus.skill_bonus[1])||0,effect:s.bonus.effect||""}));
 const rem=Array.from({length:6},()=>priorities.map(()=>0));
 for(let d=4;d>=0;d--)for(let j=0;j<priorities.length;j++)rem[d][j]=rem[d+1][j]+Math.max(0,...pools[d].map(p=>Number(p.final[priorities[j]]||0)));
 const possible=priorities.map(s=>bonuses.filter(b=>b.skill===s).reduce((n,b)=>n+Math.max(0,b.value),0));
 const selected=new Array(5),counts={},raw={},best={score:null,extra:-Infinity,key:""};
 const scoreCompare=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0};
 function evaluate(){
  const totals={...raw},active=[];
  for(const b of bonuses)if((counts[b.set]||0)>=b.required){totals[b.skill]=(totals[b.skill]||0)+b.value;active.push(b)}
  const score=priorities.map(s=>Math.min(caps[s],totals[s]||0));
  const difference=best.score===null?1:scoreCompare(score,best.score);
  if(difference<0)return;
  const extra=Object.entries(totals).filter(([s])=>!priorities.includes(s)).reduce((n,[s,v])=>n+Math.min(Number(v)||0,caps[s]||7),0);
  const key=selected.map(p=>p.name).join("|");
  if(difference===0&&(extra<best.extra||(extra===best.extra&&key>=best.key)))return;
  best.score=score;best.extra=extra;best.key=key;
  best.result={ids:selected.map(p=>p.id),key,score,extra,totals,active,profile:score.join("|"),unverified:selected.filter(p=>p.unverified).map(p=>p.name)};
 }
 function bound(depth){
  if(!best.score)return true;
  for(let j=0;j<priorities.length;j++){
   const s=priorities[j],optimistic=Math.min(caps[s],(raw[s]||0)+rem[depth][j]+possible[j]);
   if(optimistic>best.score[j])return true;
   if(optimistic<best.score[j])return false;
  }
  return true;
 }
 function dfs(depth){
  if(!bound(depth))return;
  if(depth===5){evaluate();return}
  for(const p of pools[depth]){
   selected[depth]=p;counts[p.set]=(counts[p.set]||0)+1;
   for(const [s,v] of Object.entries(p.final||{}))raw[s]=(raw[s]||0)+(Number(v)||0);
   dfs(depth+1);
   for(const [s,v] of Object.entries(p.final||{}))raw[s]-=Number(v)||0;
   counts[p.set]--;
  }
 }
 for(let i=0;i<pools[0].length;i++){
  const p=pools[0][i];selected[0]=p;counts[p.set]=(counts[p.set]||0)+1;
  for(const [s,v] of Object.entries(p.final||{}))raw[s]=(raw[s]||0)+(Number(v)||0);
  dfs(1);
  for(const [s,v] of Object.entries(p.final||{}))raw[s]-=Number(v)||0;
  counts[p.set]--;
  self.postMessage({type:"progress",token,progress:Math.round(100*(i+1)/pools[0].length)});
 }
 self.postMessage({type:"result",token,top:best.result?[best.result]:[],exact:true});
 }catch(e){self.postMessage({type:"error",token,message:e.message||"Calculation failed"})}
};