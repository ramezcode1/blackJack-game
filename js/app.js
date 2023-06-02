let deck = [];

let dealer = {
    cardSum: 0,
    aceCount: 0,
    cardContainer: document.querySelector(".dealer-cards"),
    sumContainer: document.querySelector(".dealer-sum")
}

let player = {
    cardSum: 0,
    aceCount: 0,
    cardContainer: document.querySelector(".player-cards"),
    sumContainer: document.querySelector(".player-sum")
}

let hiddenCard = '';
let hiddenCardValue = 0;
let chipsBalance = 1000;
let currentBet = 0;

const imgCardPath = './images/cards';

const buildDeck = () => {
    let values = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    let types = ["clubs", "diamonds", "hearts", "spades"];

    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < values.length; j++) {
            let card = {
                value: values[j],
                type: types[i]
            }
            deck.push(card);
        }
    }
}

const shuffleDeck = () => {
    for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length);
        let temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
}

const animationDelay = () => {
    return new Promise(resolve => {
        setTimeout(() => resolve(), 750);
    });
}

const dealTwoCards = async () => {
    document.getElementById("hit").disabled = true;
    document.getElementById("stand").disabled = true;
    distributeCard(player);
    await animationDelay();
    distributeCard(dealer, true);
    await animationDelay();
    distributeCard(player);
    await animationDelay();
    distributeCard(dealer);
    document.getElementById("hit").disabled = false;
    document.getElementById("stand").disabled = false;
}

const distributeCard = (hand, hidden = false) => {
    let card = deck.pop();  // draw the last card
    if (hidden) {
        hiddenCard = card;
        hiddenCardValue = getCardValue(card);
    }
    hand.cardSum += getCardValue(card);
    if (card.value === 'ace') {
        hand.aceCount++;
    }
    // create image card
    let cardImg = document.createElement("img");
    let imgCardName = '';
    if (hidden) {
        imgCardName = 'back-blue';
        cardImg.id = "hiddenCard";
    } else {
        imgCardName = card.type + "_" + card.value;
    }
    cardImg.src = `${imgCardPath}/${imgCardName}.svg`;

    let cardElm = document.createElement("div");
    cardElm.classList.add("card-col", "slide-bottom");
    cardElm.appendChild(cardImg);
    hand.cardContainer.appendChild(cardElm);

    updateSumContainer(hand);
}

const getCardValue = (card) => {
    let value = card.value;
    if (isNaN(value)) { //ace, jack, queen, king
        return value === "ace" ? 11 : 10;
    }
    return Number(value);
}

const hit = () => {
    if (currentBet === 0) {
        openMsgModal("You need to Bet first!");
        return;
    }
    distributeCard(player);
    reduceAce(player);
    if (player.cardSum > 21) {
        checkWinner();
    }
}

const stand = () => {
    if (currentBet === 0) {
        openMsgModal("You need to Bet first!");
        return;
    }
    while (dealer.cardSum < 17) {   //dealer should have at least 17
        distributeCard(dealer);
        reduceAce(dealer);
    }
    checkWinner();
}

const checkWinner = () => {
    let message = "";
    if (player.cardSum > 21) {
        message = "You Lose!";
    } else if (dealer.cardSum > 21) {
        message = "You Win!";
        chipsBalance += currentBet * 2;
        updateBalanceContainer();
    } else if (player.cardSum === dealer.cardSum) {
        message = "Tie!";
        chipsBalance += currentBet;
        updateBalanceContainer();
    } else if (player.cardSum > dealer.cardSum) {
        message = "You Win!";
        chipsBalance += currentBet * 2;
        updateBalanceContainer();
    } else if (player.cardSum < dealer.cardSum) {
        message = "You Lose!";
    }
    flipCard();
    openMsgModal(message, true);
}
// flip the dealer hidden card
const flipCard = () => {
    const hiddenCardEl = document.getElementById("hiddenCard");
    hiddenCardEl.classList.add("flip-vertical-left");
    hiddenCardEl.src = `${imgCardPath}/${hiddenCard.type}_${hiddenCard.value}.svg`;
    updateSumContainer(dealer, true);
}

const openMsgModal = (message, reset = false) => {
    const msgModalEl = document.querySelector('#messageModal');
    const msgModal = new bootstrap.Modal(msgModalEl);

    msgModalEl.addEventListener('show.bs.modal', displayMessage);
    msgModalEl.dataset.msg = message;
    msgModal.show();
    setTimeout(() => msgModal.hide(), 5000);
    if (reset) {
        msgModalEl.addEventListener('hidden.bs.modal', resetGame);
    }
}

const displayMessage = (event) => {
    const messageEl = event.target.querySelector('.message-el');
    const message = event.target.dataset.msg;
    messageEl.textContent = message;
    // reset element color text style
    messageEl.classList.remove("text-success", "text-danger", "text-white");
    if (message.includes("Win")) {
        messageEl.classList.add("text-success");
    } else if (message.includes(("Lose"))) {
        messageEl.classList.add("text-danger");
    } else {
        messageEl.classList.add("text-white");
    }
}
// Modal show up on Game Over
const openStartModal = () => {
    const modalEl = document.querySelector('#startModal');
    const startModal = new bootstrap.Modal(modalEl, {
        keyboard: false,
        backdrop: false
    });

    startModal.show();
    document.getElementById("new-game-btn").addEventListener("click", () => window.location.reload());
}

const closeBetModal = () => {
    if (currentBet > 0) {
        bootstrap.Modal.getOrCreateInstance('#betModal').hide();
        dealTwoCards();
        document.getElementById("bet").disabled = true;
    }
}

const updateSumContainer = (hand, flipped = false) => {
    hand.sumContainer.textContent = hand === player || flipped ? hand.cardSum : `${hand.cardSum - hiddenCardValue}`;
}

const updateBalanceContainer = () => {
    const betContainers = document.querySelectorAll(".chips-balance");
    for (const container of betContainers) {
        container.textContent = chipsBalance + '$';
    }
}

const updateBetContainer = () => {
    document.getElementById("bitInput").value = currentBet + '$';
    document.getElementById("bet").textContent = currentBet + '$';
}

const setBet = (evt) => {
    chipValue = Number(evt.target.dataset.value);
    if (chipsBalance >= chipValue) {
        currentBet += chipValue;
        chipsBalance -= chipValue;
        updateBetContainer();
        updateBalanceContainer();
    }
}
//  Ace is either 11 or 1
const reduceAce = (hand) => {
    if (hand.cardSum > 21 && hand.aceCount > 0) {
        hand.cardSum -= 10;
        hand.aceCount--;
        updateSumContainer(hand);
    }
}

const resetGame = () => {
    if (chipsBalance === 0) {
        // Game Over when you have no more chips
        openStartModal();
        return;
    }
    // reset game variable to default
    deck = [];
    dealer.cardSum = dealer.aceCount = 0;
    dealer.sumContainer.textContent = '0';
    dealer.cardContainer.innerHTML = '';

    player.cardSum = player.aceCount = 0;
    player.cardContainer.innerHTML = '';
    player.sumContainer.textContent = '0';

    hiddenCard = '';
    hiddenCardValue = 0;
    currentBet = 0;
    updateBetContainer();
    document.getElementById("bet").disabled = false;
    startGame();
}

const startGame = () => {
    buildDeck();
    shuffleDeck();

    document.getElementById("hit").addEventListener("click", hit);
    document.getElementById("stand").addEventListener("click", stand);
    document.querySelector(".betting-chips").addEventListener("click", setBet);
    document.getElementById("placeBetBtn").addEventListener("click", closeBetModal);
}

startGame();

