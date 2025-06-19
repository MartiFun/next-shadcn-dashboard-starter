import { NextRequest, NextResponse } from 'next/server';

const RADARR_BASE_URL = process.env.NEXT_PUBLIC_RADARR_URL || 'http://192.168.1.128:42651';
const RADARR_API_KEY = process.env.RADARR_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const url = `${RADARR_BASE_URL}/api/v3/diskspace`;
    console.log('Calling Radarr diskspace API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Radarr diskspace API error:', response.status, response.statusText);
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Radarr diskspace response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Radarr API request failed:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'espace disque' },
      { status: 500 }
    );
  }
} 