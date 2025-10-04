import { NextRequest, NextResponse } from 'next/server';

// Interface para inscripciones
interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  enrollmentDate: string;
  progress: number;
  status: 'active' | 'completed' | 'cancelled';
  lastActivity?: string;
}

// Simulación de base de datos de inscripciones
// TODO: Reemplazar con consultas reales a la base de datos
const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: 1,
    userId: 1,
    courseId: 1,
    enrollmentDate: '2024-03-01',
    progress: 65,
    status: 'active',
    lastActivity: '2024-03-15'
  },
  {
    id: 2,
    userId: 1,
    courseId: 2,
    enrollmentDate: '2024-02-15',
    progress: 20,
    status: 'active',
    lastActivity: '2024-03-10'
  }
];

// Cursos disponibles para validación
const AVAILABLE_COURSES = [1, 2, 3, 4, 5, 6];

// POST /api/courses/[id]/enroll - Inscribirse en un curso
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedParams: { id: string } | undefined;
  
  try {
    resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
    
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

    // Verificar si el curso existe
    if (!AVAILABLE_COURSES.includes(courseId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Curso no encontrado',
          message: `No existe un curso con ID ${courseId}`
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario requerido',
          message: 'Se debe proporcionar un ID de usuario'
        },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya está inscrito
    const existingEnrollment = MOCK_ENROLLMENTS.find(
      enrollment => enrollment.userId === userId && enrollment.courseId === courseId
    );

    if (existingEnrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya inscrito',
          message: 'El usuario ya está inscrito en este curso',
          data: existingEnrollment
        },
        { status: 409 }
      );
    }

    // Crear nueva inscripción
    const newEnrollment: Enrollment = {
      id: MOCK_ENROLLMENTS.length + 1,
      userId,
      courseId,
      enrollmentDate: new Date().toISOString().split('T')[0],
      progress: 0,
      status: 'active',
      lastActivity: new Date().toISOString().split('T')[0]
    };

    // TODO: Guardar en base de datos real
    MOCK_ENROLLMENTS.push(newEnrollment);

    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      data: newEnrollment,
      message: 'Inscripción exitosa'
    }, { status: 201 });

  } catch (error) {
    console.error(`Error en POST /api/courses/${resolvedParams?.id || 'unknown'}/enroll:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo procesar la inscripción'
      },
      { status: 500 }
    );
  }
}

// GET /api/courses/[id]/enroll - Obtener información de inscripción
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedParams: { id: string } | undefined;
  
  try {
    resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');

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

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario requerido',
          message: 'Se debe proporcionar un ID de usuario'
        },
        { status: 400 }
      );
    }

    // Buscar inscripción del usuario en el curso
    const enrollment = MOCK_ENROLLMENTS.find(
      enroll => enroll.userId === userId && enroll.courseId === courseId
    );

    if (!enrollment) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: 'Usuario no inscrito en este curso'
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollment,
      message: 'Información de inscripción obtenida'
    });

  } catch (error) {
    console.error(`Error en GET /api/courses/${resolvedParams?.id || 'unknown'}/enroll:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la información de inscripción'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/enroll - Cancelar inscripción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let resolvedParams: { id: string } | undefined;
  
  try {
    resolvedParams = await params;
    const courseId = parseInt(resolvedParams.id);
    const body = await request.json();
    const { userId } = body;

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

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario requerido',
          message: 'Se debe proporcionar un ID de usuario'
        },
        { status: 400 }
      );
    }

    // Buscar inscripción
    const enrollmentIndex = MOCK_ENROLLMENTS.findIndex(
      enrollment => enrollment.userId === userId && enrollment.courseId === courseId
    );

    if (enrollmentIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inscripción no encontrada',
          message: 'El usuario no está inscrito en este curso'
        },
        { status: 404 }
      );
    }

    // Marcar como cancelada (soft delete)
    MOCK_ENROLLMENTS[enrollmentIndex].status = 'cancelled';

    return NextResponse.json({
      success: true,
      message: 'Inscripción cancelada exitosamente',
      data: MOCK_ENROLLMENTS[enrollmentIndex]
    });

  } catch (error) {
    console.error(`Error en DELETE /api/courses/${resolvedParams?.id || 'unknown'}/enroll:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo cancelar la inscripción'
      },
      { status: 500 }
    );
  }
}