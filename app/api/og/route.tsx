import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const hasName = searchParams.has('name');
        const name = hasName ? searchParams.get('name')?.slice(0, 20) : 'Identity';

        // Font loading
        const interBold = await fetch(
            new URL('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff')
        ).then((res) => res.arrayBuffer());

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
                        backgroundColor: '#000000', // Pure Black
                        backgroundImage: 'radial-gradient(circle at 50% 100%, #0052FF 0%, transparent 50%)', // Cool bottom glow
                        fontFamily: '"Inter", sans-serif',
                    }}
                >
                    {/* Logo Section */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 50,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 120,
                                fontWeight: 900,
                                color: 'white',
                                letterSpacing: '-6px',
                                lineHeight: 1,
                                marginRight: 20,
                            }}
                        >
                            IDENTITY
                        </span>
                        {/* Base Square Mark */}
                        <div
                            style={{
                                width: 90,
                                height: 90,
                                backgroundColor: '#0052FF',
                                borderRadius: 12, // Slightly rounded square
                            }}
                        />
                    </div>

                    {/* User Name Pill */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            borderRadius: 100,
                            padding: '24px 80px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 60,
                                color: '#FFFFFF',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                letterSpacing: '-1px',
                            }}
                        >
                            {name?.toUpperCase()}
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            bottom: 60,
                            fontSize: 30,
                            color: '#666666',
                            fontWeight: 500,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Create your Identity on Base
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'Inter',
                        data: interBold,
                        style: 'normal',
                        weight: 700,
                    },
                ],
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
