const headers = {
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9,hi;q=0.8",
  "content-type": "application/json",
  priority: "u=1, i",
  "sec-ch-ua":
    '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
  "sec-ch-ua-arch": '"x86"',
  "sec-ch-ua-bitness": '"64"',
  "sec-ch-ua-full-version": '"136.0.7103.48"',
  "sec-ch-ua-full-version-list":
    '"Chromium";v="136.0.7103.48", "Google Chrome";v="136.0.7103.48", "Not.A/Brand";v="99.0.0.0"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-model": '""',
  "sec-ch-ua-platform": '"Windows"',
  "sec-ch-ua-platform-version": '"19.0.0"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "x-lockdown-token": "s5MNWtjTM5TvCMkAzxov",
  Referer: "https://stake.ac/casino/games/flip",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "x-access-token": getCookie("session"),
  cookie: document.cookie,
};

function getCookie(name) {
  const cookiesString = document.cookie;
  const cookies = cookiesString.split("; ");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

const number = (number) => {
  return Number(number.toFixed(2));
};

const generateIdentifier = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const specialCharacters = "_-";
  let result = "";
  let specialCharAdded = false;

  for (let i = 0; i < length; i++) {
    if (
      !specialCharAdded &&
      i < length / 2 &&
      Math.random() < 1 / (length - i)
    ) {
      result += specialCharacters.charAt(
        Math.floor(Math.random() * specialCharacters.length)
      );
      specialCharAdded = true;
    } else {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
  }

  return result;
};

const generateRandomBet = ({ min, max, float = true }) => {
  const randomNumber = Math.random() * (max - min) + min;
  return float ? number(randomNumber) : Math.ceil(randomNumber);
};

const executeBets = async () => {
  const amount = generateRandomBet({ min: 0.4, max: 1 });
  const mode = generateRandomBet({
    min: 1,
    max: 4,
    float: false,
  });
  const difficulty = ["easy", "medium", "hard", "expert"][mode - 1];

  const response = await fetch("https://stake.ac/_api/casino/cases/bet", {
    headers,
    referrer: "https://stake.ac/casino/games/cases",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      amount: amount,
      currency: "inr",
      identifier: generateIdentifier(21),
      difficulty,
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });

  const data = await response.json();
  const payout = number(data?.casesBet?.payout);
  const payoutMultiplier = number(data?.casesBet?.payoutMultiplier);

  return {
    target: payoutMultiplier,
    amount,
    payout,
    active: payout > amount,
    difficulty,
  };
};

let betDetails = {
  totalBets: 0,
  betsWin: 0,
  betsLose: 0,
  totalAmount: 0,
  winningAmount: 0,
};

let highestBet = {
  target: 0,
  amount: 0,
  payout: 0,
  difficulty: "",
};

let winStreak = 0;
let loseStreak = 0;
let highstWinStreak = 0;
let highestLoseStreak = 0;

const printResult = ({ active, payout, amount, target, difficulty }) => {
  const totalBets = betDetails.totalBets + 1;
  const betsWin = betDetails.betsWin + (active ? 1 : 0);
  const betsLose = totalBets - betsWin;
  const totalAmount = number(betDetails.totalAmount + amount);
  const winningAmount = number(betDetails.winningAmount + payout);
  const winRate = number((betsWin / totalBets) * 100);
  const netWinning = number(winningAmount - totalAmount);

  betDetails = { totalBets, betsWin, betsLose, totalAmount, winningAmount };
  if (payout > highestBet.payout) {
    highestBet.target = target;
    highestBet.amount = amount;
    highestBet.payout = number(payout);
    highestBet.difficulty = difficulty;
  }
  if (active) {
    winStreak += 1;
    loseStreak = 0;
  } else {
    loseStreak += 1;
    winStreak = 0;
  }
  highstWinStreak = Math.max(highstWinStreak, winStreak);
  highestLoseStreak = Math.max(highestLoseStreak, loseStreak);

  console.clear();
  console.log("--------------------");
  console.log("Total Bets : ", totalBets);
  console.log("--------------------");
  console.log("Bets Win : ", betsWin);
  console.log("Bets Lose : ", totalBets - betsWin);
  console.log("Win Rate : ", winRate, "%");
  console.log("--------------------");
  console.log("Total Amount : ", totalAmount);
  console.log("Winning Amount : ", winningAmount);
  console.log("----------------");
  console.log(
    `Net Winning : ${netWinning > 0 ? "\x1B[32m" : "\x1B[31m"}${netWinning}`
  );
  console.log("-------------");
  console.log("Recent Bet : ");
  console.log("----Amount : ", number(amount));
  console.log("----Target : ", target);
  console.log("----Winning : ", number(payout));
  console.log("----Difficulty : ", difficulty);
  console.log(
    `----Result : ${active ? "\x1B[32m" : "\x1B[31m"}${active ? "Win" : "Lose"}`
  );
  console.log("-------------");
  console.log("Highest Bet : ");
  console.log("----Amount : ", highestBet.amount);
  console.log("----Target : ", highestBet.target);
  console.log("----Winning : ", highestBet.payout);
  console.log("----Difficulty : ", highestBet.difficulty);
  console.log("-------------");
  console.log("----Win Streak : ", winStreak);
  console.log("----Lose Streak : ", loseStreak);
  console.log("----Highest Win Streak : ", highstWinStreak);
  console.log("----Highest Lose Streak : ", highestLoseStreak);
  console.log("-------------");
  return netWinning;
};

const runAtRandomInterval = (callback) => {
  let timeoutId;

  const start = () => {
    const randomDelay = generateRandomBet({ min: 1000, max: 1500 });
    timeoutId = setTimeout(() => {
      callback();
      start();
    }, randomDelay);
  };

  const stop = () => {
    clearTimeout(timeoutId);
    console.log("Execution Stopped!");
  };

  start();
  return stop;
};

let netWinning = 0;
const stopFunction = runAtRandomInterval(async () => {
  const data = await executeBets();
  netWinning = printResult(data);
  if (netWinning < -50) {
    stopFunction();
  } else if (netWinning > 500) {
    stopFunction();
  }
});
