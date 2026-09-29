(function(){'use strict';
 const K=window.LabKit,$=s=>document.querySelector(s);
 if($('#download-bibliography'))$('#download-bibliography').addEventListener('click',()=>K.textFile(JSON.parse($('#bibliography-data').textContent),'robert-wilms-publications.bib','application/x-bibtex;charset=utf-8'));
 document.querySelectorAll('[data-map-filter]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.mapFilter;document.querySelectorAll('[data-map-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-map-topics]').forEach(a=>a.classList.toggle('map-muted',key!=='all'&&!a.dataset.mapTopics.split(' ').includes(key)));}));
 const reader=$('#comic-reader'),panelButton=$('#reader-panels'),panelView=$('#reader-panel-view'),svg=$('#reader-panel-svg');let active=null,rects=[],panel=0,mode=false;
 function drawPanel(){if(!active||!rects.length)return;const [x,y,w,h]=rects[panel];svg.setAttribute('viewBox',[x,y,w,h].join(' '));svg.replaceChildren();const image=document.createElementNS('http://www.w3.org/2000/svg','image');image.setAttribute('href',active.href);image.setAttribute('width',active.dataset.imageWidth);image.setAttribute('height',active.dataset.imageHeight);svg.appendChild(image);svg.setAttribute('aria-label',active.dataset.title+', panel '+(panel+1));$('#reader-panel-status').textContent='Panel '+(panel+1)+' / '+rects.length;$('#reader-panel-prev').disabled=panel===0;$('#reader-panel-next').disabled=panel===rects.length-1;const paragraphs=active.dataset.transcript.split(/\n\s*\n/).filter(p=>/^\d+\./.test(p));$('#reader-panel-description').textContent=paragraphs[panel]||'';}
 function setMode(value){mode=value;panelButton.setAttribute('aria-pressed',String(mode));panelButton.textContent=mode?'Show whole comic':'Read panel by panel';panelView.hidden=!mode;$('#reader-canvas').hidden=mode;$('#reader-zoom').hidden=mode;reader.classList.toggle('panel-mode',mode);if(mode)drawPanel();}
 document.querySelectorAll('[data-comic]').forEach(a=>a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;active=a;rects=a.dataset.panels?JSON.parse(a.dataset.panels):[];panel=0;panelButton.hidden=!rects.length;setMode(false);}));
 panelButton.addEventListener('click',()=>setMode(!mode));$('#reader-panel-prev').addEventListener('click',()=>{panel=Math.max(0,panel-1);drawPanel();});$('#reader-panel-next').addEventListener('click',()=>{panel=Math.min(rects.length-1,panel+1);drawPanel();});
 reader.addEventListener('keydown',e=>{if(!mode||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();panel=Math.max(0,Math.min(rects.length-1,panel+(e.key==='ArrowRight'?1:-1)));drawPanel();});
 // ECO examples use the same share/export controls as the publication tools.
 function input(id,value){const el=document.getElementById(id);if(el.type==='checkbox')el.checked=Boolean(value);else el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
 const eco=window.ECOMath;
 function geometryState(){return {n:Number($('#degree').value),wx:Number($('#weight-x').value),wy:Number($('#weight-y').value),normalize:$('#normalize').checked,hull:$('#show-integer-hull').checked};}
 function geometryComparisonRows(){
  const {n,wx,wy}=geometryState(),s=eco.ecoGeometry(n,wx,wy),F=eco.fraction;
  return [['quantity','n','weight_x','weight_y','value_exact','value_approx','normalization','normalized_exact','normalized_approx','limit_exact'],
   ['triangle_area',n,wx,wy,F(n*n,2*wx*wy),s.area,n*n,F(1,2*wx*wy),s.normalizedArea,F(1,2*wx*wy)],
   ['lattice_point_count',n,wx,wy,s.count,s.count,n*n,F(s.count,n*n),s.normalizedCount,F(1,2*wx*wy)],
   ['max_finite_quotient_dimension_over_infinite_field',n,wx,wy,s.intersection,s.intersection,n*n,F(s.intersection,n*n),s.normalizedIntersection,F(1,wx*wy)]];
 }
 if($('#eco-geometry')){
  K.mount($('#eco-geometry'),{
   state:geometryState,
   restore:s=>{const n=K.integer(s.n,1,30),wx=K.integer(s.wx??1,1,6),wy=K.integer(s.wy??1,1,6);input('degree',n);input('weight-x',wx);input('weight-y',wy);input('normalize',s.normalize);input('show-integer-hull',s.hull??true);},
   latex:()=>{
    const {n,wx,wy}=geometryState(),s=eco.ecoGeometry(n,wx,wy);
    return String.raw`w=(${wx},${wy}),\quad \deg_w P=\max_{c_{ij}\ne0}(${wx}i+${wy}j),\quad \gamma_w(P)=\max\{1,\deg_w P\}\ (P\ne0),\quad \gamma_w(0)=1.
(\gamma_w)_{\le ${n}}=\operatorname{span}_k\{x^iy^j:i,j\ge0,\ ${wx}i+${wy}j\le ${n}\},\quad \dim_k(\gamma_w)_{\le ${n}}=${s.count}.
T_n=\{(u,v)\in\mathbb R_{\ge0}^2:${wx}u+${wy}v\le n\},\quad \Delta_w=T_1,\quad \Pi_n=\operatorname{conv}(T_n\cap\mathbb Z^2).
A_{${n}}=\frac{${n*n}}{${2*wx*wy}},\quad N_{${n}}=${s.count},\quad M_{${n}}=2\operatorname{area}(\Pi_{${n}})=${s.intersection}.
\frac{A_{${n}}}{${n}^2}=\frac{1}{${2*wx*wy}},\quad \frac{N_{${n}}}{${n}^2}=\frac{${s.count}}{${n*n}},\quad \frac{M_{${n}}}{${n}^2}=\frac{${s.intersection}}{${n*n}}.
M_n=\sup\{\dim_k k[x,y]/(P,Q)<\infty:P,Q\in(\gamma_w)_{\le n}\}\quad(k\text{ infinite}).
\deg_{k[x,y]}(\gamma_w,\gamma_w)=\sup_{\dim_k k[x,y]/(P,Q)<\infty}\frac{\dim_k k[x,y]/(P,Q)}{\gamma_w(P)\gamma_w(Q)}=\frac{1}{${wx*wy}}.
2!\lim_{n\to\infty}\frac{N_n}{n^2}=\lim_{n\to\infty}\frac{M_n}{n^2}=2\operatorname{area}(\Delta_w)=\frac{1}{${wx*wy}}.
% The denominator n^2 uses common budgets, not necessarily the actual ECO values of P and Q.`;
   },
   rows:()=>{const {n,wx,wy}=geometryState();return [['i','j','monomial','weight_x','weight_y','weighted_degree','ECO_value'],...eco.monomials(n,wx,wy).map(p=>[p.i,p.j,eco.monomial(p.i,p.j),wx,wy,wx*p.i+wy*p.j,Math.max(1,wx*p.i+wy*p.j)])];},
   comparisonRows:geometryComparisonRows,svg:()=>$('#monomial-svg')
  });
  $('#geometry-comparison-csv').addEventListener('click',()=>K.textFile(K.csv(geometryComparisonRows()),'eco-geometry-comparison.csv','text/csv;charset=utf-8'));
 }
 if($('#eco-arithmetic'))K.mount($('#eco-arithmetic'),{
  state:()=>({n:K.number($('#height-bound-number').value,1,4),a:K.integer($('#rational-a').value,-1000,1000),b:K.integer($('#rational-b').value,1,1000),window:$('#rational-window').value}),
  restore:s=>{const n=K.number(s.n,1,4),a=K.integer(s.a,-1000,1000),b=K.integer(s.b,1,1000);input('height-bound-number',n);input('rational-a',a);input('rational-b',b);input('rational-window',['central','all','unit'].includes(s.window)?s.window:'central');},
  latex:()=>{const n=Number($('#height-bound-number').value);return String.raw`\eta(a/b)=\max\{1,\log\max(|a|,b)\},\quad \gcd(|a|,b)=1,\ b>0,\quad \eta(a/b)\le ${n}\iff \max(|a|,b)\le ${Math.floor(Math.exp(n))}.
% This rational-height illustration fails the ECO coarse-addition axiom on Q.`;},
  rows:()=>[['numerator','denominator','value','H_exact','h_approx','eta_approx'],...eco.rationalPoints(Math.floor(Math.exp(Number($('#height-bound-number').value)))).map(p=>[p.a,p.b,p.value,p.H,p.h,p.eta])],svg:()=>$('#rational-svg')
 });
 if($('#eco-limits'))K.mount($('#eco-limits'),{
  state:()=>({n:Number($('#limit-n').value)}),restore:s=>input('limit-n',K.integer(s.n,1,40)),
  latex:()=>{const n=Number($('#limit-n').value);return '\\frac{\\dim_k\\gamma_{\\le '+n+'}}{'+n+'^2}=\\frac{'+((n+1)*(n+2))+'}{'+(2*n*n)+'},\\qquad \\lim_{n\\to\\infty}\\frac{\\dim_k\\gamma_{\\le n}}{n^2}=\\frac12.';},
  rows:()=>{const n=Number($('#limit-n').value);return [['i','j','i/n','j/n'],...window.ECOMath.monomials(n).map(p=>[p.i,p.j,p.i/n,p.j/n])];},svg:()=>$('#limit-svg')
 });
 if($('#story-nails'))K.mount($('#story-nails'),{
  state:()=>({a:!$('#remove-a').disabled,b:!$('#remove-b').disabled}),
  restore:s=>{$('#reset-nails').click();if(s.a===false)$('#remove-a').click();if(s.b===false)$('#remove-b').click();},
  latex:()=>{const a=!$('#remove-a').disabled,b=!$('#remove-b').disabled;return a&&b?'[a,b]=aba^{-1}b^{-1}\\ne1\\quad\\text{in }F(a,b).':!a&&b?'a\\mapsto1,\\quad aba^{-1}b^{-1}\\mapsto bb^{-1}=1.':a&&!b?'b\\mapsto1,\\quad aba^{-1}b^{-1}\\mapsto aa^{-1}=1.':'a,b\\mapsto1,\\quad [a,b]\\mapsto1.';},
  rows:()=>[['left_nail_present','right_nail_present','result'],[!$('#remove-a').disabled,!$('#remove-b').disabled,$('#nail-word').textContent]]
 });
 if($('#story-doughnuts'))K.mount($('#story-doughnuts'),{
  state:()=>({theta:Number($('#angle-theta').value),phi:Number($('#angle-phi').value)}),
  restore:s=>{input('angle-theta',K.integer(s.theta,0,360));input('angle-phi',K.integer(s.phi,0,360));},
  latex:()=>'(\\theta,\\phi)=('+$('#angle-theta').value+'^\\circ,'+$('#angle-phi').value+'^\\circ),\\quad ((2+\\cos\\phi)\\cos\\theta,(2+\\cos\\phi)\\sin\\theta,\\sin\\phi).',
  rows:()=>{const t=Number($('#angle-theta').value),p=Number($('#angle-phi').value),point=window.ECOMath.torus(t*Math.PI/180,p*Math.PI/180);return [['theta_degrees','phi_degrees','x_approx','y_approx','z_approx'],[t,p,point.x,point.y,point.z]];},svg:()=>$('#torus-svg')
 });
})();
