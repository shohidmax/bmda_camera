#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <WiFiManager.h> // Add WiFiManager library
#include <Update.h>

// OTA Configuration
const char* firmwareUrl = "https://github.com/shohidmax/pumpv3/releases/download/shohidpump/abbu_pump_online.ino.bin";
const char* versionUrl = "https://raw.githubusercontent.com/shohidmax/pumpv3/refs/heads/main/version.txt";
const char* currentFirmwareVersion = "1.0.0";
const unsigned long updateCheckInterval = 5 * 60 * 1000;  // 5 minutes in milliseconds
unsigned long lastUpdateCheck = 0;

// Backend API URL - Update with your server IP and port
const char* serverUrl = "http://YOUR_SERVER_IP:5000/api/trigger";

// Zone Code Configuration
const char* zoneCode = "ZONE_01";

// Pin definition for the physical trigger
const int TRIGGER_PIN = 4; // GPIO 4 (D4 on most ESP32 boards)

// NTP Configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 21600; // GMT+6 (Bangladesh Standard Time: 6 * 3600)
const int   daylightOffset_sec = 0;

// Trigger State
int lastPinState = HIGH;
unsigned long lastTriggerTime = 0;
const unsigned long COOLDOWN_MS = 10000; // 10 seconds cooldown between triggers

void setup() {
  Serial.begin(115200);
  
  // Set trigger pin as input with internal pull-up resistor
  pinMode(TRIGGER_PIN, INPUT_PULLUP);
  
  // Initialize WiFiManager
  WiFiManager wm;
  wm.setConfigPortalTimeout(180); // Timeout configuration portal after 3 minutes
  
  Serial.println("Attempting to connect to WiFi...");
  if (!wm.autoConnect("AegisEye_AP")) {
    Serial.println("WiFi connection failed or timed out. Restarting ESP32...");
    delay(3000);
    ESP.restart();
  }
  
  Serial.println("Connected to WiFi successfully!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize and sync NTP time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Syncing time with NTP...");
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println("Time synced successfully.");
  } else {
    Serial.println("Time sync failed! Will keep trying in loop.");
  }

  // Check for OTA update immediately at boot
  checkForFirmwareUpdate();
}

void loop() {
  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("WiFi disconnected. Reconnecting");
    WiFi.begin(); // Reconnect using saved credentials in NVS
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 10) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    Serial.println();
  }

  int currentPinState = digitalRead(TRIGGER_PIN);
  unsigned long now = millis();

  // Check for OTA updates periodically
  if (now - lastUpdateCheck > updateCheckInterval) {
    lastUpdateCheck = now;
    checkForFirmwareUpdate();
  }

  // Detect state change from HIGH to LOW (falling edge) with cooldown
  if (currentPinState == LOW && lastPinState == HIGH && (now - lastTriggerTime > COOLDOWN_MS)) {
    Serial.println("\n--- Trigger Detected on D4 (LOW) ---");
    lastTriggerTime = now;
    
    // Get formatted time
    String formattedTime = getFormattedTime();
    
    // Get MAC address (UID)
    String macAddress = WiFi.macAddress();
    
    // Send API alert request to server
    sendTriggerAlert(formattedTime, macAddress);
  }

  lastPinState = currentPinState;
  delay(50); // Small delay to debounce and save power
}

String getFormattedTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time. Using system runtime in ms.");
    return "UNKNOWN_TIME_UPTIME_" + String(millis());
  }
  
  char timeStringBuff[30];
  // Format: YYYY-MM-DD HH:MM:SS
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timeStringBuff);
}

void sendTriggerAlert(String timeStr, String macStr) {
  HTTPClient http;
  
  Serial.print("Sending POST trigger to: ");
  Serial.println(serverUrl);
  
  // Begin HTTP connection
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Construct JSON payload manually to keep sketch light
  String jsonPayload = "{";
  jsonPayload += "\"time\":\"" + timeStr + "\",";
  jsonPayload += "\"uid\":\"" + macStr + "\",";
  jsonPayload += "\"action\":\"PIN_LOW\",";
  jsonPayload += "\"message\":\"Security alert: Pin D4 is LOW!\",";
  jsonPayload += "\"zone_code\":\"" + String(zoneCode) + "\"";
  jsonPayload += "}";
  
  Serial.print("Payload: ");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response Code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.print("Server Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error sending POST: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

void checkForFirmwareUpdate() {
  Serial.println("Checking for firmware update...");
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  // Step 1: Fetch the latest version from GitHub
  String latestVersion = fetchLatestVersion();
  if (latestVersion == "") {
    Serial.println("Failed to fetch latest version");
    return;
  }

  Serial.println("Current Firmware Version: " + String(currentFirmwareVersion));
  Serial.println("Latest Firmware Version: " + latestVersion);

  // Step 2: Compare versions
  if (latestVersion != currentFirmwareVersion) {
    Serial.println("New firmware available. Starting OTA update...");
    downloadAndApplyFirmware();
  } else {
    Serial.println("Device is up to date.");
  }
}

String fetchLatestVersion() {
  HTTPClient http;
  http.begin(versionUrl);

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String latestVersion = http.getString();
    latestVersion.trim();  // Remove any extra whitespace
    http.end();
    return latestVersion;
  } else {
    Serial.printf("Failed to fetch version. HTTP code: %d\n", httpCode);
    http.end();
    return "";
  }
}

void downloadAndApplyFirmware() {
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.begin(firmwareUrl);

  int httpCode = http.GET();
  Serial.printf("HTTP GET code: %d\n", httpCode);

  if (httpCode == HTTP_CODE_OK) {
    int contentLength = http.getSize();
    Serial.printf("Firmware size: %d bytes\n", contentLength);

    if (contentLength > 0) {
      WiFiClient* stream = http.getStreamPtr();
      if (startOTAUpdate(stream, contentLength)) {
        Serial.println("OTA update successful, restarting...");
        delay(2000);
        ESP.restart();
      } else {
        Serial.println("OTA update failed");
      }
    } else {
      Serial.println("Invalid firmware size");
    }
  } else {
    Serial.printf("Failed to fetch firmware. HTTP code: %d\n", httpCode);
  }
  http.end();
}

bool startOTAUpdate(WiFiClient* client, int contentLength) {
  Serial.println("Initializing update...");
  if (!Update.begin(contentLength)) {
    Serial.printf("Update begin failed: %s\n", Update.errorString());
    return false;
  }

  Serial.println("Writing firmware...");
  size_t written = 0;
  int progress = 0;
  int lastProgress = 0;

  // Timeout variables
  const unsigned long timeoutDuration = 120 * 1000;  // 120 seconds timeout
  unsigned long lastDataTime = millis();

  while (written < contentLength) {
    if (client->available()) {
      uint8_t buffer[128];
      size_t len = client->read(buffer, sizeof(buffer));
      if (len > 0) {
        Update.write(buffer, len);
        written += len;
        lastDataTime = millis(); // Reset timeout on successful data read

        // Calculate and print progress
        progress = (written * 100) / contentLength;
        if (progress != lastProgress) {
          Serial.printf("Writing Progress: %d%%\n", progress);
          lastProgress = progress;
        }
      }
    }
    // Check for timeout
    if (millis() - lastDataTime > timeoutDuration) {
      Serial.println("Timeout: No data received for too long. Aborting update...");
      Update.abort();
      return false;
    }

    yield();
  }
  Serial.println("\nWriting complete");

  if (written != contentLength) {
    Serial.printf("Error: Write incomplete. Expected %d but got %d bytes\n", contentLength, written);
    Update.abort();
    return false;
  }

  if (!Update.end()) {
    Serial.printf("Error: Update end failed: %s\n", Update.errorString());
    return false;
  }

  Serial.println("Update successfully completed");
  return true;
}
