import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from fastapi import HTTPException, status

# Replace with your actual sender information
SENDER_EMAIL = "admin@insanvemekan.com"  # Consider making this configurable
SENDER_NAME = "İnsan ve Mekan / Human and Space" # Consider making this configurable
# It's good practice to load API keys from environment variables or a config file
# For this example, we'll pass it as an argument, but avoid hardcoding in production
# BREVO_API_KEY = "YOUR_BREVO_API_KEY" 

# Email template configuration

def get_email_template() -> str:
    """
    Returns a basic HTML template for emails.
    """
    return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>İnsan ve Mekan | Human and Space</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin: 0;">İNSAN ve MEKAN</h1>
        <h2 style="color: #34495e; margin: 5px 0;">Human and Space</h2>
        <p style="color: #7f8c8d; margin: 5px 0;">Akademi Platformu</p>
    </div>
    
    <div style="margin: 20px 0;">
        {CONTENT}
    </div>
    
    <div style="border-top: 2px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px;">
        <p>© 2025 İnsan ve Mekan | Human and Space<br>Akademi Platformu</p>
    </div>
</body>
</html>
    """

def send_confirmation_email(
    api_key: str, 
    user_email: str, 
    user_name: str, 
    confirmation_token: str,
    base_url: str = "https://insanvemekan.com/api",
    language: str = "en"
):
    """
    Sends a confirmation email to the user with a verification link.
    
    Args:
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    confirmation_link = f"{base_url}/confirm-email/{confirmation_token}"

    # Bilingual subject
    if language == "tr":
        subject = "E-posta Adresinizi Onaylayın"
    else:
        subject = "Confirm your email address | E-posta adresinizi onaylayın"

    # Bilingual content with Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<p><strong>Hoş geldiniz, {user_name}!</strong></p>

<p>İnsan ve Mekan'a kaydolduğunuz için teşekkür ederiz! E-posta adresinizi onaylamak ve hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayın:</p>

<p><strong>E-posta:</strong> {user_email}</p>

<p><strong>E-posta Onaylama Bağlantısı:</strong><br>
<a href="{confirmation_link}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{confirmation_link}</a></p>

<p>Bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.</p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<p><strong>Welcome, {user_name}!</strong></p>

<p>Thanks for signing up for Human and Space! Please click the link below to confirm your email address and activate your account:</p>

<p><strong>Email:</strong> {user_email}</p>

<p><strong>Email Confirmation Link:</strong><br>
<a href="{confirmation_link}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{confirmation_link}</a></p>

<p>If you did not create this account, you can safely ignore this email.</p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Email sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send confirmation email: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the confirmation email."
        )

def send_password_reset_email(
    api_key: str,
    user_email: str,
    user_name: str,
    reset_token: str,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a password reset email to the user with a reset link.
    
    Args:
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    reset_link = f"{base_url}/reset-password/{reset_token}"

    # Bilingual subject
    if language == "tr":
        subject = "Şifrenizi Sıfırlayın"
    else:
        subject = "Reset Your Password | Şifrenizi sıfırlayın"

    # Bilingual content with Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Şifre Sıfırlama İsteği</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>İnsan ve Mekan hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak için aşağıdaki bağlantıya tıklayın:</p>

<p><strong>Hesap:</strong> {user_email}<br>
<strong>Geçerlilik süresi:</strong> 15 dakika</p>

<p><strong>Şifre Sıfırlama Bağlantısı:</strong><br>
<a href="{reset_link}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{reset_link}</a></p>

<p>Şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelin. Şifreniz değişmeden kalacaktır.</p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">Password Reset Request</h4>

<p><strong>Hi {user_name},</strong></p>

<p>We received a request to reset your password for your Human and Space account. Click the link below to create a new password:</p>

<p><strong>Account:</strong> {user_email}<br>
<strong>Valid for:</strong> 15 minutes</p>

<p><strong>Password Reset Link:</strong><br>
<a href="{reset_link}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{reset_link}</a></p>

<p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Password reset email sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send password reset email: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the password reset email."
        )

def send_author_update_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    author_name: str,
    entry_title: str,
    entry_id: int,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email when an author creates an update to a journal entry.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the recipient (referee or editor)
        user_name: Name of the recipient
        author_name: Name of the author who made the update
        entry_title: Title of the journal entry
        entry_id: ID of the journal entry
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}/updates"

    # Bilingual subject
    if language == "tr":
        subject = f"Yazar Güncellemesi: {entry_title}"
    else:
        subject = f"Author Update: {entry_title} | Yazar güncellemesi"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Yeni Yazar Güncellemesi</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>{author_name} isimli yazar, dergi makalesinde güncelleme yaptı:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Yazar:</strong> {author_name}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
</div>

<p>Güncellemeyi görüntülemek ve değerlendirmenizi yapmak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">New Author Update</h4>

<p><strong>Hi {user_name},</strong></p>

<p>The author {author_name} has made an update to the journal entry:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
    <strong>Author:</strong> {author_name}<br>
    <strong>Entry ID:</strong> #{entry_id}</p>
</div>

<p>You can view the complete update and provide your review by clicking the link below:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Author update notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send author update notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the author update notification."
        )

def send_referee_update_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    referee_name: str,
    entry_title: str,
    entry_id: int,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email when a referee creates an update to a journal entry.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the recipient (author or editor)
        user_name: Name of the recipient
        referee_name: Name of the referee who made the update
        entry_title: Title of the journal entry
        entry_id: ID of the journal entry
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}/updates"

    # Bilingual subject
    if language == "tr":
        subject = f"Hakem Değerlendirmesi: {entry_title}"
    else:
        subject = f"Referee Review: {entry_title} | Hakem değerlendirmesi"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Yeni Hakem Değerlendirmesi</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>{referee_name} isimli hakem, dergi makalesi için değerlendirme yaptı:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Hakem:</strong> {referee_name}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
</div>

<p>Hakemin geri bildirimlerini ve önerilerini görüntülemek için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">New Referee Review</h4>

<p><strong>Hi {user_name},</strong></p>

<p>The referee {referee_name} has submitted a review for the journal entry:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
    <strong>Referee:</strong> {referee_name}<br>
    <strong>Entry ID:</strong> #{entry_id}</p>
</div>

<p>You can view the referee's feedback and recommendations by clicking the link below:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Referee update notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send referee update notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the referee update notification."
        )

def send_referee_assignment_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    referee_name: str,
    entry_title: str,
    entry_id: int,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email when a referee is assigned to a journal entry.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the author being notified
        user_name: Name of the author being notified
        referee_name: Name of the referee who was assigned
        entry_title: Title of the journal entry
        entry_id: ID of the journal entry
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}"

    # Bilingual subject
    if language == "tr":
        subject = f"Hakem Atandı: {entry_title}"
    else:
        subject = f"Referee Assigned: {entry_title} | Hakem atandı"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Makalenize Hakem Atandı</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Dergi başvurunuzu değerlendirmek üzere bir hakem atandı:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makaleniz:</strong> {entry_title}<br>
    <strong>Atanan Hakem:</strong> {referee_name}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
</div>

<p>İnceleme süreci başladı. Hakem, başvurunuzu dikkatlice değerlendirecek ve detaylı geri bildirim sağlayacaktır. Başvurunuzun ilerleyişini aşağıdaki bağlantıdan takip edebilirsiniz:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<p>Hakem değerlendirmesini tamamladığında sizi tekrar bilgilendireceğiz.</p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">Referee Assigned to Your Submission</h4>

<p><strong>Hi {user_name},</strong></p>

<p>A referee has been assigned to review your journal submission:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Your Entry:</strong> {entry_title}<br>
    <strong>Assigned Referee:</strong> {referee_name}<br>
    <strong>Entry ID:</strong> #{entry_id}</p>
</div>

<p>The review process has now begun. The referee will carefully evaluate your submission and provide detailed feedback. You can track the progress of your submission by clicking below:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<p>We will notify you as soon as the referee completes their review.</p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Referee assignment notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send referee assignment notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the referee assignment notification."
        )

def send_status_update_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    entry_title: str,
    entry_id: int,
    old_status: str,
    new_status: str,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email when a journal entry status is updated.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the recipient (author or referee)
        user_name: Name of the recipient
        entry_title: Title of the journal entry
        entry_id: ID of the journal entry
        old_status: Previous status of the entry
        new_status: New status of the entry
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}"

    # Format status names for display
    status_display_en = {
        'waiting_for_payment': 'Waiting for Payment',
        'waiting_for_authors': 'Waiting for Authors',
        'waiting_for_referees': 'Waiting for Referees',
        'waiting_for_editors': 'Waiting for Editors',
        'accepted': 'Accepted',
        'not_accepted': 'Not Accepted',
        'rejected': 'Rejected',
        'pending': 'Pending'
    }
    
    status_display_tr = {
        'waiting_for_payment': 'Ödeme Bekleniyor',
        'waiting_for_authors': 'Yazarlar Bekleniyor',
        'waiting_for_referees': 'Hakemler Bekleniyor',
        'waiting_for_editors': 'Editörler Bekleniyor',
        'accepted': 'Kabul Edildi',
        'not_accepted': 'Kabul Edilmedi',
        'rejected': 'Reddedildi',
        'pending': 'Beklemede'
    }
    
    old_status_display_en = status_display_en.get(old_status, old_status.replace('_', ' ').title())
    new_status_display_en = status_display_en.get(new_status, new_status.replace('_', ' ').title())
    old_status_display_tr = status_display_tr.get(old_status, old_status.replace('_', ' ').title())
    new_status_display_tr = status_display_tr.get(new_status, new_status.replace('_', ' ').title())

    # Bilingual subject
    if language == "tr":
        subject = f"Durum Güncellemesi: {entry_title}"
    else:
        subject = f"Status Update: {entry_title} | Durum güncellemesi"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Başvuru Durumu Güncellemesi</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Dergi başvurunuzun durumu güncellendi:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}<br>
    <strong>Durum Değişikliği:</strong> <span style="color: #c0392b;">{old_status_display_tr}</span> → <span style="color: #27ae60;">{new_status_display_tr}</span></p>
</div>

<p>Başvurunuzun tüm detaylarını ve ek bilgileri görüntülemek için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">Submission Status Update</h4>

<p><strong>Hi {user_name},</strong></p>

<p>The status of your journal submission has been updated:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
    <strong>Entry ID:</strong> #{entry_id}<br>
    <strong>Status Change:</strong> <span style="color: #c0392b;">{old_status_display_en}</span> → <span style="color: #27ae60;">{new_status_display_en}</span></p>
</div>

<p>You can view the complete details of your submission and any additional information by clicking below:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Status update notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send status update notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the status update notification."
        )

def send_journal_editor_assignment_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    journal_title: str,
    journal_issue: str,
    journal_id: int,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email when an editor is assigned to a journal.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the editor being assigned
        user_name: Name of the editor
        journal_title: Title of the journal
        journal_issue: Issue number of the journal
        journal_id: ID of the journal
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    journal_url = f"{base_url}/journals/{journal_id}"

    # Bilingual subject
    if language == "tr":
        subject = f"Dergi Editörlüğüne Atandınız: {journal_title}"
    else:
        subject = f"Journal Editor Assignment: {journal_title} | Dergi editörlüğüne atandınız"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Dergi Editörlüğüne Atandınız</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Aşağıdaki derginin editörlüğüne atandınız:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Dergi Başlığı:</strong> {journal_title}<br>
    <strong>Sayı:</strong> {journal_issue}<br>
    <strong>Dergi No:</strong> #{journal_id}</p>
</div>

<p>Editör olarak, bu dergiye gönderilen makaleleri değerlendirme, yazarlarla iletişim kurma ve hakemlerle çalışma sorumluluğunuz bulunmaktadır.</p>

<p>Dergi detaylarını görüntülemek ve editörlük görevlerinize başlamak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{journal_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{journal_url}</a></p>

<p><em>Bu önemli görevi üstlendiğiniz için teşekkür ederiz.</em></p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">Journal Editor Assignment</h4>

<p><strong>Hi {user_name},</strong></p>

<p>You have been assigned an important responsibility. You are now an editor for the following journal:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Journal Title:</strong> {journal_title}<br>
    <strong>Issue:</strong> {journal_issue}<br>
    <strong>Journal ID:</strong> #{journal_id}</p>
</div>

<p>As an editor, you will be responsible for evaluating submissions, communicating with authors, and working with referees for this journal.</p>

<p>Click the link below to view the journal details and begin your editorial duties:</p>
<p><a href="{journal_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{journal_url}</a></p>

<p><em>Thank you for taking on this important role.</em></p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Journal editor assignment notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send journal editor assignment notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the journal editor assignment notification."
        )

def send_referee_assignment_to_referee_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    entry_title: str,
    entry_id: int,
    entry_authors: list,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email to a referee when they are assigned to review a journal entry.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the referee being assigned
        user_name: Name of the referee
        entry_title: Title of the journal entry
        entry_id: ID of the journal entry
        entry_authors: List of author names
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}"
    authors_text = ", ".join(entry_authors) if entry_authors else "Not specified"

    # Bilingual subject
    if language == "tr":
        subject = f"Hakemlik Göreviniz: {entry_title}"
    else:
        subject = f"Referee Assignment: {entry_title} | Hakemlik göreviniz"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Hakemlik Görevine Atandınız</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Aşağıdaki makaleyi değerlendirmeniz için hakem olarak atandınız:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}<br>
    <strong>Yazarlar:</strong> {authors_text}</p>
</div>

<p>Hakem olarak sorumluluklarınız:</p>
<ul>
    <li>Makalenin bilimsel kalitesini değerlendirmek</li>
    <li>Yazarlara yapıcı geri bildirimler sağlamak</li>
    <li>Gerekli durumlarda revizyon önerileri sunmak</li>
    <li>Değerlendirme sürecini zamanında tamamlamak</li>
</ul>

<p>Makaleyi incelemek ve değerlendirme sürecini başlatmak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<p><em>Bu önemli akademik katkınız için şimdiden teşekkür ederiz.</em></p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">Referee Assignment</h4>

<p><strong>Hi {user_name},</strong></p>

<p>You have been assigned an important academic responsibility. You are now a referee for the following journal entry:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
    <strong>Entry ID:</strong> #{entry_id}<br>
    <strong>Authors:</strong> {authors_text}</p>
</div>

<p>Your responsibilities as a referee:</p>
<ul>
    <li>Evaluate the scientific quality of the submission</li>
    <li>Provide constructive feedback to the authors</li>
    <li>Suggest revisions when necessary</li>
    <li>Complete the review process in a timely manner</li>
</ul>

<p>Click the link below to review the entry and begin your evaluation process:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<p><em>Thank you in advance for this important academic contribution.</em></p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Referee assignment notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send referee assignment notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the referee assignment notification."
        )

def send_login_link_email(
    api_key: str,
    user_email: str,
    user_name: str,
    login_link: str,
    language: str = "en"
):
    """
    Sends a login link email to a user (admin function).
    
    Args:
        api_key: Brevo API key
        user_email: Email of the recipient
        user_name: Name of the recipient
        login_link: The temporary login link
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    # Bilingual subject
    if language == "tr":
        subject = "Giriş Bağlantınız"
    else:
        subject = "Your Login Link | Giriş bağlantınız"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #e74c3c;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Geçici Giriş Erişimi</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>İnsan ve Mekan hesabınıza erişim için geçici bir giriş bağlantısı sağlandı:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Hesap:</strong> {user_email}<br>
    <strong>Geçerlilik süresi:</strong> 6 ay</p>
</div>

<p>Giriş Bağlantısı:</p>
<p>{login_link}</p>

<p>Bu bağlantı, şifre gerektirmeden hesabınıza doğrudan erişim sağlar. Lütfen güvenli tutun ve başkalarıyla paylaşmayın.</p>

<p>Bu giriş bağlantısını talep etmediyseniz, lütfen hemen yöneticiyle iletişime geçin.</p>

<br>

<h3 style="color: #2980b9;">ENGLISH</h3>
<h4 style="color: #2980b9;">Temporary Login Access</h4>

<p><strong>Hi {user_name},</strong></p>

<p>You have been provided with a temporary login link to access your Human and Space account:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Account:</strong> {user_email}<br>
    <strong>Valid for:</strong> 6 months</p>
</div>

<p>Login Link:</p>
<p>{login_link}</p>

<p>This link provides direct access to your account without requiring a password. Please keep it secure and do not share it with others.</p>

<p>If you did not request this login link, please contact the administrator immediately.</p>
    """

    html_content = get_email_template().format(CONTENT=content)
    
    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": user_email, "name": user_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, 
        sender=sender, 
        subject=subject, 
        html_content=html_content
    )
    
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Login link email sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send login link email: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the login link email."
        ) 