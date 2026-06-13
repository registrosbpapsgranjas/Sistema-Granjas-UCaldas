"""
Módulo para obtener DataFrames de diferentes modelos
"""
from typing import Dict, List, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class DataframeFetchers:
    """Clase para obtener DataFrames de diferentes entidades"""

    def __init__(self, db: Session, usuario=None):
        self.db = db
        self.usuario = usuario

    # ------------------------------------------------------------------
    # Helpers de filtrado por rol
    # ------------------------------------------------------------------

    def _get_rol(self) -> str:
        """Retorna el nombre del rol del usuario en minúsculas, o cadena vacía."""
        if self.usuario is None or not self.usuario.rol:
            return ""
        return (self.usuario.rol.nombre or "").lower()

    def _is_admin(self) -> bool:
        rol = self._get_rol()
        return any(r in rol for r in ("admin", "coordinador", "superuser"))

    def _is_docente(self) -> bool:
        return "docente" in self._get_rol()

    def _is_estudiante(self) -> bool:
        return "estudiante" in self._get_rol()

    def _get_program_ids(self) -> Optional[List[int]]:
        """
        Retorna lista de IDs de programa accesibles para el usuario.
        Devuelve None si el usuario es admin/coordinador (sin restricción).
        """
        if self.usuario is None:
            return None
        if self._is_admin():
            return None
        ids = [p.id for p in (self.usuario.programas or [])]
        return ids

    def _get_granja_ids(self) -> Optional[List[int]]:
        """
        Retorna lista de IDs de granja accesibles para el usuario.
        Devuelve None si el usuario es admin/coordinador.
        """
        if self.usuario is None:
            return None
        rol_nombre = (self.usuario.rol.nombre or "").lower() if self.usuario.rol else ""
        if any(r in rol_nombre for r in ("admin", "coordinador", "superuser")):
            return None
        ids = [g.id for g in (self.usuario.granjas or [])]
        return ids

    # ------------------------------------------------------------------
    # Granjas
    # ------------------------------------------------------------------

    def get_granjas_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de granjas bien formateado"""
        from app.db.models import Granja

        try:
            query = self.db.query(Granja)

            granja_ids = self._get_granja_ids()
            if granja_ids is not None:
                query = query.filter(Granja.id.in_(granja_ids))

            granjas = query.all()

            data = []
            for g in granjas:
                lotes_count = len(g.lotes) if hasattr(g, "lotes") else 0
                data.append({
                    "id": g.id,
                    "nombre": g.nombre,
                    "ubicacion": g.ubicacion,
                    "estado": "Activa" if g.activo else "Inactiva",
                    "fecha_creacion": g.fecha_creacion.strftime("%Y-%m-%d %H:%M") if g.fecha_creacion else "",
                    "cantidad_lotes": lotes_count,
                    "descripcion": f"Granja en {g.ubicacion}" if g.ubicacion else "",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo granjas: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener granjas: {str(e)}"]})

    # ------------------------------------------------------------------
    # Lotes
    # ------------------------------------------------------------------

    def get_lotes_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de lotes bien formateado"""
        from app.db.models import Lote

        try:
            query = self.db.query(Lote).options(
                joinedload(Lote.granja),
                joinedload(Lote.programa),
            )

            program_ids = self._get_program_ids()
            if program_ids is not None:
                query = query.filter(Lote.programa_id.in_(program_ids))

            lotes = query.all()

            data = []
            for l in lotes:
                cultivo_nombre = ""
                if hasattr(l, "cultivos_asignados") and l.cultivos_asignados:
                    cultivo_nombre = ", ".join(
                        lc.cultivo.nombre for lc in l.cultivos_asignados if lc.cultivo
                    )

                data.append({
                    "id": l.id,
                    "nombre": l.nombre,
                    "granja": l.granja.nombre if l.granja else "",
                    "programa": l.programa.nombre if l.programa else "",
                    "cultivo": cultivo_nombre,
                    "tipo_lote": l.tipo_lote.nombre if l.tipo_lote else "",
                    "estado": l.estado,
                    "fecha_inicio": l.fecha_inicio.strftime("%Y-%m-%d") if l.fecha_inicio else "",
                    "surcos": l.surcos,
                    "plantas_por_surco": l.plantas_por_surco,
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo lotes: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener lotes: {str(e)}"]})

    # ------------------------------------------------------------------
    # Diagnósticos  ← CORREGIDO + filtrado por rol
    # ------------------------------------------------------------------

    def get_diagnosticos_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de diagnósticos bien formateado.

        Reglas:
          - Admin / Coordinador : todos los diagnósticos.
          - Docente              : todos los diagnósticos de sus programas.
          - Estudiante           : únicamente sus propios diagnósticos.
        """
        from app.db.models import Diagnostico

        try:
            query = self.db.query(Diagnostico).options(
                joinedload(Diagnostico.usuario),
                joinedload(Diagnostico.lote),
                joinedload(Diagnostico.programa),
                joinedload(Diagnostico.diagnostico_tipo),
            )

            if self._is_estudiante():
                # Solo sus propios diagnósticos (filtro directo, sin JOIN)
                query = query.filter(Diagnostico.usuario_id == self.usuario.id)
            else:
                # Docente / admin: subconsulta por programas asignados
                program_ids = self._get_program_ids()
                if program_ids is not None:
                    # programa_id es columna directa — no hay conflicto con joinedload
                    query = query.filter(Diagnostico.programa_id.in_(program_ids))

            diagnosticos = query.all()

            data = []
            for d in diagnosticos:
                data.append({
                    "id": d.id,
                    "tipo_diagnostico": d.tipo_diagnostico,
                    "subtipo": d.diagnostico_tipo.nombre if d.diagnostico_tipo else "",
                    "condiciones_dia": d.condiciones_dia,
                    "lote": d.lote.nombre if d.lote else "",
                    "programa": d.programa.nombre if d.programa else "",
                    "usuario": d.usuario.nombre if d.usuario else "",
                    "email_usuario": d.usuario.email if d.usuario else "",
                    "estado_revision": d.estado_revision,
                    "fecha_creacion": d.fecha_creacion.strftime("%Y-%m-%d %H:%M") if d.fecha_creacion else "",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo diagnósticos: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener diagnósticos: {str(e)}"]})

    # ------------------------------------------------------------------
    # Recomendaciones  ← CORREGIDO + filtrado por rol
    # ------------------------------------------------------------------

    def get_recomendaciones_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de recomendaciones bien formateado.

        Reglas:
          - Admin / Coordinador : todas las recomendaciones.
          - Docente              : solo las recomendaciones que él mismo creó.
          - Estudiante           : solo las recomendaciones vinculadas a sus
                                   propios diagnósticos.
        """
        from app.db.models import Recomendacion, Lote, Diagnostico

        try:
            query = self.db.query(Recomendacion).options(
                joinedload(Recomendacion.docente),
                joinedload(Recomendacion.lote).joinedload(Lote.programa),
                joinedload(Recomendacion.diagnostico),
                joinedload(Recomendacion.labores),
            )

            if self._is_estudiante():
                # Subconsulta: IDs de diagnósticos propios del estudiante
                diag_ids = (
                    self.db.query(Diagnostico.id)
                    .filter(Diagnostico.usuario_id == self.usuario.id)
                    .subquery()
                )
                query = query.filter(Recomendacion.diagnostico_id.in_(diag_ids))
            elif self._is_docente():
                # Solo las recomendaciones que él mismo creó (filtro directo, sin JOIN)
                query = query.filter(Recomendacion.docente_id == self.usuario.id)
            else:
                # Admin: subconsulta por lotes de sus programas
                program_ids = self._get_program_ids()
                if program_ids is not None:
                    lotes_ids = (
                        self.db.query(Lote.id)
                        .filter(Lote.programa_id.in_(program_ids))
                        .subquery()
                    )
                    query = query.filter(Recomendacion.lote_id.in_(lotes_ids))

            recomendaciones = query.all()

            data = []
            for r in recomendaciones:
                labores_count = len(r.labores)
                labores_completadas = sum(1 for l in r.labores if l.estado == "completada")

                data.append({
                    "id": r.id,
                    "titulo": r.titulo,
                    "descripcion": r.descripcion or "",
                    "tipo": r.tipo or "",
                    "estado": r.estado,
                    "docente": r.docente.nombre if r.docente else "",
                    "email_docente": r.docente.email if r.docente else "",
                    "lote": r.lote.nombre if r.lote else "",
                    "programa": r.lote.programa.nombre if (r.lote and r.lote.programa) else "",
                    "diagnostico": r.diagnostico.tipo_diagnostico if r.diagnostico else "",
                    "fecha_creacion": r.fecha_creacion.strftime("%Y-%m-%d %H:%M") if r.fecha_creacion else "",
                    "fecha_aprobacion": r.fecha_aprobacion.strftime("%Y-%m-%d %H:%M") if r.fecha_aprobacion else "",
                    "labores_totales": labores_count,
                    "labores_completadas": labores_completadas,
                    "porcentaje_avance": f"{(labores_completadas / labores_count * 100):.1f}%" if labores_count > 0 else "0%",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo recomendaciones: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener recomendaciones: {str(e)}"]})

    # ------------------------------------------------------------------
    # Labores  ← CORREGIDO + filtrado por rol/programa
    # ------------------------------------------------------------------

    def get_labores_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de labores bien formateado.

        Reglas:
          - Admin / Coordinador : todas las labores.
          - Docente / resto      : solo labores de sus programas asignados.
        """
        from app.db.models import Labor, Lote

        try:
            query = self.db.query(Labor).options(
                joinedload(Labor.trabajador),
                joinedload(Labor.recomendacion),
                joinedload(Labor.lote).joinedload(Lote.programa),
                joinedload(Labor.productos),
            )

            program_ids = self._get_program_ids()
            if program_ids is not None:
                # Subconsulta para evitar conflicto con el joinedload de lote
                lotes_del_programa = (
                    self.db.query(Lote.id)
                    .filter(Lote.programa_id.in_(program_ids))
                    .subquery()
                )
                query = query.filter(Labor.lote_id.in_(lotes_del_programa))

            labores = query.all()

            data = []
            for l in labores:
                productos_count = len(l.productos) if l.productos else 0

                duracion = ""
                if l.fecha_asignacion and l.fecha_finalizacion:
                    duracion_dias = (l.fecha_finalizacion - l.fecha_asignacion).days
                    duracion = f"{duracion_dias} días"

                data.append({
                    "id": l.id,
                    "descripcion": l.comentario or "Sin descripción",
                    "tipo_labor_id": l.tipo_labor_id or "",
                    "estado": l.estado,
                    "avance_porcentaje": l.avance_porcentaje,
                    "trabajador": l.trabajador.nombre if l.trabajador else "",
                    "email_trabajador": l.trabajador.email if l.trabajador else "",
                    "recomendacion": l.recomendacion.titulo if l.recomendacion else "",
                    "lote": l.lote.nombre if l.lote else "",
                    "programa": l.lote.programa.nombre if (l.lote and l.lote.programa) else "",
                    "fecha_asignacion": l.fecha_asignacion.strftime("%Y-%m-%d %H:%M") if l.fecha_asignacion else "",
                    "fecha_finalizacion": l.fecha_finalizacion.strftime("%Y-%m-%d %H:%M") if l.fecha_finalizacion else "",
                    "productos_utilizados": productos_count,
                    "duracion": duracion,
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo labores: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener labores: {str(e)}"]})

    # ------------------------------------------------------------------
    # Usuarios
    # ------------------------------------------------------------------

    def get_usuarios_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de usuarios bien formateado"""
        from app.db.models import Usuario, usuario_programa

        try:
            program_ids = self._get_program_ids()

            if program_ids is not None:
                query = (
                    self.db.query(Usuario)
                    .options(joinedload(Usuario.rol))
                    .join(usuario_programa, Usuario.id == usuario_programa.c.usuario_id)
                    .filter(usuario_programa.c.programa_id.in_(program_ids))
                    .distinct()
                )
            else:
                query = self.db.query(Usuario).options(joinedload(Usuario.rol))

            usuarios = query.all()

            data = []
            for u in usuarios:
                labores_count = len(u.labores_asignadas) if hasattr(u, "labores_asignadas") else 0
                data.append({
                    "id": u.id,
                    "nombre": u.nombre,
                    "email": u.email,
                    "rol": u.rol.nombre if u.rol else "",
                    "estado": "Activo" if u.activo else "Inactivo",
                    "fecha_registro": u.fecha_creacion.strftime("%Y-%m-%d %H:%M") if u.fecha_creacion else "",
                    "labores_asignadas": labores_count,
                    "proveedor_autenticacion": u.auth_provider or "Sistema",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo usuarios: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener usuarios: {str(e)}"]})

    # ------------------------------------------------------------------
    # Insumos
    # ------------------------------------------------------------------

    def get_insumos_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de insumos bien formateado"""
        try:
            from app.db.models import Insumo
            query = self.db.query(Insumo).options(joinedload(Insumo.programa))

            program_ids = self._get_program_ids()
            if program_ids is not None:
                query = query.filter(Insumo.programa_id.in_(program_ids))

            insumos = query.all()

            data = []
            for i in insumos:
                porcentaje = 0
                if i.cantidad_total and i.cantidad_total > 0:
                    porcentaje = (i.cantidad_disponible / i.cantidad_total) * 100

                data.append({
                    "id": i.id,
                    "nombre": i.nombre,
                    "descripcion": i.descripcion or "",
                    "programa": i.programa.nombre if i.programa else "",
                    "cantidad_total": i.cantidad_total,
                    "cantidad_disponible": i.cantidad_disponible,
                    "unidad_medida": i.unidad_medida or "",
                    "nivel_alerta": i.nivel_alerta,
                    "estado": i.estado,
                    "porcentaje_disponible": f"{porcentaje:.1f}%",
                    "disponibilidad": "Suficiente" if i.cantidad_disponible > i.nivel_alerta else "Bajo stock",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo insumos: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener insumos: {str(e)}"]})

    # ------------------------------------------------------------------
    # Herramientas
    # ------------------------------------------------------------------

    def get_herramientas_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de herramientas bien formateado"""
        try:
            from app.db.models import Herramienta
            query = self.db.query(Herramienta).options(joinedload(Herramienta.categoria))

            herramientas = query.all()

            data = []
            for h in herramientas:
                porcentaje = 0
                if h.cantidad_total and h.cantidad_total > 0:
                    porcentaje = (h.cantidad_disponible / h.cantidad_total) * 100

                data.append({
                    "id": h.id,
                    "nombre": h.nombre,
                    "descripcion": h.descripcion or "",
                    "categoria": h.categoria.nombre if h.categoria else "",
                    "cantidad_total": h.cantidad_total,
                    "cantidad_disponible": h.cantidad_disponible,
                    "estado": h.estado,
                    "porcentaje_disponible": f"{porcentaje:.1f}%",
                    "disponibilidad": "Disponible" if h.cantidad_disponible > 0 else "No disponible",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo herramientas: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener herramientas: {str(e)}"]})

    # ------------------------------------------------------------------
    # Programas
    # ------------------------------------------------------------------

    def get_programas_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de programas bien formateado"""
        from app.db.models import Programa

        try:
            query = self.db.query(Programa)

            program_ids = self._get_program_ids()
            if program_ids is not None:
                query = query.filter(Programa.id.in_(program_ids))

            programas = query.all()

            data = []
            for p in programas:
                lotes_count = len(p.lotes) if hasattr(p, "lotes") else 0
                data.append({
                    "id": p.id,
                    "nombre": p.nombre,
                    "descripcion": p.descripcion or "",
                    "tipo": p.tipo,
                    "estado": "Activo" if p.activo else "Inactivo",
                    "fecha_creacion": p.fecha_creacion.strftime("%Y-%m-%d %H:%M") if p.fecha_creacion else "",
                    "cantidad_lotes": lotes_count,
                    "cantidad_usuarios": len(p.usuarios) if hasattr(p, "usuarios") else 0,
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo programas: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener programas: {str(e)}"]})

    # ------------------------------------------------------------------
    # Cultivos  ← CORREGIDO (elimina fecha_inicio y duracion_dias)
    # ------------------------------------------------------------------

    def get_cultivos_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de cultivos bien formateado"""
        from app.db.models import CultivoEspecie

        try:
            cultivos = self.db.query(CultivoEspecie).options(
                joinedload(CultivoEspecie.granja)
            ).all()

            data = []
            for c in cultivos:
                data.append({
                    "id": c.id,
                    "nombre": c.nombre,
                    "tipo": c.tipo,
                    "descripcion": c.descripcion or "",
                    "granja": c.granja.nombre if c.granja else "",
                    "estado": c.estado,
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo cultivos: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener cultivos: {str(e)}"]})

    # ------------------------------------------------------------------
    # Plantas
    # ------------------------------------------------------------------

    def get_plantas_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de plantas bien formateado"""
        from app.db.models import Planta, Lote

        try:
            query = (
                self.db.query(
                    Planta.id,
                    Planta.codigo,
                    Planta.surco,
                    Planta.numero,
                    Planta.estado,
                    Lote.nombre.label("lote_nombre"),
                    Lote.programa_id.label("programa_id"),
                )
                .outerjoin(Lote, Planta.lote_id == Lote.id)
            )

            program_ids = self._get_program_ids()
            if program_ids is not None:
                query = query.filter(Lote.programa_id.in_(program_ids))

            plantas_data = query.all()

            data = []
            for p in plantas_data:
                data.append({
                    "id": p.id,
                    "codigo": p.codigo,
                    "surco": p.surco,
                    "numero": p.numero,
                    "estado": p.estado,
                    "lote": p.lote_nombre or "",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo plantas: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener plantas: {str(e)}"]})

    # ------------------------------------------------------------------
    # Movimientos
    # ------------------------------------------------------------------

    def get_movimientos_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de movimientos bien formateado"""
        try:
            from app.db.models import MovimientoInsumo, MovimientoHerramienta, Labor
        except ImportError:
            return pd.DataFrame()

        try:
            data = []

            movimientos_insumos = self.db.query(MovimientoInsumo).options(
                joinedload(MovimientoInsumo.insumo),
                joinedload(MovimientoInsumo.labor).joinedload(Labor.recomendacion),
            ).all()

            for mov in movimientos_insumos:
                data.append({
                    "tipo_recurso": "INSUMO",
                    "id_movimiento": mov.id,
                    "recurso": mov.insumo.nombre if mov.insumo else "",
                    "cantidad": mov.cantidad,
                    "tipo_movimiento": mov.tipo_movimiento,
                    "unidad": mov.insumo.unidad_medida if mov.insumo else "",
                    "labor": (mov.labor.comentario[:50] + "...") if mov.labor and mov.labor.comentario else "",
                    "recomendacion": mov.labor.recomendacion.titulo if mov.labor and mov.labor.recomendacion else "",
                    "fecha_movimiento": mov.fecha_movimiento.strftime("%Y-%m-%d %H:%M") if mov.fecha_movimiento else "",
                    "observaciones": mov.observaciones or "",
                })

            movimientos_herramientas = self.db.query(MovimientoHerramienta).options(
                joinedload(MovimientoHerramienta.herramienta),
                joinedload(MovimientoHerramienta.labor).joinedload(Labor.recomendacion),
            ).all()

            for mov in movimientos_herramientas:
                data.append({
                    "tipo_recurso": "HERRAMIENTA",
                    "id_movimiento": mov.id,
                    "recurso": mov.herramienta.nombre if mov.herramienta else "",
                    "cantidad": mov.cantidad,
                    "tipo_movimiento": mov.tipo_movimiento,
                    "labor": (mov.labor.comentario[:50] + "...") if mov.labor and mov.labor.comentario else "",
                    "recomendacion": mov.labor.recomendacion.titulo if mov.labor and mov.labor.recomendacion else "",
                    "fecha_movimiento": mov.fecha_movimiento.strftime("%Y-%m-%d %H:%M") if mov.fecha_movimiento else "",
                    "observaciones": mov.observaciones or "",
                })

            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo movimientos: {str(e)}")
            return pd.DataFrame()

    # ------------------------------------------------------------------
    # Resumen
    # ------------------------------------------------------------------

    def get_resumen_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de resumen bien formateado"""
        from app.db.models import (
            Granja, Lote, Diagnostico, Recomendacion,
            Labor, Usuario, Programa,
        )

        try:
            program_ids = self._get_program_ids()

            def count(model, extra_filter=None):
                q = self.db.query(func.count(model.id))
                if extra_filter is not None:
                    q = q.filter(extra_filter)
                return q.scalar() or 0

            if program_ids is None:
                total_granjas = count(Granja)
                total_lotes = count(Lote)
                total_diagnosticos = count(Diagnostico)
                total_recomendaciones = count(Recomendacion)
                total_labores = count(Labor)
                total_usuarios = count(Usuario)
                total_programas = count(Programa)
            else:
                total_granjas = count(Granja)
                total_lotes = count(Lote, Lote.programa_id.in_(program_ids))
                total_diagnosticos = count(Diagnostico, Diagnostico.programa_id.in_(program_ids))
                total_recomendaciones = (
                    self.db.query(func.count(Recomendacion.id))
                    .join(Recomendacion.lote)
                    .filter(Lote.programa_id.in_(program_ids))
                    .scalar() or 0
                )
                total_labores = (
                    self.db.query(func.count(Labor.id))
                    .join(Labor.lote)
                    .filter(Lote.programa_id.in_(program_ids))
                    .scalar() or 0
                )
                total_usuarios = count(Usuario)
                total_programas = len(program_ids)

            labores_completadas = (
                self.db.query(func.count(Labor.id))
                .filter(Labor.estado == "completada")
                .scalar() or 0
            )
            recomendaciones_aprobadas = (
                self.db.query(func.count(Recomendacion.id))
                .filter(Recomendacion.estado == "aprobada")
                .scalar() or 0
            )
            usuarios_activos = (
                self.db.query(func.count(Usuario.id))
                .filter(Usuario.activo == True)
                .scalar() or 0
            )

            data = [
                {"Métrica": "Total Granjas", "Valor": total_granjas, "Detalle": ""},
                {"Métrica": "Total Lotes", "Valor": total_lotes, "Detalle": ""},
                {"Métrica": "Total Diagnósticos", "Valor": total_diagnosticos, "Detalle": ""},
                {"Métrica": "Total Recomendaciones", "Valor": total_recomendaciones, "Detalle": f"Aprobadas: {recomendaciones_aprobadas}"},
                {"Métrica": "Total Labores", "Valor": total_labores, "Detalle": f"Completadas: {labores_completadas}"},
                {"Métrica": "Total Usuarios", "Valor": total_usuarios, "Detalle": f"Activos: {usuarios_activos}"},
                {"Métrica": "Total Programas", "Valor": total_programas, "Detalle": ""},
                {
                    "Métrica": "Fecha Generación",
                    "Valor": (datetime.utcnow() - timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S"),
                    "Detalle": "",
                },
                {
                    "Métrica": "Generado por",
                    "Valor": self.usuario.nombre if self.usuario else "Sistema",
                    "Detalle": self.usuario.email if self.usuario else "",
                },
            ]

            return pd.DataFrame(data)
        except Exception as e:
            logger.error(f"Error obteniendo resumen: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudo generar resumen: {str(e)}"]})

    # ------------------------------------------------------------------
    # Formato interno
    # ------------------------------------------------------------------

    def _format_dataframe(self, df: pd.DataFrame, title: str = "") -> pd.DataFrame:
        """Formatear DataFrame para Excel (método interno)"""
        if df.empty:
            return pd.DataFrame({"Mensaje": ["No hay datos para mostrar"]})

        column_rename = {}
        for col in df.columns:
            if "_" in str(col):
                new_name = " ".join(word.capitalize() for word in str(col).split("_"))
                column_rename[col] = new_name
            elif col.lower() == col:
                column_rename[col] = str(col).capitalize()

        if column_rename:
            df = df.rename(columns=column_rename)

        preferred_order = [
            "Id", "Código", "Nombre", "Título", "Descripción",
            "Tipo", "Estado", "Fecha Creación", "Fecha Actualización",
            "Usuario", "Email", "Rol", "Granja", "Lote", "Programa",
            "Cultivo", "Cantidad", "Unidad", "Avance", "Comentario",
        ]

        existing_cols = [col for col in preferred_order if col in df.columns]
        other_cols = [col for col in df.columns if col not in existing_cols]

        return df[existing_cols + other_cols]
