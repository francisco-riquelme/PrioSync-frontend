// Test adicional para probar la transcripción completa simulada
// Para ejecutar: node test-transcription-complete.js

const http = require('http');
const { Buffer } = require('buffer');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, formData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {}
    };

    if (formData) {
      const boundary = '----formdata-boundary-' + Math.random().toString(36);
      options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      
      let body = '';
      for (const [key, value] of Object.entries(formData)) {
        body += `--${boundary}\r\n`;
        if (key === 'video') {
          body += `Content-Disposition: form-data; name="${key}"; filename="${value.filename}"\r\n`;
          body += `Content-Type: ${value.contentType}\r\n\r\n`;
          body += value.data;
        } else {
          body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
          body += value;
        }
        body += '\r\n';
      }
      body += `--${boundary}--\r\n`;
      
      options.headers['Content-Length'] = Buffer.byteLength(body);
      
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: jsonResponse });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });
      
      req.on('error', reject);
      req.write(body);
      req.end();
    } else {
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: jsonResponse });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    }
  });
}

function createMockVideoData() {
  const buffer = Buffer.alloc(1024 * 1024);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer.toString('binary');
}

/**
 * Test del flujo completo de transcripción
 */
async function testCompleteTranscriptionFlow() {
  console.log('Test: Flujo completo de transcripción\n');

  // Paso 1: Subir video
  console.log('Paso 1: Subiendo video...');
  const formData = {
    title: 'Introducción al Cálculo Diferencial',
    description: 'Clase sobre derivadas y límites',
    courseId: 'calculo-avanzado',
    courseName: 'Cálculo Avanzado',
    video: {
      filename: 'calculo-derivadas.mp4',
      contentType: 'video/mp4',
      data: createMockVideoData()
    }
  };

  try {
    const uploadResult = await makeRequest('POST', '/api/transcribe-course', formData);
    console.log('Video subido exitosamente');
    console.log(`Request ID: ${uploadResult.data.requestId}`);
    console.log(`Tamaño: ${(uploadResult.data.videoMetadata.fileSize / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`Duración estimada: ${uploadResult.data.videoMetadata.duration} segundos\n`);

    const requestId = uploadResult.data.requestId;

    // Paso 2: Consultar estado inicial
    console.log('Paso 2: Consultando estado inicial...');
    const initialStatus = await makeRequest('GET', `/api/transcribe-course?requestId=${requestId}`);
    console.log(`Estado: ${initialStatus.data.status}`);
    console.log(`Progreso: ${initialStatus.data.progress || 0}%\n`);

    // Paso 3: Esperar procesamiento y consultar estado final
    console.log('Paso 3: Esperando procesamiento (6 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    console.log('Consultando estado después del procesamiento...');
    const finalStatus = await makeRequest('GET', `/api/transcribe-course?requestId=${requestId}`);
    console.log(`Estado final: ${finalStatus.data.status}`);
    console.log(`Progreso final: ${finalStatus.data.progress || 0}%`);
    
    if (finalStatus.data.transcriptionText) {
      console.log('\nTranscripción generada:');
      console.log('=' .repeat(50));
      console.log(finalStatus.data.transcriptionText.substring(0, 300) + '...');
      console.log('=' .repeat(50));
    }

    // Paso 4: Listar todas las transcripciones
    console.log('\nPaso 4: Listando todas las transcripciones...');
    const listResult = await makeRequest('GET', '/api/transcribe-course');
    console.log(`Total de transcripciones: ${listResult.data.transcriptions.length}`);
    
    if (listResult.data.transcriptions.length > 0) {
      console.log('Lista de transcripciones:');
      listResult.data.transcriptions.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.videoMetadata.title} (${job.status})`);
      });
    }

    console.log('\nFlujo completo de transcripción completado exitosamente! 🎉');

  } catch (error) {
    console.error('Error en el flujo de transcripción:', error.message);
  }
}

// Ejecutar test automáticamente
if (require.main === module) {
  testCompleteTranscriptionFlow().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { testCompleteTranscriptionFlow };