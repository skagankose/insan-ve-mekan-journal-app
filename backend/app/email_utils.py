import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from fastapi import HTTPException, status

# Replace with your actual sender information
SENDER_EMAIL = "no-reply@humanand.space"  # Consider making this configurable
SENDER_NAME = "no-reply@humanand.space" # Consider making this configurable
# It's good practice to load API keys from environment variables or a config file
# For this example, we'll pass it as an argument, but avoid hardcoding in production
# BREVO_API_KEY = "YOUR_BREVO_API_KEY" 

def send_confirmation_email(
    api_key: str, 
    user_email: str, 
    user_name: str, 
    confirmation_token: str,
    base_url: str = "http://localhost:8000" # Or your frontend URL if different
):
    """
    Sends a confirmation email to the user with a verification link.
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    confirmation_link = f"{base_url}/confirm-email/{confirmation_token}"

    subject = "Confirm your email address"
    html_content = f"""
    <html>
        <body>
            <h1>Hi {user_name},</h1>
            <p>Thanks for signing up! Please click the link below to confirm your email address:</p>
            <p><a href="{confirmation_link}">Confirm Email</a></p>
            <p>If you did not sign up for this account, you can ignore this email.</p>
            <p>Thanks,</p>
            <p>The Human and Space Team</p>
        </body>
    </html>
    """
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
        # Depending on your error handling strategy, you might want to:
        # - Log this error more formally
        # - Raise an HTTPException to inform the client, or handle it internally
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
    base_url: str = "http://localhost:5173" # Using frontend URL for password reset
):
    """
    Sends a password reset email to the user with a reset link.
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    reset_link = f"{base_url}/reset-password/{reset_token}"

    subject = "Reset Your Password"
    html_content = f"""
    <html>
        <body>
            <h1>Hi {user_name},</h1>
            <p>We received a request to reset your password. Click the link below to create a new password:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>This link is valid for 15 minutes.</p>
            <p>If you did not request a password reset, you can ignore this email.</p>
            <p>Thanks,</p>
            <p>The Human and Space Team</p>
        </body>
    </html>
    """
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
    base_url: str = "http://localhost:5173"  # Frontend URL
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
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}/updates"

    subject = f"Author Update: {entry_title}"
    html_content = f"""
    <html>
        <body>
            <h1>Hi {user_name},</h1>
            <p>The author <strong>{author_name}</strong> has made an update to the journal entry:</p>
            <p><strong>{entry_title}</strong></p>
            <p>You can view the update by clicking the link below:</p>
            <p><a href="{entry_url}">View Update</a></p>
            <p>Thanks,</p>
            <p>The Human and Space Team</p>
        </body>
    </html>
    """
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
    base_url: str = "http://localhost:5173"  # Frontend URL
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
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}/updates"

    subject = f"Referee Update: {entry_title}"
    html_content = f"""
    <html>
        <body>
            <h1>Hi {user_name},</h1>
            <p>The referee <strong>{referee_name}</strong> has made an update to the journal entry:</p>
            <p><strong>{entry_title}</strong></p>
            <p>You can view the update by clicking the link below:</p>
            <p><a href="{entry_url}">View Update</a></p>
            <p>Thanks,</p>
            <p>The Human and Space Team</p>
        </body>
    </html>
    """
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
    base_url: str = "http://localhost:5173"  # Frontend URL
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
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}"

    subject = f"Referee Assigned: {entry_title}"
    html_content = f"""
    <html>
        <body>
            <h1>Hi {user_name},</h1>
            <p>A referee has been assigned to your journal entry:</p>
            <p><strong>{entry_title}</strong></p>
            <p>The assigned referee is: <strong>{referee_name}</strong></p>
            <p>You can view your entry by clicking the link below:</p>
            <p><a href="{entry_url}">View Entry</a></p>
            <p>The referee will now review your submission and provide feedback.</p>
            <p>Thanks,</p>
            <p>The Human and Space Team</p>
        </body>
    </html>
    """
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
    base_url: str = "http://localhost:5173"  # Frontend URL
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
    """
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = api_key
    
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    entry_url = f"{base_url}/entries/{entry_id}"

    # Format status names for display
    status_display = {
        'waiting_for_payment': 'Waiting for Payment',
        'waiting_for_authors': 'Waiting for Authors',
        'waiting_for_referees': 'Waiting for Referees',
        'waiting_for_editors': 'Waiting for Editors',
        'accepted': 'Accepted',
        'not_accepted': 'Not Accepted',
        'rejected': 'Rejected',
        'pending': 'Pending'
    }
    
    old_status_display = status_display.get(old_status, old_status.replace('_', ' ').title())
    new_status_display = status_display.get(new_status, new_status.replace('_', ' ').title())

    subject = f"Status Update: {entry_title}"
    html_content = f"""
    <html>
        <body>
            <h1>Hi {user_name},</h1>
            <p>The status of your journal entry has been updated:</p>
            <p><strong>{entry_title}</strong></p>
            <p>Status changed from: <strong>{old_status_display}</strong> to: <strong>{new_status_display}</strong></p>
            <p>You can view your entry by clicking the link below:</p>
            <p><a href="{entry_url}">View Entry</a></p>
            <p>Thanks,</p>
            <p>The Human and Space Team</p>
        </body>
    </html>
    """
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