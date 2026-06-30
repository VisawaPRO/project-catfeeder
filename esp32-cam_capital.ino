#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

WebServer server(80);
Preferences prefs;

String ssid, pass;

/* =========================
   AP MODE
=========================*/

void startAP(){

  WiFi.softAP("CatFeeder-Setup");

  Serial.println("AP Started");

}

/* =========================
   SCAN WIFI
=========================*/

void handleScan(){

  int n = WiFi.scanNetworks();

  String json = "[";

  for(int i=0;i<n;i++){

    json += "{";

    json += "\"ssid\":\""+WiFi.SSID(i)+"\",";

    json += "\"rssi\":"+String(WiFi.RSSI(i));

    json += "}";

    if(i<n-1) json += ",";

  }

  json += "]";

  server.send(200,"application/json",json);

}

/* =========================
   SAVE WIFI
=========================*/

void handleSave(){

  String body = server.arg("plain");

  int s1 = body.indexOf("ssid\":\"")+7;
  int s2 = body.indexOf("\"",s1);

  int p1 = body.indexOf("pass\":\"")+7;
  int p2 = body.indexOf("\"",p1);

  ssid = body.substring(s1,s2);
  pass = body.substring(p1,p2);

  prefs.begin("wifi",false);
  prefs.putString("ssid",ssid);
  prefs.putString("pass",pass);
  prefs.end();

  server.send(200,"text/plain","Saved. Restarting...");

  delay(1500);
  ESP.restart();

}

/* =========================
   CONNECT WIFI
=========================*/

bool connectWiFi(){

  prefs.begin("wifi",true);

  ssid = prefs.getString("ssid","");
  pass = prefs.getString("pass","");

  prefs.end();

  if(ssid=="") return false;

  WiFi.begin(ssid.c_str(),pass.c_str());

  int t=0;

  while(WiFi.status()!=WL_CONNECTED && t<20){

    delay(500);
    t++;

  }

  return WiFi.status()==WL_CONNECTED;

}

/* =========================
   SETUP
=========================*/

void setup(){

  Serial.begin(115200);

  if(!connectWiFi()){

    startAP();

  }

  server.on("/scan",handleScan);
  server.on("/save",HTTP_POST,handleSave);

  server.begin();

}

/* =========================
   LOOP
=========================*/

void loop(){

  server.handleClient();

}