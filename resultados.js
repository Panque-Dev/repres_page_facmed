(function(){
    "use strict";

    // ==========================
    //     CONSTANTES GLOBALES
    // ==========================
    const DAY_NAMES = ["L","M","X","J","V","S","D"];
    const CAL_START_DATE = "2025-11-01";
    const CAL_END_DATE   = "2026-06-30";

    // Festivos sueltos (compat)
    const HOLIDAYS_SET = new Set([
        "2025-11-17",
        "2025-12-25",
        "2026-01-01",
        "2026-02-02",
        "2026-03-16",
        "2026-05-01",
        "2026-05-05"
    ]);

    // ====== BLOQUEOS (copiados de main.js) ======
    const VACATION_START_DATE = "2025-12-12";
    const VACATION_END_DATE   = "2026-01-04";
    const VACATION_SS_START   = "2026-03-29";
    const VACATION_SS_END     = "2026-04-05";

    // Paro
    const STRIKE_START_DATE   = "2025-11-01";
    const STRIKE_END_DATE     = "2025-11-18";

    // Clases sin evaluación
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

    // ==========================
    //         HELPERS
    // ==========================
    const qs  = (s, r=document)=> r.querySelector(s);
    const qsa = (s, r=document)=> Array.from(r.querySelectorAll(s));
    const $id = (id)=> document.getElementById(id);
    const iso = d => d.toISOString().slice(0,10);
    const parseDate = s => new Date(s+"T00:00:00");

    function expandRange(a,b){
        const out=[]; const d=new Date(a+"T00:00:00"); const e=new Date(b+"T00:00:00");
        while(d<=e){ out.push(iso(d)); d.setDate(d.getDate()+1); }
        return out;
    }

    // Lee bloqueos externos si existen (opcional)
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

    // Helpers de restricción por string ISO (YYYY-MM-DD)
    const isVacationStr   = s =>
        (s>=VACATION_START_DATE && s<=VACATION_END_DATE) ||
        (s>=VACATION_SS_START   && s<=VACATION_SS_END)   ||
        (FOURNIER_RESTRICTIONS[s]?.kind === "vac");

    const isStrikeStr       = s => s>=STRIKE_START_DATE && s<=STRIKE_END_DATE;
    const isNoEvaluationStr = s => s>=NOEVAL_START_DATE && s<=NOEVAL_END_DATE;
    const getRestrictionStr = s => FOURNIER_RESTRICTIONS[s] || null;

    // ==========================
    //      CATALOGO MATERIAS
    // ==========================
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

    function getSigla(subject){
        return SUBJECT_SIGLAS[subject] || { display: subject, file: "GEN" };
    }
    function hexToRgba(hex, a){
        const b = (hex||"#334155").replace("#",""); const n=parseInt(b,16);
        const r = (n>>16)&255, g=(n>>8)&255, bl=n&255;
        return `rgba(${r},${g},${bl},${a})`;
    }

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

    function colorForExam(exam){
        const disp = getSigla(exam.subject).display;
        const key = disp.replace(/\s+/g,'');
        return SUBJECT_COLORS[key] || SUBJECT_COLORS[key.toUpperCase()] || SUBJECT_COLORS[key.toLowerCase()] || "#334155";
    }

    // ==========================
    //      CATALOGO EXAMENES
    // ==========================
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
            { id: "2-FISIO-O1", subject: "Fisiología", type: "Primer ordinario", officialDate: "2026-05-12", officialTime: "08:00" },
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
            { id: "2-MICRO-P3", subject: "Microbiología y Parasitología", type: "Tercer parcial", officialDate: "2026-05-08", officialTime: "08:00" },
            { id: "2-MICRO-O1", subject: "Microbiología y Parasitología", type: "Primer ordinario", officialDate: "2026-05-20", officialTime: "08:00" },
            { id: "2-MICRO-O2", subject: "Microbiología y Parasitología", type: "Segundo ordinario", officialDate: "2026-06-03", officialTime: "08:00" },

            { id: "2-IBC2-P1", subject: "Integración Básico Clínica II", type: "Primer parcial", officialDate: "2025-12-11", officialTime: "09:00" },
            { id: "2-IBC2-O1", subject: "Integración Básico Clínica II", type: "Primer ordinario", officialDate: "2026-05-16", officialTime: "08:00" },
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

            // Placeholders para IB II (si aplica a propuestas)
            { id: "2-INF2-P1", subject: "Informática Biomédica II", type: "Primer parcial", officialDate: null, officialTime: null },
            { id: "2-INF2-P2", subject: "Informática Biomédica II", type: "Segundo parcial", officialDate: null, officialTime: null },
            { id: "2-INF2-O1", subject: "Informática Biomédica II", type: "Primer ordinario", officialDate: null, officialTime: null },
            { id: "2-INF2-O2", subject: "Informática Biomédica II", type: "Segundo ordinario", officialDate: null, officialTime: null },
            { id: "2-INF2-EX", subject: "Informática Biomédica II", type: "Extraordinario", officialDate: null, officialTime: null }
        ]
    };

    // ==========================
    //        UI HELPERS
    // ==========================
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

    // ==========================
    //        CALENDARIO
    // ==========================
    function monthList(){
        const out=[]; const s=parseDate(CAL_START_DATE), e=parseDate(CAL_END_DATE);
        let c=new Date(s.getFullYear(), s.getMonth(), 1);
        while(c<=e){ out.push({y:c.getFullYear(), m:c.getMonth()}); c.setMonth(c.getMonth()+1); }
        return out;
    }

    function buildCalendars(container){
        container.innerHTML="";
        monthList().forEach(({y,m})=>{
            const section=document.createElement("section"); section.className="month";

            const header=document.createElement("header"); header.className="month-header";
            const t=document.createElement("h3");
            t.textContent=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m]+" "+y;
            header.appendChild(t); section.appendChild(header);

            const grid=document.createElement("div"); grid.className="month-grid";
            DAY_NAMES.forEach(d=>{ const el=document.createElement("div"); el.className="day-name"; el.textContent=d; grid.appendChild(el); });

            const first=new Date(y,m,1), last=new Date(y,m+1,0);
            let start=first.getDay(); if(start===0) start=7;
            for(let i=1;i<start;i++){ const empty=document.createElement("div"); empty.className="day-cell empty"; grid.appendChild(empty); }
            for(let d=1; d<=last.getDate(); d++){
                const cell=document.createElement("div"); cell.className="day-cell";
                const head=document.createElement("div"); head.className="day-header";
                const num=document.createElement("div"); num.className="day-number"; num.textContent=d;
                head.appendChild(num); cell.appendChild(head);
                const list=document.createElement("div"); list.className="exam-list"; cell.appendChild(list);
                grid.appendChild(cell);
            }
            section.appendChild(grid);
            applyCalendarBlocks(section, y, m);
            container.appendChild(section);
        });
    }

    function applyCalendarBlocks(section, y, m){
        const custom = getCustomBlocks();
        const grid = section.querySelector(".month-grid");
        const first = new Date(y,m,1), last = new Date(y,m+1,0);
        let start=first.getDay(); if(start===0) start=7; // lunes a domingo
        const base = 7 + (start - 1);

        for(let d=1; d<=last.getDate(); d++){
            const cell = grid.children[base + (d-1)];
            const dt = new Date(y, m, d);
            const k = iso(dt);
            const dow = dt.getDay();

            // header y meta
            const head = cell.querySelector(".day-header") || (()=> {
                const h=document.createElement("div"); h.className="day-header";
                const num=document.createElement("div"); num.className="day-number"; num.textContent=d;
                h.appendChild(num); cell.prepend(h); return h;
            })();
            let meta = head.querySelector(".day-meta");
            if(!meta){ meta = document.createElement("span"); meta.className="day-meta"; head.appendChild(meta); }

            // limpiar marcas previas
            cell.classList.remove("blocked","blocked-weekend","blocked-holiday","blocked-fournier","blocked-custom","vacation","weekend");
            head.classList.remove("is-blocked");
            delete cell.dataset.blockLabel;

            // domingo como fin de semana
            if(dow===0){ cell.classList.add("weekend"); }

            // restricciones fournier y periodos especiales
            const fr = getRestrictionStr(k);
            if(isVacationStr(k)) cell.classList.add("vacation");
            if(isStrikeStr(k))   cell.classList.add("vacation");
            if(isNoEvaluationStr(k)) cell.classList.add("vacation");
            if(fr && fr.kind==="blocked") cell.classList.add("vacation");

            // bloqueos personalizados (si existieran)
            if(custom.dates.has(k)){
                const label = custom.labels.get(k) || "custom";
                cell.classList.add("blocked", label==="fournier" ? "blocked-fournier" : "blocked-custom");
                cell.dataset.blockLabel = label;
                head.classList.add("is-blocked");
            }

            // festivos sueltos previos
            if(HOLIDAYS_SET && HOLIDAYS_SET.has(k)){
                cell.classList.add("vacation");
                head.classList.add("is-blocked");
            }

            // textos meta
            if(k===CAL_START_DATE)        meta.textContent="Inicio";
            else if(k===CAL_END_DATE)     meta.textContent="Fin";
            else if(fr && fr.kind==="blocked")      meta.textContent="Fournier ocupado";
            else if(fr && fr.kind==="partial_after")meta.textContent=`Fournier desde ${fr.freeFrom||"15:00"}`;
            else if(fr && fr.kind==="partial_until")meta.textContent=`Fournier hasta ${fr.freeUntil||"16:00"}`;
            else if(isStrikeStr(k))       meta.textContent="Paro";
            else if(isNoEvaluationStr(k)) meta.textContent="Clases sin evaluación";
            else if(isVacationStr(k))     meta.textContent="Vacaciones";
            else if(dow===0)              meta.textContent="Fin de semana";
            if(SPECIAL_DAY_LABELS[k])     meta.textContent = SPECIAL_DAY_LABELS[k];
        }
    }

    function monthIndexFromStart(d){
        const s = parseDate(CAL_START_DATE);
        return (d.getFullYear()-s.getFullYear())*12 + d.getMonth()-s.getMonth();
    }

    function placeCard(isoStr, card, container){
        if(!isoStr) return;
        const d=parseDate(isoStr);
        const idx = monthIndexFromStart(d);
        const months = container.querySelectorAll(".month");
        const month = months[idx];
        if(!month) return;
        const grid = month.querySelector(".month-grid");
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        let start=first.getDay(); if(start===0) start=7;
        const index = 7 + (d.getDate() + start - 2);
        const cell = grid.children[index];
        if(!cell) return;
        const list = cell.querySelector(".exam-list") || cell;
        list.appendChild(card);
    }

    function placeGhost(isoStr, card, container){ placeCard(isoStr, card, container); }

    // ==========================
    //       DATOS REMOTOS
    // ==========================
    const cache = new Map();

    async function fetchYear(year){
        if(cache.has(year)) return cache.get(year);
        try{
            const res = await fetch(`/.netlify/functions/proposals-list?year=${year}`);
            if(!res.ok) throw new Error("HTTP "+res.status);
            const json = await res.json();
            cache.set(year, json);
            localStorage.setItem("SNAPSHOT::"+year, JSON.stringify(json));
            return json;
        }catch(e){
            const raw = localStorage.getItem("SNAPSHOT::"+year);
            if(raw){
                const json = JSON.parse(raw);
                cache.set(year, json);
                console.warn("Usando snapshot local de resultados:", e?.message||e);
                return json;
            }
            throw e;
        }
    }

    // ==========================
    //       CÁLCULOS MODA
    // ==========================
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
            const k = canonicalKeyFor(year, g.proposals||{});
            if(!clusters.has(k)) clusters.set(k, []);
            clusters.get(k).push(g.group_id);
        }
        const arr = Array.from(clusters.entries()).map(([k, gids])=>({ key:k, groups:gids }));
        arr.sort((a,b)=> b.groups.length - a.groups.length);
        return arr;
    }

    // ==========================
    //         RENDER
    // ==========================
    function buildResultsForYear(container, year, groups){
        container.innerHTML="";

        // Encabezado por moda
        const header1 = document.createElement("h2");
        header1.textContent = "Propuesta por Moda por Examen";
        container.appendChild(header1);

        const calendar1 = document.createElement("div"); calendar1.className="calendar";
        buildCalendars(calendar1);
        container.appendChild(calendar1);

        const modes = computeExamModes(year, groups);
        const list1 = document.createElement("div"); list1.className="result-list";
        modes.forEach(({exam, date, voters})=>{
            const card=createResultCard(exam, { suggestionDate: date, voters, support: { count: voters.length, total: groups.length } });
            list1.appendChild(card);
            if(date) placeCard(date, createResultCard(exam, { suggestionDate: date, voters }), calendar1);
        });
        container.appendChild(list1);

        // Calendarios completos más repetidos
        const header2 = document.createElement("h2");
        header2.textContent = "Calendarios Completos más Repetidos";
        container.appendChild(header2);

        const clusters = clusterCalendars(year, groups);
        const top = clusters.slice(0, 3);

        top.forEach(({key, groups: gids}, idx)=>{
            const calWrap = document.createElement("div");
            calWrap.className = "calendar";
            buildCalendars(calWrap);
            container.appendChild(calWrap);

            const proposal = {};
            (EXAMS_BY_YEAR[year]||[]).forEach(ex=>{
                const frag = key.split("|").find(s=> s.startsWith(ex.id+":"));
                const date = frag ? frag.split(":")[1] : ex.officialDate;
                proposal[ex.id]=date;
                if(date) placeCard(date, createGhostCard(ex), calWrap);
            });

            const title = document.createElement("h3");
            title.textContent = `Propuesta #${idx+1} — Grupos: ${gids.sort((a,b)=>a-b).join(", ")}`;
            container.appendChild(title);

            const list = document.createElement("div");
            list.className = "result-list";
            (EXAMS_BY_YEAR[year]||[]).forEach(ex=>{
                const date = proposal[ex.id] || ex.officialDate;
                const card = createResultCard(ex, { suggestionDate: date });
                list.appendChild(card);
            });
            container.appendChild(list);
        });
    }

    async function main(){
        const container =
            $id("results-root") ||
            $id("root") ||
            qs("[data-results-root]") ||
            document.body;

        try{
            const year1 = await fetchYear(1);
            const year2 = await fetchYear(2);

            const sec1 = document.createElement("section");
            sec1.className="results-year";
            const h1 = document.createElement("h1");
            h1.textContent = "Resultados — Primero";
            sec1.appendChild(h1);
            const root1 = document.createElement("div");
            root1.className="results-wrap";
            sec1.appendChild(root1);
            container.appendChild(sec1);

            const sec2 = document.createElement("section");
            sec2.className="results-year";
            const h2 = document.createElement("h1");
            h2.textContent = "Resultados — Segundo";
            sec2.appendChild(h2);
            const root2 = document.createElement("div");
            root2.className="results-wrap";
            sec2.appendChild(root2);
            container.appendChild(sec2);

            buildResultsForYear(root1, 1, year1.groups||[]);
            buildResultsForYear(root2, 2, year2.groups||[]);
        }catch(e){
            container.innerHTML = `<div class="error">No se pudieron cargar los resultados. ${e?.message||e}</div>`;
            console.error(e);
        }
    }

    document.addEventListener("DOMContentLoaded", main);
})();
