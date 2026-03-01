(function () {
    const SQRT3 = Math.sqrt(3);

    function initCanvas(canvas) {
        const r = canvas.getBoundingClientRect();
        if (r.width === 0) return null;
        const dpr = devicePixelRatio || 1;
        canvas.width = r.width * dpr;
        canvas.height = r.height * dpr;
        return { w: r.width, h: r.height, dpr };
    }

    function mouseXY(canvas, e) {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    // ── Rectangular Grid ────────────────────────────────────
    const c1 = document.getElementById('canvas-rect');
    const ctx1 = c1.getContext('2d');
    const status1 = document.getElementById('status-rect');
    const n8box = document.getElementById('neighbors8');
    let s1, sel1 = null, hov1 = null;
    const CELL = 36;
    let cols, rows, ox, oy;

    function resize1() {
        s1 = initCanvas(c1);
        if (!s1) return;
        cols = Math.floor(s1.w / CELL);
        rows = Math.floor(s1.h / CELL);
        ox = (s1.w - cols * CELL) / 2;
        oy = (s1.h - rows * CELL) / 2;
    }

    function cellAt(mx, my) {
        const c = Math.floor((mx - ox) / CELL);
        const r = Math.floor((my - oy) / CELL);
        return (c >= 0 && c < cols && r >= 0 && r < rows) ? { c, r } : null;
    }

    function manhattan(a, b) { return Math.abs(a.c - b.c) + Math.abs(a.r - b.r); }
    function chebyshev(a, b) { return Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r)); }

    function rectNeighbors(cell, eight) {
        const d4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        const d8 = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
        const out = [];
        for (const [dc, dr] of (eight ? d8 : d4)) {
            const nc = cell.c + dc, nr = cell.r + dr;
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) out.push({ c: nc, r: nr });
        }
        return out;
    }

    function drawRect() {
        if (!s1) return;
        const { w, h, dpr } = s1;
        ctx1.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx1.clearRect(0, 0, w, h);

        const use8 = n8box.checked;
        const nb = sel1 ? rectNeighbors(sel1, use8) : [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = ox + c * CELL, y = oy + r * CELL;
                const isSel = sel1 && sel1.c === c && sel1.r === r;
                const isNb = nb.some(n => n.c === c && n.r === r);
                const isHov = hov1 && hov1.c === c && hov1.r === r && !isSel;

                let fill = '#f5f5f5';
                if (isSel) fill = '#4a90d9';
                else if (isNb) fill = '#7ec8e3';
                else if (isHov) fill = '#e0e0e0';
                else if (sel1) {
                    const d = use8 ? chebyshev(sel1, { c, r }) : manhattan(sel1, { c, r });
                    const v = Math.round(245 - Math.min(d / 12, 1) * 40);
                    fill = `rgb(${v},${v},${v + 5})`;
                }

                ctx1.fillStyle = fill;
                ctx1.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);

                if (isSel || isHov) {
                    ctx1.fillStyle = isSel ? '#fff' : '#999';
                    ctx1.font = '10px sans-serif';
                    ctx1.textAlign = 'center';
                    ctx1.fillText(`${c},${r}`, x + CELL / 2, y + CELL / 2 + 3);
                }
            }
        }

        if (hov1 && sel1) {
            const md = manhattan(sel1, hov1);
            const cd = chebyshev(sel1, hov1);
            status1.textContent = `(${hov1.c}, ${hov1.r})  ·  Manhattan: ${md}  ·  Čebyšev: ${cd}`;
        } else if (hov1) {
            status1.textContent = `(${hov1.c}, ${hov1.r})`;
        } else if (sel1) {
            status1.textContent = `Vybráno: (${sel1.c}, ${sel1.r})  ·  ${use8 ? '8' : '4'} sousedů`;
        } else {
            status1.textContent = 'Klikněte na buňku pro výběr.';
        }
    }

    c1.addEventListener('mousemove', e => { hov1 = cellAt(...Object.values(mouseXY(c1, e))); drawRect(); });
    c1.addEventListener('mouseleave', () => { hov1 = null; drawRect(); });
    c1.addEventListener('click', e => {
        const cell = cellAt(...Object.values(mouseXY(c1, e)));
        sel1 = (sel1 && cell && sel1.c === cell.c && sel1.r === cell.r) ? null : cell;
        drawRect();
    });
    n8box.addEventListener('change', drawRect);

    // ── Hexagonal Grid ──────────────────────────────────────
    const c2 = document.getElementById('canvas-hex');
    const ctx2 = c2.getContext('2d');
    const status2 = document.getElementById('status-hex');
    let s2, sel2 = null, hov2 = null;
    const HEX = 25;

    function resize2() { s2 = initCanvas(c2); }

    function hexToPixel(q, r) {
        return {
            x: HEX * (SQRT3 * q + SQRT3 / 2 * r),
            y: HEX * 1.5 * r
        };
    }

    function pixelToHex(px, py) {
        const fq = (SQRT3 / 3 * px - py / 3) / HEX;
        const fr = (2 / 3 * py) / HEX;
        const fs = -fq - fr;
        let q = Math.round(fq), r = Math.round(fr), s = Math.round(fs);
        const dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs);
        if (dq > dr && dq > ds) q = -r - s;
        else if (dr > ds) r = -q - s;
        return { q, r };
    }

    function hexDist(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs((-a.q - a.r) - (-b.q - b.r))) / 2;
    }

    const HEX_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    function hexNeighbors(h) {
        return HEX_DIRS.map(([dq, dr]) => ({ q: h.q + dq, r: h.r + dr }));
    }

    function drawHexShape(ctx, cx, cy, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 3 * i - Math.PI / 6;
            const x = cx + size * Math.cos(a);
            const y = cy + size * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    function visibleHexes() {
        if (!s2) return [];
        const out = [];
        const hw = s2.w / 2, hh = s2.h / 2;
        const rMin = Math.floor(-hh / (HEX * 1.5)) - 2;
        const rMax = Math.ceil(hh / (HEX * 1.5)) + 2;
        for (let r = rMin; r <= rMax; r++) {
            const qMin = Math.floor((-hw - SQRT3 / 2 * r * HEX) / (SQRT3 * HEX)) - 2;
            const qMax = Math.ceil((hw - SQRT3 / 2 * r * HEX) / (SQRT3 * HEX)) + 2;
            for (let q = qMin; q <= qMax; q++) {
                const p = hexToPixel(q, r);
                if (Math.abs(p.x) < hw + HEX * 2 && Math.abs(p.y) < hh + HEX * 2)
                    out.push({ q, r });
            }
        }
        return out;
    }

    function drawHex() {
        if (!s2) return;
        const { w, h, dpr } = s2;
        ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx2.clearRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;
        const nb = sel2 ? hexNeighbors(sel2) : [];

        for (const hex of visibleHexes()) {
            const p = hexToPixel(hex.q, hex.r);
            const px = cx + p.x, py = cy + p.y;

            const isSel = sel2 && sel2.q === hex.q && sel2.r === hex.r;
            const isNb = nb.some(n => n.q === hex.q && n.r === hex.r);
            const isHov = hov2 && hov2.q === hex.q && hov2.r === hex.r && !isSel;

            let fill = '#f5f5f5';
            if (isSel) fill = '#4a90d9';
            else if (isNb) fill = '#7ec8e3';
            else if (isHov) fill = '#e0e0e0';
            else if (sel2) {
                const d = hexDist(sel2, hex);
                const v = Math.round(245 - Math.min(d / 10, 1) * 40);
                fill = `rgb(${v},${v},${v + 5})`;
            }

            drawHexShape(ctx2, px, py, HEX - 1);
            ctx2.fillStyle = fill;
            ctx2.fill();
            ctx2.strokeStyle = '#ddd';
            ctx2.lineWidth = 1;
            ctx2.stroke();

            if (isSel || isHov) {
                ctx2.fillStyle = isSel ? '#fff' : '#888';
                ctx2.font = '10px sans-serif';
                ctx2.textAlign = 'center';
                ctx2.fillText(`${hex.q},${hex.r}`, px, py + 3);
            }
        }

        if (hov2 && sel2) {
            status2.textContent = `(q=${hov2.q}, r=${hov2.r})  ·  Hex vzdálenost: ${hexDist(sel2, hov2)}`;
        } else if (hov2) {
            status2.textContent = `(q=${hov2.q}, r=${hov2.r})`;
        } else if (sel2) {
            status2.textContent = `Vybráno: (q=${sel2.q}, r=${sel2.r})  ·  6 sousedů`;
        } else {
            status2.textContent = 'Klikněte na buňku pro výběr.';
        }
    }

    c2.addEventListener('mousemove', e => {
        const m = mouseXY(c2, e);
        hov2 = pixelToHex(m.x - s2.w / 2, m.y - s2.h / 2);
        drawHex();
    });
    c2.addEventListener('mouseleave', () => { hov2 = null; drawHex(); });
    c2.addEventListener('click', e => {
        const m = mouseXY(c2, e);
        const cell = pixelToHex(m.x - s2.w / 2, m.y - s2.h / 2);
        sel2 = (sel2 && sel2.q === cell.q && sel2.r === cell.r) ? null : cell;
        drawHex();
    });

    // ── Resize ──────────────────────────────────────────────
    window.addEventListener('resize', () => {
        resize1(); drawRect();
        resize2(); drawHex();
    });

    resize1(); drawRect();
    resize2(); drawHex();
})();
