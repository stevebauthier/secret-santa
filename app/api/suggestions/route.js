import { NextResponse } from 'next/server';
import { dbAdmin } from '../../../lib/firebaseAdmin';
import { sendSuggestionNotification } from '../../../lib/email';

function uid() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function POST(req) {
    const body = await req.json();
    const { token, targetId, text } = body || {};
    if (!token || !targetId || !text) return NextResponse.json({ error: 'Missing token, targetId, or text' }, { status: 400 });

    const db = dbAdmin;
    const pSnap = await db.ref('/participants').get();
    const map = pSnap.val() || {};
    const all = Object.values(map);
    const byId = Object.fromEntries(all.map(p => [p.id, p]));

    const me = all.find(p => p.token === token);
    if (!me) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    if (!byId[targetId]) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

    const id = uid();
    const createdAt = Date.now();
    await db.ref(`/suggestions/${targetId}/${id}`).set({ id, authorId: me.id, targetId, text, createdAt });

    // If the author is assigned to someone, notify the author’s assignment owner when a suggestion is added for that target
    // Requirement: “They should also receive an email when any other user adds a suggestion for their assigned user.”
    // Interpretation: If someone adds a suggestion for X, then **whoever is assigned to buy for X** gets notified.
    const assignee = all.find(p => p.assignedToId === targetId);
    if (assignee) {
        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
        await sendSuggestionNotification({
            to: assignee.email,
            authorName: me.name,
            targetName: `${byId[targetId].name} ${byId[targetId].surname}`.trim(),
            participantLink: `${baseUrl}/p/${encodeURIComponent(assignee.token)}`,
        });
    }

    return NextResponse.json({ ok: true, id });
}