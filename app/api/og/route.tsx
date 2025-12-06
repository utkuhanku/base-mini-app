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
                        backgroundColor: '#1E1E1E',
                        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(0, 82, 255, 0.2) 0%, transparent 50%)',
                        fontFamily: '"Inter", sans-serif',
                    }}
                >
                    {/* Logo Section */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 40,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 100,
                                fontWeight: 900,
                                color: 'white',
                                letterSpacing: '-4px',
                                lineHeight: 1,
                            }}
                        >
                            IDENTITY
                        </span>
                        <span
                            style={{
                                fontSize: 100,
                                fontWeight: 900,
                                color: '#0052FF',
                                lineHeight: 1,
                            }}
                        >
                            .
                        </span>
                    </div>

                    {/* User Name Pill */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 50,
                            padding: '20px 60px',
                            border: '2px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 50,
                                color: '#FFFFFF',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {name?.toUpperCase()}
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            bottom: 40,
                            fontSize: 24,
                            color: '#AAAAAA',
                            fontWeight: 500,
                            letterSpacing: '1px',
                        }}
                    >
                        Hadi gelin ve Identity&apos;nizi yaratın
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
