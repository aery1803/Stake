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
  return float ? Number(randomNumber.toFixed(6)) : Math.ceil(randomNumber);
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

const randomMultiplier = (levels, float) => {
  return generateRandomBet({ ...recursiveMultiplier(levels), float });
};

const generate = () => [
  randomMultiplier([3, 9, 15], false),
  generateRandomBet({ min: 0.1, max: 0.5 }),
];

const executeBets = async () => {
  const [pump, amount] = generate();
  const response = await fetch("https://stake.ac/_api/graphql", {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.7",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Brave";v="132"',
      "sec-ch-ua-arch": '"x86"',
      "sec-ch-ua-bitness": '"64"',
      "sec-ch-ua-full-version-list":
        '"Not A(Brand";v="8.0.0.0", "Chromium";v="132.0.0.0", "Brave";v="132.0.0.0"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"Windows"',
      "sec-ch-ua-platform-version": '"10.0.0"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "x-access-token":
        "e7fd5123465a5169b13ece91f936ae89cd02bf54db1e8d345ad6e1cfe40402ed24be09c2edc085573eb9361284c23492",
      "x-lockdown-token": "s5MNWtjTM5TvCMkAzxov",
    },
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
        difficulty: "expert",
      },
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  const data = await response.json();
  const payout = data?.data?.pumpBet?.payout || 0;
  return { pump, amount, payout, active: payout > 0 };
};

let betResponse = [];
const printResult = (data) => {
  const updatedBetResponse = [...betResponse, data];
  const betsWin = updatedBetResponse.filter((bet) => bet.active).length;
  const winRate = Number(
    ((betsWin / updatedBetResponse.length) * 100).toFixed(2)
  );
  const totalAmount = Number(
    updatedBetResponse?.reduce((acc, bet) => acc + bet.amount, 0).toFixed(2)
  );
  const winningAmount = Number(
    updatedBetResponse
      ?.reduce((acc, bet) => (bet.active ? acc + bet.payout : acc), 0)
      .toFixed(2)
  );
  const netWinning = Number((winningAmount - totalAmount).toFixed(2));
  console.clear();
  console.log("--------------------");
  console.log("Total Bets : ", updatedBetResponse.length);
  console.log("--------------------");
  console.log("Bets Win : ", betsWin);
  console.log("Bets Lose : ", updatedBetResponse.length - betsWin);
  console.log("Win Rate : ", winRate, "%");
  console.log("--------------------");
  console.log("Total Amount : ", totalAmount);
  console.log("Winning Amount : ", winningAmount);
  console.log("----------------");
  console.log("Net Winning : ", netWinning);
  console.log("-------------");
  console.log("Recent Bet : ");
  console.log("----Amount : ", Number(data.amount.toFixed(2)));
  console.log("----Pump : ", data.pump);
  console.log("----Result : ", data.active ? "Win" : "Lose");
  betResponse = [...updatedBetResponse];
  return netWinning;
};

const runAtRandomInterval = (callback) => {
  let timeoutId;

  const start = () => {
    const randomDelay = generateRandomBet({ min: 1000, max: 5000 });
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
