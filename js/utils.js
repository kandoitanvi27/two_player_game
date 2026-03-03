/* ============================================
   SHARED UTILITIES
   ============================================ */

// ---------- Turn Manager ----------
class TurnManager {
    constructor(playerNames = ['Player 1', 'Player 2']) {
        this.players = playerNames;
        this.current = 0;
    }

    getCurrentPlayer() {
        return this.players[this.current];
    }

    getPlayerIndex() {
        return this.current;
    }

    switchTurn() {
        this.current = 1 - this.current;
        return this.current;
    }

    reset() {
        this.current = 0;
    }
}

// ---------- Score Tracker ----------
class ScoreTracker {
    constructor(gameId) {
        this.gameId = gameId;
        this.scores = { p1: 0, p2: 0, draws: 0 };
    }

    getScores() {
        return { ...this.scores };
    }

    recordWin(playerIdx) {
        if (playerIdx === 0) this.scores.p1++;
        else this.scores.p2++;
    }

    recordDraw() {
        this.scores.draws++;
    }

    reset() {
        this.scores = { p1: 0, p2: 0, draws: 0 };
    }
}

// ---------- Undo Stack ----------
class UndoStack {
    constructor(maxDepth = 50) {
        this.stack = [];
        this.maxDepth = maxDepth;
    }

    push(state) {
        if (this.stack.length >= this.maxDepth) {
            this.stack.shift();
        }
        this.stack.push(JSON.parse(JSON.stringify(state)));
    }

    pop() {
        return this.stack.pop() || null;
    }

    canUndo() {
        return this.stack.length > 0;
    }

    clear() {
        this.stack = [];
    }
}

// ---------- Result Modal ----------
function showResultModal({ winner, playerNames, scores, onRestart, onLobby }) {
    const modal = document.getElementById('result-modal');
    const icon = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const subtitle = document.getElementById('result-subtitle');
    const scoresDiv = document.getElementById('result-scores');
    const restartBtn = document.getElementById('result-restart-btn');
    const lobbyBtn = document.getElementById('result-lobby-btn');

    if (winner === null) {
        icon.textContent = '🤝';
        title.textContent = "It's a Draw!";
        subtitle.textContent = 'Well played, both of you!';
    } else {
        icon.textContent = '🏆';
        title.textContent = `${playerNames[winner]} Wins!`;
        subtitle.textContent = 'Congratulations!';
        title.style.color = winner === 0 ? 'var(--player1-color)' : 'var(--player2-color)';
    }

    scoresDiv.innerHTML = `
        <div class="scoreboard__item">
            <span class="scoreboard__label">${playerNames[0]}</span>
            <span class="scoreboard__value scoreboard__value--p1">${scores.p1}</span>
        </div>
        <div class="scoreboard__divider"></div>
        <div class="scoreboard__item">
            <span class="scoreboard__label">Draws</span>
            <span class="scoreboard__value scoreboard__value--draws">${scores.draws}</span>
        </div>
        <div class="scoreboard__divider"></div>
        <div class="scoreboard__item">
            <span class="scoreboard__label">${playerNames[1]}</span>
            <span class="scoreboard__value scoreboard__value--p2">${scores.p2}</span>
        </div>
    `;

    modal.style.display = 'flex';

    // Animate in
    anime({
        targets: '#result-modal-content',
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
    });

    // Clone buttons to remove old listeners
    const newRestart = restartBtn.cloneNode(true);
    const newLobby = lobbyBtn.cloneNode(true);
    restartBtn.parentNode.replaceChild(newRestart, restartBtn);
    lobbyBtn.parentNode.replaceChild(newLobby, lobbyBtn);

    newRestart.addEventListener('click', () => {
        hideResultModal();
        title.style.color = '';
        if (onRestart) onRestart();
    });

    newLobby.addEventListener('click', () => {
        hideResultModal();
        title.style.color = '';
        if (onLobby) onLobby();
    });
}

function hideResultModal() {
    const modal = document.getElementById('result-modal');
    anime({
        targets: '#result-modal-content',
        scale: [1, 0.8],
        opacity: [1, 0],
        duration: 250,
        easing: 'easeInBack',
        complete: () => {
            modal.style.display = 'none';
        }
    });
}

// ---------- Rules Modal ----------
function showRulesModal(title, rulesHTML) {
    const modal = document.getElementById('rules-modal');
    document.getElementById('rules-title').textContent = title;
    document.getElementById('rules-body').innerHTML = rulesHTML;
    modal.style.display = 'flex';

    anime({
        targets: '#rules-modal-content',
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
    });
}

function hideRulesModal() {
    const modal = document.getElementById('rules-modal');
    anime({
        targets: '#rules-modal-content',
        scale: [1, 0.8],
        opacity: [1, 0],
        duration: 250,
        easing: 'easeInBack',
        complete: () => {
            modal.style.display = 'none';
        }
    });
}

// ---------- Toast ----------
function showToast(message, type = 'info', duration = 2500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type !== 'info' ? 'toast--' + type : ''}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger show
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ---------- Common Game UI Builders ----------
function buildTurnIndicator(playerNames) {
    return `
        <div class="turn-indicator" id="turn-indicator">
            <div class="turn-indicator__player turn-indicator__player--p1 active" id="turn-p1">
                <span class="turn-indicator__dot"></span>
                <span>${playerNames[0]}</span>
            </div>
            <span class="turn-indicator__vs">VS</span>
            <div class="turn-indicator__player turn-indicator__player--p2" id="turn-p2">
                <span class="turn-indicator__dot"></span>
                <span>${playerNames[1]}</span>
            </div>
        </div>
    `;
}

function updateTurnIndicator(playerIndex) {
    const p1 = document.getElementById('turn-p1');
    const p2 = document.getElementById('turn-p2');
    if (!p1 || !p2) return;

    if (playerIndex === 0) {
        p1.classList.add('active');
        p2.classList.remove('active');
    } else {
        p2.classList.add('active');
        p1.classList.remove('active');
    }
}

function buildScoreboard(scores, playerNames) {
    return `
        <div class="scoreboard" id="scoreboard">
            <div class="scoreboard__item">
                <span class="scoreboard__label">${playerNames[0]}</span>
                <span class="scoreboard__value scoreboard__value--p1" id="score-p1">${scores.p1}</span>
            </div>
            <div class="scoreboard__divider"></div>
            <div class="scoreboard__item">
                <span class="scoreboard__label">Draws</span>
                <span class="scoreboard__value scoreboard__value--draws" id="score-draws">${scores.draws}</span>
            </div>
            <div class="scoreboard__divider"></div>
            <div class="scoreboard__item">
                <span class="scoreboard__label">${playerNames[1]}</span>
                <span class="scoreboard__value scoreboard__value--p2" id="score-p2">${scores.p2}</span>
            </div>
        </div>
    `;
}

function updateScoreboard(scores) {
    const p1 = document.getElementById('score-p1');
    const p2 = document.getElementById('score-p2');
    const draws = document.getElementById('score-draws');
    if (p1) p1.textContent = scores.p1;
    if (p2) p2.textContent = scores.p2;
    if (draws) draws.textContent = scores.draws;
}

function buildControlBar(callbacks) {
    const bar = document.createElement('div');
    bar.className = 'control-bar';
    bar.id = 'control-bar';

    const undoBtn = document.createElement('button');
    undoBtn.className = 'btn btn--outline btn--sm';
    undoBtn.id = 'undo-btn';
    undoBtn.textContent = '↩ Undo';
    undoBtn.addEventListener('click', callbacks.onUndo);

    const restartBtn = document.createElement('button');
    restartBtn.className = 'btn btn--outline btn--sm';
    restartBtn.id = 'restart-btn';
    restartBtn.textContent = '🔄 Restart';
    restartBtn.addEventListener('click', callbacks.onRestart);

    const lobbyBtn = document.createElement('button');
    lobbyBtn.className = 'btn btn--outline btn--sm';
    lobbyBtn.id = 'lobby-btn';
    lobbyBtn.textContent = '🏠 Lobby';
    lobbyBtn.addEventListener('click', () => {
        window.location.hash = '#/two-player';
    });

    bar.appendChild(undoBtn);
    bar.appendChild(restartBtn);
    bar.appendChild(lobbyBtn);
    return bar;
}
