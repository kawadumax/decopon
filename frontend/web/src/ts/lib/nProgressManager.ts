import nProgress from "nprogress";

export class NProgressManager {
  private activeRequests = 0;

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
