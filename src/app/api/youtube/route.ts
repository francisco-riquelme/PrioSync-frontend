import { NextRequest, NextResponse } from 'next/server';
import type { YouTubePlaylistResponse, YouTubePlaylist, YouTubeVideo } from '@/types/youtube';

// Función para validar y extraer el ID de playlist de una URL de YouTube
function extractPlaylistId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Manejar diferentes formatos de URL de YouTube
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('list');
    } else if (urlObj.hostname.includes('youtu.be')) {
      // Para URLs de youtu.be, el ID de playlist puede estar en los parámetros
      return urlObj.searchParams.get('list');
    }
    
    return null;
  } catch {
    return null;
  }
}

// Función para convertir duración ISO 8601 a formato legible
function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Función principal para obtener información de playlist desde YouTube API
async function fetchPlaylistInfo(playlistId: string): Promise<YouTubePlaylist> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key no configurada');
  }

  // 1. Obtener información básica de la playlist
  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
  );

  if (!playlistResponse.ok) {
    throw new Error(`Error al obtener playlist: ${playlistResponse.statusText}`);
  }

  const playlistData = await playlistResponse.json();
  
  if (!playlistData.items || playlistData.items.length === 0) {
    throw new Error('Playlist no encontrada');
  }

  const playlistInfo = playlistData.items[0];

  // 2. Obtener todos los videos de la playlist
  const videos: YouTubeVideo[] = [];
  let nextPageToken = '';
  
  do {
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}&key=${apiKey}`
    );

    if (!videosResponse.ok) {
      throw new Error(`Error al obtener videos: ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();
    
    // Extraer IDs de videos para obtener duración
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
    
    // Obtener detalles adicionales de los videos (duración, estadísticas)
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${apiKey}`
    );

    const videoDetailsData = await videoDetailsResponse.json();
    const videoDetailsMap = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoDetailsData.items?.forEach((video: any) => {
      videoDetailsMap.set(video.id, video);
    });

    // Procesar videos de esta página
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videosData.items.forEach((item: any) => {
      const videoId = item.snippet.resourceId.videoId;
      const details = videoDetailsMap.get(videoId);
      
      const video: YouTubeVideo = {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description || '',
        duration: details ? parseDuration(details.contentDetails.duration) : '0:00',
        thumbnailUrl: item.snippet.thumbnails?.maxres?.url || 
                     item.snippet.thumbnails?.high?.url || 
                     item.snippet.thumbnails?.medium?.url || '',
        publishedAt: item.snippet.publishedAt,
        viewCount: details?.statistics?.viewCount ? parseInt(details.statistics.viewCount) : undefined,
        position: item.snippet.position
      };
      
      videos.push(video);
    });

    nextPageToken = videosData.nextPageToken || '';
  } while (nextPageToken);

  // Ordenar videos por posición
  videos.sort((a, b) => a.position - b.position);

  const playlist: YouTubePlaylist = {
    id: playlistId,
    title: playlistInfo.snippet.title,
    description: playlistInfo.snippet.description || '',
    thumbnailUrl: playlistInfo.snippet.thumbnails?.maxres?.url || 
                 playlistInfo.snippet.thumbnails?.high?.url || 
                 playlistInfo.snippet.thumbnails?.medium?.url || '',
    channelTitle: playlistInfo.snippet.channelTitle,
    channelId: playlistInfo.snippet.channelId,
    publishedAt: playlistInfo.snippet.publishedAt,
    itemCount: videos.length,
    videos: videos
  };

  return playlist;
}

// GET /api/youtube?url=<youtube_playlist_url>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistUrl = searchParams.get('url');

    if (!playlistUrl) {
      return NextResponse.json(
        { success: false, error: 'URL de playlist requerida' } as YouTubePlaylistResponse,
        { status: 400 }
      );
    }

    // Extraer ID de playlist
    const playlistId = extractPlaylistId(playlistUrl);
    
    if (!playlistId) {
      return NextResponse.json(
        { success: false, error: 'URL de playlist de YouTube inválida' } as YouTubePlaylistResponse,
        { status: 400 }
      );
    }

    // Obtener información de la playlist
    const playlist = await fetchPlaylistInfo(playlistId);

    return NextResponse.json({
      success: true,
      data: playlist
    } as YouTubePlaylistResponse);

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Error al procesar playlist de YouTube:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      } as YouTubePlaylistResponse,
      { status: 500 }
    );
  }
}