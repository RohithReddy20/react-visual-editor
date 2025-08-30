import { NextRequest, NextResponse } from 'next/server';
import { createComponent, initializeDatabase } from '@/utils/actions';

// Initialize database on startup
initializeDatabase().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    const component = await createComponent(code, name);
    
    return NextResponse.json({
      success: true,
      data: component
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/component:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}