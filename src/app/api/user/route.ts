import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: number;
  email: string;
  name?: string;
  createdAt: string;
}

// GET /api/user
export async function GET(request: NextRequest) {
  try {
    const users: User[] = [];
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST /api/user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newUser: User = {
      id: Date.now(),
      email: body.email || '',
      name: body.name,
      createdAt: new Date().toISOString(),
    };
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
