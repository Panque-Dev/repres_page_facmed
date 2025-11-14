(function(){
    "use strict";

    /* ================= CONFIG ================= */
    const YEAR1_RANGE = { min: 1101, max: 1182 };   // PRIMERO (actualizado)
    const YEAR2_RANGE = { min: 2201, max: 2265 };   // SEGUNDO (actualizado)

    const CAL_START_DATE = "2025-11-01";
    const CAL_END_DATE   = "2026-06-30";

    const VACATION_START_DATE = "2025-12-12";
    const VACATION_END_DATE   = "2026-01-04";
    const VACATION_SS_START   = "2026-03-29";
    const VACATION_SS_END     = "2026-04-05";

    const FORCED_REPROGRAM_CUTOFF = "2025-11-23";
    const SELECTION_DAY           = "2025-12-02";

    // versión de estado
    const STORAGE_KEY   = "deptScheduler.state.v6_remote";
    const SNAPSHOT_KEY  = (year)=>`deptScheduler.snapshot.year${year}`;

    // Fantasmas (más translúcidos)
    const MAX_GHOSTS_PER_EXAM      = 3;
    const MAX_ALPHA_MAIN           = 0.38; // antes 0.5
    const MAX_ALPHA_ALT            = 0.26; // antes 0.5
    const MIN_ALPHA_CAP_WHEN_FEW   = 0.18; // antes 0.2

    /* ======= Restricciones Fournier (visibles en calendario) ======= */
    const FOURNIER_RESTRICTIONS = {
        "2025-11-24": { kind: "blocked" },

        "2025-12-01": { kind: "blocked" },
        "2025-12-02": { kind: "blocked" },
        "2025-12-03": { kind: "blocked" },
        "2025-12-04": { kind: "blocked" },
        "2025-12-08": { kind: "blocked" },

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
        "2026-02-25": { kind: "free" },
        "2026-02-26": { kind: "free" },
        "2026-02-27": { kind: "free" },
        "2026-02-28": { kind: "free" },

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
        "2026-03-27": { kind: "blocked" },
        "2026-03-30": { kind: "vac" },
        "2026-03-31": { kind: "vac" }
    };

    const FOURNIER_REASON_TEXT =
        "Estos son los motivos por los que el Fournier está ocupado:\n\n" +
        "-aplicación de exámenes de otros grados escolares incluyendo certificaciones o exámenes profesionales.";

    /* =============== Estado global UI =============== */
    let currentGroupId = null;     // string con el grupo en modo edición
    let currentYear    = 1;        // 1 o 2
    let showSubjectWeeks = false;
    let resultsMode = false;       // true cuando grupo === "0000" o "RESULTADOS"

    // agregados para distancias y fantasmas
    let lastModeByExamAll = {};
    let lastModeListByExamAll = {};
    let lastTotalsByExamAll = {};
    let lastModeListByExamOthers = {};
    let lastTotalsByExamOthers = {};
    let lastGroupsByExamDateOthers = {};

    /* =============== Utilidades =============== */
    const $id = (s)=> document.getElementById(s);
    const safeToggle = (el, show)=>{ if(!el) return; el.classList[show? "remove":"add"]("hide"); };

    const parseDate   = (s)=>{ const p=s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); };
    const formatDate  = (y,m,d)=> y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    const formatHuman = (s)=>{ const p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; };
    const formatShort = (s)=>{ const p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0].slice(2); };
    const diffDays    = (a,b)=> Math.round(Math.abs(parseDate(b)-parseDate(a))/86400000);
    const hexToRgba   = (hex, a)=>{ const h=hex.replace("#",""); const n=parseInt(h,16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255; return `rgba(${r},${g},${b},${a})`; };

    const isWithin = (s)=> s>=CAL_START_DATE && s<=CAL_END_DATE;
    const isVacation = (s)=> (s>=VACATION_START_DATE && s<=VACATION_END_DATE) || (s>=VACATION_SS_START && s<=VACATION_SS_END) || (FOURNIER_RESTRICTIONS[s] && FOURNIER_RESTRICTIONS[s].kind==="vac");
    const isSunday = (s)=> parseDate(s).getDay()===0;
    const isValidDate = (s)=> isWithin(s) && !isSunday(s) && !isVacation(s) && s!==SELECTION_DAY;
    const getRestriction = (d)=> FOURNIER_RESTRICTIONS[d] || null;

    const debounce=(fn,ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

    // ===== Orden "más próximo → más lejano" (futuro primero; luego pasado por cercanía) =====
    function startOfToday(){
        const now=new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    function proximityKey(dateStr){
        const d=parseDate(dateStr), t0=startOfToday();
        const delta=d - t0;                    // ms desde hoy
        const bucket = delta >= 0 ? 0 : 1;     // 0 = futuro, 1 = pasado
        const dist   = Math.abs(delta);        // magnitud de cercanía
        return { bucket, dist, tie: dateStr };
    }
    function compareByProximity(aDate, bDate){
        const a=proximityKey(aDate), b=proximityKey(bDate);
        if(a.bucket!==b.bucket) return a.bucket - b.bucket;   // futuro antes que pasado
        if(a.dist!==b.dist)     return a.dist - b.dist;       // más cercano primero
        return a.tie.localeCompare(b.tie);                    // desempate estable
    }

    /* =============== Catálogos =============== */
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

    const examIdToObj = {};
    const subjectChains = {1:{},2:{}};
    const examLabelIndex = {1:{},2:{}};

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

            { id: "2-INF2-P2", subject: "Informática Biomédica II", type: "Segundo parcial", officialDate: "2025-11-26", officialTime: "15:00" },
            { id: "2-INF2-O1", subject: "Informática Biomédica II", type: "Primer ordinario", officialDate: "2025-12-02", officialTime: "08:00" },
            { id: "2-INF2-O2", subject: "Informática Biomédica II", type: "Segundo ordinario", officialDate: "2025-12-08", officialTime: "13:00" },
            { id: "2-INF2-EX", subject: "Informática Biomédica II", type: "Extraordinario", officialDate: "2026-06-02", officialTime: "08:00" },

            { id: "2-IBC2-P1", subject: "Integración Básico Clínica II", type: "Primer parcial", officialDate: "2025-12-11", officialTime: "09:00" },
            { id: "2-IBC2-P2", subject: "Integración Básico Clínica II", type: "Segundo parcial", officialDate: "2026-04-25", officialTime: "08:00" },
            { id: "2-IBC2-O1", subject: "Integración Básico Clínica II", type: "Primer ordinario", officialDate: "2026-05-08", officialTime: "14:00" },
            { id: "2-IBC2-O2", subject: "Integración Básico Clínica II", type: "Segundo ordinario", officialDate: "2026-05-26", officialTime: "13:00" },
            { id: "2-IBC2-EX", subject: "Integración Básico Clínica II", type: "Extraordinario", officialDate: "2026-06-08", officialTime: "11:00" }
        ]
    };

    function buildIndices(){
        [1,2].forEach(year=>{
            const bySubject={};
            EXAMS_BY_YEAR[year].forEach(ex=>{
                examIdToObj[ex.id]=ex;
                (bySubject[ex.subject] ||= []).push(ex);
                examLabelIndex[year][ex.id] = `${ex.subject} — ${ex.type}`;
            });
            Object.keys(bySubject).forEach(sub=>{
                bySubject[sub].sort((a,b)=>{
                    return EXAM_ORDER.indexOf(a.type)-EXAM_ORDER.indexOf(b.type) || a.officialDate.localeCompare(b.officialDate);
                });
                subjectChains[year][sub]=bySubject[sub].map(e=>e.id);
            });
        });
    }

    /* ===== Color desde ícono ===== */
    const sampledCache = new Map();
    function sampleIcon(imgEl, alpha, fallback, apply){
        const key=imgEl.src+"@avg@"+alpha;
        if(sampledCache.has(key)) return apply(sampledCache.get(key));
        const img=new Image(); img.crossOrigin="anonymous"; img.src=imgEl.src;
        const compute=()=>{
            try{
                const c=document.createElement("canvas"); c.width=1; c.height=1;
                const ctx=c.getContext("2d"); ctx.drawImage(img,0,0,10,10);
                const d=ctx.getImageData(0,0,10,10).data;
                const rgba=`rgba(${d[0]},${d[1]},${d[2]},${alpha})`;
                sampledCache.set(key, rgba); apply(rgba);
            }catch{ apply(hexToRgba(fallback, alpha)); }
        };
        if(img.complete) compute(); else img.addEventListener("load", compute);
    }
    function sampleIconAt(imgEl, x, y, alpha, fallback, apply){
        const key=imgEl.src+`@${x},${y}@${alpha}`;
        if(sampledCache.has(key)) return apply(sampledCache.get(key));
        const img=new Image(); img.crossOrigin="anonymous"; img.src=imgEl.src;
        const compute=()=>{
            try{
                const c=document.createElement("canvas"); c.width=img.naturalWidth||42; c.height=img.naturalHeight||42;
                const ctx=c.getContext("2d"); ctx.drawImage(img,0,0);
                const d=ctx.getImageData(Math.min(x,c.width-1),Math.min(y,c.height-1),1,1).data;
                const rgba=`rgba(${d[0]},${d[1]},${d[2]},${alpha})`;
                sampledCache.set(key, rgba); apply(rgba);
            }catch{ apply(hexToRgba(fallback, alpha)); }
        };
        if(img.complete) compute(); else img.addEventListener("load", compute);
    }

    function getSigla(sub){ return SUBJECT_SIGLAS[sub] || {display:sub.split(" ").map(w=>w[0]).join("").slice(0,3).toUpperCase(), file:"GEN"}; }
    function shortType(t){
        switch(t){
            case "Primer parcial": return {badge:"PAR 1", meaning:"Parcial 1"};
            case "Segundo parcial": return {badge:"PAR 2", meaning:"Parcial 2"};
            case "Tercer parcial": return {badge:"PAR 3", meaning:"Parcial 3"};
            case "Cuarto parcial": return {badge:"PAR 4", meaning:"Parcial 4"};
            case "Primer ordinario": return {badge:"ORD 1", meaning:"Ordinario 1"};
            case "Segundo ordinario": return {badge:"ORD 2", meaning:"Ordinario 2"};
            case "Extraordinario": return {badge:"EXT 1", meaning:"Extraordinario"};
            default: return {badge:t, meaning:t};
        }
    }

    /* ===== UI helpers ===== */
    function line(label, value){
        const row=document.createElement("div"); row.className="exam-line";
        const l=document.createElement("span"); l.className="line-label"; l.textContent=label;
        const v=document.createElement("span"); v.className="line-value"; v.textContent=value;
        row.appendChild(l); row.appendChild(v); return row;
    }
    function lineStacked(label, value){
        const row=document.createElement("div"); row.className="exam-line stacked";
        const l=document.createElement("span"); l.className="line-label"; l.textContent=label;
        const v=document.createElement("span"); v.className="line-value"; v.textContent=value;
        row.appendChild(l); row.appendChild(v); return row;
    }
    function lineUpperGroups(groups){
        const text = (groups && groups.length)
            ? groups.slice(0,5).sort((a,b)=>a-b).join(", ") + (groups.length>5 ? "  +" + (groups.length-5) : "")
            : "—";
        const row=line("ESTA ES UNA FECHA VOTADA POR:", text);
        row.classList.add("upper");
        return row;
    }

    function createExamCard(exam, viewDate, statusClass, forced, opts={}){
        const { approvedDate, suggestionDate, isOwn } = opts;
        const sig=getSigla(exam.subject); const badge=shortType(exam.type);
        const card=document.createElement("div"); card.className="exam-card "+statusClass; card.draggable=true; card.dataset.examId=exam.id;
        if(forced) card.classList.add("forced");
        if(isOwn) card.classList.add("own-proposal-solid");

        const strip=document.createElement("div"); strip.className="exam-status-strip"; card.appendChild(strip);

        const head=document.createElement("div"); head.className="exam-head2";
        const icon=document.createElement("div"); icon.className="exam-icon-vert";
        const img=document.createElement("img"); img.alt=sig.display; img.src="img/"+sig.file+".png";
        icon.appendChild(img); head.appendChild(icon);

        const title=document.createElement("div"); title.className="exam-title";
        const sigla=document.createElement("div"); sigla.className="exam-sigla"; sigla.textContent=sig.display; sigla.title=exam.subject;
        const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title=badge.meaning;
        title.appendChild(sigla); title.appendChild(badgeEl); head.appendChild(title); card.appendChild(head);

        const key=sig.display.replace(/\s+/g,""); const fallback=SUBJECT_COLORS[key]||"#4ecaff";
        if(!isOwn) sampleIcon(img,.5,fallback,(rgba)=>card.style.setProperty("--subj-tint",rgba));
        else sampleIconAt(img,20,20,1,fallback,(rgba)=>card.style.setProperty("--own-solid",rgba));

        const appText = approvedDate ? formatShort(approvedDate) : formatShort(exam.officialDate);
        const sugText = suggestionDate ? formatShort(suggestionDate) : formatShort(viewDate);
        card.appendChild(lineStacked("última fecha aprobada:", appText));
        card.appendChild(lineStacked("sugerencia de reprogramación:", sugText));

        const baseDate = suggestionDate || viewDate;
        const distPrev = nearestBefore(baseDate, exam.id);
        const distNext = nearestAfter(baseDate, exam.id);
        card.appendChild(line("Último departamental según votos:", distPrev!=null? `${distPrev} días atrás`:"—"));
        card.appendChild(line("Próximo departamental según votos:", distNext!=null? `${distNext} días`:"—"));

        if(showSubjectWeeks && currentGroupId){
            const s=loadState(); const map=(s.groups[currentGroupId] && s.groups[currentGroupId].proposals)||{};
            const w=weeksToNextSame(currentYear, exam.id, map);
            card.appendChild(line("Semanas para cubrir la siguiente unidad:", (w!=null? `${w} semanas`:"—")));
        }

        card.addEventListener("dragstart", e=>{ e.dataTransfer.setData("text/plain", exam.id); e.dataTransfer.effectAllowed="move"; card.classList.add("dragging"); });
        card.addEventListener("dragend", ()=> card.classList.remove("dragging"));

        return card;
    }

    function createGhostCard(exam, dateStr, groups, alpha){
        const sig=getSigla(exam.subject); const badge=shortType(exam.type);
        const card=document.createElement("div"); card.className="exam-card is-ghost ghost-min"; card.draggable=false;
        card.style.setProperty("--ghost-alpha", alpha.toFixed(3));

        const head=document.createElement("div"); head.className="exam-head2";
        const icon=document.createElement("div"); icon.className="exam-icon-vert";
        const img=document.createElement("img"); img.alt=sig.display; img.src="img/"+sig.file+".png";
        icon.appendChild(img); head.appendChild(icon);

        const title=document.createElement("div"); title.className="exam-title";
        const sigla=document.createElement("div"); sigla.className="exam-sigla"; sigla.textContent=sig.display; sigla.title=exam.subject;
        const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title=badge.meaning;
        title.appendChild(sigla); title.appendChild(badgeEl); head.appendChild(title); card.appendChild(head);

        const key=sig.display.replace(/\s+/g,""); const fallback=SUBJECT_COLORS[key]||"#4ecaff";
        // icon tint más tenue en fantasmas
        sampleIcon(img,.35,fallback,(rgba)=>card.style.setProperty("--subj-tint",rgba));

        card.appendChild(lineStacked("PROPUESTA:", formatHuman(dateStr)));
        card.appendChild(lineUpperGroups(groups));

        const strip=document.createElement("div"); strip.className="exam-status-strip"; strip.style.display="none";
        card.appendChild(strip);
        return card;
    }

    /* ===== Cálculos de distancias ===== */
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
    function weeksToNextSame(year, examId, proposalsMap){
        const ex=examIdToObj[examId]; if(!ex) return null;
        const chain=(subjectChains[year]||{})[ex.subject]||[];
        const idx=chain.indexOf(examId); if(idx===-1||idx===chain.length-1) return null;
        const nextId=chain[idx+1]; const next=examIdToObj[nextId]; if(!next) return null;
        const from=proposalsMap[examId]||ex.officialDate; const to=proposalsMap[nextId]||next.officialDate;
        return Math.round((diffDays(from,to)/7)*10)/10;
    }

    /* ===== Calendario ===== */
    function monthList(){
        const out=[]; const s=parseDate(CAL_START_DATE), e=parseDate(CAL_END_DATE);
        let c=new Date(s.getFullYear(), s.getMonth(), 1);
        while(c<=e){ out.push({y:c.getFullYear(), m:c.getMonth()}); c.setMonth(c.getMonth()+1); }
        return out;
    }
    function buildCalendars(){
        const root=$id("calendar"); root.innerHTML="";
        monthList().forEach(({y,m})=>{
            const sec=document.createElement("section"); sec.className="month";
            const h=document.createElement("header"); h.className="month-header";
            const t=document.createElement("h3"); t.textContent=MONTH_NAMES[m]+" "+y; h.appendChild(t); sec.appendChild(h);

            const grid=document.createElement("div"); grid.className="month-grid";
            DAY_NAMES.forEach(d=>{ const dn=document.createElement("div"); dn.className="day-name"; dn.textContent=d; grid.appendChild(dn); });

            const startIndex=((new Date(y,m,1)).getDay()+6)%7;
            for(let i=0;i<startIndex;i++){ const e=document.createElement("div"); e.className="day-cell empty"; grid.appendChild(e); }

            const last=new Date(y,m+1,0).getDate();
            for(let d=1; d<=last; d++){
                const ds=formatDate(y,m+1,d);
                const cell=document.createElement("div"); cell.className="day-cell"; cell.dataset.date=ds;
                const dow=parseDate(ds).getDay(); if(dow===0) cell.classList.add("weekend");
                if(isVacation(ds)) cell.classList.add("vacation");
                const fr=getRestriction(ds); if(fr && fr.kind==="blocked") cell.classList.add("vacation");

                const hdr=document.createElement("div"); hdr.className="day-header";
                const n=document.createElement("span"); n.className="day-number"; n.textContent=String(d);
                const meta=document.createElement("span"); meta.className="day-meta";
                if(ds===CAL_START_DATE) meta.textContent="Inicio";
                else if(ds===CAL_END_DATE) meta.textContent="Fin";
                else if(fr && fr.kind==="blocked") meta.textContent="Fournier ocupado";
                else if(fr && fr.kind==="partial_after") meta.textContent=("Fournier desde "+(fr.freeFrom||"15:00"));
                else if(fr && fr.kind==="partial_until") meta.textContent=("Fournier hasta "+(fr.freeUntil||"16:00"));
                else if(isVacation(ds)) meta.textContent="Vacaciones";
                else if(dow===0) meta.textContent="Fin de semana";
                hdr.appendChild(n); hdr.appendChild(meta); cell.appendChild(hdr);

                const ghost=document.createElement("div"); ghost.className="ghost-date"; cell.appendChild(ghost);
                const list=document.createElement("div"); list.className="exam-list"; cell.appendChild(list);

                cell.addEventListener("dragover", e=>{ if(resultsMode) return; e.preventDefault(); cell.classList.add("drop-target"); });
                cell.addEventListener("dragleave", ()=> cell.classList.remove("drop-target"));
                cell.addEventListener("drop", e=>{
                    if(resultsMode) return;
                    e.preventDefault(); cell.classList.remove("drop-target");
                    const examId=e.dataTransfer.getData("text/plain");
                    const dateStr=cell.dataset.date;
                    if(examId && dateStr) moveExamToDate(examId, dateStr);
                });

                grid.appendChild(cell);
            }
            sec.appendChild(grid); root.appendChild(sec);
        });
        syncCardWidth();
    }
    function syncCardWidth(){
        const sample=document.querySelector(".month .month-grid .day-cell:not(.empty)");
        if(!sample) return;
        const cs=getComputedStyle(sample);
        const w=Math.max(150, Math.round(sample.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0)));
        document.documentElement.style.setProperty("--day-cell-w", w+"px");
    }

    /* ===== Mostrar/ocultar cuando no hay grupo ===== */
    function toggleEmptyState(){
        const instructions = $id("instructions-pane");
        const mainPanel    = document.querySelector(".main-panel");
        const statsWrap    = document.querySelector(".stats-ribbon-wrap");

        const showMain = !!(currentGroupId || resultsMode);

        safeToggle(instructions, !showMain);
        safeToggle(mainPanel, showMain);
        safeToggle(statsWrap, showMain);
    }

    /* ===== Estado local/grupo ===== */
    function loadState(){
        try{
            const raw=localStorage.getItem(STORAGE_KEY);
            if(!raw) return {groups:{}, showSubjectWeeks:false, hideMobileBanner:false};
            const s=JSON.parse(raw);
            if(!s.groups) s.groups={};
            if(typeof s.showSubjectWeeks!=="boolean") s.showSubjectWeeks=false;
            if(typeof s.hideMobileBanner!=="boolean") s.hideMobileBanner=false;
            return s;
        }catch{ return {groups:{}, showSubjectWeeks:false, hideMobileBanner:false}; }
    }
    function saveState(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch{} }

    function ensureGroup(groupId, year){
        const s=loadState();
        if(!s.groups[groupId]){
            const approved={}; const proposals={};
            (EXAMS_BY_YEAR[year]||[]).forEach(ex=>{ approved[ex.id]=ex.officialDate; proposals[ex.id]=ex.officialDate; });
            s.groups[groupId]={year, approved, proposals};
            saveState(s);
        }
    }

    function renderCurrentGroup(){
        const pending=$id("pending-exams-list"); if(pending) pending.innerHTML="";
        document.querySelectorAll(".exam-list").forEach(el=> el.innerHTML="");

        if(resultsMode || !currentGroupId){ return; }

        const exams=EXAMS_BY_YEAR[currentYear]||[];
        const s=loadState();
        const g = currentGroupId ? s.groups[currentGroupId] : null;
        const approvedMap = g?.approved || {};
        const proposalsMap = g?.proposals || {};

        exams.forEach(ex=>{
            const approvedDate=approvedMap[ex.id] || ex.officialDate;
            const suggestionDate=proposalsMap[ex.id] || ex.officialDate;
            const valid=isValidDate(suggestionDate);
            const isOriginal = suggestionDate===approvedDate;
            let status=""; if(!valid) status="status-invalid"; else if(isOriginal) status="status-original"; else status="status-valid";
            const forced = (ex.officialDate < FORCED_REPROGRAM_CUTOFF) && !valid;
            const card=createExamCard(ex, suggestionDate, status, forced, {approvedDate, suggestionDate, isOwn: !!currentGroupId});

            const dayCell=document.querySelector('.day-cell[data-date="'+suggestionDate+'"]');
            const isOriginalBefore = ex.officialDate < FORCED_REPROGRAM_CUTOFF;
            const placeInPending = isOriginalBefore && (suggestionDate===ex.officialDate);

            if(currentGroupId && !placeInPending && dayCell && isWithin(suggestionDate)){
                dayCell.querySelector(".exam-list").appendChild(card);
            }else if(pending){
                pending.appendChild(card);
            }
        });
    }

    function moveExamToDate(examId, dateStr){
        if(resultsMode) return;
        if(!currentGroupId) return alert("Primero ingresa tu grupo.\n\nLa importancia de poner el grupo es porque este será registrado en la captura en PDF.");
        if(!isWithin(dateStr)) return alert("La fecha está fuera del rango noviembre 2025–junio 2026.");

        const ex=examIdToObj[examId]; const fr=getRestriction(dateStr);
        if(fr){
            if(fr.kind==="blocked"){
                alert("El Auditorio Fournier estará ocupado ese día.\n\n"+FOURNIER_REASON_TEXT);
                return;
            }
            if(fr.kind==="partial_after"){
                alert("Ese día solo se puede después de las "+(fr.freeFrom||"15:00")+". El examen está programado a las "+(ex?.officialTime||"08:00")+".");
            }
            if(fr.kind==="partial_until"){
                alert("Ese día solo se puede hasta las "+(fr.freeUntil||"16:00")+". El examen está programado a las "+(ex?.officialTime||"08:00")+".");
            }
        }
        if(!isValidDate(dateStr)) return alert("Esa fecha es inválida (fin de semana o periodo vacacional).");

        const s=loadState(); ensureGroup(String(currentGroupId), currentYear);
        s.groups[currentGroupId].proposals ||= {};
        s.groups[currentGroupId].proposals[examId]=dateStr;
        saveState(s);

        renderCurrentGroup();
        recomputeAgg(); // refresca fantasmas al vuelo
    }

    /* ===== API remota (Functions) ===== */
    async function apiSaveProposals(group_id, year, proposals, csvText){
        const res = await fetch("/.netlify/functions/proposals-save", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ group_id:Number(group_id), year:Number(year), proposals, csv: csvText||null })
        });
        if(!res.ok){
            const t = await res.text().catch(()=>res.statusText);
            throw new Error("Error al guardar en el servidor: "+t);
        }
        return res.json();
    }
    async function apiGetGroup(group_id, year){
        const url = `/.netlify/functions/proposals-get?group_id=${encodeURIComponent(group_id)}&year=${encodeURIComponent(year)}`;
        const res = await fetch(url);
        if(res.status===404) return null;
        if(!res.ok) throw new Error("Error al leer del servidor");
        return res.json();
    }
    async function apiListYear(year){
        const res = await fetch(`/.netlify/functions/proposals-list?year=${encodeURIComponent(year)}`);
        if(!res.ok) throw new Error("Error al listar propuestas");
        return res.json();
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

    /* ===== Agregados / fantasmas ===== */
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

    function renderStats(modeByExam, modeListByExam, groupsByExamDate){
        const wrap=$id("stats-ribbon"), empty=$id("stats-empty");
        if(wrap) wrap.innerHTML="";
        const items=Object.keys(modeByExam).map(id=>({ exam: examIdToObj[id], mode: modeByExam[id], list: modeListByExam[id]||[] }));

        // Orden: más próximo → más lejano (futuro primero; luego pasado por cercanía)
        items.sort((a,b)=> compareByProximity(a.mode.date, b.mode.date));

        if(!wrap || !empty) return;
        if(items.length===0){ empty.style.display="block"; return; }
        empty.style.display="none";
        items.forEach(({exam,mode,list})=>{
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
            const sub=document.createElement("div"); sub.className="stat-sub";
            const voters=(groupsByExamDate[exam.id] && groupsByExamDate[exam.id][mode.date]) ? groupsByExamDate[exam.id][mode.date] : [];
            sub.textContent="votado por "+mode.count+" grupos"; if(voters.length) sub.title="Grupos: "+voters.sort((a,b)=>a-b).join(", ");
            card.appendChild(date); card.appendChild(sub);

            if(list.length>1){
                const det=document.createElement("details"); const sum=document.createElement("summary");
                sum.textContent="ver 2a y 3a moda"; det.appendChild(sum);
                const ul=document.createElement("ul");
                list.slice(1,3).forEach((o,i)=>{
                    const g=(groupsByExamDate[exam.id] && groupsByExamDate[exam.id][o.date]) ? groupsByExamDate[exam.id][o.date] : [];
                    const li=document.createElement("li"); li.textContent=(i===0?"2a":"3a")+": "+formatHuman(o.date)+" — "+o.count+" votos";
                    if(g.length) li.title="Grupos: "+g.sort((a,b)=>a-b).join(", ");
                    ul.appendChild(li);
                });
                det.appendChild(ul); card.appendChild(det);
            }
            wrap.appendChild(card);
        });
    }

    /* ===== Captura: encabezado UNA LÍNEA ===== */
    function proposalsMapFor(groupId){
        const s=loadState(); const g=s.groups[groupId]; if(!g) return {};
        const exams=EXAMS_BY_YEAR[g.year]||[]; const out={};
        exams.forEach(ex=>{ out[ex.id]=(g.proposals && g.proposals[ex.id]) || ex.officialDate; });
        return out;
    }
    function buildCSV(year, proposalsMap){
        let csv="examen,fecha\n";
        Object.keys(proposalsMap).forEach(exam_id=>{
            const label = (examLabelIndex[year] && examLabelIndex[year][exam_id]) || exam_id;
            csv += `"${label.replace(/"/g,'""')}",${proposalsMap[exam_id]}\n`;
        });
        return csv;
    }

    function buildPerPagePrintHeaders(){
        const now = new Date();
        const dateText = now.toLocaleDateString('es-MX', { year:'numeric', month:'2-digit', day:'2-digit' });
        const timeText = now.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', hour12:false });
        const groupText = resultsMode ? "RESULTADOS" : (currentGroupId ? `Grupo ${currentGroupId}` : "Grupo —");
        const line = `Propuesta del ${groupText} | ${dateText} | ${timeText}`;

        document.querySelectorAll(".month").forEach(sec=>{
            let ph = sec.querySelector(".print-header");
            if(!ph){
                ph = document.createElement("div");
                ph.className = "print-header";
                sec.insertBefore(ph, sec.firstChild);
            }
            ph.innerHTML = `<div class="print-line">${line}</div>`;
        });
    }
    function cleanupPerPagePrintHeaders(){
        document.querySelectorAll(".month .print-header").forEach(ph=> ph.remove());
    }

    async function onCapture(){
        const removeAfter = ()=>{
            cleanupPerPagePrintHeaders();
            window.removeEventListener("afterprint", removeAfter);
        };
        window.addEventListener("afterprint", removeAfter);
        try{
            if(resultsMode || !currentGroupId){
                buildPerPagePrintHeaders();
                window.print();
                return;
            }
            const map=proposalsMapFor(currentGroupId);
            const csv=buildCSV(currentYear, map);
            await apiSaveProposals(currentGroupId, currentYear, map, csv);
            try { await recomputeAgg(); } catch {}
        }catch(e){
            console.warn("No se pudo guardar en servidor, se imprime de todos modos:", e?.message||e);
        } finally {
            buildPerPagePrintHeaders();
            window.print();
        }
    }

    /* ===== Entradas / control ===== */
    function parseGroupValue(raw){
        if(raw==null) return { kind:"empty" };
        const txt = String(raw).trim();
        if(txt==="") return { kind:"empty" };
        if(/^0+$/.test(txt) || /^resultados$/i.test(txt)){
            return { kind:"results" };
        }
        const n = Number(txt);
        if(Number.isInteger(n)) return { kind:"number", value:n };
        return { kind:"invalid" };
    }

    async function setCurrentGroupFromInput(raw){
        const parsed = parseGroupValue(raw);
        const status=$id("group-status");
        const statsYear=$id("stats-year");

        const setStatus=(msg)=>{ if(status) status.textContent=msg; };

        if(parsed.kind==="empty"){
            resultsMode=false; currentGroupId=null;
            setStatus("Escribe tu grupo para comenzar");
            toggleEmptyState();
            return;
        }

        if(parsed.kind==="results"){
            resultsMode=true; currentGroupId=null;
            setStatus("Resultados generales (solo lectura)");
            toggleEmptyState();
            await recomputeAgg();
            return;
        }

        if(parsed.kind!=="number"){
            resultsMode=false; currentGroupId=null;
            setStatus(`Escribe un grupo entre ${YEAR1_RANGE.min}–${YEAR1_RANGE.max} o ${YEAR2_RANGE.min}–${YEAR2_RANGE.max}`);
            toggleEmptyState();
            return;
        }

        const groupNumber = parsed.value;
        let year=null;
        if(groupNumber>=YEAR1_RANGE.min && groupNumber<=YEAR1_RANGE.max) year=1;
        else if(groupNumber>=YEAR2_RANGE.min && groupNumber<=YEAR2_RANGE.max) year=2;

        if(!year){
            resultsMode=false; currentGroupId=null;
            setStatus(`Grupo fuera de rango (solo ${YEAR1_RANGE.min}–${YEAR1_RANGE.max} y ${YEAR2_RANGE.min}–${YEAR2_RANGE.max})`);
            toggleEmptyState();
            return;
        }

        resultsMode=false;
        currentGroupId=String(groupNumber);
        currentYear=year;
        setStatus(year===1?"Primer año":"Segundo año");
        if(statsYear) statsYear.value=String(year);

        ensureGroup(currentGroupId, currentYear);

        try{
            const remote = await apiGetGroup(currentGroupId, currentYear);
            if(remote && remote.proposals){
                const s=loadState(); s.groups[currentGroupId].proposals = remote.proposals; saveState(s);
            }
        }catch(e){ console.warn(e); }

        toggleEmptyState();
        renderCurrentGroup();
        await recomputeAgg();
    }

    function wire(){
        $id("capture-btn")?.addEventListener("click", onCapture);
        $id("stats-year")?.addEventListener("change", async (e)=>{
            currentYear = Number(e.target.value)||1;
            if(!resultsMode && !currentGroupId){ return; }
            await recomputeAgg();
            renderCurrentGroup();
        });

        const cb=$id("toggle-subject-weeks");
        const st=loadState(); showSubjectWeeks=!!st.showSubjectWeeks; if(cb) cb.checked=showSubjectWeeks;
        cb?.addEventListener("change", ()=>{ showSubjectWeeks=cb.checked; const s=loadState(); s.showSubjectWeeks=showSubjectWeeks; saveState(s); renderCurrentGroup(); });

        const input=$id("group-input");
        const applyInput = debounce(()=> setCurrentGroupFromInput(input.value), 120);
        input?.addEventListener("input", applyInput);
        input?.addEventListener("change", ()=> setCurrentGroupFromInput(input.value));
        input?.addEventListener("blur", ()=> setCurrentGroupFromInput(input.value));
        input?.addEventListener("keydown", e=>{
            if(e.key==="Enter"){
                e.preventDefault();
                setCurrentGroupFromInput(input.value);
                input.blur();
            }
        });

        window.addEventListener("resize", ()=>{ clearTimeout(window.__r); window.__r=setTimeout(syncCardWidth,120); });
    }

    /* ===== Inicio ===== */
    document.addEventListener("DOMContentLoaded", async ()=>{
        buildIndices();
        buildCalendars();
        wire();
        toggleEmptyState();
    });
})();
