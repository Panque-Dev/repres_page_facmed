(function(){
  "use strict";

  // ===== Ajustes visibles =====
  const TOTAL_RESPONSES = 180;
  const BAR_CONFIG = [
    { max: 82, target: 71 }, // primero
    { max: 65, target: 58 }  // segundo
  ];

  // ===== Calendario base =====
  const DAY_NAMES = ["L","M","X","J","V","S","D"];
  const CAL_START_DATE = "2025-11-01";
  const CAL_END_DATE   = "2026-06-30";

  // Materias abreviadas e íconos ya usados en el proyecto
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
    FIS:"#F44F32", FAR:"#DA74B8", INM:"#A84DDA", MyP:"#A89C1C", ICR:"#1D98A8", PCV:"#8E004F"
  };

  // Catálogo de exámenes por año (fechas fieles al principal)
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

            { id: "1-INF1-P1", subject: "Informática Biomédica I", type: "Primer parcial", officialDate: "2026-02-13", officialTime: "09:00" },
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
            { id: "1-SPC-P2", subject: "Salud Pública y Comunidad", type: "Segundo parcial", officialDate: "2026-04-10", officialTime: "09:00" },
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

            /* ===== NUEVO: Integración Básico Clínica II (IBC 2) ===== */
            { id: "2-IBC2-P1", subject: "Integración Básico Clínica II", type: "Primer parcial",   officialDate: "2025-12-11", officialTime: "09:00" },
            { id: "2-IBC2-P2", subject: "Integración Básico Clínica II", type: "Segundo parcial",  officialDate: "2026-04-25", officialTime: "14:00" },
            { id: "2-IBC2-O1", subject: "Integración Básico Clínica II", type: "Primer ordinario", officialDate: "2026-05-08", officialTime: "08:00" },
            { id: "2-IBC2-O2", subject: "Integración Básico Clínica II", type: "Segundo ordinario",officialDate: "2026-05-26", officialTime: "13:00" },
            { id: "2-IBC2-EX", subject: "Integración Básico Clínica II", type: "Extraordinario",   officialDate: "2026-06-08", officialTime: "11:00" },

            /* ===== Intro Cirugía (fechas oficiales) ===== */
            { id: "2-ICR-P1-TEO", subject: "Introducción a la Cirugía", type: "PAR 1 (TEO)", officialDate: "2026-01-10", officialTime: "08:00" },
            { id: "2-ICR-P1-PRA", subject: "Introducción a la Cirugía", type: "PAR 1 (PRA)", officialDate: "2026-01-12", officialTime: "08:00",
                multiStart: "2026-01-12", multiEnd: "2026-01-16" },

            { id: "2-ICR-P2-TEO", subject: "Introducción a la Cirugía", type: "PAR 2 (TEO)", officialDate: "2026-04-11", officialTime: "08:00" },
            { id: "2-ICR-P2-PRA", subject: "Introducción a la Cirugía", type: "PAR 2 (PRA)", officialDate: "2026-04-06", officialTime: "08:00",
                multiStart: "2026-04-06", multiEnd: "2026-04-10" },

            { id: "2-ICR-O1-PRA", subject: "Introducción a la Cirugía", type: "ORD 1 (PRA)", officialDate: "2026-04-27", officialTime: "13:00" },
            { id: "2-ICR-O1-TEO", subject: "Introducción a la Cirugía", type: "ORD 1 (TEO)", officialDate: "2026-04-28", officialTime: "13:00" },

            { id: "2-ICR-O2-PRA", subject: "Introducción a la Cirugía", type: "ORD 2 (PRA)", officialDate: "2026-05-21", officialTime: "12:00" },
            { id: "2-ICR-O2-TEO", subject: "Introducción a la Cirugía", type: "ORD 2 (TEO)", officialDate: "2026-05-21", officialTime: "12:00" },

            { id: "2-ICR-EX-TEO", subject: "Introducción a la Cirugía", type: "EXT 1 (TEO)", officialDate: "2026-05-29", officialTime: "08:00" },
            { id: "2-ICR-EX-PRA", subject: "Introducción a la Cirugía", type: "EXT 1 (PRA)", officialDate: "2026-05-29", officialTime: "08:00" },

            /* ===== Promo ===== */
            { id: "2-PCSV-P1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer parcial",   officialDate: "2025-11-18", officialTime: "09:00" },
            { id: "2-PCSV-P2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo parcial",  officialDate: "2026-04-15", officialTime: "15:00" },
            { id: "2-PSCV-O1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer ordinario", officialDate: "2026-05-11", officialTime: "15:00" },
            { id: "2-PSCV-O2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo ordinario",officialDate: "2026-05-18", officialTime: "14:00" },
            { id: "2-PSCV-EX", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Extraordinario",   officialDate: "2026-06-06", officialTime: "9:00" },

            /* Micro */
            { id: "2-MICRO-P1", subject: "Microbiología y Parasitología", type: "Primer parcial", officialDate: "2025-12-06", officialTime: "13:00" },
            { id: "2-MICRO-P2", subject: "Microbiología y Parasitología", type: "Segundo parcial", officialDate: "2026-04-13", officialTime: "15:00" },
            { id: "2-MICRO-P3", subject: "Microbiología y Parasitología", type: "Primer ordinario", officialDate: "2026-05-02", officialTime: "08:00" },
            { id: "2-MICRO-O1", subject: "Microbiología y Parasitología", type: "Segundo ordinario", officialDate: "2026-05-13", officialTime: "12:00" },
            { id: "2-MICRO-O2", subject: "Microbiología y Parasitología", type: "Extraordinario", officialDate: "2026-05-30", officialTime: "08:00" },
        ]
    };

  // ===== Meta de calendario (festividades, paro, Fournier, etc.) =====
  const VACATION_START_DATE = "2025-12-12";
  const VACATION_END_DATE   = "2026-01-04";
  const VACATION_SS_START   = "2026-03-29";
  const VACATION_SS_END     = "2026-04-05";

  const STRIKE_START_DATE   = "2025-11-01";
  const STRIKE_END_DATE     = "2025-11-18";

  const NOEVAL_START_DATE   = "2025-11-19";
  const NOEVAL_END_DATE     = "2025-11-22";

  const SPECIAL_DAY_LABELS = {
      "2025-11-17": "Día de la Revolución",
      "2025-12-12": "Virgen de Guadalupe (ya no asisten los trabajadores)",
      "2025-12-24": "Nochebuena",
      "2025-12-25": "Navidad",
      "2026-01-01": "Año Nuevo",
      "2026-02-02": "Día de la Constitución",
  };

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
      "2026-04-30": { kind: "blocked" },
  };

  const FOURNIER_REASON_TEXT =
      "Estos pueden ser los motivos por los que el Fournier está ocupado:\n\n" +
      "-aplicación de exámenes de otros grados escolares incluyendo certificaciones o exámenes profesionales.";

  // ===== Helpers =====
  const $id = (s)=> document.getElementById(s);
  const qs  = (s, r=document)=> r.querySelector(s);
  const qsa = (s, r=document)=> Array.from(r.querySelectorAll(s));
  const parseDate = (s)=>{ const p=s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); };
  const formatDate = (y,m,d)=> y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
  const formatShort = (s)=>{ const p=s.split("-"); return p[2]+"/"+p[1]+"/"+p[0].slice(2); };
  function hexToRgba(hex, a){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(!m) return `rgba(56,189,248,${a})`;
    const r = parseInt(m[1],16), g=parseInt(m[2],16), b=parseInt(m[3],16);
    return `rgba(${r},${g},${b},${a})`;
  }

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
  function getSigla(sub){ return SUBJECT_SIGLAS[sub] || {display:sub.split(" ").map(w=>w[0]).join("").slice(0,3).toUpperCase(), file:"GEN"}; }
  function colorForExam(exam){
    const sig = getSigla(exam.subject).display;
    const key = sig.replace(/\s+/g,"");
    return SUBJECT_COLORS[sig] || SUBJECT_COLORS[key] || "#38bdf8";
  }

  function makeSupportBar(value, max, color){
    const wrap = document.createElement("div");
    wrap.className = "mini-support";
    if(color){ wrap.style.setProperty('--bar-color', color); }
    const fill = document.createElement("div");
    fill.className = "fill";
    wrap.appendChild(fill);
    requestAnimationFrame(()=>{
      const pct = max ? Math.max(0, Math.min(100, 100*value/max)) : 0;
      fill.style.width = pct + "%";
    });
    return wrap;
  }

  
  // ===== Result helpers for winner cards =====
  const EXAM_ORDER = [
    "Primer parcial","Segundo parcial","Tercer parcial","Cuarto parcial",
    "Primer ordinario","Segundo ordinario","Extraordinario"
  ];
  const examIdToObj = {};
  const subjectChains = { 1: {}, 2: {} };

  function buildResultIndices(){
    [1,2].forEach(yr=>{
      const bySubject = {};
      (EXAMS_BY_YEAR[yr]||[]).forEach(ex=>{
        examIdToObj[ex.id] = ex;
        (bySubject[ex.subject] ||= []).push(ex);
      });
      Object.keys(bySubject).forEach(sub=>{
        bySubject[sub].sort((a,b)=>{
          const t = EXAM_ORDER.indexOf(a.type) - EXAM_ORDER.indexOf(b.type);
          if(t!==0) return t;
          return (a.officialDate||'').localeCompare(b.officialDate||'');
        });
        subjectChains[yr][sub] = bySubject[sub].map(e=>e.id);
      });
    });
  }
  buildResultIndices();

  function diffDays(a,b){
    if(!a||!b) return null;
    const A = parseDate(a), B = parseDate(b);
    return Math.round(Math.abs(B-A)/86400000);
  }
  function dateForExamInMap(examId, proposalsMap){
    const ex = examIdToObj[examId];
    if(!ex) return null;
    return (proposalsMap && proposalsMap[examId]) || ex.officialDate || null;
  }
  function nearestBeforeFromMap(year, base, thisExamId, proposalsMap){
    if(!base) return null;
    let best=null;
    const list = EXAMS_BY_YEAR[year] || [];
    for(const ex of list){
      if(ex.id===thisExamId) continue;
      const d = dateForExamInMap(ex.id, proposalsMap);
      if(!d) continue;
      if(d<base){
        const dd = diffDays(d, base);
        if(best==null || dd<best) best = dd;
      }
    }
    return best;
  }
  function nearestAfterFromMap(year, base, thisExamId, proposalsMap){
    if(!base) return null;
    let best=null;
    const list = EXAMS_BY_YEAR[year] || [];
    for(const ex of list){
      if(ex.id===thisExamId) continue;
      const d = dateForExamInMap(ex.id, proposalsMap);
      if(!d) continue;
      if(d>base){
        const dd = diffDays(base, d);
        if(best==null || dd<best) best = dd;
      }
    }
    return best;
  }
  function weeksToNextSameResult(year, examId, proposalsMap){
    const ex = examIdToObj[examId]; if(!ex) return null;
    const chain = (subjectChains[year]||{})[ex.subject] || [];
    const idx = chain.indexOf(examId);
    if(idx===-1 || idx===chain.length-1) return null;
    const nextId = chain[idx+1]; const next = examIdToObj[nextId]; if(!next) return null;
    const from = dateForExamInMap(examId, proposalsMap);
    const to   = dateForExamInMap(nextId, proposalsMap);
    if(!from || !to) return null;
    return Math.round((diffDays(from, to)/7)*10)/10;
  }
  function lineRow(label, value){
    const row=document.createElement("div"); row.className="exam-line";
    const l=document.createElement("span"); l.className="line-label"; l.textContent=label;
    const v=document.createElement("span"); v.className="line-value"; v.textContent=value;
    row.appendChild(l); row.appendChild(v); return row;
  }
// ===== UI Builders =====
  function lineStacked(label, value){
    const row=document.createElement("div"); row.className="exam-line stacked";
    const l=document.createElement("span"); l.className="line-label"; l.textContent=label;
    const v=document.createElement("span"); v.className="line-value"; v.textContent=value;
    row.appendChild(l); row.appendChild(v); return row;
  }
  
  function createResultCard(exam, opts={}){
    const { approvedDate, suggestionDate, voters=[], proposalsMap=null } = opts;
    const sig=getSigla(exam.subject); const badge=shortType(exam.type);

    const moved = !!suggestionDate && suggestionDate !== exam.officialDate;

    const card=document.createElement("div");
    card.className="exam-card " + (moved ? "status-valid" : "status-original");
    const __col = colorForExam(exam);
    card.style.setProperty('--card-bg', hexToRgba(__col, .30));
    card.style.setProperty('--card-strip', hexToRgba(__col, .95));
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

    // líneas principales
    const appText = formatShort(approvedDate || exam.officialDate);
    const sugText = formatShort(suggestionDate || exam.officialDate);
    card.appendChild(lineStacked("última fecha aprobada:", appText));
    card.appendChild(lineStacked("sugerencia de reprogramación:", sugText));

    // métricas relativas según mapa de propuestas ganadoras
    const baseDate = suggestionDate || exam.officialDate;
    const prevDays = nearestBeforeFromMap(currentYear, baseDate, exam.id, proposalsMap);
    const nextDays = nearestAfterFromMap(currentYear, baseDate, exam.id, proposalsMap);
    const weeks    = weeksToNextSameResult(currentYear, exam.id, proposalsMap);

    card.appendChild(lineRow("Último departamental según votos:", prevDays != null ? (prevDays + " días atrás") : "—"));
    card.appendChild(lineRow("Próximo departamental según votos:", nextDays != null ? (nextDays + " días") : "—"));
    card.appendChild(lineRow("Semanas para cubrir la siguiente unidad:", weeks != null ? (weeks + " semanas") : "—"));

    if(voters && voters.length){
      const box=document.createElement("div");
      box.className="card-groups";
      box.textContent = "Votaron: " + voters.slice().sort((a,b)=>a-b).join(", ");
      card.appendChild(box);
    }

    return card;
  }

  function createGhostCard(exam, voters=[]){
    const sig=getSigla(exam.subject); const badge=shortType(exam.type);
    const card=document.createElement("div"); card.className="exam-card is-ghost ghost-min"; card.draggable=false;
    const __col = colorForExam(exam);
    card.style.setProperty('--card-bg', hexToRgba(__col, .14));
    card.style.setProperty('--card-strip', hexToRgba(__col, .6));
    const head=document.createElement("div"); head.className="exam-head2";
    const icon=document.createElement("div"); icon.className="exam-icon-vert";
    const img=document.createElement("img"); img.alt=sig.display; img.src="img/"+sig.file+".png";
    icon.appendChild(img); head.appendChild(icon);
    const title=document.createElement("div"); title.className="exam-title";
    const sigla=document.createElement("div"); sigla.className="exam-sigla"; sigla.textContent=sig.display; sigla.title=exam.subject;
    const badgeEl=document.createElement("div"); badgeEl.className="exam-badge"; badgeEl.textContent=badge.badge; badgeEl.title=badge.meaning;
    title.appendChild(sigla); title.appendChild(badgeEl); head.appendChild(title); card.appendChild(head);
    if(voters && voters.length){
      const box=document.createElement("div");
      box.className="card-groups";
      box.textContent = "Diferencia de: " + voters.sort((a,b)=>a-b).join(", ");
      card.appendChild(box);
    }
    return card;
  }

  // ===== Calendario =====
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
      DAY_NAMES.forEach(d=>{ const dn=document.createElement("div"); dn.className="day-name"; dn.textContent=d; grid.appendChild(dn); });

      const startIndex=((new Date(y,m,1)).getDay()+6)%7;
      for(let i=0;i<startIndex;i++){ const e=document.createElement("div"); e.className="day-cell empty"; grid.appendChild(e); }

      const last=new Date(y,m+1,0).getDate();
      for(let d=1; d<=last; d++){
        const ds=formatDate(y,m+1,d);
        const cell=document.createElement("div"); cell.className="day-cell"; cell.dataset.date=ds;
        const dow=parseDate(ds).getDay(); if(dow===0) cell.classList.add("weekend");
        if((ds>=VACATION_START_DATE && ds<=VACATION_END_DATE) || (ds>=VACATION_SS_START && ds<=VACATION_SS_END)) cell.classList.add("vacation");
        if(ds>=STRIKE_START_DATE && ds<=STRIKE_END_DATE)   cell.classList.add("vacation");
        const fr=FOURNIER_RESTRICTIONS[ds]; if(fr && fr.kind==="blocked") cell.classList.add("vacation");

        const hdr=document.createElement("div"); hdr.className="day-header";
        const n=document.createElement("span"); n.className="day-number"; n.textContent=String(d);
        const meta=document.createElement("span"); meta.className="day-meta";

        if(ds===CAL_START_DATE) meta.textContent="Inicio";
        else if(ds===CAL_END_DATE) meta.textContent="Fin";
        else if(fr && fr.kind==="blocked") meta.textContent="Fournier ocupado";
        else if(fr && fr.kind==="partial_after") meta.textContent="Fournier desde "+(fr.freeFrom||"15:00");
        else if(fr && fr.kind==="partial_until") meta.textContent="Fournier hasta "+(fr.freeUntil||"16:00");
        else if(ds>=STRIKE_START_DATE && ds<=STRIKE_END_DATE) meta.textContent = "Paro";
        else if(ds>=NOEVAL_START_DATE && ds<=NOEVAL_END_DATE) meta.textContent = "Clases sin evaluación";
        else if((ds>=VACATION_START_DATE && ds<=VACATION_END_DATE) || (ds>=VACATION_SS_START && ds<=VACATION_SS_END)) meta.textContent="Vacaciones";
        else if(dow===0) meta.textContent="Fin de semana";
        else if(SPECIAL_DAY_LABELS[ds]) meta.textContent = SPECIAL_DAY_LABELS[ds];
        else meta.textContent = "Fournier libre";

        hdr.appendChild(n); hdr.appendChild(meta); cell.appendChild(hdr);
        const ghost=document.createElement("div"); ghost.className="ghost-date"; cell.appendChild(ghost);
        const list=document.createElement("div"); list.className="exam-list"; cell.appendChild(list);
        grid.appendChild(cell);
      }
      section.appendChild(grid); container.appendChild(section);
    });
  }
  function placeCard(dateStr, card, container){
    const cell = container.querySelector('.day-cell[data-date="'+dateStr+'"]');
    if(cell){ cell.querySelector(".exam-list").appendChild(card); }
  }
  function placeGhost(dateStr, ghost, container){
    const cell = container.querySelector('.day-cell[data-date="'+dateStr+'"]');
    if(cell){ cell.querySelector(".ghost-date").appendChild(ghost); }
  }

  // ===== Datos desde Netlify =====
  const cache = new Map(); // year -> { groups:[{group_id, proposals:{id:date}}] }
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

  // ===== Cómputos =====
  function computeExamModes(year, groups){
    const results = [];
    for(const exam of EXAMS_BY_YEAR[year]){
      const counter = new Map(); // date -> array groups
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
    const ids = EXAMS_BY_YEAR[year].map(e=>e.id).sort();
    return ids.map(id => id + ":" + (proposals[id]||"")).join("|");
  }
  function clusterCalendars(year, groups){
    const clusters = new Map(); // key -> { groups:[], proposals:{} }
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

  // ===== Render =====
  
  function renderExamModes(year, modes){
    const split = $id("moda-split");
    const list  = $id("moda-cards");
    const cal   = $id("moda-calendar");

    $id("calendar-wrap").classList.add("hide");
    $id("results-title").textContent = "Propuesta por Moda por Examen";
    list.innerHTML = "";

    const totalGroups = (cache.get(year)?.groups || []).length;

    // mapa de propuestas ganadoras por examen
    const modaMap = {};
    for(const m of modes){
      if(m && m.exam && m.date) modaMap[m.exam.id] = m.date;
    }

    const sortedModes = modes.slice().sort((a,b)=>{
      if(a.date !== b.date) return a.date.localeCompare(b.date);
      if(a.exam.subject !== b.exam.subject) return a.exam.subject.localeCompare(b.exam.subject);
      return a.exam.id.localeCompare(b.exam.id);
    });

    for(const r of sortedModes){
      const card = createResultCard(r.exam, {
        approvedDate: r.exam.officialDate,
        suggestionDate: r.date,
        voters: r.voters || [],
        proposalsMap: modaMap
      });

      const holder = document.createElement("div");
      holder.className = "stat-card";
      holder.appendChild(card);

      if(totalGroups > 0){
        const col = colorForExam(r.exam);
        const bar = makeSupportBar((r.voters ? r.voters.length : 0), totalGroups, hexToRgba(col, .95));
        const cap = document.createElement("div");
        cap.className = "support-caption";
        cap.textContent = `${r.voters ? r.voters.length : 0} de ${totalGroups} grupos (${Math.round(100 * (r.voters ? r.voters.length : 0) / totalGroups)}%)`;
        holder.appendChild(bar);
        holder.appendChild(cap);
      }
      list.appendChild(holder);
    }

    // calendario lateral con mini-tarjetas fantasma
    cal.innerHTML = "";
    buildCalendars(cal);
    for(const r of modes){
      const d = r.date || r.exam.officialDate;
      if(!d) continue;
      const small = createGhostCard(r.exam, r.voters || []);
      placeCard(d, small, cal);
    }
    split.classList.remove("hide");
  }


  function renderFullCalendar(year, cluster, altCluster){
    const calRoot = $id("results-calendar");
    buildCalendars(calRoot);

    // ganadores sólidos
    for(const ex of EXAMS_BY_YEAR[year]){
      const d = cluster.proposals[ex.id] || ex.officialDate;
      if(!d) continue;
      const card = createResultCard(ex, { approvedDate: ex.officialDate, suggestionDate: d, proposalsMap: cluster.proposals });
      placeCard(d, card, calRoot);
    }
    // diferencias en fantasma si hay segundo cluster
    if(altCluster){
      for(const ex of EXAMS_BY_YEAR[year]){
        const d1 = cluster.proposals[ex.id];
        const d2 = altCluster.proposals[ex.id];
        if(d2 && d1 && d2!==d1){
          const ghost = createGhostCard(ex, altCluster.groups);
          placeGhost(d2, ghost, calRoot);
        }
      }
    }

    // similitudes
    const panel = $id("similarity-panel");
    const list = $id("similarity-list");
    const legend = $id("similarity-legend-90");
    list.innerHTML="";
    const groupsData = cache.get(year)?.groups || [];
    const all = groupsData.map(g=>({ gid: g.group_id, pct: similarityTo(year, cluster.proposals, g.proposals||{}) }));
    all.sort((a,b)=> b.pct - a.pct || a.gid - b.gid);
    legend.textContent = String(all.filter(x=>x.pct>=90).length);
    for(const it of all){
      const row = document.createElement("div");
      row.className = "sim-item";
      row.innerHTML = `<span class="gid">${it.gid}</span><span class="pct">${it.pct}%</span>`;
      row.style.setProperty('--fill', it.pct + '%');
      list.appendChild(row);
    }
    panel.classList.remove("hide");

    // resumen de apoyo
    const calWrap = $id("calendar-wrap");
    let sup = qs("#cluster-support");
    if(!sup){
      sup = document.createElement("div");
      sup.id = "cluster-support";
      sup.className = "bar-card";
      calWrap.insertBefore(sup, calWrap.firstChild);
    }
    sup.innerHTML = "";
    const totalGroups = groupsData.length;
    const suppTitle = document.createElement("div");
    suppTitle.className = "bar-title";
    const count = (cluster && cluster.groups) ? cluster.groups.length : 0;
    const pct = totalGroups ? Math.round(100*count/totalGroups) : 0;
    suppTitle.textContent = `Apoyo total a esta propuesta: ${count} de ${totalGroups} grupos (${pct}%)`;
    const bar2 = (function(){ const w=document.createElement('div'); w.className='mini-support'; const f=document.createElement('div'); f.className='fill'; w.appendChild(f); requestAnimationFrame(()=>{ f.style.width = (totalGroups? (100*count/totalGroups):0) + '%'; }); return w; })();
    sup.appendChild(suppTitle);
    sup.appendChild(bar2);

    $id("moda-split").classList.add("hide");
    $id("calendar-wrap").classList.remove("hide");
  }

  // ===== Interacciones =====
  let currentYear = 1;
  async function updateView(mode){
    const { groups } = await fetchYear(currentYear);

    if(mode==="mode-per-exam"){
      const modes = computeExamModes(currentYear, groups);
      renderExamModes(currentYear, modes);
    }else{
      const clusters = clusterCalendars(currentYear, groups);
      const first = clusters[0];
      const second = clusters[1] || null;
      if(mode==="full-1"){
        $id("results-title").textContent = "Propuesta de Calendario Completo Más Repetida 1";
        renderFullCalendar(currentYear, first, second);
      }else{
        $id("results-title").textContent = "Propuesta de Calendario Completo Más Repetida 2";
        renderFullCalendar(currentYear, second || first, first || null);
      }
    }
  }

  function animateCounter(){
    const el = $id("total-counter");
    const start = 1;
    const end = TOTAL_RESPONSES;
    const dur = 1200;
    const t0 = performance.now();
    function step(now){
      const k = Math.min(1, (now - t0)/dur);
      const val = Math.floor(start + (end - start) * k);
      el.textContent = String(val);
      if(k<1) requestAnimationFrame(step);
    }
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

  // ===== Init =====
  document.addEventListener("DOMContentLoaded", ()=>{
    animateCounter();
    animateBars();
    attachUI();
    updateView("mode-per-exam");
  });

})();
