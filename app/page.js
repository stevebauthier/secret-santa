import Link from 'next/link';


export default function Home() {
    return (
        <div style={{ paddingTop: 32 }}>
            <h1>Secret Pal</h1>
            <p><Link href="/admin">Go to Admin</Link></p>
        </div>
    );
}