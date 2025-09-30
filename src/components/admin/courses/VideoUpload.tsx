'use client';

import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  VideoFile as VideoFileIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { VIDEO_CONFIG } from '@/types/transcription';

interface VideoMetadata {
  duration: string;
  title: string;
  resolution?: string;
  size: string;
}

interface VideoUploadProps {
  onFileSelect: (file: File | null) => void;
  onMetadataExtracted?: (metadata: VideoMetadata) => void;
  error?: string;
  disabled?: boolean;
}

// Usar configuración centralizada
const ACCEPTED_VIDEO_TYPES = VIDEO_CONFIG.ALLOWED_TYPES as readonly string[];
const MAX_FILE_SIZE = VIDEO_CONFIG.MAX_FILE_SIZE;

export function VideoUpload({ onFileSelect, onMetadataExtracted, error, disabled }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<VideoMetadata | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return 'Duración desconocida';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const extractVideoMetadata = async (file: File): Promise<VideoMetadata> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: formatDuration(video.duration),
          title: file.name.replace(/\.[^/.]+$/, ""), // Nombre sin extensión
          resolution: `${video.videoWidth}x${video.videoHeight}`,
          size: formatFileSize(file.size)
        };
        
        URL.revokeObjectURL(video.src);
        resolve(metadata);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        // Fallback metadata
        resolve({
          duration: 'Duración desconocida',
          title: file.name.replace(/\.[^/.]+$/, ""),
          size: formatFileSize(file.size)
        });
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return 'Tipo de archivo no soportado. Use MP4, AVI, MOV, QuickTime, WMV o MKV.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande. Máximo permitido: ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    
    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      onFileSelect(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Extraer metadatos automáticamente
    setExtractingMetadata(true);
    try {
      const metadata = await extractVideoMetadata(file);
      setExtractedMetadata(metadata);
      onMetadataExtracted?.(metadata);
    } catch (error) {
      console.error('Error extrayendo metadatos:', error);
    } finally {
      setExtractingMetadata(false);
    }
  }, [onFileSelect, onMetadataExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractedMetadata(null);
    onFileSelect(null);
  };

  return (
    <Box>
      {!selectedFile ? (
        <Paper
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: error ? 'error.main' : dragOver ? 'primary.main' : 'grey.400',
            borderRadius: 3,
            p: 5,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: dragOver 
              ? 'rgba(25, 118, 210, 0.08)' 
              : 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.3s ease-in-out',
            backdropFilter: 'blur(5px)',
            boxShadow: dragOver 
              ? '0 8px 25px rgba(25, 118, 210, 0.15)' 
              : '0 4px 15px rgba(0, 0, 0, 0.1)',
            '&:hover': disabled ? {} : {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(25, 118, 210, 0.05)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)'
            }
          }}
        >
          <CloudUploadIcon 
            sx={{ 
              fontSize: 64, 
              color: error ? 'error.main' : dragOver ? 'primary.main' : 'primary.light',
              mb: 2,
              transition: 'all 0.3s ease'
            }} 
          />
          
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: 'text.primary',
              mb: 1
            }}
          >
            Arrastra y suelta tu video aquí
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 3,
              fontSize: '0.9rem'
            }}
          >
            o haz clic para seleccionar un archivo
          </Typography>

          <Button
            variant="contained"
            component="label"
            disabled={disabled}
            startIcon={<CloudUploadIcon />}
            sx={{ 
              mb: 3,
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Seleccionar Video
            <input
              type="file"
              hidden
              accept={ACCEPTED_VIDEO_TYPES.join(',')}
              onChange={handleFileInputChange}
            />
          </Button>

          <Box sx={{ mt: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                mb: 1,
                fontSize: '0.85rem'
              }}
            >
              Formatos soportados:
            </Typography>
            {ACCEPTED_VIDEO_TYPES.map((type) => (
              <Chip
                key={type}
                label={type.split('/')[1].toUpperCase()}
                size="small"
                variant="outlined"
                sx={{ 
                  mr: 1, 
                  mb: 1,
                  borderColor: 'primary.light',
                  color: 'primary.main',
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)'
                  }
                }}
              />
            ))}
            
            <Typography 
              variant="caption" 
              color="info.main" 
              sx={{ 
                display: 'block', 
                mt: 2,
                fontSize: '0.8rem',
                fontWeight: 'medium'
              }}
            >
              📋 Límites: Archivos de video hasta 100MB. Formatos soportados: MP4, AVI, MOV, QuickTime, WMV, MKV. La transcripción 
              utiliza Gemini 2.5 Flash para análisis inteligente del contenido educativo.
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 3,
            border: 1,
            borderColor: 'success.light',
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <VideoFileIcon sx={{ fontSize: 28 }} />
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold"
                sx={{ 
                  color: 'text.primary',
                  mb: 0.5
                }}
              >
                {selectedFile.name}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </Typography>
              
              {extractingMetadata && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography 
                    variant="caption" 
                    color="primary.main"
                    sx={{ fontWeight: 'medium' }}
                  >
                    Extrayendo metadatos...
                  </Typography>
                </Box>
              )}
              
              {extractedMetadata && (
                <Box 
                  sx={{ 
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                    border: '1px solid rgba(76, 175, 80, 0.2)'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color="success.main"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: 'medium'
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    Duración: {extractedMetadata.duration}
                    {extractedMetadata.resolution && ` • ${extractedMetadata.resolution}`}
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRemoveFile}
              disabled={disabled}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'medium',
                px: 2,
                py: 1,
                backgroundColor: 'error.main',
                boxShadow: '0 3px 12px rgba(211, 47, 47, 0.3)',
                '&:hover': {
                  backgroundColor: 'error.dark',
                  boxShadow: '0 4px 15px rgba(211, 47, 47, 0.4)',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Eliminar
            </Button>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}