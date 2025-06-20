import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId');
  const mediaSourceId = searchParams.get('mediaSourceId');
  const index = searchParams.get('index');
  const format = searchParams.get('format') || 'vtt';

  const apiUrl = process.env.NEXT_PUBLIC_EMBY_URL || 'http://192.168.1.128:33297/emby';
  const apiKey = process.env.NEXT_PUBLIC_EMBY_API_KEY || '01c2ba2d27884632a4f30764257aa863';

  if (!itemId || !mediaSourceId || !index) {
    return new NextResponse('Missing required query parameters', { status: 400 });
  }

  const embySubtitleUrl = `${apiUrl}/Videos/${itemId}/${mediaSourceId}/Subtitles/${index}/Stream.${format}?api_key=${apiKey}`;

  try {
    const response = await fetch(embySubtitleUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch subtitles from Emby: ${response.statusText}`, errorText);
      return new NextResponse(`Failed to fetch subtitles from Emby: ${response.statusText}`, { status: response.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/vtt;charset=UTF-8');
    
    // Stream the body
    return new NextResponse(response.body, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error proxying subtitle request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 