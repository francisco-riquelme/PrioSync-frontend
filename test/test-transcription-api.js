// Script de prueba para la API route /api/transcribe-course
// Para ejecutar: node test-transcription-api.js

import http from 'http';
import { Buffer } from 'buffer';

const BASE_URL = 'http://localhost:3000';

/**
 * Función para hacer requests HTTP con FormData simulado
 */
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
      
      // Construir FormData manualmente
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
            } catch {
              resolve({ status: res.statusCode, data: responseData });
            }
        });
      });
      
      req.on('error', reject);
      req.write(body);
      req.end();
    } else {
      // GET request simple
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
              const jsonResponse = JSON.parse(responseData);
              resolve({ status: res.statusCode, data: jsonResponse });
            } catch {
              resolve({ status: res.statusCode, data: responseData });
            }
        });
      });
      
      req.on('error', reject);
      req.end();
    }
  });
}

/**
 * Crear datos de video simulados
 */
function createMockVideoData() {
  // Crear 1MB de datos binarios simulados
  const buffer = Buffer.alloc(1024 * 1024);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer.toString('binary');
}

/**
 * Test 1: Subida exitosa
 */
async function testSuccessfulUpload() {
  console.log('Test 1: Subida exitosa');
  
  const formData = {
    title: 'Video de Prueba - Cálculo Avanzado',
    description: 'Video explicativo sobre derivadas',
    courseId: 'calculo-avanzado',
    courseName: 'Cálculo Avanzado',
    video: {
      filename: 'test-video.mp4',
      contentType: 'video/mp4',
      data: createMockVideoData()
    }
  };

  try {
    const result = await makeRequest('POST', '/api/transcribe-course', formData);
    console.log('Status:', result.status);
    console.log('Respuesta:', JSON.stringify(result.data, null, 2));
    return result;
  } catch (error) {
    console.error('Error en test de subida exitosa:', error.message);
  }
}

/**
 * Test 2: Error por archivo faltante
 */
async function testMissingFile() {
  console.log('Test 2: Error por archivo faltante');
  
  const formData = {
    title: 'Video Sin Archivo',
    courseId: 'test-course',
    courseName: 'Curso de Prueba'
    // No incluimos el archivo de video
  };

  try {
    const result = await makeRequest('POST', '/api/transcribe-course', formData);
    console.log('Status:', result.status);
    console.log('Error esperado:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Error inesperado:', error.message);
  }
}

/**
 * Test 3: Error por datos faltantes
 */
async function testMissingData() {
  console.log('Test 3: Error por datos faltantes');
  
  const formData = {
    // Solo enviamos el archivo, sin metadatos requeridos
    video: {
      filename: 'test-video.mp4',
      contentType: 'video/mp4',
      data: createMockVideoData()
    }
  };

  try {
    const result = await makeRequest('POST', '/api/transcribe-course', formData);
    console.log('Status:', result.status);
    console.log('Error esperado:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Error inesperado:', error.message);
  }
}

/**
 * Test 4: Error por tipo de archivo no soportado
 */
async function testUnsupportedFileType() {
  console.log('Test 4: Error por tipo de archivo no soportado');
  
  const formData = {
    title: 'Archivo Texto (No Soportado)',
    courseId: 'test-course',
    courseName: 'Curso de Prueba',
    video: {
      filename: 'test.txt',
      contentType: 'text/plain',
      data: 'Esto es un archivo de texto'
    }
  };

  try {
    const result = await makeRequest('POST', '/api/transcribe-course', formData);
    console.log('Status:', result.status);
    console.log('Error esperado:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Error inesperado:', error.message);
  }
}

/**
 * Test 5: Consultar estado de transcripción (GET)
 */
async function testGetTranscriptionStatus() {
  console.log('Test 5: Consultar estado de transcripción');
  
  try {
    const result = await makeRequest('GET', '/api/transcribe-course?requestId=test-123');
    console.log('Status:', result.status);
    console.log('Estado de transcripción:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Error al consultar estado:', error.message);
  }
}

/**
 * Test 6: Listar todas las transcripciones
 */
async function testListTranscriptions() {
  console.log('Test 6: Listar todas las transcripciones');
  
  try {
    const result = await makeRequest('GET', '/api/transcribe-course');
    console.log('Status:', result.status);
    console.log('Lista de transcripciones:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Error al listar transcripciones:', error.message);
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log('Iniciando tests de API /api/transcribe-course\n');
  console.log('Asegúrate de que el servidor Next.js esté corriendo en http://localhost:3000\n');
  
  // Esperar un poco para asegurar conexión
  console.log('Esperando conexión con el servidor...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    await testListTranscriptions();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testGetTranscriptionStatus();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testSuccessfulUpload();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testMissingFile();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testMissingData();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testUnsupportedFileType();
    console.log('\nTests completados exitosamente');
    
  } catch (error) {
    console.error('Error durante la ejecución de tests:', error.message);
    console.log('\nAsegúrate de que:');
    console.log('1. El servidor Next.js esté corriendo (npm run dev)');
    console.log('2. La API route esté en src/app/api/transcribe-course/route.ts');
    console.log('3. No haya errores de compilación en el servidor');
  }
}

// Ejecutar tests automáticamente
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].endsWith('test-transcription-api.js')) {
  runAllTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

export {
  testSuccessfulUpload,
  testMissingFile,
  testMissingData,
  testUnsupportedFileType,
  testGetTranscriptionStatus,
  testListTranscriptions,
  runAllTests
};