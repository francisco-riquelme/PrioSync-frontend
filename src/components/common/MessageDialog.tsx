"use client";

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Warning,
} from '@mui/icons-material';

export interface MessageDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  type: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  onConfirm?: () => void;
}

export default function MessageDialog({
  open,
  onClose,
  title,
  message,
  type,
  confirmText = 'Aceptar',
  onConfirm,
}: MessageDialogProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ fontSize: 60, color: '#4caf50' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 60, color: '#f44336' }} />;
      case 'info':
        return <Info sx={{ fontSize: 60, color: '#2196f3' }} />;
      case 'warning':
        return <Warning sx={{ fontSize: 60, color: '#ff9800' }} />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          padding: 1,
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getIcon()}
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2, pb: 3 }}>
        {typeof message === 'string' ? (
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-line',
              color: 'text.secondary',
              lineHeight: 1.7
            }}
          >
            {message}
          </Typography>
        ) : (
          message
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleConfirm}
          color={getButtonColor()}
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
