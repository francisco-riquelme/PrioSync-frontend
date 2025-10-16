import { NextResponse } from 'next/server';

const APPSYNC_URL = process.env.APPSYNC_URL;
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY;

export async function POST(req: Request) {
  try {
    const missing: string[] = [];
    if (!APPSYNC_URL) missing.push('APPSYNC_URL');
    if (!APPSYNC_API_KEY) missing.push('APPSYNC_API_KEY');
    if (missing.length > 0) {
      return NextResponse.json({ message: 'AppSync not configured', missing }, { status: 500 });
    }

    const body = await req.json();
    const { moduloId } = body || {};

    if (!moduloId) return NextResponse.json({ message: 'moduloId is required' }, { status: 400 });

    const mutation = `mutation CrearQuestionario($moduloId: ID!) { crearQuestionario(moduloId: $moduloId) { cuestionarioId titulo tipo } }`;

    const appsyncUrl = APPSYNC_URL as string;
    const appsyncApiKey = APPSYNC_API_KEY as string;

    const resp = await fetch(appsyncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': appsyncApiKey,
      },
      body: JSON.stringify({ query: mutation, variables: { moduloId } }),
    });

    const json = await resp.json();
    if (json.errors) {
      return NextResponse.json({ message: json.errors[0]?.message || 'GraphQL error' }, { status: 500 });
    }

    return NextResponse.json(json.data?.crearQuestionario || {});
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
