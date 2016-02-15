var i18n = require('i18next/lib');
var XHR = require('i18next-xhr-backend/lib');

i18n
  .use(XHR)
  .init({
    fallbackLng : 'de',
    lng : 'de-DE',

    // have a common namespace used around the full app
    ns : ['common'],
    defaultNS : 'common',

    debug : true,

    interpolation : {
      escapeValue : false // not needed for react!!
    }
  });

module.exports = i18n;