import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from fastapi import HTTPException, status

# Replace with your actual sender information
SENDER_EMAIL = "noreply@humanand.space"  # Consider making this configurable
SENDER_NAME = "noreply@humanand.space" # Consider making this configurable
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
            <p>The {SENDER_NAME} Team</p>
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