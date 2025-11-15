"use strict";

/* ======= Estado para modas/fantasmas ======= */
var MAX_GHOSTS_PER_EXAM      = 3;
var MAX_ALPHA_MAIN           = 0.38;
var MAX_ALPHA_ALT            = 0.26;
var MIN_ALPHA_CAP_WHEN_FEW   = 0.18;

var lastModeByExamAll = {};
var lastModeListByExamAll = {};
var lastTotalsByExamAll = {};
var lastModeListByExamOthers = {};
var lastTotalsByExamOthers = {};
var lastGroupsByExamDateOthers = {};

/* ===== Exclusiones en stats ===== */
var EXCLUDED_FROM_STATS_SUBJECTS = new Set([
    "Introducción a la Cirugía"
]);

/* ===== Agregados / fantasmas y resultados ===== */
function foldAgg(rows){
    const totalsByExam={};
    const cntByExamDate={};
    const groupsByExamDate={};
    rows.forEach(r=>{
        if(!isWithin(r.date)) return;
        (totalsByExam[r.exam_id] ||= 0); totalsByExam[r.exam_id]+=1;
        (cntByExamDate[r.exam_id] ||= {}); (cntByExamDate[r.exam_id][r.date] ||= 0);
        cntByExamDate[r.exam_id][r.date]+=1;
        (groupsByExamDate[r.exam_id] ||= {}); (groupsByExamDate[r.exam_id][r.date] ||= []);
        groupsByExamDate[r.exam_id][r.date].push(r.group_id);
    });
    const modeByExam={}; const modeListByExam={};
    Object.keys(cntByExamDate).forEach(id=>{
        const dm=cntByExamDate[id];
        const list=Object.keys(dm).map(d=>({date:d,count:dm[d]})).sort((a,b)=> b.count-a.count || a.date.localeCompare(b.date));
        if(list.length){ modeByExam[id]=list[0]; modeListByExam[id]=list; }
    });
    return { totalsByExam, modeByExam, modeListByExam, groupsByExamDate };
}

/* Ganadores sólidos en calendario SOLO en resultados */
function renderResultsWinners(modeByExam){
    document.querySelectorAll(".exam-list").forEach(el=> el.innerHTML="");
    if(!resultsMode) return;

    const winners = Object.keys(modeByExam).map(id=>({
        exam: examIdToObj[id],
        date: modeByExam[id].date
    })).filter(x=> x.exam && isWithin(x.date));

    winners.forEach(({exam, date})=>{
        const cell = document.querySelector('.day-cell[data-date="'+date+'"]');
        if(!cell) return;
        const prev = nearestBefore(date, exam.id);
        const next = nearestAfter(date, exam.id);
        const card = createResultCard(exam, {
            approvedDate: exam.officialDate,
            suggestionDate: date,
            prev, next
        });
        cell.querySelector(".exam-list").appendChild(card);
    });
}

async function recomputeAgg(){
    let payload = null;
    try{
        payload = await apiListYear(currentYear);
        localStorage.setItem(SNAPSHOT_KEY(currentYear), JSON.stringify(payload));
    }catch(e){
        const raw = localStorage.getItem(SNAPSHOT_KEY(currentYear));
        payload = raw ? JSON.parse(raw) : { groups: [] };
        console.warn("Usando snapshot local para fantasmas:", e?.message||e);
    }

    const allGroups = mergeRemoteWithLocal((payload && payload.groups) || [], currentYear);

    const rowsAll = [];
    const rowsOthers = [];
    allGroups.forEach(g=>{
        const gid = String(g.group_id);
        Object.entries(g.proposals||{}).forEach(([exam_id, date])=>{
            rowsAll.push({ exam_id, date, group_id: gid });
            if(!resultsMode && String(currentGroupId||"")===gid) return;
            rowsOthers.push({ exam_id, date, group_id: gid });
        });
    });

    const all = foldAgg(rowsAll);
    const others = foldAgg(rowsOthers);

    lastModeByExamAll     = all.modeByExam;
    lastModeListByExamAll = all.modeListByExam;
    lastTotalsByExamAll   = all.totalsByExam;

    lastModeListByExamOthers = others.modeListByExam;
    lastTotalsByExamOthers   = others.totalsByExam;
    lastGroupsByExamDateOthers = others.groupsByExamDate;

    renderGhosts();
    renderResultsWinners(all.modeByExam);
    renderStats(all.modeByExam, all.modeListByExam, all.groupsByExamDate);
    renderCurrentGroup();
}

function renderGhosts(){
    document.querySelectorAll(".ghost-date").forEach(l=> l.innerHTML="");
    if(!currentGroupId && !resultsMode) return;

    Object.keys(lastModeListByExamOthers).forEach(examId=>{
        const exam=examIdToObj[examId]; if(!exam) return;
        const list=(lastModeListByExamOthers[examId]||[]).slice(0,MAX_GHOSTS_PER_EXAM);
        list.forEach((opt,idx)=>{
            const cell=document.querySelector('.day-cell[data-date="'+opt.date+'"]'); if(!cell) return;
            const total=lastTotalsByExamOthers[examId]||0;
            const share=total>0 ? opt.count/total : 0;
            const cap=(idx===0?MAX_ALPHA_MAIN:MAX_ALPHA_ALT);
            let alpha=Math.min(cap, Math.max(0, cap*share));
            if(opt.count<=3) alpha=Math.min(alpha, MIN_ALPHA_CAP_WHEN_FEW);
            const groups=(lastGroupsByExamDateOthers[examId] && lastGroupsByExamDateOthers[examId][opt.date]) ? lastGroupsByExamDateOthers[examId][opt.date] : [];
            const ghost=createGhostCard(exam, opt.date, groups, alpha);
            cell.querySelector(".ghost-date").appendChild(ghost);
        });
    });
}

// Distancias entre modas para ribbon
function prevNextDistancesByMode(items){
    const arr = items.map(x=>({
        id: x.exam.id,
        subj: x.exam.subject,
        date: x.mode.date
    })).sort((a,b)=> a.date.localeCompare(b.date));

    function nearestPrevDifferentSubject(idx){
        const base=arr[idx];
        let best=null;
        for(let i=idx-1;i>=0;i--){
            if(arr[i].subj!==base.subj){ best = diffDays(arr[i].date, base.date); break; }
        }
        return best;
    }
    function nearestNextDifferentSubject(idx){
        const base=arr[idx];
        let best=null;
        for(let i=idx+1;i<arr.length;i++){
            if(arr[i].subj!==base.subj){ best = diffDays(base.date, arr[i].date); break; }
        }
        return best;
    }
    const distMap = {};
    arr.forEach((row,idx)=>{
        distMap[row.id] = {
            prev: nearestPrevDifferentSubject(idx),
            next: nearestNextDifferentSubject(idx)
        };
    });
    return distMap;
}

/* ===== Propuestas más repetidas ===== */
function renderStats(modeByExam, modeListByExam, groupsByExamDate){
    const wrap=$id("stats-ribbon"), empty=$id("stats-empty");
    if(wrap) wrap.innerHTML="";
    const items=Object.keys(modeByExam).map(id=>({
        exam: examIdToObj[id],
        mode: modeByExam[id],
        list: modeListByExam[id]||[],
        voters: (groupsByExamDate[id] && groupsByExamDate[id][modeByExam[id].date]) ? groupsByExamDate[id][modeByExam[id].date] : []
    }))
        .filter(x=> !!x.exam && !EXCLUDED_FROM_STATS_SUBJECTS.has(x.exam.subject));

    function compareChrono(a,b){
        if(a.mode.date!==b.mode.date) return a.mode.date.localeCompare(b.mode.date);
        const sa=a.exam.subject, sb=b.exam.subject;
        if(sa!==sb) return sa.localeCompare(sb, "es");
        return EXAM_ORDER.indexOf(a.exam.type) - EXAM_ORDER.indexOf(b.exam.type);
    }
    items.sort(compareChrono);

    const distancesById = prevNextDistancesByMode(items);

    if(!wrap || !empty) return;
    if(items.length===0){ empty.style.display="block"; return; }
    empty.style.display="none";
    items.forEach(({exam,mode,list,voters})=>{
        if(resultsMode){
            const d = distancesById[exam.id] || {prev:null,next:null};
            const card = createResultCard(exam, {
                approvedDate: exam.officialDate,
                suggestionDate: mode.date,
                prev: d.prev,
                next: d.next
            });

            if(list.length>1){
                const det=document.createElement("details");
                const sum=document.createElement("summary");
                sum.textContent="ver otras modas más repetidas";
                det.appendChild(sum);
                const ul=document.createElement("ul");
                list.slice(1,3).forEach((o,i)=>{
                    const li=document.createElement("li");
                    li.textContent=(i===0?"2a":"3a")+": "+formatHuman(o.date)+o.count+" votos";
                    ul.appendChild(li);
                });
                det.appendChild(ul);
                card.appendChild(det);
            }

            const shell=document.createElement("div");
            shell.className="stat-card";
            shell.style.background="transparent";
            shell.style.boxShadow="none";
            shell.style.padding="0";
            shell.style.border="0";
            shell.style.display="block";
            card.style.width="100%";
            shell.appendChild(card);
            wrap.appendChild(shell);

        }else{
            const sig=getSigla(exam.subject); const badge=shortType(exam.type);
            const card=document.createElement("div"); card.className="stat-card";
            const key=sig.display.replace(/\s+/g,""); const fallback=SUBJECT_COLORS[key]||"#4ecaff";
            card.style.setProperty("--subj-tint", hexToRgba(fallback,.5));

            const icon=document.createElement("div"); icon.className="stat-icon-top";
            const img=document.createElement("img"); img.alt=sig.display; img.src="img/"+sig.file+".png"; icon.appendChild(img);
            sampleIcon(img,.5,fallback,(rgba)=> card.style.setProperty("--subj-tint", rgba));
            card.appendChild(icon);

            const top=document.createElement("div"); top.className="stat-top";
            const code=document.createElement("div"); code.className="stat-code"; code.textContent=sig.display; code.title=exam.subject;
            const badgeEl=document.createElement("div"); badgeEl.className="stat-badge"; badgeEl.textContent=badge.badge; badgeEl.title=badge.meaning;
            top.appendChild(code); top.appendChild(badgeEl); card.appendChild(top);

            const date=document.createElement("div"); date.className="stat-date"; date.textContent="moda: "+formatHuman(mode.date);
            card.appendChild(date);

            const sub=document.createElement("div"); sub.className="stat-sub";
            sub.textContent="votado por "+mode.count+" grupos";
            card.appendChild(sub);

            if(list.length>1){
                const det=document.createElement("details"); const sum=document.createElement("summary");
                sum.textContent="ver 2a y 3a moda"; det.appendChild(sum);
                const ul=document.createElement("ul");
                list.slice(1,3).forEach((o,i)=>{
                    const li=document.createElement("li"); li.textContent=(i===0?"2a":"3a")+": "+formatHuman(o.date)+" — "+o.count+" votos";
                    ul.appendChild(li);
                });
                det.appendChild(ul); card.appendChild(det);
            }

            wrap.appendChild(card);
        }
    });
}

/* ===== Distancias entre ganadores ===== */
function nearestBefore(base, thisExamId){
    let best=null;
    Object.keys(lastModeByExamAll).forEach(id=>{
        if(id===thisExamId) return;
        const d=lastModeByExamAll[id].date;
        if(d<base){ const dd=diffDays(d,base); if(best==null||dd<best) best=dd; }
    });
    return best;
}
function nearestAfter(base, thisExamId){
    let best=null;
    Object.keys(lastModeByExamAll).forEach(id=>{
        if(id===thisExamId) return;
        const d=lastModeByExamAll[id].date;
        if(d>base){ const dd=diffDays(base,d); if(best==null||dd<best) best=dd; }
    });
    return best;
}

/* ===== Mezcla remoto + local para fantasmas ===== */
function mergeRemoteWithLocal(remoteGroups, year){
    const s=loadState();
    const map = Object.create(null);
    (remoteGroups||[]).forEach(g=>{
        map[String(g.group_id)] = { group_id:String(g.group_id), year:g.year, proposals:g.proposals||{} };
    });
    Object.entries(s.groups||{}).forEach(([gid, g])=>{
        if(g.year!==year) return;
        if(!map[gid]){
            map[gid] = { group_id:String(gid), year:g.year, proposals:g.proposals||{} };
        }
    });
    return Object.values(map);
}
