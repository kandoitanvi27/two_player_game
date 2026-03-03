/* ============================================
   OTHELLO
   ============================================ */

const Reversi = (() => {
    const SIZE = 8;
    const EMPTY = null;
    const BLACK = 0; // Player 1
    const WHITE = 1; // Player 2
    const PLAYER_NAMES = ['Player 1 (Black)', 'Player 2 (White)'];
    const DISC_CLASSES = ['rv-disc--black', 'rv-disc--white'];
    const DIRECTIONS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    let board, turnManager, scoreTracker, undoStack;
    let gameOver, container;

    function init(el) {
        container = el;
        turnManager = new TurnManager(PLAYER_NAMES);
        scoreTracker = new ScoreTracker('reversi');
        undoStack = new UndoStack();
        setupUI();
        startNewRound();
    }

    function setupUI() {
        container.innerHTML = `
            ${buildTurnIndicator(PLAYER_NAMES)}
            ${buildScoreboard(scoreTracker.getScores(), PLAYER_NAMES)}
            <div class="rv-disc-count" id="rv-disc-count">
                <span class="rv-count rv-count--p1" id="rv-count-black">● 2</span>
                <span class="rv-count rv-count--p2" id="rv-count-white">○ 2</span>
            </div>
            <div class="rv-board" id="rv-board"></div>
        `;
        container.appendChild(buildControlBar({
            onUndo: undo,
            onRestart: restart
        }));
    }

    function startNewRound() {
        board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
        // Standard starting position
        board[3][3] = WHITE;
        board[3][4] = BLACK;
        board[4][3] = BLACK;
        board[4][4] = WHITE;
        gameOver = false;
        turnManager.reset();
        undoStack.clear();
        renderBoard();
        updateTurnIndicator(0);
        updateDiscCount();
    }

    function renderBoard() {
        const boardEl = document.getElementById('rv-board');
        boardEl.innerHTML = '';

        const validMoves = getValidMoves(turnManager.getPlayerIndex());

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'rv-cell';
                cell.id = `rv-cell-${r}-${c}`;
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (board[r][c] !== EMPTY) {
                    const disc = document.createElement('div');
                    disc.className = `rv-disc ${DISC_CLASSES[board[r][c]]}`;
                    cell.appendChild(disc);
                }

                if (!gameOver && validMoves.some(m => m[0] === r && m[1] === c)) {
                    cell.classList.add('rv-cell--valid');
                }

                cell.addEventListener('click', () => handleCellClick(r, c));
                boardEl.appendChild(cell);
            }
        }
    }

    function handleCellClick(row, col) {
        if (gameOver) return;

        const player = turnManager.getPlayerIndex();
        const flips = getFlips(row, col, player);

        if (flips.length === 0) {
            if (board[row][col] !== EMPTY) {
                showToast('Cell already occupied!', 'warning');
            } else {
                showToast('Not a valid move!', 'warning');
            }
            return;
        }

        // Save state for undo
        undoStack.push({
            board: board.map(r => [...r]),
            player
        });

        // Place disc
        board[row][col] = player;

        // Flip discs
        for (const [fr, fc] of flips) {
            board[fr][fc] = player;
        }

        // Animate placement
        renderBoard();
        const newDisc = document.querySelector(`#rv-cell-${row}-${col} .rv-disc`);
        if (newDisc) {
            anime({
                targets: newDisc,
                scale: [0, 1],
                duration: 300,
                easing: 'easeOutBack'
            });
        }

        // Animate flipped discs
        for (const [fr, fc] of flips) {
            const flippedDisc = document.querySelector(`#rv-cell-${fr}-${fc} .rv-disc`);
            if (flippedDisc) {
                anime({
                    targets: flippedDisc,
                    rotateY: [0, 180],
                    duration: 400,
                    easing: 'easeInOutCubic'
                });
            }
        }

        updateDiscCount();

        // Check game state
        turnManager.switchTurn();
        let nextPlayer = turnManager.getPlayerIndex();
        let nextMoves = getValidMoves(nextPlayer);

        if (nextMoves.length === 0) {
            // Next player can't move, try switching back
            turnManager.switchTurn();
            nextPlayer = turnManager.getPlayerIndex();
            nextMoves = getValidMoves(nextPlayer);

            if (nextMoves.length === 0) {
                // Neither player can move — game over
                endGame();
                return;
            } else {
                showToast(`${PLAYER_NAMES[1 - nextPlayer]} has no valid moves! Turn skipped.`, 'info');
            }
        }

        updateTurnIndicator(turnManager.getPlayerIndex());
        renderBoard();

        // Check if board is full
        if (board.every(row => row.every(cell => cell !== EMPTY))) {
            endGame();
        }
    }

    function endGame() {
        gameOver = true;
        const counts = countDiscs();
        let winner = null;
        if (counts[BLACK] > counts[WHITE]) winner = 0;
        else if (counts[WHITE] > counts[BLACK]) winner = 1;

        if (winner !== null) scoreTracker.recordWin(winner);
        else scoreTracker.recordDraw();
        updateScoreboard(scoreTracker.getScores());

        setTimeout(() => {
            showResultModal({
                winner,
                playerNames: PLAYER_NAMES,
                scores: scoreTracker.getScores(),
                onRestart: restart,
                onLobby: () => { window.location.hash = '#/two-player'; }
            });
        }, 600);
    }

    function getValidMoves(player) {
        const moves = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (getFlips(r, c, player).length > 0) {
                    moves.push([r, c]);
                }
            }
        }
        return moves;
    }

    function getFlips(row, col, player) {
        if (board[row][col] !== EMPTY) return [];

        const opponent = 1 - player;
        const allFlips = [];

        for (const [dr, dc] of DIRECTIONS) {
            const flips = [];
            let r = row + dr;
            let c = col + dc;

            while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === opponent) {
                flips.push([r, c]);
                r += dr;
                c += dc;
            }

            if (flips.length > 0 && r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] === player) {
                allFlips.push(...flips);
            }
        }

        return allFlips;
    }

    function countDiscs() {
        const counts = [0, 0];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] !== EMPTY) counts[board[r][c]]++;
            }
        }
        return counts;
    }

    function updateDiscCount() {
        const counts = countDiscs();
        const blackEl = document.getElementById('rv-count-black');
        const whiteEl = document.getElementById('rv-count-white');
        if (blackEl) blackEl.textContent = `● ${counts[BLACK]}`;
        if (whiteEl) whiteEl.textContent = `○ ${counts[WHITE]}`;
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
        updateDiscCount();
    }

    function restart() {
        startNewRound();
        updateScoreboard(scoreTracker.getScores());
    }

    function destroy() {
        container.innerHTML = '';
    }

    function getState() {
        return {
            board: board.map(r => [...r]),
            player: turnManager.getPlayerIndex(),
            gameOver
        };
    }

    return { init, destroy, restart, undo, getState };
})();
