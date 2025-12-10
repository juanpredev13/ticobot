# Resetear Límites de Preguntas en Desarrollo

Este documento explica cómo resetear o aumentar los límites de preguntas en desarrollo.

## Cambios Automáticos en Desarrollo

Los límites se aumentan automáticamente cuando estás en modo desarrollo:

- **Frontend**: Límites aumentados a 9999 preguntas (en lugar de 3 anónimas y 13 autenticadas)
- **Backend**: Límites aumentados a 9999 preguntas para usuarios free/premium (en lugar de 10/100)

Esto solo funciona cuando:
- `NODE_ENV=development` en el backend
- Estás en `localhost` en el frontend

## Resetear Contadores Manualmente

### Opción 1: Desde la Consola del Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Resetear solo el contador del frontend (localStorage)
import { resetUsageForTesting } from '@/lib/usage-tracker';
resetUsageForTesting();

// O resetear todo (frontend + backend si estás autenticado)
import { resetAllUsageCounters } from '@/lib/usage-tracker';
await resetAllUsageCounters();
```

### Opción 2: Desde el Código

```typescript
import { resetAllUsageCounters } from '@/lib/usage-tracker';

// En un componente o función
await resetAllUsageCounters();
```

### Opción 3: Limpiar localStorage Manualmente

Abre la consola del navegador y ejecuta:

```javascript
localStorage.removeItem("ticobot_anon_chats");
localStorage.removeItem("ticobot_auth_chats");
location.reload(); // Recargar la página
```

### Opción 4: Resetear Backend (Solo Desarrollo)

Si estás autenticado, puedes resetear el contador del backend:

```javascript
import { resetBackendQueryCount } from '@/lib/usage-tracker';
await resetBackendQueryCount();
```

O hacer una petición directa:

```javascript
const token = localStorage.getItem('accessToken');
await fetch('http://localhost:3001/api/auth/reset-query-count', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Verificar Límites Actuales

Para ver tus límites actuales, abre la consola y ejecuta:

```javascript
import { getUsageStatus } from '@/lib/usage-tracker';

// Para usuarios anónimos
const status = getUsageStatus(false);
console.log('Anónimo:', status);

// Para usuarios autenticados
const statusAuth = getUsageStatus(true);
console.log('Autenticado:', statusAuth);
```

## Notas

- Los límites aumentados solo funcionan en desarrollo
- En producción, los límites normales se aplican (3 anónimas, 13 autenticadas, 10 free, 100 premium)
- El contador del backend se resetea automáticamente a medianoche UTC
- El endpoint de reset del backend solo está disponible en desarrollo por seguridad


