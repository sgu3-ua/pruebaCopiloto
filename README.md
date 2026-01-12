# Juegos Clásicos - Colección de Juegos Retro

Una colección de juegos clásicos implementados con HTML5, CSS3 y JavaScript vanilla.

## 🎮 Juegos Disponibles

### 1. PONG
- 1 Jugador (vs IA con dificultad progresiva)
- 2 Jugadores (Local)
- Multijugador en Línea (P2P con WebRTC)
- Controles: W/S y Flechas o controles táctiles

### 2. BREAKOUT (Rompebloques)
- Configuración personalizable: filas, columnas, velocidad, tamaño de pala
- Sistema de puntuación y vidas
- Diferentes colores de bloques
- Controles: Flechas o A/D, controles táctiles

### 3. BUSCAMINAS
- Múltiples niveles de dificultad (Fácil, Medio, Difícil)
- Modo personalizado con configuración manual
- Sistema de banderas (clic derecho)
- Temporizador y contador de minas

### 4. SNAKE
- Velocidad ajustable (Lento, Normal, Rápido, Muy Rápido)
- Tamaño de tablero configurable
- Modo con/sin muros
- Controles: Flechas o WASD, controles táctiles

## 📁 Estructura del Proyecto

```
pruebaCopiloto/
├── index.html              # Menú principal de selección de juegos
├── shared/
│   └── main-styles.css    # Estilos compartidos del menú principal
└── games/
    ├── pong/              # Juego Pong
    ├── breakout/          # Juego Breakout
    ├── minesweeper/       # Juego Buscaminas
    └── snake/             # Juego Snake
```

Cada juego tiene su propia carpeta con:
- `index.html` - Interfaz del juego
- `game.js` - Lógica del juego
- `style.css` - Estilos del juego

## 🚀 Características Generales

- ✨ Interfaz moderna con efectos de neón
- 📱 Diseño responsive para móviles y tablets
- 🎮 Controles táctiles para dispositivos móviles
- ⚙️ Configuraciones personalizables en cada juego
- 🎨 Estilos únicos para cada juego
- 🌐 Sin dependencias externas (excepto PeerJS para Pong online)
- 💾 No requiere servidor backend

## 💻 Tecnologías

- HTML5 Canvas para renderizado
- JavaScript vanilla (sin frameworks)
- PeerJS para conexiones P2P
- CSS3 para estilos modernos

## 🌍 Despliegue

Este juego está diseñado para funcionar en GitHub Pages y no requiere backend.

### Para jugarlo:
1. Abre el archivo `index.html` en tu navegador
2. Selecciona un juego del menú principal
3. Configura las opciones del juego (si deseas)
4. ¡Disfruta jugando!

## 📝 Notas Técnicas

- Todos los juegos usan HTML5 Canvas para renderizado
- JavaScript vanilla sin frameworks
- Arquitectura modular con separación de responsabilidades
- Cada juego es independiente y configurable
- El multijugador en línea de Pong usa PeerJS con WebRTC (P2P)

## 🎨 Créditos

Colección de juegos clásicos reimplementados con tecnologías web modernas.
