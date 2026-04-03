"""
Servicio de exportación con Excel - Archivos XLSX bien formateados
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
import io
from fastapi.responses import StreamingResponse
import logging
from openpyxl.styles import Font, PatternFill
from app.export.dataframeFetchers import DataframeFetchers

logger = logging.getLogger(__name__)

class ExportService:
    """Servicio de exportación con Excel para archivos bien formateados"""
    
    def __init__(self, db, usuario=None):
        self.db = db
        self.usuario = usuario
        self.dataframe_fetcher = DataframeFetchers(db, usuario)
    
    def _create_excel_response(self, dataframes: Dict[str, pd.DataFrame], filename: str) -> StreamingResponse:
        """Crear respuesta Excel (.xlsx) con múltiples hojas"""
        try:
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                for sheet_name, df in dataframes.items():
                    # Limitar nombre de hoja a 31 caracteres (limitación de Excel)
                    safe_sheet_name = sheet_name[:31]
                    
                    # Escribir DataFrame en hoja
                    df.to_excel(
                        writer, 
                        sheet_name=safe_sheet_name,
                        index=False
                    )
                    
                    # Obtener worksheet
                    worksheet = writer.sheets[safe_sheet_name]
                    
                    # Ajustar ancho de columnas automáticamente
                    for column in df.columns:
                        column_length = max(
                            df[column].astype(str).map(len).max(),
                            len(str(column))
                        )
                        col_idx = df.columns.get_loc(column)
                        worksheet.column_dimensions[chr(65 + col_idx)].width = min(column_length + 2, 50)
                    
                    # Formatear encabezados SIN usar _default_cell_style
                    for cell in worksheet[1]:
                        cell.font = Font(bold=True, color="000000")
                        cell.fill = PatternFill(start_color="DDDDDD", fill_type="solid")

            output.seek(0)
            
            return StreamingResponse(
                output,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}.xlsx"
                }
            )
        except Exception as e:
            logger.error(f"Error creando Excel: {str(e)}")
            raise
    
    def _create_single_excel_response(self, df: pd.DataFrame, filename: str, sheet_name: str = "Datos") -> StreamingResponse:
        """Crear respuesta Excel con una sola hoja"""
        return self._create_excel_response({sheet_name: df}, filename)
    
    def _format_dataframe(self, df: pd.DataFrame, title: str = "") -> pd.DataFrame:
        """Formatear DataFrame para Excel"""
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
    
    # ==================== EXPORTACIÓN COMPLETA EN EXCEL ====================
    def export_todo_excel(self) -> StreamingResponse:
        """
        Exporta TODA la base de datos en un Excel con múltiples hojas
        """
        dataframes = {}
        
        # 1. RESUMEN
        dataframes['00_Resumen'] = self.dataframe_fetcher.get_resumen_dataframe()
        
        # 2. GRANJAS
        dataframes['01_Granjas'] = self.dataframe_fetcher.get_granjas_dataframe()
        
        # 3. LOTES
        dataframes['02_Lotes'] = self.dataframe_fetcher.get_lotes_dataframe()
        
        # 4. DIAGNÓSTICOS
        dataframes['03_Diagnosticos'] = self.dataframe_fetcher.get_diagnosticos_dataframe()
        
        # 5. RECOMENDACIONES
        dataframes['04_Recomendaciones'] = self.dataframe_fetcher.get_recomendaciones_dataframe()
        
        # 6. LABORES
        dataframes['05_Labores'] = self.dataframe_fetcher.get_labores_dataframe()
        
        # 7. USUARIOS
        dataframes['06_Usuarios'] = self.dataframe_fetcher.get_usuarios_dataframe()
        
        # 8. INSUMOS
        dataframes['07_Insumos'] = self.dataframe_fetcher.get_insumos_dataframe()
        
        # 9. HERRAMIENTAS
        dataframes['08_Herramientas'] = self.dataframe_fetcher.get_herramientas_dataframe()
        
        # 10. PROGRAMAS
        dataframes['09_Programas'] = self.dataframe_fetcher.get_programas_dataframe()
        
        # 11. CULTIVOS
        dataframes['10_Cultivos'] = self.dataframe_fetcher.get_cultivos_dataframe()
        
        # 12. MOVIMIENTOS
        movimientos_df = self.dataframe_fetcher.get_movimientos_dataframe()
        if not movimientos_df.empty:
            dataframes['11_Movimientos'] = movimientos_df
        
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d_%H%M%S")
        filename = f"backup_completo_{fecha}"
        
        return self._create_excel_response(dataframes, filename)
    
    # ==================== MÉTODOS PÚBLICOS SIMPLIFICADOS ====================
    
    def export_granjas_excel(self) -> StreamingResponse:
        """Exportar granjas en Excel"""
        df = self.dataframe_fetcher.get_granjas_dataframe()
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d_%H%M%S")
        return self._create_single_excel_response(df, f"granjas_{fecha}", "Granjas")
    
    def export_lotes_excel(self, detallado: bool = False, lote_id: Optional[int] = None) -> StreamingResponse:
        """Exportar lotes en Excel"""
        df = self.dataframe_fetcher.get_lotes_dataframe()
        if lote_id:
            df = df[df['id'] == lote_id]
        
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        filename = f"lotes_detallados_{fecha}" if detallado else f"lotes_{fecha}"
        return self._create_single_excel_response(df, filename, "Lotes")
    
    def export_diagnosticos_excel(self) -> StreamingResponse:
        """Exportar diagnósticos en Excel"""
        df = self.dataframe_fetcher.get_diagnosticos_dataframe()
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"diagnosticos_{fecha}", "Diagnósticos")
    
    def export_recomendaciones_excel(self, **filters) -> StreamingResponse:
        """Exportar recomendaciones en Excel"""
        df = self.dataframe_fetcher.get_recomendaciones_dataframe()
        
        # Aplicar filtros básicos
        if filters.get('estado'):
            df = df[df['estado'] == filters['estado']]
        if filters.get('tipo'):
            df = df[df['tipo'] == filters['tipo']]
        
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"recomendaciones_{fecha}", "Recomendaciones")
    
    def export_labores_excel(self, **filters) -> StreamingResponse:
        """Exportar labores en Excel"""
        df = self.dataframe_fetcher.get_labores_dataframe()
        
        if filters.get('estado'):
            df = df[df['estado'] == filters['estado']]
        
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"labores_{fecha}", "Labores")
    
    def export_inventario_excel(self) -> StreamingResponse:
        """Exportar inventario en Excel con dos hojas"""
        insumos_df = self.dataframe_fetcher.get_insumos_dataframe()
        herramientas_df = self.dataframe_fetcher.get_herramientas_dataframe()
        
        dataframes = {
            "Insumos": insumos_df,
            "Herramientas": herramientas_df
        }
        
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_excel_response(dataframes, f"inventario_{fecha}")
    
    def export_usuarios_excel(self, **filters) -> StreamingResponse:
        """Exportar usuarios en Excel"""
        df = self.dataframe_fetcher.get_usuarios_dataframe()
        
        if filters.get('rol'):
            df = df[df['rol'] == filters['rol']]
        if filters.get('activo') is not None:
            estado = 'Activo' if filters['activo'] else 'Inactivo'
            df = df[df['estado'] == estado]
        
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"usuarios_{fecha}", "Usuarios")
    
    def export_programas_excel(self) -> StreamingResponse:
        """Exportar programas en Excel"""
        df = self.dataframe_fetcher.get_programas_dataframe()
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"programas_{fecha}", "Programas")
    
    def export_cultivos_excel(self) -> StreamingResponse:
        """Exportar cultivos en Excel"""
        df = self.dataframe_fetcher.get_cultivos_dataframe()
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"cultivos_{fecha}", "Cultivos")
    
    def export_movimientos_excel(self) -> StreamingResponse:
        """Exportar movimientos de inventario en Excel"""
        df = self.dataframe_fetcher.get_movimientos_dataframe()
        
        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"movimientos_{fecha}", "Movimientos")
    
    def export_resumen_excel(self) -> StreamingResponse:
        """Exportar resumen estadístico del sistema"""
        df = self.dataframe_fetcher.get_resumen_dataframe()

        fecha = (datetime.utcnow()-timedelta(hours=5)).strftime("%Y%m%d")
        return self._create_single_excel_response(df, f"resumen_{fecha}", "Resumen")

