/* ============================================
   DOTS AND BOXES
   ============================================ */

const DotsBoxes = (() => {
    const GRID_SIZES = [
        { label: '3×3', rows: 3, cols: 3 },
        { label: '4×4', rows: 4, cols: 4 },
        { label: '5×5', rows: 5, cols: 5 },
        { label: '6×6', rows: 6, cols: 6 }
    ];
    const DOT_SIZE = 14;
    const PLAYER_NAMES = ['Player 1', 'Player 2'];

    let gridRows = 4, gridCols = 4;
    let dotRows, dotCols, gap;
    let hLines, vLines, boxes;
    let turnManager, scoreTracker, undoStack;
    let gameOver, container, boxScores;

    function init(el) {
        container = el;
        turnManager = new TurnManager(PLAYER_NAMES);
        scoreTracker = new ScoreTracker('dots-boxes');
        undoStack = new UndoStack();
        setupUI();
        startNewRound();
    }

    function setupUI() {
        container.innerHTML = `
            ${buildTurnIndicator(PLAYER_NAMES)}
            ${buildScoreboard(scoreTracker.getScores(), PLAYER_NAMES)}
            <div class="db-size-selector" id="db-size-selector">
                <span class="db-size-selector__label">Grid Size:</span>
                ${GRID_SIZES.map(s => `
                    <button class="db-size-btn ${s.rows === gridRows && s.cols === gridCols ? 'db-size-btn--active' : ''}"
                            data-rows="${s.rows}" data-cols="${s.cols}">${s.label}</button>
                `).join('')}
            </div>
            <div class="db-box-counter" id="db-box-counter">
                <span class="db-count db-count--p1" id="db-box-count-0">★ 0</span>
                <span class="db-count db-count--p2" id="db-box-count-1">✦ 0</span>
            </div>
            <div class="db-board" id="db-board"></div>
        `;
        container.appendChild(buildControlBar({
            onUndo: undo,
            onRestart: restart
        }));

        // Attach grid size button listeners
        document.querySelectorAll('.db-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                changeGridSize(parseInt(btn.dataset.rows), parseInt(btn.dataset.cols));
            });
        });
    }

    function changeGridSize(rows, cols) {
        gridRows = rows;
        gridCols = cols;
        // Update active button
        document.querySelectorAll('.db-size-btn').forEach(btn => {
            btn.classList.toggle('db-size-btn--active',
                parseInt(btn.dataset.rows) === rows && parseInt(btn.dataset.cols) === cols);
        });
        scoreTracker = new ScoreTracker(`dots-boxes-${rows}x${cols}`);
        updateScoreboard(scoreTracker.getScores());
        startNewRound();
    }

    function updateBoxCounter() {
        const el0 = document.getElementById('db-box-count-0');
        const el1 = document.getElementById('db-box-count-1');
        if (el0) el0.textContent = `★ ${boxScores[0]}`;
        if (el1) el1.textContent = `✦ ${boxScores[1]}`;
    }

    function startNewRound() {
        dotRows = gridRows + 1;
        dotCols = gridCols + 1;
        // Scale gap based on grid size so larger grids fit on screen
        gap = gridRows <= 3 ? 80 : gridRows <= 4 ? 70 : gridRows <= 5 ? 58 : 48;

        // hLines[row][col] : row = 0..gridRows, col = 0..gridCols-1
        hLines = Array.from({ length: dotRows }, () => Array(gridCols).fill(null));
        // vLines[row][col] : row = 0..gridRows-1, col = 0..dotCols-1
        vLines = Array.from({ length: gridRows }, () => Array(dotCols).fill(null));
        // boxes[row][col] : row = 0..gridRows-1, col = 0..gridCols-1
        boxes = Array.from({ length: gridRows }, () => Array(gridCols).fill(null));
        boxScores = [0, 0];
        gameOver = false;
        turnManager.reset();
        undoStack.clear();
        renderBoard();
        updateTurnIndicator(0);
        updateBoxCounter();
    }

    function renderBoard() {
        const boardEl = document.getElementById('db-board');
        boardEl.innerHTML = '';

        const totalWidth = (dotCols - 1) * gap + DOT_SIZE;
        const totalHeight = (dotRows - 1) * gap + DOT_SIZE;
        boardEl.style.width = totalWidth + 'px';
        boardEl.style.height = totalHeight + 'px';
        boardEl.style.position = 'relative';

        // Draw boxes
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                const box = document.createElement('div');
                box.className = 'db-box';
                box.id = `db-box-${r}-${c}`;
                box.style.left = (c * gap + DOT_SIZE) + 'px';
                box.style.top = (r * gap + DOT_SIZE) + 'px';
                box.style.width = (gap - DOT_SIZE) + 'px';
                box.style.height = (gap - DOT_SIZE) + 'px';

                if (boxes[r][c] !== null) {
                    box.classList.add(`db-box--p${boxes[r][c] + 1}`);
                    box.textContent = boxes[r][c] === 0 ? '★' : '✦';
                }

                boardEl.appendChild(box);
            }
        }

        // Draw horizontal lines
        for (let r = 0; r < dotRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                const line = document.createElement('div');
                line.className = 'db-line db-line--h';
                line.id = `db-hline-${r}-${c}`;
                line.style.left = (c * gap + DOT_SIZE) + 'px';
                line.style.top = (r * gap + DOT_SIZE / 2 - 3) + 'px';
                line.style.width = (gap - DOT_SIZE) + 'px';

                if (hLines[r][c] !== null) {
                    line.classList.add('db-line--drawn', `db-line--p${hLines[r][c] + 1}`);
                }

                line.addEventListener('click', () => handleLineClick('h', r, c));
                boardEl.appendChild(line);
            }
        }

        // Draw vertical lines
        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < dotCols; c++) {
                const line = document.createElement('div');
                line.className = 'db-line db-line--v';
                line.id = `db-vline-${r}-${c}`;
                line.style.left = (c * gap + DOT_SIZE / 2 - 3) + 'px';
                line.style.top = (r * gap + DOT_SIZE) + 'px';
                line.style.height = (gap - DOT_SIZE) + 'px';

                if (vLines[r][c] !== null) {
                    line.classList.add('db-line--drawn', `db-line--p${vLines[r][c] + 1}`);
                }

                line.addEventListener('click', () => handleLineClick('v', r, c));
                boardEl.appendChild(line);
            }
        }

        // Draw dots (on top of everything)
        for (let r = 0; r < dotRows; r++) {
            for (let c = 0; c < dotCols; c++) {
                const dot = document.createElement('div');
                dot.className = 'db-dot';
                dot.style.left = (c * gap) + 'px';
                dot.style.top = (r * gap) + 'px';
                boardEl.appendChild(dot);
            }
        }
    }

    function handleLineClick(type, r, c) {
        if (gameOver) return;

        // Check if already drawn
        if (type === 'h' && hLines[r][c] !== null) {
            showToast('Line already drawn!', 'warning');
            return;
        }
        if (type === 'v' && vLines[r][c] !== null) {
            showToast('Line already drawn!', 'warning');
            return;
        }

        const player = turnManager.getPlayerIndex();

        // Save state for undo
        undoStack.push({
            hLines: hLines.map(row => [...row]),
            vLines: vLines.map(row => [...row]),
            boxes: boxes.map(row => [...row]),
            boxScores: [...boxScores],
            player
        });

        // Draw line
        if (type === 'h') {
            hLines[r][c] = player;
        } else {
            vLines[r][c] = player;
        }

        // Animate line
        const lineId = type === 'h' ? `db-hline-${r}-${c}` : `db-vline-${r}-${c}`;
        const lineEl = document.getElementById(lineId);
        lineEl.classList.add('db-line--drawn', `db-line--p${player + 1}`);
        anime({
            targets: lineEl,
            scaleX: type === 'h' ? [0, 1] : 1,
            scaleY: type === 'v' ? [0, 1] : 1,
            duration: 250,
            easing: 'easeOutCubic'
        });

        // Check if any boxes completed
        const completed = checkBoxCompletion(type, r, c, player);

        if (completed > 0) {
            updateBoxCounter();
            // Extra turn for the current player
            showToast(`${PLAYER_NAMES[player]} completed ${completed} box${completed > 1 ? 'es' : ''}! Extra turn!`, 'success');
        } else {
            // Switch turn
            turnManager.switchTurn();
            updateTurnIndicator(turnManager.getPlayerIndex());
        }

        // Check if game is over
        const totalBoxes = gridRows * gridCols;
        if (boxScores[0] + boxScores[1] >= totalBoxes) {
            gameOver = true;
            let winner = null;
            if (boxScores[0] > boxScores[1]) winner = 0;
            else if (boxScores[1] > boxScores[0]) winner = 1;

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
    }

    function checkBoxCompletion(type, r, c, player) {
        let completed = 0;

        // For a horizontal line at (r, c), it borders:
        //   box above: (r-1, c) if r > 0
        //   box below: (r, c) if r < gridRows
        // For a vertical line at (r, c), it borders:
        //   box left: (r, c-1) if c > 0
        //   box right: (r, c) if c < gridCols

        const adjacentBoxes = [];
        if (type === 'h') {
            if (r > 0) adjacentBoxes.push([r - 1, c]);
            if (r < gridRows) adjacentBoxes.push([r, c]);
        } else {
            if (c > 0) adjacentBoxes.push([r, c - 1]);
            if (c < gridCols) adjacentBoxes.push([r, c]);
        }

        for (const [br, bc] of adjacentBoxes) {
            if (br < 0 || br >= gridRows || bc < 0 || bc >= gridCols) continue;
            if (boxes[br][bc] !== null) continue;

            if (isBoxComplete(br, bc)) {
                boxes[br][bc] = player;
                boxScores[player]++;
                completed++;

                // Animate box fill
                const boxEl = document.getElementById(`db-box-${br}-${bc}`);
                boxEl.classList.add(`db-box--p${player + 1}`);
                boxEl.textContent = player === 0 ? '★' : '✦';
                anime({
                    targets: boxEl,
                    scale: [0.5, 1],
                    opacity: [0, 1],
                    duration: 400,
                    easing: 'easeOutBack'
                });
            }
        }

        return completed;
    }

    function isBoxComplete(r, c) {
        // Top edge
        if (hLines[r][c] === null) return false;
        // Bottom edge
        if (hLines[r + 1][c] === null) return false;
        // Left edge
        if (vLines[r][c] === null) return false;
        // Right edge
        if (vLines[r][c + 1] === null) return false;
        return true;
    }

    function undo() {
        if (!undoStack.canUndo() || gameOver) {
            showToast('Nothing to undo', 'warning');
            return;
        }
        const state = undoStack.pop();
        hLines = state.hLines;
        vLines = state.vLines;
        boxes = state.boxes;
        boxScores = state.boxScores;
        turnManager.current = state.player;
        renderBoard();
        updateTurnIndicator(state.player);
        updateBoxCounter();
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
            hLines: hLines.map(r => [...r]),
            vLines: vLines.map(r => [...r]),
            boxes: boxes.map(r => [...r]),
            boxScores: [...boxScores],
            player: turnManager.getPlayerIndex(),
            gameOver
        };
    }

    return { init, destroy, restart, undo, getState };
})();
