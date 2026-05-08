"""
AXIA EMAIL MANAGER — Gestion del correo corporativo
axyntraxautomation@gmail.com
- Leer correos entrantes
- Enviar respuestas con logica de gerente
- Resumenes diarios
- Registro automatico de contactos
"""
import smtplib
import imaplib
import email
import email.header
import datetime
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import dotenv_values

ENV = dotenv_values(os.path.join(os.path.abspath("."), ".env"))

EMAIL_FROM   = ENV.get("EMAIL_CORPORATIVO", "")
EMAIL_PASS   = ENV.get("EMAIL_PASSWORD", "")
SMTP_HOST    = ENV.get("EMAIL_SMTP_HOST", "smtp.gmail.com")
SMTP_PORT    = int(ENV.get("EMAIL_SMTP_PORT", "587"))
IMAP_HOST    = ENV.get("EMAIL_IMAP_HOST", "imap.gmail.com")
EMPRESA      = ENV.get("EMPRESA_NOMBRE", "AXYNTRAX AUTOMATION")
PROPIETARIO  = ENV.get("EMPRESA_PROPIETARIO", "Miguel Montero")


def _smtp_conn():
    s = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    s.ehlo()
    s.starttls()
    s.login(EMAIL_FROM, EMAIL_PASS)
    return s


def _imap_conn():
    m = imaplib.IMAP4_SSL(IMAP_HOST)
    m.login(EMAIL_FROM, EMAIL_PASS)
    return m


def send_email(to, subject, body_html, body_text=None):
    """Envia un correo desde el email corporativo."""
    if not EMAIL_FROM or not EMAIL_PASS:
        return False, "Email no configurado en .env"
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{EMPRESA} <{EMAIL_FROM}>"
        msg["To"]      = to
        if body_text:
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))
        with _smtp_conn() as s:
            s.sendmail(EMAIL_FROM, [to], msg.as_string())
        return True, f"Email enviado a {to}"
    except Exception as e:
        return False, str(e)


def get_unread_emails(limit=10):
    """Lee los ultimos correos no leidos y devuelve lista de dicts."""
    if not EMAIL_FROM or not EMAIL_PASS:
        return [], "Email no configurado"
    emails = []
    try:
        m = _imap_conn()
        m.select("INBOX")
        _, uids = m.search(None, "UNSEEN")
        uid_list = uids[0].split()[-limit:]
        for uid in reversed(uid_list):
            _, data = m.fetch(uid, "(RFC822)")
            raw = data[0][1]
            msg = email.message_from_bytes(raw)
            subject_raw = msg.get("Subject", "")
            subject = str(email.header.make_header(email.header.decode_header(subject_raw)))
            sender  = msg.get("From", "")
            date    = msg.get("Date", "")
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
            emails.append({
                "uid": uid.decode(),
                "from": sender,
                "subject": subject,
                "date": date,
                "body": body[:500]
            })
        m.logout()
        return emails, "OK"
    except Exception as e:
        return [], str(e)


def get_daily_summary():
    """Genera resumen ejecutivo del dia desde el correo."""
    if not EMAIL_FROM or not EMAIL_PASS:
        return "Email no configurado. Agrega EMAIL_PASSWORD en .env"
    try:
        m = _imap_conn()
        m.select("INBOX")
        hoy = datetime.datetime.now().strftime("%d-%b-%Y")
        _, uids = m.search(None, f'(SINCE "{hoy}")')
        total = len(uids[0].split()) if uids[0] else 0
        _, uids_unseen = m.search(None, "UNSEEN")
        unread = len(uids_unseen[0].split()) if uids_unseen[0] else 0
        m.logout()
        return (f"Resumen correo {hoy}: {total} correos hoy, "
                f"{unread} sin leer. Cuenta: {EMAIL_FROM}")
    except Exception as e:
        return f"Error al leer correo: {e}"


def reply_email(to, subject, original_body, context="consulta"):
    """Responde un correo con tono gerencial profesional."""
    hora = datetime.datetime.now().strftime("%H:%M")
    body_html = f"""
    <div style="font-family:Arial,sans-serif;color:#1a1a2e;max-width:600px">
      <p>Estimado/a,</p>
      <p>Gracias por contactar a <strong>{EMPRESA}</strong>.</p>
      <p>He recibido su mensaje y lo estoy procesando. Me comunicare con usted
         a la brevedad con una respuesta detallada.</p>
      <p>Si su consulta es urgente, puede contactarnos directamente via WhatsApp
         al <strong>+51 991 740 590</strong>.</p>
      <br>
      <p>Atentamente,</p>
      <p><strong>{PROPIETARIO}</strong><br>
         <em>Gerencia General — {EMPRESA}</em></p>
      <hr style="border:1px solid #eee">
      <small style="color:#888">Respuesta automatica generada por AXIA Central | {hora}</small>
    </div>
    """
    return send_email(to, f"Re: {subject}", body_html)


def send_receipt_email(to, cliente, monto, concepto, nro_recibo):
    """Envia un recibo por honorarios al cliente."""
    from dotenv import dotenv_values
    ev = dotenv_values(os.path.join(os.path.abspath("."), ".env"))
    bcp_cuenta = ev.get("BCP_CUENTA_SOLES", "215-16171945-0-94")
    bcp_cci    = ev.get("BCP_CCI", "00221511617194509421")
    fecha = datetime.datetime.now().strftime("%d/%m/%Y")
    body_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:650px;border:1px solid #eee;padding:30px">
      <h2 style="color:#00BCD4">RECIBO POR HONORARIOS</h2>
      <table width="100%">
        <tr><td><strong>N° Recibo:</strong></td><td>{nro_recibo}</td></tr>
        <tr><td><strong>Fecha:</strong></td><td>{fecha}</td></tr>
        <tr><td><strong>Cliente:</strong></td><td>{cliente}</td></tr>
        <tr><td><strong>Concepto:</strong></td><td>{concepto}</td></tr>
        <tr><td><strong>Monto:</strong></td><td style="color:#10B981;font-size:1.2em"><strong>S/. {monto:.2f}</strong></td></tr>
      </table>
      <hr style="margin:20px 0">
      <h3>Datos de Pago BCP</h3>
      <p><strong>Titular:</strong> {PROPIETARIO}<br>
         <strong>Cuenta Soles:</strong> {bcp_cuenta}<br>
         <strong>CCI:</strong> {bcp_cci}</p>
      <br>
      <p>Una vez realizado el pago, enviar comprobante al correo
         <a href="mailto:{EMAIL_FROM}">{EMAIL_FROM}</a></p>
      <hr>
      <small>{EMPRESA} | Lima, Peru</small>
    </div>
    """
    return send_email(to, f"Recibo por Honorarios N° {nro_recibo} — {EMPRESA}", body_html)


_instance = None

def get_email_manager():
    global _instance
    if _instance is None:
        _instance = {
            "send": send_email,
            "read": get_unread_emails,
            "summary": get_daily_summary,
            "reply": reply_email,
            "send_receipt": send_receipt_email,
        }
    return _instance
