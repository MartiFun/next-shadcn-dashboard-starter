import { NextRequest, NextResponse } from 'next/server';

const RADARR_BASE_URL = process.env.NEXT_PUBLIC_RADARR_URL || 'http://192.168.1.128:42651';
const RADARR_API_KEY = process.env.RADARR_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les films sans pagination
    const url = `${RADARR_BASE_URL}/api/v3/movie`;
    console.log('Calling Radarr movies API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Radarr movies API error:', response.status, response.statusText);
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Radarr movies response: ${data.length || 0} movies received`);
    
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
      { error: 'Erreur lors de la récupération des films' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!RADARR_BASE_URL || !RADARR_API_KEY) {
    return NextResponse.json({ error: 'Radarr configuration missing' }, { status: 500 });
  }

  try {
    const movieData = await request.json();
    
    console.log('Adding movie to Radarr:', movieData);

    const response = await fetch(`${RADARR_BASE_URL}/api/v3/movie`, {
      method: 'POST',
      headers: {
        'X-Api-Key': RADARR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Radarr API error:', response.status, errorText);
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
    }

    const addedMovie = await response.json();
    console.log('Movie added successfully:', addedMovie);
    
    return NextResponse.json(addedMovie);
  } catch (error) {
    console.error('Error adding movie to Radarr:', error);
    return NextResponse.json({ error: 'Failed to add movie' }, { status: 500 });
  }
} 