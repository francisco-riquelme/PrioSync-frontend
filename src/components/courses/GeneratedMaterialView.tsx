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
  Chip,
  Card,
  CardContent,
  Stack,
  Alert,
} from '@mui/material';
import generatedMaterialSchema, { GeneratedMaterial } from './schemas/generatedMaterialSchema';

interface Props {
  content: GeneratedMaterial;
}

function formatDate(iso?: string) {
  if (!iso) return undefined;
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function GeneratedMaterialView({ content }: Props) {
  const {
    titulo,
    descripcion,
    modoGeneracion,
    generation_status,
    createdAt,
    updatedAt,
    resumen,
    recursos = [],
    secciones = [],
    lecciones = [],
    apendice,
    warnings = [],
    incluirCuestionario,
    tocEnabled = true,
  } = content ?? {};

  // Try to validate shape (best-effort, already validated earlier in MaterialDetail)
  React.useEffect(() => {
    try {
      const res = generatedMaterialSchema.safeParse(content);
      if (!res.success) console.warn('GeneratedMaterial validation issues', res.error.issues);
    } catch {
      // ignore
    }
  }, [content]);

  // Build TOC entries from secciones and lecciones
  const toc: { id: string; label: string }[] = [];
  if (tocEnabled) {
    secciones?.forEach((s, i) => {
      const id = `seccion-${i}`;
      toc.push({ id, label: s.titulo || `Sección ${i + 1}` });
    });
    lecciones?.forEach((l, i) => {
      const id = `leccion-${i}`;
      toc.push({ id, label: l.titulo || `Lección ${i + 1}` });
    });
  }

  return (
    <Box>
      {/* Header + metadata badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          {titulo && (
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {titulo}
            </Typography>
          )}

          {descripcion && (
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              {descripcion}
            </Typography>
          )}

          {resumen && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {resumen}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {modoGeneracion && <Chip label={modoGeneracion} size="small" />}
          {generation_status && (
            <Chip label={generation_status} color={generation_status === 'completado' ? 'success' : 'default'} size="small" />
          )}
          {createdAt && <Typography variant="caption">Creado: {formatDate(createdAt)}</Typography>}
          {updatedAt && <Typography variant="caption">Actualizado: {formatDate(updatedAt)}</Typography>}
        </Stack>
      </Box>

      {/* TOC */}
      {tocEnabled && toc.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Tabla de contenidos</Typography>
          <List dense>
            {toc.map((t, i) => (
              <ListItem key={t.id} disableGutters>
                <ListItemText>
                  <Link href={`#${t.id}`}>{`${i + 1}. ${t.label}`}</Link>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Secciones generales */}
      {secciones && secciones.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {secciones.map((s, i) => (
            <Box key={`sec-${i}`} id={`seccion-${i}`} sx={{ mb: 2 }}>
              {s.titulo && <Typography variant="h5" sx={{ mb: 1 }}>{s.titulo}</Typography>}
              {s.contenido && <Box sx={{ mb: 1 }}><div dangerouslySetInnerHTML={{ __html: s.contenido }} /></Box>}
            </Box>
          ))}
        </Box>
      )}

      {/* Recursos top-level */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Recursos
        </Typography>
        {recursos.length === 0 ? (
          <Typography color="text.secondary">No hay recursos listados.</Typography>
        ) : (
          <List dense>
            {recursos.map((r, i) => (
              <ListItem key={`top-res-${i}`} disableGutters>
                <ListItemText
                    primary={r.titulo || r.nombre || r.url || 'Recurso'}
                    secondary={r.url ? (
                      <Link href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.url}
                      </Link>
                    ) : r.tipo ? r.tipo : null}
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
              <Accordion key={idx} sx={{ mb: 1 }} id={`leccion-${idx}`}>
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

                  {/* Recursos de la lección */}
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

                  {/* Mini-cuestionario: inline solo si incluirCuestionario true */}
                  {incluirCuestionario ? (
                    ((lec.miniCuestionario || []).length > 0 || (lec.miniCuestionarioOpcional || []).length > 0) && (
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
                    )
                  ) : null}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>

      {/* Apéndice */}
      {(apendice?.cuestionario_sugerido || []).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Apéndice</Typography>
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1">Cuestionario sugerido (apéndice)</Typography>
              <List dense>
                {(apendice?.cuestionario_sugerido || []).map((q, i) => (
                  <ListItem key={`ap-q-${i}`}>
                    <ListItemText primary={`${i + 1}. ${q.pregunta}`} secondary={q.opciones?.map((opt, oi) => <div key={oi}>- {opt}</div>)} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="warning">Advertencias de generación:
            <List dense>
              {warnings.map((w, i) => <ListItem key={`warn-${i}`}><ListItemText primary={w} /></ListItem>)}
            </List>
          </Alert>
        </Box>
      )}
    </Box>
  );
}

export default GeneratedMaterialView;
