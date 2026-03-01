(function () {
    // ── Helpers ──────────────────────────────────────────────
    function setupCanvas(canvas) {
        const r = canvas.getBoundingClientRect();
        if (r.width === 0) return null;
        const dpr = devicePixelRatio || 1;
        canvas.width = r.width * dpr;
        canvas.height = r.height * dpr;
        return { w: r.width, h: r.height, dpr };
    }

    function mousePos(canvas, e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function touchPos(canvas, e) {
        const r = canvas.getBoundingClientRect();
        const t = e.touches[0];
        return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    function drawCrosshair(ctx, x, y) {
        ctx.strokeStyle = '#e44';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
    }

    // ── 2-Link Analytical IK ────────────────────────────────
    const c1 = document.getElementById('canvas-2link');
    const ctx1 = c1.getContext('2d');
    const l1Slider = document.getElementById('l1');
    const l2Slider = document.getElementById('l2');
    const l1Val = document.getElementById('l1val');
    const l2Val = document.getElementById('l2val');
    let s1, mouse1 = null;

    function resize1() { s1 = setupCanvas(c1); }

    function draw2Link() {
        if (!s1) return;
        const { w, h, dpr } = s1;
        ctx1.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx1.clearRect(0, 0, w, h);

        const L1 = parseInt(l1Slider.value);
        const L2 = parseInt(l2Slider.value);
        l1Val.textContent = L1;
        l2Val.textContent = L2;

        const bx = w / 2, by = h * 0.72;
        const tx = mouse1 ? mouse1.x : w / 2;
        const ty = mouse1 ? mouse1.y : h * 0.2;

        // Reachable zone
        ctx1.strokeStyle = '#eee';
        ctx1.lineWidth = 1;
        ctx1.setLineDash([4, 4]);
        ctx1.beginPath(); ctx1.arc(bx, by, L1 + L2, 0, Math.PI * 2); ctx1.stroke();
        if (Math.abs(L1 - L2) > 2) {
            ctx1.beginPath(); ctx1.arc(bx, by, Math.abs(L1 - L2), 0, Math.PI * 2); ctx1.stroke();
        }
        ctx1.setLineDash([]);

        // Solve
        const dx = tx - bx, dy = ty - by;
        const d = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        let ex, ey, fx, fy;

        if (d >= L1 + L2 - 0.5) {
            ex = bx + L1 * Math.cos(ang);
            ey = by + L1 * Math.sin(ang);
            fx = bx + (L1 + L2) * Math.cos(ang);
            fy = by + (L1 + L2) * Math.sin(ang);
        } else {
            const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
            const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
            const t1 = ang - a;
            ex = bx + L1 * Math.cos(t1);
            ey = by + L1 * Math.sin(t1);
            const ea = Math.atan2(ty - ey, tx - ex);
            fx = ex + L2 * Math.cos(ea);
            fy = ey + L2 * Math.sin(ea);
        }

        // Segments
        ctx1.lineCap = 'round';
        ctx1.lineWidth = 6;
        ctx1.strokeStyle = '#4a90d9';
        ctx1.beginPath(); ctx1.moveTo(bx, by); ctx1.lineTo(ex, ey); ctx1.stroke();
        ctx1.strokeStyle = '#d94a4a';
        ctx1.beginPath(); ctx1.moveTo(ex, ey); ctx1.lineTo(fx, fy); ctx1.stroke();

        // Joints
        ctx1.fillStyle = '#2d2d2d';
        ctx1.beginPath(); ctx1.arc(bx, by, 8, 0, Math.PI * 2); ctx1.fill();
        ctx1.fillStyle = '#555';
        ctx1.beginPath(); ctx1.arc(ex, ey, 6, 0, Math.PI * 2); ctx1.fill();
        ctx1.fillStyle = '#2d2d2d';
        ctx1.beginPath(); ctx1.arc(fx, fy, 5, 0, Math.PI * 2); ctx1.fill();

        // Labels
        ctx1.font = '12px sans-serif';
        ctx1.fillStyle = '#aaa';
        ctx1.textAlign = 'center';
        ctx1.fillText('báze', bx, by + 22);

        if (mouse1) drawCrosshair(ctx1, tx, ty);
    }

    c1.addEventListener('mousemove', e => { mouse1 = mousePos(c1, e); draw2Link(); });
    c1.addEventListener('mouseleave', () => { mouse1 = null; draw2Link(); });
    c1.addEventListener('touchmove', e => { e.preventDefault(); mouse1 = touchPos(c1, e); draw2Link(); }, { passive: false });
    l1Slider.addEventListener('input', draw2Link);
    l2Slider.addEventListener('input', draw2Link);

    // ── FABRIK Chain ────────────────────────────────────────
    const c2 = document.getElementById('canvas-fabrik');
    const ctx2 = c2.getContext('2d');
    const scSlider = document.getElementById('segCount');
    const slSlider = document.getElementById('segLen');
    const scVal = document.getElementById('segCountVal');
    const slVal = document.getElementById('segLenVal');
    let s2, mouse2 = null, joints = [];

    function resize2() { s2 = setupCanvas(c2); }

    function initJoints() {
        if (!s2) return;
        const n = parseInt(scSlider.value);
        const len = parseInt(slSlider.value);
        scVal.textContent = n;
        slVal.textContent = len;
        const bx = s2.w / 2, by = s2.h * 0.72;
        joints = [];
        for (let i = 0; i <= n; i++) joints.push({ x: bx, y: by - i * len });
    }

    function solveFabrik(target) {
        if (!s2) return;
        const len = parseInt(slSlider.value);
        const base = { x: s2.w / 2, y: s2.h * 0.72 };
        const n = joints.length;

        for (let iter = 0; iter < 10; iter++) {
            joints[n - 1] = { x: target.x, y: target.y };
            for (let i = n - 2; i >= 0; i--) {
                const dx = joints[i].x - joints[i + 1].x;
                const dy = joints[i].y - joints[i + 1].y;
                const d = Math.hypot(dx, dy) || 1;
                joints[i] = { x: joints[i + 1].x + dx / d * len, y: joints[i + 1].y + dy / d * len };
            }
            joints[0] = { x: base.x, y: base.y };
            for (let i = 1; i < n; i++) {
                const dx = joints[i].x - joints[i - 1].x;
                const dy = joints[i].y - joints[i - 1].y;
                const d = Math.hypot(dx, dy) || 1;
                joints[i] = { x: joints[i - 1].x + dx / d * len, y: joints[i - 1].y + dy / d * len };
            }
        }
    }

    function drawFabrik() {
        if (!s2) return;
        const { w, h, dpr } = s2;
        ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx2.clearRect(0, 0, w, h);

        if (mouse2) solveFabrik(mouse2);

        const n = joints.length;
        ctx2.lineCap = 'round';

        for (let i = 0; i < n - 1; i++) {
            const t = i / (n - 1);
            ctx2.lineWidth = 7 * (1 - t * 0.65);
            const r = Math.round(74 + t * 140);
            const g = Math.round(144 - t * 40);
            const b = Math.round(217 - t * 140);
            ctx2.strokeStyle = `rgb(${r},${g},${b})`;
            ctx2.beginPath();
            ctx2.moveTo(joints[i].x, joints[i].y);
            ctx2.lineTo(joints[i + 1].x, joints[i + 1].y);
            ctx2.stroke();
        }

        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            ctx2.fillStyle = i === 0 ? '#2d2d2d' : '#666';
            ctx2.beginPath();
            ctx2.arc(joints[i].x, joints[i].y, 4 * (1 - t * 0.5), 0, Math.PI * 2);
            ctx2.fill();
        }

        if (mouse2) drawCrosshair(ctx2, mouse2.x, mouse2.y);
    }

    c2.addEventListener('mousemove', e => { mouse2 = mousePos(c2, e); drawFabrik(); });
    c2.addEventListener('mouseleave', () => { mouse2 = null; drawFabrik(); });
    c2.addEventListener('touchmove', e => { e.preventDefault(); mouse2 = touchPos(c2, e); drawFabrik(); }, { passive: false });
    scSlider.addEventListener('input', () => { initJoints(); drawFabrik(); });
    slSlider.addEventListener('input', () => { initJoints(); drawFabrik(); });

    // ── Resize ──────────────────────────────────────────────
    window.addEventListener('resize', () => {
        resize1(); draw2Link();
        resize2(); initJoints(); drawFabrik();
    });

    resize1(); draw2Link();
    resize2(); initJoints(); drawFabrik();
})();
