const headers = {
  accept: "*/*",
  "accept-language": "en-US,en;q=0.5",
  "content-type": "application/json",
  priority: "u=1, i",
  "sec-ch-ua": '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-arch": '"x86"',
  "sec-ch-ua-bitness": '"64"',
  "sec-ch-ua-full-version-list":
    '"Brave";v="131.0.0.0", "Chromium";v="131.0.0.0", "Not_A Brand";v="24.0.0.0"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-model": '""',
  "sec-ch-ua-platform": '"Windows"',
  "sec-ch-ua-platform-version": '"10.0.0"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "sec-gpc": "1",
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

const identifier = generateIdentifier(21);

const generateRandomArrays = ({ length, min = 1.01, max }) => {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(Number((Math.random() * (max - min) + min).toFixed(6)));
  }
  return arr;
};

const multipliers = [
  ...generateRandomArrays({ length: 20, max: 500000 }),
  ...generateRandomArrays({ length: 25, max: 100 }),
  ...generateRandomArrays({ length: 50, max: 9 }),
  ...generateRandomArrays({ length: 80, max: 4.5 }),
  ...generateRandomArrays({ length: 175, max: 2.5 }),
];

const amountPerBet = [
  ...generateRandomArrays({ length: 100, min: 0.1, max: 0.4 }),
  ...generateRandomArrays({ length: 250, min: 0.4, max: 1 }),
];

let betPlayed = [];
let totalBetPlayed = [];

const executeBets = async () => {
  await Promise.all(
    multipliers.map(
      (cashoutAt, index) =>
        new Promise((resolve) =>
          setTimeout(() => {
            fetch("https://stake.ac/_api/graphql", {
              headers,
              referrer: "https://stake.ac/casino/games/slide",
              referrerPolicy: "strict-origin-when-cross-origin",
              method: "POST",
              mode: "cors",
              credentials: "include",
              body: JSON.stringify({
                query:
                  "mutation MultiplayerSlideBet($amount: Float!, $currency: CurrencyEnum!, $cashoutAt: Float!, $identifier: String!) {\n  multiplayerSlideBet(\n    amount: $amount\n    currency: $currency\n    cashoutAt: $cashoutAt\n    identifier: $identifier\n  ) {\n    __typename\n    ...MultiplayerSlideBet\n    user {\n      id\n      activeSlideBet {\n        ...MultiplayerSlideBet\n      }\n    }\n  }\n}\n\nfragment MultiplayerSlideBet on MultiplayerSlideBet {\n  id\n  user {\n    id\n    name\n    preferenceHideBets\n  }\n  payoutMultiplier\n  gameId\n  amount\n  payout\n  currency\n  slideResult: result\n  updatedAt\n  cashoutAt\n  btcAmount: amount(currency: btc)\n  active\n  createdAt\n}",
                variables: {
                  amount: amountPerBet?.[index],
                  identifier: identifier,
                  currency: "inr",
                  cashoutAt: cashoutAt,
                },
              }),
            }).then((res) => {
              res
                .json()
                .then((result) => {
                  const data = result?.data?.multiplayerSlideBet || {};
                  if (data?.cashoutAt && data?.amount) {
                    betPlayed.push({
                      multiplier: data?.cashoutAt,
                      amount: data?.amount,
                    });
                  }
                })
                .catch(() => null)
                .finally(() => resolve());
              1;
            });
          }, index * 50)
        )
    )
  );
};

const fetchStats = async () => {
  await new Promise((resolve) =>
    fetch("https://stake.ac/_api/graphql", {
      headers,
      referrer: "https://stake.ac/casino/games/slide",
      referrerPolicy: "strict-origin-when-cross-origin",
      method: "POST",
      mode: "cors",
      credentials: "include",
      body: '{"query":"query SlideGameListHistory($limit: Int, $offset: Int) {\\n  slideGameList(limit: $limit, offset: $offset) {\\n    id\\n    multiplier\\n    startTime\\n    hash {\\n      hash\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n","operationName":"SlideGameListHistory","variables":{}}',
    })
      .then((res) => res.json().catch(() => null))
      .then((result) => {
        const data = result?.data?.slideGameList?.[0] || {};
        const winningMultiplier = data?.multiplier || 0;
        const calculateDetails = {
          multiplier: winningMultiplier,
          totalBets: betPlayed.length,
          ...betPlayed?.reduce(
            (accumulator, { multiplier, amount }) => {
              return {
                ...accumulator,
                totalAmount: accumulator.totalAmount + (amount || 0),
                winningBets:
                  accumulator.winningBets +
                  (multiplier < winningMultiplier ? 1 : 0),
                winningAmount:
                  accumulator.winningAmount +
                  (multiplier < winningMultiplier ? amount * multiplier : 0),
              };
            },
            { winningBets: 0, winningAmount: 0, totalAmount: 0 }
          ),
        };
        const updatedDetails = {
          ...calculateDetails,
          multiplier: number(calculateDetails.multiplier),
          totalAmount: number(calculateDetails.totalAmount),
          winningAmount: number(calculateDetails.winningAmount),
          netWinning: number(
            calculateDetails.winningAmount - calculateDetails.totalAmount
          ),
        };
        const updatedTotalBetPlayed = betPlayed?.length
          ? [...totalBetPlayed, updatedDetails]
          : totalBetPlayed;
        totalBetPlayed = updatedTotalBetPlayed;
        betPlayed = [];
        console.clear();
        console.log("-----------");
        console.log("Total Bets :", updatedTotalBetPlayed.length);
        console.log(
          "Total Amount Wagered :",
          number(
            updatedTotalBetPlayed.reduce((acc, bet) => acc + bet.totalAmount, 0)
          )
        );
        console.log(
          "Total Winning Amount :",
          number(
            updatedTotalBetPlayed.reduce(
              (acc, bet) => acc + bet.winningAmount,
              0
            )
          )
        );
        console.log(
          "Total Net Winning :",
          number(
            updatedTotalBetPlayed.reduce((acc, bet) => acc + bet.netWinning, 0)
          )
        );
        console.log("-----------");
        console.log("Multiplier :", updatedDetails.multiplier);
        console.log("------------");
        console.log("Total Bets :", updatedDetails.totalBets);
        console.log("Winning Bets :", updatedDetails.winningBets);
        console.log("--------------");
        console.log("Total Amount :", updatedDetails.totalAmount);
        console.log("Winning Amount :", updatedDetails.winningAmount);
        console.log("----------------");
        console.log("Net Winning :", updatedDetails.netWinning);
        console.log("-------------");
      })
      .catch(() => null)
      .finally(() => resolve())
  );
};

let interval;
let betDone = false;
let prevButtonText = null;

const number = (number) => {
  return Number(number.toFixed(2));
};

const generateRandomBet = ({ min, max, float = true }) => {
  const randomNumber = Math.random() * (max - min) + min;
  return float ? number(randomNumber) : Math.ceil(randomNumber);
};

const executeCode = () => {
  interval = setInterval(() => {
    const data = document
      .querySelector("button[data-test-bet-next]")
      .textContent.toString()
      .trim()
      .toLowerCase();
    if (data === "bet" && prevButtonText !== data) {
       const randomNumber = generateRandomBet({
         min: 1,
         max: 10,
         float: false,
       });
       if (randomNumber > 5) executeBets();
      prevButtonText = data;
    } else if (data === "bet (next round)" && prevButtonText !== data) {
      fetchStats();
      prevButtonText = data;
    }
  }, 1000);
};

// clearInterval(interval);
executeCode();
