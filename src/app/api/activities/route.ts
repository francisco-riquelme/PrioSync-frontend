import { NextRequest, NextResponse } from "next/server";

interface Activity {
  id: number;
  title: string;
  description?: string;
  createdAt: string;
  completed?: boolean;
}

// GET /api/activities
export async function GET(request: NextRequest) {
  console.log("GET /api/activities", request);
  try {
    const activities: Activity[] = [];
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error al obtener actividades:", error);
    return NextResponse.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    );
  }
}

// POST /api/activities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newActivity: Activity = {
      id: Date.now(),
      title: body.title || "Nueva Actividad",
      description: body.description,
      createdAt: new Date().toISOString(),
      completed: body.completed || false,
    };

    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error("Error al crear actividad:", error);
    return NextResponse.json(
      { error: "Error al crear actividad" },
      { status: 500 }
    );
  }
}
