// ESM + Netlify Functions API
import { getStore } from "@netlify/blobs";

/**
 * Guarda las propuestas de un grupo.
 * Body JSON: { group_id:number, year:number, proposals: { [exam_id]: "YYYY-MM-DD" }, csv?: string }
 */
export default async (req, context) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }
    let body;
    try {
        body = await req.json();
    } catch {
        return new Response("Invalid JSON", { status: 400 });
    }
    const group_id = Number(body?.group_id);
    const year = Number(body?.year);
    const proposals = body?.proposals || null;
    const csv = typeof body?.csv === "string" ? body.csv : null;

    if (!group_id || !year || !proposals || typeof proposals !== "object") {
        return new Response("Missing fields: group_id, year, proposals", { status: 400 });
    }

    const store = getStore("repres-proposals");
    const keyJson = `y${year}/${group_id}.json`;
    await store.setJSON(keyJson, { group_id, year, proposals }, {
        metadata: { group_id, year, type: "proposals" }
    });

    if (csv) {
        const keyCsv = `csv/y${year}/${group_id}.csv`;
        await store.set(keyCsv, csv, {
            metadata: { group_id, year, type: "csv" }
        });
    }

    return new Response(JSON.stringify({ ok: true, key: keyJson }), {
        headers: { "Content-Type": "application/json" }
    });
};
