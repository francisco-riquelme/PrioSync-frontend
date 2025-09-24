'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Schedule,
  Quiz as QuizIcon,
  School,
  PlayArrow,
  BookmarkBorder,
  TrendingUp,
  Assignment,
  Lightbulb,
  Warning,
  Star,
  CalendarToday,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Tipos para el Quiz
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizData {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  timeLimit: number; // en minutos
  questions: QuizQuestion[];
  passingScore: number; // porcentaje
}

// Interfaces para el sistema de recomendaciones
interface StudyRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'module' | 'practice' | 'schedule';
  priority: 'high' | 'medium' | 'low';
  icon: string;
  action: {
    type: 'navigate' | 'schedule' | 'external';
    target: string;
    label: string;
  };
}

interface QuizAnalysis {
  score: number;
  percentage: number;
  level: 'excellent' | 'good' | 'needs-improvement' | 'critical';
  incorrectQuestions: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: StudyRecommendation[];
}

// Datos de ejemplo para el quiz
const mockQuizData: QuizData = {
  id: '1',
  courseId: 'course-1',
  courseName: 'Fundamentos de React',
  title: 'Quiz Final - Fundamentos de React',
  description: 'Evaluación final del curso sobre los conceptos básicos de React',
  timeLimit: 15,
  passingScore: 70,
  questions: [
    {
      id: 'q1',
      question: '¿Qué es JSX en React?',
      options: [
        'Un lenguaje de programación',
        'Una extensión de sintaxis para JavaScript',
        'Una biblioteca de componentes',
        'Un framework de CSS'
      ],
      correctAnswer: 1,
      explanation: 'JSX es una extensión de sintaxis para JavaScript que permite escribir código similar a HTML dentro de JavaScript.'
    },
    {
      id: 'q2',
      question: '¿Cuál es la forma correcta de crear un componente funcional en React?',
      options: [
        'function Component() { return <div>Hello</div>; }',
        'const Component = () => { return <div>Hello</div>; }',
        'React.createComponent(() => <div>Hello</div>)',
        'Ambas A y B son correctas'
      ],
      correctAnswer: 3,
      explanation: 'Tanto las funciones declarativas como las arrow functions son formas válidas de crear componentes funcionales en React.'
    },
    {
      id: 'q3',
      question: '¿Para qué se utiliza el hook useState?',
      options: [
        'Para hacer peticiones HTTP',
        'Para manejar el estado local de un componente',
        'Para conectar con una base de datos',
        'Para crear componentes de clase'
      ],
      correctAnswer: 1,
      explanation: 'useState es un hook que permite añadir estado local a los componentes funcionales.'
    },
    {
      id: 'q4',
      question: '¿Qué es el Virtual DOM en React?',
      options: [
        'Una copia del DOM real almacenada en memoria',
        'Un elemento HTML especial',
        'Una función de JavaScript',
        'Un componente de React'
      ],
      correctAnswer: 0,
      explanation: 'El Virtual DOM es una representación en memoria del DOM real que React utiliza para optimizar las actualizaciones.'
    },
    {
      id: 'q5',
      question: '¿Cuál es la diferencia principal entre props y state?',
      options: [
        'No hay diferencia',
        'Props son mutables, state es inmutable',
        'Props se pasan desde el componente padre, state es local al componente',
        'Props solo se usan en componentes de clase'
      ],
      correctAnswer: 2,
      explanation: 'Las props son datos que se pasan desde el componente padre, mientras que el state es local y privado del componente.'
    },
    {
      id: 'q6',
      question: '¿Para qué se utiliza el hook useEffect?',
      options: [
        'Para crear componentes',
        'Para manejar efectos secundarios',
        'Para definir estilos CSS',
        'Para crear rutas'
      ],
      correctAnswer: 1,
      explanation: 'useEffect se utiliza para manejar efectos secundarios como peticiones HTTP, suscripciones, o limpieza de recursos.'
    },
    {
      id: 'q7',
      question: '¿Cuál es la sintaxis correcta para renderizar una lista en React?',
      options: [
        'items.forEach(item => <li>{item}</li>)',
        'items.map(item => <li key={item.id}>{item}</li>)',
        'items.render(item => <li>{item}</li>)',
        'items.list(item => <li>{item}</li>)'
      ],
      correctAnswer: 1,
      explanation: 'Se utiliza el método map() junto con la prop key para renderizar listas de elementos en React.'
    },
    {
      id: 'q8',
      question: '¿Qué significa "lifting state up" en React?',
      options: [
        'Mover el estado a un componente padre común',
        'Eliminar el estado del componente',
        'Convertir props en state',
        'Usar solo componentes de clase'
      ],
      correctAnswer: 0,
      explanation: 'Lifting state up significa mover el estado a un componente padre común cuando múltiples componentes necesitan compartir el mismo estado.'
    },
    {
      id: 'q9',
      question: '¿Cuál es el propósito de la prop "key" en React?',
      options: [
        'Aplicar estilos CSS',
        'Ayudar a React a identificar elementos que han cambiado',
        'Pasar datos entre componentes',
        'Crear eventos de click'
      ],
      correctAnswer: 1,
      explanation: 'La prop key ayuda a React a identificar qué elementos han cambiado, añadido o eliminado, optimizando el renderizado.'
    },
    {
      id: 'q10',
      question: '¿Cuándo se ejecuta el código dentro de useEffect sin array de dependencias?',
      options: [
        'Solo una vez al montar el componente',
        'En cada re-renderizado del componente',
        'Solo cuando el componente se desmonta',
        'Nunca se ejecuta'
      ],
      correctAnswer: 1,
      explanation: 'Sin array de dependencias, useEffect se ejecuta después de cada renderizado del componente.'
    }
  ]
};

const QuizPage: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos
  const [showResults, setShowResults] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'instructions' | 'quiz' | 'results' | 'recommendations'>('instructions');
  const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysis | null>(null);

  const currentQuestion = mockQuizData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / mockQuizData.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === mockQuizData.questions.length - 1;

  // Temporizador
  useEffect(() => {
    if (currentScreen !== 'quiz' || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowResults(true);
          setCurrentScreen('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentScreen, showResults]);

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para generar análisis y recomendaciones personalizadas
  const generateQuizAnalysis = (score: number): QuizAnalysis => {
    const percentage = Math.round((score / mockQuizData.questions.length) * 100);
    const incorrectQuestions: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Identificar preguntas incorrectas y áreas débiles
    mockQuizData.questions.forEach((question) => {
      const userAnswer = selectedAnswers[question.id];
      if (userAnswer !== question.correctAnswer) {
        incorrectQuestions.push(question.id);
        // Categorizar debilidades por tema
        if (question.question.includes('JSX')) weaknesses.push('JSX y Sintaxis');
        else if (question.question.includes('useState') || question.question.includes('useEffect')) weaknesses.push('React Hooks');
        else if (question.question.includes('Virtual DOM')) weaknesses.push('Conceptos Fundamentales');
        else if (question.question.includes('props') || question.question.includes('state')) weaknesses.push('Gestión de Estado');
        else if (question.question.includes('componente')) weaknesses.push('Componentes de React');
        else weaknesses.push('Conceptos Avanzados');
      } else {
        // Identificar fortalezas
        if (question.question.includes('JSX')) strengths.push('JSX y Sintaxis');
        else if (question.question.includes('useState') || question.question.includes('useEffect')) strengths.push('React Hooks');
        else if (question.question.includes('Virtual DOM')) strengths.push('Conceptos Fundamentales');
        else if (question.question.includes('props') || question.question.includes('state')) strengths.push('Gestión de Estado');
        else if (question.question.includes('componente')) strengths.push('Componentes de React');
        else strengths.push('Conceptos Avanzados');
      }
    });

    // Determinar nivel de desempeño
    let level: 'excellent' | 'good' | 'needs-improvement' | 'critical';
    if (percentage >= 90) level = 'excellent';
    else if (percentage >= 75) level = 'good';
    else if (percentage >= 50) level = 'needs-improvement';
    else level = 'critical';

    // Generar recomendaciones específicas basadas en el nivel
    const recommendations: StudyRecommendation[] = [];

    if (level === 'critical') {
      recommendations.push(
        {
          id: 'fundamental-review',
          title: 'Repaso Fundamental Requerido',
          description: 'Es necesario repasar los conceptos básicos de React desde el inicio.',
          type: 'course',
          priority: 'high',
          icon: 'Warning',
          action: {
            type: 'navigate',
            target: '/courses/fundamentos-react',
            label: 'Reestudiar Curso'
          }
        },
        {
          id: 'schedule-intensive',
          title: 'Programar Sesiones Intensivas',
          description: 'Dedica al menos 2 horas diarias de estudio durante la próxima semana.',
          type: 'schedule',
          priority: 'high',
          icon: 'CalendarToday',
          action: {
            type: 'schedule',
            target: 'study-session',
            label: 'Programar Estudio'
          }
        }
      );
    } else if (level === 'needs-improvement') {
      recommendations.push(
        {
          id: 'specific-topics',
          title: 'Repaso de Temas Específicos',
          description: `Focus en: ${[...new Set(weaknesses)].join(', ')}`,
          type: 'module',
          priority: 'high',
          icon: 'BookmarkBorder',
          action: {
            type: 'navigate',
            target: '/courses/fundamentos-react',
            label: 'Repasar Módulos'
          }
        },
        {
          id: 'practice-exercises',
          title: 'Ejercicios Prácticos',
          description: 'Completa ejercicios adicionales en las áreas débiles identificadas.',
          type: 'practice',
          priority: 'medium',
          icon: 'Assignment',
          action: {
            type: 'external',
            target: 'https://react.dev/learn',
            label: 'Practicar en React.dev'
          }
        }
      );
    } else if (level === 'good') {
      recommendations.push(
        {
          id: 'advanced-concepts',
          title: 'Conceptos Avanzados',
          description: 'Estás listo para explorar temas más avanzados de React.',
          type: 'course',
          priority: 'medium',
          icon: 'TrendingUp',
          action: {
            type: 'navigate',
            target: '/courses/react-avanzado',
            label: 'Curso Avanzado'
          }
        },
        {
          id: 'review-weak-areas',
          title: 'Reforzar Áreas Específicas',
          description: `Revisar: ${[...new Set(weaknesses)].slice(0, 2).join(', ')}`,
          type: 'module',
          priority: 'low',
          icon: 'Lightbulb',
          action: {
            type: 'navigate',
            target: '/courses/fundamentos-react',
            label: 'Repaso Rápido'
          }
        }
      );
    } else {
      recommendations.push(
        {
          id: 'congratulations',
          title: '¡Excelente Dominio!',
          description: 'Has demostrado un dominio excepcional de React. Considera enseñar a otros.',
          type: 'course',
          priority: 'low',
          icon: 'Star',
          action: {
            type: 'navigate',
            target: '/courses',
            label: 'Explorar Más Cursos'
          }
        },
        {
          id: 'advanced-frameworks',
          title: 'Frameworks Avanzados',
          description: 'Explora Next.js, React Native o librerías de estado como Redux.',
          type: 'course',
          priority: 'medium',
          icon: 'TrendingUp',
          action: {
            type: 'navigate',
            target: '/courses/nextjs',
            label: 'Aprender Next.js'
          }
        }
      );
    }

    return {
      score,
      percentage,
      level,
      incorrectQuestions,
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
      recommendations
    };
  };

  // Función auxiliar para obtener el icono de recomendación
  const getRecommendationIcon = (iconName: string) => {
    switch (iconName) {
      case 'Warning': return <Warning color="error" />;
      case 'CalendarToday': return <CalendarToday color="primary" />;
      case 'BookmarkBorder': return <BookmarkBorder color="primary" />;
      case 'Assignment': return <Assignment color="action" />;
      case 'TrendingUp': return <TrendingUp color="success" />;
      case 'Lightbulb': return <Lightbulb color="warning" />;
      case 'Star': return <Star color="warning" />;
      default: return <Lightbulb color="primary" />;
    }
  };

  // Función para obtener el color de prioridad
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'primary';
    }
  };

  // Función para obtener el mensaje de nivel
  const getLevelMessage = (level: 'excellent' | 'good' | 'needs-improvement' | 'critical') => {
    switch (level) {
      case 'excellent': 
        return { 
          title: '¡Excelente trabajo!', 
          description: 'Has demostrado un dominio excepcional de React.',
          color: 'success.main' 
        };
      case 'good': 
        return { 
          title: 'Buen desempeño', 
          description: 'Tienes una base sólida, pero hay algunas áreas que puedes mejorar.',
          color: 'success.main' 
        };
      case 'needs-improvement': 
        return { 
          title: 'Necesitas reforzar conocimientos', 
          description: 'Es recomendable que repases algunos conceptos para mejorar tu comprensión.',
          color: 'warning.main' 
        };
      case 'critical': 
        return { 
          title: 'Requiere repaso fundamental', 
          description: 'Es importante que estudies los conceptos básicos antes de continuar.',
          color: 'error.main' 
        };
      default: 
        return { 
          title: 'Resultado', 
          description: 'Revisa las recomendaciones para mejorar.',
          color: 'primary.main' 
        };
    }
  };

  // Iniciar el quiz desde las instrucciones
  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
  };

  // Manejar selección de respuesta
  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  // Navegar a pregunta anterior
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Navegar a pregunta siguiente
  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Finalizar quiz
  const handleFinishQuiz = () => {
    const { score } = calculateScore();
    const analysis = generateQuizAnalysis(score);
    setQuizAnalysis(analysis);
    setShowResults(true);
    setCurrentScreen('results');
  };

  // Calcular puntuación
  const calculateScore = (): { score: number; percentage: number; passed: boolean } => {
    let correctAnswers = 0;
    mockQuizData.questions.forEach(question => {
      const userAnswer = selectedAnswers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const percentage = Math.round((correctAnswers / mockQuizData.questions.length) * 100);
    const passed = percentage >= mockQuizData.passingScore;
    
    return { score: correctAnswers, percentage, passed };
  };

  const { score, percentage, passed } = showResults ? calculateScore() : { score: 0, percentage: 0, passed: false };

  // Pantalla de instrucciones
  if (currentScreen === 'instructions') {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <School sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  {mockQuizData.title}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {mockQuizData.courseName}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 3 }}>
                {mockQuizData.description}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Instrucciones:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    • Este quiz tiene {mockQuizData.questions.length} preguntas de selección múltiple
                  </Typography>
                  <Typography variant="body2">
                    • Tienes {mockQuizData.timeLimit} minutos para completar todas las preguntas
                  </Typography>
                  <Typography variant="body2">
                    • Necesitas obtener al menos {mockQuizData.passingScore}% para aprobar
                  </Typography>
                  <Typography variant="body2">
                    • Puedes navegar entre las preguntas usando los botones de navegación
                  </Typography>
                  <Typography variant="body2">
                    • Una vez que inicies el quiz, el temporizador comenzará automáticamente
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartQuiz}
                  startIcon={<PlayArrow />}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Iniciar Quiz
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </DashboardLayout>
    );
  }

  // Pantalla de recomendaciones personalizadas - DEBE IR ANTES DE showResults
  if (currentScreen === 'recommendations' && quizAnalysis) {
    const levelMessage = getLevelMessage(quizAnalysis.level);
    
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          {/* Header de análisis */}
          <Card sx={{ mb: 3, textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: levelMessage.color, mb: 2 }}>
                {levelMessage.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {levelMessage.description}
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Puntuación: {quizAnalysis.percentage}% ({quizAnalysis.score}/{mockQuizData.questions.length})
              </Typography>
              <Chip 
                label={quizAnalysis.level === 'excellent' ? 'EXCELENTE' : 
                       quizAnalysis.level === 'good' ? 'BUENO' : 
                       quizAnalysis.level === 'needs-improvement' ? 'MEJORABLE' : 'CRÍTICO'}
                color={quizAnalysis.level === 'excellent' || quizAnalysis.level === 'good' ? 'success' : 
                       quizAnalysis.level === 'needs-improvement' ? 'warning' : 'error'}
                variant="filled"
                sx={{ fontWeight: 'bold', mb: 2 }}
              />
            </CardContent>
          </Card>

          {/* Análisis de fortalezas y debilidades */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            {quizAnalysis.strengths.length > 0 && (
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    ✅ Fortalezas
                  </Typography>
                  <Stack spacing={1}>
                    {quizAnalysis.strengths.map((strength, index) => (
                      <Chip 
                        key={index}
                        label={strength}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
            
            {quizAnalysis.weaknesses.length > 0 && (
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    ⚠️ Áreas de mejora
                  </Typography>
                  <Stack spacing={1}>
                    {quizAnalysis.weaknesses.map((weakness, index) => (
                      <Chip 
                        key={index}
                        label={weakness}
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>

          {/* Recomendaciones personalizadas */}
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            📋 Recomendaciones Personalizadas
          </Typography>
          
          <Stack spacing={2} sx={{ mb: 3 }}>
            {quizAnalysis.recommendations.map((recommendation) => (
              <Card key={recommendation.id} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ mt: 0.5 }}>
                      {getRecommendationIcon(recommendation.icon)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {recommendation.title}
                        </Typography>
                        <Chip
                          label={recommendation.priority.toUpperCase()}
                          color={getPriorityColor(recommendation.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {recommendation.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          if (recommendation.action.type === 'navigate') {
                            // Aquí puedes implementar la navegación interna
                            console.log('Navegando a:', recommendation.action.target);
                          } else if (recommendation.action.type === 'external') {
                            window.open(recommendation.action.target, '_blank');
                          } else if (recommendation.action.type === 'schedule') {
                            // Aquí puedes implementar la programación de sesiones
                            console.log('Programando sesión de estudio');
                          }
                        }}
                      >
                        {recommendation.action.label}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* Botones de navegación */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              variant="outlined" 
              onClick={() => setCurrentScreen('results')}
            >
              Volver a Resultados
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setCurrentScreen('instructions');
              }}
            >
              Reintentar Quiz
            </Button>
            <Button variant="outlined" href="/courses">
              Volver a Cursos
            </Button>
          </Stack>
        </Box>
      </DashboardLayout>
    );
  }

  if (showResults) {
    return (
      <DashboardLayout>
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
          <Card sx={{ mb: 3, textAlign: 'center' }}>
            <CardContent>
              <CheckCircle 
                sx={{ 
                  fontSize: 64, 
                  color: passed ? 'success.main' : 'error.main',
                  mb: 2 
                }} 
              />
              <Typography variant="h4" gutterBottom>
                {passed ? '¡Felicitaciones!' : 'No alcanzaste la puntuación mínima'}
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {percentage}%
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {score} de {mockQuizData.questions.length} respuestas correctas
              </Typography>
              <Chip 
                label={passed ? 'APROBADO' : 'NO APROBADO'}
                color={passed ? 'success' : 'error'}
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              variant="outlined" 
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setCurrentScreen('instructions');
              }}
            >
              Reintentar Quiz
            </Button>
            {(percentage < 75 || (percentage >= 75 && quizAnalysis?.recommendations && quizAnalysis.recommendations.length > 0)) && (
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<Lightbulb />}
                onClick={() => {
                  // Asegurar que el análisis existe antes de cambiar la pantalla
                  if (!quizAnalysis) {
                    const { score } = calculateScore();
                    const analysis = generateQuizAnalysis(score);
                    setQuizAnalysis(analysis);
                  }
                  setCurrentScreen('recommendations');
                }}
              >
                {percentage < 75 ? 'Ver Recomendaciones' : 'Ver Sugerencias'}
              </Button>
            )}
            <Button variant="outlined" href="/courses">
              Volver a Cursos
            </Button>
          </Stack>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        {/* Header del Quiz */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <QuizIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              {mockQuizData.title}
            </Typography>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {mockQuizData.description}
          </Typography>

          <Stack direction="row" spacing={3} alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Schedule fontSize="small" color="action" />
              <Typography variant="body2">
                Tiempo restante: {formatTime(timeLeft)}
              </Typography>
            </Stack>
            
            <Typography variant="body2" color="text.secondary">
              Pregunta {currentQuestionIndex + 1} de {mockQuizData.questions.length}
            </Typography>
          </Stack>

          {/* Barra de progreso */}
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Paper>

        {/* Pregunta actual */}
        <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            {currentQuestion.question}
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedAnswers[currentQuestion.id] ?? ''}
              onChange={(e) => handleAnswerSelect(currentQuestion.id, parseInt(e.target.value))}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={index}
                  control={<Radio />}
                  label={option}
                  sx={{ 
                    mb: 1,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mx: 0,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>

        {/* Navegación */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outlined"
          >
            Anterior
          </Button>

          <Typography variant="body2" color="text.secondary">
            {Object.keys(selectedAnswers).length} de {mockQuizData.questions.length} respondidas
          </Typography>

          {isLastQuestion ? (
            <Button
              variant="contained"
              onClick={handleFinishQuiz}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              color="success"
              size="large"
            >
              Finalizar Quiz
            </Button>
          ) : (
            <Button
              endIcon={<ArrowForward />}
              onClick={handleNextQuestion}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              variant="contained"
            >
              Siguiente
            </Button>
          )}
        </Stack>
      </Box>
    </DashboardLayout>
  );
};

export default QuizPage;