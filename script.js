document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const message = document.getElementById('message');
    const resetBtn = document.getElementById('reset-btn');
    const diffButtons = document.querySelectorAll('.difficulty-buttons button');
    const currentDiffText = document.getElementById('current-difficulty');

    // --- State Game ---
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X'; // Pemain selalu 'X'
    let isGameActive = true;
    let difficulty = 'easy'; // Default

    const player = 'X';
    const bot = 'O';

    // --- Win Conditions ---
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Baris
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Kolom
        [0, 4, 8], [2, 4, 6]             // Diagonal
    ];

    // --- Fungsi Utama ---

    function handleCellClick(e) {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (gameBoard[clickedCellIndex] !== '' || !isGameActive || currentPlayer !== player) {
            return;
        }

        makeMove(clickedCell, clickedCellIndex, player);

        if (isGameActive) {
            currentPlayer = bot;
            message.textContent = "Giliran BOT (O)...";
            setTimeout(botMove, 700); // Tunda agar terlihat seperti berpikir
        }
    }

    function makeMove(cellElement, index, mark) {
        gameBoard[index] = mark;
        cellElement.textContent = mark;
        cellElement.classList.add(mark.toLowerCase());

        checkResult();
        if (isGameActive) {
            currentPlayer = mark === player ? bot : player;
        }
    }

    function checkResult() {
        let roundWon = false;
        for (let i = 0; i < winConditions.length; i++) {
            const winCondition = winConditions[i];
            let a = gameBoard[winCondition[0]];
            let b = gameBoard[winCondition[1]];
            let c = gameBoard[winCondition[2]];

            if (a === '' || b === '' || c === '') {
                continue;
            }
            if (a === b && b === c) {
                roundWon = true;
                // Highlight sel pemenang
                winCondition.forEach(index => {
                    cells[index].style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
                });
                break;
            }
        }

        if (roundWon) {
            message.textContent = `Pemain ${currentPlayer === bot ? player : bot} MENANG! 🎉`;
            isGameActive = false;
            return;
        }

        // Cek Seri (Tie)
        let roundDraw = !gameBoard.includes('');
        if (roundDraw) {
            message.textContent = `Permainan SERI! 🤝`;
            isGameActive = false;
            return;
        }

        // Hanya memperbarui pesan jika game masih aktif
        if (isGameActive) {
            message.textContent = `Giliran Anda (${player})`;
        }
    }

    // --- Logic Bot ---
    function getAvailableSpots(board) {
        return board.map((val, index) => val === '' ? index : null).filter(val => val !== null);
    }

    function botMove() {
        if (!isGameActive) return;

        let moveIndex;
        const availableSpots = getAvailableSpots(gameBoard);

        if (availableSpots.length === 0) return; // Seharusnya sudah terdeteksi seri

        switch (difficulty) {
            case 'easy':
                moveIndex = easyAI(availableSpots);
                break;
            case 'medium':
                moveIndex = mediumAI(availableSpots);
                break;
            case 'hard':
                moveIndex = hardAI(gameBoard);
                break;
            default:
                moveIndex = easyAI(availableSpots); // Fallback
        }

        if (moveIndex !== undefined && gameBoard[moveIndex] === '') {
            const botCell = cells[moveIndex];
            makeMove(botCell, moveIndex, bot);
        }
    }

    // AI Level 1: Easy (Random)
    function easyAI(availableSpots) {
        const randomIndex = Math.floor(Math.random() * availableSpots.length);
        return availableSpots[randomIndex];
    }

    // AI Level 2: Medium (Block/Win, then Random)
    function mediumAI(availableSpots) {
        // 1. Cek apakah BOT bisa menang
        for (let i = 0; i < availableSpots.length; i++) {
            const index = availableSpots[i];
            gameBoard[index] = bot;
            if (checkWinner(gameBoard, bot)) {
                gameBoard[index] = ''; // Batalkan simulasi
                return index;
            }
            gameBoard[index] = ''; // Batalkan simulasi
        }

        // 2. Cek apakah Pemain harus diblokir
        for (let i = 0; i < availableSpots.length; i++) {
            const index = availableSpots[i];
            gameBoard[index] = player;
            if (checkWinner(gameBoard, player)) {
                gameBoard[index] = ''; // Batalkan simulasi
                return index;
            }
            gameBoard[index] = ''; // Batalkan simulasi
        }

        // 3. Jika tidak ada ancaman/kemenangan, pilih acak
        return easyAI(availableSpots);
    }

    // Fungsi pembantu untuk checkWinner (digunakan dalam simulasi AI)
    function checkWinner(board, mark) {
        for (let i = 0; i < winConditions.length; i++) {
            const [a, b, c] = winConditions[i];
            if (board[a] === mark && board[b] === mark && board[c] === mark) {
                return true;
            }
        }
        return false;
    }

    // AI Level 3: Hard (Minimax Algorithm)
    function hardAI(newBoard) {
        return minimax(newBoard, bot).index;
    }

    function minimax(newBoard, currentMark) {
        const availableSpots = getAvailableSpots(newBoard);

        // Kasus Terminal
        if (checkWinner(newBoard, player)) {
            return { score: -10 };
        } else if (checkWinner(newBoard, bot)) {
            return { score: 10 };
        } else if (availableSpots.length === 0) {
            return { score: 0 };
        }

        let moves = [];

        for (let i = 0; i < availableSpots.length; i++) {
            let move = {};
            move.index = availableSpots[i];

            newBoard[availableSpots[i]] = currentMark;

            if (currentMark === bot) {
                let result = minimax(newBoard, player);
                move.score = result.score;
            } else {
                let result = minimax(newBoard, bot);
                move.score = result.score;
            }

            newBoard[availableSpots[i]] = ''; // Reset spot

            moves.push(move);
        }

        let bestMove;
        if (currentMark === bot) {
            // Bot mencoba memaksimalkan skor
            let bestScore = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = moves[i];
                }
            }
        } else {
            // Pemain mencoba meminimalkan skor (skor bot)
            let bestScore = Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = moves[i];
                }
            }
        }

        return bestMove;
    }


    // --- Reset dan Inisialisasi ---
    function startGame() {
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        isGameActive = true;
        currentPlayer = player;
        message.textContent = `Giliran Anda (${player})`;

        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
            cell.style.backgroundColor = 'white'; // Hapus highlight
            cell.addEventListener('click', handleCellClick, { once: true });
        });
    }

    function handleDifficultyChange(e) {
        const newDifficulty = e.target.id.split('-')[0];
        if (difficulty === newDifficulty) return; // Tidak perlu ganti jika sama

        difficulty = newDifficulty;
        currentDiffText.innerHTML = `Kesulitan Saat Ini: **${difficulty.toUpperCase()}**`;

        // Update tampilan tombol
        diffButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Mulai ulang game dengan kesulitan baru
        startGame();
    }


    // --- Event Listeners ---
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetBtn.addEventListener('click', startGame);
    diffButtons.forEach(btn => btn.addEventListener('click', handleDifficultyChange));

    // Mulai game pertama kali
    startGame();
});