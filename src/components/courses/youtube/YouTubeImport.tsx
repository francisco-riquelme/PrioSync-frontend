'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Collapse
} from '@mui/material';
import {
  YouTube as YouTubeIcon,
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  VideoLibrary as VideoLibraryIcon
} from '@mui/icons-material';
import type { 
  YouTubePlaylist, 
  YouTubePlaylistResponse, 
  ImportProgress
} from '@/types/youtube';

interface YouTubeImportProps {
  onPlaylistLoaded: (playlist: YouTubePlaylist) => void;
  disabled?: boolean;
}

export function YouTubeImport({ onPlaylistLoaded, disabled }: YouTubeImportProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [maxLessons, setMaxLessons] = useState<number>(20); // Límite por defecto
  const [progress, setProgress] = useState<ImportProgress>({
    status: 'idle',
    currentStep: '',
    progress: 0
  });
  const [playlist, setPlaylist] = useState<YouTubePlaylist | null>(null);
  const [showVideoDetails, setShowVideoDetails] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [lessonsError, setLessonsError] = useState('');

  // Validar URL de YouTube
  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(www\.)?youtube\.com\/watch\?.*list=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/youtu\.be\/.*\?.*list=([a-zA-Z0-9_-]+)/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  };

  // Manejar cambio en la URL
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setPlaylistUrl(url);
    
    if (url && !validateYouTubeUrl(url)) {
      setUrlError('URL de playlist de YouTube inválida');
    } else {
      setUrlError('');
    }
  };

  // Manejar cambio en el límite de lecciones
  const handleMaxLessonsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setMaxLessons(value);
    
    if (value < 1) {
      setLessonsError('El número mínimo de lecciones es 1');
    } else if (value > 100) {
      setLessonsError('El número máximo de lecciones es 100');
    } else {
      setLessonsError('');
    }
  };

  // Procesar playlist de YouTube
  const handleProcessPlaylist = async () => {
    if (!playlistUrl.trim() || urlError || disabled) {
      return;
    }

    try {
      // Resetear estado
      setProgress({
        status: 'fetching-playlist',
        currentStep: 'Obteniendo información de la playlist...',
        progress: 20
      });

      // Llamar a la API de YouTube
      const response = await fetch(`/api/youtube?url=${encodeURIComponent(playlistUrl)}`);
      const data: YouTubePlaylistResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Error al obtener la playlist');
      }

      // Aplicar límite de lecciones si es necesario
      let processedPlaylist = { ...data.data };
      if (processedPlaylist.videos.length > maxLessons) {
        processedPlaylist = {
          ...processedPlaylist,
          videos: processedPlaylist.videos.slice(0, maxLessons),
          itemCount: maxLessons
        };
      }

      setProgress({
        status: 'completed',
        currentStep: `Playlist cargada exitosamente (${processedPlaylist.videos.length} lecciones)`,
        progress: 100
      });

      setPlaylist(processedPlaylist);
      onPlaylistLoaded(processedPlaylist);

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error al procesar playlist:', error);
      setProgress({
        status: 'error',
        currentStep: '',
        progress: 0,
        error: error.message || 'Error al procesar la playlist'
      });
    }
  };

  // Calcular duración total
  const calculateTotalDuration = (playlist: YouTubePlaylist): string => {
    let totalSeconds = 0;
    
    playlist.videos.forEach(video => {
      const parts = video.duration.split(':');
      if (parts.length === 2) {
        totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        totalSeconds += parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Resetear formulario
  const handleReset = () => {
    setPlaylistUrl('');
    setMaxLessons(20);
    setProgress({ status: 'idle', currentStep: '', progress: 0 });
    setPlaylist(null);
    setUrlError('');
    setLessonsError('');
    setShowVideoDetails(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Formulario de entrada */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <YouTubeIcon color="error" />
            Importar Playlist de YouTube
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa la URL de una playlist de YouTube y especifica el límite de lecciones para generar automáticamente la estructura del curso
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
            <TextField
              fullWidth
              label="URL de Playlist de YouTube"
              placeholder="https://www.youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={handleUrlChange}
              error={!!urlError}
              helperText={urlError || 'Ej: https://www.youtube.com/playlist?list=PLxxxxxx'}
              disabled={disabled || progress.status === 'fetching-playlist'}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Límite de lecciones"
              type="number"
              value={maxLessons}
              onChange={handleMaxLessonsChange}
              error={!!lessonsError}
              helperText={lessonsError || 'Máximo número de videos a procesar (1-100)'}
              disabled={disabled || progress.status === 'fetching-playlist'}
              variant="outlined"
              inputProps={{
                min: 1,
                max: 100
              }}
              sx={{ minWidth: 200 }}
            />
            
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleProcessPlaylist}
              disabled={
                disabled || 
                !playlistUrl.trim() || 
                !!urlError || 
                !!lessonsError ||
                progress.status === 'fetching-playlist'
              }
              sx={{ minWidth: 120, height: 56 }}
            >
              {progress.status === 'fetching-playlist' ? 'Procesando...' : 'Procesar'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Indicador de progreso */}
      {progress.status !== 'idle' && (
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            {progress.status === 'error' ? (
              <Alert severity="error">
                <Typography variant="subtitle2">Error al procesar playlist</Typography>
                <Typography variant="body2">{progress.error}</Typography>
                <Button size="small" onClick={handleReset} sx={{ mt: 1 }}>
                  Intentar de nuevo
                </Button>
              </Alert>
            ) : (
              <Box>
                <Typography variant="body2" gutterBottom>
                  {progress.currentStep}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.progress} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {progress.progress}%
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información de la playlist cargada */}
      {playlist && progress.status === 'completed' && (
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar 
                src={playlist.thumbnailUrl} 
                variant="rounded" 
                sx={{ width: 80, height: 60 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {playlist.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Canal: {playlist.channelTitle}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<VideoLibraryIcon />} 
                    label={`${playlist.videos.length} videos`} 
                    size="small" 
                    color={playlist.videos.length < playlist.itemCount ? 'warning' : 'default'}
                  />
                  <Chip 
                    icon={<AccessTimeIcon />} 
                    label={calculateTotalDuration(playlist)} 
                    size="small" 
                  />
                  {playlist.videos.length < playlist.itemCount && (
                    <Chip 
                      label={`Limitado de ${playlist.itemCount} videos`} 
                      size="small" 
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {playlist.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {playlist.description.length > 200 
                  ? `${playlist.description.substring(0, 200)}...` 
                  : playlist.description
                }
              </Typography>
            )}

            {/* Toggle para mostrar detalles de videos */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Alert severity="success" sx={{ flex: 1, mr: 2 }}>
                Playlist cargada exitosamente. Procede a generar la estructura del curso.
              </Alert>
              
              <IconButton 
                onClick={() => setShowVideoDetails(!showVideoDetails)}
                aria-label="mostrar videos"
              >
                {showVideoDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {/* Lista de videos (colapsable) */}
            <Collapse in={showVideoDetails}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Videos en la playlist:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {playlist.videos.slice(0, 10).map((video, index) => (
                    <Box 
                      key={video.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        p: 1, 
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'grey.50' }
                      }}
                    >
                      <Typography variant="caption" color="primary" sx={{ minWidth: 30 }}>
                        {index + 1}
                      </Typography>
                      <Avatar 
                        src={video.thumbnailUrl} 
                        variant="rounded" 
                        sx={{ width: 40, height: 30 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {video.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {video.duration}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {playlist.videos.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                      ... y {playlist.videos.length - 10} videos más
                    </Typography>
                  )}
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}