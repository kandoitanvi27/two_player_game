/* ============================================
   CONNECT FOUR
   ============================================ */

const ConnectFour = (() => {
    const ROWS = 6;
    const COLS = 7;
    const PLAYER_NAMES = ['Player 1', 'Player 2'];

    let board, turnManager, scoreTracker, undoStack;
    let gameOver, container, animating;

    function init(el) {
        container = el;
        turnManager = new TurnManager(PLAYER_NAMES);
        scoreTracker = new ScoreTracker('connect-four');
        undoStack = new UndoStack();
        animating = false;
        setupUI();
        startNewRound();
    }

    function setupUI() {
        container.innerHTML = `
            ${buildTurnIndicator(PLAYER_NAMES)}
            ${buildScoreboard(scoreTracker.getScores(), PLAYER_NAMES)}
            <div class="cf-board-wrapper">
                <div class="cf-column-hover" id="cf-hover"></div>
                <div class="cf-board" id="cf-board"></div>
            </div>
        `;
        container.appendChild(buildControlBar({
            onUndo: undo,
            onRestart: restart
        }));

        // Build hover indicators
        const hoverRow = document.getElementById('cf-hover');
        for (let c = 0; c < COLS; c++) {
            const indicator = document.createElement('div');
            indicator.className = 'cf-hover-indicator';
            indicator.id = `cf-hover-${c}`;
            indicator.textContent = '▼';
            indicator.addEventListener('click', () => handleColumnClick(c));
            indicator.addEventListener('mouseenter', () => {
                if (!gameOver && !animating) {
                    indicator.classList.add(turnManager.getPlayerIndex() === 0 ? 'cf-hover-indicator--p1' : 'cf-hover-indicator--p2');
                }
            });
            indicator.addEventListener('mouseleave', () => {
                indicator.classList.remove('cf-hover-indicator--p1', 'cf-hover-indicator--p2');
            });
            hoverRow.appendChild(indicator);
        }
    }

    function startNewRound() {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        gameOver = false;
        animating = false;
        turnManager.reset();
        undoStack.clear();
        renderBoard();
        updateTurnIndicator(0);
    }

    function renderBoard() {
        const boardEl = document.getElementById('cf-board');
        boardEl.innerHTML = '';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'cf-cell';
                cell.id = `cf-cell-${r}-${c}`;
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', () => handleColumnClick(c));

                if (board[r][c] !== null) {
                    const disc = document.createElement('div');
                    disc.className = `cf-disc cf-disc--p${board[r][c] + 1}`;
                    cell.appendChild(disc);
                }

                boardEl.appendChild(cell);
            }
        }
    }

    function handleColumnClick(col) {
        if (gameOver || animating) return;

        // Find lowest available row
        let targetRow = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === null) {
                targetRow = r;
                break;
            }
        }

        if (targetRow === -1) {
            showToast('Column is full!', 'warning');
            return;
        }

        const player = turnManager.getPlayerIndex();

        // Save state for undo
        undoStack.push({ board: board.map(r => [...r]), player });

        // Place disc
        board[targetRow][col] = player;
        animating = true;

        // Render the disc with animation
        const cell = document.getElementById(`cf-cell-${targetRow}-${col}`);
        const disc = document.createElement('div');
        disc.className = `cf-disc cf-disc--p${player + 1}`;
        cell.appendChild(disc);

        // Drop animation
        const dropDistance = -(targetRow + 1) * 70;
        anime({
            targets: disc,
            translateY: [dropDistance, 0],
            duration: 300 + targetRow * 50,
            easing: 'easeOutBounce',
            complete: () => {
                animating = false;
                afterMove(targetRow, col, player);
            }
        });
    }

    function afterMove(row, col, player) {
        // Check for win
        const winCells = checkWin(row, col, player);
        if (winCells) {
            gameOver = true;
            highlightWin(winCells);
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
            }, 900);
            return;
        }

        // Check for draw
        if (board[0].every(c => c !== null)) {
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

        turnManager.switchTurn();
        updateTurnIndicator(turnManager.getPlayerIndex());
    }

    function checkWin(row, col, player) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal right
            [1, -1]   // diagonal left
        ];

        for (const [dr, dc] of directions) {
            let cells = [[row, col]];

            // Forward
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                cells.push([r, c]);
                r += dr;
                c += dc;
            }

            // Backward
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                cells.push([r, c]);
                r -= dr;
                c -= dc;
            }

            if (cells.length >= 4) return cells;
        }

        return null;
    }

    function highlightWin(cells) {
        cells.forEach(([r, c], idx) => {
            setTimeout(() => {
                const cell = document.getElementById(`cf-cell-${r}-${c}`);
                cell.classList.add('cf-cell--winning');
            }, idx * 100);
        });
    }

    function undo() {
        if (!undoStack.canUndo() || gameOver || animating) {
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
    }

    function destroy() {
        container.innerHTML = '';
    }

    function getState() {
        return { board: board.map(r => [...r]), player: turnManager.getPlayerIndex(), gameOver };
    }

    return { init, destroy, restart, undo, getState };
})();
