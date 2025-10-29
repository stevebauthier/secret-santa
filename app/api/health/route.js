export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

function getDb() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        `Missing admin env(s): ` +
        JSON.stringify({
          hasProjectId: !!projectId,
          hasClientEmail: !!clientEmail,
          hasPrivateKey: !!privateKey,
        })
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }
  return admin.database();
}

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
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
