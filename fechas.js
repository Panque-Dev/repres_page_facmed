"use strict";

/* ================= CONFIG FECHAS Y DÍAS ESPECIALES ================= */

var CAL_START_DATE = "2025-11-01";
var CAL_END_DATE   = "2026-06-30";

var VACATION_START_DATE = "2025-12-12";
var VACATION_END_DATE   = "2026-01-04";
var VACATION_SS_START   = "2026-03-29";
var VACATION_SS_END     = "2026-04-05";

// PARO
var STRIKE_START_DATE   = "2025-11-01";
var STRIKE_END_DATE     = "2025-11-18";

// CLASES SIN EVALUACIÓN
var NOEVAL_START_DATE   = "2025-11-19";
var NOEVAL_END_DATE     = "2025-11-22";

var SPECIAL_DAY_LABELS = {
    "2025-11-17": "Día de la Revolución",
    "2025-12-12": "Virgen de Guadalupe (ya no asisten los trabajadores)",
    "2025-12-24": "Nochebuena",
    "2025-12-25": "Navidad",
    "2026-01-01": "Año Nuevo",
    "2026-02-02": "Día de la Constitución"
};

var FORCED_REPROGRAM_CUTOFF = "2025-11-23";
var SELECTION_DAY           = "2025-12-02";

/* ======= Restricciones Fournier ======= */
var FOURNIER_RESTRICTIONS = {
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

var FOURNIER_REASON_TEXT =
    "Estos pueden ser los motivos por los que el Fournier está ocupado:\n\n" +
    "-aplicación de exámenes de otros grados escolares incluyendo certificaciones o exámenes profesionales.";

/* =============== EXÁMENES OFICIALES POR AÑO =============== */

var EXAMS_BY_YEAR = {
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

        { id: "2-IBC2-P1", subject: "Integración Básico Clínica II", type: "Primer parcial",   officialDate: "2025-12-11", officialTime: "09:00" },
        { id: "2-IBC2-P2", subject: "Integración Básico Clínica II", type: "Segundo parcial",  officialDate: "2026-04-25", officialTime: "14:00" },
        { id: "2-IBC2-O1", subject: "Integración Básico Clínica II", type: "Primer ordinario", officialDate: "2026-05-08", officialTime: "08:00" },
        { id: "2-IBC2-O2", subject: "Integración Básico Clínica II", type: "Segundo ordinario",officialDate: "2026-05-26", officialTime: "13:00" },
        { id: "2-IBC2-EX", subject: "Integración Básico Clínica II", type: "Extraordinario",   officialDate: "2026-06-08", officialTime: "11:00" },

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

        { id: "2-PCSV-P1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer parcial",   officialDate: "2025-11-18", officialTime: "09:00" },
        { id: "2-PCSV-P2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo parcial",  officialDate: "2026-04-15", officialTime: "15:00" },
        { id: "2-PSCV-O1", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Primer ordinario", officialDate: "2026-05-11", officialTime: "15:00" },
        { id: "2-PSCV-O2", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Segundo ordinario", officialDate: "2026-05-18", officialTime: "14:00" },
        { id: "2-PSCV-EX", subject: "Promoción de la Salud en el Ciclo de Vida", type: "Extraordinario",   officialDate: "2026-06-06", officialTime: "9:00" },

        { id: "2-MICRO-P1", subject: "Microbiología y Parasitología", type: "Primer parcial", officialDate: "2025-12-06", officialTime: "13:00" },
        { id: "2-MICRO-P2", subject: "Microbiología y Parasitología", type: "Segundo parcial", officialDate: "2026-04-13", officialTime: "15:00" },
        { id: "2-MICRO-P3", subject: "Microbiología y Parasitología", type: "Tercer parcial", officialDate: "2026-05-02", officialTime: "08:00" },
        { id: "2-MICRO-O1", subject: "Microbiología y Parasitología", type: "Primer ordinario", officialDate: "2026-05-13", officialTime: "12:00" },
        { id: "2-MICRO-O2", subject: "Microbiología y Parasitología", type: "Segundo ordinario", officialDate: "2026-05-30", officialTime: "08:00" }
    ]
};
