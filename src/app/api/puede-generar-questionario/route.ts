import { NextResponse } from 'next/server';

const APPSYNC_URL = process.env.APPSYNC_URL;
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const moduloId = url.searchParams.get('moduloId');

    if (!moduloId) return NextResponse.json({ message: 'moduloId is required' }, { status: 400 });

    const missing: string[] = [];
    if (!APPSYNC_URL) missing.push('APPSYNC_URL');
    if (!APPSYNC_API_KEY) missing.push('APPSYNC_API_KEY');
    if (missing.length > 0) {
      return NextResponse.json({ message: 'AppSync not configured', missing }, { status: 500 });
    }

    const query = `query PuedeGenerarQuestionario($moduloId: ID!) { puedeGenerarQuestionario(moduloId: $moduloId) { canGenerate reason } }`;

    const appsyncUrl = APPSYNC_URL as string;
    const appsyncApiKey = APPSYNC_API_KEY as string;

    const resp = await fetch(appsyncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': appsyncApiKey,
      },
      body: JSON.stringify({ query, variables: { moduloId } }),
    });

    const json = await resp.json();

    if (json.errors) {
      return NextResponse.json({ message: json.errors[0]?.message || 'GraphQL error' }, { status: 500 });
    }

    const data = json.data?.puedeGenerarQuestionario || {};
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
