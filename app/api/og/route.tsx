import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const hasName = searchParams.has('name');
        const name = hasName ? searchParams.get('name')?.slice(0, 20) : 'Identity'; // Cap length

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
                        backgroundColor: '#0052FF', // Base Blue Background
                        color: 'white',
                        fontFamily: 'sans-serif',
                        position: 'relative',
                    }}
                >
                    {/* Decorative Circle */}
                    <div
                        style={{
                            position: 'absolute',
                            top: -150,
                            left: -150,
                            width: 600,
                            height: 600,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                        }}
                    />

                    {/* Card Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#1E1E1E', // Anthracite Card
                            borderRadius: 40,
                            padding: '40px 80px',
                            border: '4px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            transform: 'scale(1.2)',
                        }}
                    >
                        {/* Logo/Header */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: '#0052FF',
                                    marginRight: 15,
                                }}
                            />
                            <span style={{ fontSize: 30, color: '#AAAAAA' }}>BASE IDENTITY</span>
                        </div>

                        {/* Name */}
                        <div
                            style={{
                                fontSize: 80,
                                fontWeight: 'bold',
                                color: 'white',
                                marginBottom: 10,
                                textAlign: 'center',
                                maxWidth: 800,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {name?.toUpperCase()}
                        </div>

                        {/* Subtitle */}
                        <div
                            style={{
                                fontSize: 30,
                                color: '#666666',
                                marginTop: 20,
                            }}
                        >
                            ONCHAIN VERIFIED
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 40,
                            fontSize: 24,
                            color: 'rgba(255,255,255,0.6)',
                        }}
                    >
                        Create yours on Base
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
