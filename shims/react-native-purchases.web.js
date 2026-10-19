const emptyInfo = () => ({ entitlements: { active: {} } });

const Purchases = {
  configure: async () => {},
  setLogLevel: () => {},
  logIn: async () => ({ customerInfo: emptyInfo() }),
  logOut: async () => emptyInfo(),
  getOfferings: async () => ({ current: null, all: {} }),
  getCustomerInfo: async () => emptyInfo(),
  purchasePackage: async () => {
    throw new Error('Satın alma yalnızca iOS ve Android geliştirme derlemesinde çalışır.');
  },
  restorePurchases: async () => emptyInfo(),
};

module.exports = Purchases;
module.exports.default = Purchases;
module.exports.LOG_LEVEL = { DEBUG: 'DEBUG', INFO: 'INFO' };
