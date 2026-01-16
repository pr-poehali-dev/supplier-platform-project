import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def handler(event: dict, context) -> dict:
    '''API для отправки формы обратной связи на email'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        data = json.loads(event.get('body', '{}'))
        name = data.get('name', '')
        email = data.get('email', '')
        company = data.get('company', 'Не указана')
        message = data.get('message', '')

        if not name or not email or not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Заполните все обязательные поля'})
            }

        smtp_host = os.environ.get('SMTP_HOST', 'smtp.yandex.ru')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        recipient_email = os.environ.get('RECIPIENT_EMAIL', 'admin@tourconnect.ru')

        if not smtp_user or not smtp_password:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'SMTP не настроен'})
            }

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Новая заявка от {name}'
        msg['From'] = smtp_user
        msg['To'] = recipient_email

        html_body = f'''
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6366f1;">Новая заявка с сайта TourConnect</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Имя:</strong> {name}</p>
                    <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
                    <p><strong>Компания:</strong> {company}</p>
                </div>
                <div style="margin-top: 20px;">
                    <p><strong>Сообщение:</strong></p>
                    <p style="background: #fff; padding: 15px; border-left: 4px solid #6366f1; white-space: pre-wrap;">{message}</p>
                </div>
            </div>
        </body>
        </html>
        '''

        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'Заявка успешно отправлена'})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка отправки: {str(e)}'})
        }