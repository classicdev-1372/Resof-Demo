const KEY='resof_v2',DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],PORTAL='https://www.andcollege.du.ac.in/smartprof/index.php';
const empty=()=>({courses:[],classes:[],resources:[],faculty:[],depts:[],societies:[],places:[],holidays:[]});
let D=empty(),TOKEN='';
let admin=false,view='overview',F={};
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(m,p,b)=>{const r=await fetch(p,{method:m,headers:{'Content-Type':'application/json',...(TOKEN&&{Authorization:'Bearer '+TOKEN})},body:b&&JSON.stringify(b)});if(!r.ok)throw r.status;return r.json()};
async function load(){const j=await api('GET','/api/data'),ch=JSON.stringify(j)!=JSON.stringify(D);D=Object.assign(empty(),j);return ch}
async function save(){try{await api('PUT','/api/data',D)}catch(e){toast(e==401?'Session expired — please log in again':'Could not save to the server');try{await load()}catch(x){}render();if(e==401){TOKEN='';admin=false;gate('login')}}}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
/* what each admin-editable list contains: [key,label,type] */
const S={
courses:['Course',[['name','Course / programme']]],
classes:['Class',[['course','Course','course'],['subject','Subject'],['day','Day',DAYS],['start','Start time','time'],['end','End time','time'],['room','Room'],['teacher','Teacher']]],
resources:['Resource',[['title','Title'],['course','Course','course'],['type','Type',['Notes','Book','Question paper','Video','Website','Other']],['link','Link (https://…)'],['desc','Description','area']]],
faculty:['Faculty member',[['name','Name'],['role','Designation'],['dept','Department','dept'],['email','Email'],['office','Office / room']]],
depts:['Department',[['name','Department name'],['tip','Department TIP','area']]],
societies:['Society',[['name','Society name'],['desc','Description','area']]],
places:['Location',[['name','Location name'],['info','Floor / directions / details','area']]],
holidays:['Date',[['date','Date','date'],['title','Title'],['note','Note']]]};
const opts=(a,v)=>['<option value="">— select —</option>'].concat(a.map(x=>`<option ${x==v?'selected':''}>${esc(x)}</option>`)).join('');
function openForm(k,id){const [t,fs]=S[k],it=D[k].find(x=>x.id==id)||{};
 const inp=([n,l,ty])=>{const v=it[n]??'',full=ty=='area'||n=='name'||n=='title'?' full':'';let h;
  if(ty=='area')h=`<textarea name="${n}">${esc(v)}</textarea>`;
  else if(ty=='course')h=`<select name="${n}">${opts(D.courses.map(c=>c.name),v)}</select>`;
  else if(ty=='dept')h=`<select name="${n}">${opts(D.depts.map(c=>c.name),v)}</select>`;
  else if(Array.isArray(ty))h=`<select name="${n}">${opts(ty,v)}</select>`;
  else h=`<input name="${n}" type="${ty||'text'}" value="${esc(v)}">`;
  return `<div class="field${full}"><label>${l}</label>${h}</div>`};
 $('#modalRoot').innerHTML=`<div class="modal-backdrop"><form class="modal" id="mf"><div class="modal-head"><h2>${id?'Edit':'Add'} ${t.toLowerCase()}</h2><button type="button" class="modal-close" data-x>×</button></div><div class="form-grid">${fs.map(inp).join('')}</div><div class="modal-actions"><button type="button" class="button subtle" data-x>Cancel</button><button class="button primary">Save</button></div></form></div>`;
 $('#mf').onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));
  if(!o[fs[0][0]].trim())return toast('Please fill in the '+fs[0][1].toLowerCase());
  if(id)Object.assign(it,o);else D[k].push({id:Date.now()+''+Math.random().toString(36).slice(2,5),...o});
  save();$('#modalRoot').innerHTML='';render();toast('Saved — visible on the student side')}}
const acts=(k,id)=>admin?`<div class="faculty-actions"><button data-e="${k}:${id}">Edit</button><button class="delete-btn" data-d="${k}:${id}">Delete</button></div>`:'';
const add=(k,l)=>admin?`<button class="button primary" data-add="${k}">＋ ${l}</button>`:'';
const none=m=>`<div class="panel empty-state">${m}</div>`;
const match=(q,...a)=>!q||a.join(' ').toLowerCase().includes(q.toLowerCase());
const head=(e,h,s,btns='')=>`<div class="page-heading"><div><p class="eyebrow">${e}</p><h1>${h}</h1><p class="subhead">${s}</p></div><div class="button-row">${btns}</div></div>`;
const sel=(f,all,vals)=>`<select data-f="${f}"><option value="">${all}</option>${vals.map(v=>`<option ${F[f]==v?'selected':''}>${esc(v)}</option>`).join('')}</select>`;
const search=(f,p)=>`<div class="search-wrap wide"><span>⌕</span><input data-f="${f}" value="${esc(F[f]||'')}" placeholder="${p}"></div>`;
const hdate=d=>{const x=new Date(d+'T00:00');return isNaN(x)?['–','']:[x.getDate(),x.toLocaleString('en',{month:'short'})]};
const cn=()=>D.courses.map(c=>c.name);
/* views: V = page shell, L = the filterable list part */
const V={
overview(){const st=[['mint','▦','Courses',D.courses.length,'academics'],['peach','▤','Study resources',D.resources.length,'library'],['lilac','♧','Faculty profiles',D.faculty.length,'faculties'],['butter','✿','Societies',D.societies.length,'societies']];
 return head('YOUR COLLEGE COMPANION','Campus life, <em>made simpler.</em>','Find your classes, discover learning resources, and get to know your campus.')+
 `<div class="quick-stats">${st.map(s=>`<button class="stat-card ${s[0]}" data-go="${s[4]}"><span class="stat-icon">${s[1]}</span><span class="stat-number">${s[3]}</span><span class="stat-caption">${s[2]}</span><span class="stat-arrow">↗</span></button>`).join('')}</div>
 <div class="content-grid"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">STAY ON TRACK</p><h2>Today's classes</h2></div><button class="text-link" data-go="academics">View timetable ↗</button></div><div class="schedule-list" id="list"></div></article>
 <article class="panel portal-card"><div class="portal-icon">↗</div><p class="eyebrow">OFFICIAL STUDENT SERVICES</p><h2>Need your personal college details?</h2><p>Use the official ANDC student portal for your individual academic and account information.</p><a class="button dark" href="${PORTAL}" target="_blank" rel="noopener">Open college portal ↗</a></article></div>
 <div class="footer-note">A student-built campus guide · Resof is an independent project, not an official ANDC service.</div>`},
academics(){const dated=[...D.holidays].sort((a,b)=>a.date>b.date?1:-1);
 return head('PLAN YOUR STUDY WEEK','Academic <em>planner.</em>','Browse the timetable by course and keep track of class dates and holidays.',add('classes','Add class')+add('holidays','Add holiday / date'))+
 `<div class="filter-bar"><label>Course / programme ${sel('course','All courses',cn())}</label></div><div id="list"></div>
 <div class="panel holidays-panel"><div class="panel-heading"><div><p class="eyebrow">IMPORTANT DATES</p><h2>Holidays & notices</h2></div></div><div class="holiday-list">${dated.map(h=>{const [d,m]=hdate(h.date);return `<div class="holiday-row"><div class="date-badge"><b>${d}</b><span>${m}</span></div><div style="flex:1"><b>${esc(h.title)}</b><p>${esc(h.note)}</p></div>${acts('holidays',h.id)}</div>`}).join('')||'<div class="empty-state">No dates added yet.</div>'}</div></div>`},
map(){return head('GET TO KNOW YOUR CAMPUS','Find your <em>place.</em>','Browse the campus map and the list of locations.',add('places','Add location'))+
 `<div class="map-layout"><div class="panel map-panel"><div class="map-topline"><span class="map-chip">CAMPUS MAP</span><span class="map-hint">GF = ground floor · FF = first floor · SF = second floor</span></div><img class="map-img" alt="ANDC campus map" src="campus-map.png"></div>
 <aside class="panel location-panel"><div class="panel-heading"><div><p class="eyebrow">LOCATION DIRECTORY</p><h2>Campus places</h2></div><span class="count-pill">${D.places.length}</span></div>${search('q','Search locations…')}<div id="list" class="location-list"></div></aside></div>`},
library(){return head('NOTES, BOOKS & LINKS','Resource <em>library.</em>','A growing collection of study material, organised by course.',add('resources','Add resource'))+
 `<div class="library-toolbar">${search('q','Search title, subject or course…')}${sel('course','All courses',cn())}${sel('type','All types',S.resources[1][2][2])}</div><div class="resource-grid" id="list"></div>`},
faculties(){return head('MEET THE PEOPLE WHO TEACH','Our <em>faculties.</em>','Faculty details, plus a tip from each department.',add('faculty','Add faculty')+add('depts','Add department'))+
 `<h3 class="sub-h">Department TIPs</h3><div class="tip-grid">${D.depts.map(d=>`<div class="tip-card"><span class="department-tag">${esc(d.name)}</span><p>${esc(d.tip)||'<i>No tip added yet.</i>'}</p>${acts('depts',d.id)}</div>`).join('')||none('No departments yet.'+(admin?' Use “Add department” to create one and write its TIP.':''))}</div>
 <h3 class="sub-h">Faculty directory</h3><div class="faculty-toolbar">${search('q','Search name, department or designation…')}${sel('dept','All departments',D.depts.map(d=>d.name))}</div><div class="faculty-grid" id="list"></div>`},
societies(){return head('CLUBS & COMMUNITIES','College <em>societies.</em>','Everything happening outside the classroom.',add('societies','Add society'))+`<div class="faculty-grid" id="list"></div>`},
manage(){const b=(k,l)=>`<article class="panel manage-card"><h2>${l}</h2><p>${D[k].length} saved</p><button class="button subtle" data-add="${k}">＋ Add</button></article>`;
 return head('ADMIN TOOLS','Manage <em>Resof.</em>','Edit every section directly on its page. Courses and backups are managed here.')+
 `<div class="notice-banner"><b>How saving works:</b> every change is saved to the server (data.json) and students see it within about 20 seconds, on any device. No JSON editing is needed. Use Export backup to keep a copy.</div>
 <div class="manage-grid">${b('courses','Courses')}<article class="panel manage-card"><h2>Backup & restore</h2><p>Download everything as a file, or restore one.</p><div class="button-row"><button class="button dark" id="exp">Export backup</button><label class="button subtle file-button">Import<input type="file" id="imp" accept=".json" hidden></label></div></article></div>
 <h3 class="sub-h" style="margin-top:22px">Courses</h3><div class="faculty-grid">${D.courses.map(c=>`<div class="faculty-card"><b>${esc(c.name)}</b>${acts('courses',c.id)}</div>`).join('')||none('No courses yet. Add courses first — classes and resources pick from this list.')}</div>`}};
const L={
overview(){const d=DAYS[(new Date().getDay()+6)%7],r=D.classes.filter(c=>c.day==d).sort((a,b)=>a.start>b.start?1:-1);
 $('#list').innerHTML=r.map(c=>`<div class="schedule-row"><div class="schedule-time">${esc(c.start)}<br>${esc(c.end)}</div><div class="schedule-bar"></div><div><div class="schedule-title">${esc(c.subject)}</div><div class="schedule-meta">${esc(c.course)} · ${esc(c.room)}</div></div><span class="tag">${esc(c.teacher)}</span></div>`).join('')||'<div class="empty-state">No classes listed for today.</div>'},
academics(){const r=D.classes.filter(c=>!F.course||c.course==F.course);
 $('#list').innerHTML=r.length?`<div class="timetable-wrap"><table class="timetable"><tr><th>Day</th><th>Classes</th></tr>${DAYS.map(d=>{const x=r.filter(c=>c.day==d).sort((a,b)=>a.start>b.start?1:-1);return x.length?`<tr><td><b>${d}</b></td><td style="display:flex;gap:8px;flex-wrap:wrap">${x.map(c=>`<div class="class-block"><b>${esc(c.subject)}</b><span>${esc(c.start)}–${esc(c.end)} · ${esc(c.room)}</span><span>${esc(c.course)} · ${esc(c.teacher)}</span>${acts('classes',c.id)}</div>`).join('')}</td></tr>`:''}).join('')}</table></div>`:none('No classes added yet.')},
map(){const r=D.places.filter(p=>match(F.q,p.name,p.info));
 $('#list').innerHTML=r.map(p=>`<div class="location-item"><span class="loc-dot">⌖</span><div style="flex:1"><b>${esc(p.name)}</b><small class="pre">${esc(p.info)}</small>${acts('places',p.id)}</div></div>`).join('')||'<div class="empty-state">No locations yet.</div>'},
library(){const r=D.resources.filter(x=>match(F.q,x.title,x.course,x.desc)&&(!F.course||x.course==F.course)&&(!F.type||x.type==F.type));
 $('#list').innerHTML=r.map(x=>`<div class="resource-card"><div class="resource-top"><span class="resource-icon mint">▤</span><span class="resource-type">${esc(x.type)}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p>${x.course?`<span class="resource-course">${esc(x.course)}</span>`:''}<div class="resource-actions">${/^https?:\/\//i.test(x.link)?`<a href="${esc(x.link)}" target="_blank" rel="noopener">Open ↗</a>`:''}</div>${acts('resources',x.id)}</div>`).join('')||none('No resources found.')},
faculties(){const r=D.faculty.filter(f=>match(F.q,f.name,f.dept,f.role)&&(!F.dept||f.dept==F.dept));
 $('#list').innerHTML=r.map(f=>`<div class="faculty-card"><div class="faculty-head"><div class="faculty-avatar">${esc((f.name||'?').split(' ').map(w=>w[0]).slice(0,2).join(''))}</div><div><h3>${esc(f.name)}</h3><div class="designation">${esc(f.role)}</div></div></div>${f.dept?`<span class="department-tag">${esc(f.dept)}</span>`:''}<div class="faculty-detail">${esc(f.email)}</div><div class="faculty-detail">${esc(f.office)}</div>${acts('faculty',f.id)}</div>`).join('')||none('No faculty added yet.')},
societies(){$('#list').innerHTML=D.societies.map(s=>`<div class="faculty-card"><h3>${esc(s.name)}</h3><p class="faculty-detail pre">${esc(s.desc)||'<i>Description coming soon.</i>'}</p>${acts('societies',s.id)}</div>`).join('')||none('No societies listed yet.'+(admin?' Use “Add society”.':''))}};
const NAV=[['overview','⌂','Overview'],['academics','▦','Academics'],['map','⌖','Campus map & locations'],['library','▤','Resource library'],['faculties','♧','Faculties'],['societies','✿','Societies']];
function render(){const n=NAV.concat(admin?[['manage','⚙','Admin tools']]:[]);
 $('#nav').innerHTML=n.map(x=>`<button class="nav-item ${x[0]==view?'active':''}" data-go="${x[0]}"><span>${x[1]}</span> ${x[2]}</button>`).join('')+`<a class="nav-item" href="${PORTAL}" target="_blank" rel="noopener"><span>↗</span> College portal</a>`;
 $('#crumb').textContent=(n.find(x=>x[0]==view)||[])[2];$('#content').innerHTML=V[view]();if(L[view])L[view]();
 $('#role').textContent=admin?'Admin':'Student';$('#role').className='role-pill'+(admin?'':' stu');
 const e=$('#exp');if(e){e.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,1)],{type:'application/json'}));a.download='resof-backup.json';a.click()};
  $('#imp').onchange=ev=>{const r=new FileReader();r.onload=()=>{try{D=Object.assign(empty(),JSON.parse(r.result));save();render();toast('Backup restored')}catch(x){toast('Not a valid backup file')}};r.readAsText(ev.target.files[0])}}}
function gate(step){$('#gate').style.display='grid';
 $('#gate').innerHTML=step=='login'?`<form class="modal" id="lf"><h2>Admin login</h2><div class="form-grid" style="margin-top:18px"><div class="field full"><label>Username</label><input name="u" autocomplete="username"></div><div class="field full"><label>Password</label><input name="p" type="password" autocomplete="current-password"></div></div><div class="err" id="err"></div><div class="modal-actions"><button type="button" class="button subtle" data-gate="">Back</button><button class="button primary">Log in</button></div></form>`
 :`<div class="modal"><div class="brand-mark" style="margin:0 auto 14px">r.</div><h1 style="font-size:28px">Welcome to <em>Resof</em></h1><p class="subhead" style="margin:0 auto">Who is visiting today?</p><div class="pick"><button class="button primary" data-role="student">I'm a student</button><button class="button subtle" data-gate="login">I'm an admin</button></div></div>`;
 const f=$('#lf');if(f)f.onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));api('POST','/api/login',{u:o.u,p:o.p}).then(r=>{TOKEN=r.token;enter(true)}).catch(x=>$('#err').textContent=x==401?'Incorrect username or password.':x==429?'Too many attempts. Try again in a few minutes.':'Cannot reach the server. Start it with: node server.js')}}
async function enter(a){admin=a;view='overview';F={};try{await load()}catch(e){toast('Cannot reach the server. Start it with: node server.js')}$('#gate').style.display='none';render()}
document.addEventListener('click',e=>{const t=e.target.closest('[data-go],[data-add],[data-e],[data-d],[data-x],[data-role],[data-gate]');if(!t)return;const d=t.dataset;
 if('go'in d){view=d.go;F={};render()}else if('add'in d)openForm(d.add);else if('e'in d)openForm(...d.e.split(':'));
 else if('d'in d){const[k,id]=d.d.split(':');if(confirm('Delete this entry?')){D[k]=D[k].filter(x=>x.id!=id);save();render();toast('Deleted')}}
 else if('x'in d)$('#modalRoot').innerHTML='';else if('role'in d)enter(false);else if('gate'in d)gate(d.gate)});
document.addEventListener('input',e=>{const f=e.target.dataset.f;if(f){F[f]=e.target.value;L[view]&&L[view]()}});
$('#switch').onclick=()=>{if(TOKEN)api('POST','/api/logout').catch(()=>{});TOKEN='';admin=false;gate('')};
$('#today').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
gate('');
setInterval(async()=>{if(!admin&&$('#gate').style.display=='none'&&!$('#modalRoot').innerHTML){try{if(await load())render()}catch(e){}}},20000);
