import { NextRequest, NextResponse } from 'next/server';

const SONARR_BASE_URL = process.env.NEXT_PUBLIC_SONARR_URL || 'http://192.168.1.128:8989';
const SONARR_API_KEY = process.env.SONARR_API_KEY || '';

export async function GET(request: NextRequest) {
  if (!SONARR_BASE_URL || !SONARR_API_KEY) {
    return NextResponse.json({ error: 'Sonarr configuration missing' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    const response = await fetch(`${SONARR_BASE_URL}/api/v3/series/lookup?term=${encodeURIComponent(term)}`, {
      headers: {
        'X-Api-Key': SONARR_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Sonarr API error: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    
    // Traiter les images pour s'assurer qu'elles ont les bonnes URLs
    const processedResults = Array.isArray(results) ? results.map(series => ({
      ...series,
      images: series.images?.map((image: any) => ({
        ...image,
        url: image.url ? `${SONARR_BASE_URL}${image.url}` : image.url,
        remoteUrl: image.remoteUrl || image.url
      })) || []
    })) : results;

    return NextResponse.json(processedResults);
  } catch (error) {
    console.error('Error searching Sonarr series:', error);
    return NextResponse.json({ error: 'Failed to search series' }, { status: 500 });
  }
} 