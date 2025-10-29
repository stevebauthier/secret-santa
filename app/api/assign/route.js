import { NextResponse } from 'next/server';
import { sendAssignmentEmail } from '../../../lib/email';
import { sattoloDerangement } from '../../../lib/derangement';
import admin from 'firebase-admin';

function getDb() {
    // Only initialize once, and only in runtime
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

export async function POST() {
    const db = getDb();

    // Load participants
    const snap = await db.ref('/participants').get();
    const map = snap.val() || {};
    const participants = Object.values(map);
    if (participants.length < 2) {
        return NextResponse.json(
            { message: 'Need at least 2 participants.' },
            { status: 400 }
        );
    }

    // Derangement
    const perm = sattoloDerangement(participants);

    // Persist assignments
    await Promise.all(
        participants.map((p, i) => {
            const receiver = perm[i];
            return db.ref(`/participants/${p.id}/assignedToId`).set(receiver.id);
        })
    );

    // Load message template
    const tmplSnap = await db.ref('/settings/messageTemplate').get();
    const messageTemplate =
        tmplSnap.val() ||
        `Hey {{giverName}}!\n\nYou’ve been assigned: {{receiverName}} ({{receiverNickname}})\nContact: {{receiverEmail}}\n\nManage suggestions here:\n{{participantLink}}\n\nHappy gifting! 🎄`;

    // Email assignments
    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    await Promise.all(
        participants.map(async (p, i) => {
            const receiver = perm[i];
            const participantLink = `${baseUrl}/p/${encodeURIComponent(p.token)}`;

            await sendAssignmentEmail({
                to: p.email,
                giverName: p.name,
                receiverName: `${receiver.name} ${receiver.surname}`.trim(),
                receiverNickname: receiver.nickname,
                receiverEmail: receiver.email,
                participantLink,
                messageTemplate,
            });
        })
    );

    return NextResponse.json({
        message: 'Assignments saved and emails sent.',
    });
}
