"use client";

import React, { useState } from 'react';
import { Button, CircularProgress, Menu, MenuItem, ListItemText, Tooltip, Box } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import useCrearMaterial from './hooks/useCrearMaterial';

interface GenerateMaterialButtonProps {
  moduloId: string;
  onSuccess?: (materialId?: string) => void;
  label?: string;
  disabled?: boolean;
}

export const GenerateMaterialButton: React.FC<GenerateMaterialButtonProps> = ({ moduloId, onSuccess, label = 'Generar Material de Estudio', disabled = false }) => {
  const [localLoading, setLocalLoading] = useState(false);
  type Mode = 'torpedo' | 'rapido' | 'normal' | 'extendido';
  const crearHook = useCrearMaterial({ onSuccess });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (disabled || crearHook.loading || localLoading) return;
    setAnchorEl(e.currentTarget);
  };

  const closeMenu = () => setAnchorEl(null);

  const handleCreate = async (selectedModo: Mode) => {
    // closes menu and triggers creation
    closeMenu();
    if (disabled || crearHook.loading || localLoading) return;
    try {
      setLocalLoading(true);
      await crearHook.crear(moduloId, selectedModo);
    } catch (err) {
      console.error('Error creando material:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = crearHook.loading || localLoading;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button
        variant="contained"
        size="small"
        onClick={openMenu}
        disabled={disabled || isLoading}
        sx={{ textTransform: 'none' }}
        aria-busy={isLoading}
        endIcon={<ArrowDropDownIcon />}
      >
        {isLoading ? (
          <>
            <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> Generando...
          </>
        ) : (
          label
        )}
      </Button>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={closeMenu} disableScrollLock>
        <Tooltip title="40–120 palabras" placement="right">
          <MenuItem onClick={() => handleCreate('torpedo')}>
            <ListItemText primary="Torpedo" secondary="muy corto" />
          </MenuItem>
        </Tooltip>

        <Tooltip title="120–300 palabras" placement="right">
          <MenuItem onClick={() => handleCreate('rapido')}>
            <ListItemText primary="Rápido" secondary="corto" />
          </MenuItem>
        </Tooltip>

        <Tooltip title="300–700 palabras" placement="right">
          <MenuItem onClick={() => handleCreate('normal')}>
            <ListItemText primary="Normal" secondary="estándar" />
          </MenuItem>
        </Tooltip>

        <Tooltip title="700–1500 palabras" placement="right">
          <MenuItem onClick={() => handleCreate('extendido')}>
            <ListItemText primary="Extendido" secondary="detallado" />
          </MenuItem>
        </Tooltip>
      </Menu>
    </Box>
  );
};

export default GenerateMaterialButton;
