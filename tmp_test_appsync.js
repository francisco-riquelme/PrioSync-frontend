/* eslint-disable @typescript-eslint/no-require-imports */
(async function(){
  try{
    const amplify = require('./amplify_outputs.json');
    const url = process.env.NEXT_PUBLIC_APPSYNC_URL || (amplify && amplify.data && amplify.data.url);
    const key = process.env.NEXT_PUBLIC_APPSYNC_API_KEY || (amplify && amplify.data && amplify.data.api_key);

    if (!url || !key) {
      console.error('Faltan NEXT_PUBLIC_APPSYNC_URL o NEXT_PUBLIC_APPSYNC_API_KEY y tampoco están en amplify_outputs.json');
      process.exit(1);
    }

    console.log('Usando AppSync URL:', url);

    const doFetch = async (payload) => {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
        },
        body: JSON.stringify(payload),
      });
      const text = await resp.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* ignore */ }
      return { status: resp.status, ok: resp.ok, text, parsed };
    };

    const moduloId = 'test-mod-1';

    // 1) Query puedeGenerarQuestionario
    const query = `query PuedeGenerarQuestionario($moduloId: ID!) { puedeGenerarQuestionario(moduloId: $moduloId) { canGenerate reason } }`;
    console.log('\n=== Ejecutando query PuedeGenerarQuestionario ===');
    const q = await doFetch({ query, variables: { moduloId } });
    console.log('HTTP status:', q.status, 'ok:', q.ok);
    console.log('Raw response:', q.text);
    if (q.parsed && q.parsed.errors) console.log('GraphQL errors:', JSON.stringify(q.parsed.errors, null, 2));
    if (q.parsed && q.parsed.data) console.log('Data:', JSON.stringify(q.parsed.data, null, 2));

    // 2) Mutation crearQuestionario
    const mutation = `mutation CrearQuestionario($moduloId: ID!) { crearQuestionario(moduloId: $moduloId) { cuestionarioId titulo tipo } }`;
    console.log('\n=== Ejecutando mutation crearQuestionario ===');
    const m = await doFetch({ query: mutation, variables: { moduloId } });
    console.log('HTTP status:', m.status, 'ok:', m.ok);
    console.log('Raw response:', m.text);
    if (m.parsed && m.parsed.errors) console.log('GraphQL errors:', JSON.stringify(m.parsed.errors, null, 2));
    if (m.parsed && m.parsed.data) console.log('Data:', JSON.stringify(m.parsed.data, null, 2));

    // Si la mutación dio FieldUndefined, intentar con crearQuestionarioResolver
    const errores = (m.parsed && m.parsed.errors) || [];
    const hasFieldUndefined = errores.some(e => (e.message || '').includes('FieldUndefined') && (e.message || '').includes('crearQuestionario'));
    if (hasFieldUndefined) {
    const altMutation = `mutation CrearQuestionarioResolver($moduloId: String!) { crearQuestionarioResolver(moduloId: $moduloId) { message } }`;
      console.log('\n=== Intentando mutation alternativa crearQuestionarioResolver ===');
  const ma = await doFetch({ query: altMutation, variables: { moduloId: String(moduloId) } });
      console.log('HTTP status:', ma.status, 'ok:', ma.ok);
      console.log('Raw response:', ma.text);
      if (ma.parsed && ma.parsed.errors) console.log('GraphQL errors (alt):', JSON.stringify(ma.parsed.errors, null, 2));
      if (ma.parsed && ma.parsed.data) console.log('Data (alt):', JSON.stringify(ma.parsed.data, null, 2));
    }

    process.exit(0);
  }catch(err){
    console.error('Error en script:', err);
    process.exit(2);
  }
})();
