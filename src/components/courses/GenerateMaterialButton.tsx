"use client";

import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import useCrearMaterial from './hooks/useCrearMaterial';

interface GenerateMaterialButtonProps {
  moduloId: string;
  onSuccess?: (materialId?: string) => void;
  label?: string;
  disabled?: boolean;
}

export const GenerateMaterialButton: React.FC<GenerateMaterialButtonProps> = ({ moduloId, onSuccess, label = 'Generar Material de Estudio', disabled = false }) => {
  const [localLoading, setLocalLoading] = useState(false);
  const crearHook = useCrearMaterial({ onSuccess });

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || crearHook.loading || localLoading) return;
    try {
      setLocalLoading(true);
      await crearHook.crear(moduloId);
      // onSuccess already called by hook
    } catch (err) {
      // Let parent UI handle error via hook or catch
      console.error('Error creando material:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = crearHook.loading || localLoading;

  return (
    <Button
      variant="contained"
      size="small"
      onClick={handleClick}
      disabled={disabled || isLoading}
      sx={{ textTransform: 'none' }}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> Generando...
        </>
      ) : (
        label
      )}
    </Button>
  );
};

export default GenerateMaterialButton;
