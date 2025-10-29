import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


function uid() {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function getDb() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
    }
    return admin.database();
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const settingsOnly = searchParams.get('settings');
    const token = searchParams.get('token');
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
}

export async function POST(req) {
    const { searchParams } = new URL(req.url);
    const settingsOnly = searchParams.get('settings');
    const body = await req.json();
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
}
