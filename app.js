/* Shared logic for all pages. Data comes from data.js (window.SITE). No external dependencies (map page loads Leaflet itself, optional). */
(function(){
"use strict";
const S = window.SITE, RAW = S.RAW, PH = RAW.PH, CMP = RAW.CMP, EX = S.EX, SN = S.SNAP;
const ph = v => typeof v === "number" ? PH[v] : v;
const CITIES = ["תל אביב","רמת גן"], GCODE = ["main","suspicious","nodata","nodate"], VCODE = ["buy","check","skip"];
const CITY_PAGE = {"תל אביב":"tel-aviv.html","רמת גן":"ramat-gan.html"};
const DKL = ["","יד2 (createdAt)","doortodoor (תאריך מקור)","ad.co.il (תאריך יצירה)","הערכה לפי תמונות"];
const iso6 = n => { if(!n) return ""; const s=String(n); return "20"+s.slice(0,2)+"-"+s.slice(2,4)+"-"+s.slice(4,6); };
const dmy = (n,short) => { if(!n) return ""; const s=String(n); return s.slice(4,6)+"/"+s.slice(2,4)+"/"+(short?s.slice(0,2):"20"+s.slice(0,2)); };
const isoDmy = s => s ? s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4) : "";
const decUrl = u => {
  if (u[0]==="y") return ["יד2","https://www.yad2.co.il/realestate/item/tel-aviv-area/"+u.slice(1)];
  if (u[0]==="d") return ["doortodoor","https://doortodoor.ltd/property-page/"+u.slice(1)];
  const lab = u.includes("madlan")?"מדלן":u.includes("komo")?"קומו":u.includes("homeless")?"הומלס":u.includes("ad.co.il")?"ad.co.il":"מקור";
  return [lab,u];
};
const NBV = "לבדוק לעומק – בניין חדש עם הנחה גדולה מהרגיל; לוודא שטח, קומה וזכויות לפני שסומכים עליה.";
const nf = n => Math.round(n).toLocaleString("he-IL");
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = id => document.getElementById(id);
const med = v => { const s=[...v].sort((a,b)=>a-b); return s.length===0?0:s[Math.floor(s.length/2)]; };
const GEN = new Date(S.generatedAt+"T12:00:00").getTime();
const daysBetween = (a,b) => (new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000;
const TODAY = GEN;
const VL = {buy:"שווה לקנות",check:"לבדוק לעומק",skip:"לדלג"};
const BIALIK = "מבוקש 1,990,000 ₪ ל-70 מ״ר (ירד מ-2,090,000). בדיקה מעמיקה: דירות 3 חדרים ישנות באותו קטע של ביאליק נמכרו ב-2.05–2.58 מ׳ ₪ (חציון כ-2.4 מ׳). אחרי התאמה לשטח רשום (כ-60–63 מ״ר) ולמצב: שווי הוגן 2.25–2.5 מ׳ ₪, כלומר הנחה אמיתית 12%–20% (ההשוואה האוטומטית של 33% נבעה מבניינים חדשים). שכירות כ-5,200 ₪ בחודש, תשואה ברוטו כ-3.1% – עסקת פינוי־בינוי ולא עסקת תשואה.";
const GENERIC = "שטח המודעה כנראה ברוטו מול שטח רשום ברשות המסים – ההנחה הריאלית קטנה בכ-5–10 נק׳";

/* ---------- model ---------- */
const AREAS = RAW.AR.map(a => ({city:CITIES[a[0]],name:a[1],n:a[2],nm:a[3],med:a[4],nd:a[5],p25:a[6],p75:a[7],ask:a[8],ask25:a[9],ask75:a[10],nask:a[11],ren:a[12],best:a[13],bestscore:a[14],avgdisc:a[15]}));
const bandOf = rm => rm==null ? null : rm<=2 ? "1-2" : rm<=3 ? "2.5-3" : rm<=4 ? "3.5-4" : "4.5+";
const ITEMS = RAW.I.map(r => {
  const ar = AREAS[r[2]], ci = r[11], rd = r[12], cmp = ci>=0 ? CMP[ci] : null, links = r[17].map(decUrl), id = r[17][0];
  const nb = r[18]===0 && r[9]>=25 && r[15]===0;
  const ex = EX[id] || {}, sn = (SN.listings[id]) || {firstSeen:S.generatedAt, priceHistory:[[S.generatedAt,r[7]]]};
  const x = {id, k:r[0],s:r[1],c:ar.city,h:ar.name,a:r[3],rm:r[4]<0?null:r[4],q:r[5],f:r[6],p:r[7],pp:Math.round(r[7]/r[5]),ep:r[8],e:r[8]*r[5],am:ar.med,an:ar.nd,d:r[9],
   dr:r[9]>=10?"כ-"+Math.max(0,r[9]-10)+"%–"+Math.max(0,r[9]-5)+"%":r[9]+"%",dt:dmy(r[10],false),di:iso6(r[10]),dk:DKL[r[21]],
   rn:cmp?cmp[0]+(cmp[4]===1?" (מאושר)":" (בתכנון)"):"",rd:rd,rw:r[13]===1,g:GCODE[r[14]],vk:nb?"check":VCODE[r[15]],vt:nb?NBV:ph(r[16]),
   u:links[0][1],l:links,sc:r[20],age:r[18],yb:r[19],st:r[22],cm:r[23].map(c=>({dt:dmy(c[0],true),rm:c[1],q:c[2],p:c[3],yb:c[4],dist:c[5]})),
   wc:r[24].map(ph),rs:r[25].map(ph),ut:r[26],x:r[27],ci:ci,src:links[0][0],ex,sn};
  // net area / realistic discount (estimates unless netk==="listing")
  x.net = ex.net || Math.round(x.q*0.85); x.netk = ex.netk || "est";
  x.ppn = Math.round(x.p/x.net);
  x.rd2 = x.ep ? Math.round((1 - x.ppn/x.ep)*100) : null;
  // rent / yield
  if (x.x==="BIALIK") x.rent = {med:5200, manual:true};
  else if (ex.rent) x.rent = ex.rent;
  x.yld = x.rent ? x.rent.med*12/x.p*100 : null;
  const band = bandOf(x.rm), cb = band && S.CBS.data[x.c] ? S.CBS.data[x.c][band] : null;
  x.cbs = cb; x.yldC = cb ? cb*12/x.p*100 : null;
  // badges
  const hist = sn.priceHistory || [];
  x.hist = hist;
  x.isNew = sn.firstSeen > S.baseline && daysBetween(sn.firstSeen, S.generatedAt) <= 7;
  x.drop = null;
  if (hist.length>=2){ const a=hist[hist.length-2], b=hist[hist.length-1];
    if (b[1]<a[1] && b[0] > S.baseline && daysBetween(b[0], S.generatedAt) <= 14) x.drop = Math.round((a[1]-b[1])/a[1]*1000)/10; }
  return x;
});
const ITEM_BY_ID = {}; ITEMS.forEach(x=>ITEM_BY_ID[x.id]=x);
const byG = g => ITEMS.filter(x=>x.g===g);
const RES = (window.RESEARCH && typeof window.RESEARCH==="object") ? window.RESEARCH : {};
const hasRes = id => !!RES[id];
const rqShow = id => isFav(id) || hasRes(id);

/* ---------- favorites & notes (localStorage) ---------- */
const FKEY = "rs_fav_v1", MKEY = "rs_mort_v1";
let FAV = {};
try { FAV = JSON.parse(localStorage.getItem(FKEY)||"{}") || {}; } catch(e){ FAV = {}; }
const saveFav = () => { try { localStorage.setItem(FKEY, JSON.stringify(FAV)); } catch(e){} };
const isFav = id => !!(FAV[id] && FAV[id].fav);
const favCount = () => Object.values(FAV).filter(r=>r.fav).length;
function updateFavUI(){
  document.querySelectorAll(".star[data-id]").forEach(b=>{ const on=isFav(b.dataset.id); b.classList.toggle("on",on); b.textContent=on?"★":"☆"; b.setAttribute("aria-pressed",on); });
  const n=favCount(), el=$("favN"); if (el) el.textContent = n?n:"";
}
function toggleFav(id){
  const r = FAV[id] || {note:""}; r.fav = !r.fav; r.t = r.t || Date.now();
  if (!r.fav && !r.note) delete FAV[id]; else FAV[id]=r;
  saveFav(); updateFavUI();
}
function setNote(id,txt){
  const r = FAV[id] || {fav:false}; r.note = txt; r.t = r.t || Date.now();
  if (!r.fav && !txt) delete FAV[id]; else FAV[id]=r;
  saveFav();
}
/* ---------- mortgage ---------- */
let MORT = Object.assign({down:25,rate:4.5,years:25}, S.MORT||{});
try { Object.assign(MORT, JSON.parse(localStorage.getItem(MKEY)||"{}")); } catch(e){}
function mortCalc(p,m){
  const down = Math.min(100,Math.max(0,+m.down||0)), loan = p*(1-down/100), n = Math.max(1,(+m.years||1))*12, r = (+m.rate||0)/1200;
  const pay = r>0 ? loan*r/(1-Math.pow(1+r,-n)) : loan/n;
  return {equity:p*down/100, loan, pay, total:pay*n};
}
function mortOut(box){
  const p = +box.dataset.p, v = {down:box.querySelector('[data-f=down]').value, rate:box.querySelector('[data-f=rate]').value, years:box.querySelector('[data-f=years]').value};
  const o = mortCalc(p,v);
  box.querySelector(".mo").innerHTML = `הון עצמי נדרש: <b>${nf(o.equity)} ₪</b> · הלוואה: ${nf(o.loan)} ₪ · החזר חודשי: <b>${nf(o.pay)} ₪</b>`;
}
function mortHtml(x){
  return `<div class="mort" data-p="${x.p}"><h4>מחשבון משכנתא <span class="est">להמחשה בלבד</span></h4>
   <div class="mg"><div><label>הון עצמי %</label><input type="number" inputmode="decimal" min="0" max="100" step="1" data-f="down" value="${MORT.down}"></div>
   <div><label>ריבית שנתית %</label><input type="number" inputmode="decimal" min="0" max="20" step="0.1" data-f="rate" value="${MORT.rate}"></div>
   <div><label>שנים</label><input type="number" inputmode="numeric" min="1" max="40" step="1" data-f="years" value="${MORT.years}"></div></div>
   <div class="mo"></div>
   <small>ברירות המחדל (25% הון עצמי, 4.5% ריבית, 25 שנה) הן הנחות להמחשה בלבד – לא הצעת מימון ולא ריבית בנק. לא כולל מס רכישה, עו״ד, תיווך ושיפוץ. ניתן לערוך; הערכים נשמרים בדפדפן.</small></div>`;
}
/* ---------- price history ---------- */
function sparkHtml(x){
  const h = x.hist; if (!h || h.length<2) return "";
  const W=140,H=34,pad=4, ts=h.map(a=>new Date(a[0]+"T12:00:00").getTime()), ps=h.map(a=>a[1]);
  const t0=Math.min(...ts), t1=Math.max(...ts), p0=Math.min(...ps), p1=Math.max(...ps);
  const X = t => t1===t0 ? W/2 : pad+(t-t0)/(t1-t0)*(W-2*pad), Y = p => p1===p0 ? H/2 : H-pad-(p-p0)/(p1-p0)*(H-2*pad);
  const pts = h.map((a,i)=>X(ts[i]).toFixed(1)+","+Y(ps[i]).toFixed(1)).join(" ");
  return `<div><b style="font-size:12.5px;color:var(--mut)">היסטוריית מחיר</b>
   <svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="גרף היסטוריית מחיר"><polyline fill="none" stroke="var(--brand)" stroke-width="2" points="${pts}"/>${h.map((a,i)=>`<circle cx="${X(ts[i]).toFixed(1)}" cy="${Y(ps[i]).toFixed(1)}" r="2.5" fill="var(--brand)"/>`).join("")}</svg>
   <div class="ph-list">${h.map(a=>isoDmy(a[0])+": "+nf(a[1])+" ₪").join(" ← ")}</div></div>`;
}
/* ---------- text ---------- */
const ren = x => x.rd<0 ? "—" : (x.rd===0?"בתוך: ":x.rd+" מ׳: ")+x.rn.split(" (")[0];
function upside(x){
  if (x.ut===1) return "בניין חדש – אין פוטנציאל התחדשות; הערך תלוי במחיר מול השוק בלבד.";
  if (x.ut===2 || x.ci<0) return "לא אותר מתחם התחדשות בקרבת הנכס; אין להניח פוטנציאל פינוי־בינוי.";
  const c = CMP[x.ci], units = c[2]&&c[3] ? ", "+c[2]+"→"+c[3]+" יח״ד" : "";
  const where = x.rd===0 ? "הנכס בתוך המתחם" : "הנכס כ-"+x.rd+" מ׳ מגבול המתחם (צריך לוודא שהבניין כלול)";
  const stt = c[4]===1 ? "תוכנית מאושרת" : "מתחם בתכנון (טרם אושר) – אופק ארוך ולא ודאי";
  let s = "מתחם "+c[0]+" – "+c[1]+units+"; "+stt+"; "+where+".";
  if (x.ut===3) s += " פוטנציאל: דירה חדשה וגדולה יותר בתמורה, אופק בדרך כלל 4–8 שנים (הערכה); הסיכון: התקדמות איטית ותלות ביזם ובדיירים.";
  else if (x.ut===4) s += " קרבה כללית בלבד או תוכנית ותיקה שאולי כבר מומשה – לא לתמחר כפוטנציאל.";
  else if (x.ut===5) s += " פוטנציאל תלוי בהכללת הבניין.";
  return s;
}
function rvText(x){
  const rv = x.ex.rv;
  if (x.c==="רמת גן") return "רמת גן: לא אותר מקור ציבורי ממוחשב ברמת הבניין (הנתון נשאר הערכה לפי מתחמי התחדשות – רשות מקרקעין דרך over.org.il). לבדוק באתר ההנדסי של העירייה.";
  if (!rv || rv.na) return "אין מספר בית מדויק – לא ניתן לאמת בניין מול מאגר העירייה.";
  if (rv.err) return "הבדיקה מול מאגר העירייה נכשלה – לא אומת.";
  const link = " (מאגר בקשות והיתרי בנייה של עיריית תל אביב, נבדק "+isoDmy(S.generatedAt)+")";
  if (rv.t38) { const t = rv.items.find(i=>i[3]==="כן") || rv.items[0]; return "נמצאה בקשה/היתר תמ״א 38 בכתובת: בקשה "+t[0]+" – "+(t[1]||"שלב לא ידוע")+" · "+t[2]+link+". לבדוק מול העירייה מה בדיוק אושר."; }
  if (rv.n) return "נמצאו "+rv.n+" בקשות/היתרים בכתובת, אף אחת לא מסומנת תמ״א 38"+link+".";
  return "לא נמצאה בקשה/היתר בכתובת במאגר העירייה"+link+" – אין בכך הוכחה שאין פוטנציאל; "+(rv.nearT?rv.nearT+" בקשות תמ״א 38 ברדיוס 80 מ׳.":"אין בקשות תמ״א 38 ברדיוס 80 מ׳.");
}
function writeup(x){
  const [cn,cmed,cR,no,cmo,sbn,sbmed,nc] = x.st;
  let why = x.x==="BIALIK" ? BIALIK : "מבוקש "+nf(x.p)+" ₪ ל-"+x.q+" מ״ר ("+nf(x.pp)+" ₪/מ״ר). "+cn+" עסקאות דומות (±1 חדר, שטח 70%–135%) ברדיוס "+cR+" מ׳ ב-2024–2026: חציון "+nf(cmed)+" ₪/מ״ר"+(no>0?"; בבניינים ישנים "+nf(cmo)+" ("+no+" עסקאות)":"")+". השווי המשוער "+nf(x.e)+" ₪ ("+nf(x.ep)+" ₪/מ״ר) – כ-"+x.d+"% מתחת לשוק, ובהתחשב בפער ברוטו/רשום "+x.dr+" (הערכה).";
  if (sbn>0) why += " השווי הותאם כלפי מטה לפי "+sbn+" עסקאות באותו בניין/צמוד (חציון "+nf(sbmed)+" ₪/מ״ר).";
  if (nc===1) why += " כמעט אין עסקאות בבניינים ישנים באזור, לכן השווי חושב כחציון הבניינים החדשים (בלי מכירות מוקדמות) פחות 15% – הערכה בלבד.";
  if (x.x!=="" && x.x!=="BIALIK") why += " "+x.x;
  const out = [["ניתוח",why]];
  if (x.cm.length>0) out.push(["עסקאות קרובות","עסקאות קרובות: "+x.cm.map(c=>c.dt+": "+c.rm+" חד׳, "+c.q+" מ״ר, "+nf(c.p)+" ₪ ("+nf(c.p/c.q)+" ₪/מ״ר"+(c.yb?", בנוי "+c.yb:"")+", "+(c.dist<0?"באותו בניין/צמוד":c.dist+" מ׳")+")").join("; ")+"."]);
  const ageT = (x.age===0?"בניין חדש":x.age===1?"בניין ישן":"גיל הבניין לא ידוע")+(x.yb?" (נבנה "+x.yb+" לפי רשות המסים)":"");
  out.push(["גיל בניין והתחדשות",ageT+". "+upside(x)+(x.wc.length>0?" למה זול: "+x.wc.join(", ")+".":" למה זול: לא ברור מהמודעה – בדיוק מה שצריך לברר מול המוכר.")]);
  out.push(["סיכונים","סיכונים: "+[...x.rs,GENERIC].join("; ")+"."]);
  return out;
}
/* ---------- card ---------- */
const tag = (t,k) => `<span class="${k==="fact"?"fact":"est"}">${t}</span>`;
function waLink(x){
  const t = x.a+", "+x.h+" ("+x.c+") – "+nf(x.p)+" ₪"+(x.rm!=null?" · "+x.rm+" חד׳":"")+" · "+x.q+" מ״ר\n"+x.u;
  return "https://wa.me/?text="+encodeURIComponent(t);
}
function renBadge(x){
  const c = x.ci>=0 ? CMP[x.ci] : null, stt = c ? (c[4]===1?"מאושר":"בתכנון") : "";
  let t, k;
  if (x.ex && x.ex.rv && x.ex.rv.t38){ t = "תמ״א 38 בכתובת"; k = "yes"; }
  else if (x.ut===1){ t = "בניין חדש · אין התחדשות"; k = "no"; }
  else if (c && x.rw && x.rd===0){ t = "פינוי־בינוי: בתוך מתחם ("+stt+")"+(x.ut===3?" · יש פוטנציאל":""); k = "yes"; }
  else if (c && x.rw){ t = "פינוי־בינוי: כ-"+x.rd+" מ׳ ממתחם ("+stt+") · תלוי בהכללת הבניין"; k = "maybe"; }
  else if (c && x.rd<=500){ t = "מתחם התחדשות במרחק "+x.rd+" מ׳ · לא לתמחר"; k = "maybe"; }
  else { t = "אין פינוי־בינוי ידוע בקרבת הנכס"; k = "no"; }
  const yr = x.yb ? "נבנה "+x.yb : (x.age===0 ? "בניין חדש" : x.age===1 ? "בניין ישן · שנה לא ידועה" : "שנת בנייה לא ידועה");
  return `<span class="bdg ren ${k}" title="הערכה לפי מתחמי התחדשות; ראו פירוט בכרטיס">🏗 ${esc(t)}</span><span class="bdg yr">🏠 ${esc(yr)}</span>`;
}
function badgesHtml(x){
  let b = renBadge(x);
  if (!x.di) b += `<span class="bdg nod" title="למודעה אין תאריך פרסום ידוע – לא ניתן לאמת שפורסמה ב-${S.RAW.DR.win_months||4} החודשים האחרונים">⚠ תאריך לא מאומת</span>`;
  if (x.isNew) b += `<span class="bdg new">חדש · ${isoDmy(x.sn.firstSeen)}</span>`;
  if (x.drop) b += `<span class="bdg drop">ירידת מחיר ${x.drop}%</span>`;
  b += `<span class="bdg fav" data-favb="${esc(x.id)}" style="display:${isFav(x.id)?"inline":"none"}">★ במועדפים</span>`;
  b += `<a class="bdg rq" data-rqb="${esc(x.id)}" style="display:${rqShow(x.id)?"inline":"none"}" href="favorites.html#${hasRes(x.id)?"rpt-"+encodeURIComponent(x.id):"research"}">${hasRes(x.id)?"📄 דוח מחקר":"🔎 בקשת מחקר מעמיק"}</a>`;
  return `<div class="bdgs">${b}</div>`;
}
function meterHtml(x){
  const sc = v => Math.max(0, Math.min(100, v/40*100));
  const rd = x.rd2!=null && x.rd2>=0 ? `<b style="inset-inline-start:${sc(x.rd2).toFixed(1)}%" title="ריאלית (נטו) ${x.rd2}%"></b>` : "";
  return `<div class="meter${x.d>=15?"":" low"}" role="img" aria-label="הנחה ${x.d}% מול השוק${x.rd2!=null?", ריאלית (נטו) "+x.rd2+"%":""}"><i style="width:${sc(x.d).toFixed(1)}%"></i>${rd}</div><div class="meter-l" aria-hidden="true"><span>0%</span><span>הנחה מול השוק (הסימון = ריאלית)</span><span>40%+</span></div>`;
}
const info = t => t ? `<details class="nfo"><summary aria-label="פרטים נוספים" title="פרטים נוספים">i</summary><div class="nt">${t}</div></details>` : "";
const row = (k,v,n) => `<div class="r"><dt>${k}</dt><dd><span class="vv">${v}</span>${info(n)}</dd></div>`;
function yieldRows(x){
  let r = "";
  if (x.x==="BIALIK") r += row("שכירות משוערת / תשואה ברוטו",`כ-5,200 ₪ לחודש · כ-3.1% ${tag("הערכה")}`,`מתוך הבדיקה המלאה לביאליק 116 (<a href="favorites.html#rpt-yp9s9woxr">📄 דוח מחקר</a>).`);
  else if (x.rent) r += row("שכירות משוערת (שכונה/סביבה)",`${nf(x.rent.med)} ₪ לחודש ${tag("הערכה")}`,`חציון ${x.rent.n} מודעות שכירות דומות (±0.5 חדר, 70%–140% מהשטח) ברדיוס ${x.rent.R} מ׳ · טווח אמצעי ${nf(x.rent.lo)}–${nf(x.rent.hi)} · מקור: doortodoor, נסרק ${isoDmy(S.generatedAt)}. שכר מבוקש ולא חוזה.`)
   + row("תשואה ברוטו משוערת",`${x.yld.toFixed(1)}% ${tag("הערכה")}`,"שכירות שנתית ÷ מחיר מבוקש, לפני ארנונה, ועד, תחזוקה, מיסים ותקופות ריקות.");
  else r += row("שכירות / תשואה באזור","אין נתון","פחות מ-5 מודעות שכירות דומות ברדיוס 1,200 מ׳ במאגר שנסרק.");
  if (x.cbs) r += row("בדיקת סבירות – ממוצע עירוני (הלמ״ס)",`${nf(x.cbs)} ₪ לחודש → ${x.yldC.toFixed(1)}% ${tag("הערכה")}`,`ממוצע שכר דירה ${esc(x.c)} לטווח חדרים ${esc(bandOf(x.rm))}, מחצית 1 של 2026, כפי שפורסם ב-ynet מנתוני הלמ״ס. ממוצע עירוני כולל חוזים ישנים, לא ספציפי לשכונה.`);
  return r;
}
function rvShort(x){
  const rv = x.ex.rv;
  if (x.c==="רמת גן") return "אין מקור ממוחשב ברמת הבניין (רמת גן)";
  if (!rv || rv.na) return "אין מספר בית – לא אומת";
  if (rv.err) return "הבדיקה נכשלה – לא אומת";
  if (rv.t38) return "✔ נמצאה בקשת/היתר תמ״א 38 בכתובת";
  if (rv.n) return rv.n+" בקשות/היתרים, ללא תמ״א 38";
  return "לא נמצאה בקשה בכתובת"+(rv.nearT?" · "+rv.nearT+" בקשות תמ״א 38 ברדיוס 80 מ׳":"");
}
function renShort(x){
  const c = x.ci>=0 ? CMP[x.ci] : null, stt = c ? (c[4]===1?"מאושר":"בתכנון") : "";
  if (x.ex && x.ex.rv && x.ex.rv.t38) return ["תמ״א 38","בקשה בכתובת","yes"];
  if (x.ut===1) return ["אין","בניין חדש","no"];
  if (c && x.rw && x.rd===0) return ["פינוי־בינוי","בתוך מתחם · "+stt,"yes"];
  if (c && x.rw) return ["ליד מתחם",x.rd+" מ׳ · "+stt,"maybe"];
  if (c && x.rd<=500) return ["רחוק",x.rd+" מ׳ ממתחם","no"];
  return ["אין ידוע","","no"];
}
const kpi = (lab,val,sub,cls) => `<div class="kpi${cls?" "+cls:""}"><span class="kl">${lab}</span><b>${val}</b>${sub?`<span class="ks">${sub}</span>`:""}</div>`;
const dcl = v => v==null ? "na" : v>=15 ? "good" : v>=5 ? "mid" : "bad";
function card(x, open, idp){
  const parts = writeup(x);
  const dcls = x.d>=15 ? "disc" : "disc low";
  const rcls = x.rd2!=null && x.rd2>=15 ? "disc" : "disc low";
  const pp = x.am ? nf(x.pp)+" ₪/מ״ר · חציון אזור (ישן) "+nf(x.am) : nf(x.pp)+" ₪/מ״ר";
  const links = x.l.map((y,j)=>`<a class="btn ${j?"sec ":""}lk" href="${esc(y[1])}" target="_blank" rel="noopener noreferrer">${j?"":"🔗 "}${esc(y[0])} ↗</a>`).join("");
  const note = (FAV[x.id]&&FAV[x.id].note)||"";
  const nettag = x.netk==="listing" ? tag("מהמודעה","fact") : tag("הערכה ×0.85");
  const rnS = renShort(x);
  const kp = kpi("מחיר ₪", nf(x.p), (x.rm==null?"—":x.rm)+" חד׳ · "+nf(x.q)+" מ״ר")
   + kpi("₪ למ״ר", nf(x.pp), x.am?"באזור*: "+nf(x.am):"אין נתון אזורי", x.am?(x.pp<=x.am?"good":"bad"):"")
   + kpi("הנחה ריאלית*", (x.rd2==null?"—":x.rd2+"%"), "מול השוק", "dk "+dcl(x.rd2))
   + kpi("תשואה ברוטו*", x.yld!=null ? x.yld.toFixed(1)+"%" : (x.x==="BIALIK"?"3.1%":"—"), x.rent?nf(x.rent.med)+" ₪ לחודש":(x.x==="BIALIK"?"5,200 ₪ לחודש":"אין נתון שכירות"))
   + kpi("שנת בנייה", x.yb ? String(x.yb) : (x.age===0?"חדש":x.age===1?"ישן":"—"), x.yb ? (x.age===0?"בניין חדש":x.age===1?"בניין ישן":"") : "שנה לא ידועה")
   + kpi("התחדשות", rnS[0], rnS[1], "rn "+rnS[2]);
  const sec = (ic,t,body,cls) => `<section class="cs${cls?" "+cls:""}"><h4><i aria-hidden="true">${ic}</i>${t}</h4><dl>${body}</dl></section>`;
  const sMarket = row("מחיר / שטח (ברוטו לפי מודעה)",`${nf(x.p)} ₪ · ${nf(x.q)} מ״ר · ${x.rm==null?"—":x.rm} חד׳ · קומה ${esc(x.f||"—")}`)
   + row("שטח נטו",`${nf(x.net)} מ״ר ${nettag}`, x.netk==="listing"?"מצוין במודעה כנטו.":esc(x.ex.netnote||"לא מצוין נטו במודעה – הערכה שמרנית: ברוטו × 0.85."))
   + row("מחיר למ״ר: ברוטו / נטו",`${nf(x.pp)} / ${nf(x.ppn)} ₪ ${nettag}`)
   + row("טיפוסי באזור (בניינים ישנים)", x.am?nf(x.am)+" ₪/מ״ר ("+x.an+" עסקאות)":"אין מספיק עסקאות","חציון עסקאות רשות המסים 2024–26 בבניינים ישנים באזור.")
   + row("שווי משוער",`${nf(x.e)} ₪ (${nf(x.ep)} ₪/מ״ר) ${tag("הערכה")}`)
   + row("הנחה מול השוק – כפי שמוצג",`<span class="${dcls}">${x.d}%</span>`,"טווח ריאלי לפי פער ברוטו/רשום: "+esc(x.dr))
   + row("הנחה ריאלית – שמרני (נטו)",`<span class="${rcls}">${x.rd2}%</span> ${tag(x.netk==="listing"?"נטו מהמודעה":"הערכה")}`,"1 − (מחיר ÷ שטח נטו) ÷ ₪/מ״ר שווי משוער. מניח ששטח עסקאות רשות המסים הוא נטו – התרחיש הקשה; האמת בין המוצג לכאן."+(x.rd2<15?" מתחת לסף 15%.":""))
   + row("ציון",`<b>${x.s.toFixed(1)}</b> / 10`,`פירוק: הנחה ${x.sc[0]} · התחדשות ${x.sc[1]} · אימות ${x.sc[2]} · טריות ${x.sc[3]}`);
  const sBld = row("גיל בניין",`${x.age===0?"חדש":x.age===1?"ישן":"לא ידוע"}${x.yb?" · נבנה "+x.yb:""}`)
   + row("התחדשות (לפי מתחמים)",`${esc(ren(x))}${x.rn?" · "+esc(x.rn.match(/\(.*\)/)?x.rn.match(/\(.*\)/)[0]:""):""} ${tag("הערכה")}`, esc(upside(x)))
   + row("אימות ברמת הבניין", esc(rvShort(x)), esc(rvText(x)));
  const sSrc = row("תאריך פרסום", x.dt?esc(x.dt):"אין תאריך – ביטחון נמוך", x.dt?"מקור התאריך: "+esc(x.dk):"")
   + row("נראתה לראשונה באתר", isoDmy(x.sn.firstSeen)+(x.sn.firstSeen===S.baseline?" (נקודת בסיס)":""), x.sn.firstSeen===S.baseline?"נקודת בסיס – לפני הסריקות היומיות.":"")
   + row("מיקום במפה", x.ex.geo==="exact"?"לפי כתובת":"משוער", x.ex.geo==="exact"?"לפי מאגר הכתובות של רשות המסים.":"לפי רחוב/מודעה, לא בניין מדויק.")
   + row("מקורות המודעה", x.l.map(y=>`<a href="${esc(y[1])}" target="_blank" rel="noopener noreferrer">${esc(y[0])} ↗</a>`).join(" · "));
  return `<details class="card vk-${x.vk}" id="${idp}${x.k}" data-id="${esc(x.id)}"${open?" open":""}><summary>
   <div class="c1"><span class="rank">#${x.k}</span><div class="addr">${esc(x.a)}<small>${esc(x.h)} · ${esc(x.c)}</small></div><a class="shr" href="${esc(waLink(x))}" target="_blank" rel="noopener noreferrer" aria-label="שיתוף ב-WhatsApp" title="שיתוף ב-WhatsApp">⤴</a><button type="button" class="star${isFav(x.id)?" on":""}" data-id="${esc(x.id)}" aria-label="הוספה למועדפים" aria-pressed="${isFav(x.id)}">${isFav(x.id)?"★":"☆"}</button><span class="score" title="ציון 1–10">${x.s.toFixed(1)}</span></div>
   <div class="c2"><span class="price">${nf(x.p)} ₪</span><span class="chip">${x.rm==null?"—":x.rm} חד׳</span><span class="chip">${nf(x.q)} מ״ר</span>${x.f?`<span class="chip">קומה ${esc(x.f)}</span>`:""}${x.yld!=null?`<span class="chip" title="הערכה">תשואה ~${x.yld.toFixed(1)}%</span>`:""}<span class="v ${x.vk}">${VL[x.vk]}</span></div>
   ${badgesHtml(x)}
   ${meterHtml(x)}
   <div class="c3"><span>${esc(pp)} · <span class="${dcls}">הנחה ${x.d}%</span> · <span class="${rcls}" title="שמרני, לפי שטח נטו משוער">ריאלית (נטו) ${x.rd2}%</span></span><span class="chev"></span></div>
  </summary><div class="cbody">
   <div class="kpis k6">${kp}</div>
   <div class="vline"><span class="v ${x.vk}">${VL[x.vk]}</span><span class="vt">${esc(x.vt)}</span></div>
   <div class="tools act">${links}<button class="btn sec star-b" type="button" data-id="${esc(x.id)}">${isFav(x.id)?"★ הסרה ממועדפים":"☆ הוספה למועדפים"}</button><a class="btn wa" href="${esc(waLink(x))}" target="_blank" rel="noopener noreferrer">WhatsApp</a>${x.ex.lat?`<a class="btn sec" href="map.html?id=${encodeURIComponent(x.id)}">🗺 במפה</a>`:""}</div>
   <p class="fn">* הערכה – לפי עסקאות רשות המסים ומודעות שכירות; הפירוט ב"פרטים מלאים".</p>
   <details class="full"><summary>פרטים מלאים</summary><div class="fullb">
   <div class="ana verdict-wrap ${x.vk}"><div class="verdict ${x.vk}">פסק דין – ${VL[x.vk]}: ${esc(x.vt)}</div>
    ${parts.map(p=>`<p><strong class="h">${esc(p[0])}:</strong>${esc(p[1].replace(new RegExp("^"+p[0]+": ?"),""))}</p>`).join("")}</div>
   <div class="secs">
    ${sec("💰","מחיר ושוק",sMarket)}
    ${sec("📈","שכירות ותשואה",yieldRows(x))}
    ${sec("🏗","בניין והתחדשות",sBld)}
    ${sec("🗓","מקור ותאריכים",sSrc+(sparkHtml(x)?`<div class="r sp">${sparkHtml(x)}</div>`:""))}
   </div>
   <div class="ctools">${mortHtml(x)}
   <div class="nbox"><label for="note-${esc(idp)}${x.k}">📝 הערה אישית (נשמרת בדפדפן בלבד)</label><textarea class="note" id="note-${esc(idp)}${x.k}" data-id="${esc(x.id)}" placeholder="הערות, שאלות למוכר, תזכורת…">${esc(note)}</textarea></div></div>
   </div></details>
  </div></details>`;
}
const cardsHtml = (arr, nOpen, idp) => arr.length ? arr.map(x=>card(x,false,idp)).join("") : `<div class="empty">אין נכסים</div>`;
function afterRender(root){
  (root||document).querySelectorAll(".mort").forEach(mortOut);
}
/* global delegated events */
document.addEventListener("click", e=>{
  const s = e.target.closest(".star, .star-b");
  if (s){ e.preventDefault(); e.stopPropagation(); toggleFav(s.dataset.id);
    document.querySelectorAll(".star-b[data-id]").forEach(b=>{ b.textContent = isFav(b.dataset.id)?"★ הסרה ממועדפים":"☆ הוספה למועדפים"; });
    document.querySelectorAll("[data-favb]").forEach(b=>b.style.display=isFav(b.dataset.favb)?"inline":"none");
    document.querySelectorAll("[data-rqb]").forEach(b=>b.style.display=rqShow(b.dataset.rqb)?"inline":"none");
    if (document.body.dataset.page==="favs") renderFavs(); }
});
document.addEventListener("input", e=>{
  const t = e.target;
  if (t.matches("textarea.note")){ clearTimeout(t._t); t._t=setTimeout(()=>{ setNote(t.dataset.id,t.value); updateFavUI(); document.querySelectorAll('textarea.note[data-id="'+t.dataset.id+'"]').forEach(o=>{ if(o!==t) o.value=t.value; }); },250); }
  const box = t.closest && t.closest(".mort");
  if (box && t.matches("input")){
    MORT = {down:box.querySelector("[data-f=down]").value, rate:box.querySelector("[data-f=rate]").value, years:box.querySelector("[data-f=years]").value};
    try { localStorage.setItem(MKEY, JSON.stringify(MORT)); } catch(err){}
    document.querySelectorAll(".mort").forEach(b=>{ if(b!==box){ ["down","rate","years"].forEach(f=>b.querySelector("[data-f="+f+"]").value=MORT[f]); } mortOut(b); });
  }
});

/* ---------- shared widgets ---------- */
function renNear(a){
  const cnt = {};
  ITEMS.forEach(x=>{ if(x.h===a.name && x.c===a.city && x.ci>=0 && x.rd<=150){ const c=CMP[x.ci], k=c[0]+(c[4]===1?" (מאושר)":" (בתכנון)"); cnt[k]=(cnt[k]||0)+1; } });
  return Object.keys(cnt).sort((p,q)=>cnt[q]-cnt[p]).slice(0,3).map(k=>k+" – "+cnt[k]+" מודעות");
}
function snapshot(a){
  const rn = renNear(a);
  const ys = ITEMS.filter(x=>x.h===a.name && x.c===a.city && x.yld!=null).map(x=>x.yld);
  const rentLine = ys.length ? "תשואה ברוטו משוערת חציונית "+med(ys).toFixed(1)+"% (הערכה, "+ys.length+" נכסים עם נתון שכירות מ-doortodoor)" : "אין נתון";
  return `<div class="snap">
   <div><b>מודעות מדורגות</b>${a.n} (מתוכן ${a.nm} בקבוצה הראשית) · הנחה חציונית ${a.avgdisc}%</div>
   <div><b>חציון ₪/מ״ר בבניינים ישנים (עסקאות 2024–26)</b>${a.med?nf(a.med)+" ("+a.nd+" עסקאות; טווח אמצעי "+nf(a.p25)+"–"+nf(a.p75)+")":"אין מספיק עסקאות"}</div>
   <div><b>₪/מ״ר מבוקש במודעות האזור</b>${a.ask?"חציון "+nf(a.ask)+" ("+nf(a.ask25)+"–"+nf(a.ask75)+"; "+a.nask+" מודעות שנסרקו)":"—"}</div>
   <div><b>שכירות / תשואה באזור</b>${esc(rentLine)}</div>
   <div><b>התחדשות בקרבת</b>${rn.length?esc(rn.join(" · ")):"לא אותרו מתחמים בטווח 150 מ׳ מהמודעות"}</div>
   <div><b>הנכס המדורג הגבוה ביותר</b>${esc(a.best)} (ציון ${a.bestscore})</div></div>`;
}
function md(src){
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/(https?:\/\/[^\s<)]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = src.split("\n"); let out = "", i = 0, list = null;
  const closeList = () => { if(list){ out += "</"+list+">"; list=null; } };
  while (i<lines.length){
    const l = lines[i];
    if (/^\|/.test(l)){
      closeList(); const rows=[]; while(i<lines.length && /^\|/.test(lines[i])){ rows.push(lines[i]); i++; }
      const cells = r => r.replace(/^\|/,"").replace(/\|\s*$/,"").split("|").map(c=>c.trim());
      const head = cells(rows[0]), body = rows.slice(2).map(cells);
      out += `<div class="tw"><table class="t"><thead><tr>${head.map(c=>`<th>${inl(c)}</th>`).join("")}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${inl(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      continue;
    }
    let m;
    if ((m=l.match(/^(#{1,3}) (.*)/))){ closeList(); out += `<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`; }
    else if ((m=l.match(/^- (.*)/))){ if(list!=="ul"){ closeList(); out+="<ul>"; list="ul"; } out += `<li>${inl(m[1])}</li>`; }
    else if ((m=l.match(/^\d+\. (.*)/))){ if(list!=="ol"){ closeList(); out+="<ol>"; list="ol"; } out += `<li>${inl(m[1])}</li>`; }
    else if (l.trim()===""){ closeList(); }
    else { closeList(); out += `<p>${inl(l)}</p>`; }
    i++;
  }
  closeList(); return out;
}
function metrics(el, items){
  const cs = c => { const v=ITEMS.filter(x=>x.c===c); return v.length; };
  const nBuy = items.filter(x=>x.vk==="buy").length, nRen = items.filter(x=>x.rw).length;
  const nNew = items.filter(x=>x.isNew).length, nDrop = items.filter(x=>x.drop).length;
  el.innerHTML = [[items.length,"נכסים מדורגים"],[cs("תל אביב")+" / "+cs("רמת גן"),"תל אביב / רמת גן"],[nBuy,"פסק דין: שווה לקנות"],[nRen,"בתוך או ליד מתחם התחדשות"],[nNew+" / "+nDrop,"חדשים / ירידות מחיר"]].map(m=>`<div class="metric"><b>${m[0]}</b><span>${m[1]}</span></div>`).join("");
}

/* ---------- explorer: shared filter model (city pages, pinui-binui, map) ---------- */
const RNG = [["P",x=>x.p/1e6],["PP",x=>x.pp/1000],["Y",x=>x.yld],["D",x=>x.d],["RM",x=>x.rm],["Q",x=>x.q],["YB",x=>x.yb||null]];
const F0 = {city:"all",area:"all",verd:"all",sort:"score",win:"all",grp:"all",ren:"all",rst:"all",fav:false,chg:"all",q:"",smin:"0"};
RNG.forEach(r=>{ F0[r[0]+"min"]=""; F0[r[0]+"max"]=""; });
const F = Object.assign({}, F0);
const CTRL = {q:"q",fSort:"sort",fArea:"area",fCity:"city",fVerd:"verd",fWin:"win",fGrp:"grp",fChg:"chg",fRen:"ren",fRst:"rst",fSmin:"smin"};
RNG.forEach(r=>{ CTRL["f"+r[0]+"min"]=r[0]+"min"; CTRL["f"+r[0]+"max"]=r[0]+"max"; });
let EXP_CITY = null, FSCOPE = "x";
const fKey = () => "rs_flt_v2_"+FSCOPE;
function fLoad(){ try { const o=JSON.parse(localStorage.getItem(fKey())||"{}"); for (const k in o) if (k in F0) F[k]=o[k]; } catch(e){} }
function fSave(){ try { const o={}; for (const k in F0) if (F[k]!==F0[k]) o[k]=F[k]; localStorage.setItem(fKey(), JSON.stringify(o)); } catch(e){} }
function fReset(){ Object.assign(F, F0); fSave(); }
function fActive(){ let n=0; for (const k in F0) if (k!=="sort" && k!=="q" && F[k]!==F0[k]) n++; return n; }
function renOK(x, v){
  if (v==="all") return true;
  const near = x.rw, cin = x.ci>=0 && x.rd===0, c = x.ci>=0 ? CMP[x.ci] : null;
  if (v==="any") return near; if (v==="in") return cin;
  if (v==="appr") return !!(near && c && c[4]===1);
  if (v==="plan") return !!(near && c && c[4]!==1);
  if (v==="t38") return !!(x.ex && x.ex.rv && x.ex.rv.t38);
  return true;
}
function passF(x){
  if (EXP_CITY && x.c!==EXP_CITY) return false;
  if (F.city!=="all" && x.c!==F.city) return false;
  if (F.area!=="all" && x.h!==F.area) return false;
  if (F.grp!=="all" && x.g!==F.grp) return false;
  if (F.verd!=="all" && x.vk!==F.verd) return false;
  if (!renOK(x, F.ren)) return false;
  if (F.fav && !isFav(x.id)) return false;
  if (F.chg==="new" && !x.isNew) return false;
  if (F.chg==="drop" && !x.drop) return false;
  if (F.chg==="any" && !(x.isNew||x.drop)) return false;
  if (+F.smin>0 && x.s < +F.smin) return false;
  for (const [K,get] of RNG){
    const mn=F[K+"min"], mx=F[K+"max"];
    if (mn==="" && mx==="") continue;
    const v = get(x); if (v==null || isNaN(v)) return false;   // no value -> excluded only when this range is set
    if (mn!=="" && v < +mn - 1e-9) return false;
    if (mx!=="" && v > +mx + 1e-9) return false;
  }
  if (F.win!=="all"){
    if (F.win==="none"){ if(x.di!=="") return false; }
    else { if(x.di==="") return false; const days=(TODAY-new Date(x.di+"T12:00:00").getTime())/86400000; if(days>Number(F.win)) return false; }
  }
  const q = F.q.trim(); if (q!=="" && !(x.a+" "+x.h+" "+x.c).includes(q)) return false;
  return true;
}
const SORTK = {score:x=>-x.s*1000+x.k,price:x=>x.p,price_d:x=>-x.p,pp:x=>x.pp,yld:x=>-(x.yld==null?-1:x.yld),disc:x=>-x.d,rd2:x=>-(x.rd2==null?-999:x.rd2),size:x=>-x.q,date:x=>x.di===""?0:-Number(x.di.replace(/-/g,""))};
function filtered(base){
  const r = ITEMS.filter(x=>(!base || base(x)) && passF(x));
  const k = SORTK[F.sort] || SORTK.score;
  return [...r].sort((a,b)=>k(a)-k(b) || a.k-b.k);
}
function fSync(){
  for (const id in CTRL){ const el=$(id); if (el) el.value = F[CTRL[id]]; }
  if ($("fFav")) $("fFav").checked = !!F.fav;
  fBadge();
}
function fBadge(){ const t=$("togf"); if (!t) return; const n=fActive(); t.innerHTML = "סינון מתקדם ⚙"+(n?` <span class="fcn" aria-label="${n} מסננים פעילים">${n}</span>`:""); t.classList.toggle("has", n>0); }
function bindFilters(render, extraReset){
  const go = () => { fSave(); fBadge(); render(); };
  for (const id in CTRL){ const el=$(id); if (!el) continue;
    if (el.tagName==="INPUT"){ let t; el.addEventListener("input", e=>{ clearTimeout(t); t=setTimeout(()=>{ F[CTRL[id]]=e.target.value.trim(); go(); }, 220); }); }
    else el.addEventListener("change", e=>{ F[CTRL[id]]=e.target.value; if (id==="fCity" && $("fArea")){ F.area="all"; if (extraReset) extraReset(); } go(); });
  }
  if ($("fFav")) $("fFav").addEventListener("change", e=>{ F.fav=e.target.checked; go(); });
  if ($("togf")) $("togf").addEventListener("click", ()=>{ const o=$("fbar").classList.toggle("open"); $("togf").setAttribute("aria-expanded",o); });
  if ($("openAll")) $("openAll").addEventListener("click", ()=>document.querySelectorAll("#groups details.area, #groups details.card").forEach(d=>d.open=true));
  if ($("closeAll")) $("closeAll").addEventListener("click", ()=>document.querySelectorAll("#groups details.card, #groups details.area").forEach(d=>d.open=false));
  if ($("reset")) $("reset").addEventListener("click", ()=>{ fReset(); if (extraReset) extraReset(); fSync(); render(); });
}
function renderAreaOpts(){
  if (!$("fArea")) return;
  const c = EXP_CITY || (F.city!=="all" ? F.city : null);
  const o = [`<option value="all">כל האזורים</option>`].concat(AREAS.filter(a=>(!c||a.city===c) && a.n>0).map(a=>`<option value="${esc(a.name)}">${c?"":esc(a.city)+" – "}${esc(a.name)} (${a.n})</option>`));
  $("fArea").innerHTML = o.join(""); $("fArea").value = F.area;
  if ($("fArea").value!==F.area){ F.area="all"; $("fArea").value="all"; }
}
function renderGroups(){
  const list = filtered(), total = ITEMS.filter(x=>x.c===EXP_CITY).length;
  $("resCnt").textContent = "מוצגים "+list.length+" מתוך "+total+" נכסים";
  const names = AREAS.filter(a=>a.city===EXP_CITY && list.some(x=>x.h===a.name)).map(a=>a.name);
  let html = "";
  for (const nm of names){
    const ai = AREAS.find(a=>a.city===EXP_CITY && a.name===nm), its = list.filter(x=>x.h===nm);
    html += `<details class="area" data-area="${esc(nm)}"><summary>${esc(nm)}<span class="cnt">${its.length} נכסים</span></summary><div class="area-body">${snapshot(ai)}${its.map(x=>card(x,false,"e")).join("")}</div></details>`;
  }
  $("groups").innerHTML = html || `<div class="empty panel">לא נמצאו נכסים לפי הסינון. נסו "נקה סינון".</div>`;
  afterRender($("groups"));
}
function deepId(){ const id = new URLSearchParams(location.search).get("id"); return id && ITEM_BY_ID[id] ? ITEM_BY_ID[id] : null; }
function openTarget(){
  const x = deepId(); if(!x) return;
  const el = document.getElementById("e"+x.k); if(!el) return;
  const ar = el.closest("details.area"); if(ar) ar.open = true; el.open = true;
  setTimeout(()=>el.scrollIntoView({block:"start"}),50);
}
function pageCity(){
  EXP_CITY = document.body.dataset.city; FSCOPE = EXP_CITY==="רמת גן" ? "rg" : "ta";
  const its = ITEMS.filter(x=>x.c===EXP_CITY);
  metrics($("metrics"), its);
  fLoad(); F.city="all";
  const dx = deepId(); if (dx && dx.c===EXP_CITY && !passF(dx)) fReset();   // deep link always shows its card
  renderAreaOpts(); fSync(); bindFilters(renderGroups); renderGroups(); openTarget();
}

/* ---------- pinui-binui / urban renewal page ---------- */
const isT38 = x => !!(x.ex && x.ex.rv && x.ex.rv.t38);
const inCmp = x => x.ci>=0 && x.rw;
const isPot = x => x.age===1 && !inCmp(x) && !isT38(x);
const isRenItem = x => inCmp(x) || isT38(x) || isPot(x);
function pagePinui(){
  FSCOPE = "pinui"; fLoad(); fSync();
  const all = ITEMS.filter(isRenItem);
  const cmpAll = {}; all.filter(inCmp).forEach(x=>{ (cmpAll[x.ci]=cmpAll[x.ci]||[]).push(x); });
  const nC = Object.keys(cmpAll).length, nIn = all.filter(x=>inCmp(x)&&x.rd===0).length;
  $("metrics").innerHTML = [[nC,"מתחמים עם נכסים"],[all.filter(inCmp).length,"נכסים בתוך / ליד מתחם"],[nIn,"בתוך המתחם עצמו"],[all.filter(x=>inCmp(x)&&CMP[x.ci][4]===1).length,"במתחם עם תוכנית מאושרת"],[all.filter(isT38).length+" / "+all.filter(isPot).length,"תמ״א 38 / פוטנציאל"]].map(m=>`<div class="metric"><b>${m[0]}</b><span>${m[1]}</span></div>`).join("");
  const cityOf = arr => { const s=[...new Set(arr.map(x=>x.c))]; return s.join(" / "); };
  function render(){
    const list = filtered(isRenItem), rs = F.rst;
    const byC = {}; list.filter(inCmp).forEach(x=>{ if (rs==="in" && x.rd!==0) return; (byC[x.ci]=byC[x.ci]||[]).push(x); });
    let cis = Object.keys(byC).map(Number);
    if (rs==="appr") cis = cis.filter(ci=>CMP[ci][4]===1);
    if (rs==="plan") cis = cis.filter(ci=>CMP[ci][4]!==1);
    if (rs==="t38" || rs==="pot") cis = [];
    cis.sort((a,b)=>(CMP[b][4]===1)-(CMP[a][4]===1) || Math.max(...byC[b].map(x=>x.s))-Math.max(...byC[a].map(x=>x.s)) || byC[b].length-byC[a].length);
    const t38 = (rs==="all"||rs==="t38") ? list.filter(isT38) : [];
    const pot = (rs==="all"||rs==="pot") ? list.filter(isPot) : [];
    const shown = new Set(); cis.forEach(ci=>byC[ci].forEach(x=>shown.add(x.id))); t38.forEach(x=>shown.add(x.id)); pot.forEach(x=>shown.add(x.id));
    $("resCnt").textContent = "מוצגים "+shown.size+" מתוך "+all.length+" נכסים · "+cis.length+" מתחמים";
    let h = "";
    if (cis.length){
      h += `<h3 class="ren-h"><i aria-hidden="true">🏗️</i>מתחמי פינוי־בינוי והתחדשות <span class="cnt">${cis.length}</span></h3>`;
      for (const ci of cis){
        const c = CMP[ci], its = byC[ci], ap = c[4]===1, inside = its.filter(x=>x.rd===0).length;
        const units = c[2]&&c[3] ? `<span class="u">${esc(c[2])} → ${esc(c[3])} יח״ד</span>` : `<span class="u mut">יח״ד לא ידוע</span>`;
        h += `<details class="area cmp ${ap?"ap":"pl"}" data-ci="${ci}"><summary><span class="cn">${esc(c[0])}<small>${esc(c[1])} · ${esc(cityOf(its))}</small></span><span class="st ${ap?"ap":"pl"}">${ap?"✔ מאושר":"⏳ בתכנון"}</span>${units}<span class="cnt">${its.length} נכסים</span></summary><div class="area-body">
         <div class="snap"><div><b>סטטוס</b>${ap?"תוכנית מאושרת":"מתחם בתכנון – טרם אושר; אופק ארוך ולא ודאי"}</div><div><b>סוג</b>${esc(c[1])}</div><div><b>יחידות דיור</b>${c[2]&&c[3]?esc(c[2])+" קיימות → "+esc(c[3])+" מתוכננות":"לא ידוע"}</div><div><b>הנכסים כאן</b>${inside} בתוך המתחם · ${its.length-inside} עד 150 מ׳ ממנו (${its.map(x=>x.rd).sort((a,b)=>a-b).map(d=>d===0?"בתוך":d+" מ׳").join(", ")})</div></div>
         ${its.map(x=>card(x,false,"rc")).join("")}</div></details>`;
      }
    }
    if (t38.length) h += `<h3 class="ren-h"><i aria-hidden="true">🏢</i>תמ״א 38 – בקשות/היתרים בכתובת (תל אביב) <span class="cnt">${t38.length}</span></h3>
      <details class="area t38"><summary><span class="cn">נכסים עם בקשת/היתר תמ״א 38<small>לפי מאגר הבקשות וההיתרים של עיריית תל אביב</small></span><span class="cnt">${t38.length} נכסים</span></summary><div class="area-body"><p class="lead">בקשה אינה אישור – יש לבדוק מול העירייה מה אושר ובאיזה שלב. ברמת גן אין מקור ממוחשב ברמת הבניין.</p>${t38.map(x=>card(x,false,"rt")).join("")}</div></details>`;
    if (pot.length) h += `<h3 class="ren-h"><i aria-hidden="true">🧱</i>פוטנציאל – בניינים ישנים מחוץ למתחם <span class="cnt">${pot.length}</span></h3>
      <details class="area pot"><summary><span class="cn">בניינים ישנים בלי מתחם ידוע<small>פוטנציאל לתמ״א 38 / התחדשות נקודתית – לא מתומחר</small></span><span class="cnt">${pot.length} נכסים</span></summary><div class="area-body"><p class="lead">בניין ישן שאינו בתוך או ליד מתחם התחדשות ידוע ולא נמצאה בו בקשת תמ״א 38. הפוטנציאל השערה בלבד ותלוי בזכויות, בתב״ע ובדיירים.</p>${pot.map(x=>card(x,false,"rp")).join("")}</div></details>`;
    $("groups").innerHTML = h || `<div class="empty panel">לא נמצאו נכסים לפי הסינון. נסו "נקה סינון".</div>`;
    afterRender($("groups"));
  }
  bindFilters(render); render();
}

/* ---------- home ---------- */
function pageHome(){
  metrics($("metrics"), ITEMS);
  const top = ITEMS.filter(x=>x.g==="main" && x.vk!=="skip").slice(0,15);
  $("topCnt").textContent = top.length; $("topCards").innerHTML = cardsHtml(top,0,"t");
  const chg = ITEMS.filter(x=>x.isNew||x.drop);
  $("chgCnt").textContent = chg.length;
  $("chgCards").innerHTML = chg.length ? cardsHtml(chg,0,"c") : `<div class="panel">עדיין אין נכסים חדשים או ירידות מחיר. כל הנכסים הם נקודת הבסיס מ-${isoDmy(S.baseline)}; התגיות יופיעו אחרי הסריקות היומיות הבאות (נכס שנוסף בשבוע האחרון, או מחיר שירד ב-14 הימים האחרונים).</div>`;
  const bi = ITEMS.find(x=>x.x==="BIALIK");
  $("bialikTxt").textContent = BIALIK;
  if (bi) $("bialikTxt").insertAdjacentHTML("beforeend", ` <a href="${esc(bi.u)}" target="_blank" rel="noopener noreferrer">למודעה ביד2 ↗</a>`);
  if (bi && $("bialikRpt")) $("bialikRpt").href = "favorites.html#"+(hasRes(bi.id)?"rpt-"+encodeURIComponent(bi.id):"research");
  const cs = c => { const v=ITEMS.filter(x=>x.c===c); return {n:v.length,buy:v.filter(x=>x.vk==="buy").length,d:med(v.map(x=>x.d)),r:v.filter(x=>x.rw).length}; };
  $("cityStats").innerHTML = [["תל אביב",cs("תל אביב")],["רמת גן",cs("רמת גן")]].map(([n,s])=>`<div><b>${n}</b>${s.n} נכסים · הנחה חציונית ${s.d}% · ${s.buy} שווה לקנות · ${s.r} ליד התחדשות</div>`).join("");
  const dr = RAW.DR, nUnk = ITEMS.filter(x=>!x.di).length;
  if ($("winInfo")) $("winInfo").innerHTML = `🗓 מוצגות רק מודעות שפורסמו ב-${dr.win_months||4} החודשים האחרונים (מ-${isoDmy(dr.win_cut||"")} ואילך). ${dr.n_win||0} מודעות ישנות יותר הוצאו. ${nUnk} נכסים בלי תאריך פרסום ידוע נשארו ומסומנים <span class="bdg nod">⚠ תאריך לא מאומת</span>.`;
  afterRender(document);
}

/* ---------- map ---------- */
function pageMap(){
  FSCOPE = "map"; fLoad();
  const M = F;
  const colors = {buy:"#15803d",check:"#d97706",skip:"#b91c1c"};
  let map=null, layer=null, ok=false, MK={}, focused=false;
  const dx = deepId(); if (dx && !passF(dx)) fReset();
  const list = () => filtered(x=>!!x.ex.lat);
  function areaOpts(){
    const o = [`<option value="all">כל האזורים</option>`].concat(AREAS.filter(a=>(M.city==="all"||a.city===M.city) && a.n>0).map(a=>`<option value="${esc(a.name)}">${M.city==="all"?esc(a.city)+" – ":""}${esc(a.name)} (${a.n})</option>`));
    $("mArea").innerHTML = o.join(""); $("mArea").value = M.area;
    if ($("mArea").value!==M.area){ M.area="all"; $("mArea").value="all"; }
  }
  function popup(x){
    return `<b>${esc(x.a)}</b><br>${esc(x.h)} · ${esc(x.c)}<br>${nf(x.p)} ₪ · ${x.rm==null?"—":x.rm} חד׳ · ${x.q} מ״ר<br>ציון ${x.s.toFixed(1)} · הנחה ${x.d}% (ריאלית ${x.rd2}%) · ${VL[x.vk]}${x.yld!=null?"<br>תשואה ~"+x.yld.toFixed(1)+"% (הערכה)":""}${x.ex.geo==="exact"?"":"<br><i>מיקום משוער (לפי רחוב/מודעה)</i>"}<br><a href="${CITY_PAGE[x.c]}?id=${encodeURIComponent(x.id)}">לכרטיס המלא</a> · <a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">למודעה ↗</a>`;
  }
  function draw(){
    const L_ = list();
    $("mCnt").textContent = "מוצגים "+L_.length+" נכסים על המפה";
    if (ok){
      layer.clearLayers(); const pts=[]; MK={};
      L_.forEach(x=>{ const ll=[x.ex.lat,x.ex.lon]; pts.push(ll);
        MK[x.id]=L.circleMarker(ll,{radius:8,color:x.ex.geo==="exact"?"#fff":"#111",weight:x.ex.geo==="exact"?2:1.5,dashArray:x.ex.geo==="exact"?null:"3",fillColor:colors[x.vk],fillOpacity:.85}).bindPopup(popup(x)).addTo(layer); });
      if (dx && !focused && MK[dx.id]){ focused=true; map.setView([dx.ex.lat,dx.ex.lon],16); MK[dx.id].openPopup(); }
      else if (pts.length) map.fitBounds(pts,{padding:[24,24],maxZoom:15});
    }
    $("mList").innerHTML = `<thead><tr><th>כתובת</th><th>אזור</th><th>מחיר ₪</th><th>ציון</th><th>הנחה</th><th>מיקום</th><th></th></tr></thead><tbody>`+L_.map(x=>`<tr><td>${esc(x.a)}</td><td>${esc(x.c)} · ${esc(x.h)}</td><td class="num">${nf(x.p)}</td><td>${x.s.toFixed(1)}</td><td>${x.d}%</td><td>${x.ex.geo==="exact"?"כתובת":"משוער"}</td><td><a href="${CITY_PAGE[x.c]}?id=${encodeURIComponent(x.id)}">כרטיס</a></td></tr>`).join("")+`</tbody>`;
  }
  const mSync = () => { $("mCity").value=M.city; $("mVerd").value=M.verd; $("mFav").checked=!!M.fav; areaOpts(); };
  $("mCity").addEventListener("change",e=>{ M.city=e.target.value; M.area="all"; areaOpts(); fSave(); fBadge(); draw(); });
  $("mArea").addEventListener("change",e=>{ M.area=e.target.value; fSave(); fBadge(); draw(); });
  $("mVerd").addEventListener("change",e=>{ M.verd=e.target.value; fSave(); fBadge(); draw(); });
  $("mFav").addEventListener("change",e=>{ M.fav=e.target.checked; fSave(); fBadge(); draw(); });
  fSync(); mSync(); bindFilters(draw, mSync); draw();
  function init(){
    try {
      map = L.map("map",{scrollWheelZoom:true}).setView([32.07,34.80],12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
      layer = L.layerGroup().addTo(map); ok = true; draw();
    } catch(e){ fail(); }
  }
  function fail(){ $("map").style.display="none"; $("mapFail").style.display="block"; }
  if (window.L) init();
  else {
    const css=document.createElement("link"); css.rel="stylesheet"; css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
    const js=document.createElement("script"); js.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; js.onload=init; js.onerror=fail; document.head.appendChild(js);
    setTimeout(()=>{ if(!ok && !window.L) fail(); },9000);
  }
}

/* ---------- favorites ---------- */
function favText(){
  const rows = Object.entries(FAV).filter(([id,r])=>r.fav && ITEM_BY_ID[id]).sort((a,b)=>(a[1].t||0)-(b[1].t||0));
  return rows.map(([id,r])=>{ const x=ITEM_BY_ID[id]; return "★ "+x.a+", "+x.h+" ("+x.c+") – "+nf(x.p)+" ₪ · "+(x.rm==null?"—":x.rm)+" חד׳ · "+x.q+" מ״ר · ציון "+x.s.toFixed(1)+" · הנחה "+x.d+"%\n"+x.u+(r.note?"\nהערה: "+r.note:""); }).join("\n\n");
}
/* ---------- deep-research request + reports ---------- */
const RQKEY = "rs_rq_v1";
let RQ = (()=>{ try { const o=JSON.parse(localStorage.getItem(RQKEY)||"{}"); return {off:o.off||{}, areas:Array.isArray(o.areas)?o.areas.filter(a=>typeof a==="string"):[], notes:typeof o.notes==="string"?o.notes:""}; } catch(e){ return {off:{},areas:[],notes:""}; } })();
const saveRq = () => { try { localStorage.setItem(RQKEY, JSON.stringify(RQ)); } catch(e){} };
const favItems = () => Object.entries(FAV).filter(([id,r])=>r.fav && ITEM_BY_ID[id]).sort((a,b)=>(a[1].t||0)-(b[1].t||0)).map(([id])=>ITEM_BY_ID[id]);
const rqChosen = () => favItems().filter(x=>!RQ.off[x.id]);
const RQ_TAIL = 'בצע מחקר מעמיק לכל דירה ולאזור שלה: עסקאות אחרונות בבניין, ברחוב ובשכונה, מחיר למ"ר, שכירות ותשואה, גיל הבניין, פוטנציאל התחדשות, וכדאיות קנייה';
function rqText(){
  const items = rqChosen(), areas = RQ.areas, notes = RQ.notes.trim();
  if (!items.length && !areas.length) return "";
  const L = ["שלום, בקשת מחקר מעמיק – דירות שאהבתי (מהאתר, נתונים מ-"+isoDmy(S.generatedAt)+")",""];
  if (items.length){
    L.push("דירות למחקר ("+items.length+"):");
    items.forEach((x,i)=>{ const n=(FAV[x.id]&&FAV[x.id].note||"").trim();
      L.push((i+1)+". "+x.a+", "+x.h+" ("+x.c+")");
      L.push("   מחיר: "+nf(x.p)+" ₪ · "+(x.rm==null?"—":x.rm)+" חד׳ · "+x.q+" מ״ר"+(x.f?" · קומה "+x.f:""));
      L.push("   מזהה: "+x.id);
      L.push("   מודעה: "+x.u);
      if (n) L.push("   הערה שלי: "+n.replace(/\s*\n\s*/g," / "));
    });
    L.push("");
  }
  if (areas.length){ L.push("אזורים / שכונות / ערים נוספים לחיפוש:"); areas.forEach(a=>L.push("- "+a)); L.push(""); }
  if (notes){ L.push("הערות נוספות: "+notes); L.push(""); }
  L.push(RQ_TAIL);
  return L.join("\n");
}
function rqRefreshOut(){
  const t = rqText(), box=$("rqBox"), wa=$("rqWa");
  if (box) box.value = t;
  if (wa) wa.setAttribute("href","https://wa.me/"+(t?"?text="+encodeURIComponent(t):""));
  if (wa) wa.classList.toggle("dis",!t);
  if (wa) wa.setAttribute("aria-disabled",t?"false":"true");
}
function rqRenderList(){
  const favs = favItems();
  $("rqList").innerHTML = favs.length ? favs.map(x=>`<label class="rq-it"><input type="checkbox" data-rqid="${esc(x.id)}"${RQ.off[x.id]?"":" checked"}><span><b>${esc(x.a)}</b> <small>${esc(x.h)} · ${esc(x.c)} · ${nf(x.p)} ₪${hasRes(x.id)?" · יש דוח קודם":""}</small></span></label>`).join("") : `<div class="mut" style="padding:6px 0">אין עדיין מועדפים. סמנו ★ בכרטיס נכס (בדפי תל אביב / רמת גן / מפה) – ואז יופיע כאן. אפשר גם לבקש מחקר על אזור בלבד.</div>`;
  rqRefreshOut();
}
function rqRenderChips(){
  $("rqChips").innerHTML = RQ.areas.map((a,i)=>`<span class="rq-chip">${esc(a)}<button type="button" data-rqdel="${i}" aria-label="הסרת ${esc(a)}">×</button></span>`).join("");
  rqRefreshOut();
}
function rqAddAreas(){
  const inp=$("rqAreaIn"); const parts = inp.value.split(/[,،\n]+/).map(t=>t.trim()).filter(Boolean);
  parts.forEach(p=>{ p=p.slice(0,60); if (!RQ.areas.some(a=>a===p) && RQ.areas.length<30) RQ.areas.push(p); });
  inp.value=""; saveRq(); rqRenderChips();
}
function rqMsg(t){ const m=$("rqMsg"); if(m){ m.textContent=t; } }
function pageRq(){
  $("rqNotes").value = RQ.notes;
  rqRenderList(); rqRenderChips();
  $("rqList").addEventListener("change", e=>{ const c=e.target.closest("[data-rqid]"); if(!c) return; if (c.checked) delete RQ.off[c.dataset.rqid]; else RQ.off[c.dataset.rqid]=1; saveRq(); rqRefreshOut(); });
  $("rqAll").addEventListener("click", ()=>{ RQ.off={}; saveRq(); rqRenderList(); });
  $("rqNone").addEventListener("click", ()=>{ favItems().forEach(x=>RQ.off[x.id]=1); saveRq(); rqRenderList(); });
  $("rqAreaAdd").addEventListener("click", rqAddAreas);
  $("rqAreaIn").addEventListener("keydown", e=>{ if (e.key==="Enter"){ e.preventDefault(); rqAddAreas(); } });
  $("rqChips").addEventListener("click", e=>{ const d=e.target.closest("[data-rqdel]"); if(!d) return; RQ.areas.splice(+d.dataset.rqdel,1); saveRq(); rqRenderChips(); });
  $("rqNotes").addEventListener("input", e=>{ RQ.notes=e.target.value; saveRq(); rqRefreshOut(); });
  $("rqCopy").addEventListener("click", async ()=>{
    if ($("rqAreaIn").value.trim()) rqAddAreas();
    const t=rqText(); if(!t){ rqMsg("בחרו לפחות דירה אחת או הוסיפו אזור."); return; }
    try { await navigator.clipboard.writeText(t); rqMsg("הבקשה הועתקה. הדביקו אותה בצ'אט עם הסוכן והוא יבצע מחקר ויחזור עם דוח."); }
    catch(e){ const d=document.querySelector(".rq-prev"); if(d) d.open=true; const b=$("rqBox"); b.value=t; b.focus(); b.select(); rqMsg("לא ניתן להעתיק אוטומטית – הטקסט מסומן בתצוגה המקדימה, העתיקו ידנית (לחיצה ארוכה → העתק)."); }
  });
  $("rqWa").addEventListener("click", e=>{
    if ($("rqAreaIn").value.trim()) rqAddAreas();
    if (!rqText()){ e.preventDefault(); rqMsg("בחרו לפחות דירה אחת או הוסיפו אזור."); return; }
    rqMsg("נפתח וואטסאפ – בחרו את הצ'אט עם הסוכן ושלחו.");
  });
}
const num = v => typeof v==="number" && isFinite(v);
const money = v => num(v) ? nf(v)+" ₪" : (v==null||v===""?"—":esc(v));
const rdate = d => /^\d{4}-\d{2}-\d{2}/.test(d||"") ? isoDmy(d) : (d?esc(d):"");
const safeUrl = u => /^https?:\/\//i.test(u||"") ? u : null;
function rptKV(label, val, sub){ return val==null||val===""?"":`<div><b>${label}</b>${val}${sub?`<span class="sub">${sub}</span>`:""}</div>`; }
function rptDeals(title, arr){
  if (!Array.isArray(arr)) return "";
  if (!arr.length) return `<h5>${title}</h5><p class="mut">לא נמצאו עסקאות רלוונטיות.</p>`;
  return `<h5>${title} <span class="mut">(${arr.length})</span></h5><div class="tw"><table class="t"><thead><tr><th>תאריך</th><th>כתובת / בניין</th><th>חד׳</th><th>מ״ר</th><th>מחיר</th><th>₪/מ״ר</th><th>הערה</th></tr></thead><tbody>`+
   arr.map(d=>`<tr><td class="num">${rdate(d.date)}</td><td>${d.address?esc(d.address):""}</td><td>${d.rooms==null?"":esc(d.rooms)}</td><td>${d.sqm==null?"":esc(d.sqm)}</td><td class="num">${d.price==null?"":money(d.price)}</td><td class="num">${d.ppsqm==null?(num(d.price)&&num(d.sqm)&&d.sqm>0?nf(d.price/d.sqm):""):nf(d.ppsqm)}</td><td>${d.note?esc(d.note):""}</td></tr>`).join("")+`</tbody></table></div>`;
}
function reportHtml(id, x){
  const r = RES[id]; if (!r) return "";
  const ttl = x ? x.a+", "+x.h+" ("+x.c+")" : (r.title||id);
  const vcode = r.verdict && ["buy","check","skip"].includes(r.verdict.code) ? r.verdict.code : "";
  const tx = t => t==null||t===""?"":`<p>${esc(t)}</p>`;
  let h = `<details class="rpt" id="rpt-${esc(id)}"><summary class="rpt-h"><b>📄 דוח מחקר מעמיק – ${esc(ttl)}</b><span class="mut">${r.date?"נערך "+rdate(r.date):""}</span>${vcode?`<span class="v ${vcode}">${VL[vcode]}</span>`:""}<span class="chev"></span></summary>`;
  h += tx(r.summary);
  if (r.verdict && (r.verdict.text || (r.verdict.reasoning||[]).length)){
    h += `<div class="verdict ${vcode||"check"}">פסק דין${vcode?" – "+VL[vcode]:""}${r.verdict.text?": "+esc(r.verdict.text):""}</div>`;
    if (Array.isArray(r.verdict.reasoning) && r.verdict.reasoning.length) h += `<ul>`+r.verdict.reasoning.map(t=>`<li>${esc(t)}</li>`).join("")+`</ul>`;
  }
  if (Array.isArray(r.sections)) r.sections.forEach(sc=>{ if(sc && typeof sc.md==="string") h += (sc.title?`<h4>${esc(sc.title)}</h4>`:"")+`<div class="rmd">${md(sc.md)}</div>`; });
  const p = r.ppsqm;
  if (p){
    h += `<h4>מחיר למ״ר מול האזור</h4><div class="kv">`+rptKV("בנכס (מבוקש)",num(p.listing)?nf(p.listing)+" ₪/מ״ר":null)+rptKV("בבניין",num(p.building)?nf(p.building)+" ₪/מ״ר":null)+rptKV("ברחוב",num(p.street)?nf(p.street)+" ₪/מ״ר":null)+rptKV("בשכונה",num(p.neighborhood)?nf(p.neighborhood)+" ₪/מ״ר":null)+`</div>`+tx(p.note);
  }
  const d = r.deals;
  if (d){
    h += `<h4>עסקאות אחרונות</h4>`+rptDeals("בבניין",d.building)+rptDeals("ברחוב",d.street)+rptDeals("בשכונה",d.neighborhood)+tx(r.dealsNote);
  }
  const rt = r.rent;
  if (rt){
    h += `<h4>שכירות ותשואה</h4><div class="kv">`+rptKV("שכירות חודשית משוערת",num(rt.monthly)?nf(rt.monthly)+" ₪":null,rt.range?esc(rt.range):"")+rptKV("תשואה ברוטו",num(rt.yieldPct)?rt.yieldPct.toFixed(1)+"%":null)+`</div>`+tx(rt.basis);
  }
  const b = r.building;
  if (b){
    h += `<h4>גיל הבניין</h4><div class="kv">`+rptKV("שנת בנייה",b.yearBuilt==null?null:esc(b.yearBuilt),b.ageClass?esc(b.ageClass):"")+`</div>`+tx(b.note);
  }
  const rn = r.renewal;
  if (rn){
    h += `<h4>פוטנציאל התחדשות</h4>`+(rn.status?`<p><b>${esc(rn.status)}</b></p>`:"")+tx(rn.detail);
  }
  if (Array.isArray(r.sources) && r.sources.length){
    h += `<h4>מקורות</h4><ul>`+r.sources.map(s=>{ const u=safeUrl(s&&s.url); const l=esc((s&&s.label)||(s&&s.url)||"מקור"); return `<li>${u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${l} ↗</a>`:l}${s&&s.note?" – "+esc(s.note):""}</li>`; }).join("")+`</ul>`;
  }
  h += `<p class="mut" style="font-size:12.5px">הערכות מבוססות נתונים, לא ייעוץ השקעות. לפני קנייה: נסח טאבו, שטח רשום, היתרים ובדיקה מול העירייה והמוכר.</p></details>`;
  return h;
}
function renderResults(){
  const ids = Object.keys(RES), favIds = new Set(favItems().map(x=>x.id));
  $("resCnt").textContent = ids.length;
  if (!ids.length){ $("resBody").innerHTML = `<div class="panel">עדיין אין תוצאות מחקר. אחרי ששולחים לסוכן בקשת מחקר, הדוחות יופיעו כאן ומתחת לכל מועדף, אחרי העדכון הבא של האתר.</div>`; return; }
  const row = id => { const x=ITEM_BY_ID[id], r=RES[id], vc=r.verdict&&["buy","check","skip"].includes(r.verdict.code)?r.verdict.code:"";
    return `<tr><td><a href="#rpt-${encodeURIComponent(id)}">${esc(x?x.a+", "+x.h:(r.title||id))}</a></td><td>${vc?`<span class="v ${vc}">${VL[vc]}</span>`:""}</td><td class="num">${rdate(r.date)}</td><td>${favIds.has(id)?"★":"<span class='mut'>לא במועדפים</span>"}</td></tr>`; };
  const others = ids.filter(id=>!favIds.has(id));
  $("resBody").innerHTML = `<div class="tw"><table class="t"><thead><tr><th>נכס</th><th>פסק דין</th><th>תאריך</th><th>מועדף</th></tr></thead><tbody>${ids.map(row).join("")}</tbody></table></div>`+
    (others.length?`<p class="lead">דוחות על נכסים שאינם במועדפים כרגע:</p>`+others.map(id=>reportHtml(id,ITEM_BY_ID[id])).join(""):"");
}
function renderFavs(){
  const favs = favItems();
  const notesOnly = Object.entries(FAV).filter(([id,r])=>!r.fav && r.note && ITEM_BY_ID[id]).map(([id])=>ITEM_BY_ID[id]);
  $("favCnt").textContent = favs.length;
  $("favCards").innerHTML = favs.length ? favs.map(x=>`<div class="favitem">${cardsHtml([x], 0, "f")}${reportHtml(x.id,x)}</div>`).join("") : `<div class="panel">עדיין אין מועדפים. לחצו על ☆ בכרטיס של נכס כדי להוסיף. המועדפים וההערות נשמרים בדפדפן הזה בלבד (localStorage) ולא נשלחים לשום מקום.</div>`;
  $("noteCards").innerHTML = notesOnly.length ? `<h2>הערות על נכסים שלא סומנו</h2>` + cardsHtml(notesOnly,0,"g") : "";
  afterRender(document);
  if ($("rqList")) rqRenderList();
  renderResults();
}
function pageFavs(){
  pageRq();
  renderFavs();
  const goHash = ()=>{ if (location.hash.length>1){ const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el){ if (el.tagName==="DETAILS") el.open=true; setTimeout(()=>el.scrollIntoView(),50); } } };
  goHash(); window.addEventListener("hashchange", goHash);
  $("favCopy").addEventListener("click", async ()=>{ const t=favText(); if(!t){ $("favMsg").textContent="אין מה להעתיק."; return; }
    try { await navigator.clipboard.writeText(t); $("favMsg").textContent="הועתק ללוח."; } catch(e){ $("favBox").value=t; $("favBox").style.display="block"; $("favBox").select(); $("favMsg").textContent="סימנו את הטקסט – העתיקו ידנית."; } });
  $("favDl").addEventListener("click", ()=>{
    const data = {exportedAt:new Date().toISOString(), siteSnapshot:S.generatedAt, favorites:Object.entries(FAV).filter(([id,r])=>r.fav||r.note).map(([id,r])=>{ const x=ITEM_BY_ID[id]; return {id, fav:!!r.fav, note:r.note||"", address:x?x.a+", "+x.h+" ("+x.c+")":null, price:x?x.p:null, url:x?x.u:null}; })};
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})); a.download="my-favorites.json"; document.body.appendChild(a); a.click(); a.remove(); });
  $("favClear").addEventListener("click", ()=>{ if(confirm("למחוק את כל המועדפים וההערות מהדפדפן הזה?")){ FAV={}; saveFav(); renderFavs(); updateFavUI(); } });
}


/* ---------- methodology ---------- */
function pageMethod(){
  const dd = RAW.DR;
  $("methodList").innerHTML = S.METHOD.map(t=>`<li>${esc(t.replace("{scanned}",nf(dd.scanned)).replace("{pool}",nf(dd.n_scored_pool)))}</li>`).join("");
  const sp=byG("suspicious"), nd=byG("nodata"), nod=byG("nodate");
  $("suspCnt").textContent=sp.length; $("suspCards").innerHTML=cardsHtml(sp,0,"s");
  $("ndCnt").textContent=nd.length; $("ndCards").innerHTML=cardsHtml(nd,0,"n");
  $("nodCnt").textContent=nod.length; $("nodCards").innerHTML=cardsHtml(nod,0,"d");
  const row = (a,b,c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
  $("dropT").innerHTML = `<thead><tr><th>סיבה</th><th>כמות</th><th>הערה</th></tr></thead><tbody>`+[
   ["לא עמדו בסף",nf(dd.n_below),"פחות מ-15% מתחת לשוק ובלי קרבה למתחם התחדשות"],
   ["אין מיקום/עסקאות להשוואה",nf(dd.n_nocomps),"כתובת שלא אותרה במאגר או ללא עסקאות דומות"],
   ["סוג נכס לא רלוונטי",nf(dd.n_badtype),"וילה, קוטג׳, מגרש, בניין שלם וכד׳"],
   ["הוסרו מהאתר",dd.n_removed,dd.removed.map(r=>esc(r.a)).join(", ")],
   ["פורסמו לפני "+isoDmy(dd.win_cut||"")+" (חלון "+(dd.win_months||4)+" חודשים)",dd.n_win||0,"הוצאו בבניית האתר: עברו את הסינון אך פורסמו לפני תחילת החלון"+(dd.win_list&&dd.win_list.length?" – למשל "+dd.win_list.slice(0,6).map(r=>esc(r.a.split(" (")[0])+" ("+r.dt+")").join(", "):"")],
   ["פורסמו לפני יותר משנה",dd.n_old,"עברו את סף ההנחה/התחדשות אך מעל שנה בשוק (לפי createdAt / תאריך מקור)"],
   ["הנחה חריגה מעל 45%",dd.n_extreme,"כמעט בוודאות טעות בשטח/סוג נכס/עסקאות"],
   ["ללא תאריך ולא חזקות מספיק",dd.n_nodate_weak,"לא ניתן לאמת טריות"],
   ["ציון נמוך מהסף",dd.n_lowscore,"עברו את הסף אך מתחת ל-7.3"]
  ].map(r=>row(r[0],r[1],r[2])).join("")+`</tbody>`;
  $("oldT").innerHTML = `<thead><tr><th>נכס</th><th>מחיר ₪</th><th>פורסם</th><th>הנחה</th><th>ציון</th><th>קישור</th></tr></thead><tbody>`+dd.old.map(r=>`<tr><td>${esc(r.a)}</td><td class="num">${nf(r.p)}</td><td>${esc(r.dt)}</td><td>${r.d}%</td><td>${r.s.toFixed(1)}</td><td><a href="${esc(r.u)}" target="_blank" rel="noopener noreferrer">מודעה ↗</a></td></tr>`).join("")+`</tbody>`;
  $("srcList").innerHTML = S.SOURCES.map(t=>`<li>${esc(t)}</li>`).join("");
  $("limList").innerHTML = S.LIMITS.map(t=>`<li>${esc(t)}</li>`).join("");
  const c = S.CBS;
  $("cbsT").innerHTML = `<thead><tr><th>עיר</th><th>1–2 חדרים</th><th>2.5–3</th><th>3.5–4</th><th>4.5+</th></tr></thead><tbody>`+Object.keys(c.data).map(k=>`<tr><td>${esc(k)}</td>${["1-2","2.5-3","3.5-4","4.5+"].map(b=>`<td class="num">${nf(c.data[k][b])} ₪</td>`).join("")}</tr>`).join("")+`</tbody>`;
  $("cbsSrc").innerHTML = `מקור: ${esc(c.note)} <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">ynet ↗</a>`;
  $("rentX").innerHTML = S.RENT_XCHECK.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td><a href="${esc(r[2])}" target="_blank" rel="noopener noreferrer">מקור ↗</a></td></tr>`).join("");
  $("snapInfo").innerHTML = `תאריך יצירת הנתונים: <b>${isoDmy(S.generatedAt)}</b> · נקודת בסיס: ${isoDmy(S.baseline)} · נכסים עם היסטוריית מחיר: ${ITEMS.filter(x=>x.hist.length>=2).length} (מתוכם ${ITEMS.filter(x=>x.hist.length>=2 && x.src==="doortodoor").length} מהיסטוריית המחירים של doortodoor).`;
  afterRender(document);
}

/* ---------- look & feel: themes, dark mode, back-to-top ---------- */
const THEMES = [["indigo","אינדיגו","#4338ca"],["ocean","אוקיינוס","#0e7490"],["sunset","שקיעה","#be185d"],["forest","יער","#15803d"]];
const MODES = [["auto","אוטומטי"],["light","בהיר"],["dark","כהה"]];
const lsGet = (k,d) => { try { return localStorage.getItem(k) || d; } catch(e){ return d; } };
const lsSet = (k,v) => { try { localStorage.setItem(k,v); } catch(e){} };
const sysDark = () => !!(window.matchMedia && matchMedia("(prefers-color-scheme:dark)").matches);
function applyLook(){
  const t = lsGet("rs_theme_v1","indigo"), m = lsGet("rs_mode_v1","auto"), h = document.documentElement;
  h.dataset.theme = THEMES.some(x=>x[0]===t) ? t : "indigo";
  h.dataset.mode = (m==="dark" || (m==="auto" && sysDark())) ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]'), hero = document.querySelector("header.hero");
  if (meta && hero){ const c = getComputedStyle(hero).getPropertyValue("--h1").trim(); if (c) meta.setAttribute("content", c); }
  document.querySelectorAll("#themeSw button").forEach(b=>b.setAttribute("aria-checked", b.dataset.t===h.dataset.theme));
  document.querySelectorAll("#modeSw button").forEach(b=>b.setAttribute("aria-checked", b.dataset.m===m));
  const q = $("modeQuick"); if (q){ q.textContent = h.dataset.mode==="dark" ? "☀" : "🌙"; q.setAttribute("aria-label", h.dataset.mode==="dark" ? "מעבר למצב בהיר" : "מעבר למצב כהה"); }
}
function initLook(){
  const ctl = $("ctl");
  if (ctl){
    ctl.innerHTML = `<button type="button" id="modeQuick" title="בהיר / כהה"></button><button type="button" id="palBtn" aria-label="ערכות צבעים" aria-haspopup="true" aria-expanded="false" title="ערכות צבעים">🎨</button>
     <div class="pop" id="pal" hidden role="group" aria-label="ערכות צבעים ומצב תצוגה"><h4>ערכת צבעים</h4><div class="sw" id="themeSw" role="radiogroup" aria-label="ערכת צבעים">${THEMES.map(t=>`<button type="button" role="radio" data-t="${t[0]}" aria-checked="false"><i style="background:${t[2]}"></i>${t[1]}</button>`).join("")}</div>
     <h4>מצב תצוגה</h4><div class="md" id="modeSw" role="radiogroup" aria-label="מצב תצוגה">${MODES.map(m=>`<button type="button" role="radio" data-m="${m[0]}" aria-checked="false">${m[1]}</button>`).join("")}</div></div>`;
    const pal = $("pal"), pb = $("palBtn");
    const shut = () => { pal.hidden = true; pb.setAttribute("aria-expanded","false"); };
    pb.addEventListener("click", e=>{ e.stopPropagation(); pal.hidden = !pal.hidden; pb.setAttribute("aria-expanded", String(!pal.hidden)); });
    document.addEventListener("click", e=>{ if (!pal.hidden && !e.target.closest("#ctl")) shut(); });
    document.addEventListener("keydown", e=>{ if (e.key==="Escape" && !pal.hidden){ shut(); pb.focus(); } });
    $("themeSw").addEventListener("click", e=>{ const b=e.target.closest("button[data-t]"); if(b){ lsSet("rs_theme_v1",b.dataset.t); applyLook(); } });
    $("modeSw").addEventListener("click", e=>{ const b=e.target.closest("button[data-m]"); if(b){ lsSet("rs_mode_v1",b.dataset.m); applyLook(); } });
    $("modeQuick").addEventListener("click", ()=>{ lsSet("rs_mode_v1", document.documentElement.dataset.mode==="dark" ? "light" : "dark"); applyLook(); });
  }
  if (window.matchMedia) { const mq = matchMedia("(prefers-color-scheme:dark)"); const f = ()=>{ if (lsGet("rs_mode_v1","auto")==="auto") applyLook(); }; mq.addEventListener ? mq.addEventListener("change",f) : (mq.addListener && mq.addListener(f)); }
  const up = document.createElement("button"); up.type="button"; up.className="totop"; up.id="toTop"; up.setAttribute("aria-label","חזרה לראש העמוד"); up.textContent="↑";
  document.body.appendChild(up);
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  up.addEventListener("click", ()=>window.scrollTo({top:0,behavior:reduce?"auto":"smooth"}));
  let tk=false; const onS = ()=>{ if(tk) return; tk=true; requestAnimationFrame(()=>{ up.classList.toggle("show", window.scrollY>700); tk=false; }); };
  window.addEventListener("scroll", onS, {passive:true}); onS();
  applyLook();
}

/* ---------- boot ---------- */
function boot(){
  initLook();
  const pg = document.body.dataset.page;
  const f = {home:pageHome, city:pageCity, ren:pagePinui, map:pageMap, favs:pageFavs, method:pageMethod}[pg];
  if (f) f();
  if (pg!=="city" && pg!=="map" && pg!=="ren" && (pg==="favs" || document.querySelector("details.card"))){
    const bar=document.createElement("div"); bar.className="cardtools";
    bar.innerHTML='<button class="btn sec" id="cardsOpen" type="button">פתח הכול</button><button class="btn sec" id="cardsClose" type="button">סגור הכול</button><span class="mut">הכרטיסים סגורים כברירת מחדל – לחצו על כרטיס לפירוט מלא</span>';
    if (pg==="home" && $("topCards")) $("topCards").parentNode.insertBefore(bar,$("topCards")); else { const main=document.querySelector("main"); main.insertBefore(bar, main.firstChild); }
    const all=()=>document.querySelectorAll("main details.card, main details.rpt");
    $("cardsOpen").addEventListener("click",()=>all().forEach(d=>d.open=true));
    $("cardsClose").addEventListener("click",()=>all().forEach(d=>d.open=false));
  }
  updateFavUI();
  document.querySelectorAll("[data-gen]").forEach(e=>e.textContent=isoDmy(S.generatedAt));
}
if (document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
