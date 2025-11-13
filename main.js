(function () {
    "use strict";

    const STORAGE_KEY = "deptScheduler.v1";

    const YEAR1_RANGE = { min: 1101, max: 1170 };
    const YEAR2_RANGE = { min: 2201, max: 2270 };

    const CAL_START_DATE = "2025-11-01";
    const CAL_END_DATE = "2026-06-30";
    const VACATION_START_DATE = "2025-12-12";
    const VACATION_END_DATE = "2026-01-04";
    const VACATION_SS_START = "2026-03-29";
    const VACATION_SS_END = "2026-04-05";

    const FORCED_REPROGRAM_CUTOFF = "2025-11-23";
    const SELECTION_DAY = "2025-12-02";

    const DAY_NAMES = ["L","M","X","J","V","S","D"];
    const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

    const EXAM_ORDER = ["Primer parcial","Segundo parcial","Tercer parcial","Cuarto parcial","Primer ordinario","Segundo ordinario","Extraordinario"];

    const SUBJECT_SIGLAS = {
        "Embriología Humana": { display: "EMB", file: "EMB" },
        "Anatomía": { display: "ANA", file: "ANA" },
        "Biología Celular e Histología Médica": { display: "HIS", file: "HIS" },
        "Bioquímica y Biología Molecular": { display: "BQM", file: "BQM" },
        "Integración Básico Clínica I": { display: "IBC 1", file: "IBC1" },
        "Integración Básico Clínica II": { display: "IBC 2", file: "IBC2" },
        "Salud Pública y Comunidad": { display: "SPC", file: "SPC" },
        "Introducción a la Salud Mental": { display: "ISM", file: "ISM" },
        "Informática Biomédica I": { display: "IB1", file: "IB1" },
        "Informática Biomédica II": { display: "IB2", file: "IB2" },

        "Fisiología": { display: "FIS", file: "FIS" },
        "Farmacología": { display: "FAR", file: "FAR" },
        "Inmunología": { display: "INM", file: "INM" },
        "Microbiología y Parasitología": { display: "MyP", file: "MyP" },
        "Introducción a la Cirugía": { display: "ICR", file: "ICR" },
        "Promoción de la Salud en el Ciclo de Vida": { display: "PCV", file: "PCV" }
    };

    const SUBJECT_COLORS = {
        ANA:"#f97316", BQM:"#a855f7", HIS:"#e11d48", EMB:"#ef476f", SPC:"#2ec4b6", ISM:"#8ecae6",
        IBC1:"#22d3ee", IBC2:"#06b6d4", IB1:"#00b4d8", IB2:"#00a896",
        FIS:"#60a5fa", FAR:"#f59e0b", INM:"#22c55e", MyP:"#fb7185", ICR:"#38bdf8", PCV:"#14b8a6"
    };

    const examIndex = {};
    const subjectChainsByYear = { 1:{}, 2:{} };

    let currentGroupId = null;
    let currentYear = 1;

    let lastModeByExam = {};
    let lastModeListByExam = {};
    let lastPrevNextByExam = {};
    let lastGroupsByExamDate = {};

    /* Utils */
    function parseDate(s){ const p=s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
    function formatDate(y,m,d){ return y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0"); }
    function formatHumanDate(s){ if(!s) return ""; const p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }
    function formatHumanDateShort(s){ if(!s) return ""; const p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0].slice(2); }
    function isDateWithinCalendar(s){ return s>=CAL_START_DATE && s<=CAL_END_DATE; }
    function isDateInVacation(s){ return (s>=VACATION_START_DATE && s<=VACATION_END_DATE) || (s>=VACATION_SS_START && s<=VACATION_SS_END); }
    function isWeekend(s){ return parseDate(s).getDay()===0; }
    function isDateValidForExam(s){ if(!isDateWithinCalendar(s)) return false; if(isWeekend(s)) return false; if(isDateInVacation(s)) return false; if(s===SELECTION_DAY) return false; return true; }
    function diffDays(aStr,bStr){ const a=parseDate(aStr), b=parseDate(bStr); return Math.round(Math.abs(b-a)/86400000); }
    function hexToRgba(hex, a){ const h=hex.replace("#",""); const n=parseInt(h,16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255; return `rgba(${r},${g},${b},${a})`; }

    /* Muestreo 1x1 del ícono (primer píxel). Cacheado. */
    const sampledColorCache = new Map();
    function sampleIconColor(imgEl, alpha, fallbackHex, apply){
        const key = imgEl.getAttribute("src") + "@" + alpha;
        if(sampledColorCache.has(key)){ apply(sampledColorCache.get(key)); return; }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgEl.src;
        if (img.complete) { compute(); } else { img.addEventListener("load", compute); }
        function compute(){
            try{
                const c = document.createElement("canvas");
                c.width = 1; c.height = 1;
                const ctx = c.getContext("2d");
                ctx.drawImage(img, 0, 0, 1, 1);
                const d = ctx.getImageData(0, 0, 1, 1).data;
                const rgba = `rgba(${d[0]},${d[1]},${d[2]},${alpha})`;
                sampledColorCache.set(key, rgba);
                apply(rgba);
            }catch(e){
                apply(hexToRgba(fallbackHex, alpha));
            }
        }
    }

    /* Storage */
    function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return {groups:{}}; const p=JSON.parse(raw); if(!p.groups) p.groups={}; return p; }catch(e){ return {groups:{}}; } }
    function saveState(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){} }

    /* Índices / cadenas */
    function buildExamIndices(){
        [1,2].forEach(year=>{
            const exams=EXAMS_BY_YEAR[year];
            exams.forEach(exam=>{ examIndex[exam.id]=exam; });
            const bySubject={};
            exams.forEach(e=>{ (bySubject[e.subject] ||= []).push(e); });
            const chains={};
            Object.keys(bySubject).forEach(sub=>{
                const list=bySubject[sub].slice().sort((a,b)=>{
                    const ia=EXAM_ORDER.indexOf(a.type), ib=EXAM_ORDER.indexOf(b.type);
                    return (ia-ib) || a.officialDate.localeCompare(b.officialDate);
                });
                chains[sub]=list.map(e=>e.id);
            });
            subjectChainsByYear[year]=chains;
        });
    }

    /* Calendario */
    function getMonthList(){
        const list=[]; const start=parseDate(CAL_START_DATE), end=parseDate(CAL_END_DATE);
        let c=new Date(start.getFullYear(), start.getMonth(), 1);
        while(c<=end){ list.push({year:c.getFullYear(), month:c.getMonth()}); c.setMonth(c.getMonth()+1); }
        return list;
    }

    function buildCalendars(){
        const calendar=document.getElementById("calendar");
        calendar.innerHTML="";
        getMonthList().forEach(({year,month})=>{
            const monthSection=document.createElement("section"); monthSection.className="month";
            const header=document.createElement("header"); header.className="month-header";
            const title=document.createElement("h3"); title.textContent=MONTH_NAMES[month]+" "+year; header.appendChild(title);
            const meta=document.createElement("span"); meta.textContent="Calendario continuo"; header.appendChild(meta);
            monthSection.appendChild(header);

            const grid=document.createElement("div"); grid.className="month-grid";
            DAY_NAMES.forEach(label=>{ const cell=document.createElement("div"); cell.className="day-name"; cell.textContent=label; grid.appendChild(cell); });

            const firstDayJs=new Date(year,month,1).getDay();
            const startIndex=(firstDayJs+6)%7;
            for(let i=0;i<startIndex;i++){ const empty=document.createElement("div"); empty.className="day-cell empty"; grid.appendChild(empty); }

            const daysInMonth=new Date(year,month+1,0).getDate();
            for(let day=1; day<=daysInMonth; day++){
                const dateStr=formatDate(year, month+1, day);
                const cell=document.createElement("div"); cell.className="day-cell"; cell.dataset.date=dateStr;
                const dow=parseDate(dateStr).getDay();
                if(dow===0) cell.classList.add("weekend");
                if(isDateInVacation(dateStr)) cell.classList.add("vacation");

                const headerRow=document.createElement("div"); headerRow.className="day-header";
                const numSpan=document.createElement("span"); numSpan.className="day-number"; numSpan.textContent=String(day);
                const metaSpan=document.createElement("span"); metaSpan.className="day-meta";
                if(dateStr===CAL_START_DATE) metaSpan.textContent="Inicio";
                else if(dateStr===CAL_END_DATE) metaSpan.textContent="Fin";
                else if(isDateInVacation(dateStr)) metaSpan.textContent="Vacaciones";
                else if(dow===0) metaSpan.textContent="Fin de semana";
                headerRow.appendChild(numSpan); headerRow.appendChild(metaSpan);
                cell.appendChild(headerRow);

                const list=document.createElement("div"); list.className="exam-list"; cell.appendChild(list);
                grid.appendChild(cell);
            }

            monthSection.appendChild(grid);
            calendar.appendChild(monthSection);
        });
        wireDropTargets();
        syncExternalCardWidth();
    }

    function wireDropTargets(){
        document.querySelectorAll(".day-cell").forEach(cell=>{
            cell.addEventListener("dragover", e=>{ e.preventDefault(); cell.classList.add("drop-target"); });
            cell.addEventListener("dragleave", ()=> cell.classList.remove("drop-target"));
            cell.addEventListener("drop", e=>{
                e.preventDefault(); cell.classList.remove("drop-target");
                const examId=e.dataTransfer.getData("text/plain");
                const dateStr=cell.dataset.date;
                if(examId && dateStr) moveExamToDate(examId, dateStr);
            });
        });
    }

    function syncExternalCardWidth(){
        const sample=document.querySelector(".month .month-grid .day-cell:not(.empty)");
        if(!sample) return;
        const cs=getComputedStyle(sample);
        const w=Math.max(150, Math.round(sample.clientWidth - (parseFloat(cs.paddingLeft)||0) - (parseFloat(cs.paddingRight)||0)));
        document.documentElement.style.setProperty("--day-cell-w", w + "px");
    }

    /* Estado por grupo */
    function createInitialGroupEntry(groupId, year){
        const entry={ year, exams:{} };
        const exams=EXAMS_BY_YEAR[year]||[];
        exams.forEach(ex=>{ if(ex.officialDate) entry.exams[ex.id]=ex.officialDate; });
        return entry;
    }
    function ensureGroupInitialized(groupId, year){
        const state=loadState();
        if(!state.groups[groupId]){ state.groups[groupId]=createInitialGroupEntry(groupId, year); saveState(state); }
        else if(!state.groups[groupId].year){ state.groups[groupId].year=year; saveState(state); }
    }
    function setCurrentGroup(groupNumber){
        const status=document.getElementById("group-status");
        const statsYearSelect=document.getElementById("stats-year");
        if(!groupNumber || isNaN(groupNumber)){ currentGroupId=null; status.textContent="Escribe un grupo entre 1101–1170 o 2201–2270"; return; }
        let year=null;
        if(groupNumber>=YEAR1_RANGE.min && groupNumber<=YEAR1_RANGE.max) year=1;
        else if(groupNumber>=YEAR2_RANGE.min && groupNumber<=YEAR2_RANGE.max) year=2;
        else { currentGroupId=null; status.textContent="Grupo fuera de rango (solo 1101–1170 y 2201–2270)"; return; }

        currentGroupId=String(groupNumber);
        currentYear=year;
        status.textContent=year===1?"Primer año":"Segundo año";
        if(statsYearSelect) statsYearSelect.value=String(year);

        ensureGroupInitialized(currentGroupId, currentYear);
        renderCurrentGroup();
        recomputeStatsAndGhosts();
    }

    /* Tarjeta */
    function getSigla(subject){
        const s = SUBJECT_SIGLAS[subject];
        if (s) return s;
        const base = subject.replace(/[^A-Za-zÁÉÍÓÚÜÑ ]/g,"").trim();
        const display = base.split(" ").map(w=>w[0]).join("").slice(0,3).toUpperCase();
        return { display, file: display };
    }
    function shortType(examType){
        switch (examType) {
            case "Primer parcial": return { badge: "PAR 1", meaning: "Parcial 1" };
            case "Segundo parcial": return { badge: "PAR 2", meaning: "Parcial 2" };
            case "Tercer parcial": return { badge: "PAR 3", meaning: "Parcial 3" };
            case "Cuarto parcial": return { badge: "PAR 4", meaning: "Parcial 4" };
            case "Primer ordinario": return { badge: "ORD 1", meaning: "Ordinario (final) 1" };
            case "Segundo ordinario": return { badge: "ORD 2", meaning: "Ordinario (final) 2" };
            case "Extraordinario": return { badge: "EXT 1", meaning: "Extraordinario" };
            default: return { badge: examType, meaning: examType };
        }
    }

    function createExamCard(exam, scheduledDate, statusClass, highlightForced){
        const sigla=getSigla(exam.subject);
        const badge=shortType(exam.type);
        const prevNext=lastPrevNextByExam[exam.id] || { prevDistance:null, nextDistance:null };
        const mode=lastModeByExam[exam.id];

        const card=document.createElement("div");
        card.className="exam-card "+statusClass;
        if(highlightForced) card.classList.add("forced");
        card.draggable=true;
        card.dataset.examId=exam.id;

        /* tinte del ícono: más translúcido (.08) */
        const key = sigla.display.replace(/\s+/g,"");
        const fallbackHex = SUBJECT_COLORS[key] || "#4ecaff";
        card.style.setProperty("--subj-tint", hexToRgba(fallbackHex, .08));
        const head=document.createElement("div"); head.className="exam-head2";

        const icon=document.createElement("div"); icon.className="exam-icon-vert";
        const img=document.createElement("img"); img.alt=sigla.display; img.src="img/"+(sigla.file)+".png";
        icon.appendChild(img);
        sampleIconColor(img, .08, fallbackHex, (rgba)=> card.style.setProperty("--subj-tint", rgba));

        const titleBox=document.createElement("div"); titleBox.className="exam-title";
        const sigSpan=document.createElement("div"); sigSpan.className="exam-sigla"; sigSpan.textContent=sigla.display; sigSpan.title = exam.subject;
        const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title = badge.meaning;

        titleBox.appendChild(sigSpan); titleBox.appendChild(badgeEl);
        head.appendChild(icon); head.appendChild(titleBox);
        card.appendChild(head);

        /* Fechas y distancias abreviadas */
        card.appendChild(lineStacked("última fecha aprobada:", formatHumanDateShort(scheduledDate)));
        card.appendChild(lineStacked("sugerencia de reprogramación:", mode?formatHumanDateShort(mode.date):"—"));

        const prevTxt = (prevNext.prevDistance!=null) ? `${prevNext.prevDistance} días atrás` : "—";
        const nextTxt = (prevNext.nextDistance!=null) ? `${prevNext.nextDistance} días` : "—";
        card.appendChild(line("Último departamental según votos:", prevTxt));
        card.appendChild(line("Próximo departamental según votos:", nextTxt));

        card.addEventListener("dragstart", e=>{ e.dataTransfer.setData("text/plain", exam.id); e.dataTransfer.effectAllowed="move"; card.classList.add("dragging"); });
        card.addEventListener("dragend", ()=> card.classList.remove("dragging"));

        return card;
    }

    function line(labelText, valueText){
        const row=document.createElement("div"); row.className="exam-line";
        const label=document.createElement("span"); label.className="line-label"; label.textContent=labelText;
        const value=document.createElement("span"); value.className="line-value"; value.textContent=valueText;
        row.appendChild(label); row.appendChild(value); return row;
    }
    function lineStacked(labelText, valueText){
        const row=document.createElement("div"); row.className="exam-line stacked";
        const label=document.createElement("span"); label.className="line-label"; label.textContent=labelText;
        const value=document.createElement("span"); value.className="line-value"; value.textContent=valueText;
        row.appendChild(label); row.appendChild(value); return row;
    }

    /* Render por grupo */
    function renderCurrentGroup(){
        if(!currentGroupId || !currentYear) return;
        const state=loadState();
        const group=state.groups[currentGroupId];
        if(!group) return;

        const schedule=group.exams || {};
        document.querySelectorAll(".exam-list").forEach(list=> list.innerHTML="");
        const pendingList=document.getElementById("pending-exams-list"); if(pendingList) pendingList.innerHTML="";
        const exams=EXAMS_BY_YEAR[currentYear] || [];

        exams.forEach(exam=>{
            const stored=schedule[exam.id];
            const isOriginalBeforeParo=exam.officialDate < FORCED_REPROGRAM_CUTOFF;
            const neverMoved=!stored || stored===exam.officialDate;

            const scheduledDate=stored || exam.officialDate;
            const valid=isDateValidForExam(scheduledDate);
            const isOfficial=scheduledDate===exam.officialDate;
            const forcedOriginal=exam.officialDate < FORCED_REPROGRAM_CUTOFF;

            let statusClass=""; if(!valid) statusClass="status-invalid"; else if(isOfficial) statusClass="status-original"; else statusClass="status-valid";
            const highlightForced=forcedOriginal && !valid;
            const card=createExamCard(exam, scheduledDate, statusClass, highlightForced);

            const dayCell=document.querySelector('.day-cell[data-date="'+scheduledDate+'"]');
            const placeInPending=(isOriginalBeforeParo && neverMoved) || !dayCell || !isDateWithinCalendar(scheduledDate);

            if(!placeInPending && dayCell && isDateWithinCalendar(scheduledDate)){
                const list=dayCell.querySelector(".exam-list"); if(list) list.appendChild(card);
            }else if(pendingList){ pendingList.appendChild(card); }
        });
    }

    function moveExamToDate(examId, dateStr){
        if(!currentGroupId || !currentYear) return;
        if(!isDateWithinCalendar(dateStr)){ alert("La fecha está fuera del rango noviembre 2025–junio 2026."); return; }
        if(!isDateValidForExam(dateStr)){ alert("Esa fecha es inválida (fin de semana o periodo vacacional)."); return; }

        const state=loadState();
        if(!state.groups[currentGroupId]) state.groups[currentGroupId]=createInitialGroupEntry(currentGroupId, currentYear);
        if(!state.groups[currentGroupId].exams) state.groups[currentGroupId].exams={};
        state.groups[currentGroupId].exams[examId]=dateStr;
        saveState(state);
        renderCurrentGroup();
        recomputeStatsAndGhosts();
    }

    /* Distancias y fantasmas */
    function computePrevNextDistances(year, exam, candidateDate, modeByExam){
        const chains=subjectChainsByYear[year] || {};
        const chain=chains[exam.subject] || [];
        const result={ prevDistance:null, prevLabel:"", nextDistance:null, nextLabel:"" };
        const idx=chain.indexOf(exam.id);
        if(idx===-1) return result;

        const prevId=idx>0? chain[idx-1] : null;
        const nextId=idx<chain.length-1? chain[idx+1] : null;

        if(prevId){
            const prevExam=examIndex[prevId];
            let prevDate=prevExam? prevExam.officialDate : null;
            if(modeByExam[prevId]) prevDate=modeByExam[prevId].date;
            if(prevDate){ result.prevDistance=diffDays(prevDate, candidateDate); result.prevLabel=prevExam? prevExam.type : "anterior"; }
        }
        if(nextId){
            const nextExam=examIndex[nextId];
            let nextDate=nextExam? nextExam.officialDate : null;
            if(modeByExam[nextId]) nextDate=modeByExam[nextId].date;
            if(nextDate){ result.nextDistance=diffDays(candidateDate, nextDate); result.nextLabel=nextExam? nextExam.type : "siguiente"; }
        }
        return result;
    }

    function renderGhosts(year, modeByExam){
        document.querySelectorAll(".ghost-date").forEach(el=> el.remove());
        Object.keys(modeByExam).forEach(examId=>{
            const mode=modeByExam[examId]; const exam=examIndex[examId]; if(!exam) return;
            const dateStr=mode.date;
            const cell=document.querySelector('.day-cell[data-date="'+dateStr+'"]');
            if(!cell) return;

            const prevNext=computePrevNextDistances(year, exam, dateStr, modeByExam);
            lastPrevNextByExam[examId]=prevNext;

            const sigla=getSigla(exam.subject);
            const voters=(lastGroupsByExamDate[examId] && lastGroupsByExamDate[examId][dateStr]) ? lastGroupsByExamDate[examId][dateStr] : [];

            const ghost=document.createElement("div"); ghost.className="ghost-date"; ghost.dataset.examId=examId; ghost.dataset.date=dateStr;
            const lines=[
                `${sigla.display} – ${shortType(exam.type).badge}`,
                "este está siendo el día más votado para el examen por toda la generación, según el grupo:",
                voters.length ? voters.sort((a,b)=>a-b).join(", ") : "—"
            ];
            ghost.setAttribute("data-tooltip", lines.join("\n"));
            cell.appendChild(ghost);
        });
    }

    /* Ribbon Próximos */
    function renderStatsRibbon(year, modeByExam, modeListByExam){
        const wrap=document.getElementById("stats-ribbon"); if(!wrap) return;
        wrap.innerHTML="";
        const items=Object.keys(modeByExam).map(examId=>{
            const exam=examIndex[examId]; const mode=modeByExam[examId];
            return { exam, mode, list: modeListByExam[examId] || [] };
        }).sort((a,b)=> a.mode.date.localeCompare(b.mode.date));

        items.forEach(({exam,mode,list})=>{
            const sigla=getSigla(exam.subject);
            const badge=shortType(exam.type);
            const card=document.createElement("div"); card.className="stat-card";

            const key=sigla.display.replace(/\s+/g,"");
            const fallbackHex=SUBJECT_COLORS[key] || "#4ecaff";
            card.style.setProperty("--subj-tint", hexToRgba(fallbackHex, .07)); /* un poco más translúcido */

            const icon=document.createElement("div"); icon.className="stat-icon-top";
            const img=document.createElement("img"); img.alt=sigla.display; img.src="img/"+sigla.file+".png";
            icon.appendChild(img);
            sampleIconColor(img, .07, fallbackHex, (rgba)=> card.style.setProperty("--subj-tint", rgba));
            card.appendChild(icon);

            const top=document.createElement("div"); top.className="stat-top";
            const code=document.createElement("div"); code.className="stat-code"; code.textContent=sigla.display; code.title=exam.subject;
            const badgeEl=document.createElement("div"); badgeEl.className="stat-badge"; badgeEl.textContent=badge.badge; badgeEl.title=badge.meaning;
            top.appendChild(code); top.appendChild(badgeEl); card.appendChild(top);

            const date=document.createElement("div"); date.className="stat-date"; date.textContent="moda: "+formatHumanDate(mode.date);
            const sub=document.createElement("div"); sub.className="stat-sub";
            const voters=(lastGroupsByExamDate[exam.id] && lastGroupsByExamDate[exam.id][mode.date]) ? lastGroupsByExamDate[exam.id][mode.date] : [];
            sub.textContent="votado por "+mode.count+" grupos";
            if(voters.length){ sub.title="Grupos: "+voters.sort((a,b)=>a-b).join(", "); }
            card.appendChild(date); card.appendChild(sub);

            if(list.length>1){
                const alt=document.createElement("div"); alt.className="stat-alt";
                const det=document.createElement("details");
                const sum=document.createElement("summary"); sum.textContent="ver 2a y 3a moda";
                det.appendChild(sum);
                const ul=document.createElement("ul");
                list.slice(1,3).forEach((opt,idx)=>{
                    const g=(lastGroupsByExamDate[exam.id] && lastGroupsByExamDate[exam.id][opt.date]) ? lastGroupsByExamDate[exam.id][opt.date] : [];
                    const li=document.createElement("li");
                    li.textContent=(idx===0?"2a":"3a")+": "+formatHumanDate(opt.date)+" — "+opt.count+" votos";
                    if(g.length) li.title="Grupos: "+g.sort((a,b)=>a-b).join(", ");
                    ul.appendChild(li);
                });
                det.appendChild(ul); alt.appendChild(det); card.appendChild(alt);
            }
            wrap.appendChild(card);
        });
    }

    /* Cómputo modas y distancias */
    function recomputeStatsAndGhosts(){
        const statsYearSelect=document.getElementById("stats-year");
        const yearValue=statsYearSelect? Number(statsYearSelect.value) : currentYear || 1;
        const year=yearValue || 1;

        const state=loadState();
        const groupsEntries=Object.entries(state.groups || {}).filter(([_,g])=> g && g.year===year);

        const exams=EXAMS_BY_YEAR[year] || [];
        const examIds=exams.map(e=>e.id);

        const countsByExamAndDate={}; examIds.forEach(id=> countsByExamAndDate[id]={});
        const groupsByExamAndDate={}; examIds.forEach(id=> groupsByExamAndDate[id]={});

        groupsEntries.forEach(([gid,g])=>{
            const map=g.exams || {};
            examIds.forEach(examId=>{
                const dateStr=map[examId];
                if(!dateStr) return;
                if(!isDateWithinCalendar(dateStr)) return;
                (countsByExamAndDate[examId][dateStr] ||= 0);
                countsByExamAndDate[examId][dateStr] += 1;
                (groupsByExamAndDate[examId][dateStr] ||= []);
                groupsByExamAndDate[examId][dateStr].push(gid);
            });
        });

        const modeByExam={}; const modeListByExam={};
        Object.keys(countsByExamAndDate).forEach(examId=>{
            const dateMap=countsByExamAndDate[examId];
            const list=Object.keys(dateMap).map(d=>({date:d, count:dateMap[d]}));
            list.sort((a,b)=> b.count - a.count || a.date.localeCompare(b.date));
            if(list.length){ modeByExam[examId]=list[0]; modeListByExam[examId]=list; }
        });

        lastModeByExam=modeByExam;
        lastModeListByExam=modeListByExam;
        lastGroupsByExamDate=groupsByExamAndDate;

        renderGhosts(year, modeByExam);
        renderStatsRibbon(year, modeByExam, modeListByExam);
    }

    /* Controles */
    function wireGroupSelector(){
        const input=document.getElementById("group-input"); if(!input) return;
        input.addEventListener("change", ()=> setCurrentGroup(parseInt(input.value,10)));
        input.addEventListener("blur", ()=> setCurrentGroup(parseInt(input.value,10)));
        input.addEventListener("keydown", e=>{ if(e.key==="Enter") setCurrentGroup(parseInt(input.value,10)); });
    }
    function wireStatsControls(){
        const select=document.getElementById("stats-year"); if(!select) return;
        select.addEventListener("change", ()=> recomputeStatsAndGhosts());
    }
    function onResize(){
        let t=null;
        window.addEventListener("resize", ()=>{ if(t) clearTimeout(t); t=setTimeout(syncExternalCardWidth, 120); });
    }

    /* Datos (idénticos a la versión previa funcional) */
    const EXAMS_BY_YEAR = {
        1: [
            { id: "1-ANAT-P1", subject: "Anatomía", type: "Primer parcial", officialDate: "2025-10-25", officialTime: "10:30" },
            { id: "1-ANAT-P2", subject: "Anatomía", type: "Segundo parcial", officialDate: "2025-11-29", officialTime: "08:00" },
            { id: "1-ANAT-P3", subject: "Anatomía", type: "Tercer parcial", officialDate: "2026-02-28", officialTime: "08:00" },
            { id: "1-ANAT-P4", subject: "Anatomía", type: "Cuarto parcial", officialDate: "2026-04-25", officialTime: "08:00" },
            { id: "1-ANAT-O1", subject: "Anatomía", type: "Primer ordinario", officialDate: "2026-05-04", officialTime: "08:00" },
            { id: "1-ANAT-O2", subject: "Anatomía", type: "Segundo ordinario", officialDate: "2026-05-18", officialTime: "08:00" },
            { id: "1-ANAT-EX", subject: "Anatomía", type: "Extraordinario", officialDate: "2026-06-03", officialTime: "08:00" },

            { id: "1-BQBM-P1", subject: "Bioquímica y Biología Molecular", type: "Primer parcial", officialDate: "2025-10-18", officialTime: "10:30" },
            { id: "1-BQBM-P2", subject: "Bioquímica y Biología Molecular", type: "Segundo parcial", officialDate: "2025-12-06", officialTime: "08:00" },
            { id: "1-BQBM-P3", subject: "Bioquímica y Biología Molecular", type: "Tercer parcial", officialDate: "2026-02-21", officialTime: "08:00" },
            { id: "1-BQBM-P4", subject: "Bioquímica y Biología Molecular", type: "Cuarto parcial", officialDate: "2026-04-18", officialTime: "08:00" },
            { id: "1-BQBM-O1", subject: "Bioquímica y Biología Molecular", type: "Primer ordinario", officialDate: "2026-05-07", officialTime: "08:00" },
            { id: "1-BQBM-O2", subject: "Bioquímica y Biología Molecular", type: "Segundo ordinario", officialDate: "2026-05-26", officialTime: "08:00" },
            { id: "1-BQBM-EX", subject: "Bioquímica y Biología Molecular", type: "Extraordinario", officialDate: "2026-06-10", officialTime: "08:00" },

            { id: "1-BCHM-P1", subject: "Biología Celular e Histología Médica", type: "Primer parcial", officialDate: "2025-10-31", officialTime: "08:00" },
            { id: "1-BCHM-P2", subject: "Biología Celular e Histología Médica", type: "Segundo parcial", officialDate: "2026-01-20", officialTime: "08:00" },
            { id: "1-BCHM-P3", subject: "Biología Celular e Histología Médica", type: "Tercer parcial", officialDate: "2026-04-21", officialTime: "08:00" },
            { id: "1-BCHM-O1", subject: "Biología Celular e Histología Médica", type: "Primer ordinario", officialDate: "2026-05-11", officialTime: "08:00" },
            { id: "1-BCHM-O2", subject: "Biología Celular e Histología Médica", type: "Segundo ordinario", officialDate: "2026-05-21", officialTime: "08:00" },
            { id: "1-BCHM-EX", subject: "Biología Celular e Histología Médica", type: "Extraordinario", officialDate: "2026-06-06", officialTime: "08:00" },

            { id: "1-EMBR-P1", subject: "Embriología Humana", type: "Primer parcial", officialDate: "2025-11-08", officialTime: "08:00" },
            { id: "1-EMBR-P2", subject: "Embriología Humana", type: "Segundo parcial", officialDate: "2026-02-07", officialTime: "08:00" },
            { id: "1-EMBR-P3", subject: "Embriología Humana", type: "Tercer parcial", officialDate: "2026-04-14", officialTime: "08:00" },
            { id: "1-EMBR-O1", subject: "Embriología Humana", type: "Primer ordinario", officialDate: "2026-04-30", officialTime: "08:00" },
            { id: "1-EMBR-O2", subject: "Embriología Humana", type: "Segundo ordinario", officialDate: "2026-05-14", officialTime: "08:00" },
            { id: "1-EMBR-EX", subject: "Embriología Humana", type: "Extraordinario", officialDate: "2026-05-30", officialTime: "10:30" },

            { id: "1-INF1-P2", subject: "Informática Biomédica I", type: "Segundo parcial", officialDate: "2026-04-16", officialTime: "08:00" },
            { id: "1-INF1-O1", subject: "Informática Biomédica I", type: "Primer ordinario", officialDate: "2026-04-27", officialTime: "09:00" },
            { id: "1-INF1-O2", subject: "Informática Biomédica I", type: "Segundo ordinario", officialDate: "2026-05-16", officialTime: "11:00" },
            { id: "1-INF1-EX", subject: "Informática Biomédica I", type: "Extraordinario", officialDate: "2026-06-01", officialTime: "08:00" },

            { id: "1-IBC1-P1", subject: "Integración Básico Clínica I", type: "Primer parcial", officialDate: "2026-01-17", officialTime: "09:00" },
            { id: "1-IBC1-P2", subject: "Integración Básico Clínica I", type: "Segundo parcial", officialDate: "2026-04-23", officialTime: "08:00" },
            { id: "1-IBC1-O1", subject: "Integración Básico Clínica I", type: "Primer ordinario", officialDate: "2026-05-02", officialTime: "13:00" },
            { id: "1-IBC1-O2", subject: "Integración Básico Clínica I", type: "Segundo ordinario", officialDate: "2026-05-25", officialTime: "11:00" },
            { id: "1-IBC1-EX", subject: "Integración Básico Clínica I", type: "Extraordinario", officialDate: "2026-06-09", officialTime: "08:00" },

            { id: "1-ISM-P1", subject: "Introducción a la Salud Mental", type: "Primer parcial", officialDate: "2026-01-08", officialTime: "09:00" },
            { id: "1-ISM-P2", subject: "Introducción a la Salud Mental", type: "Segundo parcial", officialDate: "2026-04-08", officialTime: "09:00" },
            { id: "1-ISM-O1", subject: "Introducción a la Salud Mental", type: "Primer ordinario", officialDate: "2026-05-09", officialTime: "08:00" },
            { id: "1-ISM-O2", subject: "Introducción a la Salud Mental", type: "Segundo ordinario", officialDate: "2026-05-23", officialTime: "08:00" },
            { id: "1-ISM-EX", subject: "Introducción a la Salud Mental", type: "Extraordinario", officialDate: "2026-06-08", officialTime: "08:00" },

            { id: "1-SPC-P1", subject: "Salud Pública y Comunidad", type: "Primer parcial", officialDate: "2025-12-10", officialTime: "15:00" },
            { id: "1-SPC-P2", subject: "Salud Pública y Comunidad", type: "Segundo parcial", officialDate: "2026-02-19", officialTime: "09:00" },
            { id: "1-SPC-O1", subject: "Salud Pública y Comunidad", type: "Primer ordinario", officialDate: "2026-05-05", officialTime: "08:00" },
            { id: "1-SPC-O2", subject: "Salud Pública y Comunidad", type: "Segundo ordinario", officialDate: "2026-05-13", officialTime: "09:00" },
            { id: "1-SPC-EX", subject: "Salud Pública y Comunidad", type: "Extraordinario", officialDate: "2026-06-04", officialTime: "11:00" }
        ],
        2: [
            { id: "2-FARM-P1", subject: "Farmacología", type: "Primer parcial", officialDate: "2025-10-14", officialTime: "15:00" },
            { id: "2-FARM-P2", subject: "Farmacología", type: "Segundo parcial", officialDate: "2026-01-24", officialTime: "08:00" },
            { id: "2-FARM-P3", subject: "Farmacología", type: "Tercer parcial", officialDate: "2026-04-06", officialTime: "15:00" },
            { id: "2-FARM-O1", subject: "Farmacología", type: "Primer ordinario", officialDate: "2026-05-06", officialTime: "15:00" },
            { id: "2-FARM-O2", subject: "Farmacología", type: "Segundo ordinario", officialDate: "2026-05-16", officialTime: "08:00" },
            { id: "2-FARM-EX", subject: "Farmacología", type: "Extraordinario", officialDate: "2026-06-04", officialTime: "08:00" },

            { id: "2-FISIO-P1", subject: "Fisiología", type: "Primer parcial", officialDate: "2025-10-24", officialTime: "08:00" },
            { id: "2-FISIO-P2", subject: "Fisiología", type: "Segundo parcial", officialDate: "2026-02-14", officialTime: "08:00" },
            { id: "2-FISIO-P3", subject: "Fisiología", type: "Tercer parcial", officialDate: "2026-04-23", officialTime: "13:00" },
            { id: "2-FISIO-O1", subject: "Fisiología", type: "Primer ordinario", officialDate: "2026-05-08", officialTime: "11:00" },
            { id: "2-FISIO-O2", subject: "Fisiología", type: "Segundo ordinario", officialDate: "2026-05-20", officialTime: "08:00" },
            { id: "2-FISIO-EX", subject: "Fisiología", type: "Extraordinario", officialDate: "2026-06-09", officialTime: "13:00" },

            { id: "2-INMU-P1", subject: "Inmunología", type: "Primer parcial", officialDate: "2025-10-08", officialTime: "13:00" },
            { id: "2-INMU-P2", subject: "Inmunología", type: "Segundo parcial", officialDate: "2026-01-31", officialTime: "08:00" },
            { id: "2-INMU-P3", subject: "Inmunología", type: "Tercer parcial", officialDate: "2026-04-17", officialTime: "08:00" },
            { id: "2-INMU-O1", subject: "Inmunología", type: "Primer ordinario", officialDate: "2026-04-30", officialTime: "14:00" },
            { id: "2-INMU-O2", subject: "Inmunología", type: "Segundo ordinario", officialDate: "2026-05-25", officialTime: "08:00" },
            { id: "2-INMU-EX", subject: "Inmunología", type: "Extraordinario", officialDate: "2026-06-01", officialTime: "11:00" },

            { id: "2-INF2-P1", subject: "Informática Biomédica II", type: "Primer parcial", officialDate: "2025-09-27", officialTime: "08:00" },
            { id: "2-INF2-P2", subject: "Informática Biomédica II", type: "Segundo parcial", officialDate: "2025-11-26", officialTime: "15:00" },
            { id: "2-INF2-O1", subject: "Informática Biomédica II", type: "Primer ordinario", officialDate: "2025-12-02", officialTime: "08:00" },
            { id: "2-INF2-O2", subject: "Informática Biomédica II", type: "Segundo ordinario", officialDate: "2025-12-08", officialTime: "13:00" },
            { id: "2-INF2-EX", subject: "Informática Biomédica II", type: "Extraordinario", officialDate: "2026-06-02", officialTime: "08:00" },

            { id: "2-IBC2-P1", subject: "Integración Básico Clínica II", type: "Primer parcial", officialDate: "2025-12-11", officialTime: "09:00" },
            { id: "2-IBC2-P2", subject: "Integración Básico Clínica II", type: "Segundo parcial", officialDate: "2026-04-25", officialTime: "08:00" },
            { id: "2-IBC2-O1", subject: "Integración Básico Clínica II", type: "Primer ordinario", officialDate: "2026-05-08", officialTime: "14:00" },
            { id: "2-IBC2-O2", subject: "Integración Básico Clínica II", type: "Segundo ordinario", officialDate: "2026-05-26", officialTime: "13:00" },
            { id: "2-IBC2-EX", subject: "Integración Básico Clínica II", type: "Extraordinario", officialDate: "2026-06-08", officialTime: "11:00" },

            { id: "2-CIR-P1", subject: "Introducción a la Cirugía", type: "Primer parcial", officialDate: "2026-01-10", officialTime: "08:00" },
            { id: "2-CIR-P2", subject: "Introducción a la Cirugía", type: "Segundo parcial", officialDate: "2026-04-11", officialTime: "08:00" },
            { id: "2-CIR-O1", subject: "Introducción a la Cirugía", type: "Primer ordinario", officialDate: "2026-04-28", officialTime: "13:00" },
            { id: "2-CIR-O2", subject: "Introducción a la Cirugía", type: "Segundo ordinario", officialDate: "2026-05-21", officialTime: "12:00" },
            { id: "2-CIR-EX", subject: "Introducción a la Cirugía", type: "Extraordinario", officialDate: "2026-05-29", officialTime: "08:00" },

            { id: "2-MICRO-P1", subject: "Microbiología y Parasitología", type: "Primer parcial", officialDate: "2025-12-06", officialTime: "13:00" },
            { id: "2-MICRO-P2", subject: "Microbiología y Parasitología", type: "Segundo parcial", officialDate: "2026-04-13", officialTime: "15:00" },
            { id: "2-MICRO-O1", subject: "Microbiología y Parasitología", type: "Primer ordinario", officialDate: "2026-05-02", officialTime: "08:00" },
            { id: "2-MICRO-O2", subject: "Microbiología y Parasitología", type: "Segundo ordinario", officialDate: "2026-05-13", officialTime: "12:00" },
            { id: "2-MICRO-EX", subject: "Microbiología y Parasitología", type: "Extraordinario", officialDate: "2026-05-30", officialTime: "08:00" },

            { id: "2-PSCV-P1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer parcial", officialDate: "2025-11-18", officialTime: "09:00" },
            { id: "2-PSCV-P2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo parcial", officialDate: "2026-04-15", officialTime: "15:00" },
            { id: "2-PSCV-O1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer ordinario", officialDate: "2026-05-11", officialTime: "15:00" },
            { id: "2-PSCV-O2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo ordinario", officialDate: "2026-05-18", officialTime: "14:00" },
            { id: "2-PSCV-EX", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Extraordinario", officialDate: "2026-06-06", officialTime: "09:00" }
        ]
    };

    /* Init */
    document.addEventListener("DOMContentLoaded", function () {
        buildExamIndices();
        buildCalendars();
        wireGroupSelector();
        wireStatsControls();
        onResize();

        const input=document.getElementById("group-input");
        if (input) { input.value = String(YEAR1_RANGE.min); setCurrentGroup(YEAR1_RANGE.min); }
        else { recomputeStatsAndGhosts(); }
    });
})();
