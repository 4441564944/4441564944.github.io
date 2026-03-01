/**
Vlastní 3D projekce — orbitální kamera (azimut + elevace), look-at matice, perspektivní dělení, vše v ~20 řádcích vektorové matematiky
Painter's algorithm — všechny elementy (čáry, polygony, tečky) se seřadí podle hloubky a vykreslí odzadu dopředu
Orbit ovládání — pointerdown/move/up pro rotaci, wheel pro zoom, stejně jako Three.js OrbitControls
HiDPI podpora — canvas rozlišení se násobí devicePixelRatio
*/

(function () {
    const canvas = document.getElementById('canvas3d');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    const distSlider = document.getElementById('objectDistance3d');
    const sizeSlider = document.getElementById('objectSize3d');
    const distVal = document.getElementById('distanceValue3d');
    const sizeVal = document.getElementById('sizeValue3d');
    const formulaEl = document.getElementById('formula3d');

    const FOCAL = 2, BOX = 2.2, BG = '#0e0e1a';
    const COLORS = ['#ff5555', '#55ff55', '#5599ff', '#ffee55'];

    let az = 0.75, el = 0.45, orbitDist = 10;
    let drag = false, mx0, my0;
    let W, H, dpr;
    let vS, vU, vF, vEye;
    let items;

    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = v => { const l = Math.hypot(...v); return l > 1e-9 ? v.map(c => c / l) : [0, 0, 0]; };
    const mid = (...pts) => pts[0].map((_, i) => pts.reduce((s, p) => s + p[i], 0) / pts.length);

    function updateView() {
        const ce = Math.cos(el), se = Math.sin(el);
        const ca = Math.cos(az), sa = Math.sin(az);
        vEye = [orbitDist * sa * ce, orbitDist * se, orbitDist * ca * ce];
        vF = norm(sub([0, 0, 0], vEye));
        vS = norm(cross(vF, [0, 1, 0]));
        vU = cross(vS, vF);
    }

    function proj(pt) {
        const p = sub(pt, vEye);
        const z = dot(vF, p);
        if (z < 0.1) return null;
        const sc = H / (2 * Math.tan(25 * Math.PI / 180));
        return { x: W / 2 + dot(vS, p) * sc / z, y: H / 2 - dot(vU, p) * sc / z, z };
    }

    function resize() {
        const r = canvas.getBoundingClientRect();
        W = r.width; H = r.height;
        dpr = devicePixelRatio || 1;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
    }

    function ln(a, b, c, w, o) {
        const p = proj(a), q = proj(b);
        if (p && q) items.push({ t: 0, p: [p, q], z: (p.z + q.z) / 2, c, w: w || 1, o: o ?? 1 });
    }

    function poly(pts, c, o) {
        const sp = pts.map(proj);
        if (sp.every(Boolean)) items.push({ t: 1, p: sp, z: sp.reduce((s, v) => s + v.z, 0) / sp.length, c, o: o ?? 1 });
    }

    function circle(pt, r, c) {
        const p = proj(pt);
        if (p) items.push({ t: 2, p, r, z: p.z, c, o: 1 });
    }

    function flush() {
        items.sort((a, b) => b.z - a.z);
        for (const it of items) {
            ctx.globalAlpha = it.o;
            if (it.t === 0) {
                ctx.strokeStyle = it.c;
                ctx.lineWidth = it.w;
                ctx.beginPath();
                ctx.moveTo(it.p[0].x, it.p[0].y);
                ctx.lineTo(it.p[1].x, it.p[1].y);
                ctx.stroke();
            } else if (it.t === 1) {
                ctx.fillStyle = it.c;
                ctx.beginPath();
                ctx.moveTo(it.p[0].x, it.p[0].y);
                for (let i = 1; i < it.p.length; i++) ctx.lineTo(it.p[i].x, it.p[i].y);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = it.c;
                ctx.beginPath();
                ctx.arc(it.p.x, it.p.y, it.r, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function quadrants(corners, colors, opacity) {
        const ctr = mid(...corners);
        const mids = corners.map((c, i) => mid(c, corners[(i + 1) % 4]));
        for (let i = 0; i < 4; i++)
            poly([corners[i], mids[i], ctr, mids[(i + 3) % 4]], colors[i], opacity);
    }

    function build() {
        items = [];
        updateView();

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, W, H);

        const d = parseInt(distSlider.value) / 100;
        const s = parseInt(sizeSlider.value) / 100;
        const hs = s / 2, f = FOCAL, hi = hs * f / d, B = BOX / 2;

        distVal.textContent = distSlider.value;
        sizeVal.textContent = sizeSlider.value;
        formulaEl.textContent =
            'obraz = ' + (hi * 2 * 100).toFixed(1) + ' = ' + sizeSlider.value +
            ' \u00d7 ' + (f * 100).toFixed(0) + ' / ' + distSlider.value;

        // Ground grid
        for (let i = -6; i <= 6; i++) {
            ln([i, -B, -6], [i, -B, 6], '#1e1e30', 1, 0.5);
            ln([-6, -B, i], [6, -B, i], '#1e1e30', 1, 0.5);
        }

        // Camera box wireframe (front at z=0, back at z=f)
        const bc = [
            [-B, -B, 0], [B, -B, 0], [B, B, 0], [-B, B, 0],
            [-B, -B, f], [B, -B, f], [B, B, f], [-B, B, f]
        ];
        [[0, 1], [1, 2], [2, 3], [3, 0],
         [4, 5], [5, 6], [6, 7], [7, 4],
         [0, 4], [1, 5], [2, 6], [3, 7]]
            .forEach(([a, b]) => ln(bc[a], bc[b], '#3a3a55', 1.5));

        // Film (semi-transparent back wall)
        const fb = B * 0.95;
        poly([[-fb, -fb, f], [fb, -fb, f], [fb, fb, f], [-fb, fb, f]], '#1a1a33', 0.25);

        // Pinhole
        circle([0, 0, 0], 4, '#ffffff');

        // Object corners: TL, TR, BR, BL at z = -d
        const oc = [[-hs, hs, -d], [hs, hs, -d], [hs, -hs, -d], [-hs, -hs, -d]];

        // Image corners (inverted projection through pinhole)
        const ic = oc.map(v => [-v[0] * f / d, -v[1] * f / d, f]);

        // Object filled quadrants + outline
        quadrants(oc, COLORS, 1);
        for (let i = 0; i < 4; i++) ln(oc[i], oc[(i + 1) % 4], '#eeeeff', 1.5);

        // Image filled quadrants + outline
        quadrants(ic, COLORS, 0.85);
        for (let i = 0; i < 4; i++) ln(ic[i], ic[(i + 1) % 4], '#aaaacc', 1.5);

        // Rays (corner → pinhole → projection)
        const O = [0, 0, 0];
        for (let i = 0; i < 4; i++) {
            ln(oc[i], O, COLORS[i], 1, 0.4);
            ln(O, ic[i], COLORS[i], 1, 0.4);
        }

        // Optical axis
        ln([0, 0, -d - 0.3], [0, 0, f + 0.3], '#333355', 1, 0.6);

        flush();
    }

    canvas.addEventListener('pointerdown', e => {
        drag = true;
        mx0 = e.clientX;
        my0 = e.clientY;
        canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
        if (!drag) return;
        az -= (e.clientX - mx0) * 0.005;
        el = Math.max(-1.5, Math.min(1.5, el + (e.clientY - my0) * 0.005));
        mx0 = e.clientX; my0 = e.clientY;
        build();
    });
    canvas.addEventListener('pointerup', () => { drag = false; });
    canvas.addEventListener('pointercancel', () => { drag = false; });
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        orbitDist = Math.max(3, Math.min(30, orbitDist * (1 + e.deltaY * 0.001)));
        build();
    }, { passive: false });

    distSlider.addEventListener('input', build);
    sizeSlider.addEventListener('input', build);
    window.addEventListener('resize', () => { resize(); build(); });

    resize();
    build();
})();
