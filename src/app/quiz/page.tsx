'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  QuizInstructions,
  QuizQuestion,
  QuizTimer,
  QuizResults,
  QuizRecommendations,
  QuizNavigation,
  QuizData,
  QuizAnalysis,
  StudyRecommendation,
  QuizScreen
} from '@/components/quiz';

// Datos de ejemplo para el quiz (movidos aquí temporalmente)
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
      question: '¿Cuándo se ejecuta useEffect sin dependencias?',
      options: [
        'Solo una vez al montar el componente',
        'En cada renderizado del componente',
        'Solo cuando el componente se desmonta',
        'Nunca se ejecuta'
      ],
      correctAnswer: 1,
      explanation: 'useEffect sin array de dependencias se ejecuta después de cada renderizado del componente.'
    }
  ]
};

const QuizPage: React.FC = () => {
  // Estados principales
  const [currentScreen, setCurrentScreen] = useState<QuizScreen>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(mockQuizData.timeLimit * 60);
  const [showResults, setShowResults] = useState(false);
  const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysis | null>(null);

  // Timer effect
  useEffect(() => {
    if (currentScreen !== 'quiz' || showResults) return;

    if (timeLeft <= 0) {
      handleFinishQuiz();
    }
  }, [currentScreen, showResults, timeLeft]);

  // Funciones de navegación
  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
    setTimeLeft(mockQuizData.timeLimit * 60);
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mockQuizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleFinishQuiz = () => {
    const analysis = generateQuizAnalysis();
    setQuizAnalysis(analysis);
    setShowResults(true);
  };

  const handleRetryQuiz = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setCurrentScreen('instructions');
    setTimeLeft(mockQuizData.timeLimit * 60);
    setQuizAnalysis(null);
  };

  const handleViewRecommendations = () => {
    setCurrentScreen('recommendations');
  };

  const handleBackToResults = () => {
    setCurrentScreen('quiz');
    setShowResults(true);
  };

  const handleRecommendationAction = (recommendation: StudyRecommendation) => {
    // Aquí puedes manejar las acciones de las recomendaciones
    console.log('Recommendation action:', recommendation);
    if (recommendation.action.type === 'navigate') {
      // Navegar a la ruta especificada
      window.location.href = recommendation.action.target;
    }
  };

  // Funciones de cálculo
  const calculateScore = () => {
    const correctAnswers = mockQuizData.questions.filter(
      question => selectedAnswers[question.id] === question.correctAnswer
    ).length;
    
    const percentage = Math.round((correctAnswers / mockQuizData.questions.length) * 100);
    const passed = percentage >= mockQuizData.passingScore;
    
    return { score: correctAnswers, percentage, passed };
  };

  const generateQuizAnalysis = (): QuizAnalysis => {
    const { score, percentage } = calculateScore();
    
    const incorrectQuestions = mockQuizData.questions
      .filter(question => selectedAnswers[question.id] !== question.correctAnswer)
      .map(question => question.id);

    let level: QuizAnalysis['level'];
    if (percentage >= 90) level = 'excellent';
    else if (percentage >= 75) level = 'good';
    else if (percentage >= 60) level = 'needs-improvement';
    else level = 'critical';

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Análisis simple basado en preguntas
    if (selectedAnswers['q1'] === 1) strengths.push('JSX');
    else weaknesses.push('JSX');
    
    if (selectedAnswers['q3'] === 1) strengths.push('Hooks');
    else weaknesses.push('Hooks');
    
    if (selectedAnswers['q5'] === 2) strengths.push('Props vs State');
    else weaknesses.push('Props vs State');

    // Generar recomendaciones
    const recommendations = generateRecommendations(level, percentage, weaknesses);

    return {
      score,
      percentage,
      level,
      incorrectQuestions,
      strengths,
      weaknesses,
      recommendations
    };
  };

  const generateRecommendations = (level: string, percentage: number, weaknesses: string[]): StudyRecommendation[] => {
    const recommendations: StudyRecommendation[] = [];

    if (level === 'critical' || level === 'needs-improvement') {
      recommendations.push(
        {
          id: 'fundamentals-review',
          title: 'Revisar Fundamentos',
          description: 'Es importante repasar los conceptos básicos de React antes de continuar.',
          type: 'course',
          priority: 'high',
          icon: 'Lightbulb',
          action: {
            type: 'navigate',
            target: '/courses/fundamentos-react',
            label: 'Estudiar Fundamentos'
          }
        },
        {
          id: 'practice-exercises',
          title: 'Ejercicios Prácticos',
          description: 'Practica con ejercicios específicos para reforzar tu aprendizaje.',
          type: 'practice',
          priority: 'high',
          icon: 'Assignment',
          action: {
            type: 'navigate',
            target: '/practice/react-basics',
            label: 'Hacer Ejercicios'
          }
        }
      );
    }

    if (level === 'good') {
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
        }
      );
    }

    if (level === 'excellent') {
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
        }
      );
    }

    return recommendations;
  };

  // Datos calculados
  const { score, percentage, passed } = showResults ? calculateScore() : { score: 0, percentage: 0, passed: false };
  const currentQuestion = mockQuizData.questions[currentQuestionIndex];

  // Renderizado condicional
  if (currentScreen === 'instructions') {
    return (
      <DashboardLayout>
        <QuizInstructions
          quizData={mockQuizData}
          onStartQuiz={handleStartQuiz}
        />
      </DashboardLayout>
    );
  }

  if (currentScreen === 'recommendations' && quizAnalysis) {
    return (
      <DashboardLayout>
        <QuizRecommendations
          analysis={quizAnalysis}
          onBackToResults={handleBackToResults}
          onActionClick={handleRecommendationAction}
        />
      </DashboardLayout>
    );
  }

  if (showResults && quizAnalysis) {
    return (
      <DashboardLayout>
        <QuizResults
          score={score}
          totalQuestions={mockQuizData.questions.length}
          percentage={percentage}
          passed={passed}
          passingScore={mockQuizData.passingScore}
          onRetry={handleRetryQuiz}
          onViewRecommendations={handleViewRecommendations}
          showRecommendationsButton={percentage < 75 || quizAnalysis.recommendations.length > 0}
        />
      </DashboardLayout>
    );
  }

  // Vista del quiz principal
  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
        {/* Timer */}
        <QuizTimer
          timeLeft={timeLeft}
          totalTime={mockQuizData.timeLimit}
          onTimeUp={handleFinishQuiz}
          isActive={currentScreen === 'quiz' && !showResults}
          onTick={setTimeLeft}
        />

        {/* Pregunta actual */}
        <Box sx={{ mb: 4 }}>
          <QuizQuestion
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={mockQuizData.questions.length}
            selectedAnswer={selectedAnswers[currentQuestion.id]}
            onAnswerSelect={handleAnswerSelect}
          />
        </Box>

        {/* Navegación */}
        <QuizNavigation
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={mockQuizData.questions.length}
          selectedAnswers={selectedAnswers}
          currentQuestionId={currentQuestion.id}
          onPrevious={handlePreviousQuestion}
          onNext={handleNextQuestion}
          onFinish={handleFinishQuiz}
        />
      </Box>
    </DashboardLayout>
  );
};

export default QuizPage;