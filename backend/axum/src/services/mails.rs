use lettre::message::{Mailbox, header::ContentType};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

pub fn setup_mailer() {
    // This function would typically set up the mailer configuration.
    // For now, we will just print a message indicating that the mailer is set up.
    println!("Mailer setup complete.");
}

pub fn send(email: &str, subject: &str, body: &str) -> Result<(), String> {
    // Here you would implement the actual email sending logic.
    // For now, we will just simulate a successful send.

    println!("Sending email to: {}", email);
    println!("Subject: {}", subject);
    println!("Body: {}", body);

    // Simulate success
    Ok(())
}

// サンプルコード

// let email = Message::builder()
//     .from(Mailbox::new("NoBody".to_owned(), "nobody@domain.tld".parse().unwrap()))
//     .reply_to(Mailbox::new("Yuin".to_owned(), "yuin@domain.tld".parse().unwrap()))
//     .to(Mailbox::new("Hei".to_owned(), "hei@domain.tld".parse().unwrap()))
//     .subject("Happy new year")
//     .header(ContentType::TEXT_PLAIN)
//     .body(String::from("Be happy!"))
//     .unwrap();

// let creds = Credentials::new("smtp_username".to_owned(), "smtp_password".to_owned());

// // Open a remote connection to gmail
// let mailer = SmtpTransport::relay("smtp.gmail.com")
//     .unwrap()
//     .credentials(creds)
//     .build();

// // Send the email
// match mailer.send(&email) {
//     Ok(_) => println!("Email sent successfully!"),
//     Err(e) => panic!("Could not send email: {e:?}"),
// }

// test

#[cfg(test)]
mod tests {
    use std::env;

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
    fn test_send_email() {
        let email = "test@example.com"; // Replace with a valid email for testing
        let subject = "Test Subject"; // Replace with a valid subject for testing     
        let body = "Test Body"; // Replace with a valid body for testing
        assert!(send(email, subject, body).is_ok());
    }

    #[test]
    fn one_shot() {
        dotenv().ok();
        let from_email = env::var("AXUM_MAIL_FROM_EMAIL").unwrap();
        println!("From email: {}", from_email);

        let email = Message::builder()
            .from(Mailbox::new(
                env::var("AXUM_MAIL_FROM_NAME").ok(),
                from_email.parse().unwrap(),
            ))
            // .reply_to(Mailbox::new(
            //     "Yuin".to_owned(),
            //     "yuin@domain.tld".parse().unwrap(),
            // ))
            .to(Mailbox::new(None, mock_address().parse().unwrap()))
            .subject("Happy new year")
            .header(ContentType::TEXT_PLAIN)
            .body(String::from("Be happy!"))
            .unwrap();

        let username = env::var("AXUM_SMTP_USERNAME").unwrap_or("CENSORED".to_string());
        let password = env::var("AXUM_SMTP_PASSWORD").unwrap_or("CENSORED".to_string());
        let creds = Credentials::new(username, password);

        let domain = env::var("AXUM_SMTP_SERVER").unwrap_or("CENSORED".to_string());
        // Open a remote connection to gmail
        let mailer = SmtpTransport::relay(&domain)
            .unwrap()
            .credentials(creds)
            .build();

        // Send the email
        match mailer.send(&email) {
            Ok(_) => println!("Email sent successfully!"),
            Err(e) => panic!("Could not send email: {e:?}"),
        }
    }
}
