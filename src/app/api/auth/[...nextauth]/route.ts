// NextAuth removed in Firebase migration; keep route as 404
export function GET() {
  return new Response("Not Found", { status: 404 });
}
export function POST() {
  return new Response("Not Found", { status: 404 });
}


