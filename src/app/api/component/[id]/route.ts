import { NextRequest, NextResponse } from 'next/server';
import { updateComponent, getComponent } from '@/utils/actions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Component ID is required' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if component exists
    const existingComponent = await getComponent(id);
    if (!existingComponent) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    const updatedComponent = await updateComponent(id, code, name);

    if (!updatedComponent) {
      return NextResponse.json(
        { error: 'Failed to update component' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedComponent
    });

  } catch (error) {
    console.error(`Error in PUT /api/component/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Component ID is required' },
        { status: 400 }
      );
    }

    const component = await getComponent(id);

    if (!component) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: component
    });

  } catch (error) {
    console.error(`Error in GET /api/component/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}