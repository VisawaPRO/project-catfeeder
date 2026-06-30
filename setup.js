function scanWiFi(){

    fetch('/scan')
    .then(r=>r.json())
    .then(data=>{

        let list=document.getElementById("list");
        list.innerHTML="";

        data.forEach(wifi=>{

            let div=document.createElement("div");
            div.className="wifi-item";
            div.innerHTML=wifi.ssid+" ("+wifi.rssi+"dBm)";

            div.onclick=function(){
                document.getElementById("ssid").value=wifi.ssid;
            };

            list.appendChild(div);

        });

    });

}

function save(){

    let ssid=document.getElementById("ssid").value;
    let pass=document.getElementById("pass").value;

    document.getElementById("status").innerHTML="Connecting...";

    fetch('/save',{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            ssid:ssid,
            pass:pass
        })
    })
    .then(r=>r.text())
    .then(res=>{

        document.getElementById("status").innerHTML=res;

    });

}