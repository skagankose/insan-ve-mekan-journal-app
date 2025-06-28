import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from fastapi import HTTPException, status

# Replace with your actual sender information
SENDER_EMAIL = "no-reply@humanand.space"  # Consider making this configurable
SENDER_NAME = "İnsan ve Mekan / Human and Space" # Consider making this configurable
# It's good practice to load API keys from environment variables or a config file
# For this example, we'll pass it as an argument, but avoid hardcoding in production
# BREVO_API_KEY = "YOUR_BREVO_API_KEY" 

# Email template configuration

def get_email_template() -> str:
    """
    Returns the base HTML template for emails with inline styling for better email client compatibility.
    """
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>İnsan ve Mekan</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); padding: 40px 30px; text-align: center; color: white;">
                                <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">İNSAN ve MEKAN</h1>
                                <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; font-style: italic; color: white;">Human and Space</p>
                                <div style="width: 60px; height: 3px; background-color: white; margin: 20px auto 0 auto; opacity: 0.8;"></div>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                {CONTENT}
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); color: white; text-align: center; padding: 20px 30px; font-size: 14px;">
                                <p style="margin: 0;">© 2025 İnsan ve Mekan | Human and Space <br>Akademi Platformu</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

def send_confirmation_email(
    api_key: str, 
    user_email: str, 
    user_name: str, 
    confirmation_token: str,
    base_url: str = "http://localhost:8000",
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

    # Bilingual content with inline styles, Turkish first
    content = f"""
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <div>
                        <p style="color: #7f8c8d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; margin-top: 0;">TÜRKÇE</p>
                        <h2 style="color: #14B8A6; margin-bottom: 20px; font-size: 22px; margin-top: 0;">Hoş geldiniz, {user_name}!</h2>
                        <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">İnsan ve Mekan'a kaydolduğunuz için teşekkür ederiz! E-posta adresinizi onaylamak ve hesabınızı etkinleştirmek için aşağıdaki butona tıklayın:</p>
                        
                        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0;">
                            <tr>
                                <td>
                                    <p style="margin: 0; color: #555555;"><strong>E-posta:</strong> {user_email}</p>
                                </td>
                            </tr>
                        </table>
                        
                        <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                            <tr>
                                <td style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px;">
                                    <a href="{confirmation_link}" style="color: white; text-decoration: none; font-weight: bold; display: block;">E-posta Adresini Onayla</a>
                                </td>
                            </tr>
                        </table>
                        
                        <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">Bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.</p>
                    </div>

                    <div style="border-top: 2px solid #ecf0f1; margin: 30px 0; padding-top: 30px;">
                        <p style="color: #7f8c8d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; margin-top: 0;">ENGLISH</p>
                        <h2 style="color: #14B8A6; margin-bottom: 20px; font-size: 22px; margin-top: 0;">Welcome, {user_name}!</h2>
                        <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">Thanks for signing up for Human and Space! Please click the button below to confirm your email address and activate your account:</p>
                        
                        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0;">
                            <tr>
                                <td>
                                    <p style="margin: 0; color: #555555;"><strong>Email:</strong> {user_email}</p>
                                </td>
                            </tr>
                        </table>
                        
                        <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                            <tr>
                                <td style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px;">
                                    <a href="{confirmation_link}" style="color: white; text-decoration: none; font-weight: bold; display: block;">Confirm Email Address</a>
                                </td>
                            </tr>
                        </table>
                        
                        <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">If you did not create this account, you can safely ignore this email.</p>
                    </div>
                </td>
            </tr>
        </table>
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
    base_url: str = "http://localhost:5173",
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

    # Bilingual content with inline styles, Turkish first
    content = f"""
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <p style="color: #7f8c8d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; margin-top: 0;">TÜRKÇE</p>
                    <h2 style="color: #14B8A6; margin-bottom: 20px; font-size: 22px; margin-top: 0;">Şifre Sıfırlama İsteği</h2>
                    <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">Merhaba {user_name},</p>
                    <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">İnsan ve Mekan hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak için aşağıdaki butona tıklayın:</p>
                    
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0;">
                        <tr>
                            <td>
                                <p style="margin: 0; color: #555555;"><strong>Hesap:</strong> {user_email}</p>
                                <p style="margin: 5px 0 0 0; color: #555555;"><strong>Geçerlilik süresi:</strong> 15 dakika</p>
                            </td>
                        </tr>
                    </table>
                    
                    <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                        <tr>
                            <td style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px;">
                                <a href="{reset_link}" style="color: white; text-decoration: none; font-weight: bold; display: block;">Şifreyi Sıfırla</a>
                            </td>
                        </tr>
                    </table>
                    
                    <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">Şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelin. Şifreniz değişmeden kalacaktır.</p>
                    
                    <div style="border-top: 2px solid #ecf0f1; margin: 30px 0; padding-top: 30px;">
                        <p style="color: #7f8c8d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; margin-top: 0;">ENGLISH</p>
                        <h2 style="color: #14B8A6; margin-bottom: 20px; font-size: 22px; margin-top: 0;">Password Reset Request</h2>
                        <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">Hi {user_name},</p>
                        <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">We received a request to reset your password for your Human and Space account. Click the button below to create a new password:</p>
                        
                        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0;">
                            <tr>
                                <td>
                                    <p style="margin: 0; color: #555555;"><strong>Account:</strong> {user_email}</p>
                                    <p style="margin: 5px 0 0 0; color: #555555;"><strong>Valid for:</strong> 15 minutes</p>
                                </td>
                            </tr>
                        </table>
                        
                        <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                            <tr>
                                <td style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px;">
                                    <a href="{reset_link}" style="color: white; text-decoration: none; font-weight: bold; display: block;">Reset Password</a>
                                </td>
                            </tr>
                        </table>
                        
                        <p style="margin-bottom: 15px; color: #555555; line-height: 1.6;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    </div>
                </td>
            </tr>
        </table>
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
    base_url: str = "http://localhost:5173",
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
        <div class="language-label">TÜRKÇE</div>
        <h2 style="color: #14B8A6;">📝 Yeni Yazar Güncellemesi</h2>
        <p>Merhaba {user_name},</p>
        <p><strong>{author_name}</strong> isimli yazar, dergi makalesinde güncelleme yaptı:</p>
        <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
            <p><strong>Makale Başlığı:</strong> {entry_title}</p>
            <p><strong>Yazar:</strong> {author_name}</p>
            <p><strong>Makale No:</strong> #{entry_id}</p>
        </div>
        <p>Güncellemeyi görüntülemek ve değerlendirmenizi yapmak için aşağıdaki butona tıklayın:</p>
        <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">Yazar Güncellemesini Görüntüle</a>
        
        <div class="language-divider" style="border-top: 2px solid #ecf0f1; margin: 30px 0; padding-top: 30px;">
            <div class="language-label">ENGLISH</div>
            <h2 style="color: #14B8A6;">📝 New Author Update</h2>
            <p>Hi {user_name},</p>
            <p>The author <strong>{author_name}</strong> has made an update to the journal entry:</p>
            <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
                <p><strong>Entry Title:</strong> {entry_title}</p>
                <p><strong>Author:</strong> {author_name}</p>
                <p><strong>Entry ID:</strong> #{entry_id}</p>
            </div>
            <p>You can view the complete update and provide your review by clicking the button below:</p>
            <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">View Author Update</a>
        </div>
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
    base_url: str = "http://localhost:5173",
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
        <div class="language-label">TÜRKÇE</div>
        <h2 style="color: #14B8A6;">⚖️ Yeni Hakem Değerlendirmesi</h2>
        <p>Merhaba {user_name},</p>
        <p><strong>{referee_name}</strong> isimli hakem, dergi makalesi için değerlendirme yaptı:</p>
        <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
            <p><strong>Makale Başlığı:</strong> {entry_title}</p>
            <p><strong>Hakem:</strong> {referee_name}</p>
            <p><strong>Makale No:</strong> #{entry_id}</p>
        </div>
        <p>Hakemin geri bildirimlerini ve önerilerini görüntülemek için aşağıdaki butona tıklayın:</p>
        <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">Hakem Değerlendirmesini Görüntüle</a>
        
        <div class="language-divider" style="border-top: 2px solid #ecf0f1; margin: 30px 0; padding-top: 30px;">
            <div class="language-label">ENGLISH</div>
            <h2 style="color: #14B8A6;">⚖️ New Referee Review</h2>
            <p>Hi {user_name},</p>
            <p>The referee <strong>{referee_name}</strong> has submitted a review for the journal entry:</p>
            <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
                <p><strong>Entry Title:</strong> {entry_title}</p>
                <p><strong>Referee:</strong> {referee_name}</p>
                <p><strong>Entry ID:</strong> #{entry_id}</p>
            </div>
            <p>You can view the referee's feedback and recommendations by clicking the button below:</p>
            <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">View Referee Review</a>
        </div>
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
    base_url: str = "http://localhost:5173",
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
        <div class="language-label">TÜRKÇE</div>
        <h2 style="color: #14B8A6;">👨‍🎓 Makalenize Hakem Atandı</h2>
        <p>Merhaba {user_name},</p>
        <p>Dergi başvurunuzu değerlendirmek üzere bir hakem atandı:</p>
        <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
            <p><strong>Makaleniz:</strong> {entry_title}</p>
            <p><strong>Atanan Hakem:</strong> {referee_name}</p>
            <p><strong>Makale No:</strong> #{entry_id}</p>
        </div>
        <p>İnceleme süreci başladı. Hakem, başvurunuzu dikkatlice değerlendirecek ve detaylı geri bildirim sağlayacaktır. Başvurunuzun ilerleyişini aşağıdaki bağlantıdan takip edebilirsiniz:</p>
        <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">Başvurunuzu Görüntüle</a>
        <p>Hakem değerlendirmesini tamamladığında sizi tekrar bilgilendireceğiz.</p>
        
        <div class="language-divider" style="border-top: 2px solid #ecf0f1; margin: 30px 0; padding-top: 30px;">
            <div class="language-label">ENGLISH</div>
            <h2 style="color: #14B8A6;">👨‍🎓 Referee Assigned to Your Submission</h2>
            <p>Hi {user_name},</p>
            <p>A referee has been assigned to review your journal submission:</p>
            <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
                <p><strong>Your Entry:</strong> {entry_title}</p>
                <p><strong>Assigned Referee:</strong> {referee_name}</p>
                <p><strong>Entry ID:</strong> #{entry_id}</p>
            </div>
            <p>The review process has now begun. The referee will carefully evaluate your submission and provide detailed feedback. You can track the progress of your submission by clicking below:</p>
            <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">View Your Submission</a>
            <p>We will notify you as soon as the referee completes their review.</p>
        </div>
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
    base_url: str = "http://localhost:5173",
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
        <div class="language-label">TÜRKÇE</div>
        <h2 style="color: #14B8A6;">📊 Başvuru Durumu Güncellemesi</h2>
        <p>Merhaba {user_name},</p>
        <p>Dergi başvurunuzun durumu güncellendi:</p>
        <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
            <p><strong>Makale Başlığı:</strong> {entry_title}</p>
            <p><strong>Makale No:</strong> #{entry_id}</p>
            <p><strong>Durum Değişikliği:</strong></p>
            <p>
                <span class="status-badge status-from">{old_status_display_tr}</span> 
                → 
                <span class="status-badge status-to">{new_status_display_tr}</span>
            </p>
        </div>
        <p>Başvurunuzun tüm detaylarını ve ek bilgileri görüntülemek için aşağıdaki butona tıklayın:</p>
        <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">Başvuru Detaylarını Görüntüle</a>
        
        <div class="language-divider" style="border-top: 2px solid #ecf0f1; margin: 30px 0; padding-top: 30px;">
            <div class="language-label">ENGLISH</div>
            <h2 style="color: #14B8A6;">📊 Submission Status Update</h2>
            <p>Hi {user_name},</p>
            <p>The status of your journal submission has been updated:</p>
            <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
                <p><strong>Entry Title:</strong> {entry_title}</p>
                <p><strong>Entry ID:</strong> #{entry_id}</p>
                <p><strong>Status Change:</strong></p>
                <p>
                    <span class="status-badge status-from">{old_status_display_en}</span> 
                    → 
                    <span class="status-badge status-to">{new_status_display_en}</span>
                </p>
            </div>
            <p>You can view the complete details of your submission and any additional information by clicking below:</p>
            <a href="{entry_url}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">View Submission Details</a>
        </div>
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
        <div class="language-label">TÜRKÇE</div>
        <h2 style="color: #14B8A6;">🔑 Geçici Giriş Erişimi</h2>
        <p>Merhaba {user_name},</p>
        <p>İnsan ve Mekan hesabınıza erişim için geçici bir giriş bağlantısı sağlandı:</p>
        <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
            <p><strong>Hesap:</strong> {user_email}</p>
            <p><strong>Geçerlilik süresi:</strong> 6 ay</p>
        </div>
        <a href="{login_link}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">Hesabınıza Giriş Yapın</a>
        <p>Bu bağlantı, şifre gerektirmeden hesabınıza doğrudan erişim sağlar. Lütfen güvenli tutun ve başkalarıyla paylaşmayın.</p>
        <p>Bu giriş bağlantısını talep etmediyseniz, lütfen hemen yöneticiyle iletişime geçin.</p>
        
        <div class="language-divider" style="border-top: 2px solid #ecf0f1; margin: 30px 0; padding-top: 30px;">
            <div class="language-label">ENGLISH</div>
            <h2 style="color: #14B8A6;">🔑 Temporary Login Access</h2>
            <p>Hi {user_name},</p>
            <p>You have been provided with a temporary login link to access your Human and Space account:</p>
            <div class="highlight" style="background-color: #ecf0f1; border-left: 4px solid #14B8A6; margin: 20px 0; padding: 15px;">
                <p><strong>Account:</strong> {user_email}</p>
                <p><strong>Valid for:</strong> 6 months</p>
            </div>
            <a href="{login_link}" class="button" style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); border-radius: 5px; padding: 12px 30px; color: white; text-decoration: none; font-weight: bold; display: inline-block;">Login to Your Account</a>
            <p>This link provides direct access to your account without requiring a password. Please keep it secure and do not share it with others.</p>
            <p>If you did not request this login link, please contact the administrator immediately.</p>
        </div>
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