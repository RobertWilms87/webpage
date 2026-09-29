(function(){'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const M=window.ECOMath, NS='http://www.w3.org/2000/svg';
document.documentElement.classList.add('js');document.body.classList.add('js');
const bundle=document.body.dataset.bundle==='true';
let currentView=document.body.dataset.page||'home',toastTimer;
function toast(text){const el=$('#toast');el.textContent=text;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,2400);}
// The colour scheme follows prefers-color-scheme in CSS, including live changes.
// No saved website preference overrides the browser's setting.
$('.menu-toggle').addEventListener('click',()=>{const open=$('#main-nav').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));});
$$('#main-nav a').forEach(a=>a.addEventListener('click',()=>{$('#main-nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');}));

/* One random lab connection per home-page visit; links also work without JavaScript. */
const connections=$$('[data-connection]');
function chooseConnection(){
 if(!connections.length)return;
 const chosen=Math.floor(Math.random()*connections.length);
 connections.forEach((connection,index)=>connection.hidden=index!==chosen);
}
chooseConnection();

/* Tabs preserve real page URLs; only the portable companion uses hash routes. */
const groups=new Map();
function activate(group,id){const entry=groups.get(group);if(!entry)return;entry.buttons.forEach(b=>{const yes=b.dataset.panel===id;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});entry.panels.forEach(p=>p.hidden=p.id!==id);}
function goHash(id){window.location.hash=bundle?currentView+'/'+id:id;}
$$('[data-tabs]').forEach(bar=>{const group=bar.dataset.tabs,buttons=Array.from(bar.querySelectorAll('button')),panels=$$('[data-tab-group="'+group+'"]');groups.set(group,{buttons,panels});bar.setAttribute('role','tablist');buttons.forEach((b,i)=>{b.setAttribute('role','tab');b.setAttribute('aria-controls',b.dataset.panel);const panel=$('#'+b.dataset.panel);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);b.addEventListener('click',()=>{activate(group,b.dataset.panel);goHash(b.dataset.panel);});b.addEventListener('keydown',e=>{let j=i;if(e.key==='ArrowRight')j=(i+1)%buttons.length;else if(e.key==='ArrowLeft')j=(i+buttons.length-1)%buttons.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=buttons.length-1;else return;e.preventDefault();buttons[j].focus();activate(group,buttons[j].dataset.panel);goHash(buttons[j].dataset.panel);});});activate(group,buttons[0].dataset.panel);});

/* Publication search, pagination and direct links to individual papers. */
let revealPaper=()=>{};
if($('#paper-list')){
 const papers=$$('.paper');let pageSize=5,compact=false,pageIndex=0,filtered=[];
 function filter(reset=true){if(reset)pageIndex=0;pageSize=compact?papers.length:5;$('#paper-list').classList.toggle('compact',compact);$('#papers-compact').setAttribute('aria-pressed',String(compact));$('#papers-detailed').setAttribute('aria-pressed',String(!compact));$('.pagination').hidden=compact;const term=$('#paper-search').value.toLocaleLowerCase().trim(),kind=$('#paper-kind').value,topic=$('#paper-topic').value;
 filtered=papers.filter(p=>(kind==='all'||p.dataset.kind===kind)&&(topic==='all'||p.dataset.topic===topic)&&p.textContent.toLocaleLowerCase().includes(term));
 filtered.sort((a,b)=>$('#paper-sort').value==='oldest'?Number(a.dataset.year)-Number(b.dataset.year)||Number(b.dataset.order)-Number(a.dataset.order):Number(a.dataset.order)-Number(b.dataset.order));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));pageIndex=Math.min(pageIndex,pages-1);papers.forEach(p=>p.hidden=true);filtered.forEach((p,i)=>{$('#paper-list').appendChild(p);p.hidden=i<pageIndex*pageSize||i>=(pageIndex+1)*pageSize;});
 $('#paper-count').textContent=filtered.length+' of '+papers.length+' works'+(filtered.length?' · showing '+(pageIndex*pageSize+1)+'–'+Math.min(filtered.length,(pageIndex+1)*pageSize):'');$('#paper-empty').hidden=filtered.length>0;$('#papers-page').textContent='Page '+(pageIndex+1)+' / '+pages;$('#papers-prev').disabled=pageIndex===0;$('#papers-next').disabled=pageIndex>=pages-1;
 }
 function reset(){ $('#paper-search').value='';$('#paper-kind').value='all';$('#paper-topic').value='all';$('#paper-sort').value='newest';filter();}
 $('#paper-search').addEventListener('input',()=>filter());['paper-kind','paper-topic','paper-sort'].forEach(id=>$('#'+id).addEventListener('change',()=>filter()));$('#paper-reset').addEventListener('click',reset);
 $('#papers-prev').addEventListener('click',()=>{pageIndex--;filter(false);$('#research-papers').scrollIntoView({block:'start'});});$('#papers-next').addEventListener('click',()=>{pageIndex++;filter(false);$('#research-papers').scrollIntoView({block:'start'});});
 $('#papers-compact').addEventListener('click',()=>{compact=true;filter();});$('#papers-detailed').addEventListener('click',()=>{compact=false;filter();});
 $$('[data-expand-paper]').forEach(b=>b.addEventListener('click',()=>{compact=false;revealPaper('paper-'+b.dataset.expandPaper);$('#paper-'+b.dataset.expandPaper).scrollIntoView({block:'start'});}));
 revealPaper=id=>{compact=false;const p=papers.find(x=>x.id===id);if(!p)return;reset();pageIndex=Math.floor(filtered.indexOf(p)/pageSize);filter(false);activate('research','research-papers');const details=p.querySelector('details');if(details)details.open=true;};filter();
}
function route(){let hash=decodeURIComponent(window.location.hash.slice(1)),id=hash;
 if(bundle){const parts=hash.split('/'),candidate=parts.shift()||'home',views=$$('[data-view]'),active=views.find(p=>p.dataset.view===candidate)||views.find(p=>p.dataset.view==='home');if(active.dataset.view==='home'&&currentView!=='home')chooseConnection();currentView=active.dataset.view;id=parts.join('/');views.forEach(p=>p.hidden=p!==active);$$('[data-nav]').forEach(a=>{if(a.dataset.nav===active.dataset.navGroup)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});$('.skip').href='#'+currentView+'/main-'+currentView;document.title=active.dataset.viewTitle;}
 const target=id?document.getElementById(id):null;
 const paper=target?.closest('.paper');if(paper)revealPaper(paper.id);
 if(target){let detail=target.closest('details');while(detail){detail.open=true;detail=detail.parentElement?.closest('details');}}
 if(target){let panel=target.closest('[data-tab-group]');while(panel){activate(panel.dataset.tabGroup,panel.id);panel=panel.parentElement?.closest('[data-tab-group]');}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
 else if(bundle)window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',route);

/* Comic reader: enlarge only on request; the surrounding page stays compact. */
const reader=$('#comic-reader');let comicOpener;
$$('[data-comic]').forEach(a=>a.addEventListener('click',e=>{if(typeof reader.showModal!=='function'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();comicOpener=a;$('#reader-title').textContent=a.dataset.title;$('#reader-image').src=a.href;$('#reader-image').alt=a.dataset.title;$('#reader-original').href=a.href;$('#reader-transcript').textContent=a.dataset.transcript;$('#reader-canvas').classList.remove('zoomed');reader.classList.remove('reader-wide');$('#reader-zoom').setAttribute('aria-pressed','false');$('#reader-zoom').textContent='Zoom in';reader.showModal();reader.scrollTop=0;$('#reader-canvas').scrollTop=0;$('#reader-canvas').scrollLeft=0;document.body.classList.add('dialog-open');}));
$('#reader-close').addEventListener('click',()=>reader.close());reader.addEventListener('close',()=>{document.body.classList.remove('dialog-open');comicOpener?.focus();});
$('#reader-zoom').addEventListener('click',()=>{const zoom=$('#reader-canvas').classList.toggle('zoomed');$('#reader-zoom').setAttribute('aria-pressed',String(zoom));reader.classList.toggle('reader-wide',zoom);$('#reader-zoom').textContent=zoom?'Fit whole comic':'Zoom in';$('#reader-canvas').scrollLeft=0;$('#reader-canvas').scrollTop=0;});
$$('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{if(!navigator.clipboard||!window.isSecureContext)throw Error('fallback');await navigator.clipboard.writeText(b.dataset.copy);toast('Citation copied');}catch{$('#copy-text').value=b.dataset.copy;$('#copy-dialog').showModal();$('#copy-text').focus();$('#copy-text').select();}}));$('#copy-close').addEventListener('click',()=>$('#copy-dialog').close());

/* Existing local course documents. */
if($('#sheet-select')){const select=$('#sheet-select'),original=$('#sheet-exercises').getAttribute('href'),base=original.slice(0,original.lastIndexOf('/')+1);
 const update=()=>{const bonus=select.value==='bonus',n=select.value.padStart(2,'0');$('#sheet-exercises').href=base+(bonus?'bonusblatt.pdf':'blatt'+n+'.pdf');$('#sheet-exercises').textContent=bonus?'Bonus exercises ↓':'Exercises '+n+' ↓';$('#sheet-solutions').href=base+'loesung'+n+'.pdf';$('#sheet-solutions').textContent='Solutions '+n+' ↓';$('#sheet-solutions').hidden=bonus;$('#sheet-bonus-note').hidden=!bonus;$('#sheet-prev').disabled=select.selectedIndex===0;$('#sheet-next').disabled=select.selectedIndex===select.options.length-1;};select.addEventListener('change',update);$('#sheet-prev').addEventListener('click',()=>{select.selectedIndex--;update();});$('#sheet-next').addEventListener('click',()=>{select.selectedIndex++;update();});update();}

function svgNode(tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=String(text);return el;}
function add(parent,tag,attrs,text){const el=svgNode(tag,attrs,text);parent.appendChild(el);return el;}
function clear(svg,title){svg.replaceChildren();add(svg,'title',{},title);}
function monomialPlot(svg,n,normalized,interactive=false,wx=1,wy=1){
 const description='Monomials with '+wx+'i + '+wy+'j ≤ '+n+(normalized?', exponent coordinates divided by n':'');
 clear(svg,description);svg.setAttribute('aria-label',description);
 const extent=Math.max(1,Math.ceil(n/Math.min(wx,wy))),left=60,bottom=420,spacing=355/extent,dense=extent>8;
 const X=i=>left+i*spacing,Y=j=>bottom-j*spacing;
 svg.classList.toggle('dense-monomials',dense);
 $('#monomial-label-hint').textContent=dense?'All monomials are plotted. Hover, focus or select a point to read its name; every name is also included in the CSV export.':'Monomial names are shown beside the points. Select one to inspect its weighted degree.';
 add(svg,'path',{d:`M${left},${bottom}L${X(n/wx)},${bottom}L${left},${Y(n/wy)}Z`,class:'region'});
 const tickStep=extent<=10?1:extent<=20?2:5;
 const tickLabel=t=>{if(!normalized)return t;if(t===0)return '0';const d=M.gcd(t,n);return n/d===1?String(t/d):(t/d)+'/'+(n/d);};
 for(let t=0;t<=extent;t++){
  const x=X(t),y=Y(t);
  add(svg,'line',{x1:x,y1:bottom,x2:x,y2:65,class:'grid-line'});add(svg,'line',{x1:left,y1:y,x2:415,y2:y,class:'grid-line'});
  if(t%tickStep===0||t===extent){add(svg,'text',{x,y:447,'text-anchor':'middle',class:'svg-small'},tickLabel(t));if(t)add(svg,'text',{x:43,y:y+4,'text-anchor':'end',class:'svg-small'},tickLabel(t));}
 }
 if($('#show-integer-hull').checked){
  const hull=M.ecoGeometry(n,wx,wy).hull;
  if(hull.length>1)add(svg,'path',{d:hull.map((p,i)=>(i?'L':'M')+X(p.i)+','+Y(p.j)).join(' ')+(hull.length>2?'Z':''),class:'integer-hull'});
  else add(svg,'circle',{cx:X(0),cy:Y(0),r:8,class:'integer-hull'});
 }
 add(svg,'line',{x1:left,y1:bottom,x2:448,y2:bottom,class:'axis'});add(svg,'line',{x1:left,y1:bottom,x2:left,y2:40,class:'axis'});add(svg,'text',{x:465,y:425,class:'svg-label'},normalized?'i / n':'exponent i');add(svg,'text',{x:30,y:25,class:'svg-label'},normalized?'j / n':'exponent j');
 add(svg,'text',{x:445,y:150,class:'svg-small'},'Weights ('+wx+', '+wy+')');
 M.monomials(n,wx,wy).forEach(({i,j})=>{
  const name=M.monomial(i,j),degree=wx*i+wy*j,hit=Math.min(42,spacing*.86);
  const g=add(svg,'g',{class:interactive?'monomial':'','data-i':i,'data-j':j,...(interactive?{tabindex:0,role:'button','aria-label':name+', weighted degree '+degree}:{})});
  add(g,'title',{},name+' · weighted degree '+degree+' · ECO value '+Math.max(1,degree));
  add(g,'rect',{x:X(i)-hit/2,y:Y(j)-hit/2,width:hit,height:hit,fill:'transparent',rx:3,class:'hit'});
  add(g,'circle',{cx:X(i),cy:Y(j),r:Math.min(4,spacing*.24),class:'point'});
  add(g,'text',{x:X(i)+7,y:Y(j)-9,class:'svg-label monomial-name','font-size':extent>5?15:18},name);
  if(interactive){
   const select=()=>{svg.querySelectorAll('.monomial-chosen').forEach(p=>p.classList.remove('monomial-chosen'));g.classList.add('monomial-chosen');$('#monomial-selected').textContent=name+' has weighted degree '+wx+' × '+i+' + '+wy+' × '+j+' = '+degree+' and ECO value '+Math.max(1,degree)+'. It belongs to (γw)≤'+n+'.';};
   g.addEventListener('click',select);g.addEventListener('focus',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
  }
 });
}
function geometryComparison(s){
 const F=M.fraction;
 $('#geometry-comparison-caption').textContent='Weights ('+s.wx+', '+s.wy+'), n = '+s.n+'. Every quantity is divided by n² = '+s.n*s.n+'.';
 for(const [id,raw,num,den] of [['area',F(s.areaNumerator,s.areaDenominator),1,s.areaDenominator],['points',s.count,s.count,s.n*s.n],['intersection',s.intersection,s.intersection,s.n*s.n]]){
  $('#geo-'+id).textContent=raw;$('#geo-'+id+'-normalized').textContent=F(num,den);$('#geo-'+id+'-decimal').textContent='≈ '+(num/den).toFixed(6);
 }
 $('#geo-hull-summary').textContent='The lattice polygon has area '+F(s.intersection,2)+', so the exact intersection maximum is Mₙ = '+s.intersection+'. '+(s.intersection===0?'At this bound every finite quotient is zero.':s.n%s.wx===0&&s.n%s.wy===0?'Here the triangle already has integer vertices.':'The lattice polygon is smaller than the continuous triangle.');
 $('#geo-limit-summary').textContent='For weights ('+s.wx+', '+s.wy+'): Aₙ/n² = '+F(1,s.areaDenominator)+', Nₙ/n² → '+F(1,s.areaDenominator)+', and Mₙ/n² → '+F(1,s.wx*s.wy)+'.';
}
if($('#degree')){
 const update=()=>{
  const n=Number($('#degree').value),wx=Number($('#weight-x').value),wy=Number($('#weight-y').value),expression=(wx===1?'i':wx+'i')+' + '+(wy===1?'j':wy+'j');
  $('#degree-value').textContent=n;$('#weight-x-value').textContent=wx;$('#weight-y-value').textContent=wy;
  $('#monomial-count').textContent=M.monomials(n,wx,wy).length;
  $('#weighted-rule').textContent='Current monomial condition: '+expression+' ≤ '+n+'.';
  $('#weighted-body').textContent=(wx===1?'u':wx+'u')+' + '+(wy===1?'v':wy+'v')+' ≤ 1; area = 1/'+(2*wx*wy)+'.';
  $$('[data-weight-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.weightPreset===wx+','+wy)));
  monomialPlot($('#monomial-svg'),n,$('#normalize').checked,true,wx,wy);
  geometryComparison(M.ecoGeometry(n,wx,wy));
  $('#monomial-selected').textContent='Select a monomial to inspect its weighted degree.';
 };
 ['degree','weight-x','weight-y'].forEach(id=>{['input','change'].forEach(event=>$('#'+id).addEventListener(event,update));});
 $('#normalize').addEventListener('change',update);
 $('#show-integer-hull').addEventListener('change',update);
 $$('[data-weight-preset]').forEach(b=>b.addEventListener('click',()=>{const [wx,wy]=b.dataset.weightPreset.split(',');$('#weight-x').value=wx;$('#weight-y').value=wy;update();}));
 update();
}

if($('#height-bound-range')){
 const range=$('#height-bound-range'),number=$('#height-bound-number'),svg=$('#rational-svg');
 let bound=2.7,cachedB=-1,points=[],visible=[];
 const selected=()=>{const a=$('#rational-a'),b=$('#rational-b');if(a.value===''||b.value==='')return null;const aa=Number(a.value),bb=Number(b.value);return Number.isInteger(aa)&&Number.isInteger(bb)&&Math.abs(aa)<=1000&&bb>=1&&bb<=1000?M.rational(aa,bb):null;};
 function update(){
  const B=Math.floor(Math.exp(bound));if(B!==cachedB){points=M.rationalPoints(B);cachedB=B;}
  const mode=$('#rational-window').value,lo=mode==='unit'?0:mode==='central'?-2:-B,hi=mode==='unit'?1:mode==='central'?2:B;
  visible=points.filter(p=>p.value>=lo&&p.value<=hi);
  range.value=bound;number.value=bound;$('#height-budget-status').textContent='n = '+bound.toFixed(1)+' · B = ⌊eⁿ⌋ = '+B;
  $('#height-decrease').disabled=bound<=1;$('#height-increase').disabled=bound>=4;$('#rational-count').textContent=points.length.toLocaleString('en');
  $('#visible-rational-count').textContent=visible.length+' of '+points.length+' points shown';
  const height=Math.max(480,Math.min(1080,160+B*22)),top=62,bottom=height-90,X=value=>88+584*(value-lo)/(hi-lo),Y=b=>bottom-(b-1)/(B-1)*(bottom-top);
  svg.setAttribute('viewBox','0 0 720 '+height);
  clear(svg,'Reduced rational numbers in ['+lo+', '+hi+'] with H ≤ '+B+'. Horizontal coordinate: value a/b. Vertical coordinate: reduced denominator b.');
  for(let b=1;b<=B;b++){add(svg,'line',{x1:76,y1:Y(b),x2:682,y2:Y(b),class:'grid-line'});add(svg,'text',{x:63,y:Y(b)+4,'text-anchor':'end',class:'svg-small rational-row-label'},'b = '+b);}
  add(svg,'text',{x:76,y:28,class:'svg-small'},'Reduced denominator b');
  add(svg,'line',{x1:76,y1:bottom+18,x2:682,y2:bottom+18,class:'axis'});
  const ticks=mode==='unit'?[0,.25,.5,.75,1]:mode==='central'?[-2,-1,0,1,2]:Array.from(new Set([-B,-Math.round(B/2),0,Math.round(B/2),B]));
  ticks.forEach(t=>{add(svg,'line',{x1:X(t),y1:top-15,x2:X(t),y2:bottom+24,class:'grid-line rational-value-grid'});add(svg,'text',{x:X(t),y:bottom+47,'text-anchor':'middle',class:'svg-small'},mode==='unit'?({'0':'0','0.25':'1/4','0.5':'1/2','0.75':'3/4','1':'1'})[String(t)]:t);});
  add(svg,'text',{x:380,y:height-8,'text-anchor':'middle',class:'svg-label'},'Rational value a/b');
  visible.forEach(p=>{const point=add(svg,'circle',{cx:X(p.value),cy:Y(p.b),r:B<=20?5:B<=35?3.7:2.8,class:'point rational-point','data-a':p.a,'data-b':p.b});add(point,'title',{},p.label+' · denominator '+p.b+' · H = '+p.H+' · h = '+p.h.toFixed(3));point.addEventListener('click',()=>{$('#rational-a').value=p.a;$('#rational-b').value=p.b;update();});});
  const p=selected();if(p){const included=p.H<=B,onScreen=p.value>=lo&&p.value<=hi&&p.b<=B;
   $('#rational-detail').textContent='x = '+p.label+' · H(x) = '+p.H+' · h(x) = '+p.h.toFixed(3)+' · η(x) = '+p.eta.toFixed(3)+' · '+(included?'included in η≤'+bound.toFixed(1):'outside η≤'+bound.toFixed(1))+'.';
   $('#rational-position').textContent=onScreen?'Selected row: b = '+p.b+'. Click a point; use ← / → for neighbouring values or ↑ / ↓ for neighbouring denominator rows.':p.b>B?'The selected denominator b = '+p.b+' exceeds the displayed rows 1–'+B+'.':'The selected rational is outside the displayed horizontal interval.';
   if(onScreen){add(svg,'circle',{cx:X(p.value),cy:Y(p.b),r:7.5,class:'selected-point'+(included?'':' excluded-point')});add(svg,'text',{x:X(p.value),y:Y(p.b)-13,'text-anchor':'middle',class:'svg-label rational-selection-label','font-size':19},p.label);}
  }else{$('#rational-detail').textContent='Enter integer values with −1000 ≤ a ≤ 1000 and 1 ≤ b ≤ 1000.';$('#rational-position').textContent='';}
 }
 function setBound(value){const n=Number(value);if(value===''||!Number.isFinite(n))return;bound=Math.min(4,Math.max(1,Math.round(n*10)/10));update();}
 // Listen to both events: dragging, keyboard changes and committed edits all update the graph.
 [range,number].forEach(el=>{el.addEventListener('input',()=>setBound(el.value));el.addEventListener('change',()=>setBound(el.value));});
 $('#height-decrease').addEventListener('click',()=>setBound(bound-.1));$('#height-increase').addEventListener('click',()=>setBound(bound+.1));
 ['rational-a','rational-b'].forEach(id=>$('#'+id).addEventListener('input',update));$('#rational-window').addEventListener('change',update);
 svg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)||!visible.length)return;e.preventDefault();const p=selected();let next;
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){const direction=e.key==='ArrowUp'?1:-1,start=p?p.b:1,rows=visible.filter(x=>direction*(x.b-start)>0);if(!rows.length)return;const row=direction>0?Math.min(...rows.map(x=>x.b)):Math.max(...rows.map(x=>x.b));next=rows.filter(x=>x.b===row).reduce((best,x)=>!best||Math.abs(x.value-(p?.value||0))<Math.abs(best.value-(p?.value||0))?x:best,null);}
  else{let i=p?visible.findIndex(x=>x.a===p.a&&x.b===p.b):-1;if(i<0)i=p?visible.findIndex(x=>x.value>=p.value):0;if(i<0)i=visible.length-1;else if(e.key==='ArrowLeft')i=Math.max(0,i-1);else if(e.key==='ArrowRight')i=Math.min(visible.length-1,i+1);if(e.key==='Home')i=0;if(e.key==='End')i=visible.length-1;next=visible[i];}
  $('#rational-a').value=next.a;$('#rational-b').value=next.b;update();});
 update();
}

if($('#limit-n')){const update=()=>{const n=Number($('#limit-n').value),svg=$('#limit-svg');$('#limit-value').textContent=n;$('#dimension-ratio').textContent=((n+1)*(n+2)/(2*n*n)).toFixed(6);clear(svg,'Normalized exponent points tending to a triangle of area one half');const x=85,y=365,s=290;add(svg,'path',{d:`M${x},${y}L${x+s},${y}L${x},${y-s}Z`,class:'region'});add(svg,'line',{x1:x,y1:y,x2:440,y2:y,class:'axis'});add(svg,'line',{x1:x,y1:y,x2:x,y2:40,class:'axis'});add(svg,'text',{x:x-18,y:y+24,class:'svg-small'},'0');add(svg,'text',{x:x+s,y:y+24,class:'svg-small'},'1');add(svg,'text',{x:x-23,y:y-s+5,class:'svg-small'},'1');add(svg,'text',{x:453,y:y+5,class:'svg-label'},'i / n');add(svg,'text',{x:56,y:29,class:'svg-label'},'j / n');add(svg,'text',{x:430,y:140,class:'svg-label','font-size':25},'area = ½');add(svg,'text',{x:430,y:171,class:'svg-small'},'u, v ≥ 0');add(svg,'text',{x:430,y:195,class:'svg-small'},'u + v ≤ 1');M.monomials(n).forEach(p=>add(svg,'circle',{cx:x+s*p.i/n,cy:y-s*p.j/n,r:n<15?3:1.8,class:'point'}));};$('#limit-n').addEventListener('input',update);update();}

$$('[data-invariant-tool]').forEach(section=>{
 const K=window.LabKit,q=id=>section.querySelector('#'+(section.dataset.toolPrefix||'')+id);let model='general';
 function update(){
  const g=Number(q('genus').value);q('genus-value').textContent=g;
  q('genus-general').setAttribute('aria-pressed',String(model==='general'));q('genus-hyperelliptic').setAttribute('aria-pressed',String(model==='hyperelliptic'));
  q('genus-formula').textContent=model==='hyperelliptic'?'φ(X) > (g/2)(H_g − 1)':'φ(X) > [g(g+2) − (2g+1)H_g] / (g−1)';
  const general=M.invariantBound(g),hyper=M.invariantBound(g,'hyperelliptic');
  q('genus-result').textContent=(model==='hyperelliptic'?'Hyperelliptic surfaces':'General Riemann surfaces')+', genus '+g+': φ(X) > '+M.invariantBound(g,model).toFixed(4)+' (bound rounded for display).';
  q('invariant-comparison-values').textContent='At g = '+g+': general ≈ '+general.toFixed(6)+'; hyperelliptic ≈ '+hyper.toFixed(6)+'. Difference ≈ '+(hyper-general).toFixed(6)+'; ratio ≈ '+(hyper/general).toFixed(6)+'.';
  const svg=q('invariant-plot');clear(svg,'General and hyperelliptic lower bounds for genus 2 to 30');
  const X=k=>65+(k-2)/28*515,max=M.invariantBound(30,'hyperelliptic')*1.08,Y=v=>300-v/max*260;
  for(let j=0;j<=4;j++){const v=max*j/4;add(svg,'line',{x1:65,y1:Y(v),x2:580,y2:Y(v),class:'grid-line'});add(svg,'text',{x:52,y:Y(v)+5,'text-anchor':'end',class:'svg-small'},v.toFixed(1));}
  for(const k of [2,10,20,30])add(svg,'text',{x:X(k),y:325,'text-anchor':'middle',class:'svg-small'},k);
  add(svg,'line',{x1:65,y1:300,x2:596,y2:300,class:'axis'});add(svg,'text',{x:607,y:305,class:'svg-label'},'g');
  for(const [type,cls] of [['general','bound-exact-line'],['hyperelliptic','bound-simple-line']])add(svg,'path',{d:Array.from({length:29},(_,i)=>(i?'L':'M')+X(i+2)+','+Y(M.invariantBound(i+2,type))).join(' '),class:cls});
  add(svg,'line',{x1:X(g),y1:300,x2:X(g),y2:Y(hyper),class:'bound-guide'});add(svg,'circle',{cx:X(g),cy:Y(general),r:model==='general'?6:4,class:'point'});add(svg,'circle',{cx:X(g),cy:Y(hyper),r:model==='hyperelliptic'?6:4,class:'selected-point'});
 }
 q('genus-general').addEventListener('click',()=>{model='general';update();});q('genus-hyperelliptic').addEventListener('click',()=>{model='hyperelliptic';update();});q('genus').addEventListener('input',update);update();
 K.mount(section,{state:()=>({g:Number(q('genus').value),model}),restore:s=>{q('genus').value=K.integer(s.g,2,30);model=s.model==='hyperelliptic'?'hyperelliptic':'general';update();},latex:()=>{const g=Number(q('genus').value);return model==='general'?'\\varphi(X)>\\frac{'+g+'('+g+'+2)-(2\\cdot '+g+'+1)H_{'+g+'}}{'+g+'-1},\\quad H_{'+g+'}=\\sum_{k=1}^{'+g+'}\\frac1k.':'\\varphi(X)>\\frac{'+g+'}{2}(H_{'+g+'}-1),\\quad X\\text{ hyperelliptic}.';},rows:()=>[['genus','general_lower_bound_approx','hyperelliptic_lower_bound_approx','difference_approx','ratio_approx'],...Array.from({length:29},(_,i)=>{const g=i+2,a=M.invariantBound(g),b=M.invariantBound(g,'hyperelliptic');return [g,a,b,b-a,b/a];})],svg:()=>q('invariant-plot')});
});
if($('#remove-a')){let a=true,b=true;const update=()=>{$('#nail-a').classList.toggle('removed',!a);$('#nail-b').classList.toggle('removed',!b);$('#remove-a').disabled=!a;$('#remove-b').disabled=!b;$('#nail-word').textContent=a&&b?'aba⁻¹b⁻¹ ≠ 1':a?'aa⁻¹ = 1':b?'bb⁻¹ = 1':'1';$('#nail-explanation').textContent=a&&b?'Both punctures are present: the commutator is nontrivial.':a?'Removing b sends b to 1. The remaining word aa⁻¹ cancels; the painting falls.':b?'Removing a sends a to 1. The remaining word bb⁻¹ cancels; the painting falls.':'Both generators are trivial. Restore the nails to try again.';};$('#remove-a').addEventListener('click',()=>{a=false;update();});$('#remove-b').addEventListener('click',()=>{b=false;update();});$('#reset-nails').addEventListener('click',()=>{a=b=true;update();});update();}
if($('#torus-svg')){const pi=Math.PI,svg=$('#torus-svg');const curve=(vary,fixed)=>{const pts=[];for(let j=0;j<=100;j++){const t=j*2*pi/100,p=M.torus(vary==='theta'?t:fixed,vary==='phi'?t:fixed);pts.push((j?'L':'M')+p.sx.toFixed(2)+','+p.sy.toFixed(2));}return pts.join(' ');};const update=()=>{const t=Number($('#angle-theta').value),p=Number($('#angle-phi').value),theta=t*pi/180,phi=p*pi/180;$('#theta-value').textContent=t+'°';$('#phi-value').textContent=p+'°';clear(svg,'Torus wireframe with selected angular coordinates');for(let i=0;i<12;i++)add(svg,'path',{d:curve('phi',2*pi*i/12),class:'torus-line'});for(let i=0;i<8;i++)add(svg,'path',{d:curve('theta',2*pi*i/8),class:'torus-line'});add(svg,'path',{d:curve('theta',phi),class:'torus-ring'});add(svg,'path',{d:curve('phi',theta),class:'torus-ring'});const q=M.torus(theta,phi);add(svg,'circle',{cx:q.sx,cy:q.sy,r:7,class:'selected-point'});$('#torus-point').textContent='(θ, φ) = ('+t+'°, '+p+'°). Each red circle varies one coordinate while the other stays fixed.';};$('#angle-theta').addEventListener('input',update);$('#angle-phi').addEventListener('input',update);update();}
route();
})();
