const identifier = "";

const generateRandomArrays = ({ length, min = 1.01, max }) => {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr.push(Number((Math.random() * (max - min) + min).toFixed(6)));
  }
  return arr;
};

const multipliers = [
  ...generateRandomArrays({ length: 10, max: 500000 }),
  ...generateRandomArrays({ length: 15, max: 3000 }),
  ...generateRandomArrays({ length: 20, max: 100 }),
  ...generateRandomArrays({ length: 45, max: 20 }),
  ...generateRandomArrays({ length: 100, max: 5 }),
  ...generateRandomArrays({ length: 160, max: 2 }),
];

const amountPerBet = [
  ...generateRandomArrays({ length: 100, min: 0.05, max: 0.25 }),
  ...generateRandomArrays({ length: 250, min: 0.1, max: 0.5 }),
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
              headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.5",
                "content-type": "application/json",
                priority: "u=1, i",
                "sec-ch-ua":
                  '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
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
                "x-access-token":
                  "4ef5ed7fb67e30e1050e24779114cfdbd52cda62d922e1cd08de4b6a34d77349e1b95b2b53a3796e12fefa0cf79509b7",
                "x-lockdown-token": "s5MNWtjTM5TvCMkAzxov",
              },
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
      headers: {
        accept: "application/graphql+json, application/json",
        "accept-language": "en-US,en;q=0.5",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
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
        "x-access-token":
          "4ef5ed7fb67e30e1050e24779114cfdbd52cda62d922e1cd08de4b6a34d77349e1b95b2b53a3796e12fefa0cf79509b7",
        "x-language": "en",
      },
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
          multiplier: Number(calculateDetails.multiplier.toFixed(2)),
          totalAmount: Number(calculateDetails.totalAmount.toFixed(2)),
          winningAmount: Number(calculateDetails.winningAmount.toFixed(2)),
          netWinning: Number(
            (
              calculateDetails.winningAmount - calculateDetails.totalAmount
            ).toFixed(2)
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
          Number(
            updatedTotalBetPlayed
              .reduce((acc, bet) => acc + bet.totalAmount, 0)
              .toFixed(2)
          )
        );
        console.log(
          "Total Winning Amount :",
          Number(
            updatedTotalBetPlayed
              .reduce((acc, bet) => acc + bet.winningAmount, 0)
              .toFixed(2)
          )
        );
        console.log(
          "Total Net Winning :",
          Number(
            updatedTotalBetPlayed
              .reduce((acc, bet) => acc + bet.netWinning, 0)
              .toFixed(2)
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

await executeBets();
await fetchStats();
