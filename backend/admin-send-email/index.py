import json
import os
import psycopg2
import jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''
    Отправка email рассылки всем пользователям.
    Требует админские права.
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    auth_header = headers.get('X-Authorization', headers.get('x-authorization', ''))
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No token provided'}),
            'isBase64Encoded': False
        }
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        secret = os.environ.get('JWT_SECRET')
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (payload['user_id'],))
        admin_check = cur.fetchone()
        
        if not admin_check or not admin_check[0]:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Admin access required'}),
                'isBase64Encoded': False
            }
        
        body = json.loads(event.get('body', '{}'))
        subject = body.get('subject')
        message = body.get('message')
        
        if not subject or not message:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Subject and message are required'}),
                'isBase64Encoded': False
            }
        
        cur.execute("INSERT INTO email_campaigns (subject, message, status) VALUES (%s, %s, 'sending') RETURNING id", (subject, message))
        campaign_id = cur.fetchone()[0]
        conn.commit()
        
        cur.execute("SELECT email, full_name FROM users WHERE email IS NOT NULL AND email != ''")
        users = cur.fetchall()
        
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        
        sent_count = 0
        failed_emails = []
        
        try:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            
            for user_email, user_name in users:
                try:
                    msg = MIMEMultipart('alternative')
                    msg['From'] = smtp_user
                    msg['To'] = user_email
                    msg['Subject'] = subject
                    
                    personalized_message = message.replace('{name}', user_name or 'друг')
                    
                    html_body = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #8B5CF6;">{subject}</h2>
                            <div style="white-space: pre-wrap;">{personalized_message}</div>
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                            <p style="color: #666; font-size: 12px;">TourConnect - База знаний для бизнеса в туризме России</p>
                        </div>
                    </body>
                    </html>
                    """
                    
                    msg.attach(MIMEText(html_body, 'html'))
                    server.send_message(msg)
                    sent_count += 1
                except Exception as e:
                    failed_emails.append({'email': user_email, 'error': str(e)})
            
            server.quit()
            
            cur.execute("""
                UPDATE email_campaigns 
                SET status = 'sent', sent_at = %s, sent_count = %s 
                WHERE id = %s
            """, (datetime.utcnow(), sent_count, campaign_id))
            conn.commit()
            
        except Exception as e:
            cur.execute("UPDATE email_campaigns SET status = 'failed' WHERE id = %s", (campaign_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'SMTP error: {str(e)}'}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'sent_count': sent_count,
                'total_users': len(users),
                'failed_count': len(failed_emails),
                'failed_emails': failed_emails[:10]
            }),
            'isBase64Encoded': False
        }
        
    except jwt.ExpiredSignatureError:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Token expired'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
