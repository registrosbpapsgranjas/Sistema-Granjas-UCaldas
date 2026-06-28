import smtplib
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Sistema Granjas UCaldas")


def send_reset_code_email(to_email: str, user_name: str, code: str) -> bool:
    if not EMAIL_USER or not EMAIL_PASSWORD:
        logger.error("Credenciales de email no configuradas (EMAIL_USER / EMAIL_PASSWORD)")
        return False

    subject = "Código de recuperación de contraseña - Sistema Granjas UCaldas"

    html_body = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Recuperación de contraseña</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background-color:#15803d;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                    🌿 Sistema Granjas UCaldas
                  </h1>
                  <p style="margin:6px 0 0;color:#bbf7d0;font-size:13px;">
                    Universidad de Caldas — Gestión Agrícola y Pecuaria
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                    Hola, <strong>{user_name}</strong>
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                    Usa el siguiente código de verificación:
                  </p>

                  <!-- Code box -->
                  <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:10px;
                              padding:24px;text-align:center;margin-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;
                               letter-spacing:1px;">Código de verificación</p>
                    <span style="font-size:42px;font-weight:800;color:#15803d;letter-spacing:10px;">
                      {code}
                    </span>
                  </div>

                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">
                    ⏱️ Este código es válido por <strong>10 minutos</strong>.
                  </p>
                  <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;text-align:center;">
                    Si no solicitaste este código, puedes ignorar este correo de forma segura.
                  </p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    Este es un correo automático. Por favor, no respondas a este mensaje.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
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

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
    msg["To"] = to_email

    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        logger.info(f"Código de recuperación enviado a {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("Error de autenticación SMTP. Verifica EMAIL_USER y EMAIL_PASSWORD.")
        return False
    except smtplib.SMTPConnectError as e:
        logger.error(f"No se pudo conectar al servidor SMTP: {e}")
        return False
    except Exception as e:
        logger.error(f"Error enviando correo a {to_email}: {e}")
        return False
