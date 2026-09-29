/* Source-specific polynomial ensembles and numerical complex zeros.
   Coefficients are stored from constant term to leading term. */
(function(root){'use strict';
 const C=(re=0,im=0)=>({re,im}),add=(a,b)=>C(a.re+b.re,a.im+b.im),sub=(a,b)=>C(a.re-b.re,a.im-b.im),mul=(a,b)=>C(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),scale=(a,t)=>C(a.re*t,a.im*t),abs=a=>Math.hypot(a.re,a.im);
 const div=(a,b)=>{const s=Math.max(Math.abs(b.re),Math.abs(b.im));if(s===0)return C(Infinity,Infinity);const x=b.re/s,y=b.im/s,d=x*x+y*y;return C((a.re/s*x+a.im/s*y)/d,(a.im/s*x-a.re/s*y)/d);};
 const sqrt=a=>{const m=abs(a);if(m===0)return C();if(a.re>=0){const x=Math.sqrt((m+a.re)/2);return C(x,a.im/(2*x));}const y=Math.sqrt((m-a.re)/2)*(a.im<0?-1:1);return C(a.im/(2*y),y);};
 const finite=z=>Number.isFinite(z.re)&&Number.isFinite(z.im);
 function binomial(n,k){let v=1n;for(let j=1;j<=k;j++)v=v*BigInt(n-j+1)/BigInt(j);return v;}
 function isqrt(n){if(n<2n)return n;let x=n,y=(x+1n)/2n;while(y<x){x=y;y=(x+n/x)/2n;}return x;}
 function coefficientBounds(n,r,model){if(!Number.isInteger(n)||n<1||n>24||!Number.isFinite(r)||r<=0)throw Error('Invalid sampler parameters.');return Array.from({length:n+1},(_,k)=>{
  if(model==='report'){const u=BigInt(Math.round(r*10));return Number(isqrt(u*u*binomial(n,k))/10n);}
  const bound=Math.floor(Math.exp(n*r)*Math.sqrt(Number(binomial(n,k))));if(!Number.isSafeInteger(2*bound+1))throw Error('Coefficient budget too large.');return bound;
 });}
 function randomInteger(span){if(!Number.isSafeInteger(span)||span<1)throw Error('Invalid random range.');const crypto=root.crypto;
  if(crypto&&crypto.getRandomValues){const words=new Uint32Array(2),space=9007199254740992,limit=Math.floor(space/span)*span;let x;do{crypto.getRandomValues(words);x=(words[0]&2097151)*4294967296+words[1];}while(x>=limit);return x%span;}
  return Math.floor(Math.random()*span);
 }
 function samplePolynomial(n,r,model,random=randomInteger){const bounds=coefficientBounds(n,r,model);return bounds.map((B,k)=>{if(model==='paper'&&k===n){const j=random(2*B);return j<B?j-B:j-B+1;}return random(2*B+1)-B;});}
 function ensembleSize(bounds,model){return bounds.reduce((s,B,k)=>s*BigInt(model==='paper'&&k===bounds.length-1?2*B:2*B+1),1n);}
 function actualDegree(a){let d=a.length-1;while(d>=0&&a[d]===0)d--;return d;}
 function bombieriNorm(a,n){return Math.max(...a.map((v,k)=>Math.abs(v)/Math.sqrt(Number(binomial(n,k)))));}
 const sup=n=>String(n).replace(/\d/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]);
 function polynomialText(a){let out='';for(let k=a.length-1;k>=0;k--){const v=a[k];if(!v)continue;const magnitude=Math.abs(v);out+=(out?(v<0?' − ':' + '):(v<0?'−':''))+(k===0||magnitude!==1?String(magnitude):'')+(k?'X'+(k>1?sup(k):''):'');}return out||'0';}
 function evaluate(a,z){let p=a[a.length-1],dp=C(),dd=C(),den=abs(p),r=abs(z);for(let k=a.length-2;k>=0;k--){dd=add(mul(dd,z),dp);dp=add(mul(dp,z),p);p=add(mul(p,z),a[k]);den=den*r+abs(a[k]);}return {p,dp,dd,error:abs(p)/Math.max(den,Number.MIN_VALUE)};}
 function laguerre(a,start){const d=a.length-1;let z=start,best=z,error=Infinity;
  for(let iteration=0;iteration<180;iteration++){
   const e=evaluate(a,z);if(e.error<error){error=e.error;best=z;}if(e.error<8e-15)return {z,error:e.error};
   const G=div(e.dp,e.p),G2=mul(G,G),H=sub(G2,scale(div(e.dd,e.p),2)),rad=sqrt(scale(sub(scale(H,d),G2),d-1));const plus=add(G,rad),minus=sub(G,rad),den=abs(plus)>abs(minus)?plus:minus;
   let delta=abs(den)>1e-300?div(C(d),den):C(Math.cos(iteration)*(.5+abs(z)),Math.sin(iteration)*(.5+abs(z)));
   if(iteration%12===11)delta=scale(delta,.5);const next=sub(z,delta);if(!finite(next))break;if(abs(sub(next,z))<2e-15*(1+abs(z)))return {z:next,error:evaluate(a,next).error};z=next;
  }return {z:best,error};
 }
 function normalizedResidual(a,z){const max=Math.max(...a.map(Math.abs));return max?evaluate(a.map(v=>C(v/max)),z).error:NaN;}
 function polynomialRoots(coefficients){let a=coefficients.slice(),degree=actualDegree(a);if(degree<0)return {degree,roots:[],residual:null,status:'zero'};a=a.slice(0,degree+1);if(degree===0)return {degree,roots:[],residual:0,status:'constant'};
  const roots=[];while(a.length>1&&a[0]===0){roots.push(C());a.shift();}
  if(a.length===1)return {degree,roots,residual:0,status:'ok'};
  const max=Math.max(...a.map(Math.abs)),original=a.map(v=>C(v/max));let active=original.slice();
  while(active.length>1){const d=active.length-1;let found;
   if(d===1)found={z:scale(div(active[0],active[1]),-1),error:0};
   else{found=laguerre(active,C());for(let attempt=1;found.error>1e-12&&attempt<=5;attempt++){const radius=attempt===1?1:.5+attempt,angle=attempt===1?0:attempt*2.399963229728653,other=laguerre(active,C(radius*Math.cos(angle),radius*Math.sin(angle)));if(other.error<found.error)found=other;}}
   if(!found||!finite(found.z))return {degree,roots:[],residual:null,status:'failed'};
   const z=found.z;roots.push(z);const q=Array(d);q[d-1]=active[d];for(let k=d-2;k>=0;k--)q[k]=add(active[k+1],mul(z,q[k+1]));active=q;
  }
  // Refine against the original polynomial rather than only deflated coefficients.
  const full=coefficients.slice(0,degree+1),fullMax=Math.max(...full.map(Math.abs)),fullC=full.map(v=>C(v/fullMax));
  for(let i=0;i<roots.length;i++){if(roots[i].re===0&&roots[i].im===0)continue;const old=evaluate(fullC,roots[i]).error,polished=laguerre(fullC,roots[i]);if(polished.error<=old)roots[i]=polished.z;const z=roots[i];if(Math.abs(z.im)<1e-9*(1+Math.abs(z.re))&&evaluate(fullC,C(z.re)).error<1e-12)roots[i]=C(z.re);}
  roots.sort((a,b)=>a.re-b.re||a.im-b.im);const residual=Math.max(...roots.map(z=>evaluate(fullC,z).error));let reconstructed=[C(full[degree]/fullMax)];for(const z of roots){const next=Array.from({length:reconstructed.length+1},()=>C());reconstructed.forEach((v,k)=>{next[k]=sub(next[k],mul(z,v));next[k+1]=add(next[k+1],v);});reconstructed=next;}const reconstructionError=Math.max(...reconstructed.map((z,k)=>abs(sub(z,fullC[k]))));return {degree,roots,residual,reconstructionError,status:Number.isFinite(residual)&&residual<1e-9&&reconstructionError<1e-7?'ok':'uncertain'};
 }
 function maninBound(g){if(!Number.isInteger(g)||g<2)throw Error('Genus must be an integer at least two.');return g===2?76:g===3?231:Math.floor((16*g**4+37*g*g-28*g-1)/(g-1)**2);}
 const simpleManinBound=g=>16*g*g+32*g+124;
 // Wilms, arXiv:2601.15271v1, Theorem 1.1. Natural logarithms;
 // the Faltings metric is induced by (i/2) integral eta wedge conjugate(eta').
 const FALTINGS_MAX_N=10001,faltingsCache=new Map();
 function checkFaltingsN(n){if(!Number.isInteger(n)||n<3||n>FALTINGS_MAX_N||n%2===0)throw Error('Choose an odd integer n from 3 to '+FALTINGS_MAX_N+'.');}
 function primeFactors(n){const out=[];let remaining=n;for(let p=2;p*p<=remaining;p+=p===2?1:2){if(remaining%p)continue;let exponent=0;while(remaining%p===0){remaining/=p;exponent++;}out.push({p,exponent});}if(remaining>1)out.push({p:remaining,exponent:1});return out;}
 function logGamma(z){
  if(!(z>0))throw Error('The gamma argument must be positive.');
  // Shift small arguments instead of using a reflection formula near zero.
  if(z<.5)return logGamma(z+1)-Math.log(z);
  const coefficients=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  z-=1;let x=.99999999999980993;for(let i=0;i<coefficients.length;i++)x+=coefficients[i]/(z+i+1);const t=z+7.5;
  return .9189385332046727+(z+.5)*Math.log(t)-t+Math.log(x);
 }
 function exactFraction(a,b){let x=a<0n?-a:a,y=b;while(y){const t=x%y;x=y;y=t;}return {num:(a/x).toString(),den:(b/x).toString()};}
 function faltingsExact(n){checkFaltingsN(n);const g=(n-1)/2,terms=primeFactors(n).map(({p,exponent:e})=>{const P=BigInt(p),E=BigInt(e),d=P**(2n*E-1n)*(P*P-1n);return {p,...exactFraction(BigInt(n)*(E*d+P**(2n*E)-1n),8n*d)};});return {n,g,terms,pi:exactFraction(BigInt(g),2n),two:exactFraction(BigInt(g),BigInt(2*n))};}
 function faltingsHeight(n){checkFaltingsN(n);if(faltingsCache.has(n))return faltingsCache.get(n);const g=(n-1)/2,factors=primeFactors(n);
  const primeTerm=n/8*factors.reduce((s,{p,exponent:e})=>s+(p**(2*e)-1)/(p**(2*e-1)*(p*p-1))*Math.log(p),0);
  let gammaSum=0,correction=0;for(let j=1;j<=g;j++){const x=(2*j-1)/(2*n),term=logGamma(x)-logGamma(x+.5),y=term-correction,t=gammaSum+y;correction=(t-gammaSum)-y;gammaSum=t;}
  const leading=n/8*Math.log(n),height=primeTerm+leading-g/2*Math.log(Math.PI)+g/(2*n)*Math.LN2-gammaSum;
  const result={n,g,height,factors,primeTerm,leading,gammaSum};faltingsCache.set(n,result);return result;
 }
 function faltingsInterval(a,b){if(!Number.isInteger(a)||!Number.isInteger(b)||a<3||b>FALTINGS_MAX_N||a>b)throw Error('Use integer endpoints with 3 ≤ a ≤ b ≤ '+FALTINGS_MAX_N+'.');const first=a%2?a:a+1,last=b%2?b:b-1;if(first>last)throw Error('This interval contains no odd integer n.');return {a,b,first,last,count:(last-first)/2+1};}
 // Theorem 1.1, arXiv:1903.12159v2, with alpha = omega/(2g-2).
 // Coefficients multiply Omega = omega-hat^2/[K:Q] and Phi = phi(X)/[K:Q].
 function cycleHeightExact(g,values){
  if(!Number.isInteger(g)||g<2||g>30)throw Error('Choose an integer genus from 2 to 30.');
  const r=values.length;
  if(r<1||r>g)throw Error('Choose 1 ≤ r ≤ g.');
  const m=values.map((value,index)=>{
   const text=String(value).trim();
   if(!/^[+-]?\d{1,40}$/.test(text)||BigInt(text)===0n)throw Error('m'+String(index+1)+' must be a nonzero integer (at most 40 digits).');
   return BigInt(text);
  });
  const G=BigInt(g),R=BigInt(r),sum=m.reduce((a,b)=>a+b,0n),squares=m.reduce((a,b)=>a+b*b,0n),pairs=(sum*sum-squares)/2n;
  let omega,phi;
  if(r===g){omega=exactFraction(0n,1n);phi=exactFraction(0n,1n);}
  else if(r===1){omega=exactFraction(squares,8n*(G-1n));phi=exactFraction(0n,1n);}
  else{
   omega=exactFraction((G-R)*(3n*G*(G-2n)*squares-2n*(2n*G+1n)*pairs),24n*G*(G-1n)**2n*(G-2n));
   phi=exactFraction((G-R)*pairs,6n*G*(G-1n)*(G-2n));
  }
  return {g,r,m:m.map(String),sum:String(sum),squares:String(squares),pairs:String(pairs),omega,phi};
 }
 root.ResearchMath={cycleHeightExact,binomial,coefficientBounds,samplePolynomial,ensembleSize,actualDegree,bombieriNorm,polynomialText,polynomialRoots,normalizedResidual,maninBound,simpleManinBound,randomInteger,FALTINGS_MAX_N,primeFactors,logGamma,faltingsExact,faltingsHeight,faltingsInterval};
 if(typeof module!=='undefined')module.exports=root.ResearchMath;
})(typeof window!=='undefined'?window:globalThis);
