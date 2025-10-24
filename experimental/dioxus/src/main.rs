use dioxus::prelude::*;
use dioxus_desktop::{Config, launch::launch};
use std::any::Any;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn main() {
    // Enable tracing output; respects RUST_LOG if it is set.
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    launch(
        app,
        Vec::<Box<dyn Fn() -> Box<dyn Any>>>::new(),
        Config::default(),
    );
}

fn app() -> Element {
    let mut count = use_signal(|| 0);

    rsx! {
        main { class: "container",
            h1 { "Decopon Dioxus Prototype" }
            p { "This experimental shell explores a future Dioxus-based UI." }
            section { class: "card",
                p { "Counter value: {count}" }
                div { class: "controls",
                    button { onclick: move |_| count += 1, "Increment" }
                    button { onclick: move |_| count -= 1, "Decrement" }
                }
            }
            footer {
                p { "Try editing `experimental/dioxus/src/main.rs` and observe live reloads (cargo watch + dioxus hot reloading recommended)." }
            }
        }
    }
}
