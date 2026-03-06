#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include "DHT.h"

// ---------- PIN DEFINITIONS ----------
#define PIR_PIN     34
#define DHT_PIN     4
#define ESC_PIN     25
#define VOLT_PIN    32
#define CURRENT_PIN 33

// ---------- WIFI CREDENTIALS ----------
const char* ssid = "i";
const char* password = "00000000";

// ---------- FIREBASE REST ----------
const String FIREBASE_HOST = "https://climate-sense-iot-default-rtdb.asia-southeast1.firebasedatabase.app";
const String FIREBASE_AUTH = "AIzaSyB4FHaLqYxfV5d1AsezftY8P2fVooT_6w8"; // leave empty if public DB

// ---------- SENSOR & CALC CONSTANTS ----------
const float ADC_REF = 3.3;
const int ADC_RES = 4095;
float VOLTAGE_RATIO = 11.0;
float CURRENT_OFFSET = 1.65;
float CURRENT_SENSITIVITY = 0.185;

// ---------- DHT SENSOR ----------
DHT dht(DHT_PIN, DHT11); // directly specify DHT11

Servo esc;

// ---------- ENERGY TRACKING ----------
float daily_kWh = 0;
float monthly_kWh = 0;
unsigned long lastEnergyCalc = 0;

// ---------- FAN CONTROL ----------
String fanStatus = "OFF";
String fanSpeed = "OFF";

// ---------- FUNCTION DECLARATIONS ----------
float readVoltage();
float readCurrent();
void sendToFirebase(float temperature,float humidity,float voltage,float current,float power,int motion);

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(VOLT_PIN, INPUT);
  pinMode(CURRENT_PIN, INPUT);

  esc.attach(ESC_PIN, 1000, 2000);
  esc.writeMicroseconds(1000); // OFF

  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

float readVoltage() {
  int adc = analogRead(VOLT_PIN);
  float voltage = (adc * ADC_REF) / ADC_RES;
  return voltage * VOLTAGE_RATIO;
}

float readCurrent() {
  int adc = analogRead(CURRENT_PIN);
  float voltage = (adc * ADC_REF) / ADC_RES;
  return (voltage - CURRENT_OFFSET) / CURRENT_SENSITIVITY;
}

void sendToFirebase(float temperature,float humidity,float voltage,float current,float power,int motion) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = FIREBASE_HOST + "/sensors.json";

    String data = "{";
    data += "\"temperature\":" + String(temperature) + ",";
    data += "\"humidity\":" + String(humidity) + ",";
    data += "\"voltage\":" + String(voltage) + ",";
    data += "\"current\":" + String(current) + ",";
    data += "\"power\":" + String(power) + ",";
    data += "\"motion\":" + String(motion) + ",";
    data += "\"fan\":{";
    data += "\"status\":\"" + fanStatus + "\",";
    data += "\"speed\":\"" + fanSpeed + "\"";
    data += "},";
    data += "\"energy\":{";
    data += "\"daily_units\":" + String(daily_kWh) + ",";
    data += "\"monthly_units\":" + String(monthly_kWh);
    data += "}}";

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int code = http.PUT(data);

    if (code > 0) Serial.println("Firebase Updated");
    else {
      Serial.print("Firebase Error: ");
      Serial.println(http.errorToString(code));
    }
    http.end();
  }
}

void loop() {
  int motion = digitalRead(PIR_PIN);

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  float voltage = readVoltage();
  float current = readCurrent();
  float power = voltage * current;

  // ---------- ENERGY CALCULATION ----------
  if (millis() - lastEnergyCalc >= 3000) {
    daily_kWh += (power * 3.0 / 3600.0);
    monthly_kWh += (power * 3.0 / 3600.0);
    lastEnergyCalc = millis();
  }

  // ---------- FAN CONTROL ----------
  if (motion == HIGH) {
    if (temperature <= 25) {
      esc.writeMicroseconds(1200);
      fanStatus = "ON"; fanSpeed = "LOW";
    } else if (temperature <= 35) {
      esc.writeMicroseconds(1400);
      fanStatus = "ON"; fanSpeed = "MEDIUM";
    } else {
      esc.writeMicroseconds(1600);
      fanStatus = "ON"; fanSpeed = "HIGH";
    }
  } else {
    esc.writeMicroseconds(1000);
    fanStatus = "OFF"; fanSpeed = "OFF";
  }

  // ---------- SERIAL MONITOR ----------
  Serial.println("========== SENSOR DATA ==========");
  Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" C");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Voltage: "); Serial.print(voltage); Serial.println(" V");
  Serial.print("Current: "); Serial.print(current); Serial.println(" A");
  Serial.print("Power (W): "); Serial.println(power);
  Serial.print("Motion: "); Serial.println(motion);
  Serial.print("Fan Status: "); Serial.println(fanStatus);
  Serial.print("Fan Speed: "); Serial.println(fanSpeed);
  Serial.print("Daily Units (kWh): "); Serial.println(daily_kWh);
  Serial.print("Monthly Units (kWh): "); Serial.println(monthly_kWh);
  Serial.println("=================================");

  sendToFirebase(temperature, humidity, voltage, current, power, motion);

  delay(3000);
}
