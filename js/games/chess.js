/* ============================================
   CHESS
   ============================================ */

const Chess = (() => {
    const SIZE = 8;
    const PLAYER_NAMES = ['White', 'Black'];
    const EMPTY = null;

    // 3D SVG piece silhouettes (viewBox 0 0 50 50)
    const PIECE_SVG_PATHS = {
        K: `<rect x="23" y="1" width="4" height="9" rx="1.2"/>
            <rect x="19.5" y="3.5" width="11" height="4" rx="1.2"/>
            <circle cx="25" cy="15" r="5.5"/>
            <path d="M18.5 20 Q25 16 31.5 20 L34 34 H16Z"/>
            <rect x="13.5" y="34" width="23" height="3.5" rx="1.2"/>
            <ellipse cx="25" cy="41" rx="14.5" ry="5"/>`,
        Q: `<circle cx="25" cy="4" r="2.8"/>
            <path d="M9 20 L13 8 L19 17 L25 7 L31 17 L37 8 L41 20 L37 22 L34 34 H16 L13 22Z"/>
            <rect x="13.5" y="34" width="23" height="3.5" rx="1.2"/>
            <ellipse cx="25" cy="41" rx="14.5" ry="5"/>`,
        R: `<path d="M12.5 15 V6 H17.5 V11 H21.5 V6 H28.5 V11 H32.5 V6 H37.5 V15 L35.5 17 V33 H14.5 V17Z"/>
            <rect x="12.5" y="33" width="25" height="4" rx="1.2"/>
            <ellipse cx="25" cy="41" rx="14.5" ry="5"/>`,
        B: `<circle cx="25" cy="5" r="2.8"/>
            <path d="M21.5 12 L25 6 L28.5 12 Q34 20 31.5 29 L33.5 34 H16.5 L18.5 29 Q16 20 21.5 12Z"/>
            <rect x="13.5" y="34" width="23" height="3.5" rx="1.2"/>
            <ellipse cx="25" cy="41" rx="14.5" ry="5"/>`,
        N: `<path d="M14 42 V33 C14 27 12 23 10 19 C8 15 10 9 14 7 L18 5 C20 4 24 3 28 5 C32 7 34 11 34 15 C34 21 30 27 28 31 L36 42Z"/>
            <circle cx="20" cy="14" r="1.8" class="ch-svg-eye"/>
            <ellipse cx="25" cy="44" rx="14" ry="4"/>`,
        P: `<circle cx="25" cy="12" r="6.5"/>
            <path d="M20 18 Q25 15 30 18 L32.5 34 Q25 40 17.5 34Z"/>
            <ellipse cx="25" cy="40" rx="13" ry="4.5"/>`
    };

    // Shared SVG gradient definitions (injected once into the board container)
    const SVG_DEFS = `
        <svg width="0" height="0" style="position:absolute;visibility:hidden" aria-hidden="true">
            <defs>
                <linearGradient id="ch-grad-p1" x1="0.2" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stop-color="#ff80b8"/>
                    <stop offset="45%" stop-color="#ff3388"/>
                    <stop offset="100%" stop-color="#b8114d"/>
                </linearGradient>
                <linearGradient id="ch-grad-p1-shadow" x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stop-color="#99204d"/>
                    <stop offset="100%" stop-color="#550022"/>
                </linearGradient>
                <linearGradient id="ch-grad-p2" x1="0.2" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stop-color="#80f7ff"/>
                    <stop offset="45%" stop-color="#00e5ff"/>
                    <stop offset="100%" stop-color="#0088aa"/>
                </linearGradient>
                <linearGradient id="ch-grad-p2-shadow" x1="0" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stop-color="#005566"/>
                    <stop offset="100%" stop-color="#002233"/>
                </linearGradient>
            </defs>
        </svg>`;

    function getPieceSVG(piece, sizeClass) {
        const type = piece.toUpperCase();
        const paths = PIECE_SVG_PATHS[type];
        if (!paths) return '';
        const cls = sizeClass ? ` ${sizeClass}` : '';
        const owner = getOwner(piece);
        const pIdx = owner + 1; // 1 or 2
        return `<svg viewBox="0 0 50 50" class="ch-piece-svg ch-piece-svg--shadow${cls}" aria-hidden="true">
                    <g fill="url(#ch-grad-p${pIdx}-shadow)">${paths.replace(/class="ch-svg-eye"/g, 'fill="rgba(0,0,0,0.3)"')}</g>
                </svg>
                <svg viewBox="0 0 50 50" class="ch-piece-svg ch-piece-svg--main${cls}" aria-hidden="true">
                    <g fill="url(#ch-grad-p${pIdx})" stroke="rgba(255,255,255,0.15)" stroke-width="0.5">${paths.replace(/class="ch-svg-eye"/g, 'fill="rgba(0,0,0,0.85)" stroke="none"')}</g>
                </svg>`;
    }

    // Keep unicode map for fallback/accessibility
    const PIECES_UNICODE = {
        K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
        k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
    };

    const INITIAL_BOARD = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    let board, turnManager, scoreTracker, undoStack;
    let gameOver, container;
    let selectedPiece, validMoves;
    let castlingRights, enPassantTarget;

    // ---------- Helpers ----------

    function getOwner(piece) {
        if (!piece) return -1;
        return piece === piece.toUpperCase() ? 0 : 1;
    }

    function isOwn(piece, player) {
        return getOwner(piece) === player;
    }

    function isEnemy(piece, player) {
        const o = getOwner(piece);
        return o !== -1 && o !== player;
    }

    function inBounds(r, c) {
        return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
    }

    // ---------- Init ----------

    function init(el) {
        container = el;
        turnManager = new TurnManager(PLAYER_NAMES);
        scoreTracker = new ScoreTracker('chess');
        undoStack = new UndoStack();
        setupUI();
        startNewRound();
    }

    function setupUI() {
        container.innerHTML = `
            ${SVG_DEFS}
            ${buildTurnIndicator(PLAYER_NAMES)}
            ${buildScoreboard(scoreTracker.getScores(), PLAYER_NAMES)}
            <div class="ch-board-area">
                <div class="ch-captured" id="ch-captured-1"></div>
                <div class="ch-board" id="ch-board"></div>
                <div class="ch-captured" id="ch-captured-0"></div>
            </div>
        `;
        container.appendChild(buildControlBar({
            onUndo: undo,
            onRestart: restart
        }));
    }

    function startNewRound() {
        board = INITIAL_BOARD.map(r => [...r]);
        castlingRights = {
            0: { king: true, queen: true },
            1: { king: true, queen: true }
        };
        enPassantTarget = null;
        gameOver = false;
        selectedPiece = null;
        validMoves = [];
        turnManager.reset();
        undoStack.clear();
        renderBoard();
        updateTurnIndicator(0);
    }

    // ---------- Rendering ----------

    function renderBoard() {
        const boardEl = document.getElementById('ch-board');
        boardEl.innerHTML = '';

        // Rotate board for current player (Black's turn = rotated)
        const currentPlayer = turnManager.getPlayerIndex();
        boardEl.classList.toggle('ch-board--rotated', currentPlayer === 1);

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                cell.className = `ch-cell ${isLight ? 'ch-cell--light' : 'ch-cell--dark'}`;
                cell.id = `ch-cell-${r}-${c}`;
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Highlight selected
                if (selectedPiece && selectedPiece[0] === r && selectedPiece[1] === c) {
                    cell.classList.add('ch-cell--selected');
                }

                // Highlight valid move targets
                const isValid = validMoves.some(m => m.to[0] === r && m.to[1] === c);
                if (isValid) {
                    if (board[r][c] && isEnemy(board[r][c], currentPlayer)) {
                        cell.classList.add('ch-cell--capture');
                    } else {
                        cell.classList.add('ch-cell--highlight');
                    }
                }

                // Highlight king in check
                if (!gameOver && board[r][c] && board[r][c].toUpperCase() === 'K' &&
                    getOwner(board[r][c]) === currentPlayer && isInCheck(currentPlayer, board)) {
                    cell.classList.add('ch-cell--check');
                }

                // Draw piece as 3D SVG figurine
                if (board[r][c]) {
                    const owner = getOwner(board[r][c]);
                    const wrapper = document.createElement('div');
                    wrapper.className = `ch-piece ch-piece--p${owner + 1}`;
                    wrapper.innerHTML = getPieceSVG(board[r][c]);
                    cell.appendChild(wrapper);
                }

                cell.addEventListener('click', () => handleCellClick(r, c));
                boardEl.appendChild(cell);
            }
        }

        renderCaptured();
    }

    function renderCaptured() {
        // Figure out what pieces are missing from initial setup
        const initialCounts = {};
        const currentCounts = {};

        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const ip = INITIAL_BOARD[r][c];
                const cp = board[r][c];
                if (ip) initialCounts[ip] = (initialCounts[ip] || 0) + 1;
                if (cp) currentCounts[cp] = (currentCounts[cp] || 0) + 1;
            }
        }

        for (let player = 0; player < 2; player++) {
            const el = document.getElementById(`ch-captured-${player}`);
            if (!el) continue;
            el.innerHTML = '';

            // Pieces captured BY this player (i.e. opponent pieces missing)
            const opponentPieces = player === 0
                ? ['q', 'r', 'b', 'n', 'p']
                : ['Q', 'R', 'B', 'N', 'P'];

            for (const p of opponentPieces) {
                const initial = initialCounts[p] || 0;
                const current = currentCounts[p] || 0;
                const captured = initial - current;
                for (let i = 0; i < captured; i++) {
                    const span = document.createElement('span');
                    span.className = `ch-captured-piece ch-piece--p${getOwner(p) + 1}`;
                    span.innerHTML = getPieceSVG(p, 'ch-piece-svg--sm');
                    el.appendChild(span);
                }
            }
        }
    }

    // ---------- Interaction ----------

    function handleCellClick(row, col) {
        if (gameOver) return;

        const player = turnManager.getPlayerIndex();
        const piece = board[row][col];

        // If clicking on a valid move target → execute
        if (selectedPiece && validMoves.some(m => m.to[0] === row && m.to[1] === col)) {
            const move = validMoves.find(m => m.to[0] === row && m.to[1] === col);
            executeMove(move);
            return;
        }

        // If clicking on own piece → select it
        if (piece && getOwner(piece) === player) {
            selectedPiece = [row, col];
            validMoves = getLegalMoves(row, col, board, player);
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

    // ---------- Move Execution ----------

    function executeMove(move) {
        const player = turnManager.getPlayerIndex();
        const piece = board[move.from[0]][move.from[1]];

        // Save state for undo
        undoStack.push({
            board: board.map(r => [...r]),
            player,
            castlingRights: JSON.parse(JSON.stringify(castlingRights)),
            enPassantTarget: enPassantTarget ? [...enPassantTarget] : null
        });

        // Move piece
        board[move.to[0]][move.to[1]] = piece;
        board[move.from[0]][move.from[1]] = null;

        // En passant capture
        if (move.enPassant) {
            board[move.from[0]][move.to[1]] = null;
        }

        // Castling — move rook
        if (move.castle === 'king') {
            const row = move.from[0];
            board[row][5] = board[row][7];
            board[row][7] = null;
        } else if (move.castle === 'queen') {
            const row = move.from[0];
            board[row][3] = board[row][0];
            board[row][0] = null;
        }

        // Update castling rights
        if (piece.toUpperCase() === 'K') {
            castlingRights[player].king = false;
            castlingRights[player].queen = false;
        }
        if (piece.toUpperCase() === 'R') {
            const kingRow = player === 0 ? 7 : 0;
            if (move.from[0] === kingRow && move.from[1] === 0) castlingRights[player].queen = false;
            if (move.from[0] === kingRow && move.from[1] === 7) castlingRights[player].king = false;
        }
        // If a rook square is captured
        if (move.to[0] === 0 && move.to[1] === 0) castlingRights[1].queen = false;
        if (move.to[0] === 0 && move.to[1] === 7) castlingRights[1].king = false;
        if (move.to[0] === 7 && move.to[1] === 0) castlingRights[0].queen = false;
        if (move.to[0] === 7 && move.to[1] === 7) castlingRights[0].king = false;

        // Set en passant target
        if (piece.toUpperCase() === 'P' && Math.abs(move.to[0] - move.from[0]) === 2) {
            enPassantTarget = [(move.from[0] + move.to[0]) / 2, move.from[1]];
        } else {
            enPassantTarget = null;
        }

        // Pawn promotion
        const promoRow = player === 0 ? 0 : 7;
        if (piece.toUpperCase() === 'P' && move.to[0] === promoRow) {
            renderBoard();
            showPromotionModal(move.to[0], move.to[1], player);
            return;
        }

        finishTurn();
    }

    function showPromotionModal(row, col, player) {
        const pieces = player === 0 ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];
        const overlay = document.createElement('div');
        overlay.className = 'ch-promo-overlay';
        overlay.innerHTML = `
            <div class="ch-promo-modal">
                <p style="margin-bottom: var(--space-md); color: var(--text-secondary);">Promote pawn to:</p>
                <div class="ch-promo-options">
                    ${pieces.map(p => `
                        <button class="ch-promo-btn" data-piece="${p}">
                            <span class="ch-piece--p${player + 1} ch-promo-piece">${getPieceSVG(p)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(overlay);

        overlay.querySelectorAll('.ch-promo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                board[row][col] = btn.dataset.piece;
                overlay.remove();
                finishTurn();
            });
        });
    }

    function finishTurn() {
        selectedPiece = null;
        validMoves = [];

        turnManager.switchTurn();
        const nextPlayer = turnManager.getPlayerIndex();

        const allMoves = getAllLegalMoves(nextPlayer, board);
        const inCheck = isInCheck(nextPlayer, board);

        renderBoard();
        updateTurnIndicator(nextPlayer);

        if (allMoves.length === 0) {
            gameOver = true;
            if (inCheck) {
                // Checkmate
                const winner = 1 - nextPlayer;
                scoreTracker.recordWin(winner);
                updateScoreboard(scoreTracker.getScores());
                showToast(`Checkmate! ${PLAYER_NAMES[winner]} wins!`, 'success');
                setTimeout(() => {
                    showResultModal({
                        winner,
                        playerNames: PLAYER_NAMES,
                        scores: scoreTracker.getScores(),
                        onRestart: restart,
                        onLobby: () => { window.location.hash = '#/two-player'; }
                    });
                }, 800);
            } else {
                // Stalemate
                scoreTracker.recordDraw();
                updateScoreboard(scoreTracker.getScores());
                showToast('Stalemate! Game is a draw.', 'info');
                setTimeout(() => {
                    showResultModal({
                        winner: null,
                        playerNames: PLAYER_NAMES,
                        scores: scoreTracker.getScores(),
                        onRestart: restart,
                        onLobby: () => { window.location.hash = '#/two-player'; }
                    });
                }, 800);
            }
        } else if (inCheck) {
            showToast(`${PLAYER_NAMES[nextPlayer]} is in Check!`, 'warning');
        }
    }

    // ---------- Move Generation ----------

    function getPseudoLegalMoves(row, col, brd, player) {
        const piece = brd[row][col];
        if (!piece || getOwner(piece) !== player) return [];

        const type = piece.toUpperCase();
        const moves = [];

        switch (type) {
            case 'P': getPawnMoves(row, col, player, brd, moves); break;
            case 'R': getSlidingMoves(row, col, player, brd, moves, [[0, 1], [0, -1], [1, 0], [-1, 0]]); break;
            case 'B': getSlidingMoves(row, col, player, brd, moves, [[1, 1], [1, -1], [-1, 1], [-1, -1]]); break;
            case 'Q': getSlidingMoves(row, col, player, brd, moves, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]); break;
            case 'N': getKnightMoves(row, col, player, brd, moves); break;
            case 'K': getKingMoves(row, col, player, brd, moves); break;
        }

        return moves;
    }

    function getPawnMoves(row, col, player, brd, moves) {
        const dir = player === 0 ? -1 : 1;
        const startRow = player === 0 ? 6 : 1;

        // Forward 1
        if (inBounds(row + dir, col) && !brd[row + dir][col]) {
            moves.push({ from: [row, col], to: [row + dir, col] });
            // Forward 2 from start
            if (row === startRow && !brd[row + 2 * dir][col]) {
                moves.push({ from: [row, col], to: [row + 2 * dir, col] });
            }
        }

        // Diagonal captures
        for (const dc of [-1, 1]) {
            const nr = row + dir, nc = col + dc;
            if (!inBounds(nr, nc)) continue;

            if (brd[nr][nc] && isEnemy(brd[nr][nc], player)) {
                moves.push({ from: [row, col], to: [nr, nc] });
            }

            // En passant
            if (enPassantTarget && enPassantTarget[0] === nr && enPassantTarget[1] === nc) {
                moves.push({ from: [row, col], to: [nr, nc], enPassant: true });
            }
        }
    }

    function getSlidingMoves(row, col, player, brd, moves, directions) {
        for (const [dr, dc] of directions) {
            let r = row + dr, c = col + dc;
            while (inBounds(r, c)) {
                if (!brd[r][c]) {
                    moves.push({ from: [row, col], to: [r, c] });
                } else {
                    if (isEnemy(brd[r][c], player)) {
                        moves.push({ from: [row, col], to: [r, c] });
                    }
                    break;
                }
                r += dr;
                c += dc;
            }
        }
    }

    function getKnightMoves(row, col, player, brd, moves) {
        const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of offsets) {
            const nr = row + dr, nc = col + dc;
            if (inBounds(nr, nc) && !isOwn(brd[nr][nc], player)) {
                moves.push({ from: [row, col], to: [nr, nc] });
            }
        }
    }

    function getKingMoves(row, col, player, brd, moves) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr, nc = col + dc;
                if (inBounds(nr, nc) && !isOwn(brd[nr][nc], player)) {
                    moves.push({ from: [row, col], to: [nr, nc] });
                }
            }
        }

        // Castling
        const kingRow = player === 0 ? 7 : 0;
        if (row === kingRow && col === 4) {
            const enemy = 1 - player;

            // King-side
            if (castlingRights[player].king &&
                !brd[kingRow][5] && !brd[kingRow][6] &&
                brd[kingRow][7] && brd[kingRow][7].toUpperCase() === 'R' && getOwner(brd[kingRow][7]) === player &&
                !isSquareAttacked(kingRow, 4, enemy, brd) &&
                !isSquareAttacked(kingRow, 5, enemy, brd) &&
                !isSquareAttacked(kingRow, 6, enemy, brd)) {
                moves.push({ from: [row, col], to: [kingRow, 6], castle: 'king' });
            }

            // Queen-side
            if (castlingRights[player].queen &&
                !brd[kingRow][3] && !brd[kingRow][2] && !brd[kingRow][1] &&
                brd[kingRow][0] && brd[kingRow][0].toUpperCase() === 'R' && getOwner(brd[kingRow][0]) === player &&
                !isSquareAttacked(kingRow, 4, enemy, brd) &&
                !isSquareAttacked(kingRow, 3, enemy, brd) &&
                !isSquareAttacked(kingRow, 2, enemy, brd)) {
                moves.push({ from: [row, col], to: [kingRow, 2], castle: 'queen' });
            }
        }
    }

    // ---------- Check & Attack Detection ----------

    function isSquareAttacked(row, col, byPlayer, brd) {
        // Pawn attacks
        const pawnDir = byPlayer === 0 ? -1 : 1;
        for (const dc of [-1, 1]) {
            const pr = row - pawnDir, pc = col + dc;
            if (inBounds(pr, pc) && brd[pr][pc]) {
                const p = brd[pr][pc];
                if (getOwner(p) === byPlayer && p.toUpperCase() === 'P') return true;
            }
        }

        // Knight attacks
        const knightOffsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of knightOffsets) {
            const nr = row + dr, nc = col + dc;
            if (inBounds(nr, nc) && brd[nr][nc]) {
                const p = brd[nr][nc];
                if (getOwner(p) === byPlayer && p.toUpperCase() === 'N') return true;
            }
        }

        // King attacks (for adjacent checks)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr, nc = col + dc;
                if (inBounds(nr, nc) && brd[nr][nc]) {
                    const p = brd[nr][nc];
                    if (getOwner(p) === byPlayer && p.toUpperCase() === 'K') return true;
                }
            }
        }

        // Sliding attacks (rook/queen on straights, bishop/queen on diagonals)
        const straightDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const diagDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dr, dc] of straightDirs) {
            let r = row + dr, c = col + dc;
            while (inBounds(r, c)) {
                if (brd[r][c]) {
                    const p = brd[r][c];
                    if (getOwner(p) === byPlayer && (p.toUpperCase() === 'R' || p.toUpperCase() === 'Q')) return true;
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        for (const [dr, dc] of diagDirs) {
            let r = row + dr, c = col + dc;
            while (inBounds(r, c)) {
                if (brd[r][c]) {
                    const p = brd[r][c];
                    if (getOwner(p) === byPlayer && (p.toUpperCase() === 'B' || p.toUpperCase() === 'Q')) return true;
                    break;
                }
                r += dr;
                c += dc;
            }
        }

        return false;
    }

    function findKing(player, brd) {
        const king = player === 0 ? 'K' : 'k';
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (brd[r][c] === king) return [r, c];
            }
        }
        return null;
    }

    function isInCheck(player, brd) {
        const kingPos = findKing(player, brd);
        if (!kingPos) return false;
        return isSquareAttacked(kingPos[0], kingPos[1], 1 - player, brd);
    }

    function getLegalMoves(row, col, brd, player) {
        const pseudoMoves = getPseudoLegalMoves(row, col, brd, player);
        return pseudoMoves.filter(move => {
            const newBoard = brd.map(r => [...r]);
            newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
            newBoard[move.from[0]][move.from[1]] = null;

            if (move.enPassant) {
                newBoard[move.from[0]][move.to[1]] = null;
            }

            if (move.castle === 'king') {
                newBoard[move.from[0]][5] = newBoard[move.from[0]][7];
                newBoard[move.from[0]][7] = null;
            } else if (move.castle === 'queen') {
                newBoard[move.from[0]][3] = newBoard[move.from[0]][0];
                newBoard[move.from[0]][0] = null;
            }

            return !isInCheck(player, newBoard);
        });
    }

    function getAllLegalMoves(player, brd) {
        const moves = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (brd[r][c] && getOwner(brd[r][c]) === player) {
                    moves.push(...getLegalMoves(r, c, brd, player));
                }
            }
        }
        return moves;
    }

    // ---------- Undo / Restart ----------

    function undo() {
        if (!undoStack.canUndo() || gameOver) {
            showToast('Nothing to undo', 'warning');
            return;
        }
        const state = undoStack.pop();
        board = state.board;
        castlingRights = state.castlingRights;
        enPassantTarget = state.enPassantTarget;
        turnManager.current = state.player;
        selectedPiece = null;
        validMoves = [];
        gameOver = false;
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
