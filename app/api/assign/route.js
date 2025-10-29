import { NextResponse } from 'next/server';
import { dbAdmin } from '../../../lib/firebaseAdmin';
import { sendAssignmentEmail } from '../../../lib/email';
import { sattoloDerangement } from '../../../lib/derangement'

export async function POST() {
    const db = dbAdmin;

    // Load participants
    const snap = await db.ref('/participants').get();
    const map = snap.val() || {};
    const participants = Object.values(map);
    if (participants.length < 2) return NextResponse.json({ message: 'Need at least 2 participants.' }, { status: 400 });

    // Derangement
    const perm = sattoloDerangement(participants);

    // Build lookup by index
    const byId = Object.fromEntries(participants.map(p => [p.id, p]));

    // Persist assignments
    await Promise.all(participants.map((p, i) => {
        const receiver = perm[i];
        return db.ref(`/participants/${p.id}/assignedToId`).set(receiver.id);
    }));

    // Load template
    const tmplSnap = await db.ref('/settings/messageTemplate').get();
    const messageTemplate = tmplSnap.val() || `Hey {{giverName}}!\n\nYou’ve been assigned: {{receiverName}} ({{receiverNickname}})\nContact: {{receiverEmail}}\n\nManage suggestions here:\n{{participantLink}}\n\nHappy gifting! 🎄`;

    // Email everyone
    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    await Promise.all(participants.map(async (p, i) => {
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
    }));

    return NextResponse.json({ message: 'Assignments saved and emails sent.' });
}