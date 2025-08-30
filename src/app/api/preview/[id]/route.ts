import { NextRequest, NextResponse } from 'next/server';
import { getComponent } from '@/utils/actions';

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
    console.error(`Error in GET /api/preview/${(await params).id}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}