import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsdom environment (required by Firebase/undici)
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Polyfill ReadableStream for jsdom environment (required by Firebase/undici)
import { ReadableStream } from 'stream/web';
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream as any;
}
