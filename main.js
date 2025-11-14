(function () {
    "use strict";

    /* =================== Config y Constantes =================== */

    const STORAGE_KEY = "deptScheduler.v9";               // bump por cambios
    const CSV_DB_KEY  = "deptScheduler.csvDB.v2";         // respaldo si no hay OPFS

    const YEAR1_RANGE = { min: 1101, max: 1170 };
    const YEAR2_RANGE = { min: 2201, max: 2270 };

    const CAL_START_DATE = "2025-11-01";
    const CAL_END_DATE   = "2026-06-30";

    // Periodos escolares
    const VACATION_START_DATE = "2025-12-12";
    const VACATION_END_DATE   = "2026-01-04";
    const VACATION_SS_START   = "2026-03-29";
    const VACATION_SS_END     = "2026-04-05";

    const FORCED_REPROGRAM_CUTOFF = "2025-11-23";
    const SELECTION_DAY           = "2025-12-02";

    // Fantasmas
    const MAX_GHOSTS_PER_EXAM = 3;
    const MAX_ALPHA_MAIN = 0.5;
    const MAX_ALPHA_ALT  = 0.5;
    const MIN_ALPHA_CAP_WHEN_FEW = 0.2;

    // ======= RESTRICCIONES FOURNIER (visible y con aviso) =======
    const FOURNIER_RESTRICTIONS = {
        // Nov 2025
        "2025-11-24": { kind: "blocked" },

        // Dic 2025
        "2025-12-01": { kind: "blocked" },
        "2025-12-02": { kind: "blocked" },
        "2025-12-03": { kind: "blocked" },
        "2025-12-04": { kind: "blocked" },
        "2025-12-08": { kind: "blocked" },

        // Ene 2026
        "2026-01-06": { kind: "blocked" },
        "2026-01-07": { kind: "blocked" },
        "2026-01-13": { kind: "blocked" },
        "2026-01-14": { kind: "blocked" },
        "2026-01-15": { kind: "blocked" },
        "2026-01-19": { kind: "partial_after", freeFrom: "15:00" },
        "2026-01-21": { kind: "blocked" },
        "2026-01-22": { kind: "blocked" },
        "2026-01-23": { kind: "blocked" },
        "2026-01-26": { kind: "blocked" },
        "2026-01-27": { kind: "blocked" },
        "2026-01-28": { kind: "blocked" },
        "2026-01-30": { kind: "blocked" },

        // Feb 2026
        "2026-02-03": { kind: "blocked" },
        "2026-02-04": { kind: "blocked" },
        "2026-02-05": { kind: "blocked" },
        "2026-02-06": { kind: "blocked" },
        "2026-02-09": { kind: "blocked" },
        "2026-02-10": { kind: "blocked" },
        "2026-02-11": { kind: "blocked" },
        "2026-02-12": { kind: "blocked" },
        "2026-02-17": { kind: "blocked" },
        "2026-02-18": { kind: "blocked" },
        "2026-02-19": { kind: "blocked" },
        "2026-02-20": { kind: "blocked" },
        "2026-02-23": { kind: "blocked" },
        "2026-02-24": { kind: "blocked" },

        // Mar 2026
        "2026-03-02": { kind: "blocked" },
        "2026-03-04": { kind: "partial_until", freeUntil: "16:00" },
        "2026-03-05": { kind: "blocked" },
        "2026-03-06": { kind: "blocked" },
        "2026-03-10": { kind: "blocked" },
        "2026-03-11": { kind: "blocked" },
        "2026-03-12": { kind: "blocked" },
        "2026-03-13": { kind: "blocked" },
        "2026-03-17": { kind: "blocked" },
        "2026-03-18": { kind: "blocked" },
        "2026-03-19": { kind: "blocked" },
        "2026-03-20": { kind: "blocked" },
        "2026-03-23": { kind: "blocked" },
        "2026-03-24": { kind: "blocked" },
        "2026-03-25": { kind: "blocked" },
        "2026-03-26": { kind: "blocked" },
        "2026-03-27": { kind: "blocked" }
    };

    const FOURNIER_REASON_TEXT =
        "Estos son los motivos por los que el Fournier está ocupado:\n\n" +
        "-aplicación de exámenes de otros grados escolares incluyendo certificaciones o exámenes profesionales.";

    /* =================== Utilidades =================== */

    const parseDate = (s)=>{ const p=s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); };
    const formatDate = (y,m,d)=> y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    const formatHumanDate = (s)=>{ if(!s) return ""; const p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; };
    const formatHumanDateShort = (s)=>{ if(!s) return ""; const p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0].slice(2); };
    const diffDays = (aStr,bStr)=> Math.round(Math.abs(parseDate(bStr)-parseDate(aStr))/86400000);
    const hexToRgba = (hex, a)=>{ const h=hex.replace("#",""); const n=parseInt(h,16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255; return `rgba(${r},${g},${b},${a})`; };

    const isDateWithinCalendar = (s)=> s>=CAL_START_DATE && s<=CAL_END_DATE;
    const isDateInVacation = (s)=> (s>=VACATION_START_DATE && s<=VACATION_END_DATE) || (s>=VACATION_SS_START && s<=VACATION_SS_END);
    const isWeekend = (s)=> parseDate(s).getDay()===0; // domingo
    const isDateValidForExam = (s)=> isDateWithinCalendar(s) && !isWeekend(s) && !isDateInVacation(s) && s!==SELECTION_DAY;

    function getFournierRestriction(dateStr){ return FOURNIER_RESTRICTIONS[dateStr] || null; }
    function getExamTime(exam){
        return (exam && typeof exam.officialTime==="string" && exam.officialTime.length>=5)
            ? exam.officialTime.slice(0,5) : "08:00";
    }

    /* =================== Diccionarios UI =================== */

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
        ANA:"#A8003D", BQM:"#831438", HIS:"#e11d48", EMB:"#E48090", SPC:"#831438", ISM:"#641C74",
        IBC1:"#22d3ee", IBC2:"#06b6d4", IB1:"#00b4d8", IB2:"#00a896",
        FIS:"#60a5fa", FAR:"#f59e0b", INM:"#22c55e", MyP:"#fb7185", ICR:"#38bdf8", PCV:"#14b8a6"
    };

    /* =================== Índices y estado =================== */

    const examIndex = {};
    const subjectChainsByYear = { 1:{}, 2:{} };
    const examNameIndex = {1:{}, 2:{}};

    let currentGroupId = null;
    let currentYear = 1;

    // caches de modas
    let lastModeByExamAll = {};
    let lastModeListByExamAll = {};
    let lastTotalsByExamAll = {};
    let lastModeByExamOthers = {};
    let lastModeListByExamOthers = {};
    let lastTotalsByExamOthers = {};
    let lastGroupsByExamDateOthers = {};
    let showSubjectWeeks = false;

    function buildExamIndices(){
        [1,2].forEach(year=>{
            const exams=EXAMS_BY_YEAR[year];
            const bySubject={};
            exams.forEach(exam=>{
                examIndex[exam.id]=exam;
                (bySubject[exam.subject] ||= []).push(exam);
                const key = `${exam.subject} — ${exam.type}`.trim();
                examNameIndex[year][key] = exam.id;
            });
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

    /* =================== Storage =================== */

    function loadState(){
        try{
            const raw=localStorage.getItem(STORAGE_KEY);
            if(!raw) return {groups:{}, showSubjectWeeks:false, hideMobileBanner:false};
            const s=JSON.parse(raw);
            if(!s.groups) s.groups={};
            if(typeof s.showSubjectWeeks!=="boolean") s.showSubjectWeeks=false;
            if(typeof s.hideMobileBanner!=="boolean") s.hideMobileBanner=false;
            return s;
        }catch(e){
            return {groups:{}, showSubjectWeeks:false, hideMobileBanner:false};
        }
    }
    function saveState(s){
        try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){}
    }

    /* ====== CSV/OPFS: “base de datos” ====== */

    const hasOPFS = () => !!(navigator && navigator.storage && navigator.storage.getDirectory);

    async function opfsDirGrupos(createIfMissing){
        const root = await navigator.storage.getDirectory();
        try{
            return await root.getDirectoryHandle("grupos", { create: !!createIfMissing });
        }catch(e){
            if(createIfMissing) throw e;
            return null;
        }
    }

    function ddmmyyyyToIso(s){
        const [d,m,y]=s.trim().split("/");
        if(!d||!m||!y) return null;
        return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
    }

    function parseCsvSimple(csvText){
        const lines = csvText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
        if(!lines.length) return [];
        const rows=[];
        for(let i=1;i<lines.length;i++){
            const line = lines[i];
            let name="", datePart="";
            if(line.startsWith('"')){
                const end = line.indexOf('",');
                if(end>=0){ name = line.slice(1,end).replace(/""/g,'"'); datePart = line.slice(end+2).trim(); }
                else { continue; }
            }else{
                const idx = line.indexOf(",");
                if(idx>=0){ name=line.slice(0,idx).trim(); datePart=line.slice(idx+1).trim(); }
                else { continue; }
            }
            rows.push({ name, date: ddmmyyyyToIso(datePart) });
        }
        return rows;
    }

    async function opfsWriteCsv(groupId, csvText){
        const dir = await opfsDirGrupos(true);
        const fileHandle = await dir.getFileHandle(`${groupId}.csv`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(csvText);
        await writable.close();
        // Nota: se guarda silenciosamente en OPFS en /grupos/ sin notificación
    }

    async function opfsReadAllGroups(){
        const result = {};
        const dir = await opfsDirGrupos(false);
        if(!dir) return result;
        for await (const [name, handle] of dir.entries()){
            if(handle.kind !== "file") continue;
            if(!/\.csv$/i.test(name)) continue;
            const groupId = name.replace(/\.csv$/i,"");
            try{
                const file = await handle.getFile();
                const text = await file.text();
                const rows = parseCsvSimple(text);
                if(!rows.length) continue;

                // Deducir año por rango de grupo
                let year = null;
                const gnum = parseInt(groupId,10);
                if(!isNaN(gnum)){
                    if(gnum>=YEAR1_RANGE.min && gnum<=YEAR1_RANGE.max) year=1;
                    else if(gnum>=YEAR2_RANGE.min && gnum<=YEAR2_RANGE.max) year=2;
                }
                // Construir propuestas
                const proposals = {};
                rows.forEach(r=>{
                    const id = (year && examNameIndex[year][r.name]) || examNameIndex[1][r.name] || examNameIndex[2][r.name];
                    if(id && r.date) proposals[id]=r.date;
                });
                if(Object.keys(proposals).length){
                    result[groupId] = { year: year || 1, proposals };
                }
            }catch(e){ /* ignora archivos corruptos */ }
        }
        return result;
    }

    // Respaldo localStorage cuando no hay OPFS
    function loadCsvDB(){ try{ return JSON.parse(localStorage.getItem(CSV_DB_KEY)||"{}"); }catch(e){return {};} }
    function saveCsvDB(db){ try{ localStorage.setItem(CSV_DB_KEY, JSON.stringify(db)); }catch(e){} }

    async function persistCsvDatabaseEntry(groupId, csvText, map){
        if(hasOPFS()){
            try{
                await opfsWriteCsv(groupId, csvText);
            }catch(e){
                const db=loadCsvDB(); db[groupId]={proposals:map,csv:csvText,updatedAt:new Date().toISOString()}; saveCsvDB(db);
            }
        }else{
            const db=loadCsvDB(); db[groupId]={proposals:map,csv:csvText,updatedAt:new Date().toISOString()}; saveCsvDB(db);
        }
    }

    // IMPORTANTE: ahora NO sobreescribe el grupo activo, así puedes mover libremente;
    // sí actualiza a los demás grupos para fantasmas/estadísticas.
    async function importCsvDBToState(options){
        const { excludeGroupId=null } = options || {};
        const state=loadState();
        let source = {};

        if(hasOPFS()){
            try{ source = await opfsReadAllGroups(); }catch(e){ source = {}; }
        }
        const db = loadCsvDB();
        Object.keys(db).forEach(gid=>{
            if(source[gid]) return;
            if(db[gid] && db[gid].proposals){ source[gid] = { year: state.groups[gid]?.year || 1, proposals: db[gid].proposals }; }
        });

        Object.keys(source).forEach(gid=>{
            const entry = source[gid];
            if(!state.groups[gid]){
                state.groups[gid] = { year: entry.year || 1, approved:{}, proposals:{} };
            }
            state.groups[gid].year = entry.year || state.groups[gid].year || 1;

            if(String(gid) === String(excludeGroupId)){
                // no tocamos sus propuestas locales
            }else{
                // reflejamos CSV como verdad para fantasmas/estadísticas de otros grupos
                state.groups[gid].proposals = Object.assign({}, entry.proposals);
            }
        });
        saveState(state);
    }

    function createInitialGroupEntry(groupId, year){
        const approved = {};
        const proposals = {};
        const exams=EXAMS_BY_YEAR[year]||[];
        exams.forEach(ex=>{
            approved[ex.id]=ex.officialDate;
            proposals[ex.id]=ex.officialDate;
        });
        return { year, approved, proposals };
    }
    function ensureGroupInitialized(groupId, year){
        const state=loadState();
        if(!state.groups[groupId]){ state.groups[groupId]=createInitialGroupEntry(groupId, year); saveState(state); }
        else if(!state.groups[groupId].year){ state.groups[groupId].year=year; saveState(state); }
        else if(!state.groups[groupId].approved || !state.groups[groupId].proposals){
            const exams=EXAMS_BY_YEAR[year]||[];
            const approved = state.groups[groupId].approved || {};
            const proposals = state.groups[groupId].proposals || {};
            exams.forEach(ex=>{
                if(!approved[ex.id]) approved[ex.id]=ex.officialDate;
                if(!proposals[ex.id]) proposals[ex.id]=ex.officialDate;
            });
            state.groups[groupId].approved = approved;
            state.groups[groupId].proposals = proposals;
            delete state.groups[groupId].exams;
            saveState(state);
        }
    }

    /* =================== Calendario =================== */

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

                // Restricciones Fournier: mismo color que vacaciones y leyenda visible
                const fr = getFournierRestriction(dateStr);
                if(fr && fr.kind === "blocked"){ cell.classList.add("vacation"); }

                const headerRow=document.createElement("div"); headerRow.className="day-header";
                const numSpan=document.createElement("span"); numSpan.className="day-number"; numSpan.textContent=String(day);
                const metaSpan=document.createElement("span"); metaSpan.className="day-meta";

                if(dateStr===CAL_START_DATE) metaSpan.textContent="Inicio";
                else if(dateStr===CAL_END_DATE) metaSpan.textContent="Fin";
                else if(fr && fr.kind === "blocked") metaSpan.textContent="Fournier ocupado";
                else if(fr && fr.kind === "partial_after") metaSpan.textContent=("Fournier desde " + (fr.freeFrom || "15:00"));
                else if(fr && fr.kind === "partial_until") metaSpan.textContent=("Fournier hasta " + (fr.freeUntil || "16:00"));
                else if(isDateInVacation(dateStr)) metaSpan.textContent="Vacaciones";
                else if(dow===0) metaSpan.textContent="Fin de semana";

                headerRow.appendChild(numSpan); headerRow.appendChild(metaSpan);
                cell.appendChild(headerRow);

                const ghostLayer=document.createElement("div"); ghostLayer.className="ghost-date"; cell.appendChild(ghostLayer);
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

    /* =================== UI helpers =================== */

    const sampledColorCache = new Map();
    function sampleIconColorAt(imgEl, x, y, alpha, fallbackHex, apply){
        const key = imgEl.getAttribute("src") + `@${x},${y},a${alpha}`;
        if(sampledColorCache.has(key)){ apply(sampledColorCache.get(key)); return; }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgEl.src;
        if (img.complete) { compute(); } else { img.addEventListener("load", compute); }
        function compute(){
            try{
                const c = document.createElement("canvas");
                c.width = img.naturalWidth || 42; c.height = img.naturalHeight || 42;
                const ctx = c.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const sx = Math.min(Math.max(0, x), c.width - 1);
                const sy = Math.min(Math.max(0, y), c.height - 1);
                const d = ctx.getImageData(sx, sy, 1, 1).data;
                const rgba = `rgba(${d[0]},${d[1]},${d[2]},${alpha})`;
                sampledColorCache.set(key, rgba);
                apply(rgba);
            }catch(e){
                apply(hexToRgba(fallbackHex, alpha));
            }
        }
    }
    function sampleIconColor(imgEl, alpha, fallbackHex, apply){
        const key = imgEl.getAttribute("src") + `@avg,a${alpha}`;
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
                ctx.drawImage(img, 0, 0, 10, 10);
                const d = ctx.getImageData(0, 0, 10, 10).data;
                const rgba = `rgba(${d[0]},${d[1]},${d[2]},${alpha})`;
                sampledColorCache.set(key, rgba);
                apply(rgba);
            }catch(e){
                apply(hexToRgba(fallbackHex, alpha));
            }
        }
    }

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

    /* =================== Cálculos =================== */

    function computePrevNextGlobalDistances(baseDate, modeByExam, thisExamId){
        let prevDist=null, nextDist=null;
        Object.keys(modeByExam).forEach(id=>{
            if(id===thisExamId) return;
            const d=modeByExam[id].date;
            if(d<baseDate){
                const dd=diffDays(d, baseDate);
                if(prevDist===null || dd<prevDist) prevDist=dd;
            }else if(d>baseDate){
                const dd=diffDays(baseDate, d);
                if(nextDist===null || dd<nextDist) nextDist=dd;
            }
        });
        return { prevDistance: prevDist, nextDistance: nextDist };
    }

    function weeksToNextSameSubject(year, examId, proposalsMap){
        const exam=examIndex[examId]; if(!exam) return null;
        const chain=(subjectChainsByYear[year]||{})[exam.subject] || [];
        const idx=chain.indexOf(examId); if(idx===-1 || idx===chain.length-1) return null;
        const nextId=chain[idx+1];
        const nextExam=examIndex[nextId]; if(!nextExam) return null;
        const from = (proposalsMap[examId]) || exam.officialDate;
        const to   = (proposalsMap[nextId]) || nextExam.officialDate;
        if(!from || !to) return null;
        const days = diffDays(from, to);
        return Math.round((days/7)*10)/10;
    }

    /* =================== Componentes UI =================== */

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
    function lineUpperGroups(groups){
        const text = (groups && groups.length)
            ? groups.slice(0,5).sort((a,b)=>a-b).join(", ") + (groups.length>5 ? "  +" + (groups.length-5) : "")
            : "—";
        const row=line("ESTA ES UNA FECHA VOTADA POR:", text);
        row.classList.add("upper");
        return row;
    }

    function createExamCard(exam, viewDate, statusClass, highlightForced, options={}){
        const { approvedDate, suggestionDate, isOwn } = options;
        const sigla=getSigla(exam.subject);
        const badge=shortType(exam.type);

        const baseDate = suggestionDate || viewDate;
        const global = computePrevNextGlobalDistances(baseDate, lastModeByExamAll, exam.id);

        const card=document.createElement("div");
        card.className="exam-card "+statusClass;
        if(highlightForced) card.classList.add("forced");
        if(isOwn) card.classList.add("own-proposal-solid");
        card.draggable=true;
        card.dataset.examId=exam.id;

        const strip=document.createElement("div");
        strip.className="exam-status-strip";
        card.appendChild(strip);

        const key = sigla.display.replace(/\s+/g,"");
        const fallbackHex = SUBJECT_COLORS[key] || "#4ecaff";

        const head=document.createElement("div"); head.className="exam-head2";
        const icon=document.createElement("div"); icon.className="exam-icon-vert";
        const img=document.createElement("img"); img.alt=sigla.display; img.src="img/"+(sigla.file)+".png";
        icon.appendChild(img);
        card.appendChild(head);
        head.appendChild(icon);

        const titleBox=document.createElement("div"); titleBox.className="exam-title";
        const sigSpan=document.createElement("div"); sigSpan.className="exam-sigla"; sigSpan.textContent=sigla.display; sigSpan.title = exam.subject;
        const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title = badge.meaning;
        titleBox.appendChild(sigSpan); titleBox.appendChild(badgeEl);
        head.appendChild(titleBox);

        if(!isOwn){
            sampleIconColor(img, .5, fallbackHex, (rgba)=> card.style.setProperty("--subj-tint", rgba));
        }else{
            sampleIconColorAt(img, 20, 20, 1, fallbackHex, (rgba)=>{ card.style.setProperty("--own-solid", rgba); });
        }

        const appText = approvedDate  ? formatHumanDateShort(approvedDate)   : formatHumanDateShort(exam.officialDate);
        const sugText = suggestionDate ? formatHumanDateShort(suggestionDate) : formatHumanDateShort(viewDate);
        card.appendChild(lineStacked("última fecha aprobada:", appText));
        card.appendChild(lineStacked("sugerencia de reprogramación:", sugText));

        const prevTxt = (global.prevDistance!=null) ? `${global.prevDistance} días atrás` : "—";
        const nextTxt = (global.nextDistance!=null) ? `${global.nextDistance} días` : "—";
        card.appendChild(line("Último departamental según votos:", prevTxt));
        card.appendChild(line("Próximo departamental según votos:", nextTxt));

        if(showSubjectWeeks && currentGroupId){
            const s = loadState();
            const proposalsMap = (s.groups[currentGroupId] && s.groups[currentGroupId].proposals) || {};
            const w = weeksToNextSameSubject(currentYear, exam.id, proposalsMap);
            card.appendChild(line("Semanas para cubrir la siguiente unidad:", (w!=null? `${w} semanas` : "—")));
        }

        card.addEventListener("dragstart", e=>{ e.dataTransfer.setData("text/plain", exam.id); e.dataTransfer.effectAllowed="move"; card.classList.add("dragging"); });
        card.addEventListener("dragend", ()=> card.classList.remove("dragging"));

        return card;
    }

    function createGhostCardFull(exam, dateStr, groups, alpha){
        const sigla=getSigla(exam.subject);
        const badge=shortType(exam.type);

        const card=document.createElement("div");
        card.className="exam-card is-ghost ghost-min";
        card.draggable=false;
        card.style.setProperty("--ghost-alpha", alpha.toFixed(3));

        const head=document.createElement("div"); head.className="exam-head2";
        const icon=document.createElement("div"); icon.className="exam-icon-vert";
        const img=document.createElement("img"); img.alt=sigla.display; img.src="img/"+(sigla.file)+".png";
        icon.appendChild(img);
        head.appendChild(icon);

        const titleBox=document.createElement("div"); titleBox.className="exam-title";
        const sigSpan=document.createElement("div"); sigSpan.className="exam-sigla"; sigSpan.textContent=sigla.display; sigSpan.title = exam.subject;
        const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title = badge.meaning;
        titleBox.appendChild(sigSpan); titleBox.appendChild(badgeEl);
        head.appendChild(titleBox);
        card.appendChild(head);

        const key = sigla.display.replace(/\s+/g,"");
        const fallbackHex = SUBJECT_COLORS[key] || "#4ecaff";
        sampleIconColor(img, 0.5, fallbackHex, (rgba)=> card.style.setProperty("--subj-tint", rgba));

        card.appendChild(lineStacked("PROPUESTA:", formatHumanDate(dateStr)));
        card.appendChild(lineUpperGroups(groups));

        const strip=document.createElement("div"); strip.className="exam-status-strip"; strip.style.display="none";
        card.appendChild(strip);

        return card;
    }

    /* =================== Render por grupo =================== */

    function renderCurrentGroup(){
        if(!currentGroupId || !currentYear) return;
        const state=loadState();
        const group=state.groups[currentGroupId];
        if(!group) return;

        const approved = group.approved || {};
        const proposals = group.proposals || {};

        document.querySelectorAll(".exam-list").forEach(list=> list.innerHTML="");
        const pendingList=document.getElementById("pending-exams-list"); if(pendingList) pendingList.innerHTML="";

        const exams=EXAMS_BY_YEAR[currentYear] || [];
        exams.forEach(exam=>{
            const approvedDate = approved[exam.id] || exam.officialDate;
            const suggestionDate = proposals[exam.id] || exam.officialDate;

            const valid = isDateValidForExam(suggestionDate);
            const isOriginal = suggestionDate===approvedDate;
            let statusClass=""; if(!valid) statusClass="status-invalid"; else if(isOriginal) statusClass="status-original"; else statusClass="status-valid";
            const highlightForced=(exam.officialDate < FORCED_REPROGRAM_CUTOFF) && !valid;

            const card=createExamCard(exam, suggestionDate, statusClass, highlightForced, { approvedDate, suggestionDate, isOwn:true });

            const dayCell=document.querySelector('.day-cell[data-date="'+suggestionDate+'"]');
            const isOriginalBeforeParo = exam.officialDate < FORCED_REPROGRAM_CUTOFF;
            const placeInPending = isOriginalBeforeParo && (suggestionDate === exam.officialDate);

            if(!placeInPending && dayCell && isDateWithinCalendar(suggestionDate)){
                const list=dayCell.querySelector(".exam-list"); if(list) list.appendChild(card);
            }else if(pendingList){ pendingList.appendChild(card); }
        });
    }

    function moveExamToDate(examId, dateStr){
        if(!currentGroupId || !currentYear) return;

        if(!isDateWithinCalendar(dateStr)){
            alert("La fecha está fuera del rango noviembre 2025–junio 2026.");
            return;
        }

        const exam = examIndex[examId];
        const restriction = getFournierRestriction(dateStr);

        if(restriction && exam){
            const hora = getExamTime(exam);
            if(restriction.kind === "blocked"){
                alert("El Auditorio Fournier estará ocupado ese día.\n\n" + FOURNIER_REASON_TEXT);
                return; // bloqueado
            }
            if(restriction.kind === "partial_after"){
                const libreDesde = restriction.freeFrom || "15:00";
                alert("Ese día solo se puede después de las " + libreDesde + " horas. El examen está programado a las " + hora + ".");
                // permite continuar
            }
            if(restriction.kind === "partial_until"){
                const hasta = restriction.freeUntil || "16:00";
                alert("Ese día solo se puede hasta las " + hasta + " horas. El examen está programado a las " + hora + ".");
                // permite continuar
            }
        }

        if(!isDateValidForExam(dateStr)){
            alert("Esa fecha es inválida (fin de semana o periodo vacacional).");
            return;
        }

        const state=loadState();
        ensureGroupInitialized(currentGroupId, currentYear);
        const group = state.groups[currentGroupId];

        group.proposals = group.proposals || {};
        group.proposals[examId]=dateStr;

        saveState(state);
        renderCurrentGroup();

        // Recalcula modas/fantasmas sin pisar lo local del grupo actual
        recomputeStatsAndGhosts();
    }

    /* =================== Fantasmas, estadísticas y modas =================== */

    function renderGhosts(modeByExamOthers, totalsByExamOthers, groupsByExamDateOthers){
        document.querySelectorAll(".ghost-date").forEach(layer=> layer.innerHTML="");

        Object.keys(modeByExamOthers).forEach(examId=>{
            const exam = examIndex[examId];
            if(!exam) return;

            const list = (lastModeListByExamOthers[examId] || []).slice(0, MAX_GHOSTS_PER_EXAM);

            list.forEach((opt, idx)=>{
                const dateStr=opt.date;
                const cell=document.querySelector('.day-cell[data-date="'+dateStr+'"]');
                if(!cell) return;
                const layer = cell.querySelector(".ghost-date");
                if(!layer) return;

                const total = totalsByExamOthers[examId] || 0;
                const share = total>0 ? (opt.count/total) : 0;
                const cap = (idx===0 ? MAX_ALPHA_MAIN : MAX_ALPHA_ALT);
                let alpha = Math.min(cap, Math.max(0, cap * share));

                if(opt.count <= 3){ alpha = Math.min(alpha, MIN_ALPHA_CAP_WHEN_FEW); }

                const groups=(groupsByExamDateOthers[examId] && groupsByExamDateOthers[examId][dateStr])
                    ? groupsByExamDateOthers[examId][dateStr] : [];

                const ghostCard = createGhostCardFull(exam, dateStr, groups, alpha);
                layer.appendChild(ghostCard);
            });
        });
    }

    function renderStatsRibbon(modeByExam, modeListByExam, groupsByExamDate){
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
            card.style.setProperty("--subj-tint", hexToRgba(fallbackHex, .5));
            const icon=document.createElement("div"); icon.className="stat-icon-top";
            const img=document.createElement("img"); img.alt=sigla.display; img.src="img/"+sigla.file+".png";
            icon.appendChild(img);
            sampleIconColor(img, .5, fallbackHex, (rgba)=> card.style.setProperty("--subj-tint", rgba));
            card.appendChild(icon);

            const top=document.createElement("div"); top.className="stat-top";
            const code=document.createElement("div"); code.className="stat-code"; code.textContent=sigla.display; code.title=exam.subject;
            const badgeEl=document.createElement("div"); badgeEl.className="stat-badge"; badgeEl.textContent=badge.badge; badgeEl.title = badge.meaning;
            top.appendChild(code); top.appendChild(badgeEl); card.appendChild(top);

            const date=document.createElement("div"); date.className="stat-date"; date.textContent="moda: "+formatHumanDate(mode.date);
            const sub=document.createElement("div"); sub.className="stat-sub";
            sub.textContent="votado por "+mode.count+" grupos";
            const voters=(groupsByExamDate[exam.id] && groupsByExamDate[exam.id][mode.date]) ? groupsByExamDate[exam.id][mode.date] : [];
            if(voters.length){ sub.title="Grupos: "+voters.sort((a,b)=>a-b).join(", "); }
            card.appendChild(date); card.appendChild(sub);

            if(list.length>1){
                const alt=document.createElement("div"); alt.className="stat-alt";
                const det=document.createElement("details");
                const sum=document.createElement("summary"); sum.textContent="ver 2a y 3a moda";
                det.appendChild(sum);
                const ul=document.createElement("ul");
                list.slice(1,3).forEach((opt,idx)=>{
                    const g=(groupsByExamDate[exam.id] && groupsByExamDate[exam.id][opt.date]) ? groupsByExamDate[exam.id][opt.date] : [];
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

    async function recomputeStatsAndGhosts(){
        // Importa desde OPFS/LocalStorage pero SIN pisar al grupo actual
        await importCsvDBToState({ excludeGroupId: currentGroupId || null });

        const statsYearSelect=document.getElementById("stats-year");
        const yearValue=statsYearSelect? Number(statsYearSelect.value) : currentYear || 1;
        const year=yearValue || 1;

        const state=loadState();
        const allEntries = Object.entries(state.groups || {}).filter(([_,g])=> g && g.year===year);

        const otherEntries = currentGroupId
            ? allEntries.filter(([gid,_])=> String(gid) !== String(currentGroupId))
            : allEntries.slice();

        function aggregateFrom(entries){
            const exams=EXAMS_BY_YEAR[year] || [];
            const examIds=exams.map(e=>e.id);
            const countsByExamAndDate={}; examIds.forEach(id=> countsByExamAndDate[id]={});
            const groupsByExamAndDate={}; examIds.forEach(id=> groupsByExamAndDate[id]={});
            const totalsByExam={}; examIds.forEach(id=> totalsByExam[id]=0);

            entries.forEach(([gid,g])=>{
                const map=g.proposals || {};
                examIds.forEach(examId=>{
                    const dateStr=map[examId];
                    if(!dateStr) return;
                    if(!isDateWithinCalendar(dateStr)) return;
                    (countsByExamAndDate[examId][dateStr] ||= 0);
                    countsByExamAndDate[examId][dateStr] += 1;
                    totalsByExam[examId] += 1;
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

            return {modeByExam, modeListByExam, totalsByExam, groupsByExamAndDate};
        }

        const allAgg = aggregateFrom(allEntries);
        lastModeByExamAll        = allAgg.modeByExam;
        lastModeListByExamAll    = allAgg.modeListByExam;
        lastTotalsByExamAll      = allAgg.totalsByExam;

        const otherAgg = aggregateFrom(otherEntries);
        lastModeByExamOthers     = otherAgg.modeByExam;
        lastModeListByExamOthers = otherAgg.modeListByExam;
        lastTotalsByExamOthers   = otherAgg.totalsByExam;
        lastGroupsByExamDateOthers = otherAgg.groupsByExamAndDate;

        renderGhosts(lastModeByExamOthers, lastTotalsByExamOthers, lastGroupsByExamDateOthers);
        renderStatsRibbon(lastModeByExamAll, lastModeListByExamAll, allAgg.groupsByExamAndDate);
        renderCurrentGroup();
    }

    /* =================== CSV: generar =================== */

    function buildCsvForGroup(groupId){
        const state=loadState();
        const group=state.groups[groupId];
        if(!group) return { csv:"", map:{} };

        const exams=EXAMS_BY_YEAR[group.year] || [];
        const proposals = group.proposals || {};
        const rows=[];
        const map={};

        exams.forEach(ex=>{
            const date = proposals[ex.id] || ex.officialDate;
            const examName = `${ex.subject} — ${ex.type}`;
            rows.push({ name: examName, date });
            map[ex.id] = date;
        });

        const header = "examen,fecha";
        const body = rows.map(r=>{
            const p=r.date.split("-");
            const pretty = `${p[2]}/${p[1]}/${p[0]}`;
            return `"${r.name.replace(/"/g,'""')}",${pretty}`;
        }).join("\n");
        const csv = header + "\n" + body;
        return { csv, map };
    }

    /* =================== Controles =================== */

    function wireGroupSelector(){
        const input=document.getElementById("group-input"); if(!input) return;
        input.addEventListener("change", ()=> setCurrentGroup(parseInt(input.value,10)));
        input.addEventListener("blur",   ()=> setCurrentGroup(parseInt(input.value,10)));
        input.addEventListener("keydown", e=>{ if(e.key==="Enter") setCurrentGroup(parseInt(input.value,10)); });
    }
    function wireStatsControls(){
        const select=document.getElementById("stats-year"); if(!select) return;
        select.addEventListener("change", ()=> recomputeStatsAndGhosts());
    }
    function wireWeeksToggle(){
        const cb=document.getElementById("toggle-subject-weeks");
        if(!cb) return;
        const s=loadState(); showSubjectWeeks = !!(s.showSubjectWeeks);
        cb.checked = showSubjectWeeks;
        cb.addEventListener("change", ()=>{
            showSubjectWeeks = cb.checked;
            const st=loadState(); st.showSubjectWeeks = showSubjectWeeks; saveState(st);
            renderCurrentGroup();
        });
    }

    function wireCaptureButton(){
        const btn=document.getElementById("capture-btn"); if(!btn) return;
        btn.addEventListener("click", async ()=>{
            if(!currentGroupId){
                alert("Primero ingresa tu grupo para generar la captura.\n\nLa importancia de poner el grupo es porque este será registrado en la captura en PDF.");
                const input=document.getElementById("group-input");
                if(input) input.focus();
                return;
            }

            // Genera y persiste CSV “interno” en /grupos/ (OPFS) sin avisos al usuario
            const { csv, map } = buildCsvForGroup(currentGroupId);
            await persistCsvDatabaseEntry(currentGroupId, csv, map);

            // Encabezado de impresión
            const groupSpan=document.getElementById("print-group");
            if(groupSpan){
                const yearLabel=currentYear===1?"Primer año":"Segundo año";
                groupSpan.textContent="Grupo: "+currentGroupId+" · "+yearLabel;
            }
            const capturedSpan=document.getElementById("print-captured-at");
            if(capturedSpan){
                const now=new Date();
                const f=now.toLocaleString("es-MX",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
                capturedSpan.textContent="Capturado el "+f;
            }

            // Reimporta para que la “BD” refleje lo capturado
            await importCsvDBToState({ excludeGroupId: null });
            renderCurrentGroup();
            recomputeStatsAndGhosts();

            // Lanzar impresión (PDF)
            window.print();
        });
    }

    function onResize(){
        let t=null;
        window.addEventListener("resize", ()=>{ if(t) clearTimeout(t); t=setTimeout(syncExternalCardWidth, 120); });
    }

    async function setCurrentGroup(groupNumber){
        const status=document.getElementById("group-status");
        const statsYearSelect=document.getElementById("stats-year");
        if(!groupNumber || isNaN(groupNumber)){
            currentGroupId=null; status.textContent="Escribe un grupo entre 1101–1170 o 2201–2270"; return;
        }
        let year=null;
        if(groupNumber>=YEAR1_RANGE.min && groupNumber<=YEAR1_RANGE.max) year=1;
        else if(groupNumber>=YEAR2_RANGE.min && groupNumber<=YEAR2_RANGE.max) year=2;
        else { currentGroupId=null; status.textContent="Grupo fuera de rango (solo 1101–1170 y 2201–2270)"; return; }

        currentGroupId=String(groupNumber);
        currentYear=year;
        status.textContent=year===1?"Primer año":"Segundo año";
        if(statsYearSelect) statsYearSelect.value=String(year);

        ensureGroupInitialized(currentGroupId, currentYear);

        // Importa “BD” sin pisar al grupo activo
        await importCsvDBToState({ excludeGroupId: currentGroupId });

        renderCurrentGroup();
        recomputeStatsAndGhosts();
    }

    function wireMobileBanner(){
        const banner = document.getElementById("mobile-warning");
        const closeBtn = document.getElementById("mobile-warning-close");
        const state = loadState();
        if(state.hideMobileBanner && banner){ banner.style.display="none"; }
        if(closeBtn){
            closeBtn.addEventListener("click", ()=>{
                if(banner) banner.style.display="none";
                const s=loadState(); s.hideMobileBanner = true; saveState(s);
            });
        }
    }

    /* =================== Datos (mock) =================== */

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
            { id: "2-MICRO-EX", subject: "Microbiología y Parasitología", type: "Extraordinario", officialDate: "2026-05-30", officialTime: "08:00" }
        ]
    };

    /* =================== Init =================== */

    document.addEventListener("DOMContentLoaded", async function () {
        buildExamIndices();
        buildCalendars();
        wireGroupSelector();
        wireStatsControls();
        wireWeeksToggle();
        wireCaptureButton();
        wireMobileBanner();
        onResize();

        const input=document.getElementById("group-input");
        if (input) { input.value = String(YEAR1_RANGE.min); await setCurrentGroup(YEAR1_RANGE.min); }
        else { await recomputeStatsAndGhosts(); }
    });
})();
