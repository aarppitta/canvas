    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const modeSelect = document.getElementById('mode');
    const fillColorInput = document.getElementById('fillColor');
    const strokeColorInput = document.getElementById('strokeColor');
    const lineStyleSelect = document.getElementById('lineStyle');
    const lineWidthInput = document.getElementById('lineWidth');
    const saveBtn = document.getElementById('save');
    const loadBtn = document.getElementById('load');
    const clearBtn = document.getElementById('clear');

    let drawing = false;
    let startX = 0, startY = 0;
    let currentShape = null;
    let shapes = [];

    const getStyle = () => ({
      fill: fillColorInput.value,
      stroke: strokeColorInput.value,
      style: lineStyleSelect.value,
      width: +lineWidthInput.value
    });

    canvas.addEventListener('mousedown', e => {
      const x = e.offsetX, y = e.offsetY;
      const shape = shapes.findLast(s => isInsideShape(s, x, y));
      if (shape) {
        currentShape = shape;
        shape.offsetX = x - shape.x;
        shape.offsetY = y - shape.y;
        shape.dragging = true;
        redraw();
        return;
      }

      drawing = true;
      startX = x;
      startY = y;

      if (modeSelect.value === 'free') {
        const path = [[x, y]];
        currentShape = {
          type: 'free',
          path,
          ...getStyle()
        };
        shapes.push(currentShape);
      }
    });

    canvas.addEventListener('mousemove', e => {
      const x = e.offsetX, y = e.offsetY;
      if (drawing && currentShape) {
        if (modeSelect.value === 'free') {
          currentShape.path.push([x, y]);
        } else {
          currentShape.x = startX;
          currentShape.y = startY;
          currentShape.x2 = x;
          currentShape.y2 = y;
        }
        redraw();
      } else if (currentShape?.dragging) {
        currentShape.x = x - currentShape.offsetX;
        currentShape.y = y - currentShape.offsetY;
        if (currentShape.type !== 'free') {
          const dx = currentShape.x2 - startX;
          const dy = currentShape.y2 - startY;
          currentShape.x2 = currentShape.x + dx;
          currentShape.y2 = currentShape.y + dy;
        }
        redraw();
      }
    });

    canvas.addEventListener('mouseup', e => {
      if (drawing) {
        if (modeSelect.value !== 'free') {
          currentShape = {
            type: modeSelect.value,
            x: startX,
            y: startY,
            x2: e.offsetX,
            y2: e.offsetY,
            ...getStyle()
          };
          shapes.push(currentShape);
        }
      }
      drawing = false;
      if (currentShape) currentShape.dragging = false;
      redraw();
    });

    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      shapes.forEach(shape => {
        ctx.save();
        ctx.strokeStyle = shape.stroke;
        ctx.fillStyle = shape.fill;
        ctx.lineWidth = shape.width;
        ctx.setLineDash(shape.style === 'dashed' ? [5, 5] : []);
        // ctx.beginPath();

        if (shape.type === 'line') {
          ctx.moveTo(shape.x, shape.y);
          ctx.lineTo(shape.x2, shape.y2);
          ctx.stroke();

        } else if (shape.type === 'rect') {
          const w = shape.x2 - shape.x, h = shape.y2 - shape.y;
          ctx.fillRect(shape.x, shape.y, w, h);
          ctx.strokeRect(shape.x, shape.y, w, h);
          
        } else if (shape.type === 'circle') {
          const r = Math.hypot(shape.x2 - shape.x, shape.y2 - shape.y);
          ctx.arc(shape.x, shape.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (shape.type === 'free') {
          ctx.moveTo(shape.path[0][0], shape.path[0][1]);
          shape.path.forEach(([x, y]) => ctx.lineTo(x, y));
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    function isInsideShape(shape, x, y) {
      if (shape.type === 'rect') {
        const [x1, y1, x2, y2] = [shape.x, shape.y, shape.x2, shape.y2];
        return x >= Math.min(x1, x2) && x <= Math.max(x1, x2) &&
               y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
      }
      if (shape.type === 'circle') {
        const r = Math.hypot(shape.x2 - shape.x, shape.y2 - shape.y);
        return Math.hypot(x - shape.x, y - shape.y) <= r;
      }
      if (shape.type === 'line') {
        const dist = pointToLine(x, y, shape.x, shape.y, shape.x2, shape.y2);
        return dist < shape.width + 5;
      }
      return false;
    }

    function pointToLine(px, py, x1, y1, x2, y2) {
      const A = px - x1, B = py - y1;
      const C = x2 - x1, D = y2 - y1;
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      const param = lenSq !== 0 ? dot / lenSq : -1;
      const xx = param < 0 ? x1 : param > 1 ? x2 : x1 + param * C;
      const yy = param < 0 ? y1 : param > 1 ? y2 : y1 + param * D;
      return Math.hypot(px - xx, py - yy);
    }

    saveBtn.onclick = () => {
      localStorage.setItem('drawingAppData', JSON.stringify(shapes));
      alert('Drawing saved!');
    };

    loadBtn.onclick = () => {
      const data = localStorage.getItem('drawingAppData');
      if (data) {
        shapes = JSON.parse(data);
        redraw();
      }
    };

    clearBtn.onclick = () => {
      shapes = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };