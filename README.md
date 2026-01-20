# 🎿 SnowTricky

Un jeu de course de snowboard multijoueur en 3D, développé avec Three.js et Socket.IO.

![SnowTricky](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

## 🎮 Gameplay

- **Objectif** : Arriver premier dans une course de snowboard d'environ 2 minutes
- **4 à 6 joueurs** peuvent participer simultanément
- **Esquivez les arbres** sur la piste pour ne pas perdre de vitesse
- **Récupérez les boosts** (orange) pour accélérer temporairement
- **Utilisez les rampes** pour sauter et faire des figures
- **Figures en l'air** : Appuyez sur F pendant un saut pour faire un trick et obtenir un boost à l'atterrissage !

## 🎯 Contrôles

| Touche | Action |
|--------|--------|
| ← / A | Aller à gauche |
| → / D | Aller à droite |
| ESPACE | Sauter |
| F | Faire une figure (en l'air uniquement) |

## 🚀 Installation

### Option 1 : Mode développement

```bash
# Installer les dépendances
npm install

# Lancer le jeu
npm run dev
```

- Client : http://localhost:5173
- Serveur : http://localhost:3000

### Option 2 : Docker 🐳

```bash
# Build de l'image
docker build -t snowtricky .

# Lancer le conteneur
docker run -p 3000:3000 snowtricky
```

Le jeu est accessible sur http://localhost:3000

## 🌐 Jouer en multijoueur local

1. Lancez le serveur sur votre machine
2. Partagez votre IP locale avec vos amis (ex: `192.168.1.X:5173`)
3. Jusqu'à 6 joueurs peuvent rejoindre le lobby
4. Chaque joueur entre son nom et clique sur "Prêt"
5. La course démarre quand tous les joueurs sont prêts !

## 🏆 Classement

- À la fin de la course, un **Top 3** est affiché avec les temps
- Le classement complet montre tous les joueurs

## 📁 Structure du projet

```
snowtricky/
├── client/
│   ├── game/
│   │   ├── Game.js         # Moteur principal
│   │   ├── Player.js       # Contrôles du joueur
│   │   ├── Track.js        # Piste et obstacles
│   │   ├── OtherPlayer.js  # Autres joueurs
│   │   └── SnowParticles.js # Effets de neige
│   ├── network/
│   │   └── NetworkManager.js
│   ├── ui/
│   │   └── UIManager.js
│   ├── index.html
│   ├── styles.css
│   └── main.js
├── server/
│   ├── index.js           # Serveur Express + Socket.IO
│   └── GameManager.js     # Logique de jeu
├── package.json
├── vite.config.js
└── README.md
```

## 🛠️ Technologies utilisées

- **Three.js** - Rendu 3D WebGL
- **Socket.IO** - Communication temps réel
- **Express** - Serveur HTTP
- **Vite** - Bundler moderne
- **Node.js** - Runtime serveur

## 📝 Licence

MIT - Fait avec ❄️ et ☕

---

**Bon ride ! 🏔️🎿**
