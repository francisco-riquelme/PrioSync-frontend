import { NextRequest, NextResponse } from 'next/server';

// Interface para los cursos (reutilizada del archivo principal)
interface Course {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number;
  nivel_dificultad: 'basico' | 'intermedio' | 'avanzado';
  estado: 'activo' | 'inactivo';
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  instructor?: string;
  categoria?: string;
  precio?: number;
  descuento?: number;
  lecciones?: unknown[];
  modulos?: unknown[];
}

// Datos de ejemplo extendidos con detalles específicos
// TODO: Reemplazar con consultas reales a la base de datos
const DETAILED_COURSES: { [key: number]: Course } = {
  1: {
    id_curso: 1,
    titulo: 'Cálculo Avanzado',
    descripcion: 'Curso completo de cálculo diferencial e integral con aplicaciones prácticas. Incluye límites, derivadas, integrales y ecuaciones diferenciales.',
    imagen_portada: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800,
    nivel_dificultad: 'intermedio',
    estado: 'activo',
    fecha_creacion: '2024-01-15',
    fecha_actualizacion: '2024-03-01',
    instructor: 'Dr. María González',
    categoria: 'Matemáticas',
    precio: 99.99,
    modulos: [
      { id: 1, titulo: 'Introducción al Cálculo', duracion: 300 },
      { id: 2, titulo: 'Límites y Continuidad', duracion: 450 },
      { id: 3, titulo: 'Derivadas', duracion: 540 },
      { id: 4, titulo: 'Integrales', duracion: 510 }
    ]
  },
  2: {
    id_curso: 2,
    titulo: 'Desarrollo de Software',
    descripcion: 'Fundamentos de programación y desarrollo de aplicaciones modernas usando tecnologías actuales como React, Node.js y bases de datos.',
    imagen_portada: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 2400,
    nivel_dificultad: 'basico',
    estado: 'activo',
    fecha_creacion: '2024-02-01',
    fecha_actualizacion: '2024-03-05',
    instructor: 'Ing. Carlos Pérez',
    categoria: 'Tecnología',
    precio: 149.99,
    modulos: [
      { id: 1, titulo: 'Fundamentos de Programación', duracion: 600 },
      { id: 2, titulo: 'Frontend con React', duracion: 720 },
      { id: 3, titulo: 'Backend con Node.js', duracion: 660 },
      { id: 4, titulo: 'Bases de Datos', duracion: 420 }
    ]
  },
  3: {
    id_curso: 3,
    titulo: 'Inteligencia Artificial',
    descripcion: 'Introducción completa a machine learning y redes neuronales con Python. Incluye algoritmos, frameworks y proyectos prácticos.',
    imagen_portada: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 3600,
    nivel_dificultad: 'avanzado',
    estado: 'activo',
    fecha_creacion: '2024-03-10',
    instructor: 'PhD. Ana Rodríguez',
    categoria: 'Inteligencia Artificial',
    precio: 199.99,
    modulos: [
      { id: 1, titulo: 'Fundamentos de IA', duracion: 480 },
      { id: 2, titulo: 'Machine Learning', duracion: 900 },
      { id: 3, titulo: 'Deep Learning', duracion: 1080 },
      { id: 4, titulo: 'Proyectos Prácticos', duracion: 1140 }
    ]
  }
};

// GET /api/courses/[id] - Obtener detalles de un curso específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de curso inválido',
          message: 'El ID debe ser un número entero'
        },
        { status: 400 }
      );
    }

    // Buscar curso en datos simulados
    const course = DETAILED_COURSES[courseId];
    
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso no encontrado',
          message: `No existe un curso con ID ${courseId}`
        },
        { status: 404 }
      );
    }

    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 150));

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Curso obtenido exitosamente'
    });

  } catch (error) {
    console.error(`Error en GET /api/courses/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el curso'
      },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Actualizar un curso específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de curso inválido',
          message: 'El ID debe ser un número entero'
        },
        { status: 400 }
      );
    }

    const course = DETAILED_COURSES[courseId];
    
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso no encontrado',
          message: `No existe un curso con ID ${courseId}`
        },
        { status: 404 }
      );
    }

    const updateData = await request.json();
    
    // Actualizar campos permitidos
    const allowedFields = ['titulo', 'descripcion', 'imagen_portada', 'duracion_estimada', 'nivel_dificultad', 'estado', 'instructor', 'categoria', 'precio'];
    const updatedCourse = { ...course };
    
    allowedFields.forEach(field => {
      if (field in updateData) {
        (updatedCourse as Record<string, unknown>)[field] = updateData[field];
      }
    });
    
    updatedCourse.fecha_actualizacion = new Date().toISOString().split('T')[0];
    
    // TODO: Actualizar en base de datos real
    DETAILED_COURSES[courseId] = updatedCourse;

    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: 'Curso actualizado exitosamente'
    });

  } catch (error) {
    console.error(`Error en PUT /api/courses/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el curso'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Eliminar un curso específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de curso inválido',
          message: 'El ID debe ser un número entero'
        },
        { status: 400 }
      );
    }

    const course = DETAILED_COURSES[courseId];
    
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso no encontrado',
          message: `No existe un curso con ID ${courseId}`
        },
        { status: 404 }
      );
    }

    // TODO: Eliminar de base de datos real (soft delete recomendado)
    delete DETAILED_COURSES[courseId];

    return NextResponse.json({
      success: true,
      message: 'Curso eliminado exitosamente',
      data: { id_curso: courseId }
    });

  } catch (error) {
    console.error(`Error en DELETE /api/courses/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el curso'
      },
      { status: 500 }
    );
  }
}