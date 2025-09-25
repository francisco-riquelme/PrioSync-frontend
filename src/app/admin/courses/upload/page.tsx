import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Paper, 
  Typography, 
  Box 
} from '@mui/material'

export default function AdminCoursesUploadPage() {
  return (
    <AdminLayout 
      title="Administrador - Cargar Videos"
      subtitle="Sube videos para generar transcripciones automáticamente"
    >
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Formulario de Carga de Videos
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          El formulario de subida de videos y la integración con LLM para 
          transcripción se implementará en la siguiente tarea.
        </Typography>
        
        <Box 
          sx={{ 
            mt: 4, 
            p: 3, 
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            textAlign: 'center',
            backgroundColor: 'grey.50'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Área de carga de videos (próximamente)
          </Typography>
        </Box>
      </Paper>
    </AdminLayout>
  )
}