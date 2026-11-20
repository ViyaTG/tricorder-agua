# Tricorder Agua

Sitio comercial y panel de auditoría del prototipo descrito en `proyecto.md`. El sitio usa HTML, CSS y JavaScript y funciona sin instalar dependencias.

## Vista local

Abre `docs/index.html` en el navegador. Puedes filtrar y exportar las muestras de demostración o importar un CSV del equipo. La consulta automática de un archivo publicado requiere servir la página por HTTP o HTTPS.

## Publicación en GitHub Pages

1. Sube el contenido de la carpeta `docs/` a la raíz de la rama `main` del repositorio web.
2. En **Settings → Pages**, selecciona **Deploy from a branch** y elige `main` y `/ (root)` como origen.
3. Abre la URL que aparece en **Settings → Pages** al finalizar el despliegue.

[Documentación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Consultar y compartir datos

1. Conéctate al Wi-Fi `Tricorder-Agua` y abre `http://192.168.4.1/csv` para descargar `muestras.csv`.
2. Para revisarlo en privado, selecciónalo con **Importar CSV**. El navegador procesa el archivo localmente.
3. Para compartir un historial público, publica una copia autorizada como `muestras.csv` en la misma carpeta de `index.html`. El panel la detecta al cargar y la muestra como **Datos publicados**. Actualiza el archivo en GitHub cada vez que quieras compartir una captura nueva.

Toda persona con acceso al sitio puede leer y descargar el CSV publicado. El firmware guarda las muestras en LittleFS y la publicación se hace de forma manual. La temperatura se expresa en °C y se muestra como **Sin dato** si el sensor falló. El pH y la turbidez conservan sus valores ADC sin convertir.
