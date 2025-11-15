"use strict";

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

/* ===== Captura ===== */
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
    const groupText = resultsMode ? (currentYear===1? "RESULTADOS PRIMERO" : "RESULTADOS SEGUNDO")
        : (currentGroupId ? `Grupo ${currentGroupId}` : "Grupo —");
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
