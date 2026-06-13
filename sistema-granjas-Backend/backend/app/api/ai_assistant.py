# app/services/ai_service.py

import os
import logging
from sqlalchemy.orm import Session
from app.db.models import Usuario, Diagnostico, Recomendacion
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Intentar importar Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("⚠️ google-generativeai no instalado")

# Variable global para el modelo
_gemini_model = None

def init_gemini():
    """Inicializar Gemini con modelo compatible"""
    global _gemini_model
    
    if not GEMINI_AVAILABLE:
        return None
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("⚠️ GEMINI_API_KEY no configurada")
        return None
    
    try:
        genai.configure(api_key=api_key)
        
        # Listar modelos disponibles
        logger.info("🔍 Verificando modelos Gemini...")
        available_models = []
        
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                model_name = model.name.replace('models/', '')
                available_models.append(model_name)
                logger.info(f"  ✓ {model_name}")
        
        # Elegir modelo - priorizar gemini-pro
        model_to_use = None
        for preferred in ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.0-pro']:
            if preferred in available_models:
                model_to_use = preferred
                break
        
        if not model_to_use and available_models:
            model_to_use = available_models[0]
        
        if model_to_use:
            logger.info(f"✅ Usando modelo Gemini: {model_to_use}")
            _gemini_model = genai.GenerativeModel(model_to_use)
            return _gemini_model
        else:
            logger.error("❌ No se encontró modelo Gemini compatible")
            return None
            
    except Exception as e:
        logger.error(f"❌ Error inicializando Gemini: {e}")
        return None

def get_gemini_model():
    """Obtener instancia del modelo Gemini"""
    global _gemini_model
    if _gemini_model is None:
        _gemini_model = init_gemini()
    return _gemini_model

def generar_resumen_diagnostico(db: Session, diagnostico_id: int, usuario: Usuario) -> str:
    """Generar resumen de diagnóstico usando IA"""
    
    # Verificar permisos
    diagnostico = db.query(Diagnostico).filter(Diagnostico.id == diagnostico_id).first()
    if not diagnostico:
        raise ValueError("Diagnóstico no encontrado")
    
    if usuario.rol.nombre != "admin" and diagnostico.usuario_id != usuario.id:
        raise PermissionError("No tiene permisos para ver este diagnóstico")
    
    # Obtener modelo Gemini
    model = get_gemini_model()
    
    # Si no hay modelo disponible, usar respuesta simulada
    if not model:
        logger.warning("⚠️ Gemini no disponible, usando modo simulado")
        return _generar_resumen_simulado(diagnostico)
    
    # Obtener recomendaciones
    recomendaciones = db.query(Recomendacion).filter(
        Recomendacion.diagnostico_id == diagnostico_id
    ).all()
    
    texto_recomendaciones = "\n".join([
        f"- {r.recomendacion}" for r in recomendaciones
    ]) if recomendaciones else "Sin recomendaciones específicas"
    
    # Construir prompt
    prompt = f"""
    Eres un asistente agrícola experto. Resume el siguiente diagnóstico:

    PROBLEMA:
    {diagnostico.diagnostico[:500] if diagnostico.diagnostico else "No especificado"}

    TRATAMIENTO:
    {diagnostico.tratamiento[:300] if diagnostico.tratamiento else "No especificado"}

    RECOMENDACIONES:
    {texto_recomendaciones[:500]}

    Genera un resumen ejecutivo (máximo 150 palabras) que incluya:
    1. El problema principal
    2. La acción más importante a tomar
    3. Nivel de urgencia (Alto/Medio/Bajo)
    
    Resumen:
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 300,
                "top_p": 0.9,
            }
        )
        
        resumen = response.text.strip()
        
        # Si el resumen está vacío o es muy corto, usar simulado
        if len(resumen) < 20:
            return _generar_resumen_simulado(diagnostico)
        
        return resumen
        
    except Exception as e:
        logger.error(f"Error generando resumen con Gemini: {e}")
        return _generar_resumen_simulado(diagnostico)

def _generar_resumen_simulado(diagnostico: Diagnostico) -> str:
    """Generar resumen simulado cuando Gemini no está disponible"""
    
    problema = diagnostico.diagnostico[:150] if diagnostico.diagnostico else "problema no especificado"
    tratamiento = diagnostico.tratamiento[:100] if diagnostico.tratamiento else "tratamiento no especificado"
    
    return f"""
    📋 **Resumen del Diagnóstico**
    
    **Problema identificado:** {problema}
    
    **Tratamiento sugerido:** {tratamiento}
    
    **Nota:** Este es un resumen generado automáticamente. Para un análisis más detallado, configure la API key de Gemini en las variables de entorno.
    """

def responder_chat(db: Session, usuario: Usuario, pregunta: str, historial: List[Dict[str, str]]) -> str:
    """Responder a preguntas del chat usando IA"""
    
    model = get_gemini_model()
    
    # Si no hay modelo, usar respuesta simulada
    if not model:
        return _responder_chat_simulado(pregunta)
    
    # Construir contexto del usuario
    contexto = f"""
    Eres un asistente agrícola experto para la Universidad de Caldas.
    
    Usuario: {usuario.nombre} (Rol: {usuario.rol.nombre})
    
    Historial de la conversación:
    """
    
    for msg in historial[-10:]:  # Últimos 10 mensajes
        contexto += f"\n{msg['role']}: {msg['content']}"
    
    prompt = f"""
    {contexto}
    
    Pregunta actual: {pregunta}
    
    Responde de manera concisa, útil y profesional. Si no sabes algo, dilo honestamente.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.8,
                "max_output_tokens": 500,
                "top_p": 0.9,
            }
        )
        
        respuesta = response.text.strip()
        
        if len(respuesta) < 10:
            return _responder_chat_simulado(pregunta)
        
        return respuesta
        
    except Exception as e:
        logger.error(f"Error en chat con Gemini: {e}")
        return _responder_chat_simulado(pregunta)

def _responder_chat_simulado(pregunta: str) -> str:
    """Respuesta simulada cuando Gemini no está disponible"""
    
    return f"""
    🤖 **Asistente Agrícola (Modo Simulado)**
    
    He recibido tu pregunta: "{pregunta[:100]}..."
    
    Para obtener respuestas más precisas, por favor configura la API key de Gemini:
    1. Obtén una API key en https://aistudio.google.com/app/apikey
    2. Configura la variable de entorno GEMINI_API_KEY
    3. Reinicia el servicio
    
    Mientras tanto, puedes consultar la documentación agrícola de la universidad.
    """

# Inicializar Gemini al cargar el módulo
init_gemini()