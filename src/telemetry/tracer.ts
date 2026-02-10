import { trace } from '@opentelemetry/api';

// These will be replaced at build time
declare const __PKG_NAME__: string;
declare const __PKG_VERSION__: string;

export const tracer = trace.getTracer(__PKG_NAME__, __PKG_VERSION__);
