import os
import json
import logging
from sqlalchemy.orm import Session
from app.db.models import (
    Diagnostico, Recomendacion, Granja, Programa, Lote,
    ItemInventarioPrograma, Labor, Usuario
)

logger = logging.getLogger(__name__)


def _get_gemini_model():
    import google.generativeai as genai
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY no está configurada")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


def generar_resumen_diagnostico(db: Session, diagnostico_id: int, usuario) -> str:
    diag = db.query(Diagnostico).filter(Diagnostico.id == diagnostico_id).first()
    if not diag:
        raise ValueError("Diagnóstico no encontrado")

    rol = usuario.rol.nombre
    programas_usuario = [p.id for p in usuario.programas]

    if rol in ("docente", "asesor", "estudiante"):
        if diag.programa_id not in programas_usuario:
            raise PermissionError("No tienes acceso a este diagnóstico")
    elif rol == "talento_humano":
        granjas_usuario = [g.id for g in usuario.granjas]
        lote = db.query(Lote).filter(Lote.id == diag.lote_id).first()
        if not lote or lote.granja_id not in granjas_usuario:
            raise PermissionError("No tienes acceso a este diagnóstico")

    programa_nombre = diag.programa.nombre if diag.programa else "—"
    lote_nombre = diag.lote.nombre if diag.lote else "—"
    tipo_diag = diag.tipo_diagnostico.replace("_", " ") if diag.tipo_diagnostico else "—"
    condiciones = diag.condiciones_dia or "—"
    estado = diag.estado_revision or "—"
    fecha = diag.fecha_creacion.strftime("%d/%m/%Y") if diag.fecha_creacion else "—"
    formulario_str = json.dumps(diag.formulario, ensure_ascii=False, indent=2) if diag.formulario else "Sin datos"

    prompt = f"""Eres un asistente agrícola especializado de la Universidad de Caldas (Colombia).
Genera un resumen ejecutivo claro y útil del siguiente diagnóstico para un docente o asesor.
El resumen debe ser en español, estructurado, conciso (máximo 300 palabras) y destacar:
1. Principales hallazgos y observaciones
2. Estado general del cultivo/lote
3. Posibles alertas o puntos críticos detectados
4. Sugerencias generales para la recomendación

DATOS DEL DIAGNÓSTICO:
- ID: #{diag.id}
- Fecha: {fecha}
- Programa: {programa_nombre}
- Lote: {lote_nombre}
- Tipo de diagnóstico: {tipo_diag}
- Condiciones del día: {condiciones}
- Estado de revisión: {estado}

DATOS DEL FORMULARIO:
{formulario_str}

Responde ÚNICAMENTE con el resumen estructurado, sin repetir los datos crudos.
"""

    model = _get_gemini_model()
    response = model.generate_content(prompt)
    return response.text


def _construir_contexto_por_rol(db: Session, usuario, pregunta: str) -> str:
    rol = usuario.rol.nombre
    nombre = usuario.nombre

    contexto_partes = [f"Sistema de Gestión de Granjas - Universidad de Caldas\nUsuario: {nombre} | Rol: {rol}\n"]

    if rol == "jefe_talento_humano":
        granjas = db.query(Granja).filter(Granja.activo == True).all()
        for granja in granjas:
            contexto_partes.append(f"\n=== GRANJA: {granja.nombre} ({granja.ubicacion}) ===")
            programas = [gp for gp in granja.programas]
            for prog in programas:
                contexto_partes.append(f"\n  Programa: {prog.nombre} ({prog.tipo})")
                lotes = db.query(Lote).filter(Lote.programa_id == prog.id).all()
                contexto_partes.append(f"  Lotes: {len(lotes)}")

            diags = (db.query(Diagnostico)
                     .join(Lote, Diagnostico.lote_id == Lote.id)
                     .filter(Lote.granja_id == granja.id)
                     .order_by(Diagnostico.fecha_creacion.desc())
                     .limit(10).all())
            if diags:
                contexto_partes.append(f"\n  Últimos diagnósticos ({len(diags)}):")
                for d in diags:
                    contexto_partes.append(
                        f"    - #{d.id} | {d.tipo_diagnostico} | {d.estado_revision} | {d.fecha_creacion.strftime('%d/%m/%Y') if d.fecha_creacion else '—'}"
                    )

            recs = (db.query(Recomendacion)
                    .join(Lote, Recomendacion.lote_id == Lote.id)
                    .filter(Lote.granja_id == granja.id)
                    .order_by(Recomendacion.fecha_creacion.desc())
                    .limit(10).all())
            if recs:
                contexto_partes.append(f"\n  Últimas recomendaciones ({len(recs)}):")
                for r in recs:
                    contexto_partes.append(
                        f"    - #{r.id} | {r.titulo[:50]} | Estado: {r.estado}"
                    )

            labores = (db.query(Labor)
                       .join(Lote, Labor.lote_id == Lote.id)
                       .filter(Lote.granja_id == granja.id)
                       .order_by(Labor.fecha_asignacion.desc())
                       .limit(10).all())
            if labores:
                contexto_partes.append(f"\n  Labores recientes ({len(labores)}):")
                for l in labores:
                    contexto_partes.append(
                        f"    - #{l.id} | Estado: {l.estado} | Avance: {l.avance_porcentaje}%"
                    )

    elif rol == "talento_humano":
        granjas_usuario = usuario.granjas
        for granja in granjas_usuario:
            contexto_partes.append(f"\n=== GRANJA: {granja.nombre} ({granja.ubicacion}) ===")
            programas = [gp for gp in granja.programas]
            for prog in programas:
                contexto_partes.append(f"\n  Programa: {prog.nombre} ({prog.tipo})")
                lotes = db.query(Lote).filter(Lote.programa_id == prog.id).all()
                contexto_partes.append(f"  Lotes: {len(lotes)}")

            diags = (db.query(Diagnostico)
                     .join(Lote, Diagnostico.lote_id == Lote.id)
                     .filter(Lote.granja_id == granja.id)
                     .order_by(Diagnostico.fecha_creacion.desc())
                     .limit(15).all())
            if diags:
                contexto_partes.append(f"\n  Diagnósticos recientes:")
                for d in diags:
                    contexto_partes.append(
                        f"    - #{d.id} | {d.tipo_diagnostico} | {d.estado_revision} | {d.fecha_creacion.strftime('%d/%m/%Y') if d.fecha_creacion else '—'}"
                    )

            recs = (db.query(Recomendacion)
                    .join(Lote, Recomendacion.lote_id == Lote.id)
                    .filter(Lote.granja_id == granja.id)
                    .order_by(Recomendacion.fecha_creacion.desc())
                    .limit(15).all())
            if recs:
                contexto_partes.append(f"\n  Recomendaciones recientes:")
                for r in recs:
                    contexto_partes.append(
                        f"    - #{r.id} | {r.titulo[:50]} | Estado: {r.estado}"
                    )

            labores = (db.query(Labor)
                       .join(Lote, Labor.lote_id == Lote.id)
                       .filter(Lote.granja_id == granja.id)
                       .order_by(Labor.fecha_asignacion.desc())
                       .limit(15).all())
            if labores:
                contexto_partes.append(f"\n  Labores recientes:")
                for l in labores:
                    avance = l.avance_porcentaje or 0
                    contexto_partes.append(
                        f"    - #{l.id} | Estado: {l.estado} | Avance: {avance}%"
                    )

    elif rol in ("docente", "asesor", "estudiante"):
        programas_usuario = usuario.programas
        nombres_programas = [p.nombre for p in programas_usuario]
        ids_programas = [p.id for p in programas_usuario]
        contexto_partes.append(f"\nProgramas asignados: {', '.join(nombres_programas) if nombres_programas else 'Ninguno'}")

        for prog in programas_usuario:
            contexto_partes.append(f"\n=== PROGRAMA: {prog.nombre} ({prog.tipo}) ===")
            lotes = db.query(Lote).filter(Lote.programa_id == prog.id).all()
            contexto_partes.append(f"  Lotes ({len(lotes)}): {', '.join([l.nombre for l in lotes[:10]])}")

            diags = (db.query(Diagnostico)
                     .filter(Diagnostico.programa_id == prog.id)
                     .order_by(Diagnostico.fecha_creacion.desc())
                     .limit(15).all())
            if diags:
                contexto_partes.append(f"\n  Diagnósticos recientes ({len(diags)}):")
                for d in diags:
                    contexto_partes.append(
                        f"    - #{d.id} | {d.tipo_diagnostico} | {d.estado_revision} | {d.fecha_creacion.strftime('%d/%m/%Y') if d.fecha_creacion else '—'}"
                    )
                estados = {}
                for d in diags:
                    estados[d.estado_revision] = estados.get(d.estado_revision, 0) + 1
                contexto_partes.append(f"  Resumen estados: {json.dumps(estados, ensure_ascii=False)}")

            recs = (db.query(Recomendacion)
                    .join(Lote, Recomendacion.lote_id == Lote.id)
                    .filter(Lote.programa_id == prog.id)
                    .order_by(Recomendacion.fecha_creacion.desc())
                    .limit(15).all())
            if recs:
                contexto_partes.append(f"\n  Recomendaciones recientes ({len(recs)}):")
                for r in recs:
                    contexto_partes.append(
                        f"    - #{r.id} | {r.titulo[:60]} | Estado: {r.estado}"
                    )

    return "\n".join(contexto_partes)


def responder_chat(db: Session, usuario, pregunta: str, historial: list) -> str:
    rol = usuario.rol.nombre

    roles_permitidos = ("docente", "asesor", "talento_humano", "jefe_talento_humano", "admin")
    if rol not in roles_permitidos:
        raise PermissionError("Tu rol no tiene acceso al asistente de IA")

    contexto = _construir_contexto_por_rol(db, usuario, pregunta)

    historial_texto = ""
    for msg in historial[-6:]:
        role_label = "Usuario" if msg.get("role") == "user" else "Asistente"
        historial_texto += f"{role_label}: {msg.get('content', '')}\n"

    prompt = f"""Eres un asistente inteligente del Sistema de Gestión de Granjas de la Universidad de Caldas (Colombia).
Ayudas a {usuario.nombre} con rol '{rol}'.

REGLAS IMPORTANTES:
- Solo puedes responder sobre la información contenida en el CONTEXTO DEL SISTEMA.
- Si te preguntan sobre granjas, programas o datos a los que este usuario NO tiene acceso, responde amablemente que no tienes acceso a esa información.
- Puedes hacer cálculos estadísticos, comparaciones y análisis sobre los datos del contexto.
- Responde siempre en español, de forma clara y estructurada.
- Si la información no está en el contexto, dilo claramente. No inventes datos.

CONTEXTO DEL SISTEMA (datos actuales a los que tiene acceso este usuario):
{contexto}

HISTORIAL DE CONVERSACIÓN:
{historial_texto}

PREGUNTA ACTUAL: {pregunta}

RESPUESTA:"""

    model = _get_gemini_model()
    response = model.generate_content(prompt)
    return response.text
