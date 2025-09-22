import { StudySession } from "@/types/studySession";

const STORAGE_KEY = "priosync_study_sessions";

/**
 * Utilidades para manejar sesiones de estudio en localStorage
 */
export class StudySessionStorage {
  /**
   * Obtener todas las sesiones de estudio
   */
  static getAll(): StudySession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const sessions = JSON.parse(data);
      // Convertir strings de fecha a objetos Date
      return sessions.map((session: StudySession) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: new Date(session.endTime),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }));
    } catch (error) {
      console.error("Error al cargar sesiones de estudio:", error);
      return [];
    }
  }

  /**
   * Guardar todas las sesiones
   */
  static saveAll(sessions: StudySession[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error al guardar sesiones de estudio:", error);
      throw new Error("No se pudieron guardar las sesiones de estudio");
    }
  }

  /**
   * Agregar una nueva sesión
   */
  static add(
    session: Omit<StudySession, "id" | "createdAt" | "updatedAt">
  ): StudySession {
    const sessions = this.getAll();
    const now = new Date();

    const newSession: StudySession = {
      ...session,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    sessions.push(newSession);
    this.saveAll(sessions);

    return newSession;
  }

  /**
   * Actualizar una sesión existente
   */
  static update(
    id: string,
    updates: Partial<StudySession>
  ): StudySession | null {
    const sessions = this.getAll();
    const index = sessions.findIndex((session) => session.id === id);

    if (index === -1) {
      return null;
    }

    const updatedSession = {
      ...sessions[index],
      ...updates,
      id, // Asegurar que el ID no cambie
      updatedAt: new Date(),
    };

    sessions[index] = updatedSession;
    this.saveAll(sessions);

    return updatedSession;
  }

  /**
   * Eliminar una sesión
   */
  static delete(id: string): boolean {
    const sessions = this.getAll();
    const filteredSessions = sessions.filter((session) => session.id !== id);

    if (filteredSessions.length === sessions.length) {
      return false; // No se encontró la sesión
    }

    this.saveAll(filteredSessions);
    return true;
  }

  /**
   * Obtener una sesión por ID
   */
  static getById(id: string): StudySession | null {
    const sessions = this.getAll();
    return sessions.find((session) => session.id === id) || null;
  }

  /**
   * Obtener sesiones por rango de fechas
   */
  static getByDateRange(start: Date, end: Date): StudySession[] {
    const sessions = this.getAll();
    return sessions.filter((session) => {
      const sessionStart = new Date(session.startTime);
      return sessionStart >= start && sessionStart <= end;
    });
  }

  /**
   * Obtener sesiones por materia
   */
  static getBySubject(subject: string): StudySession[] {
    const sessions = this.getAll();
    return sessions.filter((session) =>
      session.subject.toLowerCase().includes(subject.toLowerCase())
    );
  }

  /**
   * Limpiar todas las sesiones (usar con cuidado)
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Generar un ID único para nueva sesión
   */
  private static generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Exportar sesiones como JSON (para backup)
   */
  static export(): string {
    const sessions = this.getAll();
    return JSON.stringify(sessions, null, 2);
  }

  /**
   * Importar sesiones desde JSON (para restore)
   */
  static import(jsonData: string): boolean {
    try {
      const sessions = JSON.parse(jsonData);

      // Validar que sea un array
      if (!Array.isArray(sessions)) {
        throw new Error("Los datos no son un array válido");
      }

      // Validar estructura básica de las sesiones
      sessions.forEach((session, index) => {
        if (
          !session.id ||
          !session.title ||
          !session.startTime ||
          !session.endTime
        ) {
          throw new Error(`Sesión inválida en el índice ${index}`);
        }
      });

      this.saveAll(sessions);
      return true;
    } catch (error) {
      console.error("Error al importar sesiones:", error);
      return false;
    }
  }
}
