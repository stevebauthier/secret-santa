export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getDb } from '../../lib/getDb';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const db = getDb();
    // light, read-only ping
    const snap = await db.ref('/__health').limitToFirst(1).get();
    return NextResponse.json({
      ok: true,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      dbUrl: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || null,
      foundHealthKey: snap.exists(),
    });
  } catch (e) {
    console.error('health GET error:', String(err));
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
