import { getStore } from "@netlify/blobs";

/**
 * Lista todas las propuestas del año solicitado.
 * GET /api/list?year=1
 * Respuesta: { groups: [{ group_id, year, proposals }] }
 */
export default async (req, context) => {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    if (!year) return new Response("Missing param: year", { status: 400 });

    const store = getStore("repres-proposals");
    const prefix = `y${year}/`;

    const groups = [];
    let cursor = undefined;

    // prefijo + paginación; sólo .json
    do {
        const { blobs = [], cursor: next } = await store.list({ prefix, cursor });
        for (const b of blobs) {
            if (!b.key.endsWith(".json")) continue;
            const obj = await store.get(b.key, { type: "json" });
            if (obj && obj.group_id && obj.proposals) {
                groups.push({ group_id: obj.group_id, year: Number(year), proposals: obj.proposals });
            }
        }
        cursor = next;
    } while (cursor);

    return new Response(JSON.stringify({ groups }), {
        headers: { "Content-Type": "application/json" }
    });
};
