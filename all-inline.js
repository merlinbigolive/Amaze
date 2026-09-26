
const tabs=document.querySelectorAll(".tab");
const forms=document.querySelectorAll(".form");

function activate(name){
  tabs.forEach(t=>t.classList.toggle("active",t.dataset.tab===name));
  forms.forEach(f=>f.classList.toggle("active",f.classList.contains(name)));
}
tabs.forEach(t=>t.addEventListener("click",()=>activate(t.dataset.tab)));
document.querySelectorAll("[data-open]").forEach(a=>a.addEventListener("click",()=>{
  activate(a.dataset.open);
  document.getElementById("search").scrollIntoView({behavior:"smooth"});
}));

// Mobile menu
const menuToggle=document.getElementById("menu-toggle");
const menuPanel=document.getElementById("menu-panel");
function closeMenu(){menuPanel.classList.remove("show");menuPanel.setAttribute("aria-hidden","true");menuToggle.setAttribute("aria-expanded","false");}
menuToggle.addEventListener("click",e=>{e.stopPropagation();const open=!menuPanel.classList.contains("show");menuPanel.classList.toggle("show",open);menuPanel.setAttribute("aria-hidden",String(!open));menuToggle.setAttribute("aria-expanded",String(open));});
document.querySelectorAll("[data-menu-tab]").forEach(btn=>btn.addEventListener("click",()=>{activate(btn.dataset.menuTab);closeMenu();document.getElementById("search").scrollIntoView({behavior:"smooth"});}));
document.querySelectorAll("[data-menu-action]").forEach(btn=>btn.addEventListener("click",()=>{
  const action=btn.dataset.menuAction; closeMenu();
  if(action==='trips') alert("My Trips will show your bookings and trip details.");
  if(action==='deals') alert("Travel Deals will show available offers and fare deals.");
  if(action==='help') alert("Help & Support: booking, payments, cancellations and travel assistance.");
}));
document.addEventListener("click",e=>{if(menuPanel.classList.contains("show")&&!menuPanel.contains(e.target)&&e.target!==menuToggle)closeMenu();});

/* Global location databases
   Airports: OpenFlights global airport dataset (city, country, IATA/ICAO).
   Indian trains: Indian-Railway-Data station directory (station code, name, state).
   Data is fetched once and cached locally; the small fallback list keeps the UI usable if a source is unavailable.
*/
const SOURCES={
 airport:'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
 station:'https://raw.githubusercontent.com/prasenjit-27/Indian-Railway-Data/main/stations.json'
};
const DATA={airport:[],station:[],city:[]};
const FALLBACK={
 airport:[
  ['Delhi','DEL','India','✈️'],['Mumbai','BOM','India','✈️'],['Bengaluru','BLR','India','✈️'],['Hyderabad','HYD','India','✈️'],
  ['Chennai','MAA','India','✈️'],['Kolkata','CCU','India','✈️'],['Goa','GOI','India','✈️'],['Dubai','DXB','United Arab Emirates','✈️'],
  ['Singapore','SIN','Singapore','✈️'],['London','LHR','United Kingdom','✈️'],['Paris','CDG','France','✈️'],['New York','JFK','United States','✈️']
 ],
 station:[
  ['New Delhi','NDLS','Delhi','🚆'],['Mumbai Central','MMCT','Maharashtra','🚆'],['Howrah','HWH','West Bengal','🚆'],
  ['Chhatrapati Shivaji Maharaj Terminus','CSMT','Maharashtra','🚆'],['Kanpur Central','CNB','Uttar Pradesh','🚆'],['Jaipur','JP','Rajasthan','🚆']
 ]
};
DATA.airport=[...FALLBACK.airport]; DATA.station=[...FALLBACK.station];
const airportSeen=new Set();
const citySeen=new Set();
function rebuildCities(){
 DATA.city=[]; citySeen.clear();
 for(const a of DATA.airport){
   const key=(a[0]+'|'+a[1]).toLowerCase();
   if(!citySeen.has(key)){citySeen.add(key);DATA.city.push([a[0],a[1],a[2],'🏨','',countryIso(a[2])]);}
 }
}
rebuildCities();
function parseCSVLine(line){
 const out=[];let cur='',q=false;
 for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;}
async function loadLocations(){
 try{
  const [aRes,sRes]=await Promise.all([fetch(SOURCES.airport,{cache:'force-cache'}),fetch(SOURCES.station,{cache:'force-cache'})]);
  if(aRes.ok){
   const txt=await aRes.text();
   const parsed=[]; const seen=new Set();
   txt.split(/\r?\n/).forEach(line=>{
    if(!line.trim())return; const x=parseCSVLine(line); const city=x[2],country=x[3],iata=x[4],icao=x[5],name=x[1];
    if(!city||!country||(!iata&&!icao))return;
    const key=(city+'|'+country+'|'+(iata||icao)).toLowerCase(); if(seen.has(key))return; seen.add(key);
    parsed.push([city,iata||icao,country,'✈️',name,icao,countryIso(country)]);
   });
   if(parsed.length>500) DATA.airport=parsed;
  }
  if(sRes.ok){
   const arr=await sRes.json(); const parsed=[]; const seen=new Set();
   for(const s of arr){const name=s.name||'',code=s.code||'',state=s.state||'',address=s.address||''; if(!name||!code)continue; const key=(name+'|'+code).toLowerCase(); if(seen.has(key))continue; seen.add(key); parsed.push([name,code,state||address||'India','🚆','', '', 'IN']);}
   if(parsed.length>1000) DATA.station=parsed;
  }
  rebuildCities();
  localStorage.setItem('amaze_airports_v1',JSON.stringify(DATA.airport));
  localStorage.setItem('amaze_stations_v1',JSON.stringify(DATA.station));
 }catch(e){
  try{
   const a=JSON.parse(localStorage.getItem('amaze_airports_v1')||'null'); if(Array.isArray(a)&&a.length>500) DATA.airport=a;
   const s=JSON.parse(localStorage.getItem('amaze_stations_v1')||'null'); if(Array.isArray(s)&&s.length>1000) DATA.station=s;
   rebuildCities();
  }catch(_){/* fallback remains */}
 }
}
loadLocations();

const REMOTE_GEO={cities:new Map(),countries:new Map()};
const REMOTE_GEO_URL='https://countries.dev';
async function fetchWorldCities(query){
  const q=query.trim(); if(q.length<2) return [];
  const key=q.toLowerCase(); if(REMOTE_GEO.cities.has(key)) return REMOTE_GEO.cities.get(key);
  try{
    const r=await fetch(`${REMOTE_GEO_URL}/cities?q=${encodeURIComponent(q)}&limit=10`,{cache:'force-cache'});
    if(!r.ok) return [];
    const data=await r.json();
    const arr=(Array.isArray(data)?data:(data.data||data.cities||[])).map(x=>[
      x.name||x.city||x.cityName||'',
      '',
      x.countryName||x.country||x.country_name||x.countryCode||'',
      '🏙️',
      x.adminName||x.admin||x.region||x.state||'',
      x.countryCode||x.country_code||x.cca2||''
    ]).filter(x=>x[0]);
    REMOTE_GEO.cities.set(key,arr); return arr;
  }catch(_){return []}
}
async function fetchWorldCountries(query){
  const q=query.trim(); if(q.length<2) return [];
  const key=q.toLowerCase(); if(REMOTE_GEO.countries.has(key)) return REMOTE_GEO.countries.get(key);
  try{
    const r=await fetch(`${REMOTE_GEO_URL}/name/${encodeURIComponent(q)}`,{cache:'force-cache'});
    if(!r.ok) return [];
    const data=await r.json();
    const arr=(Array.isArray(data)?data:(data.data||[])).map(x=>[
      x.name||'', x.alpha2Code||x.cca2||'', x.region||'', '🌍', x.capital||''
    ]).filter(x=>x[0]);
    REMOTE_GEO.countries.set(key,arr); return arr;
  }catch(_){return []}
}
const COUNTRY_ISO={India:'IN','United States':'US','United Kingdom':'GB','United Arab Emirates':'AE','Singapore':'SG','Australia':'AU','Canada':'CA','New Zealand':'NZ','Germany':'DE','France':'FR','Italy':'IT','Spain':'ES','Netherlands':'NL','Switzerland':'CH','Sweden':'SE','Norway':'NO','Denmark':'DK','Finland':'FI','Ireland':'IE','Portugal':'PT','Brazil':'BR','Mexico':'MX','Argentina':'AR','Chile':'CL','Colombia':'CO','Japan':'JP','China':'CN','South Korea':'KR','Thailand':'TH','Malaysia':'MY','Indonesia':'ID','Philippines':'PH','Vietnam':'VN','Pakistan':'PK','Bangladesh':'BD','Sri Lanka':'LK','Nepal':'NP','Saudi Arabia':'SA','Qatar':'QA','Kuwait':'KW','Oman':'OM','Bahrain':'BH','Israel':'IL','Türkiye':'TR','South Africa':'ZA','Nigeria':'NG','Kenya':'KE','Egypt':'EG','Morocco':'MA','Russia':'RU','Austria':'AT','Belgium':'BE','Czechia':'CZ','Poland':'PL','Greece':'GR','Iceland':'IS','Romania':'RO','Hungary':'HU','Croatia':'HR','Serbia':'RS','Ukraine':'UA','United States of America':'US','UAE':'AE'};
function countryIso(name){const n=String(name||'').trim();return COUNTRY_ISO[n]||COUNTRY_ISO[Object.keys(COUNTRY_ISO).find(k=>k.toLowerCase()===n.toLowerCase())]||'';}
const COUNTRY_ISO_CACHE=new Map();
async function fetchCountryIso(name){const known=countryIso(name);if(known)return known;const key=String(name||'').trim().toLowerCase();if(!key)return '';if(COUNTRY_ISO_CACHE.has(key))return COUNTRY_ISO_CACHE.get(key);try{const r=await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=name,cca2`,{cache:'force-cache'});if(!r.ok)return '';const d=await r.json();const code=d?.[0]?.cca2||'';COUNTRY_ISO_CACHE.set(key,code);return code;}catch(_){return ''}}

function setupAutocomplete(box){
  const type=box.dataset.type, input=box.querySelector('input'), list=box.querySelector('.suggestions');
  let active=-1, timer=null, requestId=0;
  const isWorldSearch=type==='city'||type==='station';
  function localMatches(q){
    const query=q.trim().toLowerCase();
    return DATA[type].filter(x=>(x[0]+' '+x[1]+' '+x[2]+' '+(x[4]||'')+' '+(x[5]||'')).toLowerCase().includes(query)).slice(0,8);
  }
  function draw(matches){
    list.innerHTML='';
    matches.slice(0,10).forEach((x,i)=>{
      const row=document.createElement('div'); row.className='suggestion';
      const label=x[1] ? `${x[0]} (${x[1]})` : x[0];
      const iso=x[6]||countryIso(x[2]);
      const sub=[x[2]||'',iso?`(${iso})`:'',x[4]||''].filter(Boolean).join(' ');
      row.innerHTML=`<span class="suggestion-icon">${x[3]||'🏙️'}</span><span><div class="suggestion-main">${esc(label)}</div><div class="suggestion-sub">${esc(sub)}</div></span>`;
      row.addEventListener('mousedown',e=>{
        e.preventDefault();
        input.value=x[1] ? `${x[0]} (${x[1]})` : x[0];
        input.dataset.code=x[1]||''; input.dataset.country=x[2]||''; input.dataset.countryCode=x[6]||countryIso(x[2]);
        list.classList.remove('show');
      });
      list.appendChild(row);
    });
    list.classList.toggle('show',matches.length>0); active=-1;
  }
  async function render(q=''){
    const query=q.trim();
    if(!query){draw(localMatches(''));return;}
    const id=++requestId;
    let matches=localMatches(query);
    if(isWorldSearch && query.length>=2){
      const [cities,countries]=await Promise.all([fetchWorldCities(query),fetchWorldCountries(query)]);
      if(id!==requestId)return;
      const seen=new Set(matches.map(x=>(x[0]+'|'+x[1]+'|'+x[2]).toLowerCase()));
      for(const x of countries.concat(cities)){
        const k=(x[0]+'|'+x[1]+'|'+x[2]).toLowerCase();
        if(!seen.has(k)){seen.add(k);matches.push(x)}
      }
    }
    // Resolve ISO country codes for every suggestion so Flights, Stays, Trains and Cars all show them.
    await Promise.all(matches.slice(0,10).map(async x=>{if(!x[6]&&x[2])x[6]=await fetchCountryIso(x[2]);}));
    if(id!==requestId)return;
    draw(matches);
  }
  input.addEventListener('focus',()=>render(input.value));
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>render(input.value),120)});
  input.addEventListener('keydown',e=>{
    const rows=[...list.querySelectorAll('.suggestion')];
    if(!list.classList.contains('show')||!rows.length)return;
    if(e.key==='ArrowDown'){e.preventDefault();active=(active+1)%rows.length;}
    if(e.key==='ArrowUp'){e.preventDefault();active=(active-1+rows.length)%rows.length;}
    if(e.key==='Enter'&&active>=0){e.preventDefault();rows[active].dispatchEvent(new MouseEvent('mousedown'));return;}
    if(e.key==='Escape')list.classList.remove('show');
    rows.forEach((r,i)=>r.classList.toggle('active',i===active));
  });
  document.addEventListener('mousedown',e=>{if(!box.contains(e.target))list.classList.remove('show')});
}
document.querySelectorAll('.autocomplete').forEach(setupAutocomplete);
// Customer-facing travel times: always display 12-hour format with AM/PM.
function formatTravelTime(time, dateOnly=false){
  if(!time) return "";
  const m=String(time).trim().match(/^(\d{1,2}):(\d{2})/);
  if(!m) return time;
  let h=Number(m[1]), min=m[2];
  const suffix=h>=12?"PM":"AM";
  h=h%12||12;
  return `${String(h).padStart(2,"0")}:${min} ${suffix}`;
}
function formatTravelTimeRange(departure, arrival, nextDay=false){
  const d=formatTravelTime(departure), a=formatTravelTime(arrival);
  return nextDay ? `${d} → ${a} +1 day` : `${d} → ${a}`;
}
// Use these helpers whenever live flight/train API results are rendered:
// formatTravelTime(apiTime) or formatTravelTimeRange(depTime, arrTime, isNextDay).

const flightAdults=document.getElementById("flight-adults");
const flightChildren=document.getElementById("flight-children");
const flightSenior=document.getElementById("flight-senior");
for(let i=1;i<=10;i++){
  flightAdults.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
  flightChildren.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
  flightSenior.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
}
flightChildren.insertAdjacentHTML("afterbegin",`<option value="0" selected>0</option>`);
flightSenior.insertAdjacentHTML("afterbegin",`<option value="0" selected>0</option>`);
flightAdults.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
flightChildren.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
flightSenior.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
const flightAdultsCustom=document.getElementById("flight-adults-custom");
const flightChildrenCustom=document.getElementById("flight-children-custom");
const flightSeniorCustom=document.getElementById("flight-senior-custom");
const flightAdultsCustomInput=document.getElementById("flight-adults-custom-input");
const flightChildrenCustomInput=document.getElementById("flight-children-custom-input");
const flightSeniorCustomInput=document.getElementById("flight-senior-custom-input");
const flightPassengerBtn=document.getElementById("flight-passenger-btn");
const flightPassengerPanel=document.getElementById("flight-passenger-panel");
function flightPassengerCount(select,input,fallback){
  if(select.value==='custom'){
    const n=Number(input.value);
    return Number.isFinite(n) && n>=11 ? Math.min(50,Math.floor(n)) : fallback;
  }
  return Number(select.value||fallback);
}
function syncFlightCustom(select,box,input){
  const isCustom=select.value==='custom';
  box.style.display=isCustom?'block':'none';
  if(isCustom && !input.value) input.value='11';
}
function updateFlightPassengerSummary(){
  const a=flightPassengerCount(flightAdults,flightAdultsCustomInput,1);
  const c=flightPassengerCount(flightChildren,flightChildrenCustomInput,0);
  const sc=flightPassengerCount(flightSenior,flightSeniorCustomInput,0);
  const parts=[`${a} Adult${a===1?'':'s'}`, `${c} Child${c===1?'':'ren'}`];
  if(sc) parts.push(`${sc} Senior${sc===1?'':'s'}`);
  flightPassengerBtn.textContent=parts.join(", ");
}
flightPassengerBtn.addEventListener("click",()=>flightPassengerPanel.classList.toggle("show"));
flightAdults.addEventListener("change",()=>{syncFlightCustom(flightAdults,flightAdultsCustom,flightAdultsCustomInput);updateFlightPassengerSummary();});
flightChildren.addEventListener("change",()=>{syncFlightCustom(flightChildren,flightChildrenCustom,flightChildrenCustomInput);updateFlightPassengerSummary();});
flightSenior.addEventListener("change",()=>{syncFlightCustom(flightSenior,flightSeniorCustom,flightSeniorCustomInput);updateFlightPassengerSummary();});
[flightAdultsCustomInput,flightChildrenCustomInput,flightSeniorCustomInput].forEach(el=>el.addEventListener("input",updateFlightPassengerSummary));
document.getElementById("flight-passenger-done").addEventListener("click",()=>flightPassengerPanel.classList.remove("show"));
syncFlightCustom(flightAdults,flightAdultsCustom,flightAdultsCustomInput);
syncFlightCustom(flightChildren,flightChildrenCustom,flightChildrenCustomInput);
syncFlightCustom(flightSenior,flightSeniorCustom,flightSeniorCustomInput);

const stayAdults=document.getElementById("stay-adults");
const stayChildren=document.getElementById("stay-children");
const staySenior=document.getElementById("stay-senior");
for(let i=1;i<=10;i++) stayAdults.insertAdjacentHTML("beforeend",`<option value="${i}"${i===2?' selected':''}>${i}</option>`);
for(let i=1;i<=10;i++) stayChildren.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
stayChildren.insertAdjacentHTML("afterbegin",`<option value="0" selected>0</option>`);
for(let i=1;i<=10;i++) staySenior.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
staySenior.insertAdjacentHTML("afterbegin",`<option value="0" selected>0</option>`);
stayAdults.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
stayChildren.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
staySenior.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
const stayAdultsCustom=document.getElementById("stay-adults-custom");
const stayChildrenCustom=document.getElementById("stay-children-custom");
const staySeniorCustom=document.getElementById("stay-senior-custom");
const stayAdultsCustomInput=document.getElementById("stay-adults-custom-input");
const stayChildrenCustomInput=document.getElementById("stay-children-custom-input");
const staySeniorCustomInput=document.getElementById("stay-senior-custom-input");
const stayPassengerBtn=document.getElementById("stay-passenger-btn");
const stayPassengerPanel=document.getElementById("stay-passenger-panel");
function updateStayPassengerSummary(){
  const a=selectedPassengerCount(stayAdults,stayAdultsCustomInput,2);
  const c=selectedPassengerCount(stayChildren,stayChildrenCustomInput,0);
  const sc=selectedPassengerCount(staySenior,staySeniorCustomInput,0);
  const parts=[`${a} Adult${a===1?'':'s'}`, `${c} Child${c===1?'':'ren'}`];
  if(sc) parts.push(`${sc} Senior${sc===1?'':'s'}`);
  stayPassengerBtn.textContent=parts.join(", ");
}
stayPassengerBtn.addEventListener("click",()=>stayPassengerPanel.classList.toggle("show"));
stayAdults.addEventListener("change",()=>{syncCustomPassenger(stayAdults,stayAdultsCustom,stayAdultsCustomInput);updateStayPassengerSummary();});
stayChildren.addEventListener("change",()=>{syncCustomPassenger(stayChildren,stayChildrenCustom,stayChildrenCustomInput);updateStayPassengerSummary();});
staySenior.addEventListener("change",()=>{syncCustomPassenger(staySenior,staySeniorCustom,staySeniorCustomInput);updateStayPassengerSummary();});
[stayAdultsCustomInput,stayChildrenCustomInput,staySeniorCustomInput].forEach(el=>el.addEventListener("input",updateStayPassengerSummary));
document.getElementById("stay-passenger-done").addEventListener("click",()=>stayPassengerPanel.classList.remove("show"));
syncCustomPassenger(stayAdults,stayAdultsCustom,stayAdultsCustomInput);
syncCustomPassenger(stayChildren,stayChildrenCustom,stayChildrenCustomInput);
syncCustomPassenger(staySenior,staySeniorCustom,staySeniorCustomInput);

const trainAdults=document.getElementById("train-adults");
const trainChildren=document.getElementById("train-children");
const trainSenior=document.getElementById("train-senior");
for(let i=1;i<=10;i++){
  trainAdults.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
  trainChildren.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
}
trainAdults.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
trainChildren.insertAdjacentHTML("afterbegin",`<option value="0" selected>0</option>`);
trainChildren.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
for(let i=1;i<=10;i++) trainSenior.insertAdjacentHTML("beforeend",`<option value="${i}">${i}</option>`);
trainSenior.insertAdjacentHTML("afterbegin",`<option value="0" selected>0</option>`);
trainSenior.insertAdjacentHTML("beforeend",`<option value="custom">Custom</option>`);
const trainAdultsCustom=document.getElementById("train-adults-custom");
const trainChildrenCustom=document.getElementById("train-children-custom");
const trainAdultsCustomInput=document.getElementById("train-adults-custom-input");
const trainChildrenCustomInput=document.getElementById("train-children-custom-input");
const trainSeniorCustom=document.getElementById("train-senior-custom");
const trainSeniorCustomInput=document.getElementById("train-senior-custom-input");
const trainPassengerBtn=document.getElementById("train-passenger-btn");
const trainPassengerPanel=document.getElementById("train-passenger-panel");
function selectedPassengerCount(select,input,fallback){
  if(select.value==='custom'){
    const n=Number(input.value);
    return Number.isFinite(n) && n>=11 ? Math.min(50,Math.floor(n)) : fallback;
  }
  return Number(select.value||fallback);
}
function syncCustomPassenger(select,box,input){
  const isCustom=select.value==='custom';
  box.style.display=isCustom?'block':'none';
  if(isCustom && !input.value) input.value='11';
}
function updateTrainPassengerSummary(){
  const a=selectedPassengerCount(trainAdults,trainAdultsCustomInput,1);
  const c=selectedPassengerCount(trainChildren,trainChildrenCustomInput,0);
  const sc=selectedPassengerCount(trainSenior,trainSeniorCustomInput,0);
  const parts=[`${a} Adult${a===1?'':'s'}`, `${c} Child${c===1?'':'ren'}`];
  if(sc) parts.push(`${sc} Senior${sc===1?'':'s'}`);
  trainPassengerBtn.textContent=parts.join(", ");
}
trainPassengerBtn.addEventListener("click",()=>trainPassengerPanel.classList.toggle("show"));
trainAdults.addEventListener("change",()=>{syncCustomPassenger(trainAdults,trainAdultsCustom,trainAdultsCustomInput);updateTrainPassengerSummary();});
trainChildren.addEventListener("change",()=>{syncCustomPassenger(trainChildren,trainChildrenCustom,trainChildrenCustomInput);updateTrainPassengerSummary();});
trainSenior.addEventListener("change",()=>{syncCustomPassenger(trainSenior,trainSeniorCustom,trainSeniorCustomInput);updateTrainPassengerSummary();});
[trainAdultsCustomInput,trainChildrenCustomInput,trainSeniorCustomInput].forEach(el=>el.addEventListener("input",updateTrainPassengerSummary));
document.getElementById("train-passenger-done").addEventListener("click",()=>trainPassengerPanel.classList.remove("show"));
syncCustomPassenger(trainAdults,trainAdultsCustom,trainAdultsCustomInput);
syncCustomPassenger(trainChildren,trainChildrenCustom,trainChildrenCustomInput);
syncCustomPassenger(trainSenior,trainSeniorCustom,trainSeniorCustomInput);
document.addEventListener("mousedown",e=>{
  if(!e.target.closest("#train-passenger-panel") && !e.target.closest("#train-passenger-btn")) trainPassengerPanel.classList.remove("show");
  if(!e.target.closest("#flight-passenger-panel") && !e.target.closest("#flight-passenger-btn")) flightPassengerPanel.classList.remove("show");
  if(!e.target.closest("#stay-passenger-panel") && !e.target.closest("#stay-passenger-btn")) stayPassengerPanel.classList.remove("show");
});


const trainClass=document.getElementById("train-class");
const firstAcOptions=document.getElementById("first-ac-options");
function toggleFirstAc(){ firstAcOptions.style.display = trainClass.value.startsWith("1A") ? "block" : "none"; }
trainClass.addEventListener("change",toggleFirstAc); toggleFirstAc();

// Ticket-booking passenger details: age and gender are selected here, not in the traveller summary.
const bookingPage=document.getElementById("booking-passenger-page");
const bookingList=document.getElementById("booking-passenger-list");
const trainSearchBtn=[...document.querySelectorAll("#form-trains .search-btn")][0];

function goToResults(type){
  const form=document.getElementById(`form-${type}`);
  if(!form) return;
  const values=[];
  form.querySelectorAll('input,select').forEach(el=>{
    if(el.type==='checkbox') return;
    if(el.value && el.id && !el.id.includes('-custom-input')) values.push(`${encodeURIComponent(el.id)}=${encodeURIComponent(el.value)}`);
  });
  const url=`${type}-results.html?${values.join('&')}`;
  window.location.href=url;
}
const flightSearchBtn=document.querySelector('#form-flights .search-btn');
const staySearchBtn=document.querySelector('#form-stays .search-btn');
if(flightSearchBtn) flightSearchBtn.addEventListener('click',()=>goToResults('flights'));
if(staySearchBtn) staySearchBtn.addEventListener('click',()=>goToResults('stays'));

function addPassengerFields(label,index){
  const row=document.createElement("div"); row.className="booking-passenger-row";
  row.innerHTML=`
    <div class="name-field"><label>${label} ${index}</label><input type="text" placeholder="Full name" autocomplete="name"></div>
    <div><label>Age</label><select><option value="">Select age</option>${Array.from({length:100},(_,i)=>`<option>${i+1}</option>`).join("")}</select></div>
    <div><label>Gender</label><select><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>`;
  bookingList.appendChild(row);
}
function openBookingPassengerPage(){
  bookingList.innerHTML="";
  const a=selectedPassengerCount(trainAdults,trainAdultsCustomInput,1), c=selectedPassengerCount(trainChildren,trainChildrenCustomInput,0), sc=selectedPassengerCount(trainSenior,trainSeniorCustomInput,0);
  for(let i=1;i<=a;i++) addPassengerFields("Adult",i);
  for(let i=1;i<=c;i++) addPassengerFields("Child",i);
  for(let i=1;i<=sc;i++) addPassengerFields("Senior Citizen",i);
  bookingPage.style.display="block"; bookingPage.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
}
function closeBookingPassengerPage(){bookingPage.style.display="none";bookingPage.setAttribute("aria-hidden","true");document.body.style.overflow="";}
if(trainSearchBtn) trainSearchBtn.addEventListener("click",()=>goToResults('trains'));
document.getElementById("booking-close").addEventListener("click",closeBookingPassengerPage);
document.getElementById("booking-continue").addEventListener("click",()=>{ alert("Passenger details saved for the ticket-booking step."); });

// v22 account, signup, Google + searchable phone country code
(function(){
 const modal=document.getElementById('login-modal'), closeBtn=document.getElementById('login-close');
 const accountToggle=document.getElementById('account-toggle'), pop=document.getElementById('user-popover');
 const countryMenu=document.getElementById('country-menu');
 const loginAction=document.getElementById('account-login-action'), signupAction=document.getElementById('account-signup-action'), logoutAction=document.getElementById('account-logout-action');
 const form=document.getElementById('auth-form'), modeBtn=document.getElementById('auth-mode-toggle');
 const title=document.getElementById('login-title'), sub=document.getElementById('login-subtitle'), submit=document.getElementById('auth-submit');
 const msg=document.getElementById('auth-message'), nameInput=document.getElementById('auth-name'), emailInput=document.getElementById('auth-email');
 const googleBtn=document.getElementById('google-signup');
 let signupMode=false;
 const getUser=()=>{try{return JSON.parse(localStorage.getItem('amazeUser')||'null')}catch(e){return null}};
 function refreshAccount(){const u=getUser();document.getElementById('account-name').textContent=u?(u.name||'Amaze Traveller'):'Welcome';document.getElementById('account-status').textContent=u?('Signed in with '+(u.email||u.phone||'account')):'Login to manage your trips';if(loginAction)loginAction.hidden=!!u;if(signupAction)signupAction.hidden=!!u;if(logoutAction)logoutAction.hidden=!u;}
 function openAuth(){modal.classList.add('show');modal.setAttribute('aria-hidden','false');pop.classList.remove('show');setTimeout(()=>{if(signupMode)nameInput.focus();else emailInput.focus()},50);}
 function closeAuth(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');msg.classList.remove('show');}
 function setMode(signup){signupMode=signup;title.textContent=signup?'Create your Amaze account':'Welcome to Amaze';sub.textContent=signup?'Sign up with Google, Gmail/email, or phone number.':'Login with your email or phone number.';nameInput.required=signup;emailInput.required=signup;document.getElementById('auth-phone').required=!signup;submit.textContent=signup?'Create account':'Continue';document.getElementById('auth-switch-text').textContent=signup?'Already have an account?':'New to Amaze?';modeBtn.textContent=signup?'Login':'Create account';googleBtn.hidden=!signup;}
 function setAccountMenu(open){
   if(!accountToggle || !pop) return;
   if(open && countryMenu) countryMenu.classList.remove('show');
   pop.classList.toggle('show',!!open);
   pop.setAttribute('aria-hidden',String(!open));
   accountToggle.setAttribute('aria-expanded',String(!!open));
 }
 function toggleAccountMenu(e){
   if(e){e.preventDefault();e.stopPropagation();}
   setAccountMenu(!pop.classList.contains('show'));
 }
 // Use click for reliable mouse + touch activation. A document-level pointerdown handler previously closed the menu before this ran.
 accountToggle?.addEventListener('click',toggleAccountMenu);
 accountToggle?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleAccountMenu(e);}});
 pop?.addEventListener('click',e=>e.stopPropagation());
 loginAction?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setMode(false);openAuth();});
 signupAction?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setMode(true);openAuth();});
 logoutAction?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();localStorage.removeItem('amazeUser');refreshAccount();setAccountMenu(false);});
 closeBtn?.addEventListener('click',closeAuth);modal?.addEventListener('click',e=>{if(e.target===modal)closeAuth();});modeBtn?.addEventListener('click',()=>setMode(!signupMode));
 googleBtn?.addEventListener('click',()=>{msg.textContent='Google signup is selected. Connect your Google OAuth client to enable live Google authentication.';msg.classList.add('show');});
 // Searchable phone country-code picker
 const trigger=document.getElementById('auth-country-trigger'), menu=document.getElementById('auth-country-menu'), search=document.getElementById('auth-country-search'), list=document.getElementById('auth-country-list');
 const countries=[['IN','India','+91'],['US','United States','+1'],['GB','United Kingdom','+44'],['AE','United Arab Emirates','+971'],['SG','Singapore','+65'],['AU','Australia','+61'],['CA','Canada','+1'],['NZ','New Zealand','+64'],['DE','Germany','+49'],['FR','France','+33'],['IT','Italy','+39'],['ES','Spain','+34'],['NL','Netherlands','+31'],['CH','Switzerland','+41'],['SE','Sweden','+46'],['NO','Norway','+47'],['DK','Denmark','+45'],['FI','Finland','+358'],['IE','Ireland','+353'],['PT','Portugal','+351'],['BR','Brazil','+55'],['MX','Mexico','+52'],['AR','Argentina','+54'],['CL','Chile','+56'],['CO','Colombia','+57'],['JP','Japan','+81'],['CN','China','+86'],['KR','South Korea','+82'],['TH','Thailand','+66'],['MY','Malaysia','+60'],['ID','Indonesia','+62'],['PH','Philippines','+63'],['VN','Vietnam','+84'],['PK','Pakistan','+92'],['BD','Bangladesh','+880'],['LK','Sri Lanka','+94'],['NP','Nepal','+977'],['SA','Saudi Arabia','+966'],['QA','Qatar','+974'],['KW','Kuwait','+965'],['OM','Oman','+968'],['BH','Bahrain','+973'],['IL','Israel','+972'],['TR','Türkiye','+90'],['ZA','South Africa','+27'],['NG','Nigeria','+234'],['KE','Kenya','+254'],['EG','Egypt','+20'],['MA','Morocco','+212'],['RU','Russia','+7']];
 const flagFor=code=>[...code].map(c=>String.fromCodePoint(127397+c.charCodeAt(0))).join('');
 let selectedPhoneCode='+91';
 function renderCountries(q=''){const term=q.trim().toLowerCase();const matches=countries.filter(c=>(c[1]+' '+c[2]+' '+c[0]).toLowerCase().includes(term));list.innerHTML=matches.length?matches.map(c=>`<button type="button" class="country-code-option" data-code="${c[0]}" data-phone="${c[2]}"><span>${flagFor(c[0])}</span><span class="cc-name">${c[1]}</span><span class="cc-code">${c[2]}</span></button>`).join(''):'<div class="country-code-empty">No country found</div>';}
 trigger?.addEventListener('click',e=>{e.stopPropagation();const open=menu.hidden;menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open){renderCountries();setTimeout(()=>search.focus(),30);}});
 search?.addEventListener('input',()=>renderCountries(search.value));
 list?.addEventListener('click',e=>{const b=e.target.closest('.country-code-option');if(!b)return;selectedPhoneCode=b.dataset.phone;document.getElementById('auth-country-flag').textContent=flagFor(b.dataset.code);document.getElementById('auth-country-code').textContent=b.dataset.phone;menu.hidden=true;trigger.setAttribute('aria-expanded','false');});
 document.addEventListener('click',e=>{if(!document.getElementById('phone-country-picker')?.contains(e.target)){if(menu)menu.hidden=true;trigger?.setAttribute('aria-expanded','false');}});
 form?.addEventListener('submit',e=>{e.preventDefault();const phone=document.getElementById('auth-phone').value.trim();const email=emailInput.value.trim();const name=nameInput.value.trim()||'Amaze Traveller';if(signupMode&&!email&&!phone){msg.textContent='Please enter your Gmail/email or phone number.';msg.classList.add('show');return;}if(!signupMode&&!email&&!phone){msg.textContent='Please enter your email or phone number.';msg.classList.add('show');return;}localStorage.setItem('amazeUser',JSON.stringify({name,email,phone:phone?selectedPhoneCode+' '+phone:''}));refreshAccount();closeAuth();pop.classList.add('show');});
 refreshAccount();setMode(false);
 const countryToggle=document.getElementById('country-toggle'), flag=document.getElementById('selected-flag'), countryName=document.getElementById('selected-country-name');
 const countryMeta={IN:['India','+91'],US:['United States','+1'],GB:['United Kingdom','+44'],AE:['UAE','+971'],SG:['Singapore','+65'],AU:['Australia','+61']};
 const codeToFlag=code=>{
   if(!/^[A-Z]{2}$/.test(code||'')) return '🌐';
   return [...code].map(c=>String.fromCodePoint(127397+c.charCodeAt(0))).join('');
 };
 const setCountry=(code,name,manual=false)=>{
   code=(code||'IN').toUpperCase();
   const meta=countryMeta[code];
   name=name || (meta?meta[0]:code);
   flag.textContent=codeToFlag(code);
   if(countryName) countryName.textContent=' '+name+' ▾';
   document.querySelectorAll('#country-menu input.country-check').forEach(x=>x.checked=(x.value===code));
   if(meta){
     const select=document.getElementById('auth-country');
     if(select) select.value=meta[1];
   }
   if(manual) localStorage.setItem('amazeManualCountry',code);
 };
 countryToggle?.addEventListener('click',e=>{e.stopPropagation();countryMenu.classList.toggle('show');pop.classList.remove('show');});
 countryMenu?.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.addEventListener('change',()=>{
   if(cb.checked){
     const meta=countryMeta[cb.value]||[cb.value, ''];
     setCountry(cb.value,meta[0],true);
   } else {
     const any=[...countryMenu.querySelectorAll('input[type=checkbox]')].some(x=>x.checked);
     if(!any) cb.checked=true;
   }
 }));
 // Automatically detect the visitor's country from their IP. No GPS/location permission is requested.
 async function autoDetectCountry(){
   if(localStorage.getItem('amazeManualCountry')) return;
   try{
     const controller=new AbortController();
     const timer=setTimeout(()=>controller.abort(),3500);
     const res=await fetch('https://ipapi.co/json/',{headers:{'Accept':'application/json'},signal:controller.signal,cache:'no-store'});
     clearTimeout(timer);
     if(!res.ok) throw new Error('country lookup failed');
     const data=await res.json();
     if(data && data.country_code) setCountry(data.country_code,data.country_name||data.country_code,false);
   }catch(err){
     // Fallback to the browser's locale when IP detection is unavailable.
     try{
       const locale=(navigator.language||'en-IN').replace('_','-');
       const parts=locale.split('-');
       const region=(parts[1]||'IN').toUpperCase();
       setCountry(region,region,false);
     }catch(e){}
   }
 }
 setCountry(localStorage.getItem('amazeManualCountry')||'IN');
 autoDetectCountry();
 document.addEventListener('click',e=>{
   const insideAccount=!!e.target.closest?.('#account-toggle, #user-popover');
   const insideCountry=!!e.target.closest?.('#country-toggle, #country-menu');
   if(!insideAccount) setAccountMenu(false);
   if(!insideCountry && countryMenu) countryMenu.classList.remove('show');
 });
 refreshAccount();
 setMode(false);
})();

