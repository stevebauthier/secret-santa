export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '../../lib/getDb';
import { sendSuggestionNotification } from '../../../lib/email';



function uid() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function POST(req) {
    const body = await req.json();
    const { token, targetId, text } = body || {};
    if (!token || !targetId || !text) {
        return NextResponse.json(
            { error: 'Missing token, targetId, or text' },
            { status: 400 }
        );
    }
    try {
        const db = getDb();

        // Load participants
        const pSnap = await db.ref('/participants').get();
        const map = pSnap.val() || {};
        const all = Object.values(map);
        const byId = Object.fromEntries(all.map(p => [p.id, p]));

        const me = all.find(p => p.token === token);
        if (!me) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        if (!byId[targetId]) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

        // Store suggestion
        const id = uid();
        const createdAt = Date.now();
        await db
            .ref(`/suggestions/${targetId}/${id}`)
            .set({ id, authorId: me.id, targetId, text, createdAt });

        // Notify assigned buyer
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
    } catch (err) {
        console.error('suggestions POST error:', String(err));
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
