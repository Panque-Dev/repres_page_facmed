import { getStore } from "@netlify/blobs";

/**
 * Devuelve las propuestas de un grupo.
 * GET /api/get?group_id=1101&year=1
 */
export default async (req, context) => {
    const url = new URL(req.url);
    const group_id = url.searchParams.get("group_id");
    const year = url.searchParams.get("year");
    if (!group_id || !year) return new Response("Missing params", { status: 400 });

    const store = getStore("repres-proposals");
    const key = `y${year}/${group_id}.json`;
    const json = await store.get(key, { type: "json" });

    if (json === null) return new Response("Not found", { status: 404 });

    return new Response(JSON.stringify(json), {
        headers: { "Content-Type": "application/json" }
    });
};
