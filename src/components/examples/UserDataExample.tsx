'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useUser, InscripcionCurso } from '@/contexts/UserContext';
import { useCourses, useProfile, useActivities } from '@/hooks/useUserData';

export default function UserDataExample() {
  // Opción 1: Hook directo del contexto (todos los datos)
  const { userData, loading, updateUser } = useUser();
  
  // Opción 2: Hooks especializados
  const { courses, totalProgress, updateProgress } = useCourses();
  const { profile, updateProfile } = useProfile();
  const { activities, addNewActivity } = useActivities();

  if (loading) {
    return <Typography>Cargando datos del usuario...</Typography>;
  }

  const handleUpdateName = async () => {
    await updateProfile({ nombre: 'Francisco', apellido: 'Riquelme Updated' });
  };

  const handleUpdateCourse = async () => {
    await updateProgress('calculo-avanzado', 90);
  };

  const handleAddActivity = async () => {
    await addNewActivity(
      'Nueva tarea completada',
      'Ejemplo de nueva actividad',
      'assignment_completed'
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Datos del Usuario - Ejemplos de Acceso
      </Typography>

      {/* Usando userData directo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            1. Datos directos del contexto (userData)
          </Typography>
          <Typography>ID: {userData?.usuarioId}</Typography>
          <Typography>Nombre: {userData?.nombre}</Typography>
          <Typography>Email: {userData?.email}</Typography>
          <Typography>Avatar: {userData?.avatar}</Typography>
          <Typography>Creado: {userData?.createdAt}</Typography>
          <Typography>Actualizado: {userData?.updatedAt}</Typography>
        </CardContent>
      </Card>

      {/* Usando hook de perfil */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            2. Usando hook de perfil
          </Typography>
          <Typography>Perfil: {profile?.nombre}</Typography>
          <Button variant="outlined" onClick={handleUpdateName} sx={{ mt: 1 }}>
            Actualizar Nombre
          </Button>
        </CardContent>
      </Card>

      {/* Usando hook de cursos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            3. Usando hook de cursos
          </Typography>
          <Typography>Progreso total: {totalProgress}%</Typography>
          <Typography>Total de cursos: {courses.length}</Typography>
          
          <Box sx={{ mt: 2 }}>
            {courses.map((inscripcion: InscripcionCurso) => {
              // Calculate progress based on estado
              const progress = inscripcion.estado === 'completado' ? 100
                            : inscripcion.estado === 'en_progreso' ? 50
                            : 0;
              
              return (
                <Box key={inscripcion.cursoId} sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {inscripcion.curso_titulo || inscripcion.cursoId}: {progress}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              );
            })}
          </Box>
          
          <Button variant="outlined" onClick={handleUpdateCourse} sx={{ mt: 1 }}>
            Actualizar Cálculo Avanzado a 90%
          </Button>
        </CardContent>
      </Card>

      {/* Usando hook de actividades */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            4. Usando hook de actividades
          </Typography>
          <Typography>Total actividades: {activities.length}</Typography>
          
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {activities.slice(0, 3).map((activity) => (
              <ListItem key={activity.id}>
                <ListItemText
                  primary={activity.title}
                  secondary={`${activity.subtitle} - ${activity.date}`}
                />
                <Chip 
                  label={activity.type} 
                  size="small" 
                  color="primary" 
                />
              </ListItem>
            ))}
          </List>
          
          <Button variant="outlined" onClick={handleAddActivity} sx={{ mt: 1 }}>
            Agregar Nueva Actividad
          </Button>
        </CardContent>
      </Card>

      {/* Ejemplo de manipulación directa */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            5. Actualización directa del usuario
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => updateUser({ 
              avatar: 'FRQ',
              updatedAt: new Date().toISOString()
            })}
          >
            Actualizar Avatar a FRQ
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
