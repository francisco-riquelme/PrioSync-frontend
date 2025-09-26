// Script específico para probar la transcripción con logs detallados
import http from 'http';

async function testGeminiTranscription() {
  console.log('Probando transcripción con Gemini 2.5 Flash...\n');
  
  const boundary = '----transcriptiontest' + Math.random().toString(36).slice(2);
  
  const formData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="title"',
    '',
    'Introducción al Cálculo Diferencial',
    `--${boundary}`,
    'Content-Disposition: form-data; name="description"',
    '',
    'Clase sobre conceptos básicos de derivadas y límites',
    `--${boundary}`,
    'Content-Disposition: form-data; name="courseId"',
    '',
    'calculo-2025',
    `--${boundary}`,
    'Content-Disposition: form-data; name="courseName"',
    '',
    'Cálculo Avanzado',
    `--${boundary}`,
    'Content-Disposition: form-data; name="video"; filename="clase-calculo.mp4"',
    'Content-Type: video/mp4',
    '',
    // Simulamos contenido de video pequeño
    Buffer.from('fake-mp4-header-for-testing').toString('binary'),
    `--${boundary}--`,
  ].join('\r\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/transcribe-course',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(formData, 'utf8'),
    }
  };

  return new Promise((resolve, reject) => {
    console.log('Enviando request...');
    
    const req = http.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Response Headers:`, res.headers);
      
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('Raw Response:', body);
        
        try {
          const jsonResponse = JSON.parse(body);
          console.log('Parsed JSON Response:');
          console.log(JSON.stringify(jsonResponse, null, 2));
          
          if (jsonResponse.success && jsonResponse.requestId) {
            console.log('\nTranscripción iniciada exitosamente!');
            console.log(`Request ID: ${jsonResponse.requestId}`);
            
            // Esperar un poco y consultar el estado
            setTimeout(() => {
              checkTranscriptionStatus(jsonResponse.requestId);
            }, 2000);
          }
          
          resolve({ status: res.statusCode, data: jsonResponse });
        } catch (parseError) {
          console.log('Error parsing JSON:', parseError.message);
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error.message);
      reject(error);
    });

    req.write(formData, 'utf8');
    req.end();
  });
}

function checkTranscriptionStatus(requestId) {
  console.log(`\nConsultando estado de transcripción: ${requestId}`);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/transcribe-course?requestId=${requestId}`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        const status = JSON.parse(body);
        console.log('Estado de transcripción:');
        console.log(`   Status: ${status.status}`);
        console.log(`   Progress: ${status.progress}%`);
        
        if (status.transcriptionText) {
          console.log('Transcripción completada:');
          console.log('---');
          console.log(status.transcriptionText.substring(0, 200) + '...');
          console.log('---');
        }
        
        if (status.errorMessage) {
          console.log('Error:', status.errorMessage);
        }
      } catch {
        console.log('Raw status response:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error consultando estado:', error.message);
  });

  req.end();
}

// Ejecutar la prueba
testGeminiTranscription()
  .then(result => {
    console.log(`\nPrueba completada con status: ${result.status}`);
  })
  .catch(error => {
    console.error('\nError en la prueba:', error.message);
  });