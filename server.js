const axios = require('axios');

const FIREBASE_URL = "https://wingoo-f161d-default-rtdb.firebaseio.com/wingoo_proofs";

// 24/7 Background Cron Engine
setInterval(() => {
    processEngine('1m', 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json');
    processEngine('30s', 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json');
}, 5000);

async function processEngine(mode, apiUrl) {
    try {
        const response = await axios.get(apiUrl);
        if (response.data && response.data.data && response.data.data.list.length > 0) {
            const latest = response.data.data.list[0];
            const periodId = latest.issueNumber;
            const num = parseInt(latest.number);
            const result = num >= 5 ? "BIG" : "SMALL";

            const currentPredRes = await axios.get(`${FIREBASE_URL}/${mode}/current_pred.json`);
            const currentPred = currentPredRes.data || "BIG";

            const checkExist = await axios.get(`${FIREBASE_URL}/${mode}/logs/${periodId}.json`);
            if (!checkExist.data) {
                const status = (currentPred === result) ? "WIN" : "LOSS";
                const proofObj = {
                    period: periodId,
                    pred: currentPred,
                    result: `${num} (${result})`,
                    status: status,
                    timestamp: Date.now()
                };

                await axios.put(`${FIREBASE_URL}/${mode}/logs/${periodId}.json`, proofObj);

                const nextPred = status === "LOSS" ? result : (num % 2 === 0 ? "BIG" : "SMALL");
                await axios.put(`${FIREBASE_URL}/${mode}/current_pred.json`, JSON.stringify(nextPred));
            }
        }
    } catch (error) {
        console.error("Syncing...", error.message);
    }
            }
