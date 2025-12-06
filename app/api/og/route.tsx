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
                            }}
                        >
    { name?.toUpperCase() }
                        </div >
                    </div >

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
                </div >
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
