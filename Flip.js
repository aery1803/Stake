const aeryLaw = false;

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

const number = (number) => {
  return Number(number.toFixed(3));
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
  const flips = generateRandomBet({
    ...recursiveMultiplier([0, 7, 20]),
    float: false,
  });
  const amount =
    flips > 3
      ? generateRandomBet({ min: 0.4, max: 0.1 })
      : generateRandomBet({ min: 0.25, max: 0.75 });

  const guesses = Array(flips)
    .fill()
    .map(() =>
      generateRandomBet({ min: 0, max: 10, float: false }) % 2 === 0
        ? "heads"
        : "tails"
    );

  const response = await fetch("https://stake.ac/_api/graphql", {
    headers,
    referrer: "https://stake.ac/casino/games/pump",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      query:
        "mutation FlipBet($amount: Float!, $currency: CurrencyEnum!, $identifier: String, $guesses: [FlipConditionEnum!]!) {\n  flipBet(\n    amount: $amount\n    currency: $currency\n    identifier: $identifier\n    guesses: $guesses\n  ) {\n    ...CasinoBet\n    state {\n      ...CasinoGameFlip\n    }\n  }\n}\n\nfragment CasinoBet on CasinoBet {\n  id\n  active\n  payoutMultiplier\n  amountMultiplier\n  amount\n  payout\n  updatedAt\n  currency\n  game\n  user {\n    id\n    name\n  }\n}\n\nfragment CasinoGameFlip on CasinoGameFlip {\n  currentRound\n  payoutMultiplier\n  playedRounds\n  flips\n}\n",
      variables: {
        amount: amount,
        currency: "inr",
        identifier: generateIdentifier(21),
        guesses,
      },
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });

  const data = await response.json();
  const payout = number(data?.data?.flipBet?.payout) || 0;
  const payoutMultiplier = number(data?.data?.flipBet?.payoutMultiplier) || 0;

  return {
    target: payoutMultiplier,
    amount,
    payout,
    flips,
    active: payout > 0,
  };
};

let baseAmount = 0.009;

const executeAeryLaw = async () => {
  const flips = 2;
  const amount = baseAmount;
  const guesses = Array(flips)
    .fill()
    .map(() =>
      generateRandomBet({ min: 1, max: 10, float: false }) % 2 === 0
        ? "heads"
        : "tails"
    );

  const response = await fetch("https://stake.ac/_api/graphql", {
    headers,
    referrer: "https://stake.ac/casino/games/pump",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      query:
        "mutation FlipBet($amount: Float!, $currency: CurrencyEnum!, $identifier: String, $guesses: [FlipConditionEnum!]!) {\n  flipBet(\n    amount: $amount\n    currency: $currency\n    identifier: $identifier\n    guesses: $guesses\n  ) {\n    ...CasinoBet\n    state {\n      ...CasinoGameFlip\n    }\n  }\n}\n\nfragment CasinoBet on CasinoBet {\n  id\n  active\n  payoutMultiplier\n  amountMultiplier\n  amount\n  payout\n  updatedAt\n  currency\n  game\n  user {\n    id\n    name\n  }\n}\n\nfragment CasinoGameFlip on CasinoGameFlip {\n  currentRound\n  payoutMultiplier\n  playedRounds\n  flips\n}\n",
      variables: {
        amount: amount,
        currency: "inr",
        identifier: generateIdentifier(21),
        guesses,
      },
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });

  const data = await response.json();
  const payout = number(data?.data?.flipBet?.payout) || 0;
  const payoutMultiplier = number(data?.data?.flipBet?.payoutMultiplier) || 0;
  const active = payout > 0;
  if (aeryLaw && active) {
    baseAmount = 0.009;
  } else if (aeryLaw && !active) {
    baseAmount = number(baseAmount * 1.75);
  }
  return {
    target: payoutMultiplier,
    amount,
    payout,
    flips,
    active,
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
  flips: 0,
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

const printResult = ({ active, payout, amount, target, flips }) => {
  totalBets = betDetails.totalBets + 1;
  betsWin = betDetails.betsWin + (active ? 1 : 0);
  betsLose = totalBets - betsWin;
  totalAmount = number(betDetails.totalAmount + amount);
  winningAmount = number(betDetails.winningAmount + (active ? payout : 0));
  winRate = number((betsWin / totalBets) * 100);
  netWinning = number(winningAmount - totalAmount);
  if (active) {
    winStreak += 1;
    loseStreak = 0;
  } else {
    loseStreak += 1;
    winStreak = 0;
  }
  highstWinStreak = Math.max(highstWinStreak, winStreak);
  highestLoseStreak = Math.max(highestLoseStreak, loseStreak);
  betDetails = { totalBets, betsWin, betsLose, totalAmount, winningAmount };
  if (payout > highestBet.payout) {
    highestBet.target = target;
    highestBet.amount = amount;
    highestBet.flips = flips;
    highestBet.payout = number(payout);
  }
  if (payout > 5) bestWinnings.push({ amount, target, payout, flips });
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
  console.log("----Target : ", target);
  console.log("----Winning : ", number(payout));
  console.log("----Flips : ", flips);
  console.log(
    `----Result : ${active ? "\x1B[32m" : "\x1B[31m"}${active ? "Win" : "Lose"}`
  );
  console.log("--------------------");
  console.log("Highest Bet : ");
  console.log("----Amount : ", highestBet.amount);
  console.log("----Target : ", highestBet.target);
  console.log("----Winning : ", highestBet.payout);
  console.log("----Flips : ", highestBet.flips);
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
  Game Name: Flip
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
    - Flips: ${highestBet.flips}
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
      - Flips: ${win.flips}
    `
      )
      .join("\n")}
  `;
  const blob = new Blob([stats], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flip_stats.txt";
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
  const data = aeryLaw ? await executeAeryLaw() : await executeBets();
  netWinning = printResult(data);
  if (netWinning < -50) {
    stopFunction();
  } else if (netWinning > 500) {
    stopFunction();
  }
});
