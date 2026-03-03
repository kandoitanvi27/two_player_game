/* ============================================
   CHECKERS
   ============================================ */

const Checkers = (() => {
    const SIZE = 8;
    const EMPTY = null;
    const PLAYER_NAMES = ['Player 1', 'Player 2'];

    // Piece types
    const P1 = 0;  // Player 1 regular
    const P2 = 1;  // Player 2 regular
    const K1 = 2;  // Player 1 king
    const K2 = 3;  // Player 2 king

    let board, turnManager, scoreTracker, undoStack;
    let gameOver, container;
    let selectedPiece, validMoves, mustCapture;

    function init(el) {
        container = el;
        turnManager = new TurnManager(PLAYER_NAMES);
        scoreTracker = new ScoreTracker('checkers');
        undoStack = new UndoStack();
        setupUI();
        startNewRound();
    }

    function setupUI() {
        container.innerHTML = `
            ${buildTurnIndicator(PLAYER_NAMES)}
            ${buildScoreboard(scoreTracker.getScores(), PLAYER_NAMES)}
            <div class="ck-board" id="ck-board"></div>
        `;
        container.appendChild(buildControlBar({
            onUndo: undo,
            onRestart: restart
        }));
    }

    function startNewRound() {
        board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));

        // Place player 2 pieces (top) — rows 0-2
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < SIZE; c++) {
                if ((r + c) % 2 === 1) {
                    board[r][c] = P2;
                }
            }
        }

        // Place player 1 pieces (bottom) — rows 5-7
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < SIZE; c++) {
                if ((r + c) % 2 === 1) {
                    board[r][c] = P1;
                }
            }
        }

        gameOver = false;
        selectedPiece = null;
        validMoves = [];
        mustCapture = false;
        turnManager.reset();
        undoStack.clear();
        renderBoard();
        updateTurnIndicator(0);
    }

    function getOwner(piece) {
        if (piece === P1 || piece === K1) return 0;
        if (piece === P2 || piece === K2) return 1;
        return -1;
    }

    function isKing(piece) {
        return piece === K1 || piece === K2;
    }

    function renderBoard() {
        const boardEl = document.getElementById('ck-board');
        boardEl.innerHTML = '';

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                const isDark = (r + c) % 2 === 1;
                cell.className = `ck-cell ${isDark ? 'ck-cell--dark' : 'ck-cell--light'}`;
                cell.id = `ck-cell-${r}-${c}`;
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Highlight selected
                if (selectedPiece && selectedPiece[0] === r && selectedPiece[1] === c) {
                    cell.classList.add('ck-cell--selected');
                }

                // Highlight valid move targets
                if (validMoves.some(m => m.to[0] === r && m.to[1] === c)) {
                    cell.classList.add('ck-cell--highlight');
                }

                // Draw piece
                if (board[r][c] !== EMPTY) {
                    const piece = document.createElement('div');
                    const owner = getOwner(board[r][c]);
                    piece.className = `ck-piece ck-piece--p${owner + 1}`;
                    if (isKing(board[r][c])) {
                        piece.classList.add('ck-piece--king');
                    }
                    cell.appendChild(piece);
                }

                cell.addEventListener('click', () => handleCellClick(r, c));
                boardEl.appendChild(cell);
            }
        }
    }

    function handleCellClick(row, col) {
        if (gameOver) return;

        const player = turnManager.getPlayerIndex();
        const piece = board[row][col];

        // If clicking on a valid move target
        if (selectedPiece && validMoves.some(m => m.to[0] === row && m.to[1] === col)) {
            const move = validMoves.find(m => m.to[0] === row && m.to[1] === col);
            executeMove(move);
            return;
        }

        // If clicking on own piece, select it
        if (piece !== EMPTY && getOwner(piece) === player) {
            // If there's forced capture, only allow selecting pieces that can capture
            const captures = getAllCaptures(player);
            if (captures.length > 0) {
                const pieceCapturesMoves = captures.filter(m => m.from[0] === row && m.from[1] === col);
                if (pieceCapturesMoves.length === 0) {
                    showToast('You must make a capture!', 'warning');
                    return;
                }
                selectedPiece = [row, col];
                validMoves = pieceCapturesMoves;
                mustCapture = true;
            } else {
                selectedPiece = [row, col];
                validMoves = getMovesForPiece(row, col, player);
                mustCapture = false;
            }
            renderBoard();
            return;
        }

        // Deselect
        if (selectedPiece) {
            selectedPiece = null;
            validMoves = [];
            renderBoard();
        }
    }

    function executeMove(move) {
        const { from, to, captures } = move;
        const player = turnManager.getPlayerIndex();

        // Save state for undo
        undoStack.push({
            board: board.map(r => [...r]),
            player
        });

        // Move piece
        board[to[0]][to[1]] = board[from[0]][from[1]];
        board[from[0]][from[1]] = EMPTY;

        // Remove captured pieces
        if (captures) {
            for (const [cr, cc] of captures) {
                board[cr][cc] = EMPTY;
            }
        }

        // King promotion
        if (player === 0 && to[0] === 0 && board[to[0]][to[1]] === P1) {
            board[to[0]][to[1]] = K1;
        } else if (player === 1 && to[0] === 7 && board[to[0]][to[1]] === P2) {
            board[to[0]][to[1]] = K2;
        }

        // Check for multi-jump (only if this was a capture)
        if (captures && captures.length > 0) {
            const moreCaps = getCapturesForPiece(to[0], to[1], player);
            if (moreCaps.length > 0) {
                selectedPiece = [to[0], to[1]];
                validMoves = moreCaps;
                mustCapture = true;
                renderBoard();

                // Animate move
                const pieceEl = document.querySelector(`#ck-cell-${to[0]}-${to[1]} .ck-piece`);
                if (pieceEl) {
                    anime({ targets: pieceEl, scale: [0.8, 1], duration: 200, easing: 'easeOutBack' });
                }

                showToast('Multi-jump available! Continue capturing.', 'success');
                return;
            }
        }

        // End turn
        selectedPiece = null;
        validMoves = [];
        mustCapture = false;

        // Animate
        renderBoard();
        const pieceEl = document.querySelector(`#ck-cell-${to[0]}-${to[1]} .ck-piece`);
        if (pieceEl) {
            anime({ targets: pieceEl, scale: [0.8, 1], duration: 200, easing: 'easeOutBack' });
        }

        // Check for game over
        turnManager.switchTurn();
        const nextPlayer = turnManager.getPlayerIndex();
        const nextPlayerMoves = getAllMoves(nextPlayer);

        if (nextPlayerMoves.length === 0) {
            // Current player wins (opponent has no moves)
            gameOver = true;
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
            }, 600);
            return;
        }

        // Check if opponent has no pieces
        const opponentPieces = countPieces(nextPlayer);
        if (opponentPieces === 0) {
            gameOver = true;
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
            }, 600);
            return;
        }

        updateTurnIndicator(nextPlayer);
        renderBoard();
    }

    function countPieces(player) {
        let count = 0;
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] !== EMPTY && getOwner(board[r][c]) === player) count++;
            }
        }
        return count;
    }

    function getAllMoves(player) {
        const captures = getAllCaptures(player);
        if (captures.length > 0) return captures;

        const moves = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] !== EMPTY && getOwner(board[r][c]) === player) {
                    moves.push(...getMovesForPiece(r, c, player));
                }
            }
        }
        return moves;
    }

    function getMovesForPiece(row, col, player) {
        const captures = getCapturesForPiece(row, col, player);
        if (captures.length > 0) return captures;

        // Check if any other piece has captures (forced capture rule)
        const allCaptures = getAllCaptures(player);
        if (allCaptures.length > 0) return [];

        const piece = board[row][col];
        const moves = [];
        const directions = getMoveDirections(piece, player);

        for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === EMPTY) {
                moves.push({ from: [row, col], to: [nr, nc], captures: [] });
            }
        }

        return moves;
    }

    function getMoveDirections(piece, player) {
        if (isKing(piece)) {
            return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        }
        // Player 1 moves up (decreasing row), Player 2 moves down (increasing row)
        if (player === 0) return [[-1, -1], [-1, 1]];
        return [[1, -1], [1, 1]];
    }

    function getCapturesForPiece(row, col, player) {
        const piece = board[row][col];
        if (piece === EMPTY || getOwner(piece) !== player) return [];

        const captures = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Kings and regular capture in all directions if jumping

        for (const [dr, dc] of directions) {
            // For regular pieces, restrict forward-only for normal moves but allow backward captures
            const mr = row + dr;
            const mc = col + dc;
            const jr = row + 2 * dr;
            const jc = col + 2 * dc;

            if (jr >= 0 && jr < SIZE && jc >= 0 && jc < SIZE) {
                if (board[mr][mc] !== EMPTY && getOwner(board[mr][mc]) !== player && board[jr][jc] === EMPTY) {
                    captures.push({
                        from: [row, col],
                        to: [jr, jc],
                        captures: [[mr, mc]]
                    });
                }
            }
        }

        return captures;
    }

    function getAllCaptures(player) {
        const captures = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] !== EMPTY && getOwner(board[r][c]) === player) {
                    captures.push(...getCapturesForPiece(r, c, player));
                }
            }
        }
        return captures;
    }

    function undo() {
        if (!undoStack.canUndo() || gameOver) {
            showToast('Nothing to undo', 'warning');
            return;
        }
        const state = undoStack.pop();
        board = state.board;
        turnManager.current = state.player;
        selectedPiece = null;
        validMoves = [];
        mustCapture = false;
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
        return {
            board: board.map(r => [...r]),
            player: turnManager.getPlayerIndex(),
            gameOver
        };
    }

    return { init, destroy, restart, undo, getState };
})();
