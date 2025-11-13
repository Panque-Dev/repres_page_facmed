(function () {
    "use strict";

    const STORAGE_KEY = "deptScheduler.v1";

    const YEAR1_RANGE = {
        min: 1101,
        max: 1170
    };
    const YEAR2_RANGE = {
        min: 2201,
        max: 2270
    };

    const CAL_START_DATE = "2025-11-01";
    const CAL_END_DATE = "2026-06-30";
    const VACATION_START_DATE = "2025-12-12";
    const VACATION_END_DATE = "2026-01-04";
    const FORCED_REPROGRAM_CUTOFF = "2025-11-25";

    const DAY_NAMES = ["L", "M", "X", "J", "V", "S", "D"];
    const MONTH_NAMES = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const EXAM_ORDER = [
        "Primer parcial",
        "Segundo parcial",
        "Tercer parcial",
        "Cuarto parcial",
        "Primer ordinario",
        "Segundo ordinario",
        "Extraordinario"
    ];

    const EXAMS_BY_YEAR = {
        1: [
            // ANATOMÍA
            {
                id: "1-ANAT-P1",
                subject: "Anatomía",
                type: "Primer parcial",
                officialDate: "2025-10-25",
                officialTime: "10:30"
            },
            {
                id: "1-ANAT-P2",
                subject: "Anatomía",
                type: "Segundo parcial",
                officialDate: "2025-11-29",
                officialTime: "08:00"
            },
            {
                id: "1-ANAT-P3",
                subject: "Anatomía",
                type: "Tercer parcial",
                officialDate: "2026-02-28",
                officialTime: "08:00"
            },
            {
                id: "1-ANAT-P4",
                subject: "Anatomía",
                type: "Cuarto parcial",
                officialDate: "2026-04-25",
                officialTime: "08:00"
            },
            {
                id: "1-ANAT-O1",
                subject: "Anatomía",
                type: "Primer ordinario",
                officialDate: "2026-05-04",
                officialTime: "08:00"
            },
            {
                id: "1-ANAT-O2",
                subject: "Anatomía",
                type: "Segundo ordinario",
                officialDate: "2026-05-18",
                officialTime: "08:00"
            },
            {
                id: "1-ANAT-EX",
                subject: "Anatomía",
                type: "Extraordinario",
                officialDate: "2026-06-03",
                officialTime: "08:00"
            },

            // BIOQUÍMICA Y BIOLOGÍA MOLECULAR
            {
                id: "1-BQBM-P1",
                subject: "Bioquímica y Biología Molecular",
                type: "Primer parcial",
                officialDate: "2025-10-18",
                officialTime: "10:30"
            },
            {
                id: "1-BQBM-P2",
                subject: "Bioquímica y Biología Molecular",
                type: "Segundo parcial",
                officialDate: "2025-12-06",
                officialTime: "08:00"
            },
            {
                id: "1-BQBM-P3",
                subject: "Bioquímica y Biología Molecular",
                type: "Tercer parcial",
                officialDate: "2026-02-21",
                officialTime: "08:00"
            },
            {
                id: "1-BQBM-P4",
                subject: "Bioquímica y Biología Molecular",
                type: "Cuarto parcial",
                officialDate: "2026-04-18",
                officialTime: "08:00"
            },
            {
                id: "1-BQBM-O1",
                subject: "Bioquímica y Biología Molecular",
                type: "Primer ordinario",
                officialDate: "2026-05-07",
                officialTime: "08:00"
            },
            {
                id: "1-BQBM-O2",
                subject: "Bioquímica y Biología Molecular",
                type: "Segundo ordinario",
                officialDate: "2026-05-26",
                officialTime: "08:00"
            },
            {
                id: "1-BQBM-EX",
                subject: "Bioquímica y Biología Molecular",
                type: "Extraordinario",
                officialDate: "2026-06-10",
                officialTime: "08:00"
            },

            // BIOLOGÍA CELULAR E HISTOLOGÍA MÉDICA
            {
                id: "1-BCHM-P1",
                subject: "Biología Celular e Histología Médica",
                type: "Primer parcial",
                officialDate: "2025-10-31",
                officialTime: "08:00"
            },
            {
                id: "1-BCHM-P2",
                subject: "Biología Celular e Histología Médica",
                type: "Segundo parcial",
                officialDate: "2026-01-20",
                officialTime: "08:00"
            },
            {
                id: "1-BCHM-P3",
                subject: "Biología Celular e Histología Médica",
                type: "Tercer parcial",
                officialDate: "2026-04-21",
                officialTime: "08:00"
            },
            {
                id: "1-BCHM-O1",
                subject: "Biología Celular e Histología Médica",
                type: "Primer ordinario",
                officialDate: "2026-05-11",
                officialTime: "08:00"
            },
            {
                id: "1-BCHM-O2",
                subject: "Biología Celular e Histología Médica",
                type: "Segundo ordinario",
                officialDate: "2026-05-21",
                officialTime: "08:00"
            },
            {
                id: "1-BCHM-EX",
                subject: "Biología Celular e Histología Médica",
                type: "Extraordinario",
                officialDate: "2026-06-06",
                officialTime: "08:00"
            },

            // EMBRIOLOGÍA HUMANA
            {
                id: "1-EMBR-P1",
                subject: "Embriología Humana",
                type: "Primer parcial",
                officialDate: "2025-11-08",
                officialTime: "08:00"
            },
            {
                id: "1-EMBR-P2",
                subject: "Embriología Humana",
                type: "Segundo parcial",
                officialDate: "2026-02-07",
                officialTime: "08:00"
            },
            {
                id: "1-EMBR-P3",
                subject: "Embriología Humana",
                type: "Tercer parcial",
                officialDate: "2026-04-14",
                officialTime: "08:00"
            },
            {
                id: "1-EMBR-O1",
                subject: "Embriología Humana",
                type: "Primer ordinario",
                officialDate: "2026-04-30",
                officialTime: "08:00"
            },
            {
                id: "1-EMBR-O2",
                subject: "Embriología Humana",
                type: "Segundo ordinario",
                officialDate: "2026-05-14",
                officialTime: "08:00"
            },
            {
                id: "1-EMBR-EX",
                subject: "Embriología Humana",
                type: "Extraordinario",
                officialDate: "2026-05-30",
                officialTime: "10:30"
            },

            // INFORMÁTICA BIOMÉDICA I
            {
                id: "1-INF1-P2",
                subject: "Informática Biomédica I",
                type: "Segundo parcial",
                officialDate: "2026-04-16",
                officialTime: "08:00"
            },
            {
                id: "1-INF1-O1",
                subject: "Informática Biomédica I",
                type: "Primer ordinario",
                officialDate: "2026-04-27",
                officialTime: "09:00"
            },
            {
                id: "1-INF1-O2",
                subject: "Informática Biomédica I",
                type: "Segundo ordinario",
                officialDate: "2026-05-16",
                officialTime: "11:00"
            },
            {
                id: "1-INF1-EX",
                subject: "Informática Biomédica I",
                type: "Extraordinario",
                officialDate: "2026-06-01",
                officialTime: "08:00"
            },

            // INTEGRACIÓN BÁSICO CLÍNICA I
            {
                id: "1-IBC1-P1",
                subject: "Integración Básico Clínica I",
                type: "Primer parcial",
                officialDate: "2026-01-17",
                officialTime: "09:00"
            },
            {
                id: "1-IBC1-P2",
                subject: "Integración Básico Clínica I",
                type: "Segundo parcial",
                officialDate: "2026-04-23",
                officialTime: "08:00"
            },
            {
                id: "1-IBC1-O1",
                subject: "Integración Básico Clínica I",
                type: "Primer ordinario",
                officialDate: "2026-05-02",
                officialTime: "13:00"
            },
            {
                id: "1-IBC1-O2",
                subject: "Integración Básico Clínica I",
                type: "Segundo ordinario",
                officialDate: "2026-05-25",
                officialTime: "11:00"
            },
            {
                id: "1-IBC1-EX",
                subject: "Integración Básico Clínica I",
                type: "Extraordinario",
                officialDate: "2026-06-09",
                officialTime: "08:00"
            },

            // INTRODUCCIÓN A LA SALUD MENTAL
            {
                id: "1-ISM-P1",
                subject: "Introducción a la Salud Mental",
                type: "Primer parcial",
                officialDate: "2026-01-08",
                officialTime: "09:00"
            },
            {
                id: "1-ISM-P2",
                subject: "Introducción a la Salud Mental",
                type: "Segundo parcial",
                officialDate: "2026-04-08",
                officialTime: "09:00"
            },
            {
                id: "1-ISM-O1",
                subject: "Introducción a la Salud Mental",
                type: "Primer ordinario",
                officialDate: "2026-05-09",
                officialTime: "08:00"
            },
            {
                id: "1-ISM-O2",
                subject: "Introducción a la Salud Mental",
                type: "Segundo ordinario",
                officialDate: "2026-05-23",
                officialTime: "08:00"
            },
            {
                id: "1-ISM-EX",
                subject: "Introducción a la Salud Mental",
                type: "Extraordinario",
                officialDate: "2026-06-08",
                officialTime: "08:00"
            },

            // SALUD PÚBLICA Y COMUNIDAD
            {
                id: "1-SPC-P1",
                subject: "Salud Pública y Comunidad",
                type: "Primer parcial",
                officialDate: "2025-12-10",
                officialTime: "15:00"
            },
            {
                id: "1-SPC-P2",
                subject: "Salud Pública y Comunidad",
                type: "Segundo parcial",
                officialDate: "2026-02-19",
                officialTime: "09:00"
            },
            {
                id: "1-SPC-O1",
                subject: "Salud Pública y Comunidad",
                type: "Primer ordinario",
                officialDate: "2026-05-05",
                officialTime: "08:00"
            },
            {
                id: "1-SPC-O2",
                subject: "Salud Pública y Comunidad",
                type: "Segundo ordinario",
                officialDate: "2026-05-13",
                officialTime: "09:00"
            },
            {
                id: "1-SPC-EX",
                subject: "Salud Pública y Comunidad",
                type: "Extraordinario",
                officialDate: "2026-06-04",
                officialTime: "11:00"
            }
        ],
        2: [
            // FARMACOLOGÍA
            {
                id: "2-FARM-P1",
                subject: "Farmacología",
                type: "Primer parcial",
                officialDate: "2025-10-14",
                officialTime: "15:00"
            },
            {
                id: "2-FARM-P2",
                subject: "Farmacología",
                type: "Segundo parcial",
                officialDate: "2026-01-24",
                officialTime: "08:00"
            },
            {
                id: "2-FARM-P3",
                subject: "Farmacología",
                type: "Tercer parcial",
                officialDate: "2026-04-06",
                officialTime: "15:00"
            },
            {
                id: "2-FARM-O1",
                subject: "Farmacología",
                type: "Primer ordinario",
                officialDate: "2026-05-06",
                officialTime: "15:00"
            },
            {
                id: "2-FARM-O2",
                subject: "Farmacología",
                type: "Segundo ordinario",
                officialDate: "2026-05-16",
                officialTime: "08:00"
            },
            {
                id: "2-FARM-EX",
                subject: "Farmacología",
                type: "Extraordinario",
                officialDate: "2026-06-04",
                officialTime: "08:00"
            },

            // FISIOLOGÍA
            {
                id: "2-FISIO-P1",
                subject: "Fisiología",
                type: "Primer parcial",
                officialDate: "2025-10-24",
                officialTime: "08:00"
            },
            {
                id: "2-FISIO-P2",
                subject: "Fisiología",
                type: "Segundo parcial",
                officialDate: "2026-02-14",
                officialTime: "08:00"
            },
            {
                id: "2-FISIO-P3",
                subject: "Fisiología",
                type: "Tercer parcial",
                officialDate: "2026-04-23",
                officialTime: "13:00"
            },
            {
                id: "2-FISIO-O1",
                subject: "Fisiología",
                type: "Primer ordinario",
                officialDate: "2026-05-08",
                officialTime: "11:00"
            },
            {
                id: "2-FISIO-O2",
                subject: "Fisiología",
                type: "Segundo ordinario",
                officialDate: "2026-05-20",
                officialTime: "08:00"
            },
            {
                id: "2-FISIO-EX",
                subject: "Fisiología",
                type: "Extraordinario",
                officialDate: "2026-06-09",
                officialTime: "13:00"
            },

            // INMUNOLOGÍA
            {
                id: "2-INMU-P1",
                subject: "Inmunología",
                type: "Primer parcial",
                officialDate: "2025-10-08",
                officialTime: "13:00"
            },
            {
                id: "2-INMU-P2",
                subject: "Inmunología",
                type: "Segundo parcial",
                officialDate: "2026-01-31",
                officialTime: "08:00"
            },
            {
                id: "2-INMU-P3",
                subject: "Inmunología",
                type: "Tercer parcial",
                officialDate: "2026-04-17",
                officialTime: "08:00"
            },
            {
                id: "2-INMU-O1",
                subject: "Inmunología",
                type: "Primer ordinario",
                officialDate: "2026-04-30",
                officialTime: "14:00"
            },
            {
                id: "2-INMU-O2",
                subject: "Inmunología",
                type: "Segundo ordinario",
                officialDate: "2026-05-25",
                officialTime: "08:00"
            },
            {
                id: "2-INMU-EX",
                subject: "Inmunología",
                type: "Extraordinario",
                officialDate: "2026-06-01",
                officialTime: "11:00"
            },

            // INFORMÁTICA BIOMÉDICA II
            {
                id: "2-INF2-P1",
                subject: "Informática Biomédica II",
                type: "Primer parcial",
                officialDate: "2025-09-27",
                officialTime: "08:00"
            },
            {
                id: "2-INF2-P2",
                subject: "Informática Biomédica II",
                type: "Segundo parcial",
                officialDate: "2025-11-26",
                officialTime: "15:00"
            },
            {
                id: "2-INF2-O1",
                subject: "Informática Biomédica II",
                type: "Primer ordinario",
                officialDate: "2025-12-02",
                officialTime: "08:00"
            },
            {
                id: "2-INF2-O2",
                subject: "Informática Biomédica II",
                type: "Segundo ordinario",
                officialDate: "2025-12-08",
                officialTime: "13:00"
            },
            {
                id: "2-INF2-EX",
                subject: "Informática Biomédica II",
                type: "Extraordinario",
                officialDate: "2026-06-02",
                officialTime: "08:00"
            },

            // INTEGRACIÓN BÁSICO CLÍNICA II
            {
                id: "2-IBC2-P1",
                subject: "Integración Básico Clínica II",
                type: "Primer parcial",
                officialDate: "2025-12-11",
                officialTime: "09:00"
            },
            {
                id: "2-IBC2-P2",
                subject: "Integración Básico Clínica II",
                type: "Segundo parcial",
                officialDate: "2026-04-25",
                officialTime: "08:00"
            },
            {
                id: "2-IBC2-O1",
                subject: "Integración Básico Clínica II",
                type: "Primer ordinario",
                officialDate: "2026-05-08",
                officialTime: "14:00"
            },
            {
                id: "2-IBC2-O2",
                subject: "Integración Básico Clínica II",
                type: "Segundo ordinario",
                officialDate: "2026-05-26",
                officialTime: "13:00"
            },
            {
                id: "2-IBC2-EX",
                subject: "Integración Básico Clínica II",
                type: "Extraordinario",
                officialDate: "2026-06-08",
                officialTime: "11:00"
            },

            // INTRODUCCIÓN A LA CIRUGÍA (fechas teóricas como referencia)
            {
                id: "2-CIR-P1",
                subject: "Introducción a la Cirugía",
                type: "Primer parcial",
                officialDate: "2026-01-10",
                officialTime: "08:00"
            },
            {
                id: "2-CIR-P2",
                subject: "Introducción a la Cirugía",
                type: "Segundo parcial",
                officialDate: "2026-04-11",
                officialTime: "08:00"
            },
            {
                id: "2-CIR-O1",
                subject: "Introducción a la Cirugía",
                type: "Primer ordinario",
                officialDate: "2026-04-28",
                officialTime: "13:00"
            },
            {
                id: "2-CIR-O2",
                subject: "Introducción a la Cirugía",
                type: "Segundo ordinario",
                officialDate: "2026-05-21",
                officialTime: "12:00"
            },
            {
                id: "2-CIR-EX",
                subject: "Introducción a la Cirugía",
                type: "Extraordinario",
                officialDate: "2026-05-29",
                officialTime: "08:00"
            },

            // MICROBIOLOGÍA Y PARASITOLOGÍA
            {
                id: "2-MICRO-P1",
                subject: "Microbiología y Parasitología",
                type: "Primer parcial",
                officialDate: "2025-12-06",
                officialTime: "13:00"
            },
            {
                id: "2-MICRO-P2",
                subject: "Microbiología y Parasitología",
                type: "Segundo parcial",
                officialDate: "2026-04-13",
                officialTime: "15:00"
            },
            {
                id: "2-MICRO-O1",
                subject: "Microbiología y Parasitología",
                type: "Primer ordinario",
                officialDate: "2026-05-02",
                officialTime: "08:00"
            },
            {
                id: "2-MICRO-O2",
                subject: "Microbiología y Parasitología",
                type: "Segundo ordinario",
                officialDate: "2026-05-13",
                officialTime: "12:00"
            },
            {
                id: "2-MICRO-EX",
                subject: "Microbiología y Parasitología",
                type: "Extraordinario",
                officialDate: "2026-05-30",
                officialTime: "08:00"
            },

            // PROMOCIÓN DE LA SALUD EN EL CICLO DE VIDA
            {
                id: "2-PSCV-P1",
                subject: "Promoción de la Salud en el Ciclo de Vida",
                type: "Primer parcial",
                officialDate: "2025-11-18",
                officialTime: "09:00"
            },
            {
                id: "2-PSCV-P2",
                subject: "Promoción de la Salud en el Ciclo de Vida",
                type: "Segundo parcial",
                officialDate: "2026-04-15",
                officialTime: "15:00"
            },
            {
                id: "2-PSCV-O1",
                subject: "Promoción de la Salud en el Ciclo de Vida",
                type: "Primer ordinario",
                officialDate: "2026-05-11",
                officialTime: "15:00"
            },
            {
                id: "2-PSCV-O2",
                subject: "Promoción de la Salud en el Ciclo de Vida",
                type: "Segundo ordinario",
                officialDate: "2026-05-18",
                officialTime: "14:00"
            },
            {
                id: "2-PSCV-EX",
                subject: "Promoción de la Salud en el Ciclo de Vida",
                type: "Extraordinario",
                officialDate: "2026-06-06",
                officialTime: "09:00"
            }
        ]
    };

    const examIndex = {};
    const subjectChainsByYear = {
        1: {},
        2: {}
    };

    let currentGroupId = null;
    let currentYear = 1;

    function parseDate(dateStr) {
        const parts = dateStr.split("-");
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    function formatDate(year, month, day) {
        const y = String(year);
        const m = String(month).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return y + "-" + m + "-" + d;
    }

    function formatHumanDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        return parts[2] + "/" + parts[1] + "/" + parts[0];
    }

    function isDateWithinCalendar(dateStr) {
        return dateStr >= CAL_START_DATE && dateStr <= CAL_END_DATE;
    }

    function isDateInVacation(dateStr) {
        return dateStr >= VACATION_START_DATE && dateStr <= VACATION_END_DATE;
    }

    function isWeekend(dateStr) {
        const d = parseDate(dateStr);
        const day = d.getDay();
        return day === 0; // Only Sundays are weekends now
    }

    function isDateValidForExam(dateStr) {
        if (!isDateWithinCalendar(dateStr)) return false;
        if (isWeekend(dateStr)) return false;
        if (isDateInVacation(dateStr)) return false;
        return true;
    }

    function diffDays(dateA, dateB) {
        const a = parseDate(dateA);
        const b = parseDate(dateB);
        const ms = b.getTime() - a.getTime();
        return Math.round(Math.abs(ms) / 86400000);
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {
                groups: {}
            };
            const parsed = JSON.parse(raw);
            if (!parsed.groups) parsed.groups = {};
            return parsed;
        } catch (e) {
            console.error("Error al leer localStorage", e);
            return {
                groups: {}
            };
        }
    }

    function saveState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Error al guardar en localStorage", e);
        }
    }

    function buildExamIndices() {
        [1, 2].forEach(function (year) {
            const exams = EXAMS_BY_YEAR[year];
            exams.forEach(function (exam) {
                examIndex[exam.id] = exam;
            });

            const bySubject = {};
            exams.forEach(function (exam) {
                if (!bySubject[exam.subject]) bySubject[exam.subject] = [];
                bySubject[exam.subject].push(exam);
            });

            const chains = {};
            Object.keys(bySubject).forEach(function (subject) {
                const list = bySubject[subject].slice().sort(function (a, b) {
                    const idxA = EXAM_ORDER.indexOf(a.type);
                    const idxB = EXAM_ORDER.indexOf(b.type);
                    const orderDiff = (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                    if (orderDiff !== 0) return orderDiff;
                    if (a.officialDate < b.officialDate) return -1;
                    if (a.officialDate > b.officialDate) return 1;
                    return 0;
                });
                chains[subject] = list.map(function (exam) {
                    return exam.id;
                });
            });
            subjectChainsByYear[year] = chains;
        });
    }

    function getMonthList() {
        const list = [];
        const start = parseDate(CAL_START_DATE);
        const end = parseDate(CAL_END_DATE);
        let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cursor <= end) {
            list.push({
                year: cursor.getFullYear(),
                month: cursor.getMonth()
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return list;
    }

    function buildCalendars() {
        const calendar = document.getElementById("calendar");
        calendar.innerHTML = "";
        const months = getMonthList();
        months.forEach(function (info) {
            const year = info.year;
            const month = info.month;
            const monthSection = document.createElement("section");
            monthSection.className = "month";

            const header = document.createElement("header");
            header.className = "month-header";

            const title = document.createElement("h3");
            title.textContent = MONTH_NAMES[month] + " " + year;
            header.appendChild(title);

            const meta = document.createElement("span");
            meta.textContent = "Calendario continuo";
            header.appendChild(meta);

            monthSection.appendChild(header);

            const grid = document.createElement("div");
            grid.className = "month-grid";

            DAY_NAMES.forEach(function (label) {
                const cell = document.createElement("div");
                cell.className = "day-name";
                cell.textContent = label;
                grid.appendChild(cell);
            });

            const firstDayJs = new Date(year, month, 1).getDay();
            const startIndex = (firstDayJs + 6) % 7;

            for (let i = 0; i < startIndex; i++) {
                const empty = document.createElement("div");
                empty.className = "day-cell empty";
                grid.appendChild(empty);
            }

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = formatDate(year, month + 1, day);
                const cell = document.createElement("div");
                cell.className = "day-cell";
                cell.dataset.date = dateStr;

                const dObj = parseDate(dateStr);
                const dow = dObj.getDay();
                if (dow === 0) { // Only Sundays are weekends
                    cell.classList.add("weekend");
                }
                if (isDateInVacation(dateStr)) {
                    cell.classList.add("vacation");
                }

                const headerRow = document.createElement("div");
                headerRow.className = "day-header";

                const numSpan = document.createElement("span");
                numSpan.className = "day-number";
                numSpan.textContent = String(day);
                headerRow.appendChild(numSpan);

                const metaSpan = document.createElement("span");
                metaSpan.className = "day-meta";
                if (dateStr === CAL_START_DATE) {
                    metaSpan.textContent = "Inicio";
                } else if (dateStr === CAL_END_DATE) {
                    metaSpan.textContent = "Fin";
                } else if (isDateInVacation(dateStr)) {
                    metaSpan.textContent = "Vacaciones";
                } else if (dow === 0) { // Only Sundays are weekends
                    metaSpan.textContent = "Fin de semana";
                }
                headerRow.appendChild(metaSpan);

                cell.appendChild(headerRow);

                const examList = document.createElement("div");
                examList.className = "exam-list";
                cell.appendChild(examList);

                grid.appendChild(cell);
            }

            monthSection.appendChild(grid);
            calendar.appendChild(monthSection);
        });

        wireDropTargets();
    }

    function wireDropTargets() {
        const dayCells = document.querySelectorAll(".day-cell");
        dayCells.forEach(function (cell) {
            cell.addEventListener("dragover", function (e) {
                e.preventDefault();
                cell.classList.add("drop-target");
            });
            cell.addEventListener("dragleave", function () {
                cell.classList.remove("drop-target");
            });
            cell.addEventListener("drop", function (e) {
                e.preventDefault();
                cell.classList.remove("drop-target");
                const examId = e.dataTransfer.getData("text/plain");
                const dateStr = cell.dataset.date;
                if (examId && dateStr) {
                    moveExamToDate(examId, dateStr);
                }
            });
        });
    }

    function createInitialGroupEntry(groupId, year) {
        const entry = {
            year: year,
            exams: {}
        };
        const exams = EXAMS_BY_YEAR[year] || [];
        exams.forEach(function (exam) {
            if (exam.officialDate) {
                entry.exams[exam.id] = exam.officialDate;
            }
        });
        return entry;
    }

    function ensureGroupInitialized(groupId, year) {
        const state = loadState();
        if (!state.groups[groupId]) {
            state.groups[groupId] = createInitialGroupEntry(groupId, year);
            saveState(state);
        } else if (!state.groups[groupId].year) {
            state.groups[groupId].year = year;
            saveState(state);
        }
    }

    function setCurrentGroup(groupNumber) {
        const status = document.getElementById("group-status");
        const statsYearSelect = document.getElementById("stats-year");

        if (!groupNumber || isNaN(groupNumber)) {
            currentGroupId = null;
            status.textContent = "Escribe un grupo entre 1101–1185 o 2201–2265";
            return;
        }

        let year = null;
        if (groupNumber >= YEAR1_RANGE.min && groupNumber <= YEAR1_RANGE.max) {
            year = 1;
        } else if (groupNumber >= YEAR2_RANGE.min && groupNumber <= YEAR2_RANGE.max) {
            year = 2;
        } else {
            currentGroupId = null;
            status.textContent = "Grupo fuera de rango (solo 1101–1170 y 2201–2270)";
            return;
        }

        currentGroupId = String(groupNumber);
        currentYear = year;
        status.textContent = year === 1 ? "Primer año" : "Segundo año";

        if (statsYearSelect) {
            statsYearSelect.value = String(year);
        }

        ensureGroupInitialized(currentGroupId, currentYear);
        renderCurrentGroup();
        recomputeStatsAndGhosts();
    }

    function createExamCard(exam, scheduledDate, statusClass, highlightForced) {
        const card = document.createElement("div");
        card.className = "exam-card " + statusClass;
        if (highlightForced) {
            card.classList.add("forced");
        }
        card.draggable = true;
        card.dataset.examId = exam.id;

        const subjectEl = document.createElement("div");
        subjectEl.className = "exam-subject";
        subjectEl.textContent = exam.subject;
        card.appendChild(subjectEl);

        const typeEl = document.createElement("div");
        typeEl.className = "exam-type";
        typeEl.textContent = exam.type;
        card.appendChild(typeEl);

        const metaEl = document.createElement("div");
        metaEl.className = "exam-meta";
        metaEl.textContent =
            "Reprogramación: " + formatHumanDate(scheduledDate) +
            "   Original: " + formatHumanDate(exam.officialDate) +
            " " + (exam.officialTime || "");
        card.appendChild(metaEl);

        card.addEventListener("dragstart", function (e) {
            e.dataTransfer.setData("text/plain", exam.id);
            e.dataTransfer.effectAllowed = "move";
            card.classList.add("dragging");
        });
        card.addEventListener("dragend", function () {
            card.classList.remove("dragging");
        });

        return card;
    }

    function renderCurrentGroup() {
        if (!currentGroupId || !currentYear) return;
        const state = loadState();
        const group = state.groups[currentGroupId];
        if (!group) return;

        const schedule = group.exams || {};

        const examLists = document.querySelectorAll(".exam-list");
        examLists.forEach(function (list) {
            list.innerHTML = "";
        });

        const pendingList = document.getElementById("pending-exams-list");
        if (pendingList) {
            pendingList.innerHTML = "";
        }

        const warningsEl = document.getElementById("warnings");
        const forcedMessages = [];

        const exams = EXAMS_BY_YEAR[currentYear] || [];
        exams.forEach(function (exam) {
            const stored = schedule[exam.id];
            const scheduledDate = stored || exam.officialDate;
            const valid = isDateValidForExam(scheduledDate);
            const isOfficial = scheduledDate === exam.officialDate;
            const forcedOriginal = exam.officialDate < FORCED_REPROGRAM_CUTOFF;

            let statusClass = "";
            if (!valid) {
                statusClass = "status-invalid";
            } else if (isOfficial) {
                statusClass = "status-original";
            } else {
                statusClass = "status-valid";
            }

            const highlightForced = forcedOriginal && !valid;
            const card = createExamCard(exam, scheduledDate, statusClass, highlightForced);

            const dayCell = document.querySelector('.day-cell[data-date="' + scheduledDate + '"]');
            if (dayCell && isDateWithinCalendar(scheduledDate)) {
                const list = dayCell.querySelector(".exam-list");
                if (list) list.appendChild(card);
            } else if (pendingList) {
                pendingList.appendChild(card);
            }

            if (forcedOriginal && !valid) {
                forcedMessages.push(exam.subject + " – " + exam.type);
            }
        });

        if (warningsEl) {
            if (forcedMessages.length) {
                warningsEl.innerHTML =
                    "<strong>Departamentales con reprogramación obligatoria (fecha oficial anterior al 25/11/2025):</strong><br>" +
                    forcedMessages.map(function (t) {
                        return "• " + t;
                    }).join("<br>");
            } else {
                warningsEl.textContent = "";
            }
        }
    }

    function moveExamToDate(examId, dateStr) {
        if (!currentGroupId || !currentYear) return;
        if (!isDateWithinCalendar(dateStr)) {
            alert("La fecha está fuera del rango noviembre 2025–junio 2026.");
            return;
        }
        if (!isDateValidForExam(dateStr)) {
            alert("Esa fecha es inválida (fin de semana o periodo vacacional).");
            return;
        }

        const state = loadState();
        if (!state.groups[currentGroupId]) {
            state.groups[currentGroupId] = createInitialGroupEntry(currentGroupId, currentYear);
        }
        if (!state.groups[currentGroupId].exams) {
            state.groups[currentGroupId].exams = {};
        }
        state.groups[currentGroupId].exams[examId] = dateStr;
        saveState(state);
        renderCurrentGroup();
        recomputeStatsAndGhosts();
    }

    function computePrevNextDistances(year, exam, candidateDate, modeByExam) {
        const chains = subjectChainsByYear[year] || {};
        const chain = chains[exam.subject] || [];
        const examId = exam.id;
        const result = {
            prevDistance: null,
            prevLabel: "",
            nextDistance: null,
            nextLabel: ""
        };

        const idx = chain.indexOf(examId);
        if (idx === -1) return result;

        const prevId = idx > 0 ? chain[idx - 1] : null;
        const nextId = idx < chain.length - 1 ? chain[idx + 1] : null;

        if (prevId) {
            const prevExam = examIndex[prevId];
            let prevDate = prevExam ? prevExam.officialDate : null;
            if (modeByExam[prevId]) {
                prevDate = modeByExam[prevId].date;
            }
            if (prevDate) {
                result.prevDistance = diffDays(prevDate, candidateDate);
                result.prevLabel = prevExam ? prevExam.type : "anterior";
            }
        }

        if (nextId) {
            const nextExam = examIndex[nextId];
            let nextDate = nextExam ? nextExam.officialDate : null;
            if (modeByExam[nextId]) {
                nextDate = modeByExam[nextId].date;
            }
            if (nextDate) {
                result.nextDistance = diffDays(candidateDate, nextDate);
                result.nextLabel = nextExam ? nextExam.type : "siguiente";
            }
        }

        return result;
    }

    function renderGhosts(year, modeByExam, countsByExamAndDate) {
        const existing = document.querySelectorAll(".ghost-date");
        existing.forEach(function (el) {
            el.remove();
        });

        Object.keys(modeByExam).forEach(function (examId) {
            const mode = modeByExam[examId];
            const exam = examIndex[examId];
            if (!exam) return;
            const dateStr = mode.date;
            const cell = document.querySelector('.day-cell[data-date="' + dateStr + '"]');
            if (!cell) return;

            const prevNext = computePrevNextDistances(year, exam, dateStr, modeByExam);

            const ghost = document.createElement("div");
            ghost.className = "ghost-date";
            ghost.dataset.examId = examId;
            ghost.dataset.date = dateStr;

            const lines = [];
            lines.push(exam.subject + " – " + exam.type);
            lines.push(mode.count + " grupos en esta fecha");
            if (prevNext.prevLabel && prevNext.prevDistance != null) {
                lines.push("−" + prevNext.prevDistance + " días desde " + prevNext.prevLabel);
            }
            if (prevNext.nextLabel && prevNext.nextDistance != null) {
                lines.push("+" + prevNext.nextDistance + " días hasta " + prevNext.nextLabel);
            }
            ghost.setAttribute("data-tooltip", lines.join("\n"));

            cell.appendChild(ghost);
        });
    }

    function renderStatsTable(year, modeByExam, countsByExamAndDate, groupsCount) {
        const tbody = document.querySelector("#stats-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const exams = EXAMS_BY_YEAR[year] || [];
        const rows = [];

        exams.forEach(function (exam) {
            const mode = modeByExam[exam.id];
            if (!mode) return;
            const humanDate = formatHumanDate(mode.date);
            const monthIdx = parseDate(mode.date).getMonth();
            const monthName = MONTH_NAMES[monthIdx];

            rows.push({
                subject: exam.subject,
                type: exam.type,
                date: humanDate,
                count: mode.count,
                month: monthName
            });
        });

        rows.sort(function (a, b) {
            if (a.subject < b.subject) return -1;
            if (a.subject > b.subject) return 1;
            if (a.type < b.type) return -1;
            if (a.type > b.type) return 1;
            return 0;
        });

        rows.forEach(function (row) {
            const tr = document.createElement("tr");

            const tdSub = document.createElement("td");
            tdSub.textContent = row.subject;
            tr.appendChild(tdSub);

            const tdType = document.createElement("td");
            tdType.textContent = row.type;
            tr.appendChild(tdType);

            const tdDate = document.createElement("td");
            tdDate.textContent = row.date;
            tr.appendChild(tdDate);

            const tdCount = document.createElement("td");
            tdCount.textContent = String(row.count);
            tr.appendChild(tdCount);

            const tdMonth = document.createElement("td");
            tdMonth.textContent = row.month;
            tr.appendChild(tdMonth);

            tbody.appendChild(tr);
        });

        const summary = document.getElementById("stats-summary-text");
        if (summary) {
            if (groupsCount) {
                summary.textContent =
                    "Agregando propuestas de " +
                    groupsCount +
                    " grupo" +
                    (groupsCount === 1 ? "" : "s") +
                    " de " +
                    (year === 1 ? "primer año." : "segundo año.");
            } else {
                summary.textContent =
                    "Aún no hay movimientos registrados para este año en este navegador.";
            }
        }
    }

    function recomputeStatsAndGhosts() {
        const statsYearSelect = document.getElementById("stats-year");
        const yearValue = statsYearSelect ? Number(statsYearSelect.value) : currentYear || 1;
        const year = yearValue || 1;

        const state = loadState();
        const groupsEntries = Object.entries(state.groups || {}).filter(function (entry) {
            const g = entry[1];
            return g && g.year === year;
        });

        const exams = EXAMS_BY_YEAR[year] || [];
        const examIds = exams.map(function (exam) {
            return exam.id;
        });

        const countsByExamAndDate = {};
        examIds.forEach(function (id) {
            countsByExamAndDate[id] = {};
        });

        groupsEntries.forEach(function (entry) {
            const g = entry[1];
            const examsMap = g.exams || {};
            examIds.forEach(function (examId) {
                const dateStr = examsMap[examId];
                if (!dateStr) return;
                if (!isDateWithinCalendar(dateStr)) return;
                const map = countsByExamAndDate[examId];
                map[dateStr] = (map[dateStr] || 0) + 1;
            });
        });

        const modeByExam = {};
        Object.keys(countsByExamAndDate).forEach(function (examId) {
            const dateMap = countsByExamAndDate[examId];
            let bestDate = null;
            let bestCount = 0;
            Object.keys(dateMap).forEach(function (dateStr) {
                const count = dateMap[dateStr];
                if (count > bestCount) {
                    bestCount = count;
                    bestDate = dateStr;
                }
            });
            if (bestDate) {
                modeByExam[examId] = {
                    date: bestDate,
                    count: bestCount
                };
            }
        });

        renderGhosts(year, modeByExam, countsByExamAndDate);
        renderStatsTable(year, modeByExam, countsByExamAndDate, groupsEntries.length);
    }

    function wireGroupSelector() {
        const input = document.getElementById("group-input");
        if (!input) return;

        input.addEventListener("change", function () {
            const value = parseInt(input.value, 10);
            setCurrentGroup(value);
        });

        input.addEventListener("blur", function () {
            const value = parseInt(input.value, 10);
            setCurrentGroup(value);
        });

        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                const value = parseInt(input.value, 10);
                setCurrentGroup(value);
            }
        });
    }

    function wireStatsControls() {
        const select = document.getElementById("stats-year");
        if (!select) return;
        select.addEventListener("change", function () {
            recomputeStatsAndGhosts();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        buildExamIndices();
        buildCalendars();
        wireGroupSelector();
        wireStatsControls();

        const input = document.getElementById("group-input");
        if (input) {
            input.value = String(YEAR1_RANGE.min);
            setCurrentGroup(YEAR1_RANGE.min);
        } else {
            recomputeStatsAndGhosts();
        }
    });
})();