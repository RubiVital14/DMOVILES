import { Platform } from 'react-native';

const ANDROID_EMULATOR = 'http://10.0.2.2:8001';
const IOS_SIMULATOR = 'http://127.0.0.1:8001';

// Si fuera celular físico, ahí sí usarías tu IP real: http://192.168.x.x:8001
// const PHYSICAL = 'http://192.168.100.6:8001';

export const API_BASE_URL = Platform.OS === 'android' ? ANDROID_EMULATOR : IOS_SIMULATOR;