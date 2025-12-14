import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Dynamic params
        const name = searchParams.get('name')?.slice(0, 100) || 'Identity';
        const role = searchParams.get('role') || 'BUILDER';
        const score = searchParams.get('score') || '999';
        const fid = searchParams.get('fid') || '9876';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* Card Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '90%',
                            height: '85%',
                            backgroundColor: '#0F1115',
                            borderRadius: 32,
                            border: '2px solid #333',
                            padding: 40,
                            position: 'relative',
                        }}
                    >
                        {/* Header: Name and FID */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
                            <span style={{ color: '#fff', fontSize: 48, fontWeight: 900, textTransform: 'uppercase' }}>{name}</span>
                            <span style={{ color: '#666', fontSize: 24, fontFamily: 'monospace' }}>#{fid}</span>
                        </div>

                        {/* Role Chips */}
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{
                                backgroundColor: '#0052FF',
                                color: 'white',
                                padding: '8px 24px',
                                borderRadius: 99,
                                fontSize: 24,
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                {role}
                            </div>
                            <div style={{
                                border: '2px solid #333',
                                color: '#888',
                                padding: '8px 24px',
                                borderRadius: 99,
                                fontSize: 24,
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                Verified
                            </div>
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Footer / Score */}
                        <div style={{ display: 'flex', width: '100%', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#666', fontSize: 20, marginBottom: 8, letterSpacing: 2 }}>ONCHAIN SIGNAL</span>
                                <span style={{ color: '#fff', fontSize: 64, fontWeight: 900 }}>{score}</span>
                            </div>

                            {/* Base Logo (Simplified Circle) */}
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                backgroundColor: '#0052FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'white' }} />
                            </div>
                        </div>

                        {/* Decorative Line */}
                        <div style={{ position: 'absolute', bottom: 40, left: 40, right: 140, height: 2, background: 'linear-gradient(90deg, #0052FF, transparent)' }} />

                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
