type SplashVariant = "initial" | "loading";

type SplashOptions = {
  variant?: SplashVariant;
  message?: string;
};

const PRIMARY_YELLOW = "#FACC15";
const BACKGROUND_COLOR = "#F8FAFC"; // slate-50
const CARD_BACKGROUND = "rgba(248, 250, 252, 0.9)";

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
      background: ${BACKGROUND_COLOR};
      color: #0f172a;
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
      background: ${CARD_BACKGROUND};
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.15);
      backdrop-filter: blur(18px);
    }

    .decopon-splash-logo {
      width: 120px;
      height: 120px;
      object-fit: contain;
      filter: drop-shadow(0 8px 20px rgba(15, 23, 42, 0.18));
    }

    .decopon-splash-spinner {
      width: 56px;
      height: 56px;
      border-radius: 9999px;
      border: 6px solid rgba(15, 23, 42, 0.08);
      border-top-color: ${PRIMARY_YELLOW};
      animation: decopon-splash-spin 1s linear infinite;
    }

    .decopon-splash-message {
      margin: 0;
      font-size: 15px;
      color: rgba(15, 23, 42, 0.75);
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
