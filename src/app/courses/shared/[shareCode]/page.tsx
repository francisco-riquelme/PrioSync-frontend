import { Metadata } from 'next';
import SharedCourseClient from './SharedCourseClient';

interface SharedCoursePageProps {
  params: Promise<{ shareCode: string }>;
}

export async function generateMetadata({ params }: SharedCoursePageProps): Promise<Metadata> {
  const { shareCode } = await params;
  
  // Usar metadata estático optimizado para WhatsApp
  const courseTitle = "🎓 Te han compartido un curso";
  const courseDescription = "Únete y comienza a aprender algo nuevo hoy. ¡Es completamente gratis!";
  const courseImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop&auto=format&q=80";
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://priosync.vercel.app'}/courses/shared/${shareCode}`;

  return {
    title: "Curso Compartido - PrioSync",
    description: courseDescription,
    openGraph: {
      title: courseTitle,
      description: courseDescription,
      url: shareUrl,
      siteName: 'PrioSync - Plataforma de Aprendizaje',
      images: [
        {
          url: courseImage,
          width: 1200,
          height: 630,
          alt: 'Curso compartido en PrioSync',
        },
      ],
      locale: 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: courseTitle,
      description: courseDescription,
      images: [courseImage],
      creator: '@priosync',
    },
    alternates: {
      canonical: shareUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function SharedCoursePage({ params }: SharedCoursePageProps) {
  return <SharedCourseClient params={params} />;
}