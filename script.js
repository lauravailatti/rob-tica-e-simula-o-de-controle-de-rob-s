/* script.js
   RoboLab — comportamentos e animação (sem libs)
   Comentários explicativos dentro do arquivo.
*/

(() => {
  // Elementos principais
  const motorLeft = document.getElementById('motor-left');
  const motorRight = document.getElementById('motor-right');
  const motorLeftVal = document.getElementById('motor-left-val');
  const motorRightVal = document.getElementById('motor-right-val');

  const armAngle = document.getElementById('arm-angle');
  const armAngleVal = document.getElementById('arm-angle-val');
  const armUp = document.getElementById('arm-up');
  const armDown = document.getElementById('arm-down');
  const gripToggle = document.getElementById('grip-toggle');

  const sensorRange = document.getElementById('sensor-range');
  const sensorRangeVal = document.getElementById('sensor-range-val');
  const ambient = document.getElementById('ambient');
  const ambientVal = document.getElementById('ambient-val');
  const proxStatus = document.getElementById('prox-status');
  const lightStatus = document.getElementById('light-status');

  const teleSpeed = document.getElementById('tele-speed');
  const teleBatt = document.getElementById('tele-batt');
  const teleTemp = document.getElementById('tele-temp');
  const startTele = document.getElementById('start-tele');
  const stopTele = document.getElementById('stop-tele');

  const btnDemo = document.getElementById('btn-demo');
  const btnReset = document.getElementById('btn-reset');

  const gMotorL = document.getElementById('g-motor-l');
  const gMotorR = document.getElementById('g-motor-r');
  const gBatt = document.getElementById('g-batt');

  // Canvas para robô
  const canvas = document.getElementById('robot-canvas');
  const ctx = canvas.getContext('2d');
  const chart = document.getElementById('tele-chart');
  const chartCtx = chart.getContext('2d');

  // Estado do simulador
  const state = {
    motorL: 0,
    motorR: 0,
    arm: 0,
    gripClosed: false,
    sensorDist: Number(sensorRange.value),
    ambient: Number(ambient.value),
    telemetryRunning: false,
    telemetryData: [],
    batt: 100,
    temp: 28,
    speed: 0
  };

  // --- Utilities ---
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a,b,t){return a + (b-a)*t}

  // --- Bind inputs ---
  function syncMotorUI(){
    motorLeftVal.textContent = state.motorL;
    motorRightVal.textContent = state.motorR;
    gMotorL.value = state.motorL;
    gMotorR.value = state.motorR;
  }

  motorLeft.addEventListener('input', () => {
    state.motorL = Number(motorLeft.value);
    syncMotorUI();
  });
  motorRight.addEventListener('input', () => {
    state.motorR = Number(motorRight.value);
    syncMotorUI();
  });

  armAngle.addEventListener('input', () => {
    state.arm = Number(armAngle.value);
    armAngleVal.textContent = state.arm;
  });
  armUp.addEventListener('click', ()=> {
    state.arm = clamp(state.arm + 5, 0, 180);
    armAngle.value = state.arm; armAngleVal.textContent = state.arm;
  });
  armDown.addEventListener('click', ()=> {
    state.arm = clamp(state.arm - 5, 0, 180);
    armAngle.value = state.arm; armAngleVal.textContent = state.arm;
  });
  gripToggle.addEventListener('click', ()=>{
    state.gripClosed = !state.gripClosed;
    gripToggle.textContent = state.gripClosed ? 'Fechar' : 'Abrir Garra';
  });

  sensorRange.addEventListener('input', ()=>{
    state.sensorDist = Number(sensorRange.value);
    sensorRangeVal.textContent = state.sensorDist;
    updateSensorStatus();
  });
  ambient.addEventListener('input', ()=>{
    state.ambient = Number(ambient.value);
    ambientVal.textContent = state.ambient;
    updateSensorStatus();
  });

  function updateSensorStatus(){
    if(state.sensorDist < 30) {
      proxStatus.textContent = 'PERTO';
      proxStatus.style.color = '#ffb86b';
    } else proxStatus.textContent = 'OK', proxStatus.style.color = '';
    if(state.ambient < 150) lightStatus.textContent = 'Fraca';
    else if(state.ambient < 600) lightStatus.textContent = 'Média';
    else lightStatus.textContent = 'Alta';
  }
  updateSensorStatus();

  // Telemetria (gera dados simulados)
  let teleInterval = null;
  function startTelemetry(){
    if(state.telemetryRunning) return;
    state.telemetryRunning = true;
    teleInterval = setInterval(()=>{
      // Simula velocidade com base na média dos motores
      const avg = (Math.abs(state.motorL) + Math.abs(state.motorR))/200; // 0..1
      state.speed = +(avg * 1.2 + (Math.random()-0.5)*0.1).toFixed(2); // m/s
      state.batt = clamp(state.batt - 0.02 - avg*0.02, 0, 100);
      state.temp = +(lerp(state.temp, 25 + avg*20, 0.05) + (Math.random()-0.5)*0.2).toFixed(1);

      // empilhar telemetria
      state.telemetryData.push({t: Date.now(), speed: state.speed, batt: state.batt});
      if(state.telemetryData.length > 50) state.telemetryData.shift();

      // atualizar UI
      teleSpeed.textContent = `${state.speed.toFixed(2)} m/s`;
      teleBatt.textContent = `${state.batt.toFixed(0)}%`;
      teleTemp.textContent = `${state.temp.toFixed(1)}°C`;
      gBatt.value = state.batt;

      drawChart();
    }, 250);
  }
  function stopTelemetry(){
    state.telemetryRunning = false;
    clearInterval(teleInterval);
  }
  startTele.addEventListener('click', startTelemetry);
  stopTele.addEventListener('click', stopTelemetry);

  // Demo and Reset
  btnDemo.addEventListener('click', runDemo);
  btnReset.addEventListener('click', resetAll);

  function resetAll(){
    motorLeft.value = motorRight.value = 0;
    armAngle.value = 0;
    sensorRange.value = 120;
    ambient.value = 300;
    state.motorL = 0; state.motorR = 0; state.arm = 0; state.gripClosed=false;
    state.sensorDist = 120; state.ambient = 300; state.batt = 100; state.temp=28; state.telemetryData = [];
    motorLeftVal.textContent = '0'; motorRightVal.textContent = '0';
    armAngleVal.textContent = '0';
    sensorRangeVal.textContent = '120'; ambientVal.textContent = '300';
    gMotorL.value = 0; gMotorR.value = 0; gBatt.value = 100;
    teleSpeed.textContent = '0.0 m/s'; teleBatt.textContent = '100%'; teleTemp.textContent = '28°C';
    drawChart();
    updateSensorStatus();
  }

  function runDemo(){
    // sequência automática rápida
    const seq = [
      {t:0, l:40, r:40, arm:20},
      {t:1500, l:80, r:80, arm:60},
      {t:3000, l:0, r:60, arm:120},
      {t:4500, l:-40, r:40, arm:90},
      {t:6000, l:0, r:0, arm:45, grip:true}
    ];
    resetAll();
    let start = performance.now();
    let idx = 0;
    const demoTimer = setInterval(() => {
      const now = performance.now() - start;
      while(idx < seq.length && now >= seq[idx].t){
        const s = seq[idx];
        if(typeof s.l === 'number'){ motorLeft.value = s.l; motorLeft.dispatchEvent(new Event('input'));}
        if(typeof s.r === 'number'){ motorRight.value = s.r; motorRight.dispatchEvent(new Event('input'));}
        if(typeof s.arm === 'number'){ armAngle.value = s.arm; armAngle.dispatchEvent(new Event('input'));}
        if(typeof s.grip !== 'undefined'){ state.gripClosed = !!s.grip; gripToggle.textContent = state.gripClosed ? 'Fechar' : 'Abrir Garra';}
        idx++;
      }
      if(idx >= seq.length){
        clearInterval(demoTimer);
      }
    }, 120);
  }

  // --- Canvas drawing (robô) ---
  function drawRobot(){
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0,0,w,h);

    // background grid
    ctx.fillStyle = '#071427';
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for(let x=0;x<w;x+=40){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for(let y=0;y<h;y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    // robot base
    const baseX = w/2;
    const baseY = h/2 + 30;
    const baseW = 160;
    const baseH = 60;
    ctx.fillStyle = '#122634';
    ctx.fillRect(baseX - baseW/2, baseY - baseH/2, baseW, baseH);
    ctx.strokeStyle = '#0ea5a4';
    ctx.lineWidth = 2;
    ctx.strokeRect(baseX - baseW/2, baseY - baseH/2, baseW, baseH);

    // wheels (simulate turning based on motor values)
    const wheelOffset = 70;
    const wheelRadius = 22;
    const wheelRotateL = (Date.now()/100 * state.motorL/100) % (Math.PI*2);
    const wheelRotateR = (Date.now()/100 * state.motorR/100) % (Math.PI*2);

    drawWheel(baseX - wheelOffset, baseY + baseH/2 + 4, wheelRadius, wheelRotateL);
    drawWheel(baseX + wheelOffset, baseY + baseH/2 + 4, wheelRadius, wheelRotateR);

    // neck
    ctx.fillStyle = '#0b2230';
    ctx.fillRect(baseX - 8, baseY - baseH/2 - 70, 16, 50);

    // head
    ctx.beginPath();
    ctx.fillStyle = '#0f3847';
    ctx.arc(baseX, baseY - baseH/2 - 85, 26, 0, Math.PI*2);
    ctx.fill();

    // eyes (color depends on proximity)
    const eyeColor = state.sensorDist < 30 ? '#ffb86b' : '#0ea5a4';
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.arc(baseX - 10, baseY - baseH/2 - 88, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(baseX + 10, baseY - baseH/2 - 88, 4, 0, Math.PI*2); ctx.fill();

    // arm base
    const armBaseX = baseX + 50;
    const armBaseY = baseY - baseH/2 - 40;

    // arm segments
    const a1 = (state.arm - 60) * Math.PI/180; // convert degrees to radians and offset for nicer pose
    const len1 = 60, len2 = 40;

    // first segment
    const elbowX = armBaseX + Math.cos(a1) * len1;
    const elbowY = armBaseY + Math.sin(a1) * len1;

    ctx.strokeStyle = '#9ad8d3';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(armBaseX, armBaseY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();

    // second segment
    const a2 = a1 + (state.arm/180 - 0.2) * 0.9; // playful articulation
    const handX = elbowX + Math.cos(a2) * len2;
    const handY = elbowY + Math.sin(a2) * len2;

    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // gripper
    ctx.fillStyle = state.gripClosed ? '#ffd6a5' : '#cfeceb';
    ctx.beginPath();
    ctx.arc(handX, handY, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#083039';
    ctx.lineWidth = 1;
    ctx.stroke();

    // telemetry textual overlay
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(10,10,150,56);
    ctx.fillStyle = '#bfeee9';
    ctx.font = '13px Inter, Arial';
    ctx.fillText(`Velocidade: ${state.speed.toFixed(2)} m/s`, 18, 30);
    ctx.fillText(`Bateria: ${state.batt.toFixed(0)}%`, 18, 46);
    ctx.fillText(`Temperatura: ${state.temp.toFixed(1)}°C`, 18, 62);
  }

  function drawWheel(x,y,r,rot){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rot);
    ctx.fillStyle = '#09202a';
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#0ea5a4';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0,r-4,0,Math.PI*2); ctx.stroke();
    // spokes
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for(let i=0;i<6;i++){
      ctx.beginPath();
      ctx.rotate(Math.PI/3);
      ctx.moveTo(0,0); ctx.lineTo(r-4,0); ctx.stroke();
    }
    ctx.restore();
  }

  // --- Chart drawing (simple line chart of speed) ---
  function drawChart(){
    const w = chart.width, h = chart.height;
    chartCtx.clearRect(0,0,w,h);
    // background
    chartCtx.fillStyle = '#071425';
    chartCtx.fillRect(0,0,w,h);

    // grid
    chartCtx.strokeStyle = 'rgba(255,255,255,0.03)';
    chartCtx.lineWidth = 1;
    for(let y=0;y<h;y+=30){ chartCtx.beginPath(); chartCtx.moveTo(0,y); chartCtx.lineTo(w,y); chartCtx.stroke(); }

    const data = state.telemetryData.slice(-40);
    if(data.length < 2) return;

    // normalize speeds to chart height
    const speeds = data.map(d=>d.speed);
    const max = Math.max(...speeds, 1);
    const min = 0;
    chartCtx.strokeStyle = '#0ea5a4';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    for(let i=0;i<data.length;i++){
      const x = (i/(data.length-1)) * (w-10) + 5;
      const y = h - 6 - ((data[i].speed - min) / (max - min)) * (h-12);
      if(i===0) chartCtx.moveTo(x,y); else chartCtx.lineTo(x,y);
    }
    chartCtx.stroke();

    // last value marker
    const last = data[data.length-1].speed;
    chartCtx.fillStyle = '#0ea5a4';
    chartCtx.fillRect(w-60,8,52,18);
    chartCtx.fillStyle = '#032022';
    chartCtx.font = '11px Inter, Arial';
    chartCtx.fillText(`Speed: ${last.toFixed(2)} m/s`, w-56, 21);
  }

  // Animation loop
  function loop(){
    // simulated battery drain when motors are running
    const activity = (Math.abs(state.motorL) + Math.abs(state.motorR)) / 200;
    state.batt = clamp(state.batt - 0.0004*activity, 0, 100);

    // smooth speed lerp
    const targetSpeed = (Math.abs(state.motorL) + Math.abs(state.motorR)) / 200 * 1.2;
    state.speed = lerp(state.speed, targetSpeed, 0.06);

    // update UI values that may change by code
    motorLeftVal.textContent = state.motorL;
    motorRightVal.textContent = state.motorR;
    gMotorL.value = state.motorL;
    gMotorR.value = state.motorR;
    gBatt.value = state.batt;

    drawRobot();
    requestAnimationFrame(loop);
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    const step = 8;
    if(e.key === 'w' || e.key === 'W'){ motorLeft.value = motorRight.value = clamp(Number(motorLeft.value)+step, -100, 100); motorLeft.dispatchEvent(new Event('input')); motorRight.dispatchEvent(new Event('input')); }
    if(e.key === 's' || e.key === 'S'){ motorLeft.value = motorRight.value = clamp(Number(motorLeft.value)-step, -100, 100); motorLeft.dispatchEvent(new Event('input')); motorRight.dispatchEvent(new Event('input')); }
    if(e.key === 'a' || e.key === 'A'){ motorLeft.value = clamp(Number(motorLeft.value)-step, -100, 100); motorLeft.dispatchEvent(new Event('input')); }
    if(e.key === 'd' || e.key === 'D'){ motorRight.value = clamp(Number(motorRight.value)-step, -100, 100); motorRight.dispatchEvent(new Event('input')); }
    if(e.key === 'q' || e.key === 'Q'){ armAngle.value = clamp(Number(armAngle.value)+6, 0, 180); armAngle.dispatchEvent(new Event('input')); }
    if(e.key === 'e' || e.key === 'E'){ armAngle.value = clamp(Number(armAngle.value)-6, 0, 180); armAngle.dispatchEvent(new Event('input')); }
  });

  // Initial draw & start loops
  resetAll();
  loop();

  // Accessibility: announce when telemetry starts/stops
  startTele.addEventListener('click', ()=>{ startTele.setAttribute('aria-pressed','true'); });
  stopTele.addEventListener('click', ()=>{ stopTele.setAttribute('aria-pressed','false'); });

  // ensure canvas scales nicely on high-DPI
  function scaleCanvases(){
    [canvas, chart].forEach(c => {
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    drawChart();
  }
  window.addEventListener('resize', scaleCanvases);
  // initial scale (delay to allow layout)
  setTimeout(scaleCanvases, 100);

  // small safety: stop telemetry if page hidden
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) stopTelemetry();
  });

})();
