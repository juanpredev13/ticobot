# Guía de Validación Pre-Deploy

## 🚀 Validación Rápida

**Antes de hacer push a main:**

```bash
pnpm validate
```

Esto ejecuta:
1. ✅ Lint (ESLint)
2. ✅ Type check (TypeScript)
3. ✅ Build check (compilación completa)

## 📋 Scripts Disponibles

### Validación Completa
```bash
# Opción 1: Script pnpm (rápido)
pnpm validate

# Opción 2: Script bash (más detallado)
./scripts/validate-build.sh
```

### Validación Individual
```bash
pnpm lint           # Solo linting
pnpm type-check     # Solo type checking
pnpm build:check    # Solo build (shared → backend → frontend)
```

## 🔍 Qué Revisa

### 1. Encoding UTF-8
- Busca caracteres inválidos (`�`)
- Archivos: `*.ts`, `*.tsx`

### 2. ESLint
- Reglas de código
- Imports no usados
- Errores de sintaxis

### 3. TypeScript
- Errores de tipos
- Referencias de módulos
- Tipos faltantes

### 4. Build
- Compilación de shared
- Compilación de backend
- Compilación de frontend
- Orden correcto de dependencias

### 5. Tests (opcional)
- Unit tests
- Integration tests

## ⚡ CI/CD Automático

### GitHub Actions
El workflow `.github/workflows/validate.yml` se ejecuta automáticamente en:
- ✅ Push a `main`
- ✅ Pull requests

**Checks incluidos:**
1. Lint
2. Type check
3. Build
4. Tests

### Railway Deployment
Build automático cuando se hace push a `main`:
1. Install dependencies
2. Build shared
3. Build backend
4. Start server

## 🐛 Solución de Problemas

### Error: Cannot find module '@ticobot/shared'
```bash
# Solución: Construir shared primero
pnpm --filter @ticobot/shared build
pnpm --filter @ticobot/backend build
```

### Error: UTF-8 encoding issues
```bash
# Buscar archivos con problemas
find backend/src -type f -name "*.ts" -exec grep -l "[�]" {} \;

# Abrir archivo y reemplazar caracteres inválidos
```

### Error: Type checking failed
```bash
# Ver errores específicos
pnpm --filter @ticobot/backend type-check
pnpm --filter @ticobot/frontend type-check
```

## 📝 Workflow Recomendado

1. **Hacer cambios**
   ```bash
   # ... editar código ...
   ```

2. **Validar localmente**
   ```bash
   pnpm validate
   ```

3. **Commit y push**
   ```bash
   git add .
   git commit -m "feat: descripción"
   git push origin main
   ```

4. **Verificar CI/CD**
   - GitHub Actions: Ver checks en el PR
   - Railway: Ver deployment logs

## 🎯 Best Practices

### Antes de cada commit
```bash
pnpm lint           # Arreglar errores de estilo
pnpm type-check     # Arreglar errores de tipos
```

### Antes de push a main
```bash
pnpm validate       # Validación completa
```

### Antes de crear PR
```bash
./scripts/validate-build.sh  # Validación exhaustiva
```

## 🔧 Configuración

### Agregar hook pre-push (opcional)
```bash
# Instalar husky
pnpm add -D husky

# Inicializar
npx husky init

# Crear hook pre-push
echo "pnpm validate" > .husky/pre-push
chmod +x .husky/pre-push
```

Esto ejecutará `pnpm validate` automáticamente antes de cada push.

## 📊 Métricas de Calidad

- **Lint:** 0 errores
- **Type errors:** 0 errores
- **Build:** Exitoso
- **Tests:** > 80% coverage
- **UTF-8:** 100% válido

## 🆘 Soporte

Si encuentras errores que no puedes resolver:
1. Revisa la documentación en `/docs`
2. Busca en issues de GitHub
3. Crea un nuevo issue con los detalles del error
