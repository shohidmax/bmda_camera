#!/bin/bash

# Configuration
PORT=5050
SERVER_URL="http://localhost:${PORT}"
TEST_MAC="00:11:22:33:44:55"
TEST_USER="mock-user-123"

echo "=== Aegis Eye: Security System Test Utility ==="
echo "Testing backend server on URL: ${SERVER_URL}"
echo ""

# 1. Register a test device
echo "Step 1: Registering Test Camera Device..."
curl -s -X POST "${SERVER_URL}/api/devices" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"${TEST_MAC}\",
    \"deviceName\": \"Test Front Door Node\",
    \"cameraUrl\": \"https://picsum.photos/800/600\",
    \"zoneCode\": \"ZONE_TEST\",
    \"userId\": \"${TEST_USER}\"
  }" | json_pp 2>/dev/null || curl -s -X POST "${SERVER_URL}/api/devices" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"${TEST_MAC}\",
    \"deviceName\": \"Test Front Door Node\",
    \"cameraUrl\": \"https://picsum.photos/800/600\",
    \"zoneCode\": \"ZONE_TEST\",
    \"userId\": \"${TEST_USER}\"
  }"

echo ""
echo ""

# 2. Simulate ESP32 GPIO 4 HIGH trigger
echo "Step 2: Simulating ESP32 physical trigger (GPIO 4 High)..."
curl -s -X POST "${SERVER_URL}/api/trigger" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"${TEST_MAC}\",
    \"time\": \"$(date '+%Y-%m-%d %H:%M:%S')\",
    \"action\": \"PIN_HIGH\",
    \"message\": \"Test alert: GPIO D4 Pin HIGH detected!\",
    \"zone_code\": \"ZONE_TEST\"
  }" | json_pp 2>/dev/null || curl -s -X POST "${SERVER_URL}/api/trigger" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"${TEST_MAC}\",
    \"time\": \"$(date '+%Y-%m-%d %H:%M:%S')\",
    \"action\": \"PIN_HIGH\",
    \"message\": \"Test alert: GPIO D4 Pin HIGH detected!\",
    \"zone_code\": \"ZONE_TEST\"
  }"

echo ""
echo ""
echo "=== Test simulation triggered! ==="
echo "Check your backend console. You should see:"
echo "1. Photo acquisition starting (fetching 3 frames)"
echo "2. Gemini AI analyzing the frames"
echo "3. Threat scoring"
echo "4. Central Commander executing webhooks if threat rating is critical (80-95%)"
