'use client';

import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

interface EditInformationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; apellido: string }) => Promise<boolean>;
  initialData: {
    nombre: string;
    apellido?: string | null;
  };
  isSaving?: boolean;
}

export default function EditInformationDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  isSaving = false,
}: EditInformationDialogProps) {
  const [formData, setFormData] = React.useState({
    nombre: initialData.nombre || '',
    apellido: initialData.apellido || '',
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFormData({
      nombre: initialData.nombre || '',
      apellido: initialData.apellido || '',
    });
    setError(null);
  }, [initialData, open]);

  const handleSubmit = async () => {
    // Validate fields
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, nombre: e.target.value });
    setError(null);
  };

  const handleApellidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, apellido: e.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          Editar Información Personal
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Nombre"
            variant="outlined"
            value={formData.nombre}
            onChange={handleNombreChange}
            disabled={isSaving}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Apellido"
            variant="outlined"
            value={formData.apellido}
            onChange={handleApellidoChange}
            disabled={isSaving}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaving || !formData.nombre.trim()}
          startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

