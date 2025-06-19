import { NextRequest, NextResponse } from 'next/server';

const RADARR_BASE_URL = process.env.NEXT_PUBLIC_RADARR_URL || 'http://192.168.1.128:42651';
const RADARR_API_KEY = process.env.RADARR_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    
    const url = `${RADARR_BASE_URL}/api/v3/wanted/missing?page=${page}&pageSize=${pageSize}`;
    console.log('Calling Radarr missing movies API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Radarr missing movies API error:', response.status, response.statusText);
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Radarr missing movies response: ${data.length || 0} movies received`);
    
    // Traiter les images pour s'assurer qu'elles ont les bonnes URLs
    const processedData = Array.isArray(data) ? data.map(movie => ({
      ...movie,
      images: movie.images?.map((image: any) => ({
        ...image,
        url: image.url ? `${RADARR_BASE_URL}${image.url}` : image.url,
        remoteUrl: image.remoteUrl || image.url
      })) || []
    })) : data;
    
    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Radarr API request failed:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des films manquants' },
      { status: 500 }
    );
  }
} 