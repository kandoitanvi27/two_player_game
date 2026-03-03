/* ============================================
   TIC TAC TOE
   ============================================ */

const TicTacToe = (() => {
    const PLAYER_SYMBOLS = ['✕', '○'];
    const PLAYER_CLASSES = ['ttt-cell--x', 'ttt-cell--o'];
    const PLAYER_NAMES = ['Player 1 (X)', 'Player 2 (O)'];
    const WIN_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    let board, turnManager, scoreTracker, undoStack;
    let gameOver, container;

    function init(el) {
        container = el;
        turnManager = new TurnManager(PLAYER_NAMES);
        scoreTracker = new ScoreTracker('tic-tac-toe');
        undoStack = new UndoStack();
        setupUI();
        startNewRound();
    }

    function setupUI() {
        container.innerHTML = `
            ${buildTurnIndicator(PLAYER_NAMES)}
            ${buildScoreboard(scoreTracker.getScores(), PLAYER_NAMES)}
            <div class="ttt-board" id="ttt-board"></div>
        `;
        container.appendChild(buildControlBar({
            onUndo: undo,
            onRestart: restart
        }));
    }

    function startNewRound() {
        board = Array(9).fill(null);
        gameOver = false;
        turnManager.reset();
        undoStack.clear();
        renderBoard();
        updateTurnIndicator(0);
    }

    function renderBoard() {
        const boardEl = document.getElementById('ttt-board');
        boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.id = `ttt-cell-${i}`;
            cell.dataset.index = i;

            if (board[i] !== null) {
                cell.textContent = PLAYER_SYMBOLS[board[i]];
                cell.classList.add(PLAYER_CLASSES[board[i]], 'ttt-cell--filled');
            }

            cell.addEventListener('click', () => handleCellClick(i));
            boardEl.appendChild(cell);
        }
    }

    function handleCellClick(index) {
        if (gameOver || board[index] !== null) {
            if (board[index] !== null && !gameOver) {
                showToast('Cell already taken!', 'warning');
            }
            return;
        }

        const player = turnManager.getPlayerIndex();

        // Save state for undo
        undoStack.push({ board: [...board], player });

        // Place mark
        board[index] = player;
        const cell = document.getElementById(`ttt-cell-${index}`);
        cell.textContent = PLAYER_SYMBOLS[player];
        cell.classList.add(PLAYER_CLASSES[player], 'ttt-cell--filled');

        // Animate placement
        anime({
            targets: cell,
            scale: [0, 1],
            duration: 300,
            easing: 'easeOutBack'
        });

        // Check for win
        const winLine = checkWin(player);
        if (winLine) {
            gameOver = true;
            highlightWin(winLine);
            scoreTracker.recordWin(player);
            updateScoreboard(scoreTracker.getScores());
            setTimeout(() => {
                showResultModal({
                    winner: player,
                    playerNames: PLAYER_NAMES,
                    scores: scoreTracker.getScores(),
                    onRestart: restart,
                    onLobby: () => { window.location.hash = '#/two-player'; }
                });
            }, 800);
            return;
        }

        // Check for draw
        if (board.every(c => c !== null)) {
            gameOver = true;
            scoreTracker.recordDraw();
            updateScoreboard(scoreTracker.getScores());
            setTimeout(() => {
                showResultModal({
                    winner: null,
                    playerNames: PLAYER_NAMES,
                    scores: scoreTracker.getScores(),
                    onRestart: restart,
                    onLobby: () => { window.location.hash = '#/two-player'; }
                });
            }, 500);
            return;
        }

        // Switch turn
        turnManager.switchTurn();
        updateTurnIndicator(turnManager.getPlayerIndex());
    }

    function checkWin(player) {
        for (const line of WIN_LINES) {
            if (line.every(i => board[i] === player)) {
                return line;
            }
        }
        return null;
    }

    function highlightWin(line) {
        line.forEach((i, idx) => {
            setTimeout(() => {
                const cell = document.getElementById(`ttt-cell-${i}`);
                cell.classList.add('ttt-cell--winning');
                anime({
                    targets: cell,
                    scale: [1, 1.1],
                    duration: 300,
                    easing: 'easeOutBack'
                });
            }, idx * 150);
        });
    }

    function undo() {
        if (!undoStack.canUndo() || gameOver) {
            showToast('Nothing to undo', 'warning');
            return;
        }
        const state = undoStack.pop();
        board = state.board;
        turnManager.current = state.player;
        renderBoard();
        updateTurnIndicator(state.player);
    }

    function restart() {
        startNewRound();
        updateScoreboard(scoreTracker.getScores());
        anime({
            targets: '.ttt-cell',
            scale: [0.8, 1],
            opacity: [0, 1],
            delay: anime.stagger(50),
            duration: 300,
            easing: 'easeOutCubic'
        });
    }

    function destroy() {
        container.innerHTML = '';
        currentGame = null;
    }

    function getState() {
        return { board: [...board], player: turnManager.getPlayerIndex(), gameOver };
    }

    return { init, destroy, restart, undo, getState };
})();
