(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=new Date(); today.setHours(0,0,0,0);
  const iso=d=>d.toISOString().slice(0,10);
  const plus=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
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
  function go(type, data){
    const q=new URLSearchParams({type,...data});
    location.href='results.html?'+q.toString();
  }
  const forms={
    hotel: e=>{e.preventDefault(); const f=e.currentTarget; go('hotels',{destination:f.destination.value,checkin:f.checkin.value,checkout:f.checkout.value,guests:f.guests.value||'2'});},
    flight:e=>{e.preventDefault();const f=e.currentTarget;go('flights',{from:f.from.value,to:f.to.value,depart:f.depart.value,ret:f.ret.value||'',trip:f.trip.value,cabin:f.cabin.value,travellers:f.travellers.value});},
    car:e=>{e.preventDefault();const f=e.currentTarget;go('cars',{pickup:f.pickup.value,drop:f.drop.value,pickupDate:f.pickupDate.value,dropDate:f.dropDate.value});},
    train:e=>{e.preventDefault();const f=e.currentTarget;go('trains',{from:f.from.value,to:f.to.value,date:f.date.value,travellers:f.travellers.value});},
    activity:e=>{e.preventDefault();const f=e.currentTarget;go('activities',{destination:f.destination.value,date:f.date.value,people:f.people.value});}
  };
  $$('.portal-form').forEach(f=>f.addEventListener('submit',e=>forms[f.dataset.type]?.(e)));
  setDefaults();
  window.Amaze={esc};
})();
