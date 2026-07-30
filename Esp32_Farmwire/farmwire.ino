#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <WiFiManager.h> // WiFiManager library
#include <Update.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <esp_task_wdt.h>
#include "esp_ota_ops.h"
#include "mbedtls/sha256.h"

// Status LED Pin for Progress
#define STATUS_LED_PIN 2 // GPIO 2 (Built-in LED on most ESP32 boards)

// OTA Configuration
const char* firmwareUrl = "https://github.com/shohidmax/bmda_camera/releases/download/maxit/bmdacamera.ino.bin";
const char* versionUrl = "https://raw.githubusercontent.com/shohidmax/bmda_camera/refs/heads/main/Esp32_Farmwire/vesion.txt";
const char* currentFirmwareVersion = "1.0.2";
const unsigned long updateCheckInterval = 5 * 60 * 1000;  // 5 minutes in milliseconds
unsigned long lastUpdateCheck = 0;

// Parsed Expected SHA256 Hash
String expectedSHA256 = "";

// Backend API URL - Update with your server IP and port
const char* serverUrl = "https://transformer-camera-api.maxapi.esp32.site/api/trigger";

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

// Exponential Wi-Fi Reconnect Variables
unsigned long wifiReconnectInterval = 1000; // Start with 1 second
const unsigned long maxWifiReconnectInterval = 60000; // Max 1 minute backoff
unsigned long lastWifiReconnectAttempt = 0;

// Function Declarations
void checkForFirmwareUpdate();
String fetchLatestVersionContent();
void downloadAndApplyFirmware();
bool startOTAUpdate(WiFiClientSecure* client, int contentLength);
bool isNewVersionAvailable(String current, String latest);
String getFormattedTime();
void sendTriggerAlert(String timeStr, String macStr);
bool postEventPayload(String jsonPayload);
void saveEventToQueue(String jsonPayload);
void processOfflineQueue();

void setup() {
  Serial.begin(115200);
  
  // Set trigger pin as input with internal pull-up resistor
  pinMode(TRIGGER_PIN, INPUT_PULLUP);
  
  // Set status LED pin as output
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW); // Initially off

  // Mount SPIFFS for offline event queue
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS Mount Failed! Offline queue will not work.");
  } else {
    Serial.println("SPIFFS Mounted successfully.");
  }

  // Initialize and sync NTP time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

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

  Serial.println("Syncing time with NTP...");
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println("Time synced successfully.");
  } else {
    Serial.println("Time sync failed! Will keep trying in loop.");
  }

  // Rollback check & cancellation on successful boot
  const esp_partition_t *running = esp_ota_get_running_partition();
  esp_ota_img_states_t ota_state;
  if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK) {
    if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
      if (esp_ota_mark_app_valid_cancel_rollback() == ESP_OK) {
        Serial.println("App marked as valid, rollback cancelled!");
      } else {
        Serial.println("Failed to mark app as valid!");
      }
    }
  }

  // Configure Hardware Watchdog Timer
#if ESP_IDF_VERSION_MAJOR >= 5
  // Core 3.x already initializes the WDT on startup. Reconfigure it instead of init.
  esp_task_wdt_config_t wdt_config = {
      .timeout_ms = 30000,
      .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
      .trigger_panic = true
  };
  esp_task_wdt_reconfigure(&wdt_config);
#else
  esp_task_wdt_deinit();
  esp_task_wdt_init(30, true); // 30 seconds timeout, panic on timeout
#endif
  esp_task_wdt_add(NULL); // Add loop task to WDT

  // Check for OTA update immediately at boot
  checkForFirmwareUpdate();
}

void loop() {
  // Feed Watchdog
  esp_task_wdt_reset();

  // Exponential Wi-Fi Reconnect logic
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long currentMillis = millis();
    if (currentMillis - lastWifiReconnectAttempt > wifiReconnectInterval) {
      lastWifiReconnectAttempt = currentMillis;
      Serial.printf("WiFi disconnected. Reconnecting in %lu ms...\n", wifiReconnectInterval);
      WiFi.disconnect();
      WiFi.begin();
      
      // Double the interval up to the max limit
      wifiReconnectInterval = min(wifiReconnectInterval * 2, maxWifiReconnectInterval);
    }
  } else {
    // Reset backoff interval on successful connection
    wifiReconnectInterval = 1000;
    
    // Process offline event queue if connected
    processOfflineQueue();
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
    
    // Send API alert request
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
  // Construct JSON using ArduinoJson (supporting JsonDocument/StaticJsonDocument compatibility)
#if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
#else
  StaticJsonDocument<256> doc;
#endif

  doc["time"] = timeStr;
  doc["uid"] = macStr;
  doc["action"] = "PIN_LOW";
  doc["message"] = "Security alert: Pin D4 is LOW!";
  doc["zone_code"] = zoneCode;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  if (WiFi.status() == WL_CONNECTED && postEventPayload(jsonPayload)) {
    Serial.println("Trigger alert sent successfully!");
  } else {
    Serial.println("WiFi offline or server down. Saving event to offline queue.");
    saveEventToQueue(jsonPayload);
  }
}

bool postEventPayload(String jsonPayload) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // Set HTTP timeout to 5 seconds to prevent watchdog triggers
  
  int httpResponseCode = http.POST(jsonPayload);
  http.end();
  
  return httpResponseCode == HTTP_CODE_OK || httpResponseCode == 201;
}

void saveEventToQueue(String jsonPayload) {
  String filename = "/q_" + String(millis()) + "_" + String(random(1000)) + ".json";
  File file = SPIFFS.open(filename, FILE_WRITE);
  if (!file) {
    Serial.println("Failed to open file in SPIFFS for queuing");
    return;
  }
  file.print(jsonPayload);
  file.close();
  Serial.printf("Saved event to SPIFFS: %s\n", filename.c_str());
}

void processOfflineQueue() {
  File root = SPIFFS.open("/");
  if (!root || !root.isDirectory()) return;
  
  File file = root.openNextFile();
  while (file) {
    String filename = String(file.name());
    if (filename.startsWith("/q_") && filename.endsWith(".json")) {
      Serial.print("Processing offline event: ");
      Serial.println(filename);
      
      String jsonPayload = "";
      while (file.available()) {
        jsonPayload += (char)file.read();
      }
      file.close(); // Close file before POSTing / deleting
      
      if (postEventPayload(jsonPayload)) {
        SPIFFS.remove(filename);
        Serial.println("Offline event sent and removed from queue.");
      } else {
        Serial.println("Failed to send offline event. Retrying later.");
        break; // Stop processing if server remains unreachable
      }
    } else {
      file.close();
    }
    file = root.openNextFile();
  }
}

void checkForFirmwareUpdate() {
  Serial.println("Checking for firmware update...");
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  // Step 1: Fetch the latest version from GitHub
  String versionContent = fetchLatestVersionContent();
  if (versionContent == "") {
    Serial.println("Failed to fetch version content");
    return;
  }

  // Parse version and hash (line 1: version, line 2: SHA256 hex string)
  int newlineIndex = versionContent.indexOf('\n');
  String latestVersion = "";
  if (newlineIndex != -1) {
    latestVersion = versionContent.substring(0, newlineIndex);
    expectedSHA256 = versionContent.substring(newlineIndex + 1);
    latestVersion.trim();
    expectedSHA256.trim();
  } else {
    latestVersion = versionContent;
    latestVersion.trim();
    expectedSHA256 = "";
  }

  Serial.println("Current Firmware Version: " + String(currentFirmwareVersion));
  Serial.println("Latest Firmware Version: " + latestVersion);
  if (expectedSHA256 != "") {
    Serial.println("Expected SHA256: " + expectedSHA256);
  }

  // Step 2: Compare versions semantically
  if (isNewVersionAvailable(currentFirmwareVersion, latestVersion)) {
    Serial.println("New firmware available. Starting OTA update...");
    downloadAndApplyFirmware();
  } else {
    Serial.println("Device is up to date.");
  }
}

String fetchLatestVersionContent() {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(5); // TCP timeout of 5 seconds
  
  HTTPClient http;
  http.begin(client, versionUrl);
  http.setTimeout(5000); // HTTP timeout of 5 seconds

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String versionContent = http.getString();
    http.end();
    return versionContent;
  } else {
    Serial.printf("Failed to fetch version. HTTP code: %d\n", httpCode);
    http.end();
    return "";
  }
}

void downloadAndApplyFirmware() {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(10); // TCP timeout of 10 seconds

  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.begin(client, firmwareUrl);
  http.setTimeout(15000); // HTTP timeout of 15 seconds

  int httpCode = http.GET();
  Serial.printf("HTTP GET code: %d\n", httpCode);

  if (httpCode == HTTP_CODE_OK) {
    int contentLength = http.getSize();
    Serial.printf("Firmware size: %d bytes\n", contentLength);

    if (contentLength > 0) {
      if (startOTAUpdate(&client, contentLength)) {
        Serial.println("OTA update successful, restarting...");
        delay(2000);
        ESP.restart();
      } else {
        Serial.println("OTA update failed.");
      }
    } else {
      Serial.println("Invalid firmware size.");
    }
  } else {
    Serial.printf("Failed to fetch firmware. HTTP code: %d\n", httpCode);
  }
  http.end();
}

bool startOTAUpdate(WiFiClientSecure* client, int contentLength) {
  Serial.println("Initializing update...");
  if (!Update.begin(contentLength)) {
    Serial.printf("Update begin failed: %s\n", Update.errorString());
    return false;
  }

  // Initialize SHA256 context
  mbedtls_sha256_context sha_ctx;
  mbedtls_sha256_init(&sha_ctx);
  mbedtls_sha256_starts(&sha_ctx, 0); // 0 for SHA-256

  Serial.println("Writing firmware...");
  size_t written = 0;
  int progress = 0;
  int lastProgress = 0;

  // Timeout variables
  const unsigned long timeoutDuration = 120 * 1000;  // 120 seconds timeout
  unsigned long lastDataTime = millis();

  while (written < contentLength) {
    // Reset Task Watchdog
    esp_task_wdt_reset();

    if (client->available()) {
      uint8_t buffer[128];
      size_t len = client->read(buffer, sizeof(buffer));
      if (len > 0) {
        Update.write(buffer, len);
        
        // Update SHA256 calculation
        mbedtls_sha256_update(&sha_ctx, buffer, len);
        
        written += len;
        lastDataTime = millis(); // Reset timeout on successful read

        // Toggle LED to show writing progress
        digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));

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
      mbedtls_sha256_free(&sha_ctx);
      digitalWrite(STATUS_LED_PIN, LOW);
      return false;
    }

    yield();
  }
  Serial.println("\nWriting complete.");
  digitalWrite(STATUS_LED_PIN, HIGH); // Turn solid ON on write complete

  // Compute final SHA256 hash
  unsigned char sha_output[32];
  mbedtls_sha256_finish(&sha_ctx, sha_output);
  mbedtls_sha256_free(&sha_ctx);

  String calculatedSHA256 = "";
  for (int i = 0; i < 32; i++) {
    char buf[3];
    sprintf(buf, "%02x", sha_output[i]);
    calculatedSHA256 += buf;
  }
  Serial.println("Calculated SHA256: " + calculatedSHA256);

  if (expectedSHA256 != "" && calculatedSHA256 != expectedSHA256) {
    Serial.println("Error: SHA256 verification failed! Aborting update.");
    Update.abort();
    digitalWrite(STATUS_LED_PIN, LOW);
    return false;
  }

  if (written != contentLength) {
    Serial.printf("Error: Write incomplete. Expected %d but got %d bytes\n", contentLength, written);
    Update.abort();
    digitalWrite(STATUS_LED_PIN, LOW);
    return false;
  }

  if (!Update.end()) {
    Serial.printf("Error: Update end failed: %s\n", Update.errorString());
    digitalWrite(STATUS_LED_PIN, LOW);
    return false;
  }

  Serial.println("Update successfully completed. Verified SHA256 hash.");
  digitalWrite(STATUS_LED_PIN, LOW);
  return true;
}

bool isNewVersionAvailable(String current, String latest) {
  int curMajor = 0, curMinor = 0, curPatch = 0;
  int latMajor = 0, latMinor = 0, latPatch = 0;
  
  sscanf(current.c_str(), "%d.%d.%d", &curMajor, &curMinor, &curPatch);
  sscanf(latest.c_str(), "%d.%d.%d", &latMajor, &latMinor, &latPatch);
  
  if (latMajor > curMajor) return true;
  if (latMajor < curMajor) return false;
  
  if (latMinor > curMinor) return true;
  if (latMinor < curMinor) return false;
  
  return latPatch > curPatch;
}
