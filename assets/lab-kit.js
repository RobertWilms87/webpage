(function(){'use strict';
 const controllers=new Map();
 const paths={home:'index.html',research:'research/index.html',lab:'lab/index.html',eco:'eco/index.html',heights:'heights/index.html',zeros:'zeros/index.html',bounds:'bounds/index.html',teaching:'teaching/index.html',about:'about/index.html'};
 function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);return b;}
 function textFile(content,name,type='text/plain;charset=utf-8'){
  const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);
 }
 async function copy(text){
  try{if(!navigator.clipboard||!window.isSecureContext)throw Error('Select and copy');await navigator.clipboard.writeText(String(text));}
  catch{const dialog=document.getElementById('copy-dialog'),field=document.getElementById('copy-text');document.getElementById('copy-heading').textContent='Copy text';field.value=String(text);if(!dialog.open)dialog.showModal();field.focus();field.select();}
 }
 function encode(value){const bytes=new TextEncoder().encode(JSON.stringify(value));let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
 function decode(value){if(value.length>24000)throw Error('This shared state is too large.');const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));}
 function csv(rows){return rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n';}
 function fraction(c){return c.den==='1'?c.num:'\\frac{'+c.num+'}{'+c.den+'}';}
 function svgFile(svg,name){
  if(!svg||!svg.children.length)throw Error('Create a plot before exporting.');
  const clone=svg.cloneNode(true),original=[svg,...svg.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
  original.forEach((node,i)=>{const style=getComputedStyle(node);for(const k of ['fill','fill-opacity','stroke','stroke-width','stroke-dasharray','stroke-opacity','opacity','font-family','font-size','font-weight','text-anchor','dominant-baseline'])copies[i].style.setProperty(k,style.getPropertyValue(k));copies[i].removeAttribute('tabindex');});
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');const box=svg.getAttribute('viewBox').split(/\s+/).map(Number);clone.setAttribute('width',box[2]);clone.setAttribute('height',box[3]);
  const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');bg.setAttribute('x',box[0]);bg.setAttribute('y',box[1]);bg.setAttribute('width',box[2]);bg.setAttribute('height',box[3]);bg.setAttribute('fill',getComputedStyle(document.body).backgroundColor);clone.insertBefore(bg,clone.firstChild);
  textFile('<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(clone),name,'image/svg+xml;charset=utf-8');
 }
 function sharedURL(section,state){
  const page=section.closest('[data-view]').dataset.view,bundle=document.body.dataset.bundle==='true';
  const url=location.protocol==='file:'?new URL(paths[page], 'https://www.robert-wilms.de/'):new URL(location.href);
  url.search='';url.searchParams.set('experiment',section.id);url.searchParams.set('state',encode({v:1,...state}));url.hash=(bundle&&location.protocol!=='file:'?page+'/':'')+section.id;return url.href;
 }
 function mount(section,api){
  if(!section||!section.id||controllers.has(section.id))return;
  controllers.set(section.id,api);const defaults=JSON.parse(JSON.stringify(api.state()));
  const toolbar=document.createElement('div');toolbar.className='lab-actions js-only';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Share and export this experiment');
  const status=document.createElement('p');status.className='lab-action-status';status.setAttribute('role','status');
  const run=fn=>async()=>{try{status.textContent='';await fn();}catch(e){status.textContent=e.message||'This action could not be completed.';}};
  toolbar.appendChild(button('Copy experiment link',run(async()=>{await copy(sharedURL(section,api.state()));status.textContent=location.protocol==='file:'?'Link copied for www.robert-wilms.de; it will work after this version is hosted there.':'Experiment link copied.';})));
  if(api.latex)toolbar.appendChild(button('Copy LaTeX',run(async()=>{await copy(api.latex());status.textContent='Exact formula copied.';})));
  if(api.rows)toolbar.appendChild(button('Download CSV',run(()=>textFile(csv(api.rows()),section.id+'.csv','text/csv;charset=utf-8'))));
  if(api.svg)toolbar.appendChild(button('Download SVG',run(()=>svgFile(api.svg(),section.id+'.svg'))));
  toolbar.appendChild(button('Reset example',run(()=>api.restore(JSON.parse(JSON.stringify(defaults))))));
  section.appendChild(toolbar);section.appendChild(status);
  api.sharedURL=()=>sharedURL(section,api.state());api.toolbar=toolbar;
  const params=new URLSearchParams(location.search);
  if(params.get('experiment')===section.id&&params.has('state')){
   Promise.resolve().then(async()=>{try{const state=decode(params.get('state'));if(!state||state.v!==1)throw Error('Unsupported experiment link.');await api.restore(state);status.textContent='Shared experiment restored.';window.dispatchEvent(new Event('hashchange'));}catch(e){status.textContent='Could not restore this experiment: '+e.message;}});
  }
 }
 function integer(value,min,max){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw Error('Use an integer from '+min+' to '+max+'.');return n;}
 function number(value,min,max){const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw Error('Use a number from '+min+' to '+max+'.');return n;}
 // A documented, repeatable 32-bit pseudorandom stream with rejection sampling.
 // Two words produce an unbiased 53-bit integer before reduction to a coefficient range.
 function seededRandom(seed){let state=integer(seed,0,4294967295)>>>0;const word=()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return (t^(t>>>14))>>>0;};return span=>{if(!Number.isSafeInteger(span)||span<1)throw Error('Invalid sampling range.');const space=9007199254740992,limit=Math.floor(space/span)*span;let x;do{x=(word()&2097151)*4294967296+word();}while(x>=limit);return x%span;};}
 function seed(){return window.ResearchMath.randomInteger(4294967296);}
 window.LabKit={mount,controllers,copy,textFile,csv,fraction,svgFile,sharedURL,encode,decode,integer,number,seededRandom,seed};
})();
