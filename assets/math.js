/* Exact finite counts and mathematical models used by the experiments. */
(function(root){'use strict';
 const monomials=(n,wx=1,wy=1)=>{
  if(!Number.isSafeInteger(n)||n<0||!Number.isSafeInteger(wx)||wx<1||!Number.isSafeInteger(wy)||wy<1)throw Error('Use a nonnegative integer bound and positive integer weights.');
  const a=[];for(let j=0;j<=Math.floor(n/wy);j++)for(let i=0;i<=Math.floor((n-wy*j)/wx);i++)a.push({i,j});return a;
 };
 const superscript=n=>String(n).replace(/\d/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]);
 const monomial=(i,j)=>i+j===0?'1':(i?'x'+(i>1?superscript(i):''):'')+(j?'y'+(j>1?superscript(j):''):'');
 const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const r=a%b;a=b;b=r;}return a;};
 const fraction=(a,b=1)=>{const d=gcd(a,b);return b/d===1?String(a/d):(a/d)+'/'+(b/d);};
 // Exact integer convex hull and twice-area; no floating-point geometry is needed.
 const integerHull=points=>{
  const sorted=points.slice().sort((a,b)=>a.i-b.i||a.j-b.j);
  if(sorted.length<=1)return sorted;
  const cross=(o,a,b)=>(a.i-o.i)*(b.j-o.j)-(a.j-o.j)*(b.i-o.i);
  const half=list=>{const h=[];for(const p of list){while(h.length>=2&&cross(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}return h;};
  const lower=half(sorted),upper=half(sorted.slice().reverse());lower.pop();upper.pop();return lower.concat(upper);
 };
 const ecoGeometry=(n,wx=1,wy=1)=>{
  if(!Number.isSafeInteger(n)||n<1)throw Error('Use a positive integer ECO bound.');
  const points=monomials(n,wx,wy),hull=integerHull(points);
  const intersection=Math.abs(hull.reduce((s,p,i)=>{const q=hull[(i+1)%hull.length];return s+p.i*q.j-p.j*q.i;},0));
  return {n,wx,wy,points,hull,count:points.length,intersection,areaNumerator:n*n,areaDenominator:2*wx*wy,
   area:n*n/(2*wx*wy),normalizedArea:1/(2*wx*wy),normalizedCount:points.length/(n*n),normalizedIntersection:intersection/(n*n),degree:1/(wx*wy)};
 };
 const rational=(a,b)=>{if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b===0)return null;const d=gcd(a,b),sign=b<0?-1:1;a=a/d*sign;b=Math.abs(b/d);const H=Math.max(Math.abs(a),b),h=Math.log(H);return {a,b,value:a/b,H,h,eta:Math.max(1,h),label:b===1?String(a):a+'/'+b};};
 const rationalPoints=B=>{const points=[];for(let b=1;b<=B;b++)for(let a=-B;a<=B;a++)if(gcd(a,b)===1)points.push(rational(a,b));return points.sort((x,y)=>x.a*y.b-y.a*x.b);};
 const rationalCount=B=>{const phi=Array.from({length:B+1},(_,i)=>i);for(let p=2;p<=B;p++)if(phi[p]===p)for(let j=p;j<=B;j+=p)phi[j]-=phi[j]/p;return 4*phi.slice(1).reduce((s,x)=>s+x,0)-1;};
 const invariantBound=(g,model='general')=>{let H=0;for(let k=1;k<=g;k++)H+=1/k;return model==='hyperelliptic'?g*(H-1)/2:(g*(g+2)-(2*g+1)*H)/(g-1);};
 const torus=(theta,phi)=>{const x=(2+Math.cos(phi))*Math.cos(theta),y=(2+Math.cos(phi))*Math.sin(theta),z=Math.sin(phi);return {x,y,z,sx:300+72*(.88*x-.47*y),sy:164+45*(.47*x+.88*y)-65*z};};
 root.ECOMath={monomials,monomial,gcd,fraction,integerHull,ecoGeometry,rational,rationalPoints,rationalCount,invariantBound,torus};
 if(typeof module!=='undefined')module.exports=root.ECOMath;
})(typeof window!=='undefined'?window:globalThis);
