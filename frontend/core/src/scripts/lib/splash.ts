type SplashVariant = "initial" | "loading";

type SplashOptions = {
  variant?: SplashVariant;
  message?: string;
};

const SPLASH_TEMPLATE_ID = "decopon-splash-template";

const MARKUP_TEMPLATE = /* html */ `
  <div class="decopon-splash-root">
    <div class="decopon-splash-card">
      <img
        src="/images/decopon-plain.svg"
        alt="Decopon logo"
        class="decopon-splash-logo"
        width="160"
        height="160"
      />
      <div class="decopon-splash-spinner" aria-hidden="true"></div>
      <p class="decopon-splash-message"></p>
    </div>
  </div>
  <style id="${SPLASH_TEMPLATE_ID}">
    .decopon-splash-root {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-muted, #F8FAFC);
      color: var(--text-body, #0f172a);
      z-index: 9999;
      pointer-events: none;
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    }

    .decopon-splash-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 48px 40px;
      border-radius: 24px;
      background: color-mix(in srgb, var(--surface-base, #ffffff) 90%, transparent);
      box-shadow: 0 24px 80px color-mix(in srgb, var(--text-strong, #0f172a) 15%, transparent);
      backdrop-filter: blur(18px);
    }

    .decopon-splash-logo {
      width: 120px;
      height: 120px;
      object-fit: contain;
      filter: drop-shadow(0 8px 20px color-mix(in srgb, var(--text-strong, #0f172a) 18%, transparent));
    }

    .decopon-splash-spinner {
      width: 56px;
      height: 56px;
      border-radius: 9999px;
      border: 6px solid color-mix(in srgb, var(--text-body, #0f172a) 8%, transparent);
      border-top-color: var(--primary, #FACC15);
      animation: decopon-splash-spin 1s linear infinite;
    }

    .decopon-splash-message {
      margin: 0;
      font-size: 15px;
      color: color-mix(in srgb, var(--text-body, #0f172a) 75%, transparent);
      text-align: center;
      line-height: 1.5;
      max-width: 280px;
    }

    @keyframes decopon-splash-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  </style>
`;

const ensureTemplateStyles = (documentRef: Document) => {
  if (!documentRef.getElementById(SPLASH_TEMPLATE_ID)) {
    const template = documentRef.createElement("div");
    template.innerHTML = MARKUP_TEMPLATE;
    const style = template.querySelector("style");
    if (style) {
      documentRef.head.appendChild(style);
    }
  }
};

export const renderSplash = (
  root: HTMLElement,
  { variant = "initial", message }: SplashOptions = {},
) => {
  const doc = root.ownerDocument ?? document;
  ensureTemplateStyles(doc);

  const container = doc.createElement("div");
  container.innerHTML = MARKUP_TEMPLATE;
  const splashRoot = container.querySelector(".decopon-splash-root");
  const spinner = container.querySelector<HTMLElement>(".decopon-splash-spinner");
  const text = container.querySelector<HTMLElement>(".decopon-splash-message");

  if (variant === "initial") {
    if (spinner) {
      spinner.style.display = "none";
    }
    if (text) {
      text.textContent = "";
      text.style.display = "none";
    }
  } else {
    if (spinner) {
      spinner.style.display = "block";
    }
    if (text) {
      text.style.display = "block";
      text.textContent =
        message ?? "バックエンドの初期化を待機しています。しばらくお待ちください…";
    }
  }

  root.innerHTML = "";
  if (splashRoot) {
    root.appendChild(splashRoot);
  }
};
