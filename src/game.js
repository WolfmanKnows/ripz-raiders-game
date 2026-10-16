
(function(){
  'use strict';
  var sprites = {};
  var spriteNames = ['hootling','nestling','owlie_trainer','packrat','chrome_hoot','bulkbuyer','clearout','foilghost','resale','ripper','shelfcleaner'];
  spriteNames.forEach(function(n){
    var img = new Image();
    img.src = 'assets/sprites/'+n+'.png';
    sprites[n] = img;
  });
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  var TILE = 16, scale = 1;
  var px = 4*TILE, py = 4*TILE, facing = 0, frame = 0, zone = 'plaza';
  var party = [{name:'Hootling', hp:24, max:24, atk:10, def:5, lvl:5, xp:0, moves:['Peck','Gust'], shiny:false, held:'Berry'}];

  
  
  var LEARN = {
    5: 'Gust', 8: 'Tackle', 10: 'Bite', 12: 'Ember', 15: 'Spark', 18: 'Leaf'
  };
var MOVES = {
    Peck:{pwr:35, type:'normal', pp:25},
    Gust:{pwr:40, type:'flying', pp:20},
    Tackle:{pwr:30, type:'normal', pp:30},
    Ember:{pwr:40, type:'fire', pp:20},
    Spark:{pwr:40, type:'electric', pp:20},
    Bite:{pwr:45, type:'dark', pp:15},
    Leaf:{pwr:40, type:'grass', pp:20},
    Rock:{pwr:50, type:'rock', pp:15},
    Ice:{pwr:40, type:'ice', pp:20},
    Sand:{pwr:35, type:'ground', pp:25}
  };
  var TYPES = {
    hootling:'normal', packrat:'normal', foilpup:'steel', nestling:'flying',
    screech:'dark', pebble:'rock', spark:'electric', moss:'grass',
    dune:'ground', frost:'ice', ember:'fire'
  };
  var EFFECT = {
    fire:{grass:2, ice:2, water:0.5, fire:0.5},
    water:{fire:2, ground:2, grass:0.5, water:0.5},
    grass:{water:2, ground:2, fire:0.5, grass:0.5},
    electric:{water:2, flying:2, ground:0, electric:0.5},
    ice:{grass:2, ground:2, fire:0.5, ice:0.5},
    rock:{fire:2, flying:2, ground:0.5},
    ground:{electric:2, fire:2, grass:0.5, flying:0},
    flying:{grass:2, rock:0.5, electric:0.5},
    dark:{normal:1.2},
    steel:{ice:1.5, fire:0.5},
    normal:{}
  };

  var MONSTERS = [
    {id:'hootling', stages:['Hootling','Owlet','Owlie'], baseHp:22, baseAtk:9, color:'#4060c0'},
    {id:'packrat', stages:['Packrat','Hoarder','Vaultlord'], baseHp:20, baseAtk:8, color:'#c06040'},
    {id:'foilpup', stages:['Foilpup','Shimmer','Gleamowl'], baseHp:18, baseAtk:10, color:'#e0c040'},
    {id:'nestling', stages:['Nestling','Branchowl','Canopy'], baseHp:24, baseAtk:7, color:'#60a060'},
    {id:'screech', stages:['Screech','Howl','Nightcall'], baseHp:19, baseAtk:11, color:'#8040a0'},
    {id:'pebble', stages:['Pebble','Boulder','Cragowl'], baseHp:26, baseAtk:6, color:'#808080'},
    {id:'spark', stages:['Spark','Volt','Thunderowl'], baseHp:17, baseAtk:12, color:'#40c0e0'},
    {id:'moss', stages:['Moss','Fern','Elderowl'], baseHp:23, baseAtk:8, color:'#408040'},
    {id:'dune', stages:['Dune','Sandowl','Mirage'], baseHp:21, baseAtk:9, color:'#c0a060'},
    {id:'frost', stages:['Frost','Iceowl','Glacier'], baseHp:20, baseAtk:9, color:'#a0d0e0'},
    {id:'ember', stages:['Ember','Blaze','Phoenixowl'], baseHp:18, baseAtk:11, color:'#e04020'}
  ];
  var ZONE_WILDS = {
    plaza: ['hootling','nestling','moss'],
    route: ['packrat','foilpup','screech','pebble'],
    alley: ['spark','ember','dune'],
    shop: ['frost'], forest: ['moss','elderowl','canopy'], rooftop: ['canopy','elderowl','screech']
  };
  function randomWild(){
    var pool = ZONE_WILDS[zone] || ZONE_WILDS.plaza;
    var id = pool[Math.floor(Math.random()*pool.length)];
    var m = null;
    for(var i=0;i<MONSTERS.length;i++) if(MONSTERS[i].id===id) m=MONSTERS[i];
    if(!m) m = MONSTERS[0];
    var stage = 0;
    var name = m.stages[stage];
    var hp = m.baseHp + Math.floor(Math.random()*6);
    return {name:name, species:m.id, stage:stage, hp:hp, max:hp, atk:m.baseAtk+Math.floor(Math.random()*3), def:3+Math.floor(Math.random()*2), color:m.color, moves: (TYPES[m.id]==='fire'?['Ember','Peck','Tackle']:TYPES[m.id]==='electric'?['Spark','Gust','Tackle']:TYPES[m.id]==='grass'?['Leaf','Tackle','Peck']:TYPES[m.id]==='rock'?['Rock','Tackle','Peck']:TYPES[m.id]==='ice'?['Ice','Gust','Peck']:TYPES[m.id]==='ground'?['Sand','Tackle','Peck']:TYPES[m.id]==='dark'?['Bite','Peck','Tackle']:['Peck','Gust','Tackle'])};
  }
  function checkEvo(p){
    for(var i=0;i<MONSTERS.length;i++){
      var m=MONSTERS[i];
      if(p.species===m.id || p.name===m.stages[0] || p.name===m.stages[1]){
        if(!p.species) p.species=m.id;
        if(p.stage===undefined) p.stage = m.stages.indexOf(p.name);
        if(p.stage<0) p.stage=0;
        if(p.lvl>=6 && p.stage===0){ p.stage=1; p.name=m.stages[1]; p.max+=4; p.atk+=1; p.hp=p.max; if(!p.moves) p.moves=[]; if(p.moves.indexOf('Gust')<0) p.moves.push('Gust'); return m.stages[1]; }
        if(p.lvl>=12 && p.stage===1){ p.stage=2; p.name=m.stages[2]; p.max+=6; p.atk+=2; p.hp=p.max; if(!p.moves) p.moves=[]; var evoMove = TYPES[m.id]==='fire'?'Ember':TYPES[m.id]==='electric'?'Spark':TYPES[m.id]==='grass'?'Leaf':'Bite'; if(p.moves.indexOf(evoMove)<0) p.moves.push(evoMove); return m.stages[2]; }
      }
    }
    return null;
  }

  var berries = 5, etbs = 0, packs = 1, flags = {}, badges = 0, score = 0, mute = false;
  var dialog = null, dialogIdx = 0, menuOpen = false, menuSel = 0;
  var inBattle = false, wild = null, trainerTeam = null, trainerIdx = 0, battleSel = 0, active = 0, battleLog = [], moveSel = 0, pickingMove = false, burnTurns = 0, sleepTurns = 0;
  var keys = {}, touchDir = null, grassTicks = 0, shake = 0, fade = 0, zoneTimer = 0, animFrame = 0, flash = 0, floatText = null;
  var wins = 0, notes = 0, steps = 0, playTime = 0, shinyOdds = 0.04, dayPhase = 0, tokens = 0, achievements = [], seen = {}, volume = 1, textSpeed = 1, weather = 0;

  var zones = {
    plaza: {
      w:12, h:10,
      map:[
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,2,0,0,0,3,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,4,0,0,0,0,5,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,6,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,7,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1]
      ],
      npcs:[
        {x:2*TILE,y:2*TILE,name:'Shopkeeper',lines:['ohhTCG shop. Sit at the Pack Bar to rip.']},
        {x:6*TILE,y:2*TILE,name:'Kid',lines:['Bring me 3 berries for a reward.']},
        {x:8*TILE,y:4*TILE,name:'Pat',lines:['Find the note on the route.','Then beat the scalper.']},
        {x:9*TILE,y:8*TILE,name:'Guide',lines:['North to the route.','East to the alley.','Rumor: shinies are rare.']}
      ],
      exits:[
        {x:5,y:1,to:'route',px:5*TILE,py:8*TILE},
        {x:5,y:8,to:'shop',px:5*TILE,py:1*TILE},
        {x:10,y:5,to:'alley',px:1*TILE,py:5*TILE},{x:1,y:5,to:'rooftop',px:1*TILE,py:3*TILE}
      ]
    },
    route: {
      w:12, h:10,
      map:[
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,3,3,3,0,0,0,0,1],
        [1,0,0,0,3,3,3,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1]
      ],
      npcs:[
        {x:3*TILE,y:4*TILE,name:'Note',lines:['A note: Scalpers meet in the alley.']},
        {x:8*TILE,y:4*TILE,name:'Scalper',lines:['These packs are mine!']},{x:4*TILE,y:6*TILE,name:'Rival',lines:['I will beat you!']}
      ],
      exits:[{x:5,y:8,to:'plaza',px:5*TILE,py:1*TILE},{x:10,y:4,to:'forest',px:1*TILE,py:4*TILE}]
    },
    shop: {
      w:10, h:8,
      map:[
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,2,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      npcs:[{x:2*TILE,y:2*TILE,name:'Clerk',lines:['SWAP berries for packs.']},{x:6*TILE,y:3*TILE,name:'Pack Bar',lines:['Rip packs. 5 tokens to buy one.']}],
      exits:[{x:5,y:1,to:'plaza',px:5*TILE,py:8*TILE}]
    },
    rooftop: {
      w:8, h:6,
      map:[[1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,1],[1,0,3,3,3,0,0,1],[1,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1]],
      npcs:[{x:3*TILE,y:2*TILE,name:'Lookout',lines:['High up. Rare views and rare Owlies.']}],
      exits:[{x:1,y:3,to:'plaza',px:10*TILE,py:5*TILE}]
    },
    forest: {
      w:10, h:8,
      map:[[1,1,1,1,1,1,1,1,1,1],[1,0,0,3,3,3,0,0,0,1],[1,0,0,3,3,3,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1]],
      npcs:[{x:5*TILE,y:4*TILE,name:'Ranger',lines:['Deep woods. Rare Owlies here.']}],
      exits:[{x:1,y:4,to:'route',px:10*TILE,py:4*TILE}]
    },
    alley: {
      w:10, h:8,
      map:[
        [1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1]
      ],
      npcs:[{x:6*TILE,y:3*TILE,name:'Lead Scalper',lines:['You found us. Fight.']}],
      exits:[{x:1,y:5,to:'plaza',px:10*TILE,py:5*TILE}]
    }
  };

  function getSave(){
    return {px:px,py:py,zone:zone,party:party,berries:berries,etbs:etbs,packs:packs,flags:flags,badges:badges,score:score,wins:wins,notes:notes,mute:mute,active:active,tokens:tokens,achievements:achievements,seen:seen,volume:volume,textSpeed:textSpeed,pc:pc,rivalWins:rivalWins,ngPlus:ngPlus};
  }
  function loadSave(d){
    if(!d) return;
    if(typeof d.px==='number') px=d.px;
    if(typeof d.py==='number') py=d.py;
    if(d.zone && zones[d.zone]) zone=d.zone;
    if(d.party && d.party.length) party=d.party;
    if(typeof d.berries==='number') berries=d.berries;
    if(typeof d.etbs==='number') etbs=d.etbs;
    if(typeof d.packs==='number') packs=d.packs;
    if(d.flags) flags=d.flags;
    if(typeof d.badges==='number') badges=d.badges;
    if(typeof d.score==='number') score=d.score;
    if(typeof d.wins==='number') wins=d.wins;
    if(typeof d.notes==='number') notes=d.notes;
    if(typeof d.mute==='boolean') mute=d.mute;
    if(typeof d.active==='number') active=d.active;
if(typeof d.tokens==='number') tokens=d.tokens;
if(d.achievements) achievements=d.achievements;
if(d.seen) seen=d.seen;
if(typeof d.volume==='number') volume=d.volume;
if(typeof d.textSpeed==='number') textSpeed=d.textSpeed;
if(d.pc) pc=d.pc;
if(typeof d.rivalWins==='number') rivalWins=d.rivalWins;
if(typeof d.ngPlus==='boolean') ngPlus=d.ngPlus;
  }
  try{ var sv=localStorage.getItem('ripz_save'); if(sv) loadSave(JSON.parse(sv)); }catch(e){}
  function unlock(id, msg){
    if(achievements.indexOf(id)<0){ achievements.push(id); startDialog(['Achievement: '+msg]); beep(800,0.1); }
  }
function save(){ try{ localStorage.setItem('ripz_save', JSON.stringify(getSave())); }catch(e){} }

  function beep(freq, dur){
    if(mute) return;
    try{
      var ac = new (window.AudioContext||window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.value = freq; o.type='square';
      g.gain.setValueAtTime(0.07, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+dur);
      o.start(); o.stop(ac.currentTime+dur);
    }catch(e){}
  }

  var fadeAlpha = 0;
  function flashZone(name){
    fadeAlpha = 1; flash=8;
    var el = document.getElementById('zoneFlash');
    el.textContent = name.toUpperCase();
    el.style.display = 'block';
    zoneTimer = 40;
  }

  function startDialog(lines){
    dialog=lines; dialogIdx=0;
    var el=document.getElementById('dialog');
    el.style.display='block'; el.textContent=lines[0]; if(textSpeed>1) setTimeout(advanceDialog, 250);
    beep(440,0.05);
  }
  function advanceDialog(){
    if(!dialog) return;
    dialogIdx++;
    if(dialogIdx>=dialog.length){ dialog=null; document.getElementById('dialog').style.display='none'; }
    else document.getElementById('dialog').textContent=dialog[dialogIdx];
  }
  function openMenu(){
    menuOpen=true; menuSel=0;
    var menu = document.getElementById('menu');
    var labels = ['Party','Reorder Lead','Equip Berry','Items','Dex','Quests','Save','Fast Travel','PC Box','Rival','Settings','Card Flip','Reset','Close'];
    menu.innerHTML = labels.map(function(l){ return '<div>'+l+'</div>'; }).join('');
    menu.style.display='block';
    updateMenu();
    // rebind clicks
    var mItems=menu.querySelectorAll('div');
    for(var j=0;j<mItems.length;j++){
      (function(el,idx){ el.addEventListener('click', function(){ menuSel=idx; updateMenu(); menuAction(); }); })(mItems[j],j);
    }
  }
  function closeMenu(){ menuOpen=false; document.getElementById('menu').style.display='none'; }
  function updateMenu(){
    var items=document.querySelectorAll('#menu div');
    for(var i=0;i<items.length;i++) items[i].className = i===menuSel ? 'sel' : '';
  }
  function menuAction(){
    var acts=['party','reorder','equip','items','dex','quests','save','travel','pc','rival','settings','minigame','reset','close'];
    var a=acts[menuSel];
    if(a==='party'){
      var lines=party.map(function(p,i){ return (i===active?'> ':'')+p.name+' Lv'+p.lvl+' HP '+p.hp+'/'+p.max+' XP'+p.xp; });
      lines.push('Seen: '+Object.keys(seen).length); lines.push('Tap again to cycle lead.');
      startDialog(lines); closeMenu();
    } else if(a==='reorder'){ if(party.length>1){ var lead=party.shift(); party.push(lead); active=0; startDialog(['Lead is now '+party[0].name+'.']); } else startDialog(['Only one Owlie.']); closeMenu(); }
else if(a==='equip'){ if(berries>=1){ party[active].held='Berry'; berries--; startDialog(['Equipped Berry.']); } else if(tokens>=10){ tokens-=10; party[active].held='Focus'; startDialog(['Equipped Focus (ATK).']); } else startDialog(['Need berries or 10 tokens.']); closeMenu(); }
else if(a==='items'){
      startDialog(['Berries: '+berries+' (heal)','Packs: '+packs+' (open for bonus)','ETBs: '+etbs]);
      closeMenu();
    } else if(a==='dex'){ var lines=MONSTERS.map(function(m){ return (seen[m.stages[0]]?'*':'')+m.stages[0]+'/'+m.stages[1]+'/'+m.stages[2]; }); startDialog(lines.slice(0,6)); closeMenu(); }
else if(a==='quests'){
      var q = [];
      q.push(flags.gotNote ? 'Note: found' : 'Note: find on route');
      q.push(flags.beatScalper ? 'Scalper: beaten' : 'Scalper: not yet');
      q.push(flags.beatLead ? 'Lead: beaten' : 'Lead: in alley');
      startDialog(q); closeMenu();
    } else if(a==='save'){ save(); startDialog(['Saved.','This session: '+steps+' steps, '+wins+' wins, '+tokens+' tokens']); closeMenu(); }
else if(a==='travel'){ fastTravel(); closeMenu(); }
else if(a==='pc'){
  var lines = ['PC Box ('+pc.length+')'];
  for(var i=0;i<Math.min(pc.length,5);i++) lines.push(pc[i].name+' Lv'+pc[i].lvl);
  if(party.length>1){ var dep=party.pop(); pc.push(dep); lines.push('Deposited '+dep.name); }
  else if(pc.length){ var w=pc.pop(); party.push(w); lines.push('Withdrew '+w.name); }
  else lines.push('Need 2+ in party to deposit');
  startDialog(lines); closeMenu(); save();
} else if(a==='rival'){
  startBattle({name:'Rival',hp:35+rivalWins*5,max:35,atk:10+rivalWins,def:4}, true);
  closeMenu();
} else if(a==='settings'){ mute=!mute; textSpeed = textSpeed===1?2:1; dayPhase = dayPhase?0:1; startDialog([mute?'Sound off.':'Sound on.','Steps: '+steps,'Time: '+Math.floor(playTime/60)+'m','Tokens: '+tokens,'Seen: '+Object.keys(seen).length,'Badges: '+badges,'Party: '+party.length+'/5','Mode: '+(dayPhase?'Night':'Day'),'NG+: '+(ngPlus?'Yes':'No')]); closeMenu(); }
    else if(a==='minigame'){ var r=Math.random()<0.5; if(r){ berries++; startDialog(['Card flip: win! +1 berry.']); } else startDialog(['Card flip: lose.']); closeMenu(); }
else if(a==='reset'){ if(confirm('Reset all progress?')){ localStorage.removeItem('ripz_save'); location.reload(); } closeMenu(); }
else closeMenu();
  }

  function z(){ return zones[zone]; }
  function tileAt(tx,ty){
    var m=z().map;
    if(ty<0||tx<0||ty>=m.length||tx>=m[0].length) return 1;
    return m[ty][tx];
  }
  function solid(tx,ty){ return tileAt(tx,ty)===1; }

  function tryMove(dx,dy){
    if(dialog||menuOpen||inBattle||fade>0) return;
    var nx=px+dx, ny=py+dy;
    var tx=Math.floor(nx/TILE), ty=Math.floor(ny/TILE);
    if(!solid(tx,ty)){ px=nx; py=ny; frame=(frame+1)%2; steps++; beep(160,0.02); }
    if(dx<0) facing=2; else if(dx>0) facing=3; else if(dy<0) facing=1; else facing=0;
    var exits=z().exits||[];
    for(var i=0;i<exits.length;i++){
      var e=exits[i];
      if(tx===e.x && ty===e.y){
        fade=8;
        setTimeout(function(){
          zone=e.to; px=e.px; py=e.py; save();
          flashZone(zone);
          fade=0;
        }, 120);
        return;
      }
    }
  }

  function fastTravel(){
  if(badges<1){ startDialog(['Need a badge first.']); return; }
  var dest = zone==='plaza'?'route':zone==='route'?'alley':zone==='alley'?'shop':'plaza';
  zone=dest; px=4*TILE; py=4*TILE; flashZone(zone); save();
}
function interact(){
    if(dialog){ advanceDialog(); return; }
    if(menuOpen){ menuAction(); return; }
    if(inBattle && pickingMove){
      if(e.key==='ArrowUp'){ moveSel=(moveSel+2)%3; }
      if(e.key==='ArrowDown'){ moveSel=(moveSel+1)%3; }
      if(e.key==='Enter'||e.key===' '){ battleAction(); }
    }
if(inBattle){ battleAction(); return; }
    var fx=px, fy=py;
    if(facing===0) fy+=TILE; else if(facing===1) fy-=TILE; else if(facing===2) fx-=TILE; else fx+=TILE;
    var npcs=z().npcs||[];
    for(var i=0;i<npcs.length;i++){
      var n=npcs[i];
      if(Math.abs(n.x-fx)<12 && Math.abs(n.y-fy)<12){
        if(n.name==='Pack Bar'){
          if(packs>=1){
            packs--;
            var pull = Math.random();
            var msg = '';
            if(pull < 0.03){ etbs++; badges++; msg = 'JACKPOT! ETB + Badge!'; }
else if(pull < 0.08){ etbs++; msg = 'ETB pull!'; }
else if(pull < 0.12){ packs++; msg = 'Bonus pack!'; }
else if(pull < 0.18){ tokens+=8; msg = 'Token burst! +8'; }
else if(pull < 0.25){ berries+=4; msg = 'Berry burst! +4'; }
            else if(pull < 0.15){ berries += 5; msg = 'Big berry pull! +5'; }
            else if(pull < 0.35){ tokens += 6; msg = 'Token pull! +6'; }
            else if(pull < 0.55){ berries += 2; tokens += 2; msg = 'Mixed pull. +2 berries, +2 tokens'; }
            else { berries += 1; msg = 'Common pull. +1 berry'; }
            flash=10; shake=4; startDialog([msg, 'Packs left: '+packs]);
            save();
          } else if(tokens >= 5){
            tokens -= 5;
            packs++;
            startDialog(['Bought a pack for 5 tokens.','Talk again to rip it.']);
            save();
          } else {
            startDialog(['Need a pack or 5 tokens.','You have '+tokens+' tokens.']);
          }
          return;
        }
        if(n.name==='Clerk'){
          if(n.name==='Clerk' && flags.shopExtra){ if(berries>=3){ berries-=3; packs++; etbs++; startDialog(['Bought pack + ETB.']); save(); return; } }
var cost = badges>=1 ? 1 : 2;
if(berries>=cost){ berries-=cost; packs++; startDialog(['SWAP done. Cost '+cost+' berries.']); save(); }
          else startDialog(['Need 2 berries.']);
        } else if(n.name==='Kid' && !flags.kidQuest && berries>=3){ berries-=3; packs++; flags.kidQuest=true; startDialog(['Thanks! Here is a pack.']); unlock('sidequest','Helped the Kid'); save(); }
else if(n.name==='Rock' && !flags.smashRock){ if(party[active].moves && (party[active].moves.indexOf('Rock')>=0 || party[active].moves.indexOf('Sand')>=0)){ flags.smashRock=true; startDialog(['Smashed the rock!']); } else startDialog(['Need Rock or Ground move.']); }
else if(n.name==='Tree' && !flags.cutTree){ if(party[active].moves && party[active].moves.indexOf('Leaf')>=0){ flags.cutTree=true; startDialog(['Used Leaf. Tree cut!']); } else startDialog(['Need a Grass move to cut.']); }
else if(n.name==='Note' && !flags.gotNote){
          flags.gotNote=true; notes++;
          startDialog(['You found the note.','Scalpers meet in the alley.']);
          save();
        } else if(n.name==='Elite' && !flags.beatElite){ startBattle({name:'Elite', team:[{name:'Emberowl',species:'ember',hp:40,atk:12,moves:['Ember']},{name:'Sparkowl',species:'spark',hp:38,atk:13,moves:['Spark']},{name:'Phoenixowl',species:'ember',hp:55,atk:16,moves:['Ember','Bite']}]}, true); }
else if(n.name==='Gym2' && !flags.beatGym2){ startBattle({name:'Gym2', team:[{name:'Frostowl',species:'frost',hp:42,atk:11,moves:['Ice']},{name:'Glacier',species:'frost',hp:50,atk:13,moves:['Ice','Gust']}]}, true); }
else if(n.name==='Gym Leader' && !flags.beatGym){ startBattle({name:'Gym Leader', species:'ember', hp:45, max:45, atk:14, def:6, moves:['Ember','Peck','Tackle']}, true); }
else if(n.name==='Rival'){ startBattle({name:'Rival',hp:35+rivalWins*5,max:35,atk:10+rivalWins,def:4}, true); }
else if(n.name==='Scalper' && flags.canRematch && flags.beatScalper){
startBattle({name:'Scalper',hp:40,max:40,atk:12,def:5}, true);
} else if(n.name==='Scalper' && !flags.beatScalper){
          startBattle({name:'Scalper',hp:30,max:30,atk:9,def:4}, true);
        } else if(n.name==='Lead Scalper' && !flags.beatLead){
          startBattle({name:'Lead Scalper',hp:40,max:40,atk:11,def:5}, true);
        } else startDialog(n.lines);
        return;
      }
    }
    var tx=Math.floor(fx/TILE), ty=Math.floor(fy/TILE);
    if(tileAt(tx,ty)===4 && !flags.hiddenBerry){ flags.hiddenBerry=true; berries+=2; startDialog(['Found hidden berries!']); save(); }
if(tileAt(tx,ty)===5 && !flags.fished){ flags.fished=true; packs++; startDialog(['Fished up a pack!']); save(); }
if(tileAt(tx,ty)===0 && Math.random()<0.02 && !flags.groundItem){ flags.groundItem=true; berries++; startDialog(['Found a berry on the ground.']); }
if(tileAt(tx,ty)===6 && badges>=1){ startDialog(['Cut the obstacle.']); }
if(tileAt(tx,ty)===7 && badges>=2){ startDialog(['Moved the boulder.']); }
if(tileAt(tx,ty)===2){
      if(berries>=1){
        berries--;
        var p=party[active];
        for(var hi=0;hi<party.length;hi++) party[hi].hp=party[hi].max;
p.hp=party[active].hp;
        startDialog(['Used a Berry. HP restored.']);
        beep(520,0.08);
      } else startDialog(['No Berries.']);
    }
  }

  function gainXP(amount){
    var p=party[active];
    p.xp += amount;
    var evo=checkEvo(p); if(evo){ shake=12; flash=15; beep(720,0.2); startDialog([p.name+' evolved into '+evo+'!','HP '+p.max+'  ATK '+p.atk]); }
if(p.xp >= p.lvl*8){ beep(600,0.12);
      p.xp = 0; p.lvl++; p.max+=4; p.hp=p.max; p.atk+=1; p.def+=1;
        var newMove = LEARN[p.lvl];
        if(newMove && (!p.moves || p.moves.indexOf(newMove)<0)){
          if(!p.moves) p.moves=[];
          if(p.moves.length<4) p.moves.push(newMove);
          else p.moves[0]=newMove;
          startDialog([p.name+' learned '+newMove+'!']);
        }
      beep(600,0.12);
      return true;
    }
    return false;
  }

  function startBattle(w, isTrainer){
    trainerTeam = w.team || null;
    trainerIdx = 0;
    flash=20; shake=8;
    inBattle=true; wild=w||randomWild(); battleSel=0; battleLog=[];
seen[wild.name]=true;
    document.getElementById('battleMenu').style.display='block';
    updateBattle();
    startDialog([(isTrainer?'Trainer challenge: ':'A wild ')+wild.name+'!']);
  }
  function updateBattle(){
    var items=document.querySelectorAll('#battleMenu div');
    for(var i=0;i<items.length;i++) items[i].className = i===battleSel ? 'sel' : '';
  }
  function endBattle(win, caught){
    inBattle=false; wild=null;
    document.getElementById('battleMenu').style.display='none';
    if(win){ tokens+=5;
      wins++; if(wins===1) unlock('firstwin','First Victory');
      score += caught ? 20 : 12;
      berries++;
      if(Math.random()<0.35) packs++;
      if(gainXP(caught?6:4)) startDialog(['Level up!']);
    }
    save();
  }
  function battleAction(){
    if(!inBattle||!wild) return;
    if(dialog){ advanceDialog(); return; }
    var acts=['fight','item','swap','catch','run'];
    var a=acts[battleSel];
    var p=party[active];
    if(a==='fight'){
      if(sleepTurns>0){ sleepTurns--; startDialog(['Asleep!']); return; }
if(burnTurns>0){ burnTurns--; var bd=2; party[active].hp=Math.max(1,party[active].hp-bd); battleLog.push('Burn -'+bd); }
if(!pickingMove){ pickingMove=true; moveSel=0; startDialog(['Choose a move.']); return; }
      var moves = p.moves || ['Peck','Gust','Tackle'];
      var move = moves[moveSel % moves.length];
      pickingMove=false;
      var moveData = MOVES[move] || {pwr:30, type:'normal'};
      var atkType = moveData.type;
      var defType = TYPES[wild.species] || 'normal';
      var mult = (EFFECT[atkType] && EFFECT[atkType][defType]) || 1;
      var dmg = Math.max(1, Math.floor((p.atk + moveData.pwr/4) * mult) - Math.floor(wild.def/3));
      var effMsg = mult>1 ? ' Super!' : mult<1 && mult>0 ? ' Weak.' : mult===0 ? ' No effect!' : '';
      battleLog.push(move+'!');
      if(atkType==='fire' && Math.random()<0.25){ burnTurns=3; battleLog.push('Burn!'); }
      if(atkType==='ice' && Math.random()<0.2){ sleepTurns=2; battleLog.push('Frozen!'); }
      windup = 8; attackOffset = 12;
      setTimeout(function(){
        wild.hp -= dmg; shake=6; flash=8; floatText={text:'-'+dmg, x:120, y:40, life:20};
        beep(280,0.07);
      }, 200);
      shake=6; beep(280,0.07);
      battleLog.push('You hit for '+dmg+effMsg); shake=4;
      if(wild.hp<=0){
        if(trainerTeam && trainerIdx < trainerTeam.length-1){
          trainerIdx++;
          var next = trainerTeam[trainerIdx];
          wild = {name:next.name, species:next.species, hp:next.hp, max:next.hp, atk:next.atk, def:next.def||4, moves:next.moves||['Peck']};
          startDialog([wild.name+' is next!']);
          return;
        }
        if(wild.name==='Elite'){ flags.beatElite=true; badges++; unlock('elite','Elite Badge'); }
if(wild.name==='Gym2'){ flags.beatGym2=true; badges++; unlock('gym2','Ice Badge'); }
if(wild.name==='Gym Leader'){ flags.beatGym=true; badges++; unlock('gym','Gym Badge'); }
if(wild.name==='Scalper'){ flags.beatScalper=true; badges++; party[active].atk+=1; unlock('badge1','First Badge'); flags.canRematch=true; }
        if(wild.name==='Lead Scalper'){ flags.beatLead=true; badges++; if(!ngPlus){ ngPlus=true; startDialog(['New Game+ unlocked!']); } }
if(wild.name==='Rival'){ rivalWins++; unlock('rival','Beat Rival'); }
        startDialog(['You won!']); endBattle(true,false); return;
      }
      if(burnTurns>0){ wild.hp=Math.max(1,wild.hp-2); burnTurns--; battleLog.push('Burn damage!'); }
if(sleepTurns>0){ sleepTurns--; startDialog(['Enemy is frozen!']); return; }
var back = Math.max(1, wild.atk - Math.floor(p.def/3));
      p.hp -= back; shake=4;
      battleLog.push('Took '+back);
      if(p.hp<=0){ p.hp=1; startDialog(['Your Owlie is tired.']); endBattle(false,false); return; }
if(p.hp < p.max*0.3){ beep(200,0.1); if(p.held==='Berry'){ p.hp=Math.min(p.max,p.hp+10); p.held=null; battleLog.push('Held Berry!'); }
        else if(p.held==='Focus'){ p.atk+=2; p.held=null; battleLog.push('Focus boost!'); }
        else if(p.held==='Shield'){ p.def+=2; p.held=null; battleLog.push('Shield up!'); } }
      startDialog(['Hit for '+dmg+'!','Enemy hit for '+back+'.']);
    } else if(a==='item'){
if(berries>=1 && p.hp<p.max){ berries--; p.hp=Math.min(p.max, p.hp+15); startDialog(['Berry used. +15 HP']); return; }
if(packs>=1 && burnTurns>0){ packs--; burnTurns=0; startDialog(['Pack cleared burn.']); return; }
      if(berries>=1 && p.hp<p.max){ berries--; p.hp=Math.min(p.max, p.hp+12); startDialog(['Berry used.']); beep(500,0.06); }
      else if(packs>=1){ packs--; berries+=2; startDialog(['Opened pack. Got berries.']); }
      else startDialog(['Nothing useful.']);
    } else if(a==='swap'){
      if(party.length>1){ active=(active+1)%party.length; startDialog(['Lead is now '+party[active].name+'.']); }
      else startDialog(['Only one Owlie.']);
    } else if(a==='catch'){
      if(wild.name.indexOf('Scalper')>=0 || wild.name==='Rival'){ startDialog(['Cannot catch trainers.']); return; }
var odds = Math.round((0.25 + (1 - wild.hp/wild.max)*0.55)*100);
      var chance = 0.2 + (1 - wild.hp/wild.max)*0.5 + (burnTurns>0||sleepTurns>0?0.2:0);
      var shakes = Math.random() < chance ? 3 : Math.floor(Math.random()*3);
      var msgs = [];
      ballAnim = {x:40, y:70, life:30, shakes:shakes};
      for(var s=0; s<shakes; s++){ msgs.push('...'); shake=3; }
flash=6;
      if(shakes===3 && party.length<5){
        var isShiny = Math.random()<shinyOdds;
        party.push({name:wild.name, species:wild.species, stage:wild.stage||0, hp:Math.max(1,wild.hp), max:wild.max, atk:wild.atk, def:wild.def||3, lvl:4, xp:0, moves:wild.moves||['Peck','Gust','Tackle'], shiny:isShiny, held:null, color:wild.color});
        if(isShiny) msgs.push('Shiny!');
        msgs.unshift(odds+'% chance');
msgs.push('Got it!');
        unlock('firstcatch','First Catch');
        beep(700,0.15);
        startDialog(msgs);
        endBattle(true,true);
      } else {
        msgs.push('Broke free!');
        beep(300,0.1);
        startDialog(msgs);
      }
    } else {
      var runChance = 0.5 + (p.lvl*0.02);
      if(Math.random()<runChance){ startDialog(['Got away!']); endBattle(false,false); }
      else startDialog(['Could not run!']);
    }
  }

  function drawBar(x,y,w,h,cur,max,col){
    ctx.fillStyle='#000'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle=col; ctx.fillRect(x+1,y+1, Math.max(0, (w-2)*(cur/max)), h-2);
  }

  function drawSprite(x,y,body,eyes,stage,species){
    var key = species || 'hootling';
    if(key==='owlie') key='owlie_trainer';
    var img = sprites[key];
    if(img && img.complete && img.naturalWidth){
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, x, y, TILE, TILE);
    } else {
      ctx.fillStyle=body||'#3050b0';
      ctx.fillRect(x+4,y+1,7,5);
      ctx.fillRect(x+4,y+5,7,6);
      ctx.fillRect(x+3,y+10,3,5);
      ctx.fillRect(x+9,y+10,3,5);
    }
  }

  function drawBg(w,h){
    var z = zone || 'plaza';
    if(z==='shop'){
      ctx.fillStyle=dayPhase?'#4a4030':'#c8b8a0'; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#a09080'; ctx.fillRect(0,h*0.7,w,h*0.3);
      ctx.fillStyle='#fff'; ctx.fillRect(10,10,30,20); ctx.fillRect(50,10,30,20);
    } else if(z==='forest'){
      ctx.fillStyle=dayPhase?'#0a1a0a':'#2a4a2a'; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#1a3a1a'; ctx.fillRect(0,h*0.6,w,h*0.4);
      ctx.fillStyle='#0a2a0a'; ctx.fillRect(20,20,8,30); ctx.fillRect(100,15,8,35);
    } else if(z==='rooftop'){
      ctx.fillStyle=dayPhase?'#0a0a20':'#6ab0e0'; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#555'; ctx.fillRect(0,h*0.75,w,h*0.25);
      ctx.fillStyle='#fff'; if(!dayPhase) ctx.fillRect(30,15,2,2);
    } else if(z==='alley'){
      ctx.fillStyle=dayPhase?'#1a1a1a':'#3a3a3a'; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#2a2a2a'; ctx.fillRect(0,h*0.65,w,h*0.35);
      ctx.fillStyle='#555'; ctx.fillRect(10,30,6,40); ctx.fillRect(120,25,6,45);
    } else {
      // plaza / route
      ctx.fillStyle = dayPhase ? '#1a1a3a' : '#87ceeb';
      ctx.fillRect(0,0,w,h*0.6);
      ctx.fillStyle = dayPhase ? '#1a2a1a' : '#88c070';
      ctx.fillRect(0,h*0.6,w,h*0.4);
      if(!dayPhase){ ctx.fillStyle='#fff'; ctx.fillRect(20,12,16,6); ctx.fillRect(80,20,12,4); }
      else { ctx.fillStyle='#fff'; ctx.fillRect(30,15,2,2); ctx.fillRect(90,25,2,2); }
    }
  }
  function drawMiniMap(){
    var mm = document.getElementById('miniMap');
    if(!mm) return;
    var mctx = mm.getContext('2d');
    var m = z().map;
    if(!m) return;
    var mw = m[0].length, mh = m.length;
    var cell = Math.min(64/mw, 48/mh);
    mctx.fillStyle='#000'; mctx.fillRect(0,0,64,48);
    for(var y=0; y<mh; y++){
      for(var x=0; x<mw; x++){
        var t = m[y][x];
        mctx.fillStyle = t===1?'#444':t===2?'#6a6':t===3?'#484':'#222';
        mctx.fillRect(x*cell, y*cell, cell, cell);
      }
    }
    // player
    var pxm = Math.floor(px/TILE), pym = Math.floor(py/TILE);
    mctx.fillStyle='#ff0';
    mctx.fillRect(pxm*cell, pym*cell, cell, cell);
  }
  function draw(){
    var w=canvas.width, h=canvas.height;
    drawBg(w,h);
    ctx.save();
    if(shake>0){ ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake); shake--; }
    if(dayPhase){ ctx.fillStyle='rgba(5,5,30,0.55)'; ctx.fillRect(0,0,w,h); }
if(fadeAlpha>0){ ctx.fillStyle='rgba(0,0,0,'+fadeAlpha+')'; ctx.fillRect(0,0,w,h); fadeAlpha=Math.max(0,fadeAlpha-0.05); }
    if(flash>0){ ctx.fillStyle='rgba(255,255,255,'+(flash/15)+')'; ctx.fillRect(0,0,w,h); flash--; }
    if(floatText){ ctx.fillStyle='#ff0'; ctx.font='10px monospace'; ctx.fillText(floatText.text, floatText.x, floatText.y); floatText.y-=1; floatText.life--; if(floatText.life<=0) floatText=null; }
    if(windup>0){ ctx.fillStyle='#fff'; ctx.fillRect(20, 70, 8, 4); windup--; }
if(attackOffset>0) attackOffset = Math.max(0, attackOffset-2);
    if(ballAnim){ ctx.fillStyle='#e44'; ctx.beginPath(); ctx.arc(ballAnim.x, ballAnim.y, 5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(ballAnim.x-5, ballAnim.y-1, 10, 2); ballAnim.y-=0.5; ballAnim.life--; if(ballAnim.life<=0) ballAnim=null; }
if(weather){ ctx.fillStyle='rgba(100,100,200,0.15)'; ctx.fillRect(0,0,w,h); }
    var zm=z();
    var ox=Math.floor((w - zm.w*TILE)/2);
    var oy=Math.floor((h - zm.h*TILE)/2);
    var colors={0:'#70c060',1:'#1a5030',2:'#d06030',3:'#48a048',4:'#b09050',5:'#5070b0',6:'#909090',7:'#c0c0c0'};
    for(var y=0;y<zm.h;y++){
      for(var x=0;x<zm.w;x++){
        var t=zm.map[y][x];
        ctx.fillStyle=colors[t]||'#70c060';
        ctx.fillRect(ox+x*TILE, oy+y*TILE, TILE, TILE);
        if(t===3){ ctx.fillStyle='#206020'; ctx.fillRect(ox+x*TILE+2, oy+y*TILE+2, 4, 4); }
      }
    }
    var npcs=zm.npcs||[];
    for(var i=0;i<npcs.length;i++){
      var n=npcs[i];
      var col = n.name.indexOf('Scalper')>=0 ? '#c03030' : n.name==='Clerk'||n.name==='Shopkeeper' ? '#f0c080' : n.name==='Note' ? '#e0e080' : '#c0b090';
      drawSprite(ox+n.x, oy+n.y, col, n.name!=='Note', 0, n.name==='Clerk'||n.name==='Shopkeeper'?'owlie_trainer':'hootling');
    }
    drawSprite(ox+px, oy+py, (party[active]&&party[active].color)||'#3050b0', true, party[active]&&party[active].stage, (party[active]&&party[active].species)||'hootling');

    if(inBattle && wild){
      ctx.fillStyle='#000d'; ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#fff'; ctx.font='9px monospace';
      ctx.fillText(wild.name, 90, 18);
      drawBar(90,22,60,6, Math.max(0,wild.hp), wild.max, '#e04040');
      ctx.fillText(party[active].name+' Lv'+party[active].lvl, 8, 100);
      drawBar(8,104,70,6, party[active].hp, party[active].max, '#40c040');
      drawSprite(110, 36, wild.color||'#c05040', true, wild.stage, wild.species||'hootling');
      drawSprite(16+attackOffset, 60, (party[active]&&party[active].color)||'#3050b0', true, party[active]&&party[active].stage, (party[active]&&party[active].species)||'hootling');
      if(pickingMove){
      var ms = party[active].moves || ['Peck','Gust','Tackle'];
      var hints = {Peck:'normal', Gust:'strong', Tackle:'steady'};
      for(var mi=0; mi<ms.length; mi++){
        ctx.fillStyle = mi===moveSel ? '#ff0' : '#ccc';
        ctx.fillText((mi===moveSel?'> ':'  ')+ms[mi]+' ('+(hints[ms[mi]]||'')+')', 8, 108+mi*12);
      }
    }
if(battleLog.length){ ctx.fillStyle='#fff'; ctx.font='8px monospace'; var last=battleLog.slice(-2); for(var bi=0;bi<last.length;bi++) ctx.fillText(last[bi], 4, 130+bi*8); }
if(false){
        ctx.fillText(battleLog[battleLog.length-1], 8, 130);
      }
    }
    if(fade>0){ ctx.fillStyle='rgba(0,0,0,'+(fade/10)+')'; ctx.fillRect(0,0,w,h); }
    ctx.restore();

    var qmark = !flags.gotNote?' →Note':!flags.beatScalper?' →Scalper':!flags.kidQuest?' →Kid':'';
var hud = zone.toUpperCase()+(dayPhase?' · NIGHT':'')+' · '+score+' pts · '+badges+' badges'+qmark;
    if(notes) hud += ' N'+notes;
    document.getElementById('hud').textContent = hud;
    drawMiniMap();
    var qt = document.getElementById('questTracker');
    if(qt){
      var qh = [];
      qh.push(flags.gotNote ? '<span class="done">Note ✓</span>' : 'Find Note');
      qh.push(flags.beatScalper ? '<span class="done">Scalper ✓</span>' : 'Beat Scalper');
      qh.push(flags.kidQuest ? '<span class="done">Kid ✓</span>' : 'Help Kid');
      qt.innerHTML = qh.join('<br>');
    }
    var rb = document.getElementById('resBerries'); if(rb) rb.textContent = 'B '+berries;
    var rp = document.getElementById('resPacks'); if(rp) rp.textContent = 'P '+packs;
    var rt = document.getElementById('resTokens'); if(rt) rt.textContent = 'T '+tokens;
    var bs = document.getElementById('battleStatus');
    if(bs){ if(inBattle && wild){ bs.style.display='block'; bs.textContent = wild.name+' '+wild.hp+'/'+wild.max; } else bs.style.display='none'; }
    if(zoneTimer>0){ zoneTimer--; if(zoneTimer<=0) document.getElementById('zoneFlash').style.display='none'; }
    requestAnimationFrame(draw);
  }

  function resize(){
    var vw=window.innerWidth, vh=window.innerHeight;
    var sx=Math.floor(vw/canvas.width), sy=Math.floor(vh/canvas.height);
    scale=Math.max(1, Math.min(sx,sy));
    canvas.style.width=(canvas.width*scale)+'px';
    canvas.style.height=(canvas.height*scale)+'px';
  }
  window.addEventListener('resize', resize); resize();

  window.addEventListener('keydown', function(e){
    keys[e.key]=true;
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); interact(); }
    if(e.key==='Escape'||e.key==='m'){ if(menuOpen) closeMenu(); else if(!inBattle) openMenu(); }
    if(e.key==='n'){ mute=!mute; startDialog([mute?'Muted.':'Sound on.']); }
    if(menuOpen){
      if(e.key==='ArrowUp'){ menuSel=(menuSel+13)%14; updateMenu(); }
      if(e.key==='ArrowDown'){ menuSel=(menuSel+1)%14; updateMenu(); }
    }
    if(inBattle){
      if(e.key==='ArrowUp'){ battleSel=(battleSel+4)%5; updateBattle(); }
      if(e.key==='ArrowDown'){ battleSel=(battleSel+1)%5; updateBattle(); }
    }
  });
  window.addEventListener('keyup', function(e){ keys[e.key]=false; });

  function loop(){
    if(keys['ArrowLeft']||keys['a']) tryMove(-4,0);
    if(keys['ArrowRight']||keys['d']) tryMove(4,0);
    if(keys['ArrowUp']||keys['w']) tryMove(0,-4);
    if(keys['ArrowDown']||keys['s']) tryMove(0,4);
    if(touchDir==='left') tryMove(-4,0);
    if(touchDir==='right') tryMove(4,0);
    if(touchDir==='up') tryMove(0,-4);
    if(touchDir==='down') tryMove(0,4);
    setTimeout(loop, 65);
  }
  loop();

  var dpad=document.querySelectorAll('#dpad button');
  for(var i=0;i<dpad.length;i++){
    (function(btn){
      var dir=btn.getAttribute('data-dir');
      btn.addEventListener('touchstart', function(e){ e.preventDefault(); touchDir=dir; }, {passive:false});
      btn.addEventListener('touchend', function(e){ e.preventDefault(); touchDir=null; }, {passive:false});
      btn.addEventListener('mousedown', function(){ touchDir=dir; });
      btn.addEventListener('mouseup', function(){ touchDir=null; });
      btn.addEventListener('mouseleave', function(){ touchDir=null; });
    })(dpad[i]);
  }
  document.getElementById('btnA').addEventListener('click', interact);
  document.getElementById('btnA').addEventListener('touchstart', function(e){ e.preventDefault(); interact(); }, {passive:false});
  document.getElementById('btnB').addEventListener('click', function(){
    if(dialog) advanceDialog();
    else if(menuOpen) closeMenu();
    else if(inBattle){ battleSel=3; updateBattle(); battleAction(); }
  });
  document.getElementById('btnStart').addEventListener('click', function(){
    if(inBattle) return;
    if(menuOpen) closeMenu(); else openMenu();
  });
  document.getElementById('dialog').addEventListener('click', advanceDialog);
  document.getElementById('dialog').addEventListener('touchstart', function(e){ e.preventDefault(); advanceDialog(); }, {passive:false});

  var mItems=document.querySelectorAll('#menu div');
  for(var j=0;j<mItems.length;j++){
    (function(el,idx){ el.addEventListener('click', function(){ menuSel=idx; updateMenu(); menuAction(); }); })(mItems[j],j);
  }
  var bItems=document.querySelectorAll('#battleMenu div');
  for(var k=0;k<bItems.length;k++){
    (function(el,idx){ el.addEventListener('click', function(){ battleSel=idx; updateBattle(); battleAction(); }); })(bItems[k],k);
  }

  setInterval(function(){ playTime++; dayPhase = Math.floor(playTime/120)%2; if(playTime%30===0) weather = weather?0:1; }, 1000);
setInterval(function(){
    if(dialog||menuOpen||inBattle) return;
    var tx=Math.floor(px/TILE), ty=Math.floor(py/TILE);
    if(tileAt(tx,ty)===3){
      grassTicks++;
      if(grassTicks>4 && Math.random()<0.18){ grassTicks=0; startBattle(); }
    } else grassTicks=0;
  }, 320);

  if(navigator.vibrate){
    var oldInteract = interact;
    // light haptic on A press already handled by button; optional
  }

  
  // ohhRIPZ account integration
  window.resetToTitle = function(){
    px=4*TILE; py=4*TILE; zone='plaza';
    startDialog(['Welcome to RIPZ Raiders. TAKE YOUR SHOT!']);
  };
  window.onAccountChange = function(user){
    if(user && window.RIPZ_ACCOUNT){
      window.RIPZ_ACCOUNT.loadProgress().then(function(data){
        if(data) loadSave(data);
      });
    }
  };
  var _origSave = save;
  save = function(){
    _origSave();
    if(window.RIPZ_ACCOUNT && window.RIPZ_ACCOUNT.signedIn){
      window.RIPZ_ACCOUNT.saveProgress(getSave());
      window.RIPZ_ACCOUNT.submitScore(score, badges);
    }
  };

  draw();
})();
