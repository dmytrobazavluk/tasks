// Persistence layer factory
// Switch between implementations via a simple configuration

import { localStoragePersistence } from './localStorage';
import { memoryPersistence } from './memory';

// Global config object to switch implementations
// Usage: window.__APP_CONFIG__ = { persistence: 'memory' };
// Default: 'localStorage'
const getConfig = () => {
  if (typeof window !== 'undefined' && window.__APP_CONFIG__) {
    return window.__APP_CONFIG__;
  }
  return {};
};

const getPersistence = () => {
  const config = getConfig();
  const type = config.persistence || 'localStorage';

  if (type === 'memory') {
    return memoryPersistence;
  }
  return localStoragePersistence;
};

export const persistence = getPersistence();

export { localStoragePersistence, memoryPersistence };
