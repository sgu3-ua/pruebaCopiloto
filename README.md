# Pong Game - Modo Multijugador en Línea

Un juego clásico de Pong con múltiples modos de juego, incluyendo multijugador en línea.

## 🎮 Modos de Juego

### 1. 1 Jugador (vs IA)
- Juega contra una IA imperfecta que puede fallar
- La dificultad aumenta progresivamente tras cada gol
- La velocidad de la pelota y las palas se incrementa

### 2. 2 Jugadores (Local)
- Modo multijugador local en el mismo dispositivo
- Jugador izquierdo: W/S
- Jugador derecho: Flechas arriba/abajo

### 3. Multijugador en Línea
- Crea una partida y comparte el código de sesión (6 caracteres)
- Otro jugador puede unirse introduciendo el código
- Juego en tiempo real usando tecnología P2P (WebRTC)
- No requiere servidor backend

## 🕹️ Controles

- **Jugador Izquierdo (Pala Cyan)**: W (arriba) / S (abajo)
- **Jugador Derecho (Pala Roja)**: ↑ (arriba) / ↓ (abajo)
- **Controles Táctiles**: Disponibles en dispositivos móviles

## 🚀 Características

- ✨ Interfaz moderna con efectos de neón
- 📱 Diseño responsive para móviles
- 🌐 Multijugador en línea sin servidor
- 🤖 IA realista e imperfecta
- 📈 Dificultad progresiva en modo IA
- 🎯 Sistema de puntuación en tiempo real

## 💻 Tecnologías

- HTML5 Canvas para renderizado
- JavaScript vanilla (sin frameworks)
- PeerJS para conexiones P2P
- CSS3 para estilos modernos

## 🌍 Despliegue

Este juego está diseñado para funcionar en GitHub Pages y no requiere backend.

### Para jugarlo:
1. Abre el archivo `index.html` en tu navegador
2. Selecciona un modo de juego
3. ¡Disfruta!

### Para multijugador en línea:
1. Un jugador selecciona "Multijugador en Línea (Crear Partida)"
2. Comparte el código de 6 caracteres con su oponente
3. El oponente selecciona "Unirse a Partida" e introduce el código
4. ¡A jugar!

## 📝 Notas Técnicas

- El multijugador en línea usa PeerJS con un servidor de señalización gratuito
- El host controla la física del juego y sincroniza el estado con el invitado
- Las conexiones son P2P (peer-to-peer) para baja latencia
- Funciona completamente del lado del cliente

## 🎨 Créditos

Juego Pong clásico mejorado con características modernas.
