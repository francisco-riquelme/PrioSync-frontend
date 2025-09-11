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
import { useUser } from '@/contexts/UserContext';
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
    await updateProfile({ name: 'Francisco Riquelme Updated' });
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
          <Typography>ID: {userData?.userId}</Typography>
          <Typography>Nombre: {userData?.name}</Typography>
          <Typography>Email: {userData?.email}</Typography>
          <Typography>Avatar: {userData?.avatar}</Typography>
          <Typography>Suscripción: {userData?.subscription}</Typography>
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
          <Typography>Perfil: {profile?.name}</Typography>
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
            {courses.map((course) => (
              <Box key={course.courseId} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {course.courseName}: {course.progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={course.progress} 
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ))}
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
              subscription: 'Plan Premium',
              updatedAt: new Date().toISOString()
            })}
          >
            Actualizar a Plan Premium
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
