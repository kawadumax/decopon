import "@decopon/core/styles/app.css";
import {
  bootstrap,
  configureApiClient,
  createWebApiHooks,
} from "@decopon/core";

configureApiClient(createWebApiHooks());
bootstrap();
