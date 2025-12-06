import { Metadata } from 'next';
import PublicProfileUI from "./PublicProfileUI";

type Props = {
    params: Promise<{ basename: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { basename } = await params;
    const decodedName = decodeURIComponent(basename);

    return {
        title: `${decodedName} | Identity`,
        description: `Check out ${decodedName}'s Onchain Identity.`,
        openGraph: {
            title: `${decodedName} | Identity`,
            description: `Check out ${decodedName}'s Onchain Identity.`,
            images: [`/api/og?name=${encodeURIComponent(decodedName)}`],
        },
    };
}

export default async function PublicProfilePage({ params }: Props) {
    const { basename } = await params;
    const decodedName = decodeURIComponent(basename);

    return <PublicProfileUI basename={decodedName} />;
}
