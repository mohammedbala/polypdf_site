import { TextDecoder, TextEncoder } from 'util';

// React Router 7 targets Node 20+ and uses the standard encoding globals. Jest 27's jsdom
// environment does not expose them even though the Node process does, so make the browser-standard
// implementations available before test modules load.
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
