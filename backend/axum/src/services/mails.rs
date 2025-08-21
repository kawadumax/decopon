use lettre::message::{header::ContentType, Mailbox};
use lettre::transport::smtp::response::Response;
use lettre::{Message, SmtpTransport, Transport};
use std::env;
use std::sync::Arc;

use crate::errors::ApiError;

pub fn setup_mailer() -> Result<Arc<SmtpTransport>, ApiError> {
    // Load SMTP server credentials from environment variables
    let smtp_server = env::var("AXUM_SMTP_SERVER")?;
    let smtp_username = env::var("AXUM_SMTP_USERNAME")?;
    let smtp_password = env::var("AXUM_SMTP_PASSWORD")?;

    // Create SMTP transport
    let creds =
        lettre::transport::smtp::authentication::Credentials::new(smtp_username, smtp_password);
    let mailer = SmtpTransport::relay(&smtp_server)?
        .credentials(creds)
        .build();

    Ok(Arc::new(mailer))
}

fn get_from() -> Result<Mailbox, ApiError> {
    let name = env::var("AXUM_MAIL_FROM_NAME").unwrap_or_else(|_| "Default Name".to_string());
    let email = env::var("AXUM_MAIL_FROM_EMAIL")?;
    let address = email
        .parse()
        .map_err(|e| ApiError::Internal(Box::new(e)))?;
    Ok(Mailbox::new(Some(name), address))
}

pub fn send(
    mailer: Arc<SmtpTransport>,
    email: &str,
    subject: &str,
    body: &str,
) -> Result<Response, ApiError> {
    let to = Mailbox::new(
        Some(subject.to_owned()),
        email
            .parse()
            .map_err(|e| ApiError::Internal(Box::new(e)))?,
    );
    let from = get_from()?;

    let email = Message::builder()
        .from(from)
        .to(to)
        .subject(subject)
        .header(ContentType::TEXT_PLAIN)
        .body(String::from(body))
        .map_err(|e| ApiError::Internal(Box::new(e)))?;

    // Send the email
    Ok(mailer.send(&email)?)
}

pub fn send_verification_email(
    mailer: Arc<SmtpTransport>,
    email: &str,
    token: &str,
) -> Result<(), ApiError> {
    let body = format!("Verification token: {}", token);
    send(mailer, email, "Verify your email", &body)?;
    Ok(())
}

// test

#[cfg(test)]
mod tests {
    use super::*;
    use dotenvy::dotenv;

    fn mock_address() -> String {
        let address = env::var("AXUM_MOCK_EMAIL").unwrap_or("test@example.com".to_string());
        println!("Using mock email address: {}", address);
        address
    }

    #[test]
    #[ignore = "外部サービスにメール送信するため通常はスキップ"]
    fn one_shot() {
        dotenv().ok();

        let from = get_from().expect("from address");

        let email = Message::builder()
            .from(from)
            .to(Mailbox::new(None, mock_address().parse().unwrap()))
            .subject("Happy new year")
            .header(ContentType::TEXT_PLAIN)
            .body(String::from("Be happy!"))
            .unwrap();

        let mailer = setup_mailer().expect("Failed to set up mailer");

        match mailer.send(&email) {
            Ok(_) => println!("Email sent successfully!"),
            Err(e) => panic!("Could not send email: {e:?}"),
        }
    }
}
