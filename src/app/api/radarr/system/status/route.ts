import { NextRequest, NextResponse } from 'next/server';

const RADARR_BASE_URL = process.env.NEXT_PUBLIC_RADARR_URL || 'http://192.168.1.128:42651';
const RADARR_API_KEY = process.env.RADARR_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const url = `${RADARR_BASE_URL}/api/v3/system/status`;
    
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Radarr API request failed:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut système' },
      { status: 500 }
    );
  }
} 