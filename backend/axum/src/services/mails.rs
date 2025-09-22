use lettre::message::{Mailbox, header::ContentType};
use lettre::transport::smtp::response::Response;
use lettre::{Message, SmtpTransport, Transport};
use std::env;
use std::sync::Arc;
use tracing::{info, warn};

use crate::errors::ApiError;

fn is_truthy(value: &str) -> bool {
    matches!(
        value.trim().to_ascii_lowercase().as_str(),
        "1" | "true" | "yes" | "on"
    )
}

fn smtp_disabled() -> bool {
    if let Ok(value) = env::var("AXUM_DISABLE_SMTP") {
        if is_truthy(&value) {
            return true;
        }
    }

    if let Ok(value) = env::var("APP_SINGLE_USER_MODE") {
        if is_truthy(&value) {
            return true;
        }
    }

    false
}

pub fn setup_mailer() -> Result<Option<Arc<SmtpTransport>>, ApiError> {
    if smtp_disabled() {
        info!("SMTP transport is disabled by configuration");
        return Ok(None);
    }

    // Load SMTP server credentials from environment variables
    let smtp_server = match env::var("AXUM_SMTP_SERVER") {
        Ok(value) => value,
        Err(_) => {
            warn!("AXUM_SMTP_SERVER is not set; skipping SMTP setup");
            return Ok(None);
        }
    };
    let smtp_username = match env::var("AXUM_SMTP_USERNAME") {
        Ok(value) => value,
        Err(_) => {
            warn!("AXUM_SMTP_USERNAME is not set; skipping SMTP setup");
            return Ok(None);
        }
    };
    let smtp_password = match env::var("AXUM_SMTP_PASSWORD") {
        Ok(value) => value,
        Err(_) => {
            warn!("AXUM_SMTP_PASSWORD is not set; skipping SMTP setup");
            return Ok(None);
        }
    };

    // Create SMTP transport
    let creds =
        lettre::transport::smtp::authentication::Credentials::new(smtp_username, smtp_password);
    let mailer = SmtpTransport::relay(&smtp_server)?
        .credentials(creds)
        .build();

    Ok(Some(Arc::new(mailer)))
}

fn get_from() -> Result<Mailbox, ApiError> {
    let name = env::var("AXUM_MAIL_FROM_NAME").unwrap_or_else(|_| "Default Name".to_string());
    let email = env::var("AXUM_MAIL_FROM_EMAIL")?;
    let address = email.parse().map_err(|e| ApiError::Internal(Box::new(e)))?;
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
        email.parse().map_err(|e| ApiError::Internal(Box::new(e)))?,
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
    let frontend_url =
        env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
    let url = format!(
        "{}/guest/verify-email/{}",
        frontend_url.trim_end_matches('/'),
        token
    );
    let body = format!("Verify your email by visiting: {}", url);
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
        unsafe {
            std::env::set_var("AXUM_DISABLE_SMTP", "0");
            std::env::set_var("APP_SINGLE_USER_MODE", "0");
        }

        let from = get_from().expect("from address");

        let email = Message::builder()
            .from(from)
            .to(Mailbox::new(None, mock_address().parse().unwrap()))
            .subject("Happy new year")
            .header(ContentType::TEXT_PLAIN)
            .body(String::from("Be happy!"))
            .unwrap();

        let mailer = setup_mailer()
            .expect("Failed to set up mailer")
            .expect("SMTP transport should be configured for this test");

        match mailer.send(&email) {
            Ok(_) => println!("Email sent successfully!"),
            Err(e) => panic!("Could not send email: {e:?}"),
        }
    }
}
