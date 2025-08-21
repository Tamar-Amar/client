import createCache from '@emotion/cache';
import stylisRTLPlugin from 'stylis-plugin-rtl';

const rtlCache = createCache({
  key: 'mui-rtl',
  stylisPlugins: [stylisRTLPlugin], // תמיכה ב-RTL
});

export default rtlCache;
