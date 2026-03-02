/* ============================================
   BATTLESHIP
   ============================================ */

const Battleship = (() => {
    const SIZE = 10;
    const PLAYER_NAMES = ['Player 1', 'Player 2'];

    const SHIPS = [
        { name: 'Carrier', size: 5, symbol: 'C' },
        { name: 'Battleship', size: 4, symbol: 'B' },
        { name: 'Cruiser', size: 3, symbol: 'R' },
        { name: 'Submarine', size: 2, symbol: 'S' },
        { name: 'Destroyer', size: 2, symbol: 'D' }
    ];

    const PHASES = { SETUP_P1: 0, SETUP_P2: 1, BATTLE: 2, OVER: 3 };

    let boards, shots, ships;
    let phase, currentPlayer, shipIndex, isHorizontal;
    let scoreTracker, container;

    function init(el) {
        container = el;
        scoreTracker = new ScoreTracker('battleship');
        startNewRound();
    }

    function startNewRound() {
        boards = [
            Array.from({ length: SIZE }, () => Array(SIZE).fill(null)),
            Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
        ];
        shots = [
            Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
            Array.from({ length: SIZE }, () => Array(SIZE).fill(false))
        ];
        ships = [[], []]; // Track placed ships per player
        phase = PHASES.SETUP_P1;
        currentPlayer = 0;
        shipIndex = 0;
        isHorizontal = true;
        renderSetup();
    }

    function renderSetup() {
        const player = phase === PHASES.SETUP_P1 ? 0 : 1;
        const ship = SHIPS[shipIndex];

        container.innerHTML = `
            <div class="bs-setup-header">
                <h2 class="bs-setup-title" style="color: ${player === 0 ? 'var(--player1-color)' : 'var(--player2-color)'};">
                    ${PLAYER_NAMES[player]} — Place Your Ships
                </h2>
                <p class="bs-setup-info" style="color: var(--text-secondary); margin: var(--space-sm) 0;">
                    Placing: <strong>${ship.name}</strong> (${ship.size} cells)
                </p>
                <div class="bs-setup-controls" style="margin-bottom: var(--space-md); display: flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn--outline btn--sm" id="bs-rotate-btn">🔄 Rotate (${isHorizontal ? 'Horizontal' : 'Vertical'})</button>
                    <button class="btn btn--outline btn--sm" id="bs-random-btn">🎲 Random Placement</button>
                    <button class="btn btn--outline btn--sm" id="bs-lobby-btn">🏠 Lobby</button>
                </div>
                <div class="bs-ship-list" id="bs-ship-list" style="margin-bottom: var(--space-md); display: flex; gap: var(--space-sm); justify-content: center;"></div>
            </div>
            <div class="bs-board" id="bs-setup-board"></div>
        `;

        // Ship list display
        const shipListEl = document.getElementById('bs-ship-list');
        SHIPS.forEach((s, i) => {
            const chip = document.createElement('span');
            chip.style.cssText = `padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; border: 1px solid var(--border-glass);`;
            if (i < shipIndex) {
                chip.style.background = 'rgba(0, 230, 118, 0.2)';
                chip.style.color = 'var(--success)';
                chip.textContent = `✓ ${s.name}`;
            } else if (i === shipIndex) {
                chip.style.background = 'rgba(0, 240, 255, 0.15)';
                chip.style.color = 'var(--accent-cyan)';
                chip.textContent = `▸ ${s.name}`;
            } else {
                chip.style.background = 'var(--bg-glass)';
                chip.style.color = 'var(--text-muted)';
                chip.textContent = s.name;
            }
            shipListEl.appendChild(chip);
        });

        // Render setup board
        const boardEl = document.getElementById('bs-setup-board');
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'bs-cell';
                cell.id = `bs-setup-${r}-${c}`;

                if (boards[player][r][c] !== null) {
                    cell.classList.add('bs-cell--ship');
                }

                cell.addEventListener('click', () => handleSetupClick(r, c));
                cell.addEventListener('mouseenter', () => showShipPreview(r, c, player));
                cell.addEventListener('mouseleave', clearShipPreview);
                boardEl.appendChild(cell);
            }
        }

        // Buttons
        document.getElementById('bs-rotate-btn').addEventListener('click', () => {
            isHorizontal = !isHorizontal;
            document.getElementById('bs-rotate-btn').textContent = `🔄 Rotate (${isHorizontal ? 'Horizontal' : 'Vertical'})`;
        });

        document.getElementById('bs-random-btn').addEventListener('click', () => {
            randomPlacement(player);
        });

        document.getElementById('bs-lobby-btn').addEventListener('click', () => {
            window.location.hash = '#/';
        });
    }

    function showShipPreview(row, col, player) {
        clearShipPreview();
        const ship = SHIPS[shipIndex];
        const cells = getShipCells(row, col, ship.size, isHorizontal);

        if (!cells || !canPlace(cells, player)) return;

        for (const [r, c] of cells) {
            const cell = document.getElementById(`bs-setup-${r}-${c}`);
            if (cell && !cell.classList.contains('bs-cell--ship')) {
                cell.style.background = 'rgba(0, 240, 255, 0.25)';
            }
        }
    }

    function clearShipPreview() {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.getElementById(`bs-setup-${r}-${c}`);
                if (cell && !cell.classList.contains('bs-cell--ship')) {
                    cell.style.background = '';
                }
            }
        }
    }

    function getShipCells(row, col, size, horizontal) {
        const cells = [];
        for (let i = 0; i < size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            if (r >= SIZE || c >= SIZE) return null;
            cells.push([r, c]);
        }
        return cells;
    }

    function canPlace(cells, player) {
        return cells.every(([r, c]) => boards[player][r][c] === null);
    }

    function handleSetupClick(row, col) {
        const player = phase === PHASES.SETUP_P1 ? 0 : 1;
        const ship = SHIPS[shipIndex];
        const cells = getShipCells(row, col, ship.size, isHorizontal);

        if (!cells || !canPlace(cells, player)) {
            showToast('Cannot place ship here!', 'warning');
            return;
        }

        // Place ship
        for (const [r, c] of cells) {
            boards[player][r][c] = shipIndex;
        }
        ships[player].push({ ...ship, cells, sunk: false });

        shipIndex++;
        if (shipIndex >= SHIPS.length) {
            if (phase === PHASES.SETUP_P1) {
                // Switch to Player 2 setup
                phase = PHASES.SETUP_P2;
                shipIndex = 0;
                isHorizontal = true;
                showTransitionScreen(1);
            } else {
                // Start battle!
                phase = PHASES.BATTLE;
                currentPlayer = 0;
                renderBattle();
            }
        } else {
            renderSetup();
        }
    }

    function randomPlacement(player) {
        // Reset board for this player
        boards[player] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
        ships[player] = [];

        for (let i = shipIndex; i < SHIPS.length; i++) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                const horizontal = Math.random() < 0.5;
                const row = Math.floor(Math.random() * SIZE);
                const col = Math.floor(Math.random() * SIZE);
                const cells = getShipCells(row, col, SHIPS[i].size, horizontal);

                if (cells && canPlace(cells, player)) {
                    for (const [r, c] of cells) {
                        boards[player][r][c] = i;
                    }
                    ships[player].push({ ...SHIPS[i], cells, sunk: false });
                    placed = true;
                }
                attempts++;
            }
        }

        shipIndex = SHIPS.length;

        if (phase === PHASES.SETUP_P1) {
            phase = PHASES.SETUP_P2;
            shipIndex = 0;
            isHorizontal = true;
            showTransitionScreen(1);
        } else {
            phase = PHASES.BATTLE;
            currentPlayer = 0;
            renderBattle();
        }
    }

    function showTransitionScreen(nextPlayer) {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height: 60vh; text-align: center;">
                <h2 style="color: var(--text-primary); margin-bottom: var(--space-lg);">🔄 Pass the device to ${PLAYER_NAMES[nextPlayer]}</h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-xl);">${PLAYER_NAMES[nextPlayer]}, it's your turn to place ships.</p>
                <div style="display: flex; gap: var(--space-md); justify-content: center;">
                    <button class="btn btn--primary" id="bs-ready-btn">I'm Ready!</button>
                    <button class="btn btn--outline" id="bs-trans-lobby-btn">🏠 Lobby</button>
                </div>
            </div>
        `;
        document.getElementById('bs-ready-btn').addEventListener('click', () => {
            renderSetup();
        });
        document.getElementById('bs-trans-lobby-btn').addEventListener('click', () => {
            window.location.hash = '#/';
        });
    }

    function renderBattle() {
        const opponent = 1 - currentPlayer;

        container.innerHTML = `
            ${buildTurnIndicator(PLAYER_NAMES)}
            <div class="bs-boards" id="bs-boards">
                <div class="bs-board-container">
                    <div class="bs-board-label" style="color: ${currentPlayer === 0 ? 'var(--player1-color)' : 'var(--player2-color)'}">
                        Your Fleet
                    </div>
                    <div class="bs-board" id="bs-own-board"></div>
                </div>
                <div class="bs-board-container">
                    <div class="bs-board-label" style="color: var(--text-primary);">
                        Enemy Waters — Fire!
                    </div>
                    <div class="bs-board" id="bs-attack-board"></div>
                </div>
            </div>
            <div class="bs-fleet-status" id="bs-fleet-status" style="margin-top: var(--space-md); display: flex; gap: var(--space-sm); justify-content: center; flex-wrap: wrap;"></div>
        `;
        container.appendChild(buildControlBar({
            onUndo: () => showToast('No undo in Battleship!', 'warning'),
            onRestart: restart
        }));

        updateTurnIndicator(currentPlayer);

        // Own board — show ships
        const ownBoardEl = document.getElementById('bs-own-board');
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'bs-cell';

                if (boards[currentPlayer][r][c] !== null) {
                    cell.classList.add('bs-cell--ship');
                }

                // Show opponent shots on our board
                if (shots[opponent][r][c]) {
                    if (boards[currentPlayer][r][c] !== null) {
                        cell.classList.add('bs-cell--hit');
                    } else {
                        cell.classList.add('bs-cell--miss');
                    }
                    cell.classList.add('bs-cell--shot');
                }

                ownBoardEl.appendChild(cell);
            }
        }

        // Attack board — show our shots on opponent
        const attackBoardEl = document.getElementById('bs-attack-board');
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'bs-cell';

                if (shots[currentPlayer][r][c]) {
                    if (boards[opponent][r][c] !== null) {
                        cell.classList.add('bs-cell--hit');
                        // Check if ship is sunk
                        const shipIdx = boards[opponent][r][c];
                        const ship = ships[opponent][shipIdx];
                        if (ship && ship.sunk) {
                            cell.classList.add('bs-cell--sunk');
                        }
                    } else {
                        cell.classList.add('bs-cell--miss');
                    }
                    cell.classList.add('bs-cell--shot');
                }

                cell.addEventListener('click', () => handleAttack(r, c));
                attackBoardEl.appendChild(cell);
            }
        }

        // Fleet status
        renderFleetStatus();
    }

    function renderFleetStatus() {
        const opponent = 1 - currentPlayer;
        const statusEl = document.getElementById('bs-fleet-status');
        if (!statusEl) return;
        statusEl.innerHTML = '';

        ships[opponent].forEach(ship => {
            const chip = document.createElement('span');
            chip.style.cssText = `padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; border: 1px solid var(--border-glass);`;
            if (ship.sunk) {
                chip.style.background = 'rgba(255, 23, 68, 0.2)';
                chip.style.color = 'var(--danger)';
                chip.textContent = `✕ ${ship.name}`;
                chip.style.textDecoration = 'line-through';
            } else {
                chip.style.background = 'var(--bg-glass)';
                chip.style.color = 'var(--text-muted)';
                chip.textContent = ship.name;
            }
            statusEl.appendChild(chip);
        });
    }

    function handleAttack(row, col) {
        if (phase !== PHASES.BATTLE) return;

        const opponent = 1 - currentPlayer;

        if (shots[currentPlayer][row][col]) {
            showToast('Already fired here!', 'warning');
            return;
        }

        // Fire shot
        shots[currentPlayer][row][col] = true;

        const isHit = boards[opponent][row][col] !== null;

        if (isHit) {
            showToast('💥 Hit!', 'success');

            // Check if ship is sunk
            const shipIdx = boards[opponent][row][col];
            const ship = ships[opponent][shipIdx];
            if (ship && isShipSunk(ship, currentPlayer)) {
                ship.sunk = true;
                showToast(`🔥 ${ship.name} sunk!`, 'success');
            }

            // Check for win
            if (ships[opponent].every(s => s.sunk)) {
                phase = PHASES.OVER;
                scoreTracker.recordWin(currentPlayer);
                renderBattle();
                setTimeout(() => {
                    showResultModal({
                        winner: currentPlayer,
                        playerNames: PLAYER_NAMES,
                        scores: scoreTracker.getScores(),
                        onRestart: restart,
                        onLobby: () => { window.location.hash = '#/'; }
                    });
                }, 800);
                return;
            }
        } else {
            showToast('💨 Miss!', 'info');
        }

        // Animate the shot
        renderBattle();

        // On a hit, same player gets another turn; on a miss, switch turns
        if (phase === PHASES.BATTLE) {
            if (isHit) {
                showToast('🎯 Extra turn! Fire again!', 'success');
            } else {
                setTimeout(() => {
                    currentPlayer = 1 - currentPlayer;
                    showBattleTransition();
                }, 1200);
            }
        }
    }

    function showBattleTransition() {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height: 60vh; text-align: center;">
                <h2 style="color: ${currentPlayer === 0 ? 'var(--player1-color)' : 'var(--player2-color)'}; margin-bottom: var(--space-lg);">
                    ${PLAYER_NAMES[currentPlayer]}'s Turn
                </h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-xl);">Pass the device and click when ready.</p>
                <div style="display: flex; gap: var(--space-md); justify-content: center;">
                    <button class="btn btn--primary" id="bs-battle-ready-btn">Fire Away! 🎯</button>
                    <button class="btn btn--outline" id="bs-battle-lobby-btn">🏠 Lobby</button>
                </div>
            </div>
        `;
        document.getElementById('bs-battle-ready-btn').addEventListener('click', () => {
            renderBattle();
        });
        document.getElementById('bs-battle-lobby-btn').addEventListener('click', () => {
            window.location.hash = '#/';
        });
    }

    function isShipSunk(ship, attacker) {
        return ship.cells.every(([r, c]) => shots[attacker][r][c]);
    }

    function undo() {
        showToast('No undo in Battleship!', 'warning');
    }

    function restart() {
        startNewRound();
    }

    function destroy() {
        container.innerHTML = '';
    }

    function getState() {
        return { phase, currentPlayer };
    }

    return { init, destroy, restart, undo, getState };
})();
