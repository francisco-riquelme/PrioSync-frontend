import { NextRequest, NextResponse } from 'next/server';

// Interface para los cursos
interface Course {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number; // en minutos
  nivel_dificultad: 'basico' | 'intermedio' | 'avanzado';
  estado: 'activo' | 'inactivo';
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  instructor?: string;
  categoria?: string;
  precio?: number;
  descuento?: number;
  // Campos para cursos generados desde YouTube
  source?: string;
  playlist_id?: string;
  generated_structure?: unknown;
  tags?: string[];
  objectives?: string[];
}

// Datos de ejemplo para simular una base de datos
// TODO: Reemplazar con consultas reales a la base de datos
const MOCK_COURSES: Course[] = [
  {
    id_curso: 1,
    titulo: 'Cálculo Avanzado',
    descripcion: 'Curso completo de cálculo diferencial e integral con aplicaciones prácticas.',
    imagen_portada: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800, // 30 horas
    nivel_dificultad: 'intermedio',
    estado: 'activo',
    fecha_creacion: '2024-01-15',
    instructor: 'Dr. María González',
    categoria: 'Matemáticas',
    precio: 99.99
  },
  {
    id_curso: 2,
    titulo: 'Desarrollo de Software',
    descripcion: 'Fundamentos de programación y desarrollo de aplicaciones modernas.',
    imagen_portada: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 2400, // 40 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
    fecha_creacion: '2024-02-01',
    instructor: 'Ing. Carlos Pérez',
    categoria: 'Tecnología',
    precio: 149.99
  },
  {
    id_curso: 3,
    titulo: 'Inteligencia Artificial',
    descripcion: 'Introducción a machine learning y redes neuronales con Python.',
    imagen_portada: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 3600, // 60 horas
    nivel_dificultad: 'avanzado',
    estado: 'activo',
    fecha_creacion: '2024-03-10',
    instructor: 'PhD. Ana Rodríguez',
    categoria: 'Inteligencia Artificial',
    precio: 199.99
  },
  {
    id_curso: 4,
    titulo: 'Gestión de Proyectos',
    descripcion: 'Metodologías ágiles y gestión efectiva de proyectos empresariales.',
    imagen_portada: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1200, // 20 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
    fecha_creacion: '2024-01-20',
    instructor: 'MBA. Luis Hernández',
    categoria: 'Negocios',
    precio: 79.99
  },
  {
    id_curso: 5,
    titulo: 'Diseño de UX/UI',
    descripcion: 'Principios de diseño centrado en el usuario y creación de interfaces.',
    imagen_portada: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800, // 30 horas
    nivel_dificultad: 'intermedio',
    estado: 'activo',
    fecha_creacion: '2024-02-15',
    instructor: 'Diseñadora Laura Jiménez',
    categoria: 'Diseño',
    precio: 119.99
  },
  {
    id_curso: 6,
    titulo: 'Marketing Digital',
    descripcion: 'Estrategias de marketing online y publicidad en redes sociales.',
    imagen_portada: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1500, // 25 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
    fecha_creacion: '2024-03-01',
    instructor: 'Mkt. Roberto Silva',
    categoria: 'Marketing',
    precio: 89.99
  },
  // ✅ Curso de ejemplo con estructura YouTube para testing
  {
    id_curso: 7,
    titulo: 'Curso de JavaScript Desde YouTube',
    descripcion: 'Curso completo de JavaScript creado desde una playlist de YouTube con estructura generada por IA.',
    imagen_portada: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
    duracion_estimada: 180, // 3 horas
    nivel_dificultad: 'intermedio',
    estado: 'activo',
    fecha_creacion: '2024-03-15',
    instructor: 'Canal Desarrollo',
    categoria: 'Programación',
    precio: 0,
    // Campos específicos de YouTube
    source: 'youtube',
    playlist_id: 'PLtest123',
    generated_structure: {
      title: 'Curso de JavaScript Desde YouTube',
      description: 'Curso completo de JavaScript creado desde una playlist de YouTube con estructura generada por IA.',
      modules: [
        {
          id: 'modulo-1',
          title: 'Fundamentos de JavaScript',
          description: 'Conceptos básicos y sintaxis fundamental',
          order: 1,
          estimatedDuration: '1h 30m',
          lessons: [
            {
              id: 'leccion-1',
              title: 'Introducción a JavaScript',
              description: 'Qué es JavaScript y cómo funciona',
              order: 1,
              youtubeVideoId: 'dQw4w9WgXcQ',
              duration: '25m',
              objectives: ['Entender qué es JavaScript', 'Configurar el entorno de desarrollo'],
              keyTopics: ['Variables', 'Sintaxis básica', 'Consola del navegador']
            },
            {
              id: 'leccion-2',
              title: 'Variables y Tipos de Datos',
              description: 'Declaración de variables y tipos primitivos',
              order: 2,
              youtubeVideoId: 'dQw4w9WgXcQ',
              duration: '30m',
              objectives: ['Declarar variables correctamente', 'Identificar tipos de datos'],
              keyTopics: ['let, const, var', 'Number, String, Boolean', 'typeof operator']
            },
            {
              id: 'leccion-3',
              title: 'Operadores y Expresiones',
              description: 'Operadores aritméticos, lógicos y de comparación',
              order: 3,
              youtubeVideoId: 'dQw4w9WgXcQ', 
              duration: '35m',
              objectives: ['Usar operadores correctamente', 'Crear expresiones complejas'],
              keyTopics: ['Operadores aritméticos', 'Operadores lógicos', 'Precedencia']
            }
          ]
        },
        {
          id: 'modulo-2',
          title: 'Control de Flujo',
          description: 'Estructuras condicionales y bucles',
          order: 2,
          estimatedDuration: '1h 30m',
          lessons: [
            {
              id: 'leccion-4',
              title: 'Condicionales if/else',
              description: 'Toma de decisiones en el código',
              order: 1,
              youtubeVideoId: 'dQw4w9WgXcQ',
              duration: '28m',
              objectives: ['Implementar lógica condicional', 'Usar operadores de comparación'],
              keyTopics: ['if statement', 'else clause', 'else if', 'ternary operator']
            },
            {
              id: 'leccion-5',
              title: 'Bucles for y while',
              description: 'Repetición de código con bucles',
              order: 2,
              youtubeVideoId: 'dQw4w9WgXcQ',
              duration: '32m',
              objectives: ['Crear bucles eficientes', 'Evitar bucles infinitos'],
              keyTopics: ['for loop', 'while loop', 'break y continue', 'for...of']
            },
            {
              id: 'leccion-6',
              title: 'Switch y Cases',
              description: 'Alternativa a múltiples if/else',
              order: 3,
              youtubeVideoId: 'dQw4w9WgXcQ',
              duration: '30m',
              objectives: ['Usar switch correctamente', 'Entender cuándo usar switch vs if'],
              keyTopics: ['switch statement', 'case clauses', 'default case', 'break statement']
            }
          ]
        }
      ],
      tags: ['javascript', 'programación', 'desarrollo web', 'frontend'],
      objectives: [
        'Dominar los fundamentos de JavaScript',
        'Escribir código JavaScript limpio y eficiente',
        'Entender las estructuras de control básicas'
      ]
    },
    tags: ['javascript', 'programación', 'desarrollo web', 'frontend'],
    objectives: [
      'Dominar los fundamentos de JavaScript',
      'Escribir código JavaScript limpio y eficiente',
      'Entender las estructuras de control básicas'
    ]
  }
];

// GET /api/courses - Obtener lista de cursos con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de consulta
    const search = searchParams.get('search')?.toLowerCase() || '';
    const level = searchParams.get('level') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'activo';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filtrar cursos
    const filteredCourses = MOCK_COURSES.filter(course => {
      // Filtro por estado
      if (status && course.estado !== status) return false;
      
      // Filtro por búsqueda (título y descripción)
      if (search) {
        const matchesSearch = course.titulo.toLowerCase().includes(search) ||
                            course.descripcion.toLowerCase().includes(search) ||
                            course.instructor?.toLowerCase().includes(search) || false;
        if (!matchesSearch) return false;
      }
      
      // Filtro por nivel
      if (level && level !== 'todos' && course.nivel_dificultad !== level) return false;
      
      // Filtro por categoría
      if (category && category !== 'todas' && course.categoria !== category) return false;
      
      return true;
    });

    // Paginación
    const total = filteredCourses.length;
    const paginatedCourses = filteredCourses.slice(offset, offset + limit);

    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      data: {
        courses: paginatedCourses,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      message: `Se encontraron ${total} curso(s)`
    });

  } catch (error) {
    console.error('Error en GET /api/courses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los cursos'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses - Crear nuevo curso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validación básica
    const requiredFields = ['titulo', 'descripcion', 'duracion_estimada', 'nivel_dificultad'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos requeridos faltantes',
          missingFields
        },
        { status: 400 }
      );
    }

    // Crear nuevo curso
    const newCourse: Course = {
      id_curso: MOCK_COURSES.length + 1,
      titulo: body.titulo,
      descripcion: body.descripcion,
      imagen_portada: body.imagen_portada || 'https://images.unsplash.com/photo-1546198632-9ef6368bef12?w=400&h=250&fit=crop&auto=format',
      duracion_estimada: body.duracion_estimada,
      nivel_dificultad: body.nivel_dificultad,
      estado: body.estado || 'activo',
      fecha_creacion: new Date().toISOString().split('T')[0],
      instructor: body.instructor || 'Instructor no especificado',
      categoria: body.categoria || 'General',
      precio: body.precio || 0,
      // ✅ Campos específicos para cursos de YouTube
      source: body.source || undefined,
      playlist_id: body.playlist_id || undefined,
      generated_structure: body.generated_structure || undefined,
      tags: body.tags || undefined,
      objectives: body.objectives || undefined
    };

    // TODO: Guardar en base de datos real
    MOCK_COURSES.push(newCourse);

    return NextResponse.json({
      success: true,
      data: newCourse,
      message: 'Curso creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/courses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear el curso'
      },
      { status: 500 }
    );
  }
}

// Método no permitido
export async function PUT() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST para crear cursos.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método no permitido. Use el endpoint específico del curso.' },
    { status: 405 }
  );
}