export const BASE_MANIFESTS = [
    "BUILD ON BASE",
    "STAY BASED",
    "THE FUTURE IS ONCHAIN",
    "BRING THE WORLD ONCHAIN",
    "CREATE EVERY DAY",
    "CODE IS LAW",
    "OPTIMISM IS A SUPERPOWER",
    "DECENTRALIZE EVERYTHING",
    "OWN YOUR IDENTITY",
    "INTERNET NATIVE",
    "BASE IS FOR EVERYONE",
    "SIGNAL IN THE NOISE",
    "WAGMI",
    "BUILDERS BUILD",
    "BLUE PILL OR RED PILL?",
    "ONCHAIN IS THE NEW ONLINE"
];

export function getRandomManifest(): string {
    const randomIndex = Math.floor(Math.random() * BASE_MANIFESTS.length);
    return BASE_MANIFESTS[randomIndex];
}
