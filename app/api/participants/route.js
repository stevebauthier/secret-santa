import { NextResponse } from 'next/server';
import { dbAdmin } from '../../../lib/firebaseAdmin';

function uid() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const settingsOnly = searchParams.get('settings');
    const token = searchParams.get('token');

    const db = dbAdmin;

    if (settingsOnly) {
        const snap = await db.ref('/settings/messageTemplate').get();
        return NextResponse.json({ settings: { messageTemplate: snap.val() || '' } });
    }

    const pSnap = await db.ref('/participants').get();
    const map = pSnap.val() || {};
    const arr = Object.values(map);

    // If token present, return "me" + everyone list
    if (token) {
        const me = arr.find(p => p.token === token) || null;
        const byId = Object.fromEntries(arr.map(p => [p.id, p]));
        const full = arr.map(p => ({
            ...p,
            assignedToName: p.assignedToId ? `${byId[p.assignedToId]?.name || ''} ${byId[p.assignedToId]?.surname || ''}`.trim() : null,
        }));
        const meOut = me ? {
            ...me,
            assignedToName: me.assignedToId ? `${byId[me.assignedToId]?.name || ''} ${byId[me.assignedToId]?.surname || ''}`.trim() : null,
        } : null;
        return NextResponse.json({ me: meOut, participants: full });
    }

    // Admin list (with resolved assignedTo names)
    const byId = Object.fromEntries(arr.map(p => [p.id, p]));
    const out = arr.map(p => ({
        ...p,
        assignedToName: p.assignedToId ? `${byId[p.assignedToId]?.name || ''} ${byId[p.assignedToId]?.surname || ''}`.trim() : null,
    }));
    return NextResponse.json({ participants: out });
}

export async function POST(req) {
    const { searchParams } = new URL(req.url);
    const settingsOnly = searchParams.get('settings');
    const body = await req.json();
    const db = dbAdmin;

    if (settingsOnly) {
        const { messageTemplate } = body;
        await db.ref('/settings/messageTemplate').set(messageTemplate || '');
        return NextResponse.json({ ok: true });
    }

    const { name, surname, nickname, email } = body;
    if (!name || !surname || !email) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = uid();
    const token = uid();
    const createdAt = Date.now();
    await db.ref(`/participants/${id}`).set({ id, name, surname, nickname: nickname || '', email, token, assignedToId: null, createdAt });
    return NextResponse.json({ ok: true, id });
}