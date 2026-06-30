import logging
import os
import requests

logger = logging.getLogger(__name__)

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Sistema Granjas UCaldas")

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def send_registration_verification_email(to_email: str, user_name: str, code: str) -> bool:
    if not BREVO_API_KEY:
        logger.error("BREVO_API_KEY no configurada")
        return False

    if not EMAIL_FROM:
        logger.error("EMAIL_FROM no configurado")
        return False

    html_body = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <tr>
                <td style="background-color:#15803d;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                    Sistema Granjas UCaldas
                  </h1>
                  <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">
                    Universidad de Caldas — Gestión Agrícola y Pecuaria
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                    Hola, <strong>{user_name}</strong>
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                    Gracias por registrarte en el Sistema Granjas UCaldas.
                    Usa el siguiente código para verificar tu correo electrónico y completar tu registro:
                  </p>
                  <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:10px;
                              padding:24px;text-align:center;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
                      Código de verificación
                    </p>
                    <span style="font-size:42px;font-weight:800;color:#15803d;letter-spacing:10px;">
                      {code}
                    </span>
                  </div>
                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">
                    ⏱️ Este código es válido por <strong>10 minutos</strong>.
                  </p>
                  <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;text-align:center;">
                    Si no solicitaste este registro, puedes ignorar este correo.
                  </p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    Correo automático — no respondas a este mensaje.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb;padding:16px 40px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;">
                    © 2025 Sistema Granjas UCaldas — Universidad de Caldas
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
        "to": [{"email": to_email}],
        "subject": "Código de verificación de registro - Sistema Granjas UCaldas",
        "htmlContent": html_body,
    }

    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(BREVO_URL, json=payload, headers=headers, timeout=15)

        if response.status_code in (200, 201):
            data = response.json()
            logger.info(f"Código de verificación de registro enviado a {to_email} vía Brevo. ID: {data.get('messageId', 'N/A')}")
            return True
        else:
            logger.error(f"Brevo respondió con status {response.status_code}: {response.text}")
            return False

    except requests.exceptions.Timeout:
        logger.error("Timeout al conectar con Brevo")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de red al enviar correo con Brevo: {e}")
        return False
    except Exception as e:
        logger.error(f"Error inesperado al enviar correo: {e}")
        return False


def send_admin_created_user_email(to_email: str, user_name: str, password: str) -> bool:
    """
    Envía las credenciales de acceso a un usuario creado por el administrador.
    No requiere verificación de correo; el usuario puede iniciar sesión directamente.
    """
    if not BREVO_API_KEY:
        logger.error("BREVO_API_KEY no configurada")
        return False

    if not EMAIL_FROM:
        logger.error("EMAIL_FROM no configurado")
        return False

    html_body = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <tr>
                <td style="background-color:#15803d;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                    Sistema Granjas UCaldas
                  </h1>
                  <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">
                    Universidad de Caldas — Gestión Agrícola y Pecuaria
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                    Hola, <strong>{user_name}</strong>
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                    El administrador del sistema te ha creado una cuenta en el
                    <strong>Sistema Granjas UCaldas</strong>. Ya puedes iniciar sesión
                    directamente con las siguientes credenciales:
                  </p>
                  <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;
                              padding:24px;margin-bottom:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
                            Correo electrónico
                          </span><br/>
                          <strong style="font-size:16px;color:#15803d;">{to_email}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 6px;">
                          <span style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
                            Contraseña temporal
                          </span><br/>
                          <strong style="font-size:22px;color:#15803d;letter-spacing:4px;font-family:monospace;">
                            {password}
                          </strong>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;">
                    🔒 Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión.
                  </p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    Correo automático — no respondas a este mensaje.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb;padding:16px 40px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;">
                    © 2025 Sistema Granjas UCaldas — Universidad de Caldas
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
        "to": [{"email": to_email}],
        "subject": "Tu cuenta ha sido creada — Sistema Granjas UCaldas",
        "htmlContent": html_body,
    }

    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(BREVO_URL, json=payload, headers=headers, timeout=15)

        if response.status_code in (200, 201):
            data = response.json()
            logger.info(f"Credenciales enviadas a {to_email} vía Brevo. ID: {data.get('messageId', 'N/A')}")
            return True
        else:
            logger.error(f"Brevo respondió con status {response.status_code}: {response.text}")
            return False

    except requests.exceptions.Timeout:
        logger.error("Timeout al conectar con Brevo")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de red al enviar correo con Brevo: {e}")
        return False
    except Exception as e:
        logger.error(f"Error inesperado al enviar correo: {e}")
        return False


def send_reset_code_email(to_email: str, user_name: str, code: str) -> bool:
    if not BREVO_API_KEY:
        logger.error("BREVO_API_KEY no configurada")
        return False

    if not EMAIL_FROM:
        logger.error("EMAIL_FROM no configurado")
        return False

    html_body = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8" /></head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <tr>
                <td style="background-color:#15803d;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                    Sistema Granjas UCaldas
                  </h1>
                  <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">
                    Universidad de Caldas — Gestión Agrícola y Pecuaria
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                    Hola, <strong>{user_name}</strong>
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                    Usa el siguiente código de verificación:
                  </p>
                  <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:10px;
                              padding:24px;text-align:center;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
                      Código de verificación
                    </p>
                    <span style="font-size:42px;font-weight:800;color:#15803d;letter-spacing:10px;">
                      {code}
                    </span>
                  </div>
                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">
                    ⏱️ Este código es válido por <strong>10 minutos</strong>.
                  </p>
                  <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;text-align:center;">
                    Si no solicitaste este código, puedes ignorar este correo.
                  </p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    Correo automático — no respondas a este mensaje.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color:#f9fafb;padding:16px 40px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;">
                    © 2025 Sistema Granjas UCaldas — Universidad de Caldas
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
        "to": [{"email": to_email}],
        "subject": "Código de recuperación de contraseña - Sistema Granjas UCaldas",
        "htmlContent": html_body,
    }

    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(BREVO_URL, json=payload, headers=headers, timeout=15)

        if response.status_code in (200, 201):
            data = response.json()
            logger.info(f"Código enviado a {to_email} vía Brevo. ID: {data.get('messageId', 'N/A')}")
            return True
        else:
            logger.error(f"Brevo respondió con status {response.status_code}: {response.text}")
            return False

    except requests.exceptions.Timeout:
        logger.error("Timeout al conectar con Brevo")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de red al enviar correo con Brevo: {e}")
        return False
    except Exception as e:
        logger.error(f"Error inesperado al enviar correo: {e}")
        return False
