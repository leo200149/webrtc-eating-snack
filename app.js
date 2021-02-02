const CONFIGS = {
    ITEM_COLOR : 'white',
    ENEMY_COLOR : 'yellow',
    STRONG_ENEMY_COLOR : 'orange',
    GAME_OVER_COLOR : 'red',
    WIDTH: 1000,
    HEIGHT: 500,
    CENTER : 500,
    BOTTOM : 500,
    BULLET_SIZE: 8,
    ENEMY_SIZE: 6,
    SNACK_WIDTH : 10,
    SNACK_HEIGHT : 40,
    SNACK_TOP : 460,
    GEN_ENEMY_MARGIN_LEFT: 300,
    GEN_ENEMY_WIDTH: 400,
    BULLET_SPEED : 2,
    ENEMY_SPEED: 2,
    GEN_ENEMY_SPEED: 300,
    SHOOT_SPEED: 50,
    SNACK_MOVE_SPEED: 30,
    FPS: 60,
    GAME_TIME: 300,
  };
  
  const tools = function(){
    const instance = {
      getRandomT:function(){
        let t = Math.random()*3;
        return Math.random()*10>=5?t:-t;
      },
      setInterval:function(f,time,fin){
          setTimeout(()=>{
            f();
            if(!fin()){
              instance.setInterval(f,time,fin);
            }
          },time);
      },
      Intersect:function(circleA,circleB) { 
        var dx = circleA.x-circleB.x; 
        var dy = circleA.y-circleB.y; 
        var distance = Math.sqrt(dx*dx+dy*dy);
        return distance < (circleA.size + circleB.size); 
      },
      getRandomColor:function() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }
    };
    return instance;
  }();
  
  // 直接拿現成的效果來放
  const hitEffect = function(){
      const balls = [];
      //创建对象
      function ball(){
          this.x=null;
          this.y=null;
          this.color=null;
          this.r=null;
          this.angle=null;//小球偏移量
          this.anglex=null;
          this.angley=null;
          //初始状态的小球
          this.int=function(X,Y){
              this.x=X;
              this.y=Y;
              this.color=this.randomcolor();
              this.r=this.randomR(2,3);
              this.angle=Math.random()*(Math.PI*2);
              this.anglex=this.randomR(1,3)*Math.cos(this.angle);
              this.angley=this.randomR(1,3)*Math.sin(this.angle);
          }
          //随机颜色
          this.randomcolor=function(){
              return "#"+parseInt(Math.random()*(16777216)).toString(16);
          }
          //随机数字 可控制半径或xy移动量
          this.randomR=function(min,max){
              return Math.random()*max+min;
          }
          //小球的运动及偏移量
          this.move=function(){
              this.x+=this.anglex;
              this.y+=this.angley;
              this.r-=0.3;
              this.anglex*=0.9;
              this.angley*=0.9;
          }
  
      }
    //创建小球
    function createball(X,Y){
      var count=parseInt(Math.random()*30+10);
      for(var i=0;i<count;i++){
        var Ball=new ball();
        Ball.int(X,Y);
        balls.push(Ball);
      }
    }
    //在canvas上绘制小球
    function draw(ctx){
      for(var i=0;i<balls.length;i++){
        var b=balls[i];
        b.move();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r,0,Math.PI*2,true);
        ctx.fillStyle= b.color;
        ctx.fill();
        ctx.closePath();
      }
      remove();
    }
    //移除小球
    function remove(){
      for(var i=0;i<balls.length;i++){
        var b=balls[i];
        if(b.r<0.3){
          balls.splice(i,1);
          i--;
        }
      }
    }
    return {
      createBall:createball,
      draw: draw,
    }
  }();
  
  const EffectManager = function(){
    const effects = {};
    return {
      draw:function(ctx){
        for(var name in effects){
          var effect = effects[name];
          if(effect['draw'] != null){
            effect.draw(ctx);
          }
        }
      },
      register: function(effectName,effect){
        effects[effectName]=effect;
      },
      callMethod:function(effectName,methodName,args){
        let effect = effects[effectName]
        if(effect==null){
          return
        }
        let fn = effect[methodName];
        if(fn==null){
          return
        }
        fn.apply(effect,args);
      }
    }
  }();
  
  const UIController = function(tools,EffectManager){
    var model;
    var modelStart = false;
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const instance =  {
      draw:function(){
        instance.cleanCanvas();
        instance.paintSnacks();
        EffectManager.draw(ctx);
        if(model!=null){
          instance.paintBullets(model.bullets());
          instance.paintEnemys(model.enemys());
          instance.paintTimeAndScore(model.time(),model.score());
          instance.paintEffects();
          instance.checkModelState();
        }
      },
      checkModelState:function(){
        if(model.gameOver()){
          instance.paintGameOver();
          modelStart = false;
        }
      },
      cleanCanvas:function(){
        ctx.fillStyle = CONFIGS.ITEM_COLOR;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
      paintEffects:function(){
        let effects = model.useEffects();
        for(let i in effects){
          let effect = effects[i];
          EffectManager.callMethod(effect.name,effect.method,effect.params);
        }
      },
      paintTimeAndScore:function(time,score){
        ctx.font = "20px Arial";
        ctx.fillStyle = CONFIGS.ITEM_COLOR;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText("TIME:"+time+" , SCORE:"+score.toFixed(2), 350, 30);
      },
      paintGameOver(){
        ctx.font = "42px Arial";
        ctx.fillStyle = CONFIGS.GAME_OVER_COLOR;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText('game over score:'+model.score().toFixed(2), 250, 125);
      },
      paintPath:function(snack){
        let path = snack.movePath;
        let player = model.player();
        if(snack.pid==player.pid){
          let circle = new Path2D();
          for (let i in path) {
            let p = path[i];
            ctx.beginPath();
            circle.arc(p.x, p.y, snack.size+2, 0, 2 * Math.PI);
            circle.closePath();
          }
          ctx.fillStyle = 'white';
          ctx.fill(circle);
        }
        let circle = new Path2D();
        for (let i in path) {
          let p = path[i];
          ctx.beginPath();
          circle.arc(p.x, p.y, snack.size, 0, 2 * Math.PI);
          circle.closePath();
        }
        ctx.fillStyle = snack.color;
        ctx.fill(circle);
      },
      paintSnacks:function(){
        let snacks = model.snacks(); 
        for(let s in snacks){
          let snack = snacks[s];
          if(snack==null){
              continue;
          }
          let path = snack.movePath;
          instance.paintPath(snack);
          if(path.length>0){
            let headCircle = new Path2D();
            let head = path[path.length-1];
            ctx.fillStyle = 'black';
            headCircle.arc(head.x, head.y, snack.size/3, 0, 2 * Math.PI);
            headCircle.closePath();
            ctx.fill(headCircle);
          }
        }
      },
      paintBullet:function(x,y){
        let circle = new Path2D();
        circle.arc(x, y, CONFIGS.BULLET_SIZE, 0, 2 * Math.PI);
        circle.closePath();
        ctx.fillStyle = CONFIGS.ITEM_COLOR;
        ctx.fill(circle);
      },
      paintBullets:function(bullets){
        for(let i in bullets){
         let bullet = bullets[i];
         instance.paintBullet(bullet.x,bullet.y);
        }
      },
      paintEnemy:function(x,y,size,color){
        let circle = new Path2D();
        circle.arc(x, y, size, 0, 2 * Math.PI);
        circle.closePath();
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fill(circle);
      },
      paintEnemys:function(enemys){
        for(let i in enemys){
         let enemy = enemys[i];
         instance.paintEnemy(enemy.x,enemy.y,enemy.size,enemy.color);
        }
      },
      bindEventListener:function(){
        let keepShoot = false;
        let currentE = null;
        canvas.addEventListener("mousedown", function(e){
            if(!modelStart){
              modelStart = true;
              model.start();
            }
            keepShoot = true;
            function move(){
              if(keepShoot){
                const x = currentE.clientX - rect.left
                const y = currentE.clientY - rect.top
                model.updateSnack(model.player(),x,y);
                setTimeout(move,CONFIGS.SHOOT_SPEED);
              }
            }
            move();
        }, false);
        canvas.addEventListener("mousemove", function(e){
          currentE = e;
        }, false);
        canvas.addEventListener("mouseup", function(e){
            keepShoot = false;
        }, false);
      },
      start:function(dataController){
        model = dataController; 
        instance.bindEventListener();
        setInterval(instance.draw,1000/CONFIGS.FPS);
      }
    };
    return instance;
  }(tools,EffectManager);
  
  const DataController = function(tools,isHost,pid,playerCount){
    let dataObj = {
      time:CONFIGS.GAME_TIME,
      enemys : [],
      enemys : [],
      bullets : [],
      gameOver : false,
      ais : [],
      snacksMap:{},
      effects:[],
    };
    const instance = {
      score: function(){
        let score = 0;
        if(dataObj.snacksMap[pid]!=null){
          score = dataObj.snacksMap[pid].score;
        }
        return score;
      },
      time: function(){
        return dataObj.time;
      },
      bullets: function(){
        return dataObj.bullets;
      },
      enemys: function(){
        return dataObj.enemys;
      },
      gameOver: function(){
        return dataObj.gameOver;
      },
      snacks: function(){
        return dataObj.snacksMap;
      },
      player: function(){
          return dataObj.snacksMap[pid];
      },
      selectPlayer: function(pid){
          return dataObj.snacksMap[pid];
      },
      genEnemys: function(){
        for(var i=0;i<Math.random()*3;i++){
          let enemy = {x:Math.random()*CONFIGS.WIDTH,y:Math.random()*CONFIGS.HEIGHT,t:1,speed:Math.random(),isStrong:Math.random()*10>=6,health:1};
          enemy.color = tools.getRandomColor();
          enemy.health = enemy.isStrong?2:1;
          enemy.size = Math.random()*CONFIGS.ENEMY_SIZE+0.1;
          dataObj.enemys.push(enemy);
        }
      },
      moveEnemys:function(){
      },
      useEffects:function(){
        let effects = dataObj.effects;
        dataObj.effects = [];
        return effects;
      },
      data:function(){
        return dataObj;
      },
      setData:function(data){
        let player = dataObj.snacksMap[pid];
        if(player!=null){
          data.snacksMap[pid].targetLocation = player.targetLocation;
        }
        dataObj = data;
      },
      checkHit:function(snack){    
        for(let i in dataObj.enemys){
         let enemy = dataObj.enemys[i];
         if(tools.Intersect(enemy,snack)){
             dataObj.enemys.splice(i,1);
             dataObj.effects.push({name:'hitEffect',method:'createBall',params:[enemy.x,enemy.y]});
             snack.snackSize+=enemy.size;
             snack.score+=enemy.size;
            return true;
         }
        }
        return false;
      },
      moveSnacks: function(){
            for(let i in dataObj.snacksMap){
              let snack = dataObj.snacksMap[i];
              instance.moveSnack(snack);
          }
      },
      moveSnack: function(snack){
        instance.countLocationXY(snack);
        instance.countMovePath(snack);
        instance.checkHit(snack);
        instance.checkSnackTouch(snack);
      },
      countLocationXY:function(snack){
          let target = snack.targetLocation;
          if(target==null){
            return
          }
          target.x =parseInt(target.x);
          target.y =parseInt(target.y);
          let t = (target.y-snack.y)/(target.x - snack.x);
          for(let i=0;i<CONFIGS.SNACK_MOVE_SPEED*2;i++){
            if(Math.abs(t)<=1){
              if(target.x>snack.x){
                snack.x+=0.05;
              }else if(target.x<snack.x){
                snack.x-=0.05;
              }
              snack.y = -(t*(target.x-snack.x)-target.y);
            }else{
              if(target.y>snack.y){
                snack.y+=0.05;
              }else if(target.y<snack.y){
                snack.y-=0.05;
              }
              snack.x = -((target.y-snack.y)/t-target.x);
            }
          }
          if(snack.y==target.y&&snack.x==target.x){
            snack.target = null;
          }else{
            if(snack.movePath==null){
              snack.movePath = [];
            }
            snack.movePath.push({x:snack.x,y:snack.y,size:snack.size});
          }
      },
      countMovePath: function(snack){
          let movePath = {};
          let finalMovePath = [];
          let snackLength = 0;
          let lastPoint = null;
          for(let i=snack.movePath.length-1;i>=0;i--){
            let p = snack.movePath[i];
            let key = parseInt(p.x)+'-'+parseInt(p.y);
            if(movePath[key]==null){
              movePath[key] = p;
              if(lastPoint==null){
                lastPoint = p;
              }
              let dx = p.x-lastPoint.x;
              let dy = p.y-lastPoint.y;
              let distance = Math.sqrt(dx*dx+dy*dy);
              snackLength+=distance;
              if(snackLength<snack.snackSize){
                finalMovePath.unshift(p);
              }
              lastPoint = p;
            }
          }
          snack.movePath = finalMovePath;
      },
      updateAI: function(){
          dataObj.ais.forEach(function(ai){
          if(ai.target==null&&dataObj.enemys.length>10){
            let target = dataObj.enemys[parseInt(Math.random()*dataObj.enemys.length)];
            instance.updateSnack(ai,target.x,target.y);
            ai.target = target;
            ai.currentSize = ai.snackSize;
          }else{
            if(ai.currentSize!=ai.snackSize||dataObj.enemys.indexOf(ai.target)==-1){
              ai.target = null;
            }
          }
        });
      },
      updateSnack: function(snack,cx,cy){
        let t =  Math.atan2(CONFIGS.SNACK_TOP - cy, CONFIGS.CENTER - cx);
        snack.t = t;
        if(cx >= CONFIGS.WIDTH){
          cx = CONFIGS.WIDTH;
        }else if(cx <= 0){
          cx =  0;
        }
        if(cy >= CONFIGS.HEIGHT){
          cy = CONFIGS.HEIGHT;
        }else if(cy <= 0){
          cy =  0;
        }
        snack.targetLocation = {x:cx,y:cy};
      },
      checkSnackTouch:function(snack){
          let time = new Date().getTime();
          if(time<snack.nextTouchTime){
              return
          }
          for(let id in dataObj.snacksMap){
            let touchSnack = dataObj.snacksMap[id];
            if(touchSnack==snack){
              continue;
            }
            let hasTouch = false;
            touchSnack.movePath.some((p)=>{
                if(tools.Intersect(snack,p)){
                  hasTouch = true;
                  return false;
              }
              return true;
            });
            if(hasTouch){
                snack.nextTouchTime = time+1000;
                snack.snackSize/=2;
                dataObj.effects.push({name:'hitEffect',method:'createBall',params:[snack.x,snack.y]});
                touchSnack.score+=snack.snackSize;
            }
          }
      },
      countdownTime:function(){
        dataObj.time--;
        if(dataObj.time<=0){
          dataObj.gameOver = true;
        }
      },
      init: function(){
        dataObj.time = CONFIGS.GAME_TIME;
        dataObj.enemys = [];
        dataObj.bullets = [];
        dataObj.gameOver = false;
        let players = [];
        dataObj.snacksMap = {};
        for(let i=0;i<playerCount;i++){
          let pid = 'p'+i;
          dataObj.snacksMap[pid]=({pid:pid,score:0,x:CONFIGS.CENTER-CONFIGS.SNACK_WIDTH,y:CONFIGS.BOTTOM,t:0,size:CONFIGS.SNACK_WIDTH,snackSize:25,movePath:[],color:tools.getRandomColor()});
        }
        dataObj.ais = [
            {pid:'a0',score:0,x:Math.random()*CONFIGS.WIDTH,y:CONFIGS.BOTTOM,t:0,size:CONFIGS.SNACK_WIDTH,snackSize:25,movePath:[],color:tools.getRandomColor()},
            {pid:'a1',score:0,x:Math.random()*CONFIGS.WIDTH,y:CONFIGS.BOTTOM,t:0,size:CONFIGS.SNACK_WIDTH,snackSize:25,movePath:[],color:tools.getRandomColor()},
            {pid:'a2',score:0,x:Math.random()*CONFIGS.WIDTH,y:CONFIGS.BOTTOM,t:0,size:CONFIGS.SNACK_WIDTH,snackSize:25,movePath:[],color:tools.getRandomColor()},
            {pid:'a3',score:0,x:Math.random()*CONFIGS.WIDTH,y:CONFIGS.BOTTOM,t:0,size:CONFIGS.SNACK_WIDTH,snackSize:25,movePath:[],color:tools.getRandomColor()},
        ];
        for(let i=0;i<dataObj.ais.length;i++){
          let snack = dataObj.ais[i];
          dataObj.snacksMap[snack.pid] = snack;
        }
      },
      start:function(){
        if(isHost){
          instance.init();
          tools.setInterval(instance.moveSnacks,30,()=>dataObj.gameOver);
          tools.setInterval(instance.moveEnemys,5,()=>dataObj.gameOver);
          tools.setInterval(instance.genEnemys,CONFIGS.GEN_ENEMY_SPEED,()=>dataObj.gameOver);
          tools.setInterval(instance.countdownTime,1000,()=>dataObj.gameOver);
          tools.setInterval(instance.updateAI,100,()=>dataObj.gameOver);
        }else{
          tools.setInterval(()=>{instance.moveSnack(instance.player())},30,()=>dataObj.gameOver);
        }
      }
    };
    return instance;
  };
  
  var dataController;

  function start(isHost,pid,playerCount){
    EffectManager.register('hitEffect',hitEffect);
    dataController = new DataController(tools,isHost,pid,playerCount);
    UIController.start(dataController);
  }

  function getData(){
    return dataController.data();
  }

  function getPlayer(){
    return dataController.player();
  }

  function setData(data){
    dataController.setData(data);
  }

  function updatePlayer(player){
    let location = player.targetLocation;
    if(location!=null){
      let snack = dataController.selectPlayer(player.pid);
      dataController.updateSnack(snack,location.x,location.y);
    }
  }