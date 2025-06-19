import { NextResponse } from 'next/server';

const SONARR_BASE_URL = process.env.NEXT_PUBLIC_SONARR_URL || 'http://192.168.1.128:8989';
const SONARR_API_KEY = process.env.SONARR_API_KEY || '';

export async function GET() {
  if (!SONARR_BASE_URL || !SONARR_API_KEY) {
    return NextResponse.json({ error: 'Sonarr configuration missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`${SONARR_BASE_URL}/api/v3/languageprofile`, {
      headers: {
        'X-Api-Key': SONARR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Sonarr API error: ${response.status} ${response.statusText}`);
    }

    const languageProfiles = await response.json();
    return NextResponse.json(languageProfiles);
  } catch (error) {
    console.error('Error fetching Sonarr language profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch language profiles' }, { status: 500 });
  }
} 