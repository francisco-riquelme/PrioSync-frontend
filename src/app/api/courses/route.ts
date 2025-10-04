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
      precio: body.precio || 0
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