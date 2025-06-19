import { NextResponse } from 'next/server';

const RADARR_BASE_URL = process.env.NEXT_PUBLIC_RADARR_URL || 'http://192.168.1.128:42651';
const RADARR_API_KEY = process.env.RADARR_API_KEY || '';

export async function GET() {
  if (!RADARR_BASE_URL || !RADARR_API_KEY) {
    return NextResponse.json({ error: 'Radarr configuration missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`${RADARR_BASE_URL}/api/v3/qualityprofile`, {
      headers: {
        'X-Api-Key': RADARR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
    }

    const qualityProfiles = await response.json();
    return NextResponse.json(qualityProfiles);
  } catch (error) {
    console.error('Error fetching quality profiles from Radarr:', error);
    return NextResponse.json({ error: 'Failed to fetch quality profiles' }, { status: 500 });
  }
} 