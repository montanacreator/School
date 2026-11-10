const TABS=[["home","Dashboard"],["subj","Fächer"],["grade","Noten"],["test","Arbeiten"],["note","Notizen"],["set","Einstellungen"]];
let S={subjects:[],grades:[],tests:[],notes:[]},tab="home";
try{const r=localStorage.getItem("schulapp");if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
if(location.hash){const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h))tab=h}
let lastJson=null,pushT=null,cloudRef=null,syncMsg='';
const syncData=()=>({subjects:S.subjects,grades:S.grades,tests:S.tests,notes:S.notes.map(n=>({...n,att:[]}))});
const save=()=>{const j=JSON.stringify(syncData());if(lastJson!==null&&j!==lastJson){S.updated=Date.now();schedulePush()}lastJson=j;try{localStorage.setItem("schulapp",JSON.stringify(S))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const sName=id=>(S.subjects.find(s=>s.id===id)||{name:"–"}).name;
const cls=n=>"g"+Math.min(5,Math.max(1,Math.round(n)));
const fmt=n=>n.toFixed(2).replace(".",",");
function avg(list){let w=0,t=0;list.forEach(g=>{w+=+g.w||1;t+=g.v*(+g.w||1)});return w?t/w:null}
const fd=d=>d?new Date(d+"T00:00").toLocaleDateString("de-DE",{weekday:"short",day:"numeric",month:"short"}):"";
const today=()=>new Date().toISOString().slice(0,10);
const opts=()=>S.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
const needSubj=()=>`<div class="card empty">Lege zuerst unter „Fächer“ ein Fach an.</div>`;

const V={
home(){
 const a=avg(S.grades);
 const up=S.tests.filter(t=>t.date>=today()).sort((x,y)=>x.date.localeCompare(y.date)).slice(0,3);
 const rows=S.subjects.map(s=>({s,a:avg(S.grades.filter(g=>g.sid===s.id))})).filter(r=>r.a!==null);
 return `<h1>Schule</h1>
 <div class="card row"><div><div class="mu">Gesamtdurchschnitt</div><div class="big">${a===null?"–":fmt(a)}</div></div><div class="mu">${S.grades.length} Noten<br>${S.subjects.length} Fächer</div></div>
 <h2>Nächste Arbeiten</h2>
 ${up.length?up.map(t=>`<div class="card row"><div><b>${esc(t.title)}</b><div class="mu">${esc(sName(t.sid))}</div></div><div class="soon">${fd(t.date)}</div></div>`).join(""):`<div class="card empty">Keine anstehenden Arbeiten.</div>`}
 <h2>Durchschnitt je Fach</h2>
 ${rows.length?rows.map(r=>`<div class="card"><div class="row"><b>${esc(r.s.name)}</b><span class="badge ${cls(r.a)}">${fmt(r.a)}</span></div><div class="bar"><i style="width:${Math.max(4,(6-r.a)/5*100)}%"></i></div></div>`).join(""):`<div class="card empty">Trage Noten ein, dann siehst du hier deine Durchschnitte.</div>`}`},
subj(){
 const s=S.subjects.find(x=>x.id===SEL.subj);
 if(s){const G=S.grades.filter(g=>g.sid===s.id),T=S.tests.filter(t=>t.sid===s.id).sort((x,y)=>x.date.localeCompare(y.date)),N=S.notes.filter(n=>n.sid===s.id),a=avg(G);
 return `${back('subj')}<div class="row"><h1>${esc(s.name)}</h1>${a!==null?`<span class="badge ${cls(a)}">Ø ${fmt(a)}</span>`:''}</div>
 <div class="mu" style="margin:-8px 0 8px">${esc(s.teacher||'Keine Lehrkraft angegeben')}</div>
 <h2>Noten</h2>${G.length?[...G].sort((x,y)=>y.d.localeCompare(x.d)).map(g=>`<div class="card row"><div><b>${esc(g.label||'Note')}</b><div class="mu">${fd(g.d)}</div></div><span class="badge ${cls(g.v)}">${String(g.v).replace('.',',')}</span></div>`).join(''):`<div class="card empty">Noch keine Noten.</div>`}
 <h2>Arbeiten</h2>${T.length?T.map(t=>`<div class="card row"><b>${esc(t.title)}</b><span class="${t.date>=today()?'soon':'mu'}">${fd(t.date)}</span></div>`).join(''):`<div class="card empty">Keine Arbeiten.</div>`}
 <h2>Notizen</h2>${N.length?N.map(n=>`<div class="card"><b>${esc(n.title||'Ohne Titel')}</b>${n.text?`<p style="white-space:pre-wrap;margin:6px 0 0">${esc(n.text)}</p>`:''}${(n.att||[]).length?`<div class="atts">${n.att.map(z=>chip(z,false)).join('')}</div>`:''}</div>`).join(''):`<div class="card empty">Keine Notizen zu diesem Fach.</div>`}
 ${DELC?`<div class="card" style="margin-top:10px"><b>Fach wirklich löschen?</b><div class="mu" style="margin:4px 0 10px">Alle Noten und Arbeiten dieses Fachs werden ebenfalls gelöscht.</div><div style="display:flex;gap:8px"><button class="alt" style="flex:1" onclick="DELC=false;go()">Abbrechen</button><button class="pri" style="flex:1;background:var(--g5);color:#fff" onclick="SEL.subj='';DELC=false;del('subjects','${s.id}')">Löschen</button></div></div>`:`<button class="alt" style="width:100%;margin-top:10px" onclick="DELC=true;go()">Fach löschen</button>`}`}
 return `<div class="row"><h1>Fächer</h1>${NEWS?'':'<button class="plus" aria-label="Fach hinzufügen" onclick="NEWS=true;go()">+</button>'}</div>
 ${NEWS?`<div class="card"><input id="n" placeholder="Fachname, z. B. Mathe"><input id="t" placeholder="Lehrkraft (optional)"><div style="display:flex;gap:8px;margin-top:8px"><button class="alt" style="flex:1" onclick="NEWS=false;go()">Abbrechen</button><button class="pri" style="flex:1" onclick="addSubj()">Hinzufügen</button></div></div>`:''}
 ${S.subjects.length?S.subjects.map(s=>{const a=avg(S.grades.filter(g=>g.sid===s.id));return `<button class="card row sbtn" onclick="selS('subj','${s.id}')"><div><b>${esc(s.name)}</b><div class="mu">${esc(s.teacher||'Keine Lehrkraft angegeben')}</div></div>${a!==null?`<span class="badge ${cls(a)}">${fmt(a)}</span>`:''}</button>`}).join(''):`<div class="card empty">Noch keine Fächer.</div>`}`},
subj_old(){
 return `<h1>Fächer</h1>
 <div class="card"><input id="n" placeholder="Fachname, z. B. Mathe"><input id="t" placeholder="Lehrkraft (optional)"><button class="pri" onclick="addSubj()">Fach hinzufügen</button></div>
 ${S.subjects.length?S.subjects.map(s=>{const a=avg(S.grades.filter(g=>g.sid===s.id));return `<div class="card row"><div><b>${esc(s.name)}</b><div class="mu">${esc(s.teacher||"Keine Lehrkraft angegeben")}</div></div><div class="row">${a!==null?`<span class="badge ${cls(a)}">${fmt(a)}</span>`:""}<button class="del" aria-label="Fach löschen" onclick="del('subjects','${s.id}')">×</button></div></div>`}).join(""):`<div class="card empty">Noch keine Fächer.</div>`}`},
grade(){
 if(!S.subjects.length)return `<h1>Noten</h1>`+needSubj();
 const s=S.subjects.find(x=>x.id===SEL.grade);
 if(!s)return subjList('grade','Noten',x=>{const g=S.grades.filter(y=>y.sid===x.id);return g.length?`${g.length} Noten · Ø ${fmt(avg(g))}`:'Noch keine Noten'});
 const L=S.grades.filter(g=>g.sid===s.id),a=avg(L);
 return `${back('grade')}<div class="row"><h1>${esc(s.name)}</h1>${a!==null?`<span class="badge ${cls(a)}">Ø ${fmt(a)}</span>`:''}</div>
 <div class="card"><input id="v" type="number" min="1" max="6" step="0.25" inputmode="decimal" placeholder="Note (1 bis 6)"><input id="l" placeholder="Bezeichnung, z. B. Klassenarbeit"><select id="w"><option value="1">Mündlich / Test (Gewicht 1)</option><option value="2">Klassenarbeit (Gewicht 2)</option></select><input id="d" type="date" value="${today()}"><button class="pri" onclick="addGrade()">Note speichern</button></div>
 ${L.length?[...L].sort((x,y)=>y.d.localeCompare(x.d)).map(g=>`<div class="card row"><div><b>${esc(g.label||'Note')}</b><div class="mu">${fd(g.d)}</div></div><div class="row"><span class="badge ${cls(g.v)}">${String(g.v).replace('.',',')}</span><button class="del" aria-label="Note löschen" onclick="del('grades','${g.id}')">×</button></div></div>`).join(''):`<div class="card empty">Noch keine Noten in diesem Fach.</div>`}`},
grade_old(){
 if(!S.subjects.length)return `<h1>Noten</h1>`+needSubj();
 return `<h1>Noten</h1>
 <div class="card"><select id="s">${opts()}</select><input id="v" type="number" min="1" max="6" step="0.25" inputmode="decimal" placeholder="Note (1 bis 6)"><input id="l" placeholder="Bezeichnung, z. B. Klassenarbeit"><select id="w"><option value="1">Mündlich / Test (Gewicht 1)</option><option value="2">Klassenarbeit (Gewicht 2)</option></select><input id="d" type="date" value="${today()}"><button class="pri" onclick="addGrade()">Note speichern</button></div>
 ${S.grades.length?[...S.grades].sort((a,b)=>b.d.localeCompare(a.d)).map(g=>`<div class="card row"><div><b>${esc(g.label||"Note")}</b><div class="mu">${esc(sName(g.sid))} – ${fd(g.d)}</div></div><div class="row"><span class="badge ${cls(g.v)}">${String(g.v).replace(".",",")}</span><button class="del" aria-label="Note löschen" onclick="del('grades','${g.id}')">×</button></div></div>`).join(""):`<div class="card empty">Noch keine Noten.</div>`}`},
test(){
 if(!S.subjects.length)return `<h1>Arbeiten</h1>`+needSubj();
 const s=S.subjects.find(x=>x.id===SEL.test);
 if(!s)return subjList('test','Arbeiten',x=>{const n=S.tests.filter(t=>t.sid===x.id&&t.date>=today()).length;return n?`${n} anstehend`:'Keine anstehenden Arbeiten'});
 const L=S.tests.filter(t=>t.sid===s.id).sort((x,y)=>x.date.localeCompare(y.date));
 return `${back('test')}<h1>${esc(s.name)}</h1>
 <div class="card"><input id="t" placeholder="Thema, z. B. Bruchrechnen"><input id="d" type="date" value="${today()}"><button class="pri" onclick="addTest()">Arbeit eintragen</button></div>
 ${L.length?L.map(t=>`<div class="card row"><b>${esc(t.title)}</b><div class="row"><span class="${t.date>=today()?'soon':'mu'}">${fd(t.date)}</span><button class="del" aria-label="Arbeit löschen" onclick="del('tests','${t.id}')">×</button></div></div>`).join(''):`<div class="card empty">Keine Arbeiten in diesem Fach.</div>`}`},
test_old(){
 if(!S.subjects.length)return `<h1>Tests</h1>`+needSubj();
 const l=[...S.tests].sort((a,b)=>a.date.localeCompare(b.date));
 return `<h1>Tests</h1>
 <div class="card"><select id="s">${opts()}</select><input id="t" placeholder="Thema, z. B. Bruchrechnen"><input id="d" type="date" value="${today()}"><button class="pri" onclick="addTest()">Test eintragen</button></div>
 ${l.length?l.map(t=>`<div class="card row"><div><b>${esc(t.title)}</b><div class="mu">${esc(sName(t.sid))}</div></div><div class="row"><span class="${t.date>=today()?"soon":"mu"}">${fd(t.date)}</span><button class="del" aria-label="Test löschen" onclick="del('tests','${t.id}')">×</button></div></div>`).join(""):`<div class="card empty">Keine Tests eingetragen.</div>`}`},
note(){
 const isGen=SEL.note==='none',s=S.subjects.find(x=>x.id===SEL.note);
 const gen=n=>!n.sid||!S.subjects.some(z=>z.id===n.sid);
 const cnt=n=>n+' '+(n===1?'Notiz':'Notizen');
 if(!s&&!isGen){const gc=S.notes.filter(gen).length;
  return subjList('note','Notizen',x=>{const n=S.notes.filter(y=>y.sid===x.id).length;return n?cnt(n):'Keine Notizen'})+(gc?`<button class="card row sbtn" onclick="selS('note','none')"><div><b>Ohne Fach</b><div class="mu">${cnt(gc)}</div></div></button>`:'')}
 const L=S.notes.filter(n=>isGen?gen(n):n.sid===s.id);
 return `${back('note')}<div class="row"><h1>${isGen?'Ohne Fach':esc(s.name)}</h1>${NEW?'':'<button class="plus" aria-label="Neue Notiz" onclick="NEW=true;go()">+</button>'}</div>
 <div class="grid2"><button class="alt" onclick="$('fp').click()">📄 PDF hochladen</button><button class="alt" onclick="$('fs').click()">📷 Foto / Scan</button><button class="alt" onclick="$('fi').click()">🖼️ Bild hochladen</button></div>
 <input id="fp" type="file" accept="application/pdf" multiple style="display:none" onchange="pick(this,'pdf')"><input id="fs" type="file" accept="image/*" capture="environment" style="display:none" onchange="pick(this,'scan')"><input id="fi" type="file" accept="image/*" multiple style="display:none" onchange="pick(this,'img')">
 ${NEW?`<div class="card"><input placeholder="Titel" value="${esc(D.title)}" oninput="D.title=this.value"><textarea rows="4" placeholder="Aufschrieb, Hausaufgaben, Formeln …" oninput="D.text=this.value">${esc(D.text)}</textarea>${D.att.length?`<div class="atts">${D.att.map(a=>chip(a,true)).join("")}</div>`:""}<div style="display:flex;gap:8px;margin-top:8px"><button class="alt" style="flex:1" onclick="cancelNote()">Abbrechen</button><button class="pri" style="flex:1" onclick="addNote()">Speichern</button></div></div>`:''}
 ${L.length?[...L].reverse().map(n=>`<div class="card"><div class="row"><b>${esc(n.title||"Ohne Titel")}</b><button class="del" aria-label="Notiz löschen" onclick="del('notes','${n.id}')">×</button></div>${n.text?`<p style="white-space:pre-wrap;margin:8px 0 0">${esc(n.text)}</p>`:""}${(n.att||[]).length?`<div class="atts">${n.att.map(a=>chip(a,false)).join("")}</div>`:""}</div>`).join(""):`<div class="card empty">Noch keine Notizen in diesem Bereich.</div>`}`},
set(){
 const sw=['#4b4f58','#1c3f94','#7c3aed','#db2777','#e11d48','#ea580c','#ca8a04','#16a34a','#0d9488','#0891b2'];
 const cur=C.color||'#4b4f58';
 return `<h1>Einstellungen</h1>
 <div class="card"><b>Farbe der App</b><div class="mu" style="margin:4px 0 10px">Wähle eine beliebige Farbe.</div>
 <div class="row" style="justify-content:flex-start"><input type="color" aria-label="Eigene Farbe" value="${cur}" oninput="setColor(this.value)" style="width:64px;height:44px;padding:2px;margin:0"><span class="mu">Eigene Farbe</span></div>
 <div class="atts">${sw.map(c=>`<button aria-label="Farbe ${c}" onclick="setColor('${c}');go()" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--ln);background:${c};padding:0"></button>`).join('')}</div>
 ${C.color?`<button class="alt" style="width:100%" onclick="setColor('');go()">Zurücksetzen</button>`:''}</div>
 <div class="card"><b>PIN</b><div class="mu" style="margin:4px 0 10px">Schützt die App beim Öffnen.</div>
 ${C.pin?`<div class="mu">PIN ist aktiv.</div><button class="alt" style="width:100%;margin-top:8px" onclick="rmPin()">PIN entfernen</button>`:`<input id="pn" type="password" inputmode="numeric" maxlength="8" placeholder="4 bis 8 Ziffern"><button class="pri" onclick="setPin()">PIN festlegen</button>`}</div>
 <div class="card"><b>Face ID / Fingerabdruck</b><div class="mu" style="margin:4px 0 10px">Entsperren mit der Biometrie deines Geräts. Eine PIN oder ein Konto dient als Ersatz.</div>
 ${C.bio?`<div class="mu">Ist aktiv.</div><button class="alt" style="width:100%;margin-top:8px" onclick="C.bio=null;saveC();go()">Deaktivieren</button>`:`<button class="pri" onclick="setBio()">Einrichten</button>`}</div>
 ${cloudCard()}
 ${dataCard()}
 <div class="card"><b>Lokale Sperre mit E-Mail</b><div class="mu" style="margin:4px 0 10px">Zusätzliche Sperre nur für dieses Gerät, unabhängig vom Sync.</div>
 ${C.acct?`<div class="mu">Angemeldet als <b>${esc(C.acct.e)}</b></div><button class="alt" style="width:100%;margin-top:8px" onclick="rmAcct()">Konto entfernen</button>`:`<input id="em" type="email" placeholder="E-Mail" autocomplete="username"><input id="pw" type="password" placeholder="Passwort (mind. 6 Zeichen)" autocomplete="new-password"><button class="pri" onclick="mkAcct()">Konto erstellen</button>`}</div>
 ${(C.pin||C.acct)?`<button class="pri" onclick="lock()">Jetzt sperren</button>`:''}`},
note_old(){
 return `<h1>Notizen</h1>
 <div class="card">${S.subjects.length?`<select id="s"><option value="">Ohne Fach</option>${opts()}</select>`:""}<input id="t" placeholder="Titel"><textarea id="x" rows="4" placeholder="Aufschrieb, Hausaufgaben, Formeln …"></textarea><button class="pri" onclick="addNote()">Notiz speichern</button></div>
 ${S.notes.length?[...S.notes].reverse().map(n=>`<div class="card"><div class="row"><b>${esc(n.title||"Ohne Titel")}</b><button class="del" aria-label="Notiz löschen" onclick="del('notes','${n.id}')">×</button></div><div class="mu">${n.sid?esc(sName(n.sid)):"Allgemein"}</div><p style="white-space:pre-wrap;margin:8px 0 0">${esc(n.text)}</p></div>`).join(""):`<div class="card empty">Noch keine Notizen.</div>`}`}
};
let SEL={grade:'',test:'',subj:'',note:''};let NEW=false,NEWS=false,DELC=false;
let D={sid:"",title:"",text:"",att:[]};
function cancelNote(){D.att.forEach(a=>fdel(a.id));D={sid:'',title:'',text:'',att:[]};NEW=false;go()}
function selS(k,id){DELC=false;if(k==='note'&&(NEW||D.att.length)){D.att.forEach(a=>fdel(a.id));D={sid:'',title:'',text:'',att:[]};NEW=false}SEL[k]=id;go();sTop()}
const back=k=>`<button class="alt" style="padding:8px 14px;margin-bottom:6px" onclick="selS('${k}','')">‹ Fächer</button>`;
function subjList(k,title,info){return `<h1>${title}</h1><div class="mu" style="margin:-8px 0 12px">Wähle ein Fach.</div>`+S.subjects.map(s=>`<button class="card row sbtn" onclick="selS('${k}','${s.id}')"><div><b>${esc(s.name)}</b><div class="mu">${info(s)}</div></div></button>`).join('')}
const dbp=()=>new Promise((res,rej)=>{const r=indexedDB.open("schule",1);r.onupgradeneeded=()=>r.result.createObjectStore("f",{keyPath:"id"});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function fput(o){const d=await dbp();return new Promise((res,rej)=>{const t=d.transaction("f","readwrite");t.objectStore("f").put(o);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function fget(id){const d=await dbp();return new Promise((res,rej)=>{const q=d.transaction("f").objectStore("f").get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function fdel(id){try{const d=await dbp();d.transaction("f","readwrite").objectStore("f").delete(id)}catch(e){}}
function chip(a,rm){const x=rm?`<button class="rm" aria-label="Anhang entfernen" onclick="rmAtt('${a.id}')">×</button>`:"";
 if(a.type==="pdf")return `<span class="thb"><button class="pdf" onclick="openF('${a.id}')">📄 ${esc(a.name)}</button>${x}</span>`;
 return `<span class="thb"><button class="thb" aria-label="${esc(a.name)} öffnen" onclick="openF('${a.id}')"><img class="th" data-fid="${a.id}" alt="${esc(a.name)}"></button>${x}</span>`}
function hydrate(){document.querySelectorAll("img[data-fid]").forEach(async i=>{try{const f=await fget(i.dataset.fid);if(f)i.src=f.data}catch(e){}})}
function rmAtt(id){D.att=D.att.filter(a=>a.id!==id);fdel(id);go()}
const rd=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(f)});
function prep(f,scan){return new Promise(async(res,rej)=>{try{const im=new Image();im.onload=()=>{const m=1600,k=Math.min(1,m/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext("2d");x.drawImage(im,0,0,c.width,c.height);
 if(scan){const d=x.getImageData(0,0,c.width,c.height),p=d.data,h=new Array(256).fill(0);for(let i=0;i<p.length;i+=4){const g=Math.round(.3*p[i]+.59*p[i+1]+.11*p[i+2]);p[i]=g;h[g]++}
 const n=p.length/4;let a=0,lo=0,hi=255;for(let i=0;i<256;i++){a+=h[i];if(a>n*.03){lo=i;break}}a=0;for(let i=255;i>=0;i--){a+=h[i];if(a>n*.35){hi=i;break}}if(hi<=lo+20)hi=lo+20;
 for(let i=0;i<p.length;i+=4){let v=(p[i]-lo)/(hi-lo);v=Math.min(1,Math.max(0,v));v=v*v*(3-2*v)*255;p[i]=p[i+1]=p[i+2]=v;p[i+3]=255}x.putImageData(d,0,0)}
 res(c.toDataURL("image/jpeg",.82))};im.onerror=()=>rej(new Error("Bild"));im.src=await rd(f)}catch(e){rej(e)}})}
async function pick(inp,kind){const files=[...inp.files];inp.value="";for(const f of files){try{let data,type,name=f.name;
 if(kind==="pdf"){if(f.size>15*1048576){alert("Die PDF „"+f.name+"“ ist größer als 15 MB.");continue}data=await rd(f);type="pdf";if(!/\.pdf$/i.test(name))name+=".pdf"}
 else{data=await prep(f,kind==="scan");type="img";const t=new Date().toLocaleDateString("de-DE");name=kind==="scan"?"Scan "+t+".jpg":kind==="photo"?"Foto "+t+".jpg":name.replace(/\.\w+$/,"")+".jpg"}
 const id=uid();await fput({id,name,type,data});D.att.push({id,name,type})}catch(e){alert("Die Datei konnte nicht gespeichert werden.")}}NEW=true;go()}
function toBlob(u){const[h,b]=u.split(",");const m=h.match(/:(.*?);/)[1],s=atob(b),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return new Blob([a],{type:m})}
async function openF(id){let f;try{f=await fget(id)}catch(e){}if(!f)return alert("Datei nicht gefunden.");const o=document.createElement("div");o.id="ov";
 o.innerHTML=`<div class="bar2"><b>${esc(f.name)}</b><button id="sv">Speichern</button><button id="cl">Schließen</button></div><div class="bd">${f.type==="pdf"?`<div id="pg" style="width:100%;padding:8px"><div class="mu" style="text-align:center;padding:20px">PDF wird geladen …</div></div>`:`<img alt="${esc(f.name)}" src="${f.data}">`}</div>`;
 (document.getElementById("phone")||document.body).appendChild(o);$("cl").onclick=()=>o.remove();if(f.type==="pdf")renderPdf(f);
 $("sv").onclick=async()=>{try{const dl=window.claude&&await window.claude.use("downloads");if(!dl)return alert("Speichern ist hier nicht verfügbar.");await dl.save({filename:f.name,data:toBlob(f.data)})}catch(e){}}}
const $=id=>document.getElementById(id);
function addSubj(){const n=$("n").value.trim();if(!n)return;S.subjects.push({id:uid(),name:n,teacher:$("t").value.trim()});NEWS=false;go()}
function addGrade(){const v=parseFloat($("v").value.replace(",","."));if(!(v>=1&&v<=6))return alert("Bitte eine Note zwischen 1 und 6 eingeben.");S.grades.push({id:uid(),sid:SEL.grade,v,label:$("l").value.trim(),w:$("w").value,d:$("d").value||today()});go()}
function addTest(){const t=$("t").value.trim();if(!t)return;S.tests.push({id:uid(),sid:SEL.test,title:t,date:$("d").value||today()});go()}
function addNote(){const x=D.text.trim();if(!x&&!D.att.length)return alert("Schreibe etwas oder füge einen Anhang hinzu.");S.notes.push({id:uid(),sid:SEL.note==="none"?"":SEL.note,title:D.title.trim(),text:x,att:D.att});NEW=false;D={sid:"",title:"",text:"",att:[]};go()}
function del(k,id){if(k==="notes"){const n=S.notes.find(i=>i.id===id);((n&&n.att)||[]).forEach(a=>fdel(a.id))}S[k]=S[k].filter(i=>i.id!==id);if(k==="subjects"){S.grades=S.grades.filter(g=>g.sid!==id);S.tests=S.tests.filter(t=>t.sid!==id)}go()}
let MENU=false;
function go(t){if(t){tab=t;MENU=false}S.subjects.sort((a,b)=>a.name.localeCompare(b.name,'de',{sensitivity:'base'}));save();$("app").innerHTML=V[tab]();renderTop();if(t)sTop();hydrate()}
function renderTop(){const lab=Object.fromEntries(TABS);
 $("top").innerHTML=`<button class="tb" aria-label="Menü" aria-expanded="${MENU}" onclick="MENU=!MENU;renderTop()"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><span class="ttl">${lab[tab]}</span><button class="tb${tab==="set"?" on":""}" aria-label="Einstellungen" onclick="go('set')"><svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><defs><clipPath id="pc"><circle cx="16" cy="16" r="14"/></clipPath></defs><circle cx="16" cy="16" r="14" fill="var(--ac2)" stroke="currentColor" stroke-width="2"/><g clip-path="url(#pc)" fill="currentColor"><circle cx="16" cy="12.5" r="5"/><ellipse cx="16" cy="27.5" rx="10" ry="8"/></g></svg></button>`;
 const m=$("menu");m.hidden=!MENU;m.innerHTML=MENU?`<div class="mp" onclick="event.stopPropagation()">${TABS.filter(t=>t[0]!=="set").map(([k,l])=>`<button class="${k===tab?"on":""}" onclick="go('${k}')">${l}</button>`).join("")}</div>`:""}
function sTop(){window.scrollTo(0,0);const m=document.getElementById("app");if(m)m.scrollTop=0}
let C={color:'',pin:null,bio:null,acct:null};
try{const r=localStorage.getItem('schulcfg');if(r)C=Object.assign(C,JSON.parse(r))}catch(e){}
const saveC=()=>{try{localStorage.setItem('schulcfg',JSON.stringify(C))}catch(e){}};
const fix=()=>{if(!C.pin&&!C.acct)C.bio=null;saveC()};
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toH=a=>'#'+a.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const mixc=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
const lum=a=>(.299*a[0]+.587*a[1]+.114*a[2])/255;
function applyColor(){const r=document.documentElement.style;
 if(!C.color){['--ac','--ac2','--on'].forEach(k=>r.removeProperty(k));return}
 const dk=matchMedia('(prefers-color-scheme:dark)').matches;let a=hx(C.color);
 if(!dk&&lum(a)>.55)a=mixc(a,[0,0,0],.4);
 if(dk&&lum(a)<.3)a=mixc(a,[255,255,255],.35);
 r.setProperty('--ac',toH(a));r.setProperty('--ac2',toH(dk?mixc(a,[13,20,36],.82):mixc(a,[255,255,255],.88)));r.setProperty('--on',lum(a)>.6?'#111':'#fff')}
function setColor(v){C.color=v;saveC();applyColor()}
try{matchMedia('(prefers-color-scheme:dark)').addEventListener('change',applyColor)}catch(e){}
async function hash(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;for(const c of s)h=((h*33)^c.charCodeAt(0))>>>0;return 'x'+h}}
async function setPin(){const v=$('pn').value.trim();if(!/^\d{4,8}$/.test(v))return alert('Die PIN muss aus 4 bis 8 Ziffern bestehen.');const s=uid();C.pin={s,h:await hash(s+v),n:v.length};saveC();go()}
function rmPin(){C.pin=null;fix();go()}
async function mkAcct(){const e=$('em').value.trim().toLowerCase(),p=$('pw').value;if(!/^\S+@\S+\.\S+$/.test(e))return alert('Bitte eine gültige E-Mail-Adresse eingeben.');if(p.length<6)return alert('Das Passwort braucht mindestens 6 Zeichen.');const s=uid();C.acct={e,s,h:await hash(s+p)};saveC();go()}
function rmAcct(){C.acct=null;fix();go()}
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));const unb=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function setBio(){if(!C.pin&&!C.acct)return alert('Lege zuerst eine PIN oder ein Konto fest, als Ersatz falls Face ID nicht klappt.');
 try{const cr=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'Schule'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'schule',displayName:'Schule'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required'},timeout:60000}});C.bio=b64(cr.rawId);saveC();go()}
 catch(e){alert('Face ID / Fingerabdruck ist in dieser Ansicht oder auf diesem Gerät nicht verfügbar. Öffne die Seite direkt im Browser und versuche es erneut.')}}
async function bioUnlock(){try{await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:unb(C.bio)}],userVerification:'required',timeout:60000}});unlock()}catch(e){$('lm').textContent='Face ID hat nicht geklappt.'}}
let locked=false;
function lock(){if(!(C.pin||C.acct))return;locked=true;const old=$('lk');if(old)old.remove();const o=document.createElement('div');o.id='lk';
 o.innerHTML=`<h1>Schule</h1><div class="mu" id="lm" role="alert">Gesperrt</div>${C.acct?`<input id="le" type="email" placeholder="E-Mail" autocomplete="username"><input id="lp" type="password" placeholder="Passwort" autocomplete="current-password"><button class="pri" onclick="tryAcct()">Anmelden</button>`:''}${C.pin?`<input id="lpin" type="password" inputmode="numeric" maxlength="${C.pin.n}" placeholder="PIN" oninput="tryPin()" style="font-size:22px;letter-spacing:.4em">`:''}${C.bio?`<button class="alt" onclick="bioUnlock()">Mit Face ID / Fingerabdruck entsperren</button>`:''}`;
 (document.getElementById("phone")||document.body).appendChild(o)}
function unlock(){const o=$('lk');if(o)o.remove();locked=false}
async function tryAcct(){const e=$('le').value.trim().toLowerCase();if(e===C.acct.e&&await hash(C.acct.s+$('lp').value)===C.acct.h)unlock();else $('lm').textContent='E-Mail oder Passwort falsch.'}
async function tryPin(){const v=$('lpin').value;if(v.length===C.pin.n){if(await hash(C.pin.s+v)===C.pin.h)unlock();else{$('lm').textContent='Falsche PIN.';$('lpin').value=''}}}
function cloudCard(){
 if(!cloudRef)return `<div class="card"><b>Sync mit Claude-Konto</b><div class="mu" style="margin-top:4px" id="syn" role="status">${esc(syncMsg||'Nicht verbunden. Öffne diese Seite über Claude, während du angemeldet bist.')}</div></div>`;
 return `<div class="card"><b>Sync mit Claude-Konto</b><div class="mu" style="margin:4px 0 8px">Deine Daten folgen deinem Claude-Konto. Öffne denselben Link auf iPad oder PC mit demselben Konto. Anhänge bleiben auf dem Gerät.</div><div class="mu" id="syn" role="status">${esc(syncMsg)}</div><button class="alt" style="width:100%;margin-top:8px" onclick="pull(true)">Jetzt synchronisieren</button></div>`}
const setMsg=m=>{syncMsg=m;const s=$('syn');if(s)s.textContent=m};
const mergeBy=(a,b)=>{const m=new Map();[...a,...b].forEach(x=>{if(!m.has(x.id))m.set(x.id,x)});return [...m.values()]};
function schedulePush(){clearTimeout(pushT);if(cloudRef)pushT=setTimeout(pushNow,1500)}
async function pushNow(){if(!cloudRef)return;try{await cloudRef.set({data:JSON.stringify(syncData()),updated:S.updated||Date.now()});setMsg('Synchronisiert um '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}))}catch(e){setMsg('Sync-Fehler: Daten konnten nicht gespeichert werden.')}}
async function pull(manual){if(!cloudRef)return;let applied=false;try{
 const d=await cloudRef.get();
 const hasLocal=S.subjects.length||S.grades.length||S.tests.length||S.notes.length;
 let first=true;try{first=localStorage.getItem('schulsync')!=='1'}catch(e){}
 if(!d.exists){if(hasLocal){S.updated=S.updated||Date.now();await pushNow()}else setMsg('Verbunden. Noch keine Daten in der Cloud.')}
 else{const v=d.data(),r=JSON.parse(v.data),old=Object.fromEntries(S.notes.map(n=>[n.id,n.att||[]]));
  if(first&&hasLocal){S.subjects=mergeBy(r.subjects||[],S.subjects);S.grades=mergeBy(r.grades||[],S.grades);S.tests=mergeBy(r.tests||[],S.tests);S.notes=mergeBy((r.notes||[]).map(n=>({...n,att:old[n.id]||[]})),S.notes);S.updated=Date.now();applied=true;await pushNow();lastJson=JSON.stringify(syncData())}
  else if(v.updated>(S.updated||0)){S.subjects=r.subjects||[];S.grades=r.grades||[];S.tests=r.tests||[];S.notes=(r.notes||[]).map(n=>({...n,att:old[n.id]||[]}));S.updated=v.updated;lastJson=JSON.stringify(syncData());applied=true;setMsg('Daten aus der Cloud geladen.')}
  else if(v.updated<(S.updated||0)){await pushNow()}
  else setMsg('Alles auf dem neuesten Stand.')}
 try{localStorage.setItem('schulsync','1')}catch(e){}}catch(e){setMsg('Sync-Fehler: Keine Verbindung oder kein Zugriff.')}
 if(applied||manual||tab==='set')go()}
async function cloudInit(){try{if(!window.claude)return;const db=await claude.use('db'),user=await claude.use('user');if(!db||!user)return;const id=await user.id();if(!id)return;cloudRef=db.collection('data/users/'+id).doc('schule');await pull();document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()})}catch(e){}}
let pdfP=null;
function loadPdfJs(){if(window.pdfjsLib)return Promise.resolve();if(pdfP)return pdfP;
 pdfP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=()=>{const w=document.createElement('script');w.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const done=()=>{try{pdfjsLib.GlobalWorkerOptions.workerSrc=w.src;res()}catch(e){rej(e)}};w.onload=done;w.onerror=done;document.head.appendChild(w)};s.onerror=()=>{pdfP=null;rej(new Error('pdfjs'))};document.head.appendChild(s)});return pdfP}
async function renderPdf(f){const box=$('pg');try{await loadPdfJs();const bytes=new Uint8Array(await toBlob(f.data).arrayBuffer());const pdf=await pdfjsLib.getDocument({data:bytes}).promise;box.innerHTML='';
 const w=Math.min(box.clientWidth||360,900),dpr=Math.min(window.devicePixelRatio||1,1.5);
 const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting&&!en.target._d){en.target._d=1;en.target._r()}}),{root:box.parentElement,rootMargin:'800px'});
 for(let i=1;i<=pdf.numPages;i++){if(!box.isConnected)return;const p=await pdf.getPage(i),v0=p.getViewport({scale:1}),v=p.getViewport({scale:w/v0.width*dpr});
  const c=document.createElement('canvas');c.style.aspectRatio=v0.width+'/'+v0.height;c.setAttribute('role','img');c.setAttribute('aria-label','Seite '+i+' von '+pdf.numPages);
  c._r=()=>{c.width=Math.round(v.width);c.height=Math.round(v.height);c.style.aspectRatio='';return p.render({canvasContext:c.getContext('2d'),viewport:v}).promise};
  box.appendChild(c);io.observe(c)}
 }catch(e){box.innerHTML=`<iframe title="${esc(f.name)}" src="${f.data}" style="height:80vh"></iframe><div class="mu" style="padding:8px">PDF-Ansicht nicht möglich (${esc(String((e&&e.message)||e))}). Es ist nur die erste Seite sichtbar? Tippe oben auf „Speichern“ und öffne die Datei in einer PDF-App.</div>`}}
let exText='',impMode='merge';
function dataCard(){return `<div class="card"><b>Daten sichern und übertragen</b><div class="mu" style="margin:4px 0 10px">Speichere alle Daten samt Anhängen in einer Datei und lies sie auf einem anderen Gerät wieder ein. „Zusammenführen“ behält vorhandene Daten, „Ersetzen“ löscht sie vorher.</div><button class="pri" onclick="exportData()">Daten exportieren</button><div style="display:flex;gap:8px;margin-top:8px"><button class="alt" style="flex:1" onclick="pickImport('merge')">Zusammenführen</button><button class="alt" style="flex:1" onclick="pickImport('replace')">Ersetzen</button></div><input id="imp" type="file" accept="application/json,.json" style="display:none" onchange="doImport(this)"><div class="mu" id="exs" role="status" style="margin-top:8px">${esc(exText)}</div></div>`}
function exMsg(t){exText=t;const e=$('exs');if(e)e.textContent=t}
async function saveFile(name,blob){let dl=null;try{if(window.claude)dl=await claude.use('downloads')}catch(e){}
 if(dl){await dl.save({filename:name,data:blob});return}
 const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
async function exportData(){try{const files={};for(const n of S.notes)for(const a of (n.att||[])){try{const f=await fget(a.id);if(f)files[a.id]=f}catch(e){}}
 const out={app:'schule',v:1,exported:new Date().toISOString(),data:{subjects:S.subjects,grades:S.grades,tests:S.tests,notes:S.notes},files};
 await saveFile('schule-daten-'+today()+'.json',new Blob([JSON.stringify(out)],{type:'application/json'}));exMsg('Export bereit: '+S.grades.length+' Noten, '+S.tests.length+' Arbeiten, '+S.notes.length+' Notizen.')}catch(e){exMsg('Der Export hat nicht geklappt.')}}
function pickImport(m){impMode=m;$('imp').click()}
async function doImport(inp){const f=inp.files[0];inp.value='';if(!f)return;try{const o=JSON.parse(await f.text());if(o.app!=='schule'||!o.data)throw new Error('format');const d=o.data;
 const mg=(a,b)=>{const m=new Map(a.map(x=>[x.id,x]));(b||[]).forEach(x=>m.set(x.id,x));return [...m.values()]};
 if(impMode==='replace'){S.subjects=d.subjects||[];S.grades=d.grades||[];S.tests=d.tests||[];S.notes=d.notes||[]}
 else{S.subjects=mg(S.subjects,d.subjects);S.grades=mg(S.grades,d.grades);S.tests=mg(S.tests,d.tests);S.notes=mg(S.notes,d.notes)}
 for(const id in (o.files||{}))await fput(o.files[id]);
 exText='Import fertig: '+S.subjects.length+' Fächer, '+S.grades.length+' Noten, '+S.tests.length+' Arbeiten, '+S.notes.length+' Notizen.';go()}catch(e){exMsg('Die Datei konnte nicht gelesen werden. Bitte eine Datei aus „Daten exportieren“ wählen.')}}
applyColor();go();lock();setTimeout(cloudInit,300);
