# notification_system.py
import smtplib
from email.mime.text import MIMEText
import logging

class NotificationService:
    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.email_config = {
            'smtp_server': 'smtp.company.com',
            'smtp_port': 587,
            'sender_email': 'alerts@company.com'
        }
    
    def send_reorder_notification(self, product, quantity):
        """
        Send proactive alerts for reordering
        """
        subject = f"Automated Reorder: {product}"
        body = f"Reorder initiated for {product}. Quantity: {quantity} units."
        
        self._send_email(
            recipients=['inventory@company.com', 'procurement@company.com'],
            subject=subject,
            body=body
        )
    
    def send_error_notification(self, error_message):
        """
        Alert stakeholders of system errors
        """
        subject = "Reordering System Error"
        body = f"An error occurred in the Automated Reordering System: {error_message}"
        
        self._send_email(
            recipients=['it_support@company.com', 'inventory_manager@company.com'],
            subject=subject,
            body=body
        )
    
    def _send_email(self, recipients, subject, body):
        """
        Email sending utility
        """
        try:
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = self.email_config['sender_email']
            msg['To'] = ', '.join(recipients)
            
            with smtplib.SMTP(
                self.email_config['smtp_server'], 
                self.email_config['smtp_port']
            ) as server:
                server.starttls()
                # Add authentication if required
                server.send_message(msg)
            
            self.logger.info(f"Notification sent: {subject}")
        
        except Exception as e:
            self.logger.error(f"Failed to send notification: {e}")
