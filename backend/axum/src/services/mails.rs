use lettre::message::{Mailbox, header::ContentType};
use lettre::transport::smtp::response::Response;
use lettre::{Message, SmtpTransport, Transport};
use std::env;
use std::sync::Arc;

pub fn setup_mailer() -> Result<Arc<SmtpTransport>, Box<dyn std::error::Error>> {
    // Load SMTP server credentials from environment variables
    let smtp_server = std::env::var("AXUM_SMTP_SERVER")
        .expect("Environment variable 'AXUM_SMTP_SERVER' is not set. Check your '.env' file.");
    let smtp_username = std::env::var("AXUM_SMTP_USERNAME")
        .expect("Environment variable 'AXUM_SMTP_USERNAME' is not set. Check your '.env' file.");
    let smtp_password = std::env::var("AXUM_SMTP_PASSWORD")
        .expect("Environment variable 'AXUM_SMTP_PASSWORD' is not set. Check your '.env' file.");

    // Create SMTP transport
    let creds =
        lettre::transport::smtp::authentication::Credentials::new(smtp_username, smtp_password);
    let mailer = SmtpTransport::relay(&smtp_server)?
        .credentials(creds)
        .build();

    Ok(Arc::new(mailer))
}

fn get_from() -> Mailbox {
    let name = env::var("AXUM_MAIL_FROM_NAME").unwrap_or_else(|_| "Default Name".to_string());
    let email = env::var("AXUM_MAIL_FROM_EMAIL")
        .expect("Environment variable 'AXUM_MAIL_FROM_EMAIL' is not set. Check your '.env' file.");
    Mailbox::new(
        Some(name),
        email
            .parse()
            .expect("Invalid email format for AXUM_MAIL_FROM_EMAIL"),
    )
}

pub fn send(
    mailer: Arc<SmtpTransport>,
    email: &str,
    subject: &str,
    body: &str,
) -> Result<Response, Box<dyn std::error::Error>> {
    let to = Mailbox::new(subject.to_owned().into(), email.parse().unwrap());
    let from = get_from();

    let email = Message::builder()
        .from(from)
        .to(to)
        .subject(subject)
        .header(ContentType::TEXT_PLAIN)
        .body(String::from(body))
        .unwrap();

    // Send the email
    Ok(mailer.send(&email)?)
}

// test

#[cfg(test)]
mod tests {

    use dotenvy::dotenv;

    use super::*;

    fn mock_address() -> String {
        // This function returns a mock email address for testing purposes.
        // In a real application, you would use a valid email address.
        let address = env::var("AXUM_MOCK_EMAIL").unwrap_or("test@example.com".to_string());
        println!("Using mock email address: {}", address);
        address
    }

    #[test]
    #[ignore = "外部サービスにメール送信するため通常はスキップ"]
    // Ignore this test by default
    // #[serial] // Uncomment if using serial testing
    // TODO: 将来的にxtaskへ移行
    /// This test sends a one-shot email using the configured SMTP server.
    /// It requires the environment variables to be set up correctly.
    /// To run this test, set the environment variables in your `.env` file.
    fn one_shot() {
        dotenv().ok();

        let from = get_from();

        let email = Message::builder()
            .from(from)
            .to(Mailbox::new(None, mock_address().parse().unwrap()))
            .subject("Happy new year")
            .header(ContentType::TEXT_PLAIN)
            .body(String::from("Be happy!"))
            .unwrap();

        let mailer = setup_mailer().expect("Failed to set up mailer");

        // Send the email
        match mailer.send(&email) {
            Ok(_) => println!("Email sent successfully!"),
            Err(e) => panic!("Could not send email: {e:?}"),
        }
    }
}
