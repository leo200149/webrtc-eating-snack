const PLAYER_COUNT = 2;
const hostManager = function(){
    let ps = {};
    let clientCount = 1;
    const connectResult = document.querySelector('#connectResult');
    function initHost(){
        let p = new SimplePeer({
            initiator: true,
            trickle: false
        });
        let id = 'p'+clientCount;
        p.on('error', err => p.isConnect = false);
        p.on('signal', data => {
            let key = btoa(JSON.stringify(data));
            connectResult.innerHTML += '<p>'+id+":"+ key +'</p>';
            ps[id]={peer:p,id:id};
        });
        p.on('connect', () => {
            connectResult.innerHTML += '<p>'+id+' CONNECT</p>';
        });
        p.on('data', data => {
            data = ''+data;
            let event = JSON.parse(data);
            if(event.type==="player"){
                updatePlayer(event.data);
            }
        });
        clientCount++;
    }
    function initHosts(){
        for(let i =0;i<PLAYER_COUNT-1;i++){
            initHost();
        }
    }
    function addClient(input){
        let keys = input.split(':');
        let id = keys[0];
        let key = keys[1];
        let p = ps[id];
        if (p==null){
            return
        }
        p.peer.signal(JSON.parse(atob(key)));
        p.isConnect = true;
    }
    return {
        init:function(){
            initHosts();
        },
        addClient:function(input){
            addClient(input);
        },
        notifyStart:function(){
            for(let id in ps){
                let p = ps[id];
                if(p.isConnect){
                    p.peer.send(JSON.stringify({type:"start"}));
                    function sendData(){
                        if(p.isConnect){
                            let data = getData();
                            p.peer.send(JSON.stringify({type:"data",data:data}));
                            setTimeout(sendData,1000/100);
                        }
                    }
                    sendData();
                }else{
                    delete ps[id];
                }
            }
        }
    };
}();

const clientManager = function(){
    let p;
    const connectResult = document.querySelector('#connectResult');
    function init(input){
        p = new SimplePeer({trickle: false});
        let keys = input.split(':');
        let id = keys[0];
        let key = keys[1];
        let first = true;
        let isConnect = false;
        p.on('error', err => isConnect = false);
        p.on('signal', data => {
            if(first){
                connectResult.innerHTML += '<p>'+ id+':'+btoa(JSON.stringify(data))+'</p>';
                first = false;
            }
        });
        p.on('connect', () => {
            connectResult.innerHTML += '<p>CONNECT</p>';
            isConnect= true;
        });
        p.on('data', data => {
            data = ''+data;
            let event = JSON.parse(data);
            if(event.type==="start"){
                start(false,id);
                function sendData(){
                    if(isConnect){
                        let data = getPlayer();
                        if(data!=null){
                            p.send(JSON.stringify({type:"player",data:data}));
                        }
                        setTimeout(sendData,30);
                    }
                }
                sendData();
            }else if(event.type==="data"){
                setData(event.data);
            }
        });
        p.signal(JSON.parse(atob(key)));
    }
    return {
        init:function(input){
            init(input);
        }
    };
}();

let keyInput = document.querySelector('#keyInput');

document.querySelector('#hostBtn').addEventListener('click',function(){
    hostManager.init();
    document.querySelector('#hostBtn').style.display = 'none';
    document.querySelector('#clientBtn').style.display = 'none';
    document.querySelector('#addClientBtn').style.display = '';
    document.querySelector('#startBtn').style.display = '';
});

document.querySelector('#addClientBtn').addEventListener('click',function(){
    hostManager.addClient(keyInput.value.trim());
});

document.querySelector('#clientBtn').addEventListener('click',function(){
    if(keyInput.value.length==0){
        return
    }
    document.querySelector('#hostBtn').style.display = 'none';
    clientManager.init(keyInput.value.trim());
});

document.querySelector('#startBtn').addEventListener('click',function(){
    document.querySelector('#startBtn').style.display = 'none';
    start(true,'p0',PLAYER_COUNT);
    hostManager.notifyStart();
});