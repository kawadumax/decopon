import nProgress from "nprogress";

export class NProgressManager {
  private static instance: NProgressManager;
  private activeRequests = 0;

  private constructor() {
    // Subscribe to events for progress bar
    nProgress.configure({ showSpinner: false });
  }

  public static getInstance(): NProgressManager {
    if (!NProgressManager.instance) {
      NProgressManager.instance = new NProgressManager();
    }
    return NProgressManager.instance;
  }

  incrementRequests(): void {
    if (this.activeRequests === 0) {
      nProgress.start();
    }
    this.activeRequests++;
  }

  decrementRequests(): void {
    this.activeRequests--;
    if (this.activeRequests === 0) {
      nProgress.done();
    }
  }
}
