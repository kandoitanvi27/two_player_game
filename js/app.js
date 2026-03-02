/* ============================================
   APP.JS — SPA Router & Lobby Controller
   ============================================ */

const App = (() => {
    // Game registry
    const GAMES = [
        {
            id: 'tic-tac-toe',
            title: 'Tic Tac Toe',
            emoji: '❌⭕',
            image: 'assets/images/tic-tac-toe.png',
            desc: 'Classic 3×3 grid — get three in a row to win!',
            tags: ['Quick', '3×3 Grid'],
            module: () => TicTacToe,
            rules: `
                <h3>Objective</h3>
                <ul>
                    <li>Get three of your marks (X or O) in a horizontal, vertical, or diagonal row.</li>
                </ul>
                <h3>How to Play</h3>
                <ul>
                    <li>Player 1 is X (cyan), Player 2 is O (pink).</li>
                    <li>Take turns clicking an empty cell to place your mark.</li>
                    <li>First to get three in a row wins!</li>
                    <li>If all cells are filled with no winner, it's a draw.</li>
                </ul>
            `
        },
        {
            id: 'connect-four',
            title: 'Connect Four',
            emoji: '🔴🟡',
            image: 'assets/images/connect-four.png',
            desc: 'Drop discs into the grid — connect four in a row to win!',
            tags: ['Strategy', '7×6 Grid'],
            module: () => ConnectFour,
            rules: `
                <h3>Objective</h3>
                <ul>
                    <li>Connect four of your discs in a row — horizontally, vertically, or diagonally.</li>
                </ul>
                <h3>How to Play</h3>
                <ul>
                    <li>Player 1 is cyan, Player 2 is pink.</li>
                    <li>Click a column to drop your disc to the lowest available row.</li>
                    <li>First to connect four consecutive discs wins!</li>
                    <li>If the board fills up, it's a draw.</li>
                </ul>
            `
        },
        {
            id: 'dots-boxes',
            title: 'Dots & Boxes',
            emoji: '🔵🟦',
            image: 'assets/images/dots-boxes.png',
            desc: 'Draw lines between dots — complete boxes to score points!',
            tags: ['Strategy', '5×5 Dots'],
            module: () => DotsBoxes,
            rules: `
                <h3>Objective</h3>
                <ul>
                    <li>Complete more boxes than your opponent by drawing lines between dots.</li>
                </ul>
                <h3>How to Play</h3>
                <ul>
                    <li>Click on the space between two adjacent dots to draw a line.</li>
                    <li>If you complete the fourth side of a box, you score a point and get an extra turn!</li>
                    <li>When all boxes are filled, the player with the most boxes wins.</li>
                </ul>
            `
        },
        {
            id: 'reversi',
            title: 'Othello',
            emoji: '⚫⚪',
            image: 'assets/images/reversi.png',
            desc: 'Flip your opponent\'s discs by flanking them!',
            tags: ['Classic', '8×8 Board'],
            module: () => Reversi,
            rules: `
                <h3>Objective</h3>
                <ul>
                    <li>Have the most discs of your color when the game ends.</li>
                </ul>
                <h3>How to Play</h3>
                <ul>
                    <li>Player 1 is Black, Player 2 is White.</li>
                    <li>Place a disc to flank opponent discs in any direction — flanked discs flip to your color.</li>
                    <li>Valid moves are highlighted. If you have no valid moves, your turn is skipped.</li>
                    <li>Game ends when neither player can move.</li>
                </ul>
            `
        },
        {
            id: 'checkers',
            title: 'Checkers',
            emoji: '🏁',
            image: 'assets/images/checkers.png',
            desc: 'Capture all your opponent\'s pieces to win!',
            tags: ['Classic', '8×8 Board'],
            module: () => Checkers,
            rules: `
                <h3>Objective</h3>
                <ul>
                    <li>Capture all opponent pieces or block all their moves.</li>
                </ul>
                <h3>How to Play</h3>
                <ul>
                    <li>Pieces move diagonally forward on dark squares.</li>
                    <li>Capture by jumping over an opponent's piece to an empty square beyond.</li>
                    <li>If a capture is available, you must take it.</li>
                    <li>Multi-jump: after a capture, if another capture is available, you must continue.</li>
                    <li>Pieces reaching the far row become Kings and can move backwards.</li>
                </ul>
            `
        },
        {
            id: 'battleship',
            title: 'Battleship',
            emoji: '🚢💥',
            image: 'assets/images/battleship.png',
            desc: 'Find and sink your opponent\'s hidden fleet!',
            tags: ['Guessing', '10×10 Grid'],
            module: () => Battleship,
            rules: `
                <h3>Objective</h3>
                <ul>
                    <li>Sink all 5 of your opponent's ships before they sink yours.</li>
                </ul>
                <h3>Setup</h3>
                <ul>
                    <li>Each player secretly places 5 ships on their grid.</li>
                    <li>Click to place, use the Rotate button to toggle orientation.</li>
                </ul>
                <h3>Battle</h3>
                <ul>
                    <li>Take turns clicking on the opponent's grid to fire a shot.</li>
                    <li>Hits are marked red (✕), misses are marked gray (•).</li>
                    <li>The game announces when a ship is sunk.</li>
                </ul>
            `
        }
    ];

    let currentGame = null;
    let currentGameId = null;

    function init() {
        window.addEventListener('hashchange', handleRoute);
        document.getElementById('rules-close-btn').addEventListener('click', hideRulesModal);
        document.getElementById('rules-modal').addEventListener('click', (e) => {
            if (e.target.id === 'rules-modal') hideRulesModal();
        });
        document.getElementById('result-modal').addEventListener('click', (e) => {
            if (e.target.id === 'result-modal') hideResultModal();
        });
        handleRoute();
    }

    function handleRoute() {
        const hash = window.location.hash || '#/';
        const route = hash.replace('#/', '').replace('/', '');

        if (!route) {
            showLobby();
        } else {
            const game = GAMES.find(g => g.id === route);
            if (game) {
                showGame(game);
            } else {
                showLobby();
            }
        }
    }

    function showLobby() {
        // Destroy current game
        if (currentGame && currentGame.destroy) {
            currentGame.destroy();
            currentGame = null;
            currentGameId = null;
        }

        // Update header
        document.getElementById('header-game-title').textContent = '';
        document.getElementById('rules-btn').style.display = 'none';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="lobby">
                <div class="lobby__hero">
                    <h1 class="lobby__title">Two-Player Games Arena</h1>
                    <p class="lobby__subtitle">Pick a game and challenge a friend — all on one screen!</p>
                </div>
                <div class="lobby__grid" id="lobby-grid"></div>
            </div>
        `;

        const grid = document.getElementById('lobby-grid');
        GAMES.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.id = `card-${game.id}`;
            card.innerHTML = `
                ${game.image
                    ? `<img class="game-card__image" src="${game.image}" alt="${game.title}" loading="lazy">`
                    : `<div class="game-card__image-placeholder">${game.emoji}</div>`
                }
                <div class="game-card__body">
                    <h3 class="game-card__title">${game.title}</h3>
                    <p class="game-card__desc">${game.desc}</p>
                    <div class="game-card__meta">
                        ${game.tags.map(tag => `<span class="game-card__tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.hash = `#/${game.id}`;
            });
            grid.appendChild(card);
        });

        // Animate cards in
        anime({
            targets: '.game-card',
            opacity: [0, 1],
            translateY: [40, 0],
            delay: anime.stagger(80),
            duration: 500,
            easing: 'easeOutCubic'
        });
    }

    function showGame(game) {
        // Destroy previous game
        if (currentGame && currentGame.destroy) {
            currentGame.destroy();
        }

        currentGameId = game.id;

        // Update header
        document.getElementById('header-game-title').textContent = game.title;
        const rulesBtn = document.getElementById('rules-btn');
        rulesBtn.style.display = 'inline-flex';

        // Clone to remove old listener
        const newRulesBtn = rulesBtn.cloneNode(true);
        rulesBtn.parentNode.replaceChild(newRulesBtn, rulesBtn);
        newRulesBtn.addEventListener('click', () => {
            showRulesModal(game.title + ' — Rules', game.rules);
        });

        // Clear app container
        const app = document.getElementById('app');
        app.innerHTML = '<div class="game-page fade-in" id="game-container"></div>';

        // Initialize the game module
        try {
            const module = game.module();
            currentGame = module;
            module.init(document.getElementById('game-container'));
        } catch (e) {
            app.innerHTML = `
                <div class="game-page fade-in" style="justify-content: center;">
                    <h2 style="color: var(--text-muted);">🚧 ${game.title} — Coming Soon!</h2>
                    <p style="color: var(--text-muted); margin-top: var(--space-md);">This game is under development.</p>
                    <button class="btn btn--outline" style="margin-top: var(--space-xl);" onclick="location.hash='#/'">🏠 Back to Lobby</button>
                </div>
            `;
        }
    }

    return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
