
const bankData = {
    "ghb": { name: "ธอส.", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 0, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.9A": 0, "2.9B8": 0 }, dsr: { minIncomeForDsrHigh: 20000, dsrHigh: 0.33, dsrLow: 0.50 }, age: { min: 20, max: 70, maxTerm: 40 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [6100, 6100, 6100, 8100], 30: [5100, 5100, 5100, 7100], 40: [4100, 4100, 4100, 6100] }, interest: { y1: "2.50%", y2: "3.10%", y3: "4.00%", y4: "MRR-0.50%", avg3y: "3.20%" } },
    "aomisin": { name: "ออมสิน", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 0, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 0, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 0 }, dsr: { minIncomeForDsrHigh: 20000, dsrHigh: 0.33, dsrLow: 0.50 }, age: { min: 20, max: 70, maxTerm: 40 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [6100, 6100, 6100, 8100], 30: [5100, 5100, 5100, 7100], 40: [4100, 4100, 4100, 6100] }, interest: { y1: "1.89%", y2: "3.855%", y3: "3.855%", y4: "MRR--1.%", avg3y: "3.200%" } },
    "krungthai": { name: "กรุงไทย", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 0, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 0 }, dsr: { dsrHigh: 0.50, dsrLow: 0.50 }, age: { min: 20, max: 70, maxTerm: 40 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [4500, 5500, 6500, 8500], 30: [3500, 4500, 5500, 7500], 40: [2500, 3500, 4500, 6500] }, interest: { y1: "2.90%", y2: "3.35%", y3: "3.35%", y4: "MRR-1.25%", avg3y: "3.20%" } },
    "scb": { name: "ไทยพาณิชย์", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 0 }, dsr: { dsrHigh: 0.70, dsrLow: 0.70 }, age: { min: 20, max: 70, maxTerm: 35 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [4900, 5200, 5200, 6500], 30: [4400, 4700, 4700, 6100], 40: [3800, 4100, 4100, 5600] }, interest: { y1: "3.70%", y2: "3.70%", y3: "MRR-2.45%", y4: "MRR-1.55%", avg3y: "4.00%" } },
    "bbl": { name: "กรุงเทพ", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 0 }, dsr: { dsrHigh: 0.70, dsrLow: 0.70 }, age: { min: 20, max: 65, maxTerm: 40 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [4200, 4200, 7500, 7500], 30: [4200, 4200, 6200, 6200], 40: [null, null, null, null] }, interest: { y1: "2.50%", y2: "MRR-3.1%", y3: "MRR-3.1%", y4: "MRR-1.50%", avg3y: "3.32%" } },
    "kbank": { name: "กสิกรไทย", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 0 }, dsr: { dsrHigh: 0.70, dsrLow: 0.70 }, age: { min: 20, max: 60, maxTerm: 30 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [7500, 7500, 7500, 7500], 30: [6400, 6400, 6400, 6400], 40: [5900, 5900, 5900, 5900] }, interest: { y1: "1.80%", y2: "3%", y3: "4.10%", y4: "MRR-2.00%", avg3y: "2.95%" } },
    "ttb": { name: "TMBธนชาต (TTB)", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 1 }, dsr: { dsrHigh: 0.50, dsrLow: 0.50 }, age: { min: 20, max: 60, maxTerm: 35 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [7400, 7400, 7400, 7400], 30: [6200, 6200, 6200, 6200], 40: [null, null, null, null] }, interest: { y1: "3.50%", y2: "3.50%", y3: "3.50%", y4: "MRR-1.88%", avg3y: "3.50%" } },
    "krungsri": { name: "กรุงศรี", criteria: { "2.1": 0, "2.2": 1, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 1 }, dsr: { dsrHigh: 0.65, dsrLow: 0.65 }, age: { min: 20, max: 60, maxTerm: 30 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [6400, 6400, 6400, 7500], 30: [4800, 5300, 6000, 6800], 40: [null, null, null, null] }, interest: { y1: "3.80%", y2: "5.50%", y3: "MRR-1.675%", y4: "MRR-1%", avg3y: "4.93%" } },
    "kkp": { name: "เกียรตินาคินภัทร", criteria: { "2.1": 0, "2.2": 1, "2.3": 1, "2.4": 1, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 1, "2.7B": 0, "2.8A": 1, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 1 }, dsr: { dsrHigh: 0.65, dsrLow: 0.65 }, age: { min: 20, max: 70, maxTerm: 40 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [6100, 6500, 7100, 7800], 30: [6500, 6500, 6500, 6500], 40: [6000, 6000, 6000, 6000] }, interest: { y1: "MLR-4.525=3.42", y2: "MLR-4.225=3.72", y3: "MLR-3.925=4.02", y4: "MLR-2=6.05", avg3y: "3.825%" } },
    "lhb": { name: "LH Bank", criteria: { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 1 }, dsr: { dsrHigh: 0.70, dsrLow: 0.70 }, age: { min: 20, max: 60, maxTerm: 40 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [7600, 7600, 7600, 7600], 30: [6500, 6500, 6500, 6500], 40: [6100, 6100, 6100, 6100] }, interest: { y1: "2.79%", y2: "MRR-5.41%", y3: "MRR-5.41%", y4: "MLR-3.01-5.79", avg3y: "3.04%" } },
    "uob": { name: "UOB", criteria: { "2.1": 0, "2.2": 1, "2.3": 0, "2.4": 0, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 1, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 1 }, dsr: { dsrHigh: 0.50, dsrLow: 0.50 }, age: { min: 20, max: 70, maxTerm: 30 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [7500, 7600, 7500, 7600], 30: [7590, 7590, 7590, 7590], 40: [7220, 7220, 7220, 7220] }, interest: { y1: "1.99%", y2: "2.99%", y3: "4.32%", y4: "MRR-1.20%", avg3y: "3.10%" } },
    "ibank": { name: "อิสลามแห่งประเทศไทย", criteria: { "2.1": 0, "2.2": 1, "2.3": 1, "2.4": 1, "2.5": 1, "2.6A": 0, "2.6B": 1, "2.7A": 0, "2.7B": 1, "2.8A": 0, "2.8B": 0, "2.8C": 1, "2.9A": 0, "2.9B1": 0, "2.9B2": 0, "2.9B8": 1 }, dsr: { dsrHigh: 0.50, dsrLow: 0.50 }, age: { min: 20, max: 60, maxTerm: 40 }, ltv: { "1": 1.00, "2_over_2_years": 0.90, "2_under_2_years": 0.80, "3": 0.70 }, installmentRates: { 20: [5600, 6200, 6200, 6400], 30: [4300, 5000, 5000, 6300], 40: [null, null, null, null] }, interest: { y1: "SPRL-3.75=4.25", y2: "SPRL-3.5=4.5", y3: "SPRL-2=6", y4: "SPRL-2=6", avg3y: "4.91%" } }
};

let lastCalculationResult = null;
let extractedPDFText = null;

// ตั้งค่าให้ PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// ฟังก์ชันทั้งหมดถูกประกาศใน Global Scope เพื่อให้ onclick ใน HTML เรียกใช้ได้
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    const statusDiv = document.getElementById('pdf-parsing-status');
    statusDiv.textContent = 'กำลังอ่านและสกัดข้อมูลจาก PDF...';
    const fileReader = new FileReader();
    fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        try {
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(' ');
            }
            extractedPDFText = fullText;
            parseNCBDataAndFillForm(fullText);
            statusDiv.textContent = 'กรอกข้อมูลอัตโนมัติสำเร็จ! กรุณาตรวจสอบความถูกต้อง';
        } catch (error) {
            console.error('Error parsing PDF:', error);
            statusDiv.textContent = 'ไม่สามารถอ่านไฟล์ PDF นี้ได้';
        }
    };
    fileReader.readAsArrayBuffer(file);
}

function parseNCBDataAndFillForm(text) {
    const scoreMatch = text.match(/GE02\s+(\d{3})/);
    if (scoreMatch && scoreMatch[1]) {
        document.getElementById('creditScore').value = scoreMatch[1];
    }
    if (text.includes("42: โอนหรือขายหนี้") || text.includes("ค้างชำระมากกว่า 90 วัน")) {
        document.getElementById('paymentHistory').value = 'ยังค้างชำระ';
    } else if (text.includes("43: โอนหรือขายหนี้ และชำระหนี้เสร็จสิ้น")) {
        document.getElementById('paymentHistory').value = 'เคยค้าง/แต่ปิดแล้ว';
    } else if (text.includes("11: ปิดบัญชี")) {
        document.getElementById('paymentHistory').value = 'ปิดบัญชี';
    } else {
        document.getElementById('paymentHistory').value = 'ปกติ';
    }
}

function calculateLoan() {
    document.getElementById('results').innerHTML = '';
    const aiAdviceDiv = document.getElementById('ai-advice');
    if (aiAdviceDiv) {
      aiAdviceDiv.style.display = 'none';
    }
    const userInput = {
        age: parseInt(document.getElementById('customerAge').value) || 0,
        houseNumberType: document.getElementById('houseNumber').value,
        assetPrice: parseFloat(document.getElementById('assetPrice').value) || 0,
        occupation: document.getElementById('occupation').value,
        totalIncome: (parseFloat(document.getElementById('salary').value) || 0) + (parseFloat(document.getElementById('otherIncome').value) || 0),
        totalDebt: parseFloat(document.getElementById('totalDebt').value) || 0
    };
    const allResults = [];
    for (const bankKey in bankData) {
        const bank = bankData[bankKey];
        let result = { key: bankKey, name: bank.name, passed: true, checks: {} };
        if (bank.criteria[userInput.occupation] !== 0) {
            result.passed = false; result.rejectionReason = "ไม่ผ่านเกณฑ์อาชีพ";
            allResults.push(result); continue;
        }
        if (userInput.age < bank.age.min || userInput.age > bank.age.max) {
            result.passed = false; result.rejectionReason = `ไม่ผ่านเกณฑ์อายุ (ต้องระหว่าง ${bank.age.min}-${bank.age.max} ปี)`;
            allResults.push(result); continue;
        }
        let repaymentAbility;
        let dsrRate;
        if (bankKey === 'ghb') {
            const incomeAfterDebt = userInput.totalIncome - userInput.totalDebt;
            dsrRate = (userInput.totalIncome >= bank.dsr.minIncomeForDsrHigh) ? bank.dsr.dsrHigh : bank.dsr.dsrLow;
            repaymentAbility = incomeAfterDebt * dsrRate;
        } else {
            dsrRate = (bank.dsr.minIncomeForDsrHigh && userInput.totalIncome >= bank.dsr.minIncomeForDsrHigh) ? bank.dsr.dsrHigh : (bank.dsr.dsrHigh || bank.dsr.dsrLow);
            repaymentAbility = (userInput.totalIncome * dsrRate) - userInput.totalDebt;
        }
        const ltvRate = bank.ltv[userInput.houseNumberType] || 0;
        result.checks.rulesUsed = { dsr: dsrRate, ltv: ltvRate, maxAge: bank.age.max, bankMaxTerm: bank.age.maxTerm, interest: bank.interest };
        result.checks.repaymentAbility = repaymentAbility;
        if (repaymentAbility <= 0) {
            result.passed = false; result.rejectionReason = "รายได้ไม่เพียงพอหลังหักหนี้และ DSR";
            allResults.push(result); continue;
        }
        const maxTermFromAge = bank.age.max - userInput.age;
        result.checks.maxTerm = Math.min(maxTermFromAge, bank.age.maxTerm);
        result.checks.maxLtvLoan = userInput.assetPrice * ltvRate;
        result.checks.downPayment = userInput.assetPrice - result.checks.maxLtvLoan;
        result.checks.installments = {};
        for (const term of [20, 30, 40]) {
            if (term <= result.checks.maxTerm && bank.installmentRates[term] && bank.installmentRates[term][0] !== null) {
                const ratePerMillion = bank.installmentRates[term][0];
                const monthlyInstallment = (result.checks.maxLtvLoan * ratePerMillion) / 1000000;
                result.checks.installments[term] = { term: term, monthly: monthlyInstallment, canAfford: repaymentAbility >= monthlyInstallment };
            }
        }
        allResults.push(result);
    }
    lastCalculationResult = { userInput, allResults };
    displayResults(allResults, userInput);
}

function displayResults(results, userInput) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    const houseTypeMap = { "1": "บ้านหลังที่ 1", "2_under_2_years": "บ้านหลังที่ 2 (ผ่อนสัญญาที่ 1 < 2 ปี)", "2_over_2_years": "บ้านหลังที่ 2 (ผ่อนสัญญาที่ 1 >= 2 ปี)", "3": "สัญญาที่ 3 ขึ้นไป" };
    results.forEach(res => {
        let card = `<div class="result-card">`;
        card += `<h3>${res.name}</h3>`;
        if (res.passed) {
            card += `<p class="pass">เบื้องต้นผ่านเกณฑ์</p><h4><u>สรุปผลการพิจารณา:</u></h4><ul>`;
            card += `<li>ความสามารถในการผ่อนสูงสุด: <strong>${res.checks.repaymentAbility.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</strong> บาท/เดือน</li>`;
            card += `<li>วงเงินกู้สูงสุด (ตาม LTV): <strong>${res.checks.maxLtvLoan.toLocaleString('th-TH')}</strong> บาท</li>`;
            card += `<li>ระยะเวลากู้สูงสุด: <strong>${res.checks.maxTerm}</strong> ปี</li></ul>`;
            card += `<h4 style="margin-top: 20px;"><u>เงื่อนไขที่ใช้พิจารณา:</u></h4><ul style="font-size: 0.9em; color: #555;">`;
            card += `<li>เกณฑ์ DSR ที่ใช้: <strong>${(res.checks.rulesUsed.dsr * 100).toFixed(0)}%</strong></li>`;
            card += `<li>เกณฑ์ LTV ที่ใช้: <strong>${(res.checks.rulesUsed.ltv * 100).toFixed(0)}%</strong> (สำหรับ: ${houseTypeMap[userInput.houseNumberType]})</li>`;
            card += `<li>อายุผู้กู้สูงสุดของธนาคาร: <strong>${res.checks.rulesUsed.maxAge} ปี</strong></li>`;
            card += `<li>ดอกเบี้ยเฉลี่ย 3 ปี: <strong>${res.checks.rulesUsed.interest.avg3y}</strong></li></ul>`;
            card += `<h4 style="margin-top: 20px;"><u>ผลการผ่อนชำระ (ปีแรก):</u></h4>`;
            let hasInstallmentOptions = false;
            for (const termKey in res.checks.installments) {
                hasInstallmentOptions = true;
                const termInfo = res.checks.installments[termKey];
                const affordText = termInfo.canAfford ? '<span class="pass">(ผ่อนไหว)</span>' : '<span class="fail">(ไม่สามารถผ่อนได้)</span>';
                card += `<p><strong>ระยะ ${termInfo.term} ปี:</strong> ผ่อนเดือนละ ${termInfo.monthly.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท ${affordText}</p>`;
            }
            if (!hasInstallmentOptions) {
                card += `<p>ไม่มีข้อมูลการผ่อนชำระสำหรับธนาคารนี้ในระยะเวลาที่กำหนด</p>`;
            }
        } else {
            card += `<p class="fail">ไม่ผ่านเกณฑ์</p><p>เหตุผล: ${res.rejectionReason}</p>`;
        }
        card += `</div>`;
        resultsDiv.innerHTML += card;
    });
}

async function getFinancialAdvice() {
    if (!API_KEY || API_KEY === "วาง API KEY ของคุณที่นี่") {
        alert("กรุณาใส่ API Key ของคุณในไฟล์ script.js บรรทัดแรกก่อนครับ");
        return;
    }

    const adviceDiv = document.getElementById('ai-advice');
    const adviceContent = document.getElementById('ai-advice-content');
    adviceDiv.style.display = 'block';
    adviceContent.innerHTML = 'กำลังวิเคราะห์ข้อมูล...';
    document.getElementById('results').innerHTML = ''; // เคลียร์ผลลัพธ์เก่าของ calculateLoan

    let prompt;

    // ตรรกะใหม่: ตรวจสอบว่ามีข้อมูลจาก PDF หรือไม่
    if (extractedPDFText) {
        // --- ถ้ามี PDF: ใช้ Prompt สำหรับวิเคราะห์ PDF เชิงลึก ---
        adviceContent.innerHTML = 'AI กำลังวิเคราะห์รายงานเครดิตบูโร...';
        const incomeData = {
            totalIncome: (parseFloat(document.getElementById('salary').value) || 0) + (parseFloat(document.getElementById('otherIncome').value) || 0),
            totalDebt: parseFloat(document.getElementById('totalDebt').value) || 0
        };

        prompt = `คุณคือผู้ช่วยวางแผนการเงินส่วนบุคคล (Personal Financial Assistant) ที่เชี่ยวชาญด้านการวิเคราะห์เครดิตบูโรและพฤติกรรมทางการเงินส่วนบุคคล
        ฉันได้แนบรายงานเครดิตบูโรของลูกค้า (ในรูปแบบข้อความดิบ) และข้อมูลรายได้เพิ่มเติม โปรดสรุปผลวิเคราะห์ตามหัวข้อต่อไปนี้:
        **ข้อมูลรายได้จากฟอร์ม:**
        - รายได้ต่อเดือน: ${incomeData.totalIncome.toLocaleString()} บาท
        - ภาระหนี้ที่ต้องผ่อนต่อเดือน: ${incomeData.totalDebt.toLocaleString()} บาท
        **ข้อความดิบจากรายงานเครดิตบูโร:**
        ---
        ${extractedPDFText}
        ---
        **โปรดสรุปผลวิเคราะห์ดังนี้:**
        1. **สรุปจำนวนบัญชีทั้งหมดที่ลูกค้ามี:** (ค้นหาจาก "จำนวนบัญชีรวม:")
        2. **วงเงินสินเชื่อ/บัตรเครดิตรวมทั้งหมด:** (ค้นหาจาก "วงเงินสินเชื่อ/วงเงินบัตรเครดิตรวม:")
        3. **ยอดหนี้คงเหลือรวมทั้งหมด:** (ค้นหาจาก "ยอดหนี้คงเหลือ/ยอดวงเงินที่ใช่รวม:")
        4. **ยอดหนี้ที่เกินกำหนดชำระทั้งหมด:** (ค้นหาจาก "ยอดหนี้ที่เกินกำาหนดชำาระรวม")
        5. **บัญชีใดที่มีพฤติกรรมผิดนัดชำระหรือถูกโอนหนี้:** (ค้นหาบัญชีที่มีสถานะ "42: โอนหรือขายหนี้" หรือ "ค้างชำระมากกว่า 90 วัน" พร้อมระบุชื่อผู้ให้สินเชื่อ)
        6. **พฤติกรรมการชำระหนี้โดยรวม:** (ประเมินจากข้อมูลโดยรวม เช่น มีการค้างชำระหรือไม่ สถานะบัญชีส่วนใหญ่เป็นอย่างไร)
        7. **ระดับความสามารถในการขอสินเชื่อใหม่:** (ประเมินจากภาพรวมทั้งหมดพร้อมให้ข้อแนะนำสำหรับการวางแผนการเงิน หากจำเป็นต้องแก้ไข ควรแนะนำอย่างเป็นรูปธรรมและกระชับ)
        8. **การคำนวณ DSR ที่แท้จริงของลูกค้าว่าที่แท้จริงลูกค้าหลังหักลบหนี้สินและคำนวณว่าต้องแก้ไขหนี้สินหากติดเครดิตบูโรเป็นจำนวนเท่าไรแสดงเป็นตัวเลขโดยประมาณ**
        ใช้ภาษาที่เข้าใจง่าย เหมาะกับการสื่อสารกับลูกค้า`;

    } else {
        // --- ถ้าไม่มี PDF: ใช้ Prompt สำหรับข้อมูลที่กรอกเอง ---
        adviceContent.innerHTML = 'กำลังรวบรวมข้อมูลและส่งให้ AI วิเคราะห์...';
        const userInput = {
            age: document.getElementById('customerAge').value,
            totalIncome: document.getElementById('salary').value,
            totalDebt: document.getElementById('totalDebt').value,
            assetPrice: document.getElementById('assetPrice').value,
            creditScore: document.getElementById('creditScore').value,
            paymentHistory: document.getElementById('paymentHistory').options[document.getElementById('paymentHistory').selectedIndex].text
        };

        prompt = `คุณคือ "ที่ปรึกษาสินเชื่อมืออาชีพ" ที่มีความเชี่ยวชาญในการวิเคราะห์ข้อมูลเครดิตบูโร (NCB) และหลักเกณฑ์ของธนาคารแห่งประเทศไทย
        โปรดวิเคราะห์ข้อมูลของผู้ขอสินเชื่อรายนี้อย่างละเอียด และให้คำแนะนำตามหัวข้อที่กำหนดอย่างชัดเจนและกระชับ
        **ข้อมูลทางการเงินและเครดิตบูโรของผู้ขอสินเชื่อ:**
        - รายได้ต่อเดือน: ${userInput.totalIncome.toLocaleString()} บาท
        - ภาระหนี้ที่ต้องผ่อนต่อเดือน: ${userInput.totalDebt.toLocaleString()} บาท
        - คะแนนเครดิต (Score): ${userInput.creditScore || 'ไม่ได้ระบุ'}
        - สถานะประวัติการชำระหนี้ล่าสุด: ${userInput.paymentHistory}
        **โปรดวิเคราะห์และตอบตามหัวข้อต่อไปนี้:**
        1.  **สรุปสภาวะทางการเงิน:** ประเมินภาพรวมความเสี่ยงของลูกค้าคนนี้ใน 1-2 ประโยค
        2.  **โอกาสในการอนุมัติสินเชื่อ:** ตอบอย่างกระชับว่า "มีโอกาสสูง", "มีโอกาส แต่ต้องพิจารณาเพิ่มเติม", หรือ "มีโอกาสน้อยมาก"
        3.  **คำแนะนำเพื่อปรับปรุง (หากจำเป็น):**
            - หากโอกาสน้อยหรือต้องพิจารณาเพิ่มเติม ควรอธิบายว่าต้องปรับปรุงเรื่องใดเป็นพิเศษ เช่น "ควรปิดบัญชีบัตรเครดิตที่มีประวัติค้างชำระ" หรือ "ควรลดภาระหนี้ต่อเดือนลงประมาณ X,XXX บาท โดยเริ่มจาก..."
            - หากมีโอกาสสูงอยู่แล้ว ให้คำแนะนำสั้นๆ เพื่อรักษาเครดิตที่ดี
        4.  **การคำนวณ DSR และคำแนะนำ:** จากข้อมูลรายได้และภาระหนี้ที่ให้มา โปรดคำนวณ DSR ที่แท้จริงของลูกค้า (สูตร: (ภาระหนี้ต่อเดือน * 100) / รายได้ต่อเดือน) และหากลูกค้ามีประวัติเครดิตไม่ดี ควรแนะนำว่าต้องลดภาระหนี้ลงเท่าไหร่เพื่อให้ DSR อยู่ในเกณฑ์ที่ปลอดภัย (เช่น ต่ำกว่า 40%-50%) โดยแสดงเป็นตัวเลขโดยประมาณ
        โปรดใช้ภาษาที่เป็นทางการ ให้คำแนะนำเหมือนที่ปรึกษามืออาชีพ และให้กำลังใจ`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            const aiText = data.candidates[0].content.parts[0].text;
            adviceContent.innerHTML = aiText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } else {
            adviceContent.textContent = "AI ไม่สามารถให้คำแนะนำได้ในขณะนี้ อาจมีปัญหาในการสร้างเนื้อหา";
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        adviceContent.textContent = 'เกิดข้อผิดพลาดในการขอคำแนะนำจาก AI กรุณาลองใหม่อีกครั้ง \n(ดูที่ Console สำหรับข้อมูลเพิ่มเติม)';
    }
}

// ผูก Event Listener หลังจากที่ DOM โหลดเสร็จแล้ว
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pdfUploader').addEventListener('change', handleFileSelect, false);
    // [แก้ไข] แก้ไขให้หาปุ่มได้ถูกต้อง
    const calcButton = document.querySelector('.button-group button:not(.ai-button)');
    if(calcButton) calcButton.addEventListener('click', calculateLoan);

    const aiButton = document.querySelector('.ai-button');
    if(aiButton) aiButton.addEventListener('click', getFinancialAdvice);
});