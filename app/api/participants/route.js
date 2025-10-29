export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getDb } from '../../../lib/getDb';
import { NextResponse } from 'next/server';



function uid() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const settingsOnly = searchParams.get('settings');
    const token = searchParams.get('token');
    try {
        const db = getDb();

        if (settingsOnly) {
            const snap = await db.ref('/settings/messageTemplate').get();
            return NextResponse.json({ settings: { messageTemplate: snap.val() || '' } });
        }

        const pSnap = await db.ref('/participants').get();
        const map = pSnap.val() || {};
        const arr = Object.values(map);

        const byId = Object.fromEntries(arr.map(p => [p.id, p]));

        if (token) {
            const me = arr.find(p => p.token === token) || null;
            const full = arr.map(p => ({
                ...p,
                assignedToName: p.assignedToId
                    ? `${byId[p.assignedToId]?.name || ''} ${byId[p.assignedToId]?.surname || ''}`.trim()
                    : null,
            }));
            const meOut = me
                ? {
                    ...me,
                    assignedToName: me.assignedToId
                        ? `${byId[me.assignedToId]?.name || ''} ${byId[me.assignedToId]?.surname || ''}`.trim()
                        : null,
                }
                : null;
            return NextResponse.json({ me: meOut, participants: full });
        }

        const out = arr.map(p => ({
            ...p,
            assignedToName: p.assignedToId
                ? `${byId[p.assignedToId]?.name || ''} ${byId[p.assignedToId]?.surname || ''}`.trim()
                : null,
        }));
        return NextResponse.json({ participants: out });
    } catch (err) {
        console.error('participants GET error:', String(err));
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req) {
    const { searchParams } = new URL(req.url);
    const settingsOnly = searchParams.get('settings');
    const body = await req.json();
    try {
        const db = getDb();

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
        await db
            .ref(`/participants/${id}`)
            .set({
                id,
                name,
                surname,
                nickname: nickname || '',
                email,
                token,
                assignedToId: null,
                createdAt,
            });

        return NextResponse.json({ ok: true, id });
    } catch (err) {
        console.error('participants POST error:', String(err));
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
