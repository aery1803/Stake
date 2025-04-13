const headers = true
  ? {
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
      "x-access-token":
        "a43fa34a186cda70de42567e5d19ba49400b684038c41a78621db5aba60150de12b0a51b91f59e7f534eb07ca079dcf0",
      "x-lockdown-token": "s5MNWtjTM5TvCMkAzxov",
    }
  : {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,hi;q=0.8",
      "content-type": "application/json",
      priority: "u=1, i",
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
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-access-token":
        "a43fa34a186cda70de42567e5d19ba49400b684038c41a78621db5aba60150de12b0a51b91f59e7f534eb07ca079dcf0",
      "x-lockdown-token": "s5MNWtjTM5TvCMkAzxov",
    };

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

const generateRandomArrays = ({ length, min = 1.01, max, float = false }) => {
  let arr = [];
  while (arr.length < length) {
    const bet = generateRandomBet({ min, max, float });
    if (!arr.includes(bet)) arr.push(bet);
  }
  return arr;
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
      min: 1.1,
      max: [7, 9, 11, 13, 18].includes(Math.floor(Math.random() * 20) + 1)
        ? nextMultiplier.max
        : nextMultiplier.min,
    }),
  };
};

const randomMultiplier = (levels, float = true) => {
  return generateRandomBet({ ...recursiveMultiplier(levels), float });
};

const executeBets = async () => {
  const amount = generateRandomBet({ min: 0.1, max: 0.5 });
  const mode = generateRandomBet({
    min: 1,
    max: 3,
    float: false,
  });

  const risk = ["low", "medium", "high"][mode - 1];

  const response = await fetch("https://stake.ac/_api/graphql", {
    headers,
    referrer: "https://stake.ac/casino/games/limbo",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      query:
        "mutation KenoBet($amount: Float!, $currency: CurrencyEnum!, $numbers: [Int!]!, $identifier: String!, $risk: CasinoGameKenoRiskEnum) {\n  kenoBet(\n    amount: $amount\n    currency: $currency\n    numbers: $numbers\n    risk: $risk\n    identifier: $identifier\n  ) {\n    ...CasinoBet\n    state {\n      ...CasinoGameKeno\n    }\n  }\n}\n\nfragment CasinoBet on CasinoBet {\n  id\n  active\n  payoutMultiplier\n  amountMultiplier\n  amount\n  payout\n  updatedAt\n  currency\n  game\n  user {\n    id\n    name\n  }\n}\n\nfragment CasinoGameKeno on CasinoGameKeno {\n  drawnNumbers\n  selectedNumbers\n  risk\n}\n",
      variables: {
        numbers: generateRandomArrays({
          min: 0,
          max: 39,
          length: generateRandomBet({ min: 2, max: 8, float: false }),
          float: false,
        }),
        risk,
        amount,
        currency: "inr",
        identifier: generateIdentifier(21),
      },
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  const data = await response.json();
  const payout = number(data?.data?.kenoBet?.payout) || 0;
  const target = number(data?.data?.kenoBet?.payoutMultiplier) || 0;
  return { target, amount, payout, active: payout > 0 };
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
};

const printResult = ({ active, payout, amount, target }) => {
  const totalBets = betDetails.totalBets + 1;
  const betsWin = betDetails.betsWin + (active ? 1 : 0);
  const betsLose = totalBets - betsWin;
  const totalAmount = number(betDetails.totalAmount + amount);
  const winningAmount = number(
    betDetails.winningAmount + (active ? payout : 0)
  );
  const winRate = number((betsWin / totalBets) * 100);
  const netWinning = number(winningAmount - totalAmount);

  betDetails = { totalBets, betsWin, betsLose, totalAmount, winningAmount };
  if (payout > highestBet.payout) {
    highestBet.target = target;
    highestBet.amount = amount;
    highestBet.payout = number(payout);
  }
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
  console.log("Net Winning : ", netWinning);
  console.log("-------------");
  console.log("Recent Bet : ");
  console.log("----Amount : ", amount);
  console.log("----Target : ", target);
  console.log("----Winning : ", number(payout));
  console.log("----Result : ", active ? "Win" : "Lose");
  console.log("-------------");
  console.log("Highest Bet : ");
  console.log("----Amount : ", highestBet.amount);
  console.log("----Target : ", highestBet.target);
  console.log("----Winning : ", highestBet.payout);
  console.log("-------------");
  return netWinning;
};

const runAtRandomInterval = (callback) => {
  let timeoutId;

  const start = () => {
    const randomDelay = 600 || generateRandomBet({ min: 1000, max: 5000 });
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
});

if (netWinning < -50) {
  stopFunction();
} else if (netWinning > 500) {
  stopFunction();
}
