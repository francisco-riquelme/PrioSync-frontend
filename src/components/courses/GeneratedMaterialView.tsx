"use client";

import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Typography,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { GeneratedMaterial } from './schemas/generatedMaterialSchema';

interface Props {
  content: GeneratedMaterial;
}

export function GeneratedMaterialView({ content }: Props) {
  const {
    titulo,
    descripcion,
    resumen,
    recursos = [],
    lecciones = [],
  } = content ?? {};

  return (
    <Box>
      {titulo && (
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {titulo}
        </Typography>
      )}

      {descripcion && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {descripcion}
        </Typography>
      )}

      {resumen && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {resumen}
        </Typography>
      )}

      {/* Recursos */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Recursos
        </Typography>
        {recursos.length === 0 ? (
          <Typography color="text.secondary">No hay recursos listados.</Typography>
        ) : (
          <List dense>
            {recursos.map((r, i) => (
              <ListItem key={i} disableGutters>
                <ListItemText
                  primary={r.nombre || r.url || 'Recurso'}
                  secondary={r.url ? (
                    <Link href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.url}
                    </Link>
                  ) : null}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Lecciones */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Lecciones
        </Typography>
        {lecciones.length === 0 ? (
          <Typography color="text.secondary">No hay lecciones definidas.</Typography>
        ) : (
          <Box>
            {lecciones.map((lec, idx) => (
              <Accordion key={idx} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {lec.titulo || `Lección ${idx + 1}`}
                      </Typography>
                      {lec.duracionMinutos && (
                        <Typography variant="caption" color="text.secondary">
                          {lec.duracionMinutos} min
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Prefer contenido_explicativo, luego descripcion */}
                  {lec.contenido_explicativo ? (
                    <Typography sx={{ mb: 2 }}>{lec.contenido_explicativo}</Typography>
                  ) : lec.descripcion ? (
                    <Typography sx={{ mb: 2 }}>{lec.descripcion}</Typography>
                  ) : null}

                  {lec.objetivo && (
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Objetivo: {lec.objetivo}
                    </Typography>
                  )}

                  {lec.ejemplos && lec.ejemplos.length > 0 && (
                    <>
                      <Typography variant="subtitle2">Ejemplos</Typography>
                      <List dense>
                        {lec.ejemplos.map((ex, i) => (
                          <ListItem key={i}>
                            <ListItemText primary={ex} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}

                  {/* Actividades */}
                  {/* Actividades: tanto la variante principal como la opcional */}
                  {(lec.actividades && lec.actividades.length > 0) || (lec.actividadesOpcionales && lec.actividadesOpcionales.length > 0) ? (
                    <>
                      <Typography variant="subtitle2">Actividades</Typography>
                      <List dense>
                        {(lec.actividades || []).map((act, i) => (
                          <ListItem key={`act-${i}`} alignItems="flex-start">
                            <ListItemText
                              primary={act.nombre}
                              secondary={
                                <>
                                  {act.descripcion && (
                                    <Typography component="span" color="text.secondary">
                                      {act.descripcion}
                                    </Typography>
                                  )}
                                  {act.duracionEstimadaMinutos && (
                                    <Typography component="div" variant="caption" color="text.secondary">
                                      {`${act.duracionEstimadaMinutos} min`}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                        {(lec.actividadesOpcionales || []).map((act, i) => (
                          <ListItem key={`act-opt-${i}`} alignItems="flex-start">
                            <ListItemText
                              primary={act.nombre}
                              secondary={
                                <>
                                  {act.descripcion && (
                                    <Typography component="span" color="text.secondary">
                                      {act.descripcion}
                                    </Typography>
                                  )}
                                  {act.duracionEstimadaMinutos && (
                                    <Typography component="div" variant="caption" color="text.secondary">
                                      {`${act.duracionEstimadaMinutos} min`}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  ) : null}

                  {/* Recursos Opcionales */}
                  {/* Recursos: tanto la variante principal como la opcional */}
                  {(lec.recursos && lec.recursos.length > 0) || (lec.recursosOpcionales && lec.recursosOpcionales.length > 0) ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Recursos</Typography>
                      <List dense>
                        {(lec.recursos || []).map((r, i) => (
                          <ListItem key={`res-${i}`}>
                            <ListItemText
                              primary={r.nombre || r.titulo || r.url}
                              secondary={r.url ? (
                                <Link href={r.url} target="_blank" rel="noopener noreferrer">
                                  {r.url}
                                </Link>
                              ) : null}
                            />
                          </ListItem>
                        ))}
                        {(lec.recursosOpcionales || []).map((r, i) => (
                          <ListItem key={`res-opt-${i}`}>
                            <ListItemText
                              primary={r.nombre || r.titulo || r.url}
                              secondary={r.url ? (
                                <Link href={r.url} target="_blank" rel="noopener noreferrer">
                                  {r.url}
                                </Link>
                              ) : null}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  ) : null}

                  {/* Mini-cuestionario */}
                  {/* Mini-cuestionario: principal u opcional */}
                  {(lec.miniCuestionario && lec.miniCuestionario.length > 0) || (lec.miniCuestionarioOpcional && lec.miniCuestionarioOpcional.length > 0) ? (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Mini-cuestionario</Typography>
                      <List dense>
                        {(lec.miniCuestionario || []).map((q, qi) => (
                          <ListItem key={`q-${qi}`} alignItems="flex-start">
                            <ListItemText
                              primary={`${qi + 1}. ${q.pregunta}`}
                              secondary={q.opciones?.map((opt, oi) => (
                                <div key={oi}>- {opt}</div>
                              ))}
                            />
                          </ListItem>
                        ))}
                        {(lec.miniCuestionarioOpcional || []).map((q, qi) => (
                          <ListItem key={`q-opt-${qi}`} alignItems="flex-start">
                            <ListItemText
                              primary={`${qi + 1}. ${q.pregunta}`}
                              secondary={q.opciones?.map((opt, oi) => (
                                <div key={oi}>- {opt}</div>
                              ))}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  ) : null}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default GeneratedMaterialView;
