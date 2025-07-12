# 📘 LoanBand Display & Validation Fix

**Last Updated:** 2025-07-12

---

## 🎯 Objective

เพื่อแก้ปัญหา:

1. ตารางแสดงผล Loanband ไม่ตรงกับ UX/UI ที่ออกแบบไว้
2. ค่าประมาณวงเงินกู้สูงสุดไม่ถูกจำกัดตามมูลค่าสินทรัพย์จริง (asset value)

---

## ✅ ความต้องการของตาราง Loanband ที่ถูกต้อง

### Format ที่ควรได้:

| สถานการณ์ภาระหนี้ | ระยะเวลา 40 ปี | ระยะเวลา 30 ปี | ระยะเวลา 20 ปี | ระยะเวลา 10 ปี |
|--------------------|----------------|----------------|----------------|----------------|
| ปัจจุบัน (3,146)   | 4,055,854      | 3,538,085      | 3,197,885      | 1,646,436      |
| -10% (2,831)       | 4,132,585      | 3,605,021      | 3,258,385      | 1,677,584      |
| ...                | ...            | ...            | ...            | ...            |

### เงื่อนไข:

- **แนวนอน (horizontal)**: หัวตารางเป็น “ระยะเวลากู้”
- วน loop `refbank` เฉพาะปีที่ธนาคารมีข้อมูล
- ใช้ `Math.round(value * 100) / 100` เพื่อปัดผลลัพธ์แสดง 2 ตำแหน่ง (ไม่ใช้ระหว่างคำนวณ)

---

## ❌ ปัญหา: วงเงินกู้เกินกว่ามูลค่าสินทรัพย์

### สาเหตุ:
- ลืมใช้ `MIN(... , assetValue * LTV%)` ในการจำกัด loan amount

### ตัวอย่างผิดพลาด:
> มูลค่าสินทรัพย์ 1,672,000 บาท  
> ผลลัพธ์ loan = 4,823,171 ❌ (ควร max ได้แค่ 1,672,000 บาท)

---

## ✅ Logic ที่ถูกต้อง

```ts
function calculateLoanAmount({ income, debt, refbankRate, assetValue, LTV }) {
  const dsrBasedLoan = ((income * 0.7) - debt) / refbankRate * 1_000_000;
  const maxLoanFromAsset = assetValue * (LTV / 100);

  return Math.min(dsrBasedLoan, maxLoanFromAsset);
}
```

---

## 📦 Pseudocode สำหรับ Render ตาราง

```ts
const debtScenarios = [0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7];
const terms = [40, 30, 20, 10];
const output = [];

for (let i = 0; i < debtScenarios.length; i++) {
  const adjustedDebt = currentDebt * (1 + debtScenarios[i]);
  const row = {
    label: `${debtScenarios[i] * 100}%`,
    debt: adjustedDebt
  };

  for (let term of terms) {
    const refRate = refbank[bank][term];
    if (!refRate) {
      row[term] = "-";
    } else {
      row[term] = calculateLoanAmount({
        income, debt: adjustedDebt, refbankRate: refRate,
        assetValue, LTV
      });
    }
  }

  output.push(row);
}
```

---

## 🛠️ Dev Tips

- เช็ก `refbank[bank][term]` ว่ามีค่าหรือไม่ก่อน render
- ปัดเศษแค่ตอนแสดงผล (`toFixed(2)`) ไม่ควรใช้ระหว่างคำนวณ
- ใช้ CSS หรือ Tailwind จัด UI ตารางให้แนวนอนแบบ UX ที่ออกแบบไว้
