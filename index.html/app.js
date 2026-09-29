// ระยะการเจริญเติบโต: t = ระยะเวลา (วินาที) ของแต่ละระยะ — แต่ละพืชมีจำนวนระยะและเวลาต่างกัน
const crops = {
  carrot:{name:"แครอท",emoji:"🥕",seed:10,sell:24,stages:[
    {name:"เพาะเมล็ด",emoji:"🌰",t:3},
    {name:"งอกราก",emoji:"🌱",t:5},
    {name:"แตกใบ",emoji:"🌿",t:7}
  ]},
  corn:{name:"ข้าวโพด",emoji:"🌽",seed:15,sell:36,stages:[
    {name:"เพาะเมล็ด",emoji:"🌰",t:4},
    {name:"งอก",emoji:"🌱",t:6},
    {name:"ต้นอ่อน",emoji:"🌿",t:7},
    {name:"ออกดอก",emoji:"🌾",t:8}
  ]},
  tomato:{name:"มะเขือเทศ",emoji:"🍅",seed:20,sell:50,stages:[
    {name:"เพาะเมล็ด",emoji:"🌰",t:5},
    {name:"งอก",emoji:"🌱",t:8},
    {name:"ออกดอก",emoji:"🌼",t:10},
    {name:"ผลดิบ",emoji:"🍏",t:12}
  ]},
  pumpkin:{name:"ฟักทอง",emoji:"🎃",seed:30,sell:75,stages:[
    {name:"เพาะเมล็ด",emoji:"🌰",t:6},
    {name:"งอก",emoji:"🌱",t:8},
    {name:"เถาเลื้อย",emoji:"🌿",t:10},
    {name:"ออกดอก",emoji:"🌼",t:12},
    {name:"ผลอ่อน",emoji:"🟢",t:14}
  ]}
};
function totalGrow(c){return c.stages.reduce((a,s)=>a+s.t*1000,0)}
// คำนวณระยะปัจจุบันของแปลงที่กำลังปลูก
function getStage(p){
  const c=crops[p.id], elapsed=Date.now()-p.plantedAt, total=totalGrow(c);
  let acc=0;
  for(let i=0;i<c.stages.length;i++){
    const s=c.stages[i], dur=s.t*1000;
    if(elapsed<acc+dur) return {ready:false,idx:i,count:c.stages.length,stage:s,stageRemain:acc+dur-elapsed,remain:total-elapsed,progress:elapsed/total};
    acc+=dur;
  }
  return {ready:true,idx:c.stages.length,count:c.stages.length,remain:0,progress:1};
}
const decors = {
  tree:{name:"ต้นไม้",emoji:"🌳",price:45},
  flower:{name:"แปลงดอกไม้",emoji:"🌷",price:35},
  fence:{name:"รั้วไม้",emoji:"🪵",price:60},
  well:{name:"บ่อน้ำ",emoji:"🪣",price:90},
  barn:{name:"โรงนา",emoji:"🏠",price:150},
  tractor:{name:"รถแทรกเตอร์",emoji:"🚜",price:220}
};

const initial = {
  money:100, day:1, plots:Array(9).fill(null), inventory:{},
  selectedSeed:null, selectedDecor:null, lastDay:Date.now()
};
let state = JSON.parse(localStorage.getItem("farmSave") || "null") || structuredClone(initial);
let deferredPrompt = null;

function save(){ localStorage.setItem("farmSave",JSON.stringify(state)); }
function fmt(ms){ if(ms<=0)return "พร้อมเก็บ!"; let s=Math.ceil(ms/1000); let m=Math.floor(s/60); s%=60; return `${m}:${String(s).padStart(2,"0")}`; }
function showMessage(t){document.getElementById("message").textContent=t; clearTimeout(showMessage.t); showMessage.t=setTimeout(()=>document.getElementById("message").textContent="แตะแปลงเพื่อปลูกผัก",2500)}

function render(){
  document.getElementById("money").textContent=state.money;
  document.getElementById("dayText").textContent=`วันที่ ${state.day} • ฟาร์มของฉัน`;
  let empty=0,ready=0;
  const farm=document.getElementById("farm"); farm.innerHTML="";
  state.plots.forEach((p,i)=>{
    const el=document.createElement("div");
    if(!p){empty++;el.className="plot empty";el.innerHTML="<div class='crop'>➕</div><div class='name'>ปลูก</div>";el.onclick=()=>openPlot(i)}
    else if(p.type==="decor"){el.className="plot decor";el.innerHTML=`<div class="crop">${p.emoji}</div><div class="name">${p.name}</div>`;el.onclick=()=>removeDecor(i)}
    else{
      const st=getStage(p), done=st.ready;
      if(done)ready++;
      el.className="plot "+(done?"ready":"growing");
      const emoji=done?p.emoji:st.stage.emoji;
      const label=done?"ระยะ: พร้อมเก็บเกี่ยว":`ระยะ ${st.idx+1}/${st.count} • ${st.stage.name}`;
      el.innerHTML=`<div class="crop ${done?"":"stage-"+st.idx}">${emoji}</div><div class="name">${p.name}</div><div class="stage-label">${label}</div><div class="bar"><i style="width:${Math.round(st.progress*100)}%"></i></div><div class="timer">${done?"✨ แตะเพื่อเก็บ":fmt(st.remain)}</div>`;
      el.onclick=()=>done?harvest(i):openGrowth(i);
    }
    farm.appendChild(el);
  });
  document.getElementById("emptyCount").textContent=empty;
  document.getElementById("readyCount").textContent=ready;
  renderSeeds(); renderDecors();
}
function renderSeeds(){
 const box=document.getElementById("seedShop"); box.innerHTML="";
 Object.entries(crops).forEach(([id,c])=>{
  const n=state.inventory[id]||0;
  const el=document.createElement("div"); el.className="card";
  el.innerHTML=`<div class="emoji">${c.emoji}</div><h3>${c.name}</h3><p>เมล็ด ${c.seed} 💰 • โต ${Math.round(totalGrow(c)/1000)} วินาที • ขาย ${c.sell} 💰</p><p class="stages-line">${c.stages.map(s=>s.emoji+"<small>"+s.t+"s</small>").join(" › ")} › ${c.emoji}</p><p>มี ${n} เมล็ด</p><button class="buy">ซื้อเมล็ด ${c.seed} 💰</button>`;
  el.querySelector("button").onclick=()=>buySeed(id); box.appendChild(el);
 });
}
function renderDecors(){
 const box=document.getElementById("decorShop"); box.innerHTML="";
 Object.entries(decors).forEach(([id,d])=>{
  const el=document.createElement("div");el.className="card";
  el.innerHTML=`<div class="emoji">${d.emoji}</div><h3>${d.name}</h3><p>${d.price} 💰</p><button class="buy">ซื้อและวาง</button>`;
  el.querySelector("button").onclick=()=>buyDecor(id);box.appendChild(el);
 });
}
function buySeed(id){let c=crops[id];if(state.money<c.seed){showMessage("เงินไม่พอ 💸");return}state.money-=c.seed;state.inventory[id]=(state.inventory[id]||0)+1;save();render();showMessage(`ซื้อเมล็ด${c.name}แล้ว 🌱`)}
function buyDecor(id){let d=decors[id];if(state.money<d.price){showMessage("เงินไม่พอ 💸");return}state.money-=d.price;state.selectedDecor=id;showMessage(`ซื้อ ${d.name} แล้ว! แตะแปลงว่างเพื่อวาง`);save()}
function openPlot(i){
 if(state.selectedDecor){let d=decors[state.selectedDecor];state.plots[i]={type:"decor",name:d.name,emoji:d.emoji};state.selectedDecor=null;save();render();showMessage("วางของตกแต่งแล้ว 🏡");return}
 document.getElementById("modalTitle").textContent="🌱 เลือกเมล็ดพันธุ์";
 const content=document.getElementById("modalContent");content.innerHTML="";
 Object.entries(crops).forEach(([id,c])=>{
  const n=state.inventory[id]||0;const b=document.createElement("button");b.className="action";b.disabled=n<=0;b.textContent=`${c.emoji} ${c.name} (${n})`;
  b.onclick=()=>plant(i,id);content.appendChild(b);
 });
 document.getElementById("modal").classList.remove("hidden");
}
function plant(i,id){if(!state.inventory[id])return;state.inventory[id]--;let c=crops[id];state.plots[i]={type:"crop",id,name:c.name,emoji:c.emoji,plantedAt:Date.now()};closeModal();save();render();showMessage(`ปลูก${c.name}แล้ว 🌱`)}
function openGrowth(i){
 const p=state.plots[i],c=crops[p.id],st=getStage(p);
 document.getElementById("modalTitle").textContent=`${c.emoji} ระยะการเจริญของ${c.name}`;
 const content=document.getElementById("modalContent");
 let rows=c.stages.map((s,k)=>{
  const cls=k<st.idx?"done":k===st.idx?"current":"todo";
  const mark=k<st.idx?"✅":k===st.idx?"⏳":"⚪";
  const extra=k===st.idx?` (เหลือ ${fmt(st.stageRemain)})`:"";
  return `<li class="${cls}"><span>${mark} ${s.emoji} ระยะ ${k+1}: ${s.name}</span><b>${s.t} วิ${extra}</b></li>`;
 }).join("");
 rows+=`<li class="todo"><span>🎉 ${c.emoji} พร้อมเก็บเกี่ยว</span><b>ขาย ${c.sell} 💰</b></li>`;
 content.innerHTML=`<ul class="stage-list">${rows}</ul><p class="hint">รวมทั้งหมด ${Math.round(totalGrow(c)/1000)} วินาที • เหลืออีก ${fmt(st.remain)}</p>`;
 document.getElementById("modal").classList.remove("hidden");
}
function harvest(i){let p=state.plots[i],c=crops[p.id];state.money+=c.sell;state.plots[i]=null;save();render();showMessage(`เก็บ${c.name} ได้ +${c.sell} 💰`)}
function removeDecor(i){if(state.selectedDecor){openPlot(i);return}showMessage("นี่คือของตกแต่ง แตะร้านเพื่อซื้อชิ้นใหม่")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};

setInterval(()=>{render()},1000);

// วันใหม่ทุก 3 นาทีสำหรับเดโม
setInterval(()=>{if(Date.now()-state.lastDay>=180000){state.day++;state.lastDay=Date.now();save();render();}},5000);

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden")});
document.getElementById("installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.getElementById("installBtn").classList.add("hidden")};

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(console.error))}
render();
