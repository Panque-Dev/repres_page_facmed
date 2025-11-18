(function(){
    "use strict";

    // ================= CONFIG =================
    const YEAR1_RANGE = { min: 1101, max: 1182 };
    const YEAR2_RANGE = { min: 2201, max: 2265 };

    const CAL_START_DATE = "2025-11-01";
    const CAL_END_DATE   = "2026-06-30";

    const VACATION_START_DATE = "2025-12-12";
    const VACATION_END_DATE   = "2026-01-04";
    const VACATION_SS_START   = "2026-03-29";
    const VACATION_SS_END     = "2026-04-05";

    // PARO
    const STRIKE_START_DATE   = "2025-11-01";
    const STRIKE_END_DATE     = "2025-11-18";

    // CLASES SIN EVALUACIÓN
    const NOEVAL_START_DATE   = "2025-11-19";
    const NOEVAL_END_DATE     = "2025-11-22";

    const SPECIAL_DAY_LABELS = {
        "2025-11-17": "Día de la Revolución",
        "2025-12-12": "Virgen de Guadalupe (ya no asisten los trabajadores)",
        "2025-12-24": "Nochebuena",
        "2025-12-25": "Navidad",
        "2026-01-01": "Año Nuevo",
        "2026-02-02": "Día de la Constitución"
    };
    const HOLIDAYS_SET = new Set(Object.keys(SPECIAL_DAY_LABELS));

    const FORCED_REPROGRAM_CUTOFF = "2025-11-23";
    const SELECTION_DAY           = "2025-12-02";

    const STORAGE_KEY   = "deptScheduler.state.v6_remote";
    const SNAPSHOT_KEY  = (year)=>`deptScheduler.snapshot.year${year}`;

    // Fantasmas
    const MAX_GHOSTS_PER_EXAM      = 3;
    const MAX_ALPHA_MAIN           = 0.38;
    const MAX_ALPHA_ALT            = 0.26;
    const MIN_ALPHA_CAP_WHEN_FEW   = 0.18;

    /* ======= Restricciones Fournier ======= */
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

        "2026-02-02": { kind: "vac" },
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
        "2026-03-31": { kind: "vac" },

        "2026-04-07": { kind: "blocked" },
        "2026-04-15": { kind: "blocked" },
        "2026-04-22": { kind: "blocked" },
        "2026-04-24": { kind: "blocked" },
        "2026-04-27": { kind: "blocked" },
        "2026-04-28": { kind: "blocked" },
        "2026-04-29": { kind: "blocked" },
        "2026-04-30": { kind: "blocked" }
    };

    // ===== Ajustes visibles
    const TOTAL_RESPONSES = 202;
    const BAR_CONFIG = [
        { max: 82, target: 79 }, // primero
        { max: 65, target: 58 }  // segundo
    ];

    // ===== Base calendario y utilidades
    const DAY_NAMES = ["L","M","X","J","V","S","D"];
    const iso = (d)=> d.toISOString().slice(0,10);
    const parseDate = (s)=> new Date(s+"T00:00:00");
    const isSunday = (d)=> d.getDay()===0;
    const within = (s, a, b)=> s>=a && s<=b;

    // custom blocks opcionales
    function expandRange(a,b){
        const out=[]; const d=new Date(a+"T00:00:00"); const e=new Date(b+"T00:00:00");
        while(d<=e){ out.push(iso(d)); d.setDate(d.getDate()+1); }
        return out;
    }
    function getCustomBlocks(){
        const cfg = (typeof window!=="undefined" && window.CALENDAR_BLOCKS) ? window.CALENDAR_BLOCKS : null;
        const dates = new Set();
        const labels = new Map();
        if(!cfg) return { dates, labels };
        if(Array.isArray(cfg.dates)){ cfg.dates.forEach(s=>{ dates.add(s); labels.set(s, "custom"); }); }
        if(Array.isArray(cfg.fournier)){ cfg.fournier.forEach(s=>{ dates.add(s); labels.set(s, "fournier"); }); }
        if(Array.isArray(cfg.ranges)){
            cfg.ranges.forEach(r=>{
                expandRange(r.start, r.end).forEach(s=>{ dates.add(s); labels.set(s, r.label||"custom"); });
            });
        }
        return { dates, labels };
    }

    // Materias e íconos
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
        ANA:"#A8003D", BQM:"#1D7464", HIS:"#8E117C", EMB:"#E48090", SPC:"#2C7C8E", ISM:"#641C74",
        IBC1:"#22d3ee", IBC2:"#06b6d4", IB1:"#00b4d8", IB2:"#0072A8",
        FIS:"#F44F32", FAR:"#DA74B8", INM:"#A84DDA", MyP:"#A89C1C", MYP:"#A89C1C",
        ICR:"#1D98A8", PCV:"#8E004F"
    };

    // Catálogo de exámenes por año
    const EXAMS_BY_YEAR = {
        1: [
            { id: "1-ANAT-P1", subject: "Anatomía", type: "Primer parcial", officialDate: "2025-10-25", officialTime: "08:00" },
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
            { id: "1-BCHM-P3", subject: "Biología Celular e Histología Médica", type: "Tercer parcial", officialDate: "2026-04-17", officialTime: "08:00" },
            { id: "1-BCHM-O1", subject: "Biología Celular e Histología Médica", type: "Primer ordinario", officialDate: "2026-05-12", officialTime: "08:00" },
            { id: "1-BCHM-O2", subject: "Biología Celular e Histología Médica", type: "Segundo ordinario", officialDate: "2026-05-28", officialTime: "08:00" },
            { id: "1-BCHM-EX", subject: "Biología Celular e Histología Médica", type: "Extraordinario", officialDate: "2026-06-09", officialTime: "08:00" },

            { id: "1-EMBR-P1", subject: "Embriología Humana", type: "Primer parcial", officialDate: "2025-11-14", officialTime: "08:00" },
            { id: "1-EMBR-P2", subject: "Embriología Humana", type: "Segundo parcial", officialDate: "2026-02-11", officialTime: "08:00" },
            { id: "1-EMBR-P3", subject: "Embriología Humana", type: "Tercer parcial", officialDate: "2026-04-24", officialTime: "08:00" },
            { id: "1-EMBR-O1", subject: "Embriología Humana", type: "Primer ordinario", officialDate: "2026-05-13", officialTime: "08:00" },
            { id: "1-EMBR-O2", subject: "Embriología Humana", type: "Segundo ordinario", officialDate: "2026-05-27", officialTime: "08:00" },
            { id: "1-EMBR-EX", subject: "Embriología Humana", type: "Extraordinario", officialDate: "2026-06-09", officialTime: "08:00" },

            { id: "1-SPC-P1", subject: "Salud Pública y Comunidad", type: "Primer parcial", officialDate: "2025-11-13", officialTime: "10:30" },
            { id: "1-SPC-P2", subject: "Salud Pública y Comunidad", type: "Segundo parcial", officialDate: "2026-02-06", officialTime: "08:00" },
            { id: "1-SPC-O1", subject: "Salud Pública y Comunidad", type: "Primer ordinario", officialDate: "2026-05-14", officialTime: "08:00" },
            { id: "1-SPC-O2", subject: "Salud Pública y Comunidad", type: "Segundo ordinario", officialDate: "2026-05-28", officialTime: "08:00" },
            { id: "1-SPC-EX", subject: "Salud Pública y Comunidad", type: "Extraordinario", officialDate: "2026-06-11", officialTime: "08:00" },

            { id: "1-ISM-P1", subject: "Introducción a la Salud Mental", type: "Primer parcial", officialDate: "2026-01-08", officialTime: "08:00" },
            { id: "1-ISM-P2", subject: "Introducción a la Salud Mental", type: "Segundo parcial", officialDate: "2026-03-13", officialTime: "08:00" },
            { id: "1-ISM-O1", subject: "Introducción a la Salud Mental", type: "Primer ordinario", officialDate: "2026-05-22", officialTime: "08:00" },
            { id: "1-ISM-O2", subject: "Introducción a la Salud Mental", type: "Segundo ordinario", officialDate: "2026-06-02", officialTime: "08:00" },
            { id: "1-ISM-EX", subject: "Introducción a la Salud Mental", type: "Extraordinario", officialDate: "2026-06-11", officialTime: "08:00" },

            { id: "1-IBC1-P1", subject: "Integración Básico Clínica I", type: "Primer parcial", officialDate: "2025-11-06", officialTime: "09:00" },
            { id: "1-IBC1-P2", subject: "Integración Básico Clínica I", type: "Segundo parcial", officialDate: "2026-01-31", officialTime: "10:00" },
            { id: "1-IBC1-O1", subject: "Integración Básico Clínica I", type: "Primer ordinario", officialDate: "2026-05-21", officialTime: "08:00" },
            { id: "1-IBC1-O2", subject: "Integración Básico Clínica I", type: "Segundo ordinario", officialDate: "2026-06-03", officialTime: "08:00" },
            { id: "1-IBC1-EX", subject: "Integración Básico Clínica I", type: "Extraordinario", officialDate: "2026-06-12", officialTime: "08:00" },

            { id: "1-INF1-P1", subject: "Informática Biomédica I", type: "Primer parcial", officialDate: "2025-11-28", officialTime: "09:00" },
            { id: "1-INF1-P2", subject: "Informática Biomédica I", type: "Segundo parcial", officialDate: "2026-02-13", officialTime: "09:00" },
            { id: "1-INF1-O1", subject: "Informática Biomédica I", type: "Primer ordinario", officialDate: "2026-05-15", officialTime: "15:00" },
            { id: "1-INF1-O2", subject: "Informática Biomédica I", type: "Segundo ordinario", officialDate: "2026-05-29", officialTime: "15:00" },
            { id: "1-INF1-EX", subject: "Informática Biomédica I", type: "Extraordinario", officialDate: "2026-06-09", officialTime: "15:00" }
        ],
        2: [
            { id: "2-FISIO-P1", subject: "Fisiología", type: "Primer parcial", officialDate: "2025-11-07", officialTime: "08:00" },
            { id: "2-FISIO-P2", subject: "Fisiología", type: "Segundo parcial", officialDate: "2026-02-20", officialTime: "08:00" },
            { id: "2-FISIO-P3", subject: "Fisiología", type: "Tercer parcial", officialDate: "2026-04-24", officialTime: "08:00" },
            { id: "2-FISIO-O1", subject: "Fisiología", type: "Primer ordinario", officialDate: "2026-05-09", officialTime: "08:00" },
            { id: "2-FISIO-O2", subject: "Fisiología", type: "Segundo ordinario", officialDate: "2026-05-26", officialTime: "08:00" },
            { id: "2-FISIO-EX", subject: "Fisiología", type: "Extraordinario", officialDate: "2026-06-10", officialTime: "08:00" },

            { id: "2-FARM-P1", subject: "Farmacología", type: "Primer parcial", officialDate: "2025-11-21", officialTime: "09:00" },
            { id: "2-FARM-P2", subject: "Farmacología", type: "Segundo parcial", officialDate: "2026-02-27", officialTime: "09:00" },
            { id: "2-FARM-P3", subject: "Farmacología", type: "Tercer parcial", officialDate: "2026-04-17", officialTime: "09:00" },
            { id: "2-FARM-O1", subject: "Farmacología", type: "Primer ordinario", officialDate: "2026-05-13", officialTime: "09:00" },
            { id: "2-FARM-O2", subject: "Farmacología", type: "Segundo ordinario", officialDate: "2026-05-28", officialTime: "09:00" },
            { id: "2-FARM-EX", subject: "Farmacología", type: "Extraordinario", officialDate: "2026-06-09", officialTime: "09:00" },

            { id: "2-INMU-P1", subject: "Inmunología", type: "Primer parcial", officialDate: "2025-11-28", officialTime: "08:00" },
            { id: "2-INMU-P2", subject: "Inmunología", type: "Segundo parcial", officialDate: "2026-03-06", officialTime: "08:00" },
            { id: "2-INMU-P3", subject: "Inmunología", type: "Tercer parcial", officialDate: "2026-04-24", officialTime: "08:00" },
            { id: "2-INMU-O1", subject: "Inmunología", type: "Primer ordinario", officialDate: "2026-05-14", officialTime: "08:00" },
            { id: "2-INMU-O2", subject: "Inmunología", type: "Segundo ordinario", officialDate: "2026-05-27", officialTime: "08:00" },
            { id: "2-INMU-EX", subject: "Inmunología", type: "Extraordinario", officialDate: "2026-06-10", officialTime: "08:00" },

            { id: "2-MICRO-P1", subject: "Microbiología y Parasitología", type: "Primer parcial", officialDate: "2026-01-24", officialTime: "08:00" },
            { id: "2-MICRO-P2", subject: "Microbiología y Parasitología", type: "Segundo parcial", officialDate: "2026-03-20", officialTime: "08:00" },
            { id: "2-MICRO-P3", subject: "Microbiología y Parasitología", type: "Primer ordinario", officialDate: "2026-05-08", officialTime: "08:00" },
            { id: "2-MICRO-O1", subject: "Microbiología y Parasitología", type: "Segundo ordinario", officialDate: "2026-05-20", officialTime: "08:00" },
            { id: "2-MICRO-O2", subject: "Microbiología y Parasitología", type: "Extraordinario", officialDate: "2026-06-03", officialTime: "08:00" },

            { id: "2-IBC2-P1", subject: "Integración Básico Clínica II", type: "Primer parcial", officialDate: "2025-12-11", officialTime: "09:00" },
            { id: "2-IBC2-P2", subject: "Integración Básico Clínica II", type: "Segundo parcial", officialDate: "2025-04-25", officialTime: "09:00" },
            { id: "2-IBC2-O1", subject: "Integración Básico Clínica II", type: "Primer ordinario", officialDate: "2026-05-08", officialTime: "08:00" },
            { id: "2-IBC2-O2", subject: "Integración Básico Clínica II", type: "Segundo ordinario", officialDate: "2026-06-02", officialTime: "08:00" },
            { id: "2-IBC2-EX", subject: "Integración Básico Clínica II", type: "Extraordinario", officialDate: "2026-06-11", officialTime: "08:00" },

            { id: "2-ICR-P1-TEO", subject: "Introducción a la Cirugía", type: "Parcial 1 (TEO)", officialDate: "2026-01-10", officialTime: "08:00" },
            { id: "2-ICR-P1-PRA", subject: "Introducción a la Cirugía", type: "Parcial 1 (PRA)", officialDate: "2026-01-12", officialTime: "08:00" },
            { id: "2-ICR-P2-TEO", subject: "Introducción a la Cirugía", type: "Parcial 2 (TEO)", officialDate: "2026-04-11", officialTime: "08:00" },
            { id: "2-ICR-P2-PRA", subject: "Introducción a la Cirugía", type: "Parcial 2 (PRA)", officialDate: "2026-04-13", officialTime: "08:00" },
            { id: "2-ICR-O1-TEO", subject: "Introducción a la Cirugía", type: "Ordinario 1 (TEO)", officialDate: "2026-05-20", officialTime: "08:00" },
            { id: "2-ICR-O1-PRA", subject: "Introducción a la Cirugía", type: "Ordinario 1 (PRA)", officialDate: "2026-05-22", officialTime: "08:00" },
            { id: "2-ICR-O2-TEO", subject: "Introducción a la Cirugía", type: "Ordinario 2 (TEO)", officialDate: "2026-06-03", officialTime: "08:00" },
            { id: "2-ICR-O2-PRA", subject: "Introducción a la Cirugía", type: "Ordinario 2 (PRA)", officialDate: "2026-06-05", officialTime: "08:00" },
            { id: "2-ICR-EX-TEO", subject: "Introducción a la Cirugía", type: "Extraordinario (TEO)", officialDate: "2026-06-10", officialTime: "08:00" },
            { id: "2-ICR-EX-PRA", subject: "Introducción a la Cirugía", type: "Extraordinario (PRA)", officialDate: "2026-06-12", officialTime: "08:00" },

            { id: "2-PCSV-P1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer parcial",   officialDate: "2025-11-18", officialTime: "09:00" },
            { id: "2-PCSV-P2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo parcial",  officialDate: "2026-04-15", officialTime: "15:00" },
            { id: "2-PSCV-O1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer ordinario", officialDate: "2026-05-15", officialTime: "15:00" },
            { id: "2-PSCV-O2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo ordinario", officialDate: "2026-05-29", officialTime: "15:00" },
            { id: "2-PSCV-EX", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Extraordinario",    officialDate: "2026-06-11", officialTime: "15:00" },

            { id: "2-INF2-P1", subject: "Informática Biomédica II", type: "Primer parcial", officialDate: null, officialTime: null },
            { id: "2-INF2-P2", subject: "Informática Biomédica II", type: "Segundo parcial", officialDate: null, officialTime: null },
            { id: "2-INF2-O1", subject: "Informática Biomédica II", type: "Primer ordinario", officialDate: null, officialTime: null },
            { id: "2-INF2-O2", subject: "Informática Biomédica II", type: "Segundo ordinario", officialDate: null, officialTime: null },
            { id: "2-INF2-EX", subject: "Informática Biomédica II", type: "Extraordinario", officialDate: null, officialTime: null }
        ]
    };

    // ===== helpers UI y render
    const qs = (s, r=document)=> r.querySelector(s);
    const qsa = (s, r=document)=> Array.from(r.querySelectorAll(s));
    const $id = (id)=> document.getElementById(id);

    function shortType(t){
        const s = String(t||"");
        const lower = s.toLowerCase();
        const modMatch = s.match(/\(([^)]+)\)/);
        const mod = modMatch ? ` (${modMatch[1].trim()})` : "";
        const n1 = /primer/i.test(s) ? "1" : /segundo/i.test(s) ? "2" : /tercer/i.test(s) ? "3" : /cuarto/i.test(s) ? "4" : "";
        if(lower.includes("ordinario")) return { badge: "ORD" + (n1? " "+n1 : ""), meaning:t };
        if(lower.includes("extra"))     return { badge: "EXT", meaning:t };
        if(lower.includes("parcial"))   return { badge: "PAR" + (n1? " "+n1 : "") + mod, meaning:t };
        return { badge:t||"—", meaning:t||"—" };
    }
    function getSigla(subject){
        return SUBJECT_SIGLAS[subject] || { display: subject, file: "GEN" };
    }
    function hexToRgba(hex, a){
        const b = (hex||"#334155").replace("#",""); const n=parseInt(b,16);
        const r = (n>>16)&255, g=(n>>8)&255, bl=n&255;
        return `rgba(${r},${g},${bl},${a})`;
    }
    function colorForExam(exam){
        const disp = getSigla(exam.subject).display;
        const key = disp.replace(/\s+/g,'');
        return SUBJECT_COLORS[key] || SUBJECT_COLORS[key.toUpperCase()] || SUBJECT_COLORS[key.toLowerCase()] || "#334155";
    }
    function formatShort(isoStr){
        try{
            const d = parseDate(isoStr);
            const dd = d.toLocaleDateString("es-MX", { day:"2-digit" });
            const mon = d.toLocaleDateString("es-MX", { month:"short" }).replace(/\.$/,"");
            const yy = d.getFullYear();
            return `${dd}-${mon}-${yy}`;
        }catch(_){ return isoStr || "—"; }
    }
    function makeSupportBar(n, total, color){
        const wrap=document.createElement('div'); wrap.className="support-bar";
        const inner=document.createElement('div'); inner.className="fill"; inner.style.background = color;
        inner.style.width = (total? (100*n/total): 0) + "%";
        wrap.appendChild(inner); return wrap;
    }
    function lineStacked(label, value){
        const row=document.createElement("div"); row.className="exam-line stacked";
        const l=document.createElement("span"); l.className="line-label"; l.textContent=label;
        const v=document.createElement("span"); v.className="line-value"; v.textContent=value;
        row.appendChild(l); row.appendChild(v); return row;
    }

    // ===== Calendario
    function monthList(){
        const out=[]; const s=parseDate(CAL_START_DATE), e=parseDate(CAL_END_DATE);
        let c=new Date(s.getFullYear(), s.getMonth(), 1);
        while(c<=e){ out.push({y:c.getFullYear(), m:c.getMonth()}); c.setMonth(c.getMonth()+1); }
        return out;
    }

    // Prioridad de rótulos: festivo > Fournier parcial > Fournier bloqueado/vacaciones > no eval/paro > fin de semana > custom
    function applyCalendarBlocks(section, y, m){
        const custom = getCustomBlocks();
        const grid = section.querySelector(".month-grid");
        const first = new Date(y,m,1), last = new Date(y,m+1,0);
        let start=first.getDay(); if(start===0) start=7;
        const base = 7 + (start - 1);

        for(let d=1; d<=last.getDate(); d++){
            const cell = grid.children[base + (d-1)];
            const dt = new Date(y, m, d);
            const ds = iso(dt);

            const header = cell.querySelector(".day-header");
            let meta = header.querySelector(".day-meta");
            if(!meta){ meta = document.createElement("span"); meta.className="day-meta"; header.appendChild(meta); }

            // Flags de estado
            const isWE   = isSunday(dt);
            const inVac  = within(ds, VACATION_START_DATE, VACATION_END_DATE) || within(ds, VACATION_SS_START, VACATION_SS_END);
            const inStrike = within(ds, STRIKE_START_DATE, STRIKE_END_DATE);
            const inNoEval = within(ds, NOEVAL_START_DATE, NOEVAL_END_DATE);
            const isHoliday = HOLIDAYS_SET.has(ds);
            const fr = FOURNIER_RESTRICTIONS[ds] || null;

            // Clases visuales
            if(isWE) cell.classList.add("weekend","blocked","blocked-weekend");
            if(inVac) cell.classList.add("vacation","blocked","blocked-vacation");
            if(isHoliday) cell.classList.add("blocked","blocked-holiday");
            if(inStrike) cell.classList.add("blocked-partial");
            if(inNoEval) cell.classList.add("blocked-partial");

            if(fr){
                if(fr.kind==="blocked"){
                    cell.classList.add("vacation","blocked","blocked-fournier");
                }else if(fr.kind==="vac"){
                    cell.classList.add("vacation","blocked","blocked-fournier");
                }else if(fr.kind==="partial_after"){
                    cell.classList.add("blocked-partial","blocked-fournier-after");
                }else if(fr.kind==="partial_until"){
                    cell.classList.add("blocked-partial","blocked-fournier-until");
                }
            }

            // Selección de etiqueta con prioridad
            let label = "";
            // 1) Festivo
            if(isHoliday) label = SPECIAL_DAY_LABELS[ds] || "Festivo";
            // 2) Fournier parcial (solo si no es festivo)
            else if(fr && (fr.kind==="partial_after" || fr.kind==="partial_until")){
                label = fr.kind==="partial_after" ? `Fournier desde ${fr.freeFrom||"15:00"}`
                    : `Fournier hasta ${fr.freeUntil||"16:00"}`;
            }
            // 3) Vacaciones o Fournier bloqueado (si no es festivo)
            else if(inVac || (fr && (fr.kind==="blocked" || fr.kind==="vac"))){
                label = inVac ? "Vacaciones" : "Fournier ocupado";
            }
            // 4) Paro o sin evaluación
            else if(inStrike) label = "Paro";
            else if(inNoEval) label = "Clases sin evaluación";
            // 5) Fin de semana
            else if(isWE) label = "Fin de semana";
            // 6) Custom del HTML
            if(!label && custom.dates.has(ds)){
                cell.classList.add("blocked","blocked-custom","vacation");
                label = custom.labels.get(ds) || "Bloqueado";
            }

            if(label){ meta.textContent = label; header.classList.add("is-blocked"); }
        }
    }

    function buildCalendars(container){
        container.innerHTML="";
        monthList().forEach(({y,m})=>{
            const section=document.createElement("section"); section.className="month";
            const header=document.createElement("header"); header.className="month-header";
            const t=document.createElement("h3");
            t.textContent=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m]+" "+y;
            header.appendChild(t);
            section.appendChild(header);

            const grid=document.createElement("div"); grid.className="month-grid";
            DAY_NAMES.forEach(d=>{ const el=document.createElement("div"); el.className="day-name"; el.textContent=d; grid.appendChild(el); });

            const first=new Date(y,m,1), last=new Date(y,m+1,0);
            let start=first.getDay(); if(start===0) start=7;
            for(let i=1;i<start;i++){ const empty=document.createElement("div"); empty.className="day-cell empty"; grid.appendChild(empty); }
            for(let d=1; d<=last.getDate(); d++){
                const cell=document.createElement("div"); cell.className="day-cell";
                const head=document.createElement("div"); head.className="day-header";
                const num=document.createElement("div"); num.className="day-number"; num.textContent=d;
                head.appendChild(num);
                const meta=document.createElement("span"); meta.className="day-meta"; head.appendChild(meta);
                cell.appendChild(head);
                const list=document.createElement("div"); list.className="exam-list"; cell.appendChild(list);
                grid.appendChild(cell);
            }
            section.appendChild(grid);
            applyCalendarBlocks(section, y, m);
            container.appendChild(section);
        });
    }

    function createResultCard(exam, opts={}){
        const { approvedDate, suggestionDate, voters=[], metrics=null, support=null } = opts;
        const sig=getSigla(exam.subject); const badge=shortType(exam.type);

        const card=document.createElement("div");
        card.className="exam-card status-valid";
        const __col = colorForExam(exam);
        card.style.setProperty('--card-bg', hexToRgba(__col, .30));
        card.style.setProperty('--card-strip', hexToRgba(__col, .95));
        card.style.minHeight = "0";
        card.style.height = "auto";
        card.draggable=false; card.dataset.examId=exam.id;

        const strip=document.createElement("div"); strip.className="exam-status-strip"; card.appendChild(strip);

        const head=document.createElement("div"); head.className="exam-head2";
        const icon=document.createElement("div"); icon.className="exam-icon-vert";
        const img=document.createElement("img"); img.alt=sig.display; img.src="img/"+sig.file+".png";
        icon.appendChild(img); head.appendChild(icon);

        const title=document.createElement("div"); title.className="exam-title";
        const sigla=document.createElement("div"); sigla.className="exam-sigla"; sigla.textContent=sig.display; sigla.title=exam.subject;
        const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title=badge.meaning;
        title.appendChild(sigla); title.appendChild(badgeEl); head.appendChild(title); card.appendChild(head);

        const appText = approvedDate || exam.officialDate ? formatShort(approvedDate || exam.officialDate) : "—";
        const sugText = suggestionDate ? formatShort(suggestionDate) : formatShort(exam.officialDate || "");

        if(approvedDate || exam.officialDate) card.appendChild(lineStacked("fecha original:", appText));
        card.appendChild(lineStacked("propuesta:", sugText));

        if(metrics){
            const { prevAllDays, nextAllDays, nextSameDays } = metrics;
            if(prevAllDays!=null) card.appendChild(lineStacked("desde último examen:", prevAllDays + " días"));
            if(nextAllDays!=null) card.appendChild(lineStacked("para el próximo examen:", nextAllDays + " días"));
            if(nextSameDays!=null){
                const weeks = Math.round((nextSameDays/7)*10)/10;
                card.appendChild(lineStacked("días para abordar la unidad:", `${nextSameDays} días · ${weeks} sem`));
            }
        }

        if(support && typeof support.total==="number"){
            const box = document.createElement("div");
            box.className = "card-support";
            const col = hexToRgba(__col, .95);
            const bar = makeSupportBar(support.count||0, support.total, col);
            const cap = document.createElement("div");
            cap.className = "progress-meta";
            const pct = support.total ? Math.round(100*(support.count||0)/support.total) : 0;
            cap.textContent = `Apoyo: ${support.count||0} de ${support.total} grupos (${pct}%)`;
            box.appendChild(bar);
            box.appendChild(cap);
            card.appendChild(box);
        }

        if(voters && voters.length){
            const box=document.createElement("div");
            box.className="card-groups";
            box.textContent = "Votaron: " + voters.sort((a,b)=>a-b).join(", ");
            card.appendChild(box);
        }

        return card;
    }
    function createGhostCard(exam){
        const sig=getSigla(exam.subject); const badge=shortType(exam.type);
        const card=document.createElement("div"); card.className="exam-card is-ghost ghost-min"; card.draggable=false;
        const __col = colorForExam(exam);
        card.style.setProperty('--card-bg', hexToRgba(__col, .14));
        card.style.setProperty('--card-strip', hexToRgba(__col, .6));
        card.style.minHeight = "0";
        card.style.height = "auto";

        const head=document.createElement("div"); head.className="exam-head2";
        const icon=document.createElement("div"); icon.className="exam-icon-vert";
        const img=document.createElement("img"); img.alt=sig.display; img.src="img/"+sig.file+".png";
        icon.appendChild(img); head.appendChild(icon);

        const title=document.createElement("div"); title.className="exam-title";
        const sigla=document.createElement("div"); sigla.className="exam-sigla"; sigla.textContent=sig.display; sigla.title=exam.subject;
        const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title=badge.meaning;
        title.appendChild(sigla); title.appendChild(badgeEl); head.appendChild(title); card.appendChild(head);

        return card;
    }

    function placeCard(isoStr, card, container){
        const d=parseDate(isoStr);
        const start = parseDate(CAL_START_DATE);
        const idx = (d.getFullYear()-start.getFullYear())*12 + d.getMonth() - start.getMonth();
        const month = container.querySelectorAll(".month")[ idx ];
        if(!month) return;
        const grid = month.querySelector(".month-grid");
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        let s=first.getDay(); if(s===0) s=7;
        const index = 7 + (d.getDate() + s - 2);
        const cell = grid.children[index];
        const list = cell.querySelector(".exam-list");
        list.appendChild(card);
    }
    function placeGhost(isoStr, card, container){ placeCard(isoStr, card, container); }

    // cache
    const cache = new Map();

    async function fetchYear(year){
        if(cache.has(year)) return cache.get(year);
        try{
            const res = await fetch(`/.netlify/functions/proposals-list?year=${year}`);
            if(!res.ok) throw new Error("HTTP "+res.status);
            const json = await res.json();
            cache.set(year, json);
            localStorage.setItem(SNAPSHOT_KEY(year), JSON.stringify(json));
            return json;
        }catch(e){
            const raw = localStorage.getItem(SNAPSHOT_KEY(year));
            if(raw){
                const json = JSON.parse(raw);
                cache.set(year, json);
                console.warn("Usando snapshot local de resultados:", e?.message||e);
                return json;
            }
            throw e;
        }
    }

    // ===== Cómputos
    function computeExamModes(year, groups){
        const results = [];
        for(const exam of EXAMS_BY_YEAR[year]){
            const counter = new Map();
            for(const g of groups){
                const d = g.proposals?.[exam.id];
                if(!d) continue;
                if(!counter.has(d)) counter.set(d, []);
                counter.get(d).push(g.group_id);
            }
            if(counter.size===0) continue;
            const arr = Array.from(counter.entries()).map(([date, gids])=>({date, gids, n:gids.length}));
            arr.sort((a,b)=> b.n - a.n || a.date.localeCompare(b.date));
            const best = arr[0];
            results.push({ exam, date: best.date, voters: best.gids });
        }
        return results;
    }
    function canonicalKeyFor(year, proposals){
        const ids = EXAMS_BY_YEAR[year].map(e=>e.id);
        return ids.map(id=> proposals?.[id] ? `${id}:${proposals[id]}` : `${id}:-`).join("|");
    }
    function clusterCalendars(year, groups){
        const clusters = new Map();
        for(const g of groups){
            const key = canonicalKeyFor(year, g.proposals||{});
            if(!clusters.has(key)) clusters.set(key, { groups:[], proposals: g.proposals||{} });
            clusters.get(key).groups.push(g.group_id);
        }
        const list = Array.from(clusters.values()).sort((a,b)=> b.groups.length - a.groups.length);
        return list;
    }
    function similarityTo(year, ref, other){
        const ids = EXAMS_BY_YEAR[year].map(e=>e.id);
        let same=0, total=0;
        for(const id of ids){
            const a = ref[id]; const b = other[id];
            if(!a || !b) continue;
            total += 1;
            if(a===b) same += 1;
        }
        return total? Math.round(100 * same / total) : 0;
    }
    function computeScheduleMetrics(year, proposalsMap){
        const entries = [];
        for(const ex of EXAMS_BY_YEAR[year]){
            const raw = proposalsMap[ex.id];
            const d = Array.isArray(raw) ? raw[0] : raw;
            if(d) entries.push({ id: ex.id, subject: ex.subject, date: d });
        }
        entries.sort((a,b)=> a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

        const prevNextGlobal = new Map();
        for(let i=0;i<entries.length;i++){
            const cur = entries[i];
            const prev = entries[i-1] || null;
            const next = entries[i+1] || null;
            const curDate = new Date(cur.date + "T00:00:00");
            const prevDays = prev ? Math.round((curDate - new Date(prev.date + "T00:00:00"))/86400000) : null;
            const nextDays = next ? Math.round((new Date(next.date + "T00:00:00") - curDate)/86400000) : null;
            prevNextGlobal.set(cur.id, { prevDays, nextDays });
        }

        const bySubj = new Map();
        for(const e of entries){
            if(!bySubj.has(e.subject)) bySubj.set(e.subject, []);
            bySubj.get(e.subject).push(e);
        }
        const subjNext = new Map();
        for(const [, arr] of bySubj.entries()){
            arr.sort((a,b)=> a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
            for(let i=0;i<arr.length;i++){
                const cur = arr[i];
                const nxt = arr[i+1] || null;
                const curDate = new Date(cur.date + "T00:00:00");
                const nextSameDays = nxt ? Math.round((new Date(nxt.date + "T00:00:00") - curDate)/86400000) : null;
                subjNext.set(cur.id, { nextSameDays });
            }
        }

        const out = {};
        for(const ex of EXAMS_BY_YEAR[year]){
            const g = prevNextGlobal.get(ex.id) || {};
            const s = subjNext.get(ex.id) || {};
            out[ex.id] = {
                prevAllDays: g.prevDays ?? null,
                nextAllDays: g.nextDays ?? null,
                nextSameDays: s.nextSameDays ?? null
            };
        }
        return out;
    }

    // ===== Panel dividido
    function normalizeForSimilarity(map){
        const out={};
        for(const [k,v] of Object.entries(map||{})){
            out[k] = Array.isArray(v)? v[0] : v;
        }
        return out;
    }
    function renderSplit(title, year, proposalsMap, perExamSupportMap=null, altProposalsMap=null){
        const split = $id("moda-split");
        const list  = $id("moda-cards");
        const cal   = $id("moda-calendar");

        $id("results-title").textContent = title;
        $id("calendar-wrap").classList.add("hide");
        split.classList.remove("hide");

        list.innerHTML="";
        buildCalendars(cal);

        const metricsById = computeScheduleMetrics(year, proposalsMap);

        const present = EXAMS_BY_YEAR[year]
            .filter(ex=> proposalsMap[ex.id])
            .map(ex=>{
                const raw = proposalsMap[ex.id];
                const arr = Array.isArray(raw) ? raw.slice() : [raw];
                return { ex, dates: arr, main: arr[0] };
            })
            .sort((a,b)=> a.main.localeCompare(b.main) || a.ex.subject.localeCompare(b.ex.subject) || a.ex.id.localeCompare(b.ex.id));

        const totalGroups = (cache.get(year)?.groups || []).length;

        present.forEach(r=>{
            const support = perExamSupportMap && perExamSupportMap[r.ex.id]
                ? { count: perExamSupportMap[r.ex.id].count, total: totalGroups }
                : null;

            const card = createResultCard(r.ex, {
                approvedDate: r.ex.officialDate,
                suggestionDate: r.main,
                metrics: metricsById[r.ex.id],
                support
            });

            const holder = document.createElement("div");
            holder.className="stat-card";
            holder.style.minHeight = "0";
            holder.style.height = "auto";
            holder.style.setProperty('--subj-tint', hexToRgba(colorForExam(r.ex), .12));
            holder.appendChild(card);
            list.appendChild(holder);

            r.dates.forEach(d=>{
                const cardCal = createResultCard(r.ex, {
                    approvedDate: r.ex.officialDate,
                    suggestionDate: d,
                    metrics: metricsById[r.ex.id]
                });
                placeCard(d, cardCal, cal);
            });
        });

        if(altProposalsMap){
            for(const ex of EXAMS_BY_YEAR[year]){
                const raw1 = proposalsMap[ex.id];
                const raw2 = altProposalsMap[ex.id];
                const d1 = Array.isArray(raw1)? raw1[0] : raw1;
                const d2 = Array.isArray(raw2)? raw2[0] : raw2;
                if(d1 && d2 && d1!==d2){
                    const ghost = createGhostCard(ex);
                    placeGhost(d2, ghost, cal);
                }
            }
        }

        const panel = $id("similarity-panel");
        const listSim = $id("similarity-list");
        const legend = $id("similarity-legend-90");
        listSim.innerHTML="";
        const groupsData = cache.get(year)?.groups || [];
        const simpleMap = normalizeForSimilarity(proposalsMap);
        const all = groupsData.map(g=>({ gid: g.group_id, pct: similarityTo(year, simpleMap, g.proposals||{}) }));
        all.sort((a,b)=> b.pct - a.pct || a.gid - b.gid);
        legend.textContent = String(all.filter(x=> x.pct >= 90).length);
        for(const it of all){
            const row = document.createElement("div");
            row.className = "sim-item";
            row.innerHTML = `<span class="gid">${it.gid}</span><span class="pct">${it.pct}%</span>`;
            row.style.setProperty('--fill', it.pct + '%');
            listSim.appendChild(row);
        }
        panel.classList.remove("hide");
    }

    // ===== Vistas
    function renderExamModes(year, modes){
        const modaMap = {};
        const supportMap = {};
        const totalGroups = (cache.get(year)?.groups || []).length;

        modes.forEach(r=>{
            modaMap[r.exam.id] = r.date;
            supportMap[r.exam.id] = { count: (r.voters?r.voters.length:0), total: totalGroups };
        });

        renderSplit("Propuesta por Moda por Examen", year, modaMap, supportMap, null);
    }
    function renderFullAsSplit(title, year, cluster, altCluster){
        const proposals = cluster?.proposals || {};
        const alt = altCluster?.proposals || null;
        renderSplit(title, year, proposals, null, alt);
    }

    let currentYear = 1;

    async function updateView(mode){
        currentYear = Number(document.querySelector('input[name="yr"]:checked')?.value || currentYear || 1);
        const { groups } = await fetchYear(currentYear);

        if(mode==="mode-per-exam"){
            const modes = computeExamModes(currentYear, groups);
            renderExamModes(currentYear, modes);
        }else{
            const clusters = clusterCalendars(currentYear, groups);
            const first = clusters[0];
            const second = clusters[1] || null;
            if(mode==="full-1"){
                renderFullAsSplit("Propuesta de Calendario Completo Más Repetida 1", currentYear, first, second);
            }else{
                renderFullAsSplit("Propuesta de Calendario Completo Más Repetida 2", currentYear, second || first, first || null);
            }
        }
    }

    function animateCounter(){
        const el = $id("total-counter");
        const start = 1;
        const end = TOTAL_RESPONSES;
        const dur = 3600;
        const t0 = performance.now();
        function step(now){
            const k = Math.min(1, (now - t0)/dur);
            const v = Math.floor(target * k);
            el.textContent = String(Math.max(start, Math.min(end, v)));
            if(k<1) requestAnimationFrame(step);
        }
        const target = end;
        requestAnimationFrame(step);
    }
    function animateBars(){
        qsa(".progress").forEach((p)=>{
            const max = Number(p.dataset.max||0);
            const target = Number(p.dataset.target||0);
            const fill = p.querySelector(".fill");
            fill.style.width = Math.max(0, Math.min(100, (100*target/max))) + "%";

            const meta = p.parentElement.querySelector(".progress-meta .current");
            if(meta){
                const dur = fill.classList.contains("slow") ? 3000 : 2000;
                const t0 = performance.now();
                function step(now){
                    const k = Math.min(1, (now - t0)/dur);
                    const v = Math.floor(target * k);
                    meta.textContent = String(v);
                    if(k<1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            }
        });
    }

    function attachUI(){
        qsa(".result-btn").forEach(btn=>{
            btn.addEventListener("click", ()=> updateView(btn.dataset.mode));
        });
        qsa('input[name="yr"]').forEach(r=>{
            r.addEventListener("change", ()=>{
                currentYear = Number(r.value);
                updateView("mode-per-exam");
            });
        });
    }

    document.addEventListener("DOMContentLoaded", ()=>{
        const el = $id("total-counter");
        if(el) el.classList.add("countup");
        animateCounter();
        animateBars();
        attachUI();
        updateView("mode-per-exam");
    });

    /* ===========================================================
       Propuesta de la Última Mesa de Diálogo (tercer botón)
       =========================================================== */
    function __presetProposalsFor(year){
        if(year===1){
            return {
                "1-BQBM-P1": "2025-11-28",
                "1-BCHM-P1": "2025-12-05",
                "1-ANAT-P1": "2025-12-10",
                "1-SPC-P1":  "2026-01-05",
                "1-EMBR-P1": "2026-01-10",
                "1-IBC1-P1": "2026-01-17",
                "1-ANAT-P2": "2026-01-24",
                "1-ISM-P1":  "2026-01-29",
                "1-BCHM-P2": "2026-02-07",
                "1-EMBR-P2": "2026-02-14",
                "1-BQBM-P2": "2026-02-21",
                "1-INF1-P1": "2026-02-27",
                "1-ANAT-P3": "2026-03-07",
                "1-BQBM-P3": "2026-03-21"
            };
        }else{
            return {
                "2-INF2-P2": "2025-11-26",
                "2-INMU-P1": "2025-11-28",
                "2-INF2-O1": "2025-12-02",
                "2-INF2-O2": "2025-12-08",
                "2-FARM-P1": "2025-12-10",
                "2-PCSV-P1": "2026-01-29",
                "2-FISIO-P1": "2026-01-10",
                "2-MICRO-P1": "2026-01-17",
                "2-IBC2-P1": "2026-01-21",
                "2-ICR-P1-PRA": "2026-02-09",
                "2-ICR-P1-TEO": "2026-02-14",
                "2-FARM-P2": "2026-02-21",
                "2-INMU-P2": "2026-02-26",
                "2-FISIO-P2": "2026-03-07",
                "2-ICR-P2-PRA": "2026-04-06",
                "2-ICR-P2-TEO": "2026-04-11",
                "2-MICRO-P2": "2026-04-13",
                "2-PCSV-P2": "2026-04-15",
                "2-INMU-P3": "2026-04-17",
                "2-FARM-P3": "2026-04-20",
                "2-FISIO-P3": "2026-04-23",
                "2-IBC2-P2": "2026-04-25",
                "2-ICR-O1-PRA": "2026-04-27",
                "2-ICR-O1-TEO": "2026-04-28",
                "2-INMU-O1": "2026-04-30",
                "2-MICRO-P3": "2026-05-02",
                "2-FARM-O1": "2026-05-06",
                "2-IBC2-O1": "2026-05-08",
                "2-FISIO-O1": "2026-05-09",
                "2-PSCV-O1": "2026-05-11",
                "2-MICRO-O1": "2026-05-13",
                "2-FARM-O2": "2026-05-16",
                "2-PSCV-O2": "2026-05-18",
                "2-FISIO-O2": "2026-05-20",
                "2-ICR-O2-PRA": "2026-05-21",
                "2-ICR-O2-TEO": "2026-05-21",
                "2-INMU-O2": "2026-05-25",
                "2-IBC2-O2": "2026-05-26",
                "2-ICR-EX-TEO": "2026-05-29",
                "2-ICR-EX-PRA": "2026-05-29",
                "2-MICRO-O2": "2026-05-30",
                "2-INMU-EX": "2026-06-01",
                "2-INF2-EX": "2026-06-02",
                "2-FARM-EX": "2026-06-04",
                "2-PSCV-EX": "2026-06-06",
                "2-IBC2-EX": "2026-06-08",
                "2-FISIO-EX": "2026-06-09"
            };
        }
    }
    function __buildPresetSupportMap(year, proposals, groups){
        const map = {};
        for(const ex of EXAMS_BY_YEAR[year]){
            const raw = proposals[ex.id];
            if(!raw) continue;
            const arr = Array.isArray(raw) ? raw : [raw];
            let c = 0;
            for(const g of groups){
                const d = g.proposals ? g.proposals[ex.id] : null;
                if(d && arr.includes(d)) c++;
            }
            map[ex.id] = { count: c };
        }
        return map;
    }
    function __showPreset(){
        try{
            const sel = document.querySelector('input[name="yr"]:checked');
            const year = sel ? Number(sel.value) : 1;
            const proposals = __presetProposalsFor(year);
            const groupsData = (typeof cache!=="undefined" && cache.get(year)?.groups) ? cache.get(year).groups : [];
            const supportMap = __buildPresetSupportMap(year, proposals, groupsData);
            const title = (year===1? "Propuesta de la Última Mesa de Diálogo (Primero)" : "Propuesta de la Última Mesa de Diálogo (Segundo)");
            renderSplit(title, year, proposals, supportMap, null);
        }catch(e){
            console.error("No se pudo mostrar la propuesta de la Última Mesa de Diálogo:", e);
        }
    }
    document.addEventListener("DOMContentLoaded", ()=>{
        const btn = document.getElementById("btn-preset3");
        if(btn){
            btn.addEventListener("click", (ev)=>{
                ev.preventDefault();
                ev.stopImmediatePropagation();
                __showPreset();
            });
        }
    });

})();
