(function(){'use strict';
 const M=window.ResearchMath,NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s);
 function add(parent,tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=String(text);parent.appendChild(el);return el;}
 function label(v){if(v===0)return '0';return Math.abs(v)>=10000||Math.abs(v)<.001?v.toExponential(3):String(Number(v.toPrecision(6)));}
 function coordinate(v){return Math.abs(v)<1e-12?'0':Math.abs(v)>1e7||Math.abs(v)<1e-5?v.toExponential(6):v.toFixed(7);}
 function sizeLabel(n){const s=n.toString();return s.length<15?n.toLocaleString('en'):s[0]+'.'+s.slice(1,4)+' × 10^'+(s.length-1);}

 document.querySelectorAll('[data-cycle-tool]').forEach(section=>{
  const prefix=section.dataset.toolPrefix||'',q=id=>section.querySelector('#'+prefix+'cycle-'+id),mathNS='http://www.w3.org/1998/Math/MathML';
  const gRange=q('g'),rRange=q('r'),entries=q('entries'),result=q('result');
  let g=3,r=2,weights=['1','-1'],inputs=[];
  function mathNode(parent,tag,text){const el=document.createElementNS(mathNS,tag);if(text!==undefined)el.textContent=String(text);parent.appendChild(el);return el;}
  function term(math,value,symbol,first){
   const num=BigInt(value.num),den=value.den;
   if(num===0n)return false;
   if(num<0n)mathNode(math,'mo','−');else if(!first)mathNode(math,'mo','+');
   const absolute=String(num<0n?-num:num);
   if(den!=='1'){const f=mathNode(math,'mfrac');mathNode(f,'mn',absolute);mathNode(f,'mn',den);}
   else if(absolute!=='1')mathNode(math,'mn',absolute);
   mathNode(math,'mi',symbol);return true;
  }
  function update(){
   q('g-value').textContent=g;q('r-value').textContent=r;
   inputs.forEach(input=>input.removeAttribute('aria-invalid'));
   try{
    const value=M.cycleHeightExact(g,weights.slice(0,r));
    q('error').textContent='';result.replaceChildren();
    const math=mathNode(result,'math');math.setAttribute('display','block');
    const label=mathNode(math,'mrow');
    const h=mathNode(label,'msub');mathNode(h,'mi','h′');mathNode(h,'mi','ℒ');mathNode(label,'mo','(');
    const z=mathNode(label,'msub');mathNode(z,'mi','Z');mathNode(z,'mrow','m,α');mathNode(label,'mo',')');mathNode(label,'mo','=');
    const first=term(math,value.omega,'Ω',true),second=term(math,value.phi,'Φ',!first);
    if(!first&&!second)mathNode(math,'mn','0');
    const f=c=>c.den==='1'?c.num:c.num+'/'+c.den;
    math.setAttribute('aria-label','Exact height: '+f(value.omega)+' times Omega plus '+f(value.phi)+' times Phi.');
    q('summary').textContent='g = '+g+' · r = '+r+' · m = ('+value.m.join(', ')+') · S₂ = '+value.squares+' · P = '+value.pairs;
    q('case').textContent=r===g?'The image is J, whose Néron–Tate height is exactly zero.':r===1?'The one-factor case: h′ℒ(Zₘ,α) = m₁² Ω / [8(g−1)].':'Exact reduced fractions; Ω and Φ retain the dependence on the curve.';
    if(r===2&&g>2&&value.m.every(x=>x==='1'))q('case').textContent+=' The sum map has P = 1, so the coefficient of Φ is positive.';
    if(r===2&&g>2&&value.m[0]==='1'&&value.m[1]==='-1')q('case').textContent+=' The difference map has P = −1, reversing the sign of the Φ coefficient.';
   }catch(error){
    inputs.forEach(input=>{const text=input.value.trim();if(!/^[+-]?\d{1,40}$/.test(text)||BigInt(text)===0n)input.setAttribute('aria-invalid','true');});
    q('error').textContent=error.message;result.textContent='Enter a nonzero integer in each box.';q('summary').textContent='';q('case').textContent='';
   }
  }
  function rebuild(){
   entries.replaceChildren();inputs=[];
   for(let i=0;i<r;i++){
    if(weights[i]===undefined)weights[i]='1';
    const label=document.createElement('label'),input=document.createElement('input');
    label.setAttribute('for',prefix+'cycle-m-'+(i+1));label.textContent='m'+String(i+1).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
    input.setAttribute('id',prefix+'cycle-m-'+(i+1));input.setAttribute('type','text');input.value=weights[i];input.setAttribute('maxlength','41');input.setAttribute('spellcheck','false');input.setAttribute('autocomplete','off');input.setAttribute('aria-describedby',prefix+'cycle-error');
    input.addEventListener('input',()=>{weights[i]=input.value;update();});label.appendChild(input);entries.appendChild(label);inputs.push(input);
   }
  }
  function dimensions(){
   const previous=r;g=Number(gRange.value);r=Math.min(g,Number(rRange.value));rRange.setAttribute('max',String(g));rRange.value=r;
   if(r!==previous)rebuild();update();
  }
  gRange.addEventListener('input',dimensions);rRange.addEventListener('input',dimensions);
  gRange.addEventListener('change',dimensions);rRange.addEventListener('change',dimensions);
  rebuild();update();
  const K=window.LabKit;
  function restore(state){const nextG=K.integer(state.g,2,30),nextR=K.integer(state.r,1,nextG);if(!Array.isArray(state.m)||state.m.length!==nextR)throw Error('The vector must have exactly r entries.');M.cycleHeightExact(nextG,state.m);g=nextG;r=nextR;weights=state.m.map(String);gRange.value=g;rRange.max=g;rRange.value=r;rebuild();update();}
  section.querySelectorAll('[data-cycle-preset]').forEach(b=>b.addEventListener('click',()=>{const preset=b.dataset.cyclePreset,genus=['sum','difference'].includes(preset)?Math.max(3,g):g;restore({g:genus,r:preset==='one'?1:preset==='jacobian'?genus:2,m:preset==='one'?['1']:preset==='jacobian'?Array(genus).fill('1'):preset==='sum'?['1','1']:['1','-1']});}));
  K.mount(section,{state:()=>{M.cycleHeightExact(g,weights.slice(0,r));return {g,r,m:weights.slice(0,r)};},restore,
   latex:()=>{const value=M.cycleHeightExact(g,weights.slice(0,r));return "\\alpha=\\frac{\\omega}{2g-2},\\quad g="+g+",\\ r="+r+",\\ m=("+value.m.join(',')+").\n"+"h'_{\\mathcal L}(Z_{m,\\alpha})="+K.fraction(value.omega)+"\\Omega+("+K.fraction(value.phi)+")\\Phi,\\quad \\Omega=\\frac{\\widehat\\omega^2}{[K:\\mathbb Q]},\\quad \\Phi=\\frac{\\varphi(X)}{[K:\\mathbb Q]}.";},
   rows:()=>{const v=M.cycleHeightExact(g,weights.slice(0,r));return [['g','r','m','S2','P','A_numerator','A_denominator','B_numerator','B_denominator'],[g,r,v.m.join(';'),v.squares,v.pairs,v.omega.num,v.omega.den,v.phi.num,v.phi.den]];}
  });
 });

 document.querySelectorAll('[data-manin-tool]').forEach(section=>{
  const $=selector=>section.querySelector(selector.replace(/^#/, '#'+(section.dataset.toolPrefix||'')));
  const range=$('#manin-genus-range'),number=$('#manin-genus-number'),svg=$('#manin-plot');let g=2;
  function update(raw){if(raw==='')return;const x=Number(raw);if(!Number.isFinite(x))return;g=Math.max(2,Math.min(50,Math.round(x)));range.value=g;number.value=g;$('#manin-exact').textContent=M.maninBound(g).toLocaleString('en');$('#manin-simple').textContent=M.simpleManinBound(g).toLocaleString('en');
   svg.replaceChildren();const maxG=Math.min(50,Math.max(10,g+5)),maxY=M.simpleManinBound(maxG),X=k=>58+(k-2)/(maxG-2)*470,Y=v=>244-v/maxY*211;
   add(svg,'title',{},'Upper bounds at genus '+g+': '+M.maninBound(g)+' and '+M.simpleManinBound(g));
   for(let j=0;j<=4;j++){const v=maxY*j/4;add(svg,'line',{x1:58,y1:Y(v),x2:528,y2:Y(v),class:'grid-line'});add(svg,'text',{x:48,y:Y(v)+4,'text-anchor':'end',class:'svg-small'},label(v));}
   add(svg,'line',{x1:58,y1:244,x2:540,y2:244,class:'axis'});add(svg,'text',{x:551,y:249,class:'svg-label'},'g');
   for(const k of [...new Set([2,g,maxG])])add(svg,'text',{x:X(k),y:272,'text-anchor':'middle',class:'svg-small'},k);
   for(const [fn,cls] of [[M.simpleManinBound,'bound-simple-line'],[M.maninBound,'bound-exact-line']]){const d=Array.from({length:maxG-1},(_,i)=>(i?'L':'M')+X(i+2)+','+Y(fn(i+2))).join(' ');add(svg,'path',{d,class:cls});}
   add(svg,'line',{x1:X(g),y1:244,x2:X(g),y2:Y(M.simpleManinBound(g)),class:'bound-guide'});add(svg,'circle',{cx:X(g),cy:Y(M.maninBound(g)),r:5,class:'point'});add(svg,'circle',{cx:X(g),cy:Y(M.simpleManinBound(g)),r:4,class:'selected-point'});
  }
  [range,number].forEach(el=>{el.addEventListener('input',()=>update(el.value));el.addEventListener('change',()=>update(el.value));});update(2);
  const K=window.LabKit;K.mount(section,{state:()=>({g}),restore:s=>update(K.integer(s.g,2,50)),latex:()=>"c("+g+")="+M.maninBound(g)+"\\le 16\\cdot "+g+"^2+32\\cdot "+g+"+124="+M.simpleManinBound(g)+".\n% Non-isotrivial curves over one-dimensional function fields; Theorem 1.1.",rows:()=>[['genus','theorem_upper_bound','simpler_upper_bound'],...Array.from({length:49},(_,i)=>[i+2,M.maninBound(i+2),M.simpleManinBound(i+2)])],svg:()=>svg});
 });

 document.querySelectorAll('[data-faltings-tool]').forEach(section=>{
  const nodes={},q=id=>nodes[id]||(nodes[id]=section.querySelector('#'+(section.dataset.toolPrefix||'')+'faltings-'+id)),svg=q('plot'),mathNS='http://www.w3.org/1998/Math/MathML';
  let chosen=5,points=[],plotted=null,job=0,plotMap=null,tableDirty=true;
  function mathNode(parent,tag,text){const el=document.createElementNS(mathNS,tag);if(text!==undefined)el.textContent=String(text);parent.appendChild(el);return el;}
  function fraction(parent,num,den){if(String(den)==='1'){mathNode(parent,'mn',num);return;}const f=mathNode(parent,'mfrac');mathNode(f,'mn',num);mathNode(f,'mn',den);}
  function coefficient(parent,c){if(c.num!=='1'||c.den!=='1')fraction(parent,c.num,c.den);}
  function exactFormula(n){const e=M.faltingsExact(n),host=q('exact');host.replaceChildren();const math=mathNode(host,'math');math.setAttribute('display','block');const table=mathNode(math,'mtable');table.setAttribute('columnalign','left');const row=()=>mathNode(mathNode(table,'mtr'),'mtd');
   const first=row(),h=mathNode(first,'msub');mathNode(h,'mi','h');mathNode(h,'mtext','Fal');mathNode(first,'mo','(');const X=mathNode(first,'msub');mathNode(X,'mi','X');mathNode(X,'mn',n);mathNode(first,'mo',')');mathNode(first,'mo','=');
   e.terms.forEach((t,i)=>{if(i)mathNode(first,'mo','+');coefficient(first,t);mathNode(first,'mi','log');mathNode(first,'mn',t.p);});
   const second=row();mathNode(second,'mo','−');coefficient(second,e.pi);mathNode(second,'mi','log');mathNode(second,'mi','π');mathNode(second,'mo','+');coefficient(second,e.two);mathNode(second,'mi','log');mathNode(second,'mn','2');
   const third=row();mathNode(third,'mo','−');if(e.g>1){const sum=mathNode(third,'munderover');mathNode(sum,'mo','∑');const lower=mathNode(sum,'mrow');mathNode(lower,'mi','j');mathNode(lower,'mo','=');mathNode(lower,'mn','1');mathNode(sum,'mn',e.g);}
   mathNode(third,'mi','log');const ratio=mathNode(third,'mfrac');for(const shift of [false,true]){const gamma=mathNode(ratio,'mrow');mathNode(gamma,'mi','Γ');mathNode(gamma,'mo','(');const arg=mathNode(gamma,'mfrac'),num=mathNode(arg,'mrow');if(e.g===1){mathNode(num,'mn',shift?n+1:1);}else{mathNode(num,'mn','2');mathNode(num,'mi','j');mathNode(num,'mo',shift?'+':'−');mathNode(num,'mn',shift?n-1:1);}mathNode(arg,'mn',2*n);mathNode(gamma,'mo',')');}
   const fractionText=t=>t.den==='1'?t.num:t.num+'/'+t.den,plain=e.terms.map(t=>fractionText(t)+' log '+t.p).join(' + ')+' − '+fractionText(e.pi)+' log π + '+fractionText(e.two)+' log 2 − '+(e.g===1?'log[Γ(1/'+(2*n)+')/Γ('+(n+1)+'/'+(2*n)+')]':'sum from j=1 to '+e.g+' of log[Γ((2j−1)/'+(2*n)+')/Γ((2j+'+(n-1)+')/'+(2*n)+')]');math.setAttribute('aria-label','Exact stable Faltings height of X_'+n+': '+plain);
  }
  function valueOf(p){return p.height-(q('view').value==='remainder'?p.leading:0);}
  function selection(){svg.querySelectorAll('.faltings-selected').forEach(el=>el.remove());if(!plotMap||!plotted)return;const p=points.find(p=>p.n===chosen);if(!p)return;const dot=add(svg,'circle',{cx:plotMap.X(p.n),cy:plotMap.Y(valueOf(p)),r:5.2,class:'selected-point faltings-selected'});add(dot,'title',{},'n = '+p.n+'; height ≈ '+p.height.toFixed(8));}
  function choose(raw){const n=Number(raw);try{if(raw==='')throw Error('Enter an odd integer n from 3 to '+M.FALTINGS_MAX_N+'.');M.faltingsExact(n);}catch(e){q('n-error').textContent=e.message;q('n-number').setAttribute('aria-invalid','true');return false;}
   chosen=n;q('n-error').textContent='';q('n-number').removeAttribute('aria-invalid');q('n-number').value=n;q('n-range').value=n;q('previous').disabled=n===3;q('next').disabled=n===M.FALTINGS_MAX_N;const p=M.faltingsHeight(n);q('decimal').textContent='≈ '+p.height.toFixed(8);q('curve').textContent='n = '+n+' · genus '+p.g+' · '+p.factors.map(({p,exponent:e})=>p+(e>1?'^'+e:'')).join(' × ');exactFormula(n);selection();return true;
  }
  function fillTable(){if(!tableDirty)return;const tbody=q('table');tbody.replaceChildren();for(const p of points){const row=document.createElement('tr');for(const t of [p.n,p.g,p.height.toFixed(8)]){const cell=document.createElement('td');cell.textContent=String(t);row.appendChild(cell);}tbody.appendChild(row);}tableDirty=false;}
  function drawPlot(){svg.replaceChildren();plotMap=null;if(!points.length)return;const remainder=q('view').value==='remainder',bounds=q('bounds').checked,xMin=plotted.first===plotted.last?plotted.first-1:plotted.first,xMax=plotted.first===plotted.last?plotted.last+1:plotted.last;
   const lower=p=>(remainder?0:p.leading)-.975*p.n,upper=p=>(remainder?0:p.leading)+9/64*p.n*Math.log(Math.log(p.n))-.263*p.n;
   let lo=Math.min(...points.map(valueOf)),hi=Math.max(...points.map(valueOf));if(bounds){lo=Math.min(lo,...points.map(lower));hi=Math.max(hi,...points.map(upper));}const pad=Math.max((hi-lo)*.09,Math.abs(hi)*.015,.05);lo-=pad;hi+=pad;
   const X=n=>94+(n-xMin)/(xMax-xMin)*620,Y=v=>337-(v-lo)/(hi-lo)*295;plotMap={X,Y,xMin,xMax};
   add(svg,'title',{},'All '+points.length+' stable Faltings heights for odd n in ['+plotted.a+','+plotted.b+']'+(remainder?', after subtracting (n/8) log n.':'.'));
   for(let i=0;i<=4;i++){const y=lo+(hi-lo)*i/4;add(svg,'line',{x1:94,y1:Y(y),x2:714,y2:Y(y),class:'grid-line'});add(svg,'text',{x:82,y:Y(y)+4,'text-anchor':'end',class:'svg-small'},label(y));}
   if(lo<0&&hi>0)add(svg,'line',{x1:94,y1:Y(0),x2:714,y2:Y(0),class:'axis'});
   add(svg,'line',{x1:94,y1:337,x2:714,y2:337,class:'axis'});add(svg,'text',{x:732,y:342,class:'svg-label'},'n');add(svg,'text',{x:94,y:23,class:'svg-small'},remainder?'h_Fal(Xₙ) − (n/8) log n':'h_Fal(Xₙ)');
   const ticks=[...new Set(Array.from({length:5},(_,i)=>plotted.first+2*Math.round((plotted.last-plotted.first)/2*i/4)))];for(const n of ticks)add(svg,'text',{x:X(n),y:362,'text-anchor':'middle',class:'svg-small'},n);
   if(bounds)for(const [fn,cls] of [[lower,'faltings-lower'],[upper,'bound-simple-line']]){const d=points.map((p,i)=>(i?'L':'M')+X(p.n)+','+Y(fn(p))).join(' ');add(svg,'path',{d,class:cls});if(points.length===1)add(svg,'circle',{cx:X(points[0].n),cy:Y(fn(points[0])),r:3,class:cls});}
   for(const p of points){const factor=p.factors.length===1?(p.factors[0].exponent===1?'prime':'power'):'composite',coloured=q('colour').checked,radius=points.length>1500?1.7:points.length>200?2.3:3.6,x=X(p.n),y=Y(valueOf(p)),attrs={class:'point faltings-dot'+(coloured?' factor-'+factor:''),'data-n':p.n};let dot;
    if(coloured&&factor==='power')dot=add(svg,'path',{...attrs,d:`M${x},${y-radius-1}l${radius+1},${radius+1}l${-radius-1},${radius+1}l${-radius-1},${-radius-1}Z`});
    else if(coloured&&factor==='composite')dot=add(svg,'rect',{...attrs,x:x-radius,y:y-radius,width:2*radius,height:2*radius});
    else dot=add(svg,'circle',{...attrs,cx:x,cy:y,r:radius});
    add(dot,'title',{},'n = '+p.n+'; '+factor+'; g = '+p.g+'; height ≈ '+p.height.toFixed(8));}
   q('legend').hidden=!q('colour').checked;
   if(q('colour').checked){[['Prime',94,'prime'],['Prime power',275,'power'],['Other composite',490,'composite']].forEach(([text,x,type])=>add(svg,'text',{x,y:392,class:'svg-small factor-'+type},text));}
   q('plot-status').textContent=points.length.toLocaleString('en')+' heights · every odd n in ['+plotted.a+', '+plotted.b+'] · no points omitted.';selection();
  }
  async function plotInterval(){let interval;try{const a=q('a').value,b=q('b').value;if(a===''||b==='')throw Error('Enter both interval endpoints.');interval=M.faltingsInterval(Number(a),Number(b));}catch(e){q('interval-error').textContent=e.message;return;}
   const current=++job;q('interval-error').textContent='';q('plot-status').textContent='Calculating '+interval.count.toLocaleString('en')+' heights…';svg.setAttribute('aria-busy','true');const next=[];
   for(let n=interval.first;n<=interval.last;n+=2){if(current!==job)return;next.push(M.faltingsHeight(n));if(next.length%64===0&&n<interval.last){q('plot-status').textContent='Calculating heights: '+next.length+' / '+interval.count+'…';await new Promise(resolve=>setTimeout(resolve,0));}}
   if(current!==job)return;points=next;plotted=interval;tableDirty=true;svg.removeAttribute('aria-busy');if(chosen<interval.first||chosen>interval.last)choose(interval.first);drawPlot();if(q('table-panel').open)fillTable();
  }
  q('n-number').addEventListener('input',()=>choose(q('n-number').value));q('n-number').addEventListener('change',()=>choose(q('n-number').value));q('n-range').addEventListener('input',()=>choose(q('n-range').value));q('n-range').addEventListener('change',()=>choose(q('n-range').value));q('previous').addEventListener('click',()=>choose(Math.max(3,chosen-2)));q('next').addEventListener('click',()=>choose(Math.min(M.FALTINGS_MAX_N,chosen+2)));
  q('plot-button').addEventListener('click',plotInterval);for(const id of ['a','b'])q(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();return plotInterval();}});q('figure').addEventListener('click',()=>{q('a').value=3;q('b').value=6001;q('view').value='height';q('bounds').checked=false;return plotInterval();});q('view').addEventListener('change',drawPlot);q('bounds').addEventListener('change',drawPlot);q('colour').addEventListener('change',drawPlot);q('table-panel').addEventListener('toggle',()=>{if(q('table-panel').open)fillTable();});
  svg.addEventListener('click',e=>{if(!plotMap)return;const dot=e.target.closest('[data-n]');if(dot){choose(Number(dot.dataset.n));return;}const rect=svg.getBoundingClientRect(),width=rect.width||rect.right-rect.left,height=rect.height||rect.bottom-rect.top,scale=Math.min(width/760,height/400),x=(e.clientX-rect.left-(width-760*scale)/2)/scale,n=plotMap.xMin+(x-94)/620*(plotMap.xMax-plotMap.xMin);if(!Number.isFinite(n))return;choose(Math.max(plotted.first,Math.min(plotted.last,plotted.first+2*Math.round((n-plotted.first)/2))));});
  svg.addEventListener('keydown',e=>{if(!plotted)return;let n;if(e.key==='Home')n=plotted.first;else if(e.key==='End')n=plotted.last;else if(e.key==='ArrowRight')n=chosen<plotted.first?plotted.first:Math.min(plotted.last,chosen+2);else if(e.key==='ArrowLeft')n=chosen>plotted.last?plotted.last:Math.max(plotted.first,chosen-2);else return;e.preventDefault();choose(n);});
  choose(5);plotInterval();
  const K=window.LabKit;
  K.mount(section,{state:()=>({n:chosen,a:plotted?.a||3,b:plotted?.b||101,view:q('view').value,bounds:q('bounds').checked,colour:q('colour').checked}),
   restore:async s=>{const n=K.integer(s.n,3,10001);M.faltingsExact(n);M.faltingsInterval(Number(s.a),Number(s.b));q('a').value=s.a;q('b').value=s.b;q('view').value=s.view==='remainder'?'remainder':'height';q('bounds').checked=!!s.bounds;q('colour').checked=!!s.colour;await plotInterval();choose(n);},
   latex:()=>{const e=M.faltingsExact(chosen);return 'h_{\\mathrm{Fal}}(X_{'+chosen+'})='+e.terms.map(t=>K.fraction(t)+'\\log '+t.p).join('+')+'-'+K.fraction(e.pi)+'\\log\\pi+'+K.fraction(e.two)+'\\log 2-\\sum_{j=1}^{'+e.g+'}\\log\\frac{\\Gamma((2j-1)/'+(2*chosen)+')}{\\Gamma((2j+'+(chosen-1)+')/'+(2*chosen)+')}.\n% Stable Faltings height; metric (i/2) integral eta wedge conjugate(eta).';},
   rows:()=>{if(!points.length)throw Error('Plot an interval first.');return [['n','genus','factorisation','kind','stable_Faltings_height_approx','height_minus_leading_term_approx'],...points.map(p=>[p.n,p.g,p.factors.map(f=>f.p+'^'+f.exponent).join('*'),p.factors.length===1?(p.factors[0].exponent===1?'prime':'prime power'):'other composite',p.height,p.height-p.leading])];},svg:()=>svg
  });
 });

 document.querySelectorAll('[data-poly-sampler]').forEach(section=>{
  const K=window.LabKit,model=section.dataset.polySampler,key=section.id,q=s=>section.querySelector('#'+key+'-'+s);
  const limits=model==='report'?{min:.1,max:50,step:.1}:{min:.05,max:1,step:.05};
  let n=8,r=model==='report'?5:.25,seed=K.seed(),random=K.seededRandom(seed),samples=[],accumulate=false,job=0,busy=false;
  const modeLabel=document.createElement('label');modeLabel.className='check-label';const modeInput=document.createElement('input');modeInput.type='checkbox';modeInput.setAttribute('aria-label','Show all collected zeros');modeLabel.appendChild(modeInput);modeLabel.appendChild(document.createTextNode('Show all collected zeros'));section.querySelector('.root-plot-toolbar').appendChild(modeLabel);
  function controls(){q('sample').disabled=busy||samples.length>=100;q('batch').disabled=busy||samples.length>=100;modeInput.checked=accumulate;}
  function entries(){return accumulate?samples:samples.slice(-1);}
  function drawPlot(){const svg=q('plot');svg.replaceChildren();const current=samples.at(-1),data=entries(),roots=data.flatMap((s,index)=>s.result.roots.map((z,i)=>({...z,sample:accumulate?index+1:samples.length,index:i+1,status:s.result.status})));
   let extent=q('view').value==='central'?2:Math.max(1.25,...roots.map(z=>Math.max(Math.abs(z.re),Math.abs(z.im))*1.15));if(!Number.isFinite(extent))extent=2;
   const x0=280,y0=207,scale=174/extent,X=x=>x0+x*scale,Y=y=>y0-y*scale;
   add(svg,'title',{},accumulate?'Numerical zero sets of '+samples.length+' sampled integer polynomials':current?'Numerical zeros of '+M.polynomialText(current.coefficients):'Complex zero plot');
   add(svg,'rect',{x:106,y:33,width:348,height:348,class:'root-plot-area'});
   for(const v of [-extent,-extent/2,0,extent/2,extent]){add(svg,'line',{x1:X(v),y1:33,x2:X(v),y2:381,class:'grid-line'});add(svg,'line',{x1:106,y1:Y(v),x2:454,y2:Y(v),class:'grid-line'});add(svg,'text',{x:X(v),y:405,'text-anchor':'middle',class:'svg-small'},label(v));if(v!==0)add(svg,'text',{x:96,y:Y(v)+4,'text-anchor':'end',class:'svg-small'},label(v));}
   add(svg,'line',{x1:100,y1:y0,x2:462,y2:y0,class:'axis'});add(svg,'line',{x1:x0,y1:387,x2:x0,y2:24,class:'axis'});add(svg,'text',{x:474,y:y0+5,class:'svg-label'},'Re z');add(svg,'text',{x:x0+9,y:20,class:'svg-label'},'Im z');
   if(q('circle').checked)add(svg,'circle',{cx:x0,cy:y0,r:scale,class:'unit-circle'});
   let shown=0;roots.forEach(z=>{if(Math.abs(z.re)>extent||Math.abs(z.im)>extent)return;shown++;const dot=add(svg,'circle',{cx:X(z.re),cy:Y(z.im),r:accumulate?3:4.7,class:'root-dot',opacity:accumulate?.3:1});add(dot,'title',{},'Sample '+z.sample+', zero '+z.index+': '+coordinate(z.re)+(z.im<0?' − ':' + ')+coordinate(Math.abs(z.im))+'i; '+z.status);});
   const count=status=>data.filter(s=>s.result.status===status).length;
   if(!current){add(svg,'text',{x:280,y:92,'text-anchor':'middle',class:'svg-small'},'Choose parameters, then sample.');q('root-status').textContent='The plot will show numerical approximations to the complex zeros.';}
   else if(!accumulate&&current.result.status==='zero'){add(svg,'text',{x:280,y:92,'text-anchor':'middle',class:'svg-small'},'P = 0: every complex number is a zero.');q('root-status').textContent='The zero polynomial vanishes on the entire complex plane, so it has no finite list of isolated zeros to plot.';}
   else if(!accumulate&&current.result.status==='constant'){q('root-status').textContent='A nonzero constant has no complex zeros.';}
   else q('root-status').textContent=shown+' of '+roots.length+' finite zeros shown, with multiplicity, from '+data.length+' polynomial'+(data.length===1?'':'s')+'. '+count('zero')+' zero polynomials; '+count('constant')+' nonzero constants; '+count('uncertain')+' numerically uncertain; '+count('failed')+' unresolved. No sample is replaced.';
   if(current&&!accumulate&&current.result.degree>=1&&current.result.degree<n)q('root-status').textContent+=' Actual degree '+current.result.degree+' is below n = '+n+'.';
   q('roots').replaceChildren();section.querySelector('.root-table th').textContent='Sample / zero';
   roots.forEach(z=>{const row=document.createElement('tr');for(const t of [z.sample+' / '+z.index,coordinate(z.re),coordinate(z.im)]){const cell=document.createElement('td');cell.textContent=t;row.appendChild(cell);}q('roots').appendChild(row);});
   q('sample-count').textContent=samples.length?'Sample '+samples.length+' · latest polynomial below':'No sample yet';
   q('accumulation').textContent=samples.length+' / 100 polynomials collected at n = '+n+', r = '+r+'. '+(accumulate?'Showing the whole collection.':'Showing the latest sample.')+' Sequence seed: '+seed+'.';
   if(current){const a=current.coefficients,norm=M.bombieriNorm(a,n);q('expression').textContent='P(X) = '+M.polynomialText(a);q('properties').textContent=(current.result.degree<0?'Zero polynomial':'Degree '+current.result.degree)+' · '+(model==='paper'?'h_B(P) ≈ '+(Math.log(norm)/n).toPrecision(6):'‖P‖B,∞ ≈ '+norm.toPrecision(6))+' ≤ '+r+(current.result.residual===null?'':'. Largest normalized residual: '+current.result.residual.toExponential(2))+'.';}
   else{q('expression').textContent='Choose n and r, then sample a polynomial.';q('properties').textContent='';}
   controls();
  }
  function updateParameters(keepSeed=false){job++;busy=false;const bounds=M.coefficientBounds(n,r,model),count=M.ensembleSize(bounds,model);q('n-number').value=n;q('n-range').value=n;q('r-number').value=r;q('r-range').value=r;q('budget').textContent='n = '+n+' · r = '+r+' · '+sizeLabel(count)+' integer polynomials';q('bounds').textContent='Coefficient bounds B₀, …, Bₙ: '+bounds.join(', ')+'.';q('size').textContent='Exact set size: '+count.toString()+'.';if(!keepSeed)seed=K.seed();random=K.seededRandom(seed);samples=[];drawPlot();}
  function changeN(raw){if(raw===''||!Number.isFinite(Number(raw)))return;const next=Math.max(1,Math.min(24,Math.round(Number(raw))));if(next!==n){n=next;updateParameters();}}
  function changeR(raw){if(raw===''||!Number.isFinite(Number(raw)))return;const next=Number(Math.min(limits.max,Math.max(limits.min,Math.round(Number(raw)/limits.step)*limits.step)).toFixed(2));if(next!==r){r=next;updateParameters();}}
  ['n-number','n-range'].forEach(id=>{q(id).addEventListener('input',()=>changeN(q(id).value));q(id).addEventListener('change',()=>changeN(q(id).value));});['r-number','r-range'].forEach(id=>{q(id).addEventListener('input',()=>changeR(q(id).value));q(id).addEventListener('change',()=>changeR(q(id).value));});
  async function addSamples(count){const current=++job;busy=true;controls();for(let i=0;i<count&&samples.length<100;i++){if(current!==job)return;const coefficients=M.samplePolynomial(n,r,model,random);samples.push({coefficients,result:M.polynomialRoots(coefficients)});if(i%5===4){q('accumulation').textContent='Calculating sample '+samples.length+'…';await new Promise(resolve=>setTimeout(resolve,0));}}if(current!==job)return;busy=false;drawPlot();}
  q('sample').addEventListener('click',()=>addSamples(1));q('batch').addEventListener('click',()=>{accumulate=true;return addSamples(25);});q('clear').addEventListener('click',()=>updateParameters());modeInput.addEventListener('change',()=>{accumulate=modeInput.checked;drawPlot();});q('view').addEventListener('change',drawPlot);q('circle').addEventListener('change',drawPlot);updateParameters();
  function state(){if(busy)throw Error('Please wait for the samples to finish.');return {n,r,seed,count:samples.length,accumulate,view:q('view').value,circle:q('circle').checked};}
  K.mount(section,{state,restore:async s=>{const nextN=K.integer(s.n,1,24),nextR=K.number(s.r,limits.min,limits.max),nextSeed=K.integer(s.seed,0,4294967295),count=K.integer(s.count,0,100);if(Math.abs(nextR/limits.step-Math.round(nextR/limits.step))>1e-8)throw Error('The radius must lie on a supported slider step.');n=nextN;r=nextR;seed=nextSeed;accumulate=!!s.accumulate;q('view').value=s.view==='central'?'central':'all';q('circle').checked=!!s.circle;updateParameters(true);await addSamples(count);},
   latex:()=>{const a=samples.at(-1)?.coefficients;if(!a)throw Error('Sample a polynomial first.');let out='';for(let k=a.length-1;k>=0;k--){const v=a[k];if(!v)continue;out+=(v<0?'-':out?'+':'')+(Math.abs(v)!==1||k===0?Math.abs(v):'')+(k?'X'+(k>1?'^{'+k+'}':''):'');}return 'P(X)='+(out||'0')+'.\n% '+model+' convention; n='+n+', r='+r+', seed='+seed+', sample='+samples.length+'.';},
   rows:()=>{if(!samples.length)throw Error('Sample a polynomial first.');return [['convention','n','r','seed','sample','coefficients_constant_first','numerical_status','root_index','real_approx','imaginary_approx','normalized_residual'],...samples.flatMap((s,i)=>s.result.roots.length?s.result.roots.map((z,j)=>[model,n,r,seed,i+1,JSON.stringify(s.coefficients),s.result.status,j+1,z.re,z.im,s.result.residual]):[[model,n,r,seed,i+1,JSON.stringify(s.coefficients),s.result.status,'','','',s.result.residual]])];},svg:()=>q('plot')
  });
 });

})();
