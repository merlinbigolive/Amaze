(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=new Date(); today.setHours(0,0,0,0);
  const iso=d=>d.toISOString().slice(0,10);
  const plus=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};

  // Autocomplete datasets for the portal UI. These can later be replaced by a live airport/station API.
  const flightPlaces=[
    ['Delhi','DEL','India','Delhi Indira Gandhi International Airport'],['Mumbai','BOM','India','Chhatrapati Shivaji Maharaj International Airport'],['Bengaluru','BLR','India','Kempegowda International Airport'],['Hyderabad','HYD','India','Rajiv Gandhi International Airport'],['Chennai','MAA','India','Chennai International Airport'],['Kolkata','CCU','India','Netaji Subhas Chandra Bose International Airport'],['Goa','GOI','India','Manohar International Airport / Goa'],['Ahmedabad','AMD','India','Sardar Vallabhbhai Patel International Airport'],['Pune','PNQ','India','Pune Airport'],['Jaipur','JAI','India','Jaipur International Airport'],['Lucknow','LKO','India','Chaudhary Charan Singh International Airport'],['Kochi','COK','India','Cochin International Airport'],['Dubai','DXB','United Arab Emirates','Dubai International Airport'],['Abu Dhabi','AUH','United Arab Emirates','Zayed International Airport'],['Doha','DOH','Qatar','Hamad International Airport'],['Singapore','SIN','Singapore','Singapore Changi Airport'],['Bangkok','BKK','Thailand','Suvarnabhumi Airport'],['London','LHR','United Kingdom','London Heathrow Airport'],['New York','JFK','United States','John F. Kennedy International Airport'],['Paris','CDG','France','Charles de Gaulle Airport'],['Frankfurt','FRA','Germany','Frankfurt Airport'],['Sydney','SYD','Australia','Sydney Kingsford Smith Airport'],['Toronto','YYZ','Canada','Toronto Pearson International Airport'],['Istanbul','IST','Türkiye','Istanbul Airport']
  ];
  const trainPlaces=[
    ['New Delhi','NDLS','India'],['Old Delhi','DLI','India'],['Hazrat Nizamuddin','NZM','India'],['Anand Vihar Terminal','ANVT','India'],['Mumbai Central','MMCT','India'],['Chhatrapati Shivaji Maharaj Terminus','CSMT','India'],['Bandra Terminus','BDTS','India'],['Jaipur','JP','India'],['Agra Cantt','AGC','India'],['Lucknow','LKO','India'],['Kanpur Central','CNB','India'],['Varanasi','BSBS','India'],['Kolkata Howrah','HWH','India'],['Ahmedabad','ADI','India'],['Surat','ST','India'],['Bengaluru','SBC','India'],['Chennai Central','MAS','India'],['Hyderabad Deccan','HYB','India'],['Pune','PUNE','India'],['Kochi Ernakulam','ERS','India'],['Amritsar','ASR','India'],['Chandigarh','CDG','India']
  ];
  const hotelPlaces=[
    ['Delhi','India'],['Mumbai','India'],['Bengaluru','India'],['Hyderabad','India'],['Chennai','India'],['Kolkata','India'],['Goa','India'],['Jaipur','India'],['Agra','India'],['Udaipur','India'],['Rishikesh','India'],['Manali','India'],['Shimla','India'],['Kochi','India'],['Dubai','United Arab Emirates'],['Singapore','Singapore'],['Bangkok','Thailand'],['London','United Kingdom'],['Paris','France'],['New York','United States'],['Rome','Italy'],['Istanbul','Türkiye'],['Bali','Indonesia'],['Maldives','Maldives']
  ];

  function setDefaults(){
    $$('input[type=date]').forEach(i=>{if(!i.value)i.value=iso(plus(today,7));});
    const co=$('#hotelCheckout'); if(co && !co.value) co.value=iso(plus(today,9));
    const ret=$('#flightReturn'); if(ret && !ret.value) ret.value=iso(plus(today,14));
    const carRet=$('#carDrop'); if(carRet && !carRet.value) carRet.value=iso(plus(today,10));
  }
  function activate(tab){
    $$('.service-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    $$('.search-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+tab));
  }
  $$('.service-tab').forEach(b=>b.onclick=()=>activate(b.dataset.tab));
  $$('.mobile-menu').forEach(b=>b.onclick=()=>$('#mainNav').classList.toggle('open'));
  $$('.switch-trip').forEach(b=>b.onclick=()=>{const f=$('#flightFrom'),t=$('#flightTo');[f.value,t.value]=[t.value,f.value];});

  function normalizeFlight(x){return `${x[0]} (${x[1]})`}
  function normalizeTrain(x){return `${x[0]} (${x[1]})`}
  function normalizeHotel(x){return `${x[0]}, ${x[1]}`}

  function setupAutocomplete(input, type){
    if(!input) return;
    const wrap=document.createElement('div'); wrap.className='autocomplete-wrap';
    input.parentNode.insertBefore(wrap,input); wrap.appendChild(input);
    const menu=document.createElement('div'); menu.className='autocomplete-menu'; menu.hidden=true; wrap.appendChild(menu);
    const source=type==='flight'?flightPlaces:type==='train'?trainPlaces:hotelPlaces;
    const format=type==='flight'?normalizeFlight:type==='train'?normalizeTrain:normalizeHotel;
    const detail=(x)=>type==='flight'?`${x[3]} · ${x[2]}`:type==='train'?`Railway station · ${x[2]}`:`Hotels, stays & accommodation · ${x[1]}`;
    function render(){
      const q=input.value.trim().toLowerCase();
      if(!q){menu.hidden=true;menu.innerHTML='';return;}
      const matches=source.filter(x=>x.join(' ').toLowerCase().includes(q)).slice(0,7);
      if(!matches.length){menu.hidden=true;menu.innerHTML='';return;}
      menu.innerHTML=matches.map((x,i)=>`<button type="button" class="autocomplete-item" data-i="${i}"><span class="ac-icon">${type==='flight'?'✈️':type==='train'?'🚆':'🏨'}</span><span class="ac-copy"><strong>${esc(format(x))}</strong><small>${esc(detail(x))}</small></span></button>`).join('');
      menu.hidden=false;
      menu.querySelectorAll('.autocomplete-item').forEach(btn=>btn.addEventListener('click',()=>{
        const x=matches[Number(btn.dataset.i)]; input.value=format(x); input.dataset.code=type==='hotel'?'':x[1]; input.dataset.country=x[type==='hotel'?1:2]||''; menu.hidden=true;
      }));
    }
    input.addEventListener('input',render);
    input.addEventListener('focus',()=>{if(input.value.trim())render()});
    document.addEventListener('click',e=>{if(!wrap.contains(e.target))menu.hidden=true});
  }
  setupAutocomplete($('#hotelDestination'),'hotel');
  setupAutocomplete($('#flightFrom'),'flight');
  setupAutocomplete($('#flightTo'),'flight');
  setupAutocomplete($('#trainFrom'),'train');
  setupAutocomplete($('#trainTo'),'train');

  function go(type, data){
    const q=new URLSearchParams({type,...data});
    location.href='results.html?'+q.toString();
  }
  const forms={
    hotel:e=>{e.preventDefault();const f=e.currentTarget;go('hotels',{destination:f.destination.value,checkin:f.checkin.value,checkout:f.checkout.value,guests:f.guests.value||'2'});},
    flight:e=>{e.preventDefault();const f=e.currentTarget;go('flights',{from:f.from.value,to:f.to.value,depart:f.depart.value,ret:f.ret.value||'',trip:f.trip.value,cabin:f.cabin.value,travellers:f.travellers.value,fromCode:$('#flightFrom')?.dataset.code||'',toCode:$('#flightTo')?.dataset.code||''});},
    car:e=>{e.preventDefault();const f=e.currentTarget;go('cars',{pickup:f.pickup.value,drop:f.drop.value,pickupDate:f.pickupDate.value,dropDate:f.dropDate.value});},
    train:e=>{e.preventDefault();const f=e.currentTarget;go('trains',{from:f.from.value,to:f.to.value,date:f.date.value,travellers:f.travellers.value,fromCode:$('#trainFrom')?.dataset.code||'',toCode:$('#trainTo')?.dataset.code||''});},
    activity:e=>{e.preventDefault();const f=e.currentTarget;go('activities',{destination:f.destination.value,date:f.date.value,people:f.people.value});}
  };
  $$('.portal-form').forEach(f=>f.addEventListener('submit',e=>forms[f.dataset.type]?.(e)));
  setDefaults();
  window.Amaze={esc};
})();
