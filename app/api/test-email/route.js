export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { sendSuggestionNotification } from '../../../lib/email';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const to = searchParams.get('to');
        if (!to) return NextResponse.json({ error: 'Add ?to=you@example.com' }, { status: 400 });

        await sendSuggestionNotification({
            to,
            authorName: 'Tester',
            targetName: 'Secret Someone',
            participantLink: process.env.PUBLIC_APP_URL || 'http://localhost:3000',
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
    }
}
