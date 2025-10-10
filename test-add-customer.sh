#!/bin/bash

# Get token
echo "=== Step 1: Login ==="
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

TOKEN=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo $RESPONSE
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:50}..."

# Add customer with loan problems
echo ""
echo "=== Step 2: Add Customer with Loan Problems ==="

CUSTOMER_DATA='{
  "date": "2025-10-10",
  "name": "ทดสอบ ลูกค้าใหม่",
  "phone": "0812345678",
  "age": 35,
  "income": 50000,
  "debt": 10000,
  "propertyPrice": 2000000,
  "discount": 100000,
  "ltv": 90,
  "targetBank": "KTB",
  "loanProblem": ["ปัญหาหนี้สูง", "รายได้ไม่พอ", "ไม่มีหลักประกัน"],
  "actionPlan": ["ลดหนี้", "เพิ่มรายได้", "หาผู้ค้ำประกัน"]
}'

echo "Customer Data:"
echo "$CUSTOMER_DATA" | python3 -m json.tool 2>/dev/null

RESPONSE=$(curl -s -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$CUSTOMER_DATA")

echo ""
echo "Response:"
echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data, indent=2, ensure_ascii=False))" 2>/dev/null || echo "$RESPONSE"

# Check if customer was created
CUSTOMER_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('customer', {}).get('id', ''))" 2>/dev/null)

if [ -n "$CUSTOMER_ID" ]; then
  echo ""
  echo "✅ Customer created successfully with ID: $CUSTOMER_ID"

  echo ""
  echo "=== Step 3: Get Customer Details ==="
  CUSTOMER=$(curl -s -X GET "http://localhost:3001/api/customers/$CUSTOMER_ID" \
    -H "Authorization: Bearer $TOKEN")

  echo "$CUSTOMER" | python3 -c "
import sys, json
data = json.load(sys.stdin)
customer = data.get('customer', {})
print(f\"Name: {customer.get('name')}\")
print(f\"Phone: {customer.get('phone')}\")
print(f\"Loan Problems: {len(customer.get('loanProblems', []))}\")
print(f\"Action Plans: {len(customer.get('actionPlans', []))}\")
print()
print('Loan Problems:')
for p in customer.get('loanProblems', []):
    print(f\"  - {p.get('problem')}\")
print()
print('Action Plans:')
for p in customer.get('actionPlans', []):
    print(f\"  - {p.get('plan')}\")
" 2>/dev/null || echo "$CUSTOMER"
else
  echo ""
  echo "❌ Failed to create customer"
fi
