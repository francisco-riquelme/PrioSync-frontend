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

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/mkv'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

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
      return 'Tipo de archivo no soportado. Use MP4, AVI, MOV, WMV o MKV.';
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
            borderColor: error ? 'error.main' : dragOver ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: dragOver ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease-in-out',
            '&:hover': disabled ? {} : {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
        >
          <CloudUploadIcon 
            sx={{ 
              fontSize: 48, 
              color: error ? 'error.main' : 'primary.main',
              mb: 2 
            }} 
          />
          
          <Typography variant="h6" gutterBottom>
            Arrastra y suelta tu video aquí
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            o haz clic para seleccionar un archivo
          </Typography>

          <Button
            variant="contained"
            component="label"
            disabled={disabled}
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
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
            {ACCEPTED_VIDEO_TYPES.map((type) => (
              <Chip
                key={type}
                label={type.split('/')[1].toUpperCase()}
                size="small"
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        </Paper>
      ) : (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: 1,
            borderColor: 'success.main'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <VideoFileIcon color="primary" sx={{ fontSize: 32 }} />
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </Typography>
              
              {extractingMetadata && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Extrayendo metadatos...
                  </Typography>
                </Box>
              )}
              
              {extractedMetadata && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="success.main">
                    <AutoAwesomeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    Duración: {extractedMetadata.duration}
                    {extractedMetadata.resolution && ` • ${extractedMetadata.resolution}`}
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRemoveFile}
              disabled={disabled}
              size="small"
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