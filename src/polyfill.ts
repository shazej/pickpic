
// Polyfill SlowBuffer for Node 25+ compatibility with legacy libs (jwa, buffer-equal-constant-time)
import { Buffer } from 'buffer';

if (typeof global !== 'undefined' && !(global as any).SlowBuffer) {
    (global as any).SlowBuffer = Buffer;
}
