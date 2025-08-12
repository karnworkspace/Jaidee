export function calculateRentToOwn({
  propertyPrice,            // มูลค่าทรัพย์เต็มจำนวน (ผู้ใช้กรอก)
  discount,
  overpaidRent,
  installmentMonths,
  rentRatePerMillion = 4100,
  guaranteeMultiplier = 2,
  prepaidRentMultiplier = 1,
  transferYear = 1,
  annualInterestRate = 0    // อัตราดอกเบี้ยต่อปี (ใหม่)
}) {
  // Step 1: Pre-Calculation
  const propertyAfterDiscount = propertyPrice - discount;
  const rawMonthlyRent = (propertyAfterDiscount * rentRatePerMillion) / 1_000_000;
  const monthlyRent = Math.ceil(rawMonthlyRent / 100) * 100; // Round up to nearest hundred

  const guarantee = monthlyRent * guaranteeMultiplier;
  const prepaidRent = monthlyRent * prepaidRentMultiplier;
  const totalRequired = guarantee + prepaidRent;
  const initialPayment = Math.max(0, totalRequired - overpaidRent); // This is the actual payment made by user
  const actualOverpayment = Math.max(0, overpaidRent - totalRequired); // This is the overpayment that contributes to principal

  // Step 2: Initialize Result Array
  const amortizationTable = [];
  let currentRemainingPrincipal = propertyAfterDiscount; // Use a different variable name to avoid confusion with final remainingPrincipal

  // Step 3: Loop to Build Table
  for (let month = 1; month <= installmentMonths; month++) {
    let payment, interest, principalPaid;

    if (month === 1) {
      payment = Math.max(initialPayment, 0); // ชำระเพิ่มเติมในงวดแรก (หากมี)
      interest = 0; // งวดแรกยังไม่มีดอกเบี้ย
      
      // คำนวณเงินต้นที่จ่ายในงวดแรก
      // เงินต้น = จำนวนที่จ่ายจริงทั้งหมด - ค่าประกัน - ค่าเช่าล่วงหน้า
      const totalAmountPaid = initialPayment + overpaidRent;
      principalPaid = totalAmountPaid - guarantee - prepaidRent;
      
      // ตรวจสอบให้แน่ใจว่า principalPaid ไม่เป็นค่าติดลบ
      principalPaid = Math.max(0, principalPaid);
      currentRemainingPrincipal = propertyAfterDiscount - principalPaid;
    } else {
      payment = monthlyRent;
      interest = Math.round(currentRemainingPrincipal * (annualInterestRate / 100) / 12 * 100) / 100; // Round to 2 decimal places
      principalPaid = payment - interest;
      currentRemainingPrincipal = currentRemainingPrincipal - principalPaid;
    }

    amortizationTable.push({
      installment: month,
      payment: Math.round(payment),
      interest: Math.round(interest),
      principalPaid: Math.round(principalPaid),
      remainingPrincipal: Math.round(currentRemainingPrincipal),
    });
  }

  // Step 4: Add “สิ้นงวด” rows at 12, 24, 36 months
  const endOfMonthInstallments = [12, 24, 36];
  for (const endMonth of endOfMonthInstallments) {
    if (installmentMonths >= endMonth) {
      const previousMonthData = amortizationTable.find(row => row.installment === endMonth);
      if (previousMonthData) {
        const previousRemaining = previousMonthData.remainingPrincipal;
        const interestFinal = Math.round(previousRemaining * (annualInterestRate / 100) / 12 * 100) / 100;
        const principalFinal = 0; // ไม่มีการชำระเงินต้นในสิ้นงวด
        const remainingFinal = previousRemaining;

        amortizationTable.push({
          installment: `สิ้นงวดที่ ${endMonth}`,
          payment: Math.round(interestFinal),
          interest: Math.round(interestFinal),
          principalPaid: Math.round(principalFinal),
          remainingPrincipal: Math.round(remainingFinal),
        });
      }
    }
  }

  // Summary results (from previous detailed calculation, adjusted for new logic)
  const totalPaid = monthlyRent * installmentMonths;
  const additionalPayment = initialPayment; // Use the corrected initialPayment instead
  let transferFeeRate = 0;
  if (transferYear === 1) transferFeeRate = 0.01;
  else if (transferYear === 2) transferFeeRate = 0.015;
  else if (transferYear === 3) transferFeeRate = 0.02;
  const transferFee = propertyAfterDiscount * transferFeeRate;

  const accumulatedSavings = totalPaid * 0.80; // Assuming 80% as per previous formula

  return {
    propertyAfterDiscount: Math.round(propertyAfterDiscount),
    monthlyRent: Math.round(monthlyRent),
    totalPaid: Math.round(totalPaid),
    guarantee: Math.round(guarantee),
    prepaidRent: Math.round(prepaidRent),
    additionalPayment: Math.round(additionalPayment),
    transferFee: Math.round(transferFee),
    accumulatedSavings: Math.round(accumulatedSavings),
    remainingPrincipal: Math.round(currentRemainingPrincipal), // This will be the final remaining principal from the table
    amortizationTable: amortizationTable,
  };
}