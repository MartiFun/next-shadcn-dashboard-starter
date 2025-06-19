import { NextRequest, NextResponse } from 'next/server';

const SONARR_BASE_URL = process.env.NEXT_PUBLIC_SONARR_URL || 'http://192.168.1.128:8989';
const SONARR_API_KEY = process.env.SONARR_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les séries sans pagination
    const url = `${SONARR_BASE_URL}/api/v3/series`;
    console.log('Calling Sonarr series API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': SONARR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Sonarr series API error:', response.status, response.statusText);
      throw new Error(`Sonarr API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Sonarr series response: ${data.length || 0} series received`);
    
    // Traiter les images pour s'assurer qu'elles ont les bonnes URLs
    const processedData = Array.isArray(data) ? data.map(series => ({
      ...series,
      images: series.images?.map((image: any) => ({
        ...image,
        url: image.url ? `${SONARR_BASE_URL}${image.url}` : image.url,
        remoteUrl: image.remoteUrl || image.url
      })) || []
    })) : data;
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Sonarr API request failed:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des séries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!SONARR_BASE_URL || !SONARR_API_KEY) {
    return NextResponse.json({ error: 'Sonarr configuration missing' }, { status: 500 });
  }

  try {
    const seriesData = await request.json();
    
    console.log('Adding series to Sonarr:', seriesData);

    const response = await fetch(`${SONARR_BASE_URL}/api/v3/series`, {
      method: 'POST',
      headers: {
        'X-Api-Key': SONARR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seriesData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sonarr API error:', response.status, errorText);
      throw new Error(`Sonarr API error: ${response.status} ${response.statusText}`);
    }

    const addedSeries = await response.json();
    console.log('Series added successfully:', addedSeries);
    
    return NextResponse.json(addedSeries);
  } catch (error) {
    console.error('Error adding series to Sonarr:', error);
    return NextResponse.json({ error: 'Failed to add series' }, { status: 500 });
  }
} 