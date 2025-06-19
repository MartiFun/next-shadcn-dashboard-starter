import { NextRequest, NextResponse } from 'next/server';

const RADARR_BASE_URL = process.env.NEXT_PUBLIC_RADARR_URL || 'http://192.168.1.128:42651';
const RADARR_API_KEY = process.env.RADARR_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Utiliser l'endpoint queue/details pour obtenir plus d'informations
    const url = `${RADARR_BASE_URL}/api/v3/queue/details`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug: log the response structure
    console.log('Radarr API queue response:', data);
    
    // Ensure we return an array
    let queueItems = [];
    if (Array.isArray(data)) {
      queueItems = data;
    } else if (data && typeof data === 'object' && 'records' in data) {
      queueItems = data.records || [];
    } else if (data && typeof data === 'object' && 'queue' in data) {
      queueItems = data.queue || [];
    } else {
      console.warn('Unexpected queue response structure from Radarr:', data);
      queueItems = [];
    }
    
    return NextResponse.json(queueItems);
  } catch (error) {
    console.error('Radarr API request failed:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la file d\'attente' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requis pour supprimer de la file d\'attente' },
        { status: 400 }
      );
    }

    const url = `${RADARR_BASE_URL}/api/v3/queue/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Radarr API request failed:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la file d\'attente' },
      { status: 500 }
    );
  }
} 