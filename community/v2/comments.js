// Public Supabase URL + publishable (anon) key only. NEVER put service_role or secret keys here.
const CONFIG = { url: "", publishableKey: "" };
const $ = id => document.getElementById(id);
const status = (id, msg) => { $(id).textContent = msg; };
const make = (tag, text, cls) => { const el=document.createElement(tag); if(text!==undefined) el.textContent=text; if(cls) el.className=cls; return el; };
let db, user=null, isAdmin=false, comments=[];
function button(label, action, cls) { const b=make("button",label,cls); b.type="button"; b.addEventListener("click",action); return b; }
function showAuth() {
  $("signin").classList.toggle("hidden",!!user); $("logout").classList.toggle("hidden",!user);
  $("account").textContent=user ? "Signed in: "+(user.user_metadata?.user_name||user.user_metadata?.full_name||user.email||"Hunter")+(isAdmin?" · Owner":"") : "Not signed in";
  $("new-comment").classList.toggle("hidden",!user);
}
function displayName(){return String(user?.user_metadata?.user_name||user?.user_metadata?.full_name||user?.email?.split("@")[0]||"Hunter").slice(0,80);}
async function refresh() {
  if(!db) return;
  const {data,error}=await db.from("community_comments").select("id,author_id,author_name,body,parent_id,created_at,updated_at").order("created_at",{ascending:true}).limit(500);
  if(error){status("comment-status",error.message);return;}
  comments=data||[];render();
}
function render(){
  const root=$("comments-list");root.replaceChildren();
  if(!comments.length){root.append(make("p","No comments yet. Be the first hunter to share feedback!","muted"));return;}
  const byParent=new Map();
  for(const c of comments){const k=c.parent_id||"root";if(!byParent.has(k))byParent.set(k,[]);byParent.get(k).push(c);}
  const seen=new Set();
  function draw(c,depth=0){
    if(seen.has(c.id))return;seen.add(c.id);
    const item=make("article",undefined,"comment"+(depth?" reply":""));
    const head=make("div",undefined,"row between");
    head.append(make("span",c.author_name,"name"));
    head.append(make("span",new Date(c.created_at).toLocaleString()+(c.updated_at!==c.created_at?" · edited":""),"muted"));
    item.append(head);
    const body=make("p",c.body);body.style.whiteSpace="pre-wrap";body.style.overflowWrap="anywhere";item.append(body);
    const actions=make("div",undefined,"row actions");
    if(user)actions.append(button("Reply",()=>editor(item,c.id,"reply")));
    if(user&&(c.author_id===user.id||isAdmin)){
      if(c.author_id===user.id)actions.append(button("Edit",()=>editor(item,c.id,"edit")));
      actions.append(button("Delete",async()=>{
        if(!confirm("Delete this comment? Its replies will also be removed."))return;
        const {error}=await db.from("community_comments").delete().eq("id",c.id);
        if(error)alert(error.message);else await refresh();
      },"danger"));
    }
    item.append(actions);root.append(item);
    for(const child of byParent.get(c.id)||[])draw(child,Math.min(depth+1,3));
  }
  for(const c of byParent.get("root")||[])draw(c);
}
function editor(item,id,mode){
  const old=item.querySelector(".inline-editor");if(old)old.remove();
  const wrap=make("div",undefined,"inline-editor");
  const original=comments.find(c=>c.id===id);
  const field=make("textarea");field.maxLength=4000;field.value=mode==="edit"?original.body:"";
  const row=make("div",undefined,"row");
  row.append(button("Cancel",()=>wrap.remove()));
  row.append(button(mode==="edit"?"Save changes":"Post reply",async()=>{
    const body=field.value.trim();if(!body||body.length>4000)return;
    const result=mode==="edit" ? await db.from("community_comments").update({body}).eq("id",id) : await db.from("community_comments").insert({author_id:user.id,author_name:displayName(),body,parent_id:id});
    if(result.error)alert(result.error.message);else await refresh();
  },"primary"));
  wrap.append(field,row);item.append(wrap);field.focus();
}
async function loadUser(){
  const {data:{user:current},error}=await db.auth.getUser();
  user=error?null:current;
  isAdmin=false;
  if(user){const r=await db.rpc("is_community_admin");isAdmin=r.data===true;}
  showAuth();render();
}
async function init(){
  if(!CONFIG.url||!CONFIG.publishableKey){
    status("auth-status","Setup pending: connect your Supabase project before sign-in and comments can work.");
    $("signin").classList.add("hidden");$("new-comment").classList.add("hidden");
    $("comments-list").textContent="The new comment system is waiting for Supabase configuration. Existing comments remain available on the live Community page.";
    return;
  }
  try {
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    db=createClient(CONFIG.url,CONFIG.publishableKey,{auth:{persistSession:true,detectSessionInUrl:true}});
    db.auth.onAuthStateChange(()=>{setTimeout(()=>{loadUser().catch(console.error);},0);});
    const redirectTo=location.origin+location.pathname;
    for(const provider of ["github","google"])$(provider).addEventListener("click",async()=>{
      const {error}=await db.auth.signInWithOAuth({provider,options:{redirectTo}});
      if(error)status("auth-status",error.message);
    });
    $("email-submit").addEventListener("click",async()=>{
      const email=$("email").value.trim();
      if(!email){status("auth-status","Enter your email first.");return;}
      const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});
      status("auth-status",error?error.message:"Check your email for your sign-in link.");
    });
    $("logout").addEventListener("click",async()=>{await db.auth.signOut();await loadUser();});
    $("new-comment").addEventListener("submit",async e=>{
      e.preventDefault();if(!user)return;
      const body=$("body").value.trim();if(!body)return;
      $("post").disabled=true;
      const {error}=await db.from("community_comments").insert({author_id:user.id,author_name:displayName(),body});
      $("post").disabled=false;
      if(error)status("comment-status",error.message);else{$("body").value="";status("comment-status","Comment posted!");await refresh();}
    });
    $("refresh").addEventListener("click",refresh);
    await loadUser();await refresh();
    $("setup").textContent="Preview mode: the existing Giscus comments remain live until the new system is tested and approved.";
  }catch(e){status("auth-status","Could not load comment system: "+e.message);}
}
init();
