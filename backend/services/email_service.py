import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional

class EmailService:
    def __init__(self):
        # Configuración de email (usar variables de entorno en producción)
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL", "")
        self.sender_password = os.getenv("SENDER_PASSWORD", "")
        self.sender_name = os.getenv("SENDER_NAME", "Equipo de Fútbol")
        
    def send_password_reset_email(self, to_email: str, token: str, recipient_name: str = "Administrador") -> bool:
        """Envía email de recuperación de contraseña"""
        try:
            # Crear mensaje
            msg = MIMEMultipart()
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = to_email
            msg['Subject'] = "Recuperación de Contraseña - Sistema de Gestión del Equipo"
            
            # URL de reset
            reset_url = f"http://localhost:5173/reset-password?token={token}&email={to_email}"
            
            # Cuerpo del email en HTML
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #1f2937; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 30px; background-color: #f9fafb; }}
                    .button {{ 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background-color: #3b82f6; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        margin: 20px 0;
                    }}
                    .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
                    .warning {{ color: #dc2626; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏈 Sistema de Gestión del Equipo</h1>
                    </div>
                    
                    <div class="content">
                        <h2>Hola {recipient_name},</h2>
                        
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                        
                        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        
                        <a href="{reset_url}" class="button">Restablecer Contraseña</a>
                        
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p><code>{reset_url}</code></p>
                        
                        <div class="warning">
                            <p>⚠️ Este enlace expirará en 1 hora por seguridad.</p>
                            <p>⚠️ Si no solicitaste este cambio, ignora este email.</p>
                        </div>
                        
                        <p>Saludos,<br>El equipo de administración</p>
                    </div>
                    
                    <div class="footer">
                        <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Agregar el cuerpo HTML
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))
            
            # Si no hay configuración de email, simular envío
            if not self.sender_email or not self.sender_password:
                print("=" * 60)
                print("📧 SIMULACIÓN DE EMAIL - CONFIGURACIÓN PENDIENTE")
                print("=" * 60)
                print(f"Para: {to_email}")
                print(f"Asunto: Recuperación de Contraseña")
                print(f"Token: {token}")
                print(f"Enlace: {reset_url}")
                print(f"⏰ Expira en: 1 hora")
                print("=" * 60)
                print("💡 Para envío real, configura:")
                print("   - SENDER_EMAIL en variables de entorno")
                print("   - SENDER_PASSWORD (contraseña de aplicación)")
                print("   - SMTP_SERVER (opcional, default: smtp.gmail.com)")
                print("=" * 60)
                return True
            
            # Conectar y enviar email real
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            
            text = msg.as_string()
            server.sendmail(self.sender_email, to_email, text)
            server.quit()
            
            print(f"✅ Email de recuperación enviado exitosamente a {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Error enviando email: {e}")
            return False
    
    def test_email_config(self) -> bool:
        """Prueba la configuración de email"""
        try:
            if not self.sender_email or not self.sender_password:
                print("❌ Configuración de email incompleta")
                return False
                
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            server.quit()
            
            print("✅ Configuración de email válida")
            return True
            
        except Exception as e:
            print(f"❌ Error en configuración de email: {e}")
            return False

# Instancia global del servicio de email
email_service = EmailService()
