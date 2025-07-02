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
        subject = "E-posta adresinizi onaylayın | Confirm your email address"

    # Bilingual content with Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<p><strong>Hoş geldiniz, {user_name}!</strong></p>

<p>İnsan ve Mekan'a kaydolduğunuz için teşekkür ederiz! E-posta adresinizi onaylamak ve hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayın:</p>

<p><strong>E-posta:</strong> {user_email}</p>

<p><strong>E-posta Onaylama Bağlantısı:</strong><br>
<a href="{confirmation_link}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{confirmation_link}</a></p>

<p>Bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.</p>

<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
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
        subject = "Şifrenizi sıfırlayın | Reset Your Password"

    # Bilingual content with Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Şifre Sıfırlama İsteği</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>İnsan ve Mekan hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak için aşağıdaki bağlantıya tıklayın:</p>

<p><strong>Hesap:</strong> {user_email}<br>
<strong>Geçerlilik süresi:</strong> 15 dakika</p>

<p><strong>Şifre Sıfırlama Bağlantısı:</strong><br>
<a href="{reset_link}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{reset_link}</a></p>

<p>Şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelin. Şifreniz değişmeden kalacaktır.</p>

<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
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
        subject = f"Yazar güncellemesi: {entry_title} | Author Update"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Yeni Yazar Güncellemesi</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Makale güncellemesi gerçekleşti:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
</div>

<p>Güncellemeyi görüntülemek ve değerlendirmenizi yapmak için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
<h4 style="color: #2980b9;">New Author Update</h4>

<p><strong>Hi {user_name},</strong></p>

<p>An update has been made to the journal entry:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
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
        subject = f"Hakem değerlendirmesi: {entry_title} | Referee Review "

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Yeni Hakem Değerlendirmesi</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Makale değerlendirmesi gerçekleştirildi:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
</div>

<p>Hakemin geri bildirimlerini ve önerilerini görüntülemek için aşağıdaki bağlantıya tıklayın:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
<h4 style="color: #2980b9;">New Referee Review</h4>

<p><strong>Hi {user_name},</strong></p>

<p>A review has been submitted for the journal entry:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
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
        referee_name: Name of the referee who was assigned (not displayed to maintain anonymity)
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
        subject = f"Hakem atandı: {entry_title} | Referee Assigned"

    # Bilingual content, Turkish first (referee name removed to maintain anonymity)
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Makalenize Hakem Atandı</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Dergi başvurunuzu değerlendirmek üzere bir hakem atandı:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makaleniz:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
</div>

<p>İnceleme süreci başladı. Hakem, başvurunuzu dikkatlice değerlendirecek ve detaylı geri bildirim sağlayacaktır. Başvurunuzun ilerleyişini aşağıdaki bağlantıdan takip edebilirsiniz:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<p>Hakem değerlendirmesini tamamladığında sizi tekrar bilgilendireceğiz.</p>

<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
<h4 style="color: #2980b9;">Referee Assigned to Your Submission</h4>

<p><strong>Hi {user_name},</strong></p>

<p>A referee has been assigned to review your journal submission:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Your Entry:</strong> {entry_title}<br>
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
        user_email: Email of the recipient (author, referee, or journal editor)
        user_name: Name of the recipient
        entry_title: Title of the journal entry
        entry_id: ID of the journal entry
        old_status: Previous status of the entry
        new_status: New status of the entry
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
        
    Note: This function should be called for each recipient separately:
    - All authors of the entry
    - All referees assigned to the entry  
    - All editors of the journal containing this entry
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
        subject = f"Durum güncellemesi: {entry_title} | Status Update"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
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

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
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
        subject = f"Dergi editörlüğüne atandınız: {journal_title} | Journal Editor Assignment"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
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

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
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
        entry_authors: List of author names (not displayed to maintain anonymity)
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}"
    # Authors text removed to maintain anonymity
    # authors_text = ", ".join(entry_authors) if entry_authors else "Not specified"

    # Bilingual subject
    if language == "tr":
        subject = f"Hakemlik Göreviniz: {entry_title}"
    else:
        subject = f"Hakemlik göreviniz: {entry_title} | Referee Assignment"

    # Bilingual content, Turkish first (author names removed to maintain anonymity)
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Hakemlik Görevine Atandınız</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Aşağıdaki makaleyi değerlendirmeniz için hakem olarak atandınız:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
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

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
<h4 style="color: #2980b9;">Referee Assignment</h4>

<p><strong>Hi {user_name},</strong></p>

<p>You have been assigned an important academic responsibility. You are now a referee for the following journal entry:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
    <strong>Entry ID:</strong> #{entry_id}</p>
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

def send_editor_in_chief_assignment_notification(
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
    Sends a notification email when a user is assigned as editor-in-chief of a journal.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the editor-in-chief being assigned
        user_name: Name of the editor-in-chief
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
        subject = f"Baş Editörlüğe Atandınız: {journal_title}"
    else:
        subject = f"Baş editörlüğe atandınız: {journal_title} | Editor-in-Chief Assignment"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Baş Editörlüğe Atandınız</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Aşağıdaki derginin <strong>Baş Editörlüğü</strong> görevine atandınız:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Dergi Başlığı:</strong> {journal_title}<br>
    <strong>Sayı:</strong> {journal_issue}<br>
    <strong>Dergi No:</strong> #{journal_id}</p>
</div>

<p><strong>Baş Editör</strong> olarak sorumluluklarınız:</p>
<ul>
    <li>Derginin genel yönetimi ve koordinasyonu</li>
    <li>Editörlerin atanması ve yönetimi</li>
    <li>Makale değerlendirme sürecinin gözetimi</li>
    <li>Yayın kalitesinin sağlanması</li>
    <li>Dergi politikalarının belirlenmesi</li>
</ul>

<p>Dergi yönetim paneline erişmek ve baş editör görevlerinize başlamak için:</p>
<p><a href="{journal_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{journal_url}</a></p>

<p><em>Bu önemli görevi üstlendiğiniz için teşekkür ederiz.</em></p>

<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
<h4 style="color: #2980b9;">Editor-in-Chief Assignment</h4>

<p><strong>Hi {user_name},</strong></p>

<p>You have been assigned the prestigious role of <strong>Editor-in-Chief</strong> for the following journal:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Journal Title:</strong> {journal_title}<br>
    <strong>Issue:</strong> {journal_issue}<br>
    <strong>Journal ID:</strong> #{journal_id}</p>
</div>

<p>As <strong>Editor-in-Chief</strong>, your responsibilities include:</p>
<ul>
    <li>Overall management and coordination of the journal</li>
    <li>Appointing and managing editors</li>
    <li>Overseeing the manuscript review process</li>
    <li>Ensuring publication quality</li>
    <li>Establishing journal policies</li>
</ul>

<p>Access the journal management dashboard and begin your editorial duties:</p>
<p><a href="{journal_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{journal_url}</a></p>

<p><em>Thank you for accepting this prestigious role.</em></p>
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
        print(f"Editor-in-Chief assignment notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send editor-in-chief assignment notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the editor-in-chief assignment notification."
        )

def send_author_assignment_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    entry_title: str,
    entry_id: int,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email when a user is assigned as an author to a journal entry.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the author being assigned
        user_name: Name of the author
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
        subject = f"Yazar Olarak Atandınız: {entry_title}"
    else:
        subject = f"Yazar olarak atandınız: {entry_title} | Author Assignment"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Makale Yazarı Olarak Ekldiniz</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Aşağıdaki makaleye <strong>yazar</strong> olarak eklendiniz:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}</p>
</div>

<p><strong>Yazar</strong> olarak sorumluluklarınız:</p>
<ul>
    <li>Makale içeriğini gözden geçirmek ve gerektiğinde güncellemeler yapmak</li>
    <li>Hakem değerlendirmelerine yanıt vermek</li>
    <li>Editör isteklerini karşılamak</li>
    <li>Makale ile ilgili iletişimde bulunmak</li>
</ul>

<p>Makaleyi görüntülemek ve yazar panelinize erişmek için:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>


<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
<h4 style="color: #2980b9;">Author Assignment</h4>

<p><strong>Hi {user_name},</strong></p>

<p>You have been added as an <strong>author</strong> to the following journal entry:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
    <strong>Entry ID:</strong> #{entry_id}</p>
</div>

<p>As an <strong>author</strong>, your responsibilities include:</p>
<ul>
    <li>Reviewing the entry content and making updates when necessary</li>
    <li>Responding to referee evaluations</li>
    <li>Addressing editor requests</li>
    <li>Communicating regarding the entry</li>
</ul>

<p>View the entry and access your author dashboard:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">{entry_url}</a></p>

<p><em>Thank you for being part of this important academic work.</em></p>
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
        print(f"Author assignment notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send author assignment notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the author assignment notification."
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
        subject = "Giriş bağlantınız | Your Login Link"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
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

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
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

def send_entry_assigned_to_journal_notification(
    api_key: str,
    user_email: str,
    user_name: str,
    entry_title: str,
    entry_id: int,
    journal_title: str,
    journal_issue: str,
    journal_id: int,
    author_names: list,
    base_url: str = "https://insanvemekan.com",
    language: str = "en"
):
    """
    Sends a notification email when a new journal entry is assigned to a journal.
    This is sent to editor-in-chief and editors of the journal.
    
    Args:
        api_key: Brevo API key
        user_email: Email of the recipient (editor or editor-in-chief)
        user_name: Name of the recipient
        entry_title: Title of the journal entry
        entry_id: ID of the journal entry
        journal_title: Title of the journal
        journal_issue: Issue number of the journal
        journal_id: ID of the journal
        author_names: List of author names
        base_url: Base URL for the frontend
        language: "en" for English, "tr" for Turkish
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}"
    journal_url = f"{base_url}/journals/{journal_id}"
    authors_text = ", ".join(author_names) if author_names else "Not specified"

    # Bilingual subject
    if language == "tr":
        subject = f"Yeni Makale Atandı: {journal_title}"
    else:
        subject = f"Yeni makale atandı: {journal_title} | New Entry Assigned"

    # Bilingual content, Turkish first
    content = f"""
<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">TÜRKÇE</h3>
<h4 style="color: #c0392b;">Derginize Yeni Makale Atandı</h4>

<p><strong>Merhaba {user_name},</strong></p>

<p>Editörü olduğunuz dergiye yeni bir makale atandı:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 15px 0;">
    <p><strong>Makale Başlığı:</strong> {entry_title}<br>
    <strong>Makale No:</strong> #{entry_id}<br>
    <strong>Yazar(lar):</strong> {authors_text}</p>
</div>

<div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Dergi:</strong> {journal_title}<br>
    <strong>Sayı:</strong> {journal_issue}<br>
    <strong>Dergi No:</strong> #{journal_id}</p>
</div>

<p>Editör olarak sorumluluklarınız:</p>
<ul>
    <li>Makalenin ön değerlendirmesini yapmak</li>
    <li>Uygun hakemleri atamak</li>
    <li>Değerlendirme sürecini koordine etmek</li>
    <li>Yazarlarla iletişimi sağlamak</li>
</ul>

<p>Makale detaylarını incelemek için:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">Makaleyi İncele</a></p>

<p>Dergi yönetim paneline erişmek için:</p>
<p><a href="{journal_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">Dergi Paneli</a></p>

<br>

<h3 style="color: #7f8c8d; font-weight: 300; font-style: italic;">ENGLISH</h3>
<h4 style="color: #2980b9;">New Entry Assigned to Your Journal</h4>

<p><strong>Hi {user_name},</strong></p>

<p>A new entry has been assigned to the journal you edit:</p>

<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Entry Title:</strong> {entry_title}<br>
    <strong>Entry ID:</strong> #{entry_id}<br>
    <strong>Author(s):</strong> {authors_text}</p>
</div>

<div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #2980b9; margin: 15px 0;">
    <p><strong>Journal:</strong> {journal_title}<br>
    <strong>Issue:</strong> {journal_issue}<br>
    <strong>Journal ID:</strong> #{journal_id}</p>
</div>

<p>Your responsibilities as an editor:</p>
<ul>
    <li>Conduct preliminary evaluation of the submission</li>
    <li>Assign appropriate referees</li>
    <li>Coordinate the review process</li>
    <li>Maintain communication with authors</li>
</ul>

<p>Review the entry details:</p>
<p><a href="{entry_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">Review Entry</a></p>

<p>Access the journal management dashboard:</p>
<p><a href="{journal_url}" style="color: #3498db; text-decoration: none; background-color: #ecf0f1; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0;">Journal Dashboard</a></p>
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
        print(f"Entry assignment notification sent successfully to {user_email}. Brevo Response: {api_response}")
        return True
    except ApiException as e:
        print(f"Exception when calling TransactionalEmailsApi->send_transac_email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send entry assignment notification: {e.reason}"
        )
    except Exception as e:
        print(f"An unexpected error occurred while sending email: {e}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the entry assignment notification."
        ) 