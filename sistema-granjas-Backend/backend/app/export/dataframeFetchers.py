"""
Módulo para obtener DataFrames de diferentes modelos
"""
from typing import Dict, List, Any
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
    
    def get_granjas_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de granjas bien formateado"""
        from app.db.models import Granja
        
        try:
            granjas = self.db.query(Granja).all()
            
            data = []
            for g in granjas:
                # Contar lotes
                lotes_count = len(g.lotes) if hasattr(g, 'lotes') else 0
                
                data.append({
                    'id': g.id,
                    'nombre': g.nombre,
                    'ubicacion': g.ubicacion,
                    'estado': 'Activa' if g.activo else 'Inactiva',
                    'fecha_creacion': g.fecha_creacion.strftime('%Y-%m-%d %H:%M') if g.fecha_creacion else '',
                    'cantidad_lotes': lotes_count,
                    'descripcion': f'Granja en {g.ubicacion}' if g.ubicacion else ''
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo granjas: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener granjas: {str(e)}"]})
    
    def get_lotes_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de lotes bien formateado"""
        from app.db.models import Lote
        
        try:
            lotes = self.db.query(Lote).options(
                joinedload(Lote.granja),
                joinedload(Lote.programa),
                joinedload(Lote.cultivo)
            ).all()
            
            data = []
            for l in lotes:
                data.append({
                    'id': l.id,
                    'nombre': l.nombre,
                    'granja': l.granja.nombre if l.granja else '',
                    'programa': l.programa.nombre if l.programa else '',
                    'cultivo': l.cultivo.nombre if l.cultivo else l.nombre_cultivo or '',
                    'tipo_gestion': l.tipo_gestion or '',
                    'estado': l.estado,
                    'fecha_inicio': l.fecha_inicio.strftime('%Y-%m-%d') if l.fecha_inicio else '',
                    'duracion_dias': l.duracion_dias or '',
                    'tipo_lote': l.tipo_lote.nombre if l.tipo_lote else ''
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo lotes: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener lotes: {str(e)}"]})
    
    def get_diagnosticos_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de diagnósticos bien formateado"""
        from app.db.models import Diagnostico
        
        try:
            diagnosticos = self.db.query(Diagnostico).options(
                joinedload(Diagnostico.estudiante),
                joinedload(Diagnostico.docente),
                joinedload(Diagnostico.lote)
            ).all()
            
            data = []
            for d in diagnosticos:
                data.append({
                    'id': d.id,
                    'tipo': d.tipo,
                    'descripcion': d.descripcion or '',
                    'lote': d.lote.nombre if d.lote else '',
                    'estudiante': d.estudiante.nombre if d.estudiante else '',
                    'docente': d.docente.nombre if d.docente else '',
                    'estado': d.estado,
                    'fecha_creacion': d.fecha_creacion.strftime('%Y-%m-%d %H:%M') if d.fecha_creacion else '',
                    'fecha_revision': d.fecha_revision.strftime('%Y-%m-%d %H:%M') if d.fecha_revision else '',
                    'observaciones': d.observaciones or ''
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo diagnósticos: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener diagnósticos: {str(e)}"]})
    
    def get_recomendaciones_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de recomendaciones bien formateado"""
        from app.db.models import Recomendacion
        
        try:
            recomendaciones = self.db.query(Recomendacion).options(
                joinedload(Recomendacion.docente),
                joinedload(Recomendacion.lote),
                joinedload(Recomendacion.diagnostico),
                joinedload(Recomendacion.labores)
            ).all()
            
            data = []
            for r in recomendaciones:
                # Contar labores
                labores_count = len(r.labores)
                labores_completadas = sum(1 for l in r.labores if l.estado == 'completada')
                
                data.append({
                    'id': r.id,
                    'titulo': r.titulo,
                    'descripcion': r.descripcion or '',
                    'tipo': r.tipo or '',
                    'estado': r.estado,
                    'docente': r.docente.nombre if r.docente else '',
                    'email_docente': r.docente.email if r.docente else '',
                    'lote': r.lote.nombre if r.lote else '',
                    'diagnostico': r.diagnostico.tipo if r.diagnostico else '',
                    'fecha_creacion': r.fecha_creacion.strftime('%Y-%m-%d %H:%M') if r.fecha_creacion else '',
                    'fecha_aprobacion': r.fecha_aprobacion.strftime('%Y-%m-%d %H:%M') if r.fecha_aprobacion else '',
                    'labores_totales': labores_count,
                    'labores_completadas': labores_completadas,
                    'porcentaje_avance': f"{(labores_completadas/labores_count*100):.1f}%" if labores_count > 0 else "0%"
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo recomendaciones: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener recomendaciones: {str(e)}"]})
    
    def get_labores_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de labores bien formateado"""
        from app.db.models import Labor
        
        try:
            labores = self.db.query(Labor).options(
                joinedload(Labor.trabajador),
                joinedload(Labor.recomendacion),
                joinedload(Labor.lote),
                joinedload(Labor.tipo_labor),
                joinedload(Labor.uso_insumos),
                joinedload(Labor.uso_herramientas)
            ).all()
            
            data = []
            for l in labores:
                # Contar recursos
                insumos_count = len(l.uso_insumos)
                herramientas_count = len(l.uso_herramientas)
                
                # Sumar cantidades de insumos
                total_insumos = sum(mov.cantidad for mov in l.uso_insumos)
                
                # Calcular duración
                duracion = ''
                if l.fecha_asignacion and l.fecha_finalizacion:
                    duracion_dias = (l.fecha_finalizacion - l.fecha_asignacion).days
                    duracion = f"{duracion_dias} días"
                
                data.append({
                    'id': l.id,
                    'descripcion': l.comentario or 'Sin descripción',
                    'tipo_labor': l.tipo_labor.nombre if l.tipo_labor else '',
                    'estado': l.estado,
                    'avance_porcentaje': l.avance_porcentaje,
                    'trabajador': l.trabajador.nombre if l.trabajador else '',
                    'email_trabajador': l.trabajador.email if l.trabajador else '',
                    'recomendacion': l.recomendacion.titulo if l.recomendacion else '',
                    'lote': l.lote.nombre if l.lote else '',
                    'fecha_asignacion': l.fecha_asignacion.strftime('%Y-%m-%d %H:%M') if l.fecha_asignacion else '',
                    'fecha_finalizacion': l.fecha_finalizacion.strftime('%Y-%m-%d %H:%M') if l.fecha_finalizacion else '',
                    'insumos_utilizados': insumos_count,
                    'herramientas_utilizadas': herramientas_count,
                    'total_insumos_cantidad': total_insumos,
                    'duracion': duracion
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo labores: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener labores: {str(e)}"]})
    
    def get_usuarios_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de usuarios bien formateado"""
        from app.db.models import Usuario
        
        try:
            usuarios = self.db.query(Usuario).options(
                joinedload(Usuario.rol)
            ).all()
            
            data = []
            for u in usuarios:
                # Contar labores asignadas
                labores_count = len(u.labores_asignadas)
                
                data.append({
                    'id': u.id,
                    'nombre': u.nombre,
                    'email': u.email,
                    'rol': u.rol.nombre if u.rol else '',
                    'estado': 'Activo' if u.activo else 'Inactivo',
                    'fecha_registro': u.fecha_creacion.strftime('%Y-%m-%d %H:%M') if u.fecha_creacion else '',
                    'labores_asignadas': labores_count,
                    'proveedor_autenticacion': u.auth_provider or 'Sistema'
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo usuarios: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener usuarios: {str(e)}"]})
    
    def get_insumos_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de insumos bien formateado"""
        from app.db.models import Insumo
        
        try:
            insumos = self.db.query(Insumo).options(
                joinedload(Insumo.programa)
            ).all()
            
            data = []
            for i in insumos:
                porcentaje = 0
                if i.cantidad_total > 0:
                    porcentaje = (i.cantidad_disponible / i.cantidad_total) * 100
                
                data.append({
                    'id': i.id,
                    'nombre': i.nombre,
                    'descripcion': i.descripcion or '',
                    'programa': i.programa.nombre if i.programa else '',
                    'cantidad_total': i.cantidad_total,
                    'cantidad_disponible': i.cantidad_disponible,
                    'unidad_medida': i.unidad_medida or '',
                    'nivel_alerta': i.nivel_alerta,
                    'estado': i.estado,
                    'porcentaje_disponible': f"{porcentaje:.1f}%",
                    'disponibilidad': 'Suficiente' if i.cantidad_disponible > i.nivel_alerta else 'Bajo stock'
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo insumos: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener insumos: {str(e)}"]})
    
    def get_herramientas_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de herramientas bien formateado"""
        from app.db.models import Herramienta
        
        try:
            herramientas = self.db.query(Herramienta).options(
                joinedload(Herramienta.categoria)
            ).all()
            
            data = []
            for h in herramientas:
                porcentaje = 0
                if h.cantidad_total > 0:
                    porcentaje = (h.cantidad_disponible / h.cantidad_total) * 100
                
                data.append({
                    'id': h.id,
                    'nombre': h.nombre,
                    'descripcion': h.descripcion or '',
                    'categoria': h.categoria.nombre if h.categoria else '',
                    'cantidad_total': h.cantidad_total,
                    'cantidad_disponible': h.cantidad_disponible,
                    'estado': h.estado,
                    'porcentaje_disponible': f"{porcentaje:.1f}%",
                    'disponibilidad': 'Disponible' if h.cantidad_disponible > 0 else 'No disponible'
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo herramientas: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener herramientas: {str(e)}"]})
    
    def get_programas_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de programas bien formateado"""
        from app.db.models import Programa
        
        try:
            programas = self.db.query(Programa).all()
            
            data = []
            for p in programas:
                # Contar lotes del programa
                lotes_count = len(p.lotes)
                
                data.append({
                    'id': p.id,
                    'nombre': p.nombre,
                    'descripcion': p.descripcion or '',
                    'tipo': p.tipo,
                    'estado': 'Activo' if p.activo else 'Inactivo',
                    'fecha_creacion': p.fecha_creacion.strftime('%Y-%m-%d %H:%M') if p.fecha_creacion else '',
                    'cantidad_lotes': lotes_count,
                    'cantidad_usuarios': len(p.usuarios) if hasattr(p, 'usuarios') else 0
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo programas: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener programas: {str(e)}"]})
    
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
                    'id': c.id,
                    'nombre': c.nombre,
                    'tipo': c.tipo,
                    'descripcion': c.descripcion or '',
                    'granja': c.granja.nombre if c.granja else '',
                    'estado': c.estado,
                    'fecha_inicio': c.fecha_inicio.strftime('%Y-%m-%d') if c.fecha_inicio else '',
                    'duracion_dias': c.duracion_dias or ''
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo cultivos: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudieron obtener cultivos: {str(e)}"]})
    
    def get_movimientos_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de movimientos bien formateado"""
        from app.db.models import MovimientoInsumo, MovimientoHerramienta, Labor
        
        try:
            data = []
            
            # Movimientos de insumos
            movimientos_insumos = self.db.query(MovimientoInsumo).options(
                joinedload(MovimientoInsumo.insumo),
                joinedload(MovimientoInsumo.labor).joinedload(Labor.recomendacion)
            ).all()
            
            for mov in movimientos_insumos:
                data.append({
                    'tipo_recurso': 'INSUMO',
                    'id_movimiento': mov.id,
                    'recurso': mov.insumo.nombre if mov.insumo else '',
                    'cantidad': mov.cantidad,
                    'tipo_movimiento': mov.tipo_movimiento,
                    'unidad': mov.insumo.unidad_medida if mov.insumo else '',
                    'labor': mov.labor.comentario[:50] + '...' if mov.labor and mov.labor.comentario else '',
                    'recomendacion': mov.labor.recomendacion.titulo if mov.labor and mov.labor.recomendacion else '',
                    'fecha_movimiento': mov.fecha_movimiento.strftime('%Y-%m-%d %H:%M') if mov.fecha_movimiento else '',
                    'observaciones': mov.observaciones or ''
                })
            
            # Movimientos de herramientas
            movimientos_herramientas = self.db.query(MovimientoHerramienta).options(
                joinedload(MovimientoHerramienta.herramienta),
                joinedload(MovimientoHerramienta.labor).joinedload(Labor.recomendacion)
            ).all()
            
            for mov in movimientos_herramientas:
                data.append({
                    'tipo_recurso': 'HERRAMIENTA',
                    'id_movimiento': mov.id,
                    'recurso': mov.herramienta.nombre if mov.herramienta else '',
                    'cantidad': mov.cantidad,
                    'tipo_movimiento': mov.tipo_movimiento,
                    'labor': mov.labor.comentario[:50] + '...' if mov.labor and mov.labor.comentario else '',
                    'recomendacion': mov.labor.recomendacion.titulo if mov.labor and mov.labor.recomendacion else '',
                    'fecha_movimiento': mov.fecha_movimiento.strftime('%Y-%m-%d %H:%M') if mov.fecha_movimiento else '',
                    'observaciones': mov.observaciones or ''
                })
            
            df = pd.DataFrame(data)
            return self._format_dataframe(df)
        except Exception as e:
            logger.error(f"Error obteniendo movimientos: {str(e)}")
            return pd.DataFrame()
    
    def get_resumen_dataframe(self) -> pd.DataFrame:
        """Obtener DataFrame de resumen bien formateado"""
        from app.db.models import (
            Granja, Lote, Diagnostico, Recomendacion, 
            Labor, Usuario, Insumo, Herramienta, Programa
        )
        
        try:
            # Calcular estadísticas
            total_granjas = self.db.query(func.count(Granja.id)).scalar() or 0
            total_lotes = self.db.query(func.count(Lote.id)).scalar() or 0
            total_diagnosticos = self.db.query(func.count(Diagnostico.id)).scalar() or 0
            total_recomendaciones = self.db.query(func.count(Recomendacion.id)).scalar() or 0
            total_labores = self.db.query(func.count(Labor.id)).scalar() or 0
            total_usuarios = self.db.query(func.count(Usuario.id)).scalar() or 0
            total_insumos = self.db.query(func.count(Insumo.id)).scalar() or 0
            total_herramientas = self.db.query(func.count(Herramienta.id)).scalar() or 0
            total_programas = self.db.query(func.count(Programa.id)).scalar() or 0
            
            # Contar por estado
            labores_completadas = self.db.query(func.count(Labor.id)).filter(
                Labor.estado == 'completada'
            ).scalar() or 0
            
            recomendaciones_aprobadas = self.db.query(func.count(Recomendacion.id)).filter(
                Recomendacion.estado == 'aprobada'
            ).scalar() or 0
            
            usuarios_activos = self.db.query(func.count(Usuario.id)).filter(
                Usuario.activo == True
            ).scalar() or 0
            
            data = [{
                'Métrica': 'Total Granjas',
                'Valor': total_granjas,
                'Detalle': ''
            }, {
                'Métrica': 'Total Lotes',
                'Valor': total_lotes,
                'Detalle': ''
            }, {
                'Métrica': 'Total Diagnósticos',
                'Valor': total_diagnosticos,
                'Detalle': ''
            }, {
                'Métrica': 'Total Recomendaciones',
                'Valor': total_recomendaciones,
                'Detalle': f'Aprobadas: {recomendaciones_aprobadas}'
            }, {
                'Métrica': 'Total Labores',
                'Valor': total_labores,
                'Detalle': f'Completadas: {labores_completadas}'
            }, {
                'Métrica': 'Total Usuarios',
                'Valor': total_usuarios,
                'Detalle': f'Activos: {usuarios_activos}'
            }, {
                'Métrica': 'Total Insumos',
                'Valor': total_insumos,
                'Detalle': ''
            }, {
                'Métrica': 'Total Herramientas',
                'Valor': total_herramientas,
                'Detalle': ''
            }, {
                'Métrica': 'Total Programas',
                'Valor': total_programas,
                'Detalle': ''
            }, {
                'Métrica': 'Fecha Generación',
                'Valor': (datetime.utcnow()-timedelta(hours=5)).strftime('%Y-%m-%d %H:%M:%S'),
                'Detalle': ''
            }, {
                'Métrica': 'Generado por',
                'Valor': self.usuario.nombre if self.usuario else 'Sistema',
                'Detalle': self.usuario.email if self.usuario else ''
            }]
            
            df = pd.DataFrame(data)
            return df
        except Exception as e:
            logger.error(f"Error obteniendo resumen: {str(e)}")
            return pd.DataFrame({"Error": [f"No se pudo generar resumen: {str(e)}"]})
    
    def _format_dataframe(self, df: pd.DataFrame, title: str = "") -> pd.DataFrame:
        """Formatear DataFrame para Excel (método interno)"""
        if df.empty:
            return pd.DataFrame({"Mensaje": ["No hay datos para mostrar"]})
        
        # Renombrar columnas para mejor legibilidad
        column_rename = {}
        for col in df.columns:
            if '_' in str(col):
                # Convertir snake_case a Title Case
                new_name = ' '.join(word.capitalize() for word in str(col).split('_'))
                column_rename[col] = new_name
            elif col.lower() == col:
                # Si está todo en minúscula, capitalizar
                column_rename[col] = str(col).capitalize()
        
        if column_rename:
            df = df.rename(columns=column_rename)
        
        # Ordenar columnas de forma lógica
        preferred_order = [
            'Id', 'Código', 'Nombre', 'Título', 'Descripción',
            'Tipo', 'Estado', 'Fecha Creación', 'Fecha Actualización',
            'Usuario', 'Email', 'Rol', 'Granja', 'Lote', 'Programa',
            'Cultivo', 'Cantidad', 'Unidad', 'Avance', 'Comentario'
        ]
        
        # Mantener solo las columnas que existen
        existing_cols = [col for col in preferred_order if col in df.columns]
        other_cols = [col for col in df.columns if col not in existing_cols]
        
        return df[existing_cols + other_cols]