import os
import json
import logging
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqlfunc
from app.db.models import (
    Diagnostico, Recomendacion, Granja, Programa, Lote,
    Labor, Usuario, Planta,
    ProgramaInventarioTipo, ItemInventarioPrograma,
    ProductoLabor, ProductoRecomendacion,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Modelo Gemini
# ─────────────────────────────────────────────────────────────────────────────

def _get_gemini_model():
    import google.generativeai as genai
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY no está configurada")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.5-flash")


# ─────────────────────────────────────────────────────────────────────────────
# Helper: contexto detallado de UN lote
# ─────────────────────────────────────────────────────────────────────────────

def _contexto_lote(db: Session, lote: Lote, ind: str = "  ") -> list:
    """Devuelve lista de líneas con el contexto completo de un lote."""
    partes = []

    # ── Info básica ──────────────────────────────────────────────────────────
    cultivos = ", ".join(
        lc.cultivo.nombre for lc in lote.cultivos_asignados if lc.cultivo
    ) if lote.cultivos_asignados else "Sin cultivo asignado"
    tipo_lote  = lote.tipo_lote.nombre if lote.tipo_lote else "—"
    fecha_ini  = lote.fecha_inicio.strftime("%d/%m/%Y") if lote.fecha_inicio else "—"
    total_plantas = lote.surcos * lote.plantas_por_surco if lote.surcos and lote.plantas_por_surco else 0

    partes.append(f"{ind}── LOTE: {lote.nombre} (ID {lote.id}) ──")
    partes.append(f"{ind}   Estado: {lote.estado or '—'} | Tipo: {tipo_lote} | Inicio: {fecha_ini}")
    partes.append(f"{ind}   Surcos: {lote.surcos} | Plantas/surco: {lote.plantas_por_surco} | Total plantas aprox.: {total_plantas}")
    partes.append(f"{ind}   Cultivos: {cultivos}")

    # ── Plantas por estado ───────────────────────────────────────────────────
    plantas_estados = dict(
        db.query(Planta.estado, sqlfunc.count(Planta.id))
        .filter(Planta.lote_id == lote.id)
        .group_by(Planta.estado)
        .all()
    )
    total_plantas_bd = sum(plantas_estados.values())
    if total_plantas_bd:
        partes.append(f"{ind}   Plantas registradas: {total_plantas_bd} | Por estado: {json.dumps(plantas_estados, ensure_ascii=False)}")

    # ── Diagnósticos ─────────────────────────────────────────────────────────
    total_diags = db.query(sqlfunc.count(Diagnostico.id)).filter(Diagnostico.lote_id == lote.id).scalar() or 0
    estados_diags = dict(
        db.query(Diagnostico.estado_revision, sqlfunc.count(Diagnostico.id))
        .filter(Diagnostico.lote_id == lote.id)
        .group_by(Diagnostico.estado_revision).all()
    )
    partes.append(f"{ind}   Diagnósticos — TOTAL: {total_diags} | Por estado: {json.dumps(estados_diags, ensure_ascii=False)}")

    diags_recientes = (
        db.query(Diagnostico)
        .filter(Diagnostico.lote_id == lote.id)
        .options(joinedload(Diagnostico.usuario), joinedload(Diagnostico.diagnostico_tipo))
        .order_by(Diagnostico.fecha_creacion.desc())
        .limit(5).all()
    )
    for d in diags_recientes:
        autor = d.usuario.nombre if d.usuario else "—"
        subtipo = d.diagnostico_tipo.nombre if d.diagnostico_tipo else "—"
        fecha = d.fecha_creacion.strftime("%d/%m/%Y") if d.fecha_creacion else "—"
        partes.append(
            f"{ind}     · Diag #{d.id} | {d.tipo_diagnostico} / {subtipo} | {d.estado_revision} | "
            f"Cond: {d.condiciones_dia} | Autor: {autor} | {fecha}"
        )

    # ── Recomendaciones ──────────────────────────────────────────────────────
    total_recs = db.query(sqlfunc.count(Recomendacion.id)).filter(Recomendacion.lote_id == lote.id).scalar() or 0
    estados_recs = dict(
        db.query(Recomendacion.estado, sqlfunc.count(Recomendacion.id))
        .filter(Recomendacion.lote_id == lote.id)
        .group_by(Recomendacion.estado).all()
    )
    partes.append(f"{ind}   Recomendaciones — TOTAL: {total_recs} | Por estado: {json.dumps(estados_recs, ensure_ascii=False)}")

    recs_recientes = (
        db.query(Recomendacion)
        .filter(Recomendacion.lote_id == lote.id)
        .options(joinedload(Recomendacion.docente))
        .order_by(Recomendacion.fecha_creacion.desc())
        .limit(5).all()
    )
    for r in recs_recientes:
        docente = r.docente.nombre if r.docente else "—"
        fecha = r.fecha_creacion.strftime("%d/%m/%Y") if r.fecha_creacion else "—"
        desc = (r.descripcion or "")[:120]
        partes.append(
            f"{ind}     · Rec #{r.id} | \"{r.titulo}\" | Estado: {r.estado} | Tipo: {r.tipo or '—'} | "
            f"Docente: {docente} | {fecha}"
        )
        if desc:
            partes.append(f"{ind}       Descripción: {desc}")

    # ── Labores ──────────────────────────────────────────────────────────────
    total_labores = db.query(sqlfunc.count(Labor.id)).filter(Labor.lote_id == lote.id).scalar() or 0
    estados_labores = dict(
        db.query(Labor.estado, sqlfunc.count(Labor.id))
        .filter(Labor.lote_id == lote.id)
        .group_by(Labor.estado).all()
    )
    partes.append(f"{ind}   Labores — TOTAL: {total_labores} | Por estado: {json.dumps(estados_labores, ensure_ascii=False)}")

    labores_recientes = (
        db.query(Labor)
        .filter(Labor.lote_id == lote.id)
        .options(joinedload(Labor.trabajador), joinedload(Labor.recomendacion))
        .order_by(Labor.fecha_asignacion.desc())
        .limit(5).all()
    )
    for l in labores_recientes:
        trabajador = l.trabajador.nombre if l.trabajador else "—"
        rec_titulo = l.recomendacion.titulo if l.recomendacion else "—"
        fecha = l.fecha_asignacion.strftime("%d/%m/%Y") if l.fecha_asignacion else "—"
        desc = (l.comentario or "Sin descripción")[:100]
        partes.append(
            f"{ind}     · Labor #{l.id} | {desc} | Estado: {l.estado} | Avance: {l.avance_porcentaje}% | "
            f"Trabajador: {trabajador} | Rec: \"{rec_titulo}\" | {fecha}"
        )

    return partes


# ─────────────────────────────────────────────────────────────────────────────
# Helper: totales reales de granja
# ─────────────────────────────────────────────────────────────────────────────

def _totales_granja(db: Session, granja_id: int) -> list:
    partes = []
    t_diags = db.query(sqlfunc.count(Diagnostico.id)).join(Lote, Diagnostico.lote_id == Lote.id).filter(Lote.granja_id == granja_id).scalar() or 0
    e_diags = dict(db.query(Diagnostico.estado_revision, sqlfunc.count(Diagnostico.id)).join(Lote, Diagnostico.lote_id == Lote.id).filter(Lote.granja_id == granja_id).group_by(Diagnostico.estado_revision).all())
    t_recs  = db.query(sqlfunc.count(Recomendacion.id)).join(Lote, Recomendacion.lote_id == Lote.id).filter(Lote.granja_id == granja_id).scalar() or 0
    e_recs  = dict(db.query(Recomendacion.estado, sqlfunc.count(Recomendacion.id)).join(Lote, Recomendacion.lote_id == Lote.id).filter(Lote.granja_id == granja_id).group_by(Recomendacion.estado).all())
    t_labs  = db.query(sqlfunc.count(Labor.id)).join(Lote, Labor.lote_id == Lote.id).filter(Lote.granja_id == granja_id).scalar() or 0
    e_labs  = dict(db.query(Labor.estado, sqlfunc.count(Labor.id)).join(Lote, Labor.lote_id == Lote.id).filter(Lote.granja_id == granja_id).group_by(Labor.estado).all())

    partes.append(f"  Diagnósticos TOTAL: {t_diags} | {json.dumps(e_diags, ensure_ascii=False)}")
    partes.append(f"  Recomendaciones TOTAL: {t_recs} | {json.dumps(e_recs, ensure_ascii=False)}")
    partes.append(f"  Labores TOTAL: {t_labs} | {json.dumps(e_labs, ensure_ascii=False)}")
    return partes


# ─────────────────────────────────────────────────────────────────────────────
# Helper: inventario de un programa
# ─────────────────────────────────────────────────────────────────────────────

def _contexto_inventario_programa(db: Session, prog: Programa, ind: str = "  ") -> list:
    """Devuelve líneas con el inventario completo del programa, agrupado por categoría."""
    partes = []

    tipos = (
        db.query(ProgramaInventarioTipo)
        .filter(
            ProgramaInventarioTipo.programa_id == prog.id,
            ProgramaInventarioTipo.activo == True,
        )
        .order_by(ProgramaInventarioTipo.orden)
        .all()
    )

    if not tipos:
        partes.append(f"{ind}Inventario: sin categorías registradas.")
        return partes

    partes.append(f"{ind}Inventario del programa (categorías: {len(tipos)}):")

    for tipo in tipos:
        items = (
            db.query(ItemInventarioPrograma)
            .filter(ItemInventarioPrograma.tipo_id == tipo.id)
            .order_by(ItemInventarioPrograma.fecha_inventario.desc())
            .all()
        )

        total_items = len(items)
        total_disponible = sum((i.cantidad_disponible or 0) for i in items)

        partes.append(f"{ind}  ▸ Categoría: {tipo.nombre} ({total_items} ítems | disponible total: {total_disponible})")

        for item in items:
            # El nombre del ítem viene del JSON dinámico; buscamos claves comunes
            vals = item.valores or {}
            nombre_item = (
                vals.get("nombre") or vals.get("name") or
                vals.get("producto") or vals.get("insumo") or
                vals.get("descripcion") or f"Ítem #{item.id}"
            )
            fecha = item.fecha_inventario.strftime("%d/%m/%Y") if item.fecha_inventario else "—"
            obs   = (item.observaciones or "")[:80]

            partes.append(
                f"{ind}    · {nombre_item} | Disponible: {item.cantidad_disponible} {item.unidad_medida or ''} | Fecha: {fecha}"
            )
            if obs:
                partes.append(f"{ind}      Obs: {obs}")

            # Consumo en labores (últimas 5 uses)
            usos = (
                db.query(ProductoLabor)
                .filter(ProductoLabor.inventario_item_id == item.id)
                .options(joinedload(ProductoLabor.labor))
                .order_by(ProductoLabor.created_at.desc())
                .limit(5).all()
            )
            for u in usos:
                labor_ref = f"Labor #{u.labor_id}" if u.labor_id else "—"
                dosis = f" | Dosis: {u.dosis_aplicada} {u.unidad_dosis or ''}" if u.dosis_aplicada else ""
                partes.append(
                    f"{ind}      ↳ Usado en {labor_ref}: {u.cantidad_usada} {item.unidad_medida or ''}{dosis}"
                )

            # Sugerido en recomendaciones (últimas 3)
            sugs = (
                db.query(ProductoRecomendacion)
                .filter(ProductoRecomendacion.inventario_item_id == item.id)
                .order_by(ProductoRecomendacion.created_at.desc())
                .limit(3).all()
            )
            for s in sugs:
                partes.append(
                    f"{ind}      ↳ Sugerido en Rec #{s.recomendacion_id}: {s.cantidad_sugerida} {item.unidad_medida or ''}"
                )

    return partes


# ─────────────────────────────────────────────────────────────────────────────
# Constructor principal de contexto
# ─────────────────────────────────────────────────────────────────────────────

def _construir_contexto_por_rol(db: Session, usuario, pregunta: str) -> str:
    rol    = usuario.rol.nombre
    nombre = usuario.nombre
    partes = [f"Sistema de Gestión de Granjas — Universidad de Caldas\nUsuario: {nombre} | Rol: {rol}\n"]

    # ── ADMIN: ve todas las granjas (activas e inactivas) ─────────────────────
    if rol == "admin":
        granjas = db.query(Granja).all()  # todas, sin filtro
        partes.append(f"Granjas totales: {len(granjas)}")
        for granja in granjas:
            partes.append(f"\n=== GRANJA: {granja.nombre} — {granja.ubicacion} (ID {granja.id}) ===")
            partes.extend(_totales_granja(db, granja.id))
            for prog in granja.programas:
                partes.append(f"\n  Programa: {prog.nombre} ({prog.tipo}) — ID {prog.id}")
                lotes = db.query(Lote).filter(Lote.programa_id == prog.id).all()
                partes.append(f"  Total lotes: {len(lotes)}")
                for lote in lotes:
                    partes.extend(_contexto_lote(db, lote, ind="    "))
                partes.extend(_contexto_inventario_programa(db, prog, ind="    "))

    # ── jefe_talento_humano : ve todas las granjas activas ───────────────────
    elif rol == "jefe_talento_humano":
        granjas = db.query(Granja).filter(Granja.activo == True).all()
        partes.append(f"Granjas activas: {len(granjas)}")
        for granja in granjas:
            partes.append(f"\n=== GRANJA: {granja.nombre} — {granja.ubicacion} (ID {granja.id}) ===")
            partes.extend(_totales_granja(db, granja.id))
            for prog in granja.programas:
                partes.append(f"\n  Programa: {prog.nombre} ({prog.tipo}) — ID {prog.id}")
                lotes = db.query(Lote).filter(Lote.programa_id == prog.id).all()
                partes.append(f"  Total lotes: {len(lotes)}")
                for lote in lotes:
                    partes.extend(_contexto_lote(db, lote, ind="    "))
                partes.extend(_contexto_inventario_programa(db, prog, ind="    "))

    # ── talento_humano : ve solo sus granjas asignadas ───────────────────────
    elif rol == "talento_humano":
        granjas = usuario.granjas
        partes.append(f"Granjas asignadas: {len(granjas)}")
        for granja in granjas:
            partes.append(f"\n=== GRANJA: {granja.nombre} — {granja.ubicacion} (ID {granja.id}) ===")
            partes.extend(_totales_granja(db, granja.id))
            for prog in granja.programas:
                partes.append(f"\n  Programa: {prog.nombre} ({prog.tipo}) — ID {prog.id}")
                lotes = db.query(Lote).filter(Lote.programa_id == prog.id).all()
                partes.append(f"  Total lotes: {len(lotes)}")
                for lote in lotes:
                    partes.extend(_contexto_lote(db, lote, ind="    "))
                partes.extend(_contexto_inventario_programa(db, prog, ind="    "))

    # ── docente / asesor / estudiante : sus programas ────────────────────────
    elif rol in ("docente", "asesor", "estudiante"):
        programas = usuario.programas
        partes.append(f"Programas asignados: {', '.join(p.nombre for p in programas) or 'Ninguno'}")

        for prog in programas:
            # Totales del programa completo
            t_diags_prog = db.query(sqlfunc.count(Diagnostico.id)).filter(Diagnostico.programa_id == prog.id).scalar() or 0
            e_diags_prog = dict(db.query(Diagnostico.estado_revision, sqlfunc.count(Diagnostico.id)).filter(Diagnostico.programa_id == prog.id).group_by(Diagnostico.estado_revision).all())
            t_recs_prog  = db.query(sqlfunc.count(Recomendacion.id)).join(Lote, Recomendacion.lote_id == Lote.id).filter(Lote.programa_id == prog.id).scalar() or 0
            e_recs_prog  = dict(db.query(Recomendacion.estado, sqlfunc.count(Recomendacion.id)).join(Lote, Recomendacion.lote_id == Lote.id).filter(Lote.programa_id == prog.id).group_by(Recomendacion.estado).all())
            t_labs_prog  = db.query(sqlfunc.count(Labor.id)).join(Lote, Labor.lote_id == Lote.id).filter(Lote.programa_id == prog.id).scalar() or 0
            e_labs_prog  = dict(db.query(Labor.estado, sqlfunc.count(Labor.id)).join(Lote, Labor.lote_id == Lote.id).filter(Lote.programa_id == prog.id).group_by(Labor.estado).all())

            partes.append(f"\n=== PROGRAMA: {prog.nombre} ({prog.tipo}) — ID {prog.id} ===")
            partes.append(f"  Diagnósticos TOTAL: {t_diags_prog} | {json.dumps(e_diags_prog, ensure_ascii=False)}")
            partes.append(f"  Recomendaciones TOTAL: {t_recs_prog} | {json.dumps(e_recs_prog, ensure_ascii=False)}")
            partes.append(f"  Labores TOTAL: {t_labs_prog} | {json.dumps(e_labs_prog, ensure_ascii=False)}")

            lotes = db.query(Lote).filter(Lote.programa_id == prog.id).all()
            partes.append(f"  Total lotes: {len(lotes)}")
            for lote in lotes:
                partes.extend(_contexto_lote(db, lote, ind="  "))
            partes.extend(_contexto_inventario_programa(db, prog, ind="  "))

    return "\n".join(partes)


# ─────────────────────────────────────────────────────────────────────────────
# Resumen de diagnóstico con IA
# ─────────────────────────────────────────────────────────────────────────────

def generar_resumen_diagnostico(db: Session, diagnostico_id: int, usuario) -> str:
    diag = db.query(Diagnostico).filter(Diagnostico.id == diagnostico_id).first()
    if not diag:
        raise ValueError("Diagnóstico no encontrado")

    rol = usuario.rol.nombre
    programas_usuario = [p.id for p in usuario.programas]
    granjas_usuario = [g.id for g in usuario.granjas]

    # ADMIN siempre tiene acceso
    if rol == "admin":
        pass
    elif rol in ("docente", "asesor", "estudiante"):
        if diag.programa_id not in programas_usuario:
            raise PermissionError("No tienes acceso a este diagnóstico")
    elif rol == "talento_humano" or rol == "jefe_talento_humano":
        lote = db.query(Lote).filter(Lote.id == diag.lote_id).first()
        if not lote or lote.granja_id not in granjas_usuario:
            raise PermissionError("No tienes acceso a este diagnóstico")
    else:
        raise PermissionError("Tu rol no tiene acceso a esta función")

    programa_nombre = diag.programa.nombre if diag.programa else "—"
    lote_nombre     = diag.lote.nombre if diag.lote else "—"
    tipo_diag       = diag.tipo_diagnostico.replace("_", " ") if diag.tipo_diagnostico else "—"
    condiciones     = diag.condiciones_dia or "—"
    estado          = diag.estado_revision or "—"
    fecha           = diag.fecha_creacion.strftime("%d/%m/%Y") if diag.fecha_creacion else "—"
    formulario_str  = json.dumps(diag.formulario, ensure_ascii=False, indent=2) if diag.formulario else "Sin datos"

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
    return model.generate_content(prompt).text


# ─────────────────────────────────────────────────────────────────────────────
# Chat con IA
# ─────────────────────────────────────────────────────────────────────────────

def responder_chat(db: Session, usuario, pregunta: str, historial: list) -> str:
    rol = usuario.rol.nombre

    roles_permitidos = ("admin", "docente", "asesor", "talento_humano", "jefe_talento_humano")
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
- Solo puedes responder sobre la información del CONTEXTO DEL SISTEMA.
- Para cantidades y totales usa SIEMPRE los campos "TOTAL" del contexto. NO cuentes los registros individuales de muestra.
- Puedes responder sobre granjas, programas, lotes, diagnósticos, recomendaciones, labores y plantas — siempre dentro del alcance del usuario.
- Si te preguntan por datos a los que este usuario no tiene acceso, responde amablemente que no tienes esa información.
- Responde en español, de forma clara y estructurada.
- Si la información no está en el contexto, dilo claramente. No inventes datos.

CONTEXTO DEL SISTEMA:
{contexto}

HISTORIAL:
{historial_texto}

PREGUNTA: {pregunta}

RESPUESTA:"""

    model = _get_gemini_model()
    return model.generate_content(prompt).text