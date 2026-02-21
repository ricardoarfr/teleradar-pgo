import logging

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config.settings import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP não configurado — e-mail ignorado: %s", subject)
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_USER
    message["To"] = to
    message.attach(MIMEText(body, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        return True
    except Exception as exc:
        logger.error("Falha ao enviar e-mail para %s: %s", to, exc)
        return False


async def send_approval_notification(admin_email: str, user_name: str, user_email: str) -> None:
    await send_email(
        to=admin_email,
        subject="[Teleradar PGO] Novo cadastro aguardando aprovação",
        body=f"""
        <h2>Novo cadastro pendente</h2>
        <p><strong>Nome:</strong> {user_name}</p>
        <p><strong>E-mail:</strong> {user_email}</p>
        <p>Acesse o painel administrativo para aprovar ou rejeitar.</p>
        """,
    )


async def send_approval_code(admin_email: str, code: str, user_name: str) -> None:
    await send_email(
        to=admin_email,
        subject="[Teleradar PGO] Código de confirmação de aprovação",
        body=f"""
        <h2>Confirmação de aprovação</h2>
        <p>Você solicitou aprovação para: <strong>{user_name}</strong></p>
        <p>Código: <strong style="font-size:28px;letter-spacing:4px">{code}</strong></p>
        <p>Expira em <strong>15 minutos</strong>. Uso único.</p>
        <p>Se não foi você, ignore este e-mail.</p>
        """,
    )


async def send_account_approved(user_email: str, user_name: str) -> None:
    await send_email(
        to=user_email,
        subject="[Teleradar PGO] Sua conta foi aprovada!",
        body=f"""
        <h2>Conta aprovada!</h2>
        <p>Olá, <strong>{user_name}</strong>!</p>
        <p>Sua conta no Teleradar PGO foi aprovada. Você já pode fazer login.</p>
        """,
    )


async def send_password_reset(user_email: str, user_name: str, reset_token: str) -> None:
    await send_email(
        to=user_email,
        subject="[Teleradar PGO] Redefinição de senha",
        body=f"""
        <h2>Redefinição de senha</h2>
        <p>Olá, <strong>{user_name}</strong>!</p>
        <p>Token de redefinição:</p>
        <p><code style="font-size:14px;background:#f4f4f4;padding:8px">{reset_token}</code></p>
        <p>Expira em <strong>15 minutos</strong>. Uso único.</p>
        <p>Se não foi você, ignore este e-mail.</p>
        """,
    )
