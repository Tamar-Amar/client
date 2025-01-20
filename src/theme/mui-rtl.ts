import createCache from '@emotion/cache';
import stylisRTLPlugin from 'stylis-plugin-rtl';

// יצירת Cache עבור RTL
const rtlCache = createCache({
  key: 'mui-rtl',
  stylisPlugins: [stylisRTLPlugin], // תמיכה ב-RTL
});

export default rtlCache;
