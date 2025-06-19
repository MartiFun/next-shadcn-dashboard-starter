import { NextRequest, NextResponse } from 'next/server';

const SONARR_BASE_URL = process.env.NEXT_PUBLIC_SONARR_URL || 'http://192.168.1.128:8989';
const SONARR_API_KEY = process.env.SONARR_API_KEY || '';

export async function GET() {
  if (!SONARR_BASE_URL || !SONARR_API_KEY) {
    return NextResponse.json({ error: 'Sonarr configuration missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`${SONARR_BASE_URL}/api/v3/queue/details`, {
      headers: {
        'X-Api-Key': SONARR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Sonarr API error: ${response.status} ${response.statusText}`);
    }

    const queue = await response.json();
    
    // Debug: log the response structure
    console.log('Sonarr API queue response:', queue);
    
    // Ensure we return an array
    let queueItems = [];
    if (Array.isArray(queue)) {
      queueItems = queue;
    } else if (queue && typeof queue === 'object' && 'records' in queue) {
      queueItems = queue.records || [];
    } else if (queue && typeof queue === 'object' && 'queue' in queue) {
      queueItems = queue.queue || [];
    } else {
      console.warn('Unexpected queue response structure from Sonarr:', queue);
      queueItems = [];
    }
    
    return NextResponse.json(queueItems);
  } catch (error) {
    console.error('Error fetching Sonarr queue:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!SONARR_BASE_URL || !SONARR_API_KEY) {
    return NextResponse.json({ error: 'Sonarr configuration missing' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Queue item ID is required' }, { status: 400 });
    }

    const response = await fetch(`${SONARR_BASE_URL}/api/v3/queue/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Api-Key': SONARR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Sonarr API error: ${response.status} ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from Sonarr queue:', error);
    return NextResponse.json({ error: 'Failed to remove from queue' }, { status: 500 });
  }
} 