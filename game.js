const SAVE_KEY="samurai_way_of_blade_v1";
const katanaData=[
 {id:"wood",name:"Стартовая катана",price:0,damage:10,speed:1},
 {id:"steel",name:"Стальная катана",price:500,damage:16,speed:1.05},
 {id:"fire",name:"Огненная катана",price:1500,damage:25,speed:1},
 {id:"lightning",name:"Молниеносная",price:3500,damage:32,speed:1.2},
 {id:"dark",name:"Тёмная катана",price:7000,damage:45,speed:1.1},
 {id:"shogun",name:"Катана сёгуна",price:15000,damage:65,speed:1.3}
];
let save=loadSave();
function defaultSave(){return{level:1,coins:0,owned:["wood"],equipped:"wood"}}
function loadSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY))||defaultSave()}catch(e){return defaultSave()}}
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));updateMenu()}
function updateMenu(){document.getElementById("menuStats").textContent=`Уровень ${save.level} · Монеты ${save.coins}`;document.getElementById("shopCoins").textContent=save.coins}
function show(id){["menu","shop","game"].forEach(x=>document.getElementById(x).classList.toggle("hidden",x!==id));if(id==="menu")updateMenu()}
document.getElementById("continueBtn").onclick=()=>startGame(save.level);
document.getElementById("shopBtn").onclick=()=>{renderShop();show("shop")};
document.getElementById("backBtn").onclick=()=>show("menu");
document.getElementById("resetBtn").onclick=()=>{if(confirm("Сбросить весь прогресс?")){save=defaultSave();persist()}};

function renderShop(){
 const box=document.getElementById("katanas");box.innerHTML="";
 katanaData.forEach(k=>{
  const owned=save.owned.includes(k.id), eq=save.equipped===k.id;
  const div=document.createElement("div");div.className="katana"+(eq?" equipped":"");
  div.innerHTML=`<div><div class="name">${k.name}</div><small>Урон ${k.damage} · Скорость ${k.speed}×<br>${owned?(eq?"Экипирована":"Куплена"):"Цена: "+k.price+" 🪙"}</small></div>`;
  const b=document.createElement("button");b.textContent=eq?"ВЫБРАНО":owned?"ЭКИПИРОВАТЬ":`КУПИТЬ`;
  b.disabled=eq;
  b.onclick=()=>{if(owned){save.equipped=k.id;persist();renderShop()}else if(save.coins>=k.price){save.coins-=k.price;save.owned.push(k.id);save.equipped=k.id;persist();renderShop()}};
  div.appendChild(b);box.appendChild(div);
 });
 updateMenu();
}

let scene,camera,renderer,player,enemies=[],keys={};let joystick={x:0,y:0};let attackLock=false,invuln=0,playerHP=100,currentLevel=1,spawned=false;
const canvas=document.getElementById("gameCanvas");
function startGame(level){
 currentLevel=Math.max(1,Math.min(30,level));show("game");init3D();buildLevel(currentLevel);
}
function init3D(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x10141a);scene.fog=new THREE.Fog(0x10141a,18,55);
 camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100);renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
 const hemi=new THREE.HemisphereLight(0xffe8cc,0x243244,2.1);scene.add(hemi);const sun=new THREE.DirectionalLight(0xffd2aa,2.2);sun.position.set(-10,18,8);scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0x293126,roughness:1}));ground.rotation.x=-Math.PI/2;scene.add(ground);
 for(let i=0;i<18;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(.08,.18,Math.random()*1.8+.5,8),new THREE.MeshStandardMaterial({color:0x6a3825}));t.position.set((Math.random()-.5)*55,.4,(Math.random()-.5)*55);scene.add(t)}
 addEventListener("resize",resize);requestAnimationFrame(loop);
}
function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function makeSamurai(){
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.8,5,10),new THREE.MeshStandardMaterial({color:0x171b22,metalness:.2}));
 body.position.y=1.15;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),new THREE.MeshStandardMaterial({color:0xc98968}));head.position.y=1.9;g.add(head);
 const hat=new THREE.Mesh(new THREE.CylinderGeometry(.5,.65,.18,16),new THREE.MeshStandardMaterial({color:0x111111}));hat.position.y=2.2;g.add(hat);
 const blade=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,1.25),new THREE.MeshStandardMaterial({color:0xd8dce3,metalness:.8}));blade.position.set(.48,1.25,-.1);blade.rotation.y=Math.PI/2;g.add(blade);
 return g;
}
function makeEnemy(){
 const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CapsuleGeometry(.4,.7,5,8),new THREE.MeshStandardMaterial({color:0x5d1720}));b.position.y=1;g.add(b);
 const h=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8),new THREE.MeshStandardMaterial({color:0xb86f56}));h.position.y=1.7;g.add(h);return g;
}
function buildLevel(lvl){
 enemies.forEach(e=>scene.remove(e.mesh));enemies=[];player=makeSamurai();player.position.set(0,0,0);scene.add(player);
 playerHP=100;document.getElementById("hp").textContent=playerHP;document.getElementById("coins").textContent=save.coins;document.getElementById("level").textContent=currentLevel;
 const count=Math.min(2+Math.floor(lvl*.55),15);const hp=25+lvl*7;
 for(let i=0;i<count;i++){const e={mesh:makeEnemy(),hp,max:hp,attack:10+lvl*.8,dead:false};const a=i/count*Math.PI*2;e.mesh.position.set(Math.cos(a)*(7+lvl*.12),0,Math.sin(a)*(7+lvl*.12));scene.add(e.mesh);enemies.push(e)}
 msg(`Уровень ${lvl}: победите ${count} врагов`,1800);
}
function msg(t,time=1000){const m=document.getElementById("message");m.textContent=t;clearTimeout(m._t);m._t=setTimeout(()=>m.textContent="",time)}
function attack(){
 if(attackLock||!player)return;attackLock=true;player.rotation.y+=0.01;
 const k=katanaData.find(x=>x.id===save.equipped)||katanaData[0];const reach=2.3;
 enemies.forEach(e=>{if(e.dead)return;const d=player.position.distanceTo(e.mesh.position);if(d<reach){e.hp-=k.damage;e.mesh.scale.setScalar(.85);setTimeout(()=>{if(e.mesh)e.mesh.scale.setScalar(1)},80);if(e.hp<=0){e.dead=true;scene.remove(e.mesh);save.coins+=25+currentLevel*3;persist();msg(`+${25+currentLevel*3} 🪙`)}}});
 setTimeout(()=>attackLock=false,300/k.speed);
}
function dodge(){invuln=.55;player.position.x-=Math.sin(player.rotation.y)*1.5;player.position.z-=Math.cos(player.rotation.y)*1.5}
function update(dt){
 if(!player)return;const speed=4.2;const dx=joystick.x,dy=joystick.y;
 if(Math.abs(dx)+Math.abs(dy)>.1){player.position.x+=dx*speed*dt;player.position.z+=dy*speed*dt;player.rotation.y=Math.atan2(dx,dy)}
 enemies.forEach(e=>{if(e.dead)return;const d=e.mesh.position.distanceTo(player.position);if(d<1.7&&invuln<=0){playerHP=Math.max(0,playerHP-e.attack*dt);document.getElementById("hp").textContent=Math.floor(playerHP)}if(d>1.7){e.mesh.position.lerp(player.position,dt*.18);e.mesh.lookAt(player.position.x,1,e.mesh.position.z)}});
 invuln=Math.max(0,invuln-dt);
 if(enemies.every(e=>e.dead)){nextLevel()}
}
function nextLevel(){
 if(!spawned){spawned=true;setTimeout(()=>{spawned=false;if(currentLevel<30){save.level=Math.max(save.level,currentLevel+1);persist();currentLevel++;buildLevel(currentLevel)}else{msg("🏆 ВЫ ПОБЕДИЛИ! ВСЕ 30 УРОВНЕЙ ПРОЙДЕНЫ",5000);setTimeout(()=>show("menu"),5200)}},1200)}
}
function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-(loop.last||t))/1000);loop.last=t;if(renderer&&scene){update(dt);camera.position.lerp(new THREE.Vector3(player.position.x,5.5,player.position.z+8),.08);camera.lookAt(player.position.x,1,player.position.z);renderer.render(scene,camera)}}

document.getElementById("attack").ontouchstart=e=>{e.preventDefault();attack()};document.getElementById("attack").onclick=attack;
document.getElementById("dodge").ontouchstart=e=>{e.preventDefault();dodge()};document.getElementById("dodge").onclick=dodge;
addEventListener("keydown",e=>{if(e.code==="Space")attack();if(e.code==="ShiftLeft")dodge();keys[e.key]=true});
const joy=document.getElementById("joystick"),stick=document.getElementById("stick");let joyActive=false;
function setJoy(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=e.clientX-cx,y=e.clientY-cy;const max=r.width*.38,d=Math.hypot(x,y);if(d>max){x=x/d*max;y=y/d*max}stick.style.transform=`translate(${x}px,${y}px)`;joystick.x=x/max;joystick.y=y/max}
joy.addEventListener("pointerdown",e=>{joyActive=true;joy.setPointerCapture(e.pointerId);setJoy(e)});joy.addEventListener("pointermove",e=>{if(joyActive)setJoy(e)});joy.addEventListener("pointerup",()=>{joyActive=false;joystick.x=joystick.y=0;stick.style.transform=""});joy.addEventListener("pointercancel",()=>{joyActive=false;joystick.x=joystick.y=0;stick.style.transform=""});
updateMenu();
