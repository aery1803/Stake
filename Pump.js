const headers = {
  "content-type": "application/json",
  "sec-ch-ua":
    '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
  "sec-ch-ua-arch": '"x86"',
  "sec-ch-ua-bitness": '"64"',
  "sec-ch-ua-full-version": '"132.0.6834.84"',
  "sec-ch-ua-full-version-list":
    '"Not A(Brand";v="8.0.0.0", "Chromium";v="132.0.6834.84", "Google Chrome";v="132.0.6834.84"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-model": '""',
  "sec-ch-ua-platform": '"Windows"',
  "sec-ch-ua-platform-version": '"10.0.0"',
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

const recursiveMultiplier = (levels, index = 0) => {
  if (index >= levels.length - 1) {
    return { min: levels[index], max: levels[index] };
  }
  const nextMultiplier = recursiveMultiplier(levels, index + 1);
  return {
    min: levels[index],
    max: generateRandomBet({
      min: levels[index],
      max: nextMultiplier.max,
    }),
  };
};

const executeBets = async () => {
  const pump = generateRandomBet({
    ...recursiveMultiplier([3, 8, 20]),
    float: false,
  });
  const amount =
    pump > 3
      ? generateRandomBet({ min: 0.4, max: 0.75 })
      : generateRandomBet({ min: 0.75, max: 1 });

  const mode = generateRandomBet({
    ...recursiveMultiplier([0, 4]),
    float: false,
  });

  const difficulty = ["easy", "medium", "hard", "expert"][mode - 1];

  const response = await fetch("https://stake.ac/_api/graphql", {
    headers,
    referrer: "https://stake.ac/casino/games/pump",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      query:
        "mutation PumpBet($amount: Float!, $difficulty: CasinoGamePumpDifficultyEnum!, $currency: CurrencyEnum!, $identifier: String, $round: Int!) {\n  pumpBet(\n    amount: $amount\n    difficulty: $difficulty\n    currency: $currency\n    identifier: $identifier\n    round: $round\n  ) {\n    ...CasinoBet\n    state {\n      ...CasinoGamePump\n    }\n  }\n}\n\nfragment CasinoBet on CasinoBet {\n  id\n  active\n  payoutMultiplier\n  amountMultiplier\n  amount\n  payout\n  updatedAt\n  currency\n  game\n  user {\n    id\n    name\n  }\n}\n\nfragment CasinoGamePump on CasinoGamePump {\n  difficulty\n  payoutMultiplier\n  round\n}\n",
      variables: {
        amount: amount,
        currency: "inr",
        identifier: generateIdentifier(21),
        round: pump,
        difficulty,
      },
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });

  const data = await response.json();
  const payout = number(data?.data?.pumpBet?.payout) || 0;
  const payoutMultiplier = number(data?.data?.pumpBet?.payoutMultiplier) || 0;

  return {
    target: payoutMultiplier,
    amount,
    payout,
    pump,
    active: payout > 0,
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
  amount: 0,
  target: 0,
  payout: 0,
  pump: 0,
  difficulty: "",
};

let winStreak = 0;
let loseStreak = 0;
let highstWinStreak = 0;
let highestLoseStreak = 0;

let totalBets = 0;
let betsWin = 0;
let betsLose = 0;
let totalAmount = 0;
let winningAmount = 0;
let winRate = 0;
let netWinning = 0;
let bestWinnings = [];

const printResult = ({ active, payout, amount, target, difficulty, pump }) => {
  totalBets = betDetails.totalBets + 1;
  betsWin = betDetails.betsWin + (active ? 1 : 0);
  betsLose = totalBets - betsWin;
  totalAmount = number(betDetails.totalAmount + amount);
  winningAmount = number(betDetails.winningAmount + (active ? payout : 0));
  winRate = number((betsWin / totalBets) * 100);
  netWinning = number(winningAmount - totalAmount);

  betDetails = { totalBets, betsWin, betsLose, totalAmount, winningAmount };
  if (payout > highestBet.payout) {
    highestBet.target = target;
    highestBet.amount = amount;
    highestBet.payout = number(payout);
    highestBet.difficulty = difficulty;
    highestBet.pump = pump;
  }
  if (payout > 5)
    bestWinnings.push({ amount, target, payout, difficulty, eggs });
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
  console.log("--------------------");
  console.log(
    `Net Winning : ${netWinning > 0 ? "\x1B[32m" : "\x1B[31m"}${netWinning}`
  );
  console.log("--------------------");
  console.log("Recent Bet : ");
  console.log("----Amount : ", number(amount));
  console.log("----Winning : ", number(payout));
  console.log("----Target : ", target);
  console.log("----Pump : ", pump);
  console.log("----Difficulty : ", difficulty);
  console.log(
    `----Result : ${active ? "\x1B[32m" : "\x1B[31m"}${active ? "Win" : "Lose"}`
  );
  console.log("--------------------");
  console.log("Highest Bet : ");
  console.log("----Amount : ", highestBet.amount);
  console.log("----Target : ", highestBet.target);
  console.log("----Winning : ", highestBet.payout);
  console.log("----Difficulty : ", highestBet.difficulty);
  console.log("----Pump : ", highestBet.pump);
  console.log("--------------------");
  console.log("--------------------");
  console.log("----Win Streak : ", winStreak);
  console.log("----Lose Streak : ", loseStreak);
  console.log("----Highest Win Streak : ", highstWinStreak);
  console.log("----Highest Lose Streak : ", highestLoseStreak);
  console.log("--------------------");
  return netWinning;
};

const downloadStats = () => {
  const stats = `
  Game Name: Pump
  --------------------
  Total Bets: ${totalBets}
  Bets Win: ${betsWin}
  Bets Lose: ${betsLose}
  Win Rate: ${winRate}%
  Total Amount: ${totalAmount}
  Winning Amount: ${winningAmount}
  Net Winning: ${netWinning}
  Highest Bet:
    - Amount: ${highestBet.amount}
    - Target: ${highestBet.target}
    - Winning: ${highestBet.payout}
    - Difficulty: ${highestBet.difficulty}
    - Pump: ${highestBet.pump}
  Streaks:
    - Current Win Streak: ${winStreak}
    - Current Lose Streak: ${loseStreak}
    - Highest Win Streak: ${highstWinStreak}
    - Highest Lose Streak: ${highestLoseStreak}

  Best Winnings:
    ${bestWinnings
      .map(
        (win, index) => `
    ${index + 1}.
      - Amount: ${win.amount}
      - Target: ${win.target}
      - Winning: ${win.payout}
      - Difficulty: ${win.difficulty}
      - Pump: ${win.pump}
    `
      )
      .join("\n")}
  `;
  const blob = new Blob([stats], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pump_stats.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const runAtRandomInterval = (callback) => {
  let timeoutId;

  const start = () => {
    const randomDelay = generateRandomBet({ min: 5000, max: 10000 });
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

const stopFunction = runAtRandomInterval(async () => {
  const data = await executeBets();
  netWinning = printResult(data);
  if (netWinning < -50) {
    stopFunction();
  } else if (netWinning > 500) {
    stopFunction();
  }
});
