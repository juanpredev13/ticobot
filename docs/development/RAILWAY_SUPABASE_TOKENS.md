# Configuración de API Keys de Supabase en Railway

> Referencia: [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)

## Problema Común: Error 502 por Tokens Inválidos

Si el backend está fallando al iniciar y recibes errores 502, puede ser porque los tokens de Supabase están en formato incorrecto o son tokens locales en lugar de tokens de producción.

## Tipos de API Keys en Supabase

Según la [documentación oficial de Supabase](https://supabase.com/docs/guides/api/api-keys):

1. **`anon` / `public` key**: 
   - ✅ Segura para usar en el frontend (cliente)
   - ✅ Respeta las políticas RLS (Row Level Security)
   - ✅ Permisos limitados según las políticas configuradas

2. **`service_role` / `secret` key**:
   - ⚠️ **SOLO para backend/servidor**
   - ⚠️ **NUNCA exponer en el frontend**
   - ⚠️ Bypassa todas las políticas RLS
   - ⚠️ Tiene permisos completos en la base de datos

## Formato de Tokens

### ❌ Formato Local (Incorrecto para Producción)
```
SUPABASE_ANON_KEY="sb_publishable_7lv0-sbwV3oerw3QmaIMeg_ds933vt-"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_TY6U8Yyj1QH_go_NELHW4g_2qkfKovD"
```

Estos tokens son para **Supabase local** (cuando corres `supabase start` localmente). No funcionan con proyectos de producción en Supabase Cloud.

### ✅ Formato de Producción (Correcto)
```
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6a2ttd290YnJtZnVmY21wb3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6a2ttd290YnJtZnVmY21wb3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ..."
```

Los tokens de producción son **JWT largos** que empiezan con `eyJ...` (JSON Web Tokens).

## Cómo Obtener los Tokens Correctos

Según la [documentación oficial](https://supabase.com/docs/guides/api/api-keys):

1. **Ve a tu proyecto en Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecciona tu proyecto** (el que corresponde a tu `SUPABASE_URL`, ej: `https://xzkkmwotbrmfufcmpopj.supabase.co`)
3. **Ve a Settings → API** (o Project Settings → API)
4. **En la sección "Project API keys"**, encontrarás:
   - **`anon` `public`** → Este es tu `SUPABASE_ANON_KEY` (para frontend)
   - **`service_role` `secret`** → Este es tu `SUPABASE_SERVICE_ROLE_KEY` (solo backend)

## Verificar que los Tokens Son Correctos

Los tokens de producción:
- ✅ Son JWT largos (cientos de caracteres)
- ✅ Empiezan con `eyJ...`
- ✅ Tienen 3 partes separadas por puntos (header.payload.signature)

Los tokens locales:
- ❌ Son cortos (20-50 caracteres)
- ❌ Empiezan con `sb_publishable_` o `sb_secret_`
- ❌ Solo tienen una parte

## Configurar en Railway

1. **Backend Service → Variables**
2. **Actualiza**:
   ```
   SUPABASE_ANON_KEY=<token-largo-que-empieza-con-eyJ>
   SUPABASE_SERVICE_ROLE_KEY=<token-largo-que-empieza-con-eyJ>
   ```
3. **Redeploy** el backend

## Verificar que Funciona

Después de actualizar los tokens, verifica:

1. **Backend está corriendo**: `https://ticobotbackend-production.up.railway.app/health`
2. **No hay errores en los logs** del backend en Railway
3. **El frontend puede conectarse** sin errores 502

## Nota de Seguridad

⚠️ **CRÍTICO**: Según la [documentación de Supabase](https://supabase.com/docs/guides/api/api-keys):

- **`SUPABASE_SERVICE_ROLE_KEY`**: 
  - ⚠️ **NUNCA** exponer en el frontend
  - ⚠️ **NUNCA** compartir públicamente
  - ⚠️ Solo usar en el backend/servidor
  - ⚠️ Bypassa todas las políticas RLS
  - ⚠️ Tiene permisos completos en la base de datos

- **`SUPABASE_ANON_KEY`**:
  - ✅ Segura para usar en el frontend
  - ✅ Respeta las políticas RLS
  - ⚠️ Aún así, no compartir públicamente si no es necesario

## Referencias

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

