'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Paper,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useMaterialDetail } from './hooks/useMaterialDetail';
import { getMaterialTypeLabelWithDefault, getMaterialTypeColor } from './courseUtils';
import DOMPurify from 'dompurify';
import GeneratedMaterialView from './GeneratedMaterialView';
import generatedMaterialSchema, { GeneratedMaterial } from './schemas/generatedMaterialSchema';

interface MaterialDetailProps {
  materialId: string;
}

export default function MaterialDetail({ materialId }: MaterialDetailProps) {
  const router = useRouter();
  const { material, loading, error } = useMaterialDetail({ materialId });
  const generatedContent = (material as unknown as { contenido_generado?: string | null })?.contenido_generado;
  // Parse and validate generated content early so we can decide whether to show the outer header
  let parsedGenerated: GeneratedMaterial | null = null;
  if (generatedContent) {
    try {
      let raw: unknown = generatedContent;

      // If it's a string, try to JSON.parse it. Handle double-encoded strings too.
      if (typeof generatedContent === 'string') {
        raw = JSON.parse(generatedContent as string);
        if (typeof raw === 'string') {
          try {
            raw = JSON.parse(raw as string);
          } catch {
            // keep raw as-is (first-parse result)
          }
        }
      }

      // If we have an object, try Zod validation. If validation fails, still use the object as a best-effort fallback
      if (raw && typeof raw === 'object') {
        const res = generatedMaterialSchema.safeParse(raw);
        if (res.success) {
          parsedGenerated = res.data;
        } else {
          console.warn('Generated material validation failed, rendering best-effort object', res.error.issues);
          parsedGenerated = raw as GeneratedMaterial;
        }
      }
    } catch (parseErr) {
      // Parsing failed — we'll fallback to sanitized HTML/text below
      console.warn('Failed to parse generated content JSON', parseErr);
    }
  }

  const handleBackClick = () => {
    if (material?.cursoId) {
      router.push(`/courses/${material.cursoId}`);
    } else {
      router.push('/courses');
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  // Handle material not found
  if (!material) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Material no encontrado
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con botón de regreso */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Volver al Curso
        </Typography>
      </Box>

      {/* Material Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label={`Material ${material.orden || '-'}`} 
            color="primary" 
            size="small"
          />
          <Chip 
            label={getMaterialTypeLabelWithDefault(material.tipo)} 
            color={getMaterialTypeColor(material.tipo)} 
            size="small"
            variant="outlined"
          />
        </Box>

        {/* If the generated content already includes title/description, avoid duplicating them */}
        {!parsedGenerated?.titulo && (
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {material.titulo}
          </Typography>
        )}

        {!parsedGenerated?.descripcion && material.descripcion && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {material.descripcion}
          </Typography>
        )}
      </Box>

      {/* Resource Viewer - Large White Box */}
      <Paper 
        elevation={2}
        sx={{ 
          width: '100%',
          height: { xs: '300px', sm: '400px', md: '600px' },
          mb: 4,
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {material.url_contenido ? (
          <iframe
            src={material.url_contenido}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={material.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : generatedContent ? (
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto', p: 3 }}>
                {parsedGenerated ? (
                  <GeneratedMaterialView content={parsedGenerated} />
                ) : generatedContent ? (
                  // If validation failed or it's plain HTML/text, show sanitized fallback
                  (() => {
                    const raw = String(generatedContent || '');
                    const safe = typeof window !== 'undefined' ? DOMPurify.sanitize(raw) : raw;
                    return <Box dangerouslySetInnerHTML={{ __html: safe }} />;
                  })()
                ) : (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6" color="text.secondary">Contenido generado inválido</Typography>
                  </Box>
                )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Contenido no disponible
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Volver al Curso
        </Button>
      </Box>
    </Box>
  );
}