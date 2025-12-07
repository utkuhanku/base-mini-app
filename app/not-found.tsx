
export const runtime = "nodejs"; // Force Node.js runtime

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
            <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
            <p>Could not find requested resource</p>
            <a href="/" className="mt-8 text-blue-500 hover:underline">
                Return Home
            </a>
        </div>
    );
}
