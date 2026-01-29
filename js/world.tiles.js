(function(){
  // 简易瓦片地图渲染器：支持 1-7 级滚轮缩放、按中心坐标加载可视范围内图块
  // 仅用于 2D tiles 模式的背景展示，不承载交互与叠加图层
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function deg2rad(d){ return d * Math.PI / 180; }
  function rad2deg(r){ return r * 180 / Math.PI; }
  function lonLatToTileXY(lon, lat, z){
    var n = Math.pow(2, z);
    var x = (lon + 180) / 360 * n;
    // Web Mercator
    var latRad = deg2rad(clamp(lat, -85, 85));
    var y = (1 - Math.log(Math.tan(latRad) + 1/Math.cos(latRad)) / Math.PI) / 2 * n;
    return { x: x, y: y }; // fractional tile coords
  }
  function tileXYToLonLat(x, y, z){
    var n = Math.pow(2, z);
    var lon = (x / n) * 360 - 180;
    var latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y / n))));
    var lat = rad2deg(latRad);
    return { lon: lon, lat: clamp(lat, -85, 85) };
  }
  function wrapLon(lon, ref){
    var d = lon - ref;
    d = ((d + 180) % 360 + 360) % 360 - 180;
    return ref + d;
  }
  function createEl(tag, cls){ var el = document.createElement(tag); if (cls) el.className = cls; return el; }
  function calcMinZoomByHeight(container, tileSize){
    var H = container ? (container.clientHeight || (container.getBoundingClientRect && container.getBoundingClientRect().height) || 600) : 600;
    var ts = tileSize || 256;
    var minByHeight = Math.log2(Math.max(1.0001, H / ts));
    return minByHeight;
  }
  function TileMap(container, options){
    this.container = container;
    this.opts = Object.assign({ basePath: 'img/tiles_world_img', tileSize: 256, zoom: 2, minZoom: 1, maxZoom: 7, overzoomFactor: 5, center: [0,0], onZoom: null, onPan: null, onLineClick: null, onPointClick: null, onHoverLine: null, onHoverPoint: null, onHoverNone: null, onMapClick: null, onMouseMove: null }, (options||{}));
    this._maxZoom = Number(this.opts.maxZoom) || 7; // 原始瓦片资源最高级别（当前提供 0-7 级）
    var minDyn = Math.max(this.opts.minZoom, calcMinZoomByHeight(this.container, this.opts.tileSize));
    var maxExtra = Math.log2(Math.max(1.0001, Number(this.opts.overzoomFactor) || 1));
    var upper = this._maxZoom + maxExtra;
    this.zoom = clamp(Number(this.opts.zoom)||2, minDyn, upper);
    this._minZoomDynamic = minDyn;
    this.center = Array.isArray(this.opts.center) ? this.opts.center.slice() : [0,0];
    this.overlay = { lines: [], points: [] };
    this._wheelDeltaAcc = 0;
    this._hoverLine = null;
    this._hoverPoint = null;
    this._raf = null;
    this._animating = false;
    this.layer = createEl('div', 'tiles-layer');
    this.layer.style.position = 'absolute';
    this.layer.style.left = '0';
    this.layer.style.top = '0';
    this.layer.style.right = '0';
    this.layer.style.bottom = '0';
    this.layer.style.overflow = 'hidden';
    this.layer.style.background = '#0e1a36';
    this.overlayCanvas = createEl('canvas', 'tiles-overlay');
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.right = '0';
    this.overlayCanvas.style.bottom = '0';
    this.overlayCanvas.style.pointerEvents = 'auto';
    this.container.style.position = 'relative';
    this.container.appendChild(this.layer);
    this.container.appendChild(this.overlayCanvas);
    this._wheelHandler = this._onWheel.bind(this);
    this._mouseDownHandler = this._onMouseDown.bind(this);
    this._mouseMoveHandler = this._onMouseMove.bind(this);
    this._mouseUpHandler = this._onMouseUp.bind(this);
    this._mouseMoveHoverHandler = this._onMouseMoveHover.bind(this);
    this._mouseLeaveHandler = this._onMouseLeave.bind(this);
    this._clickHandler = this._onClick.bind(this);
    this.container.addEventListener('wheel', this._wheelHandler, { passive: true });
    this.container.addEventListener('mousedown', this._mouseDownHandler, { passive: false });
    this.overlayCanvas.addEventListener('wheel', this._wheelHandler, { passive: true });
    this.overlayCanvas.addEventListener('mousedown', this._mouseDownHandler, { passive: false });
    this.overlayCanvas.addEventListener('mousemove', this._mouseMoveHoverHandler, { passive: true });
    this.overlayCanvas.addEventListener('mouseleave', this._mouseLeaveHandler, { passive: true });
    this.overlayCanvas.addEventListener('click', this._clickHandler, { passive: true });
    this.render();
    this._ensureAnim();
  }
  TileMap.prototype.destroy = function(){
    try { this.container.removeEventListener('wheel', this._wheelHandler); } catch(e){}
    try { this.container.removeEventListener('mousedown', this._mouseDownHandler); } catch(e){}
    try { window.removeEventListener('mousemove', this._mouseMoveHandler); } catch(e){}
    try { window.removeEventListener('mouseup', this._mouseUpHandler); } catch(e){}
    try { if (this.overlayCanvas) { this.overlayCanvas.removeEventListener('wheel', this._wheelHandler); this.overlayCanvas.removeEventListener('mousedown', this._mouseDownHandler); this.overlayCanvas.removeEventListener('mousemove', this._mouseMoveHoverHandler); this.overlayCanvas.removeEventListener('mouseleave', this._mouseLeaveHandler); this.overlayCanvas.removeEventListener('click', this._clickHandler); } } catch(e){}
    try { if (this.layer && this.layer.parentElement) this.layer.parentElement.removeChild(this.layer); } catch(e){}
    try { if (this.overlayCanvas && this.overlayCanvas.parentElement) this.overlayCanvas.parentElement.removeChild(this.overlayCanvas); } catch(e){}
    this.layer = null;
    this.overlayCanvas = null;
    this._hoverLine = null;
    this._hoverPoint = null;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  };
  TileMap.prototype.resize = function(){ this.render(); };
  TileMap.prototype.setCenter = function(center){ if (Array.isArray(center) && center.length>=2){ this.center = [Number(center[0])||0, Number(center[1])||0]; if (typeof this.opts.onPan === 'function') { this.opts.onPan(this.center.slice()); } this.render(); } };
  TileMap.prototype.setZoom = function(z){
    // 动态计算最小缩放：保证世界像素高度不小于容器高度，避免上下漏底
    var H = this.container ? (this.container.clientHeight || (this.container.getBoundingClientRect && this.container.getBoundingClientRect().height) || 600) : 600;
    var ts = this.opts.tileSize || 256;
    var minByHeight = calcMinZoomByHeight(this.container, ts);
    var minAllowed = Math.max(this.opts.minZoom || 1, minByHeight);
    this._minZoomDynamic = minAllowed;
    var maxExtra = Math.log2(Math.max(1.0001, Number(this.opts.overzoomFactor) || 1)); // 最后一档可继续放大 overzoomFactor 倍
    var upper = this._maxZoom + maxExtra;
    var nz = clamp(Number(z)||this.zoom, minAllowed, upper);
    if (nz!==this.zoom){
      this.zoom = nz;
      if (typeof this.opts.onZoom === 'function') { this.opts.onZoom(this.zoom); }
      this.render();
    }
  };
  TileMap.prototype.getZoom = function(){ return this.zoom; };
  TileMap.prototype.setOverlayData = function(data){
    if (!data) return;
    this.overlay = {
      lines: Array.isArray(data.lines) ? data.lines : [],
      points: Array.isArray(data.points) ? data.points : []
    };
    this.render();
  };
  TileMap.prototype._ensureAnim = function(){
    if (this._animating) return;
    this._animating = true;
    var self = this;
    var loop = function(){
      self._raf = requestAnimationFrame(loop);
      if (self._lastView) self._renderOverlay(self._lastView, performance.now());
    };
    this._raf = requestAnimationFrame(loop);
  };
  TileMap.prototype._onWheel = function(ev){
    var dy = ev.deltaY || 0;
    // 放缓滚轮缩放：累积再触发，单次最多跳 1 级，避免飞速缩放
    this._wheelDeltaAcc += dy * 0.6;
    this._wheelDeltaAcc = clamp(this._wheelDeltaAcc, -720, 720);
    var threshold = 320;
    if (Math.abs(this._wheelDeltaAcc) < threshold) return;
    var steps = Math.trunc(this._wheelDeltaAcc / threshold);
    steps = steps > 0 ? 1 : -1;
    this._wheelDeltaAcc -= steps * threshold;
    this.setZoom(this.zoom - steps);
  };
  TileMap.prototype._onMouseDown = function(ev){
    if (ev.buttons !== 1) return;
    ev.preventDefault();
    this._dragging = true;
    this._dragStart = { x: ev.clientX, y: ev.clientY };
    this._dragCenter = this.center.slice();
    window.addEventListener('mousemove', this._mouseMoveHandler, { passive: false });
    window.addEventListener('mouseup', this._mouseUpHandler, { passive: false });
  };
  TileMap.prototype._onMouseMove = function(ev){
    if (!this._dragging) return;
    ev.preventDefault();
    var dx = ev.clientX - this._dragStart.x;
    var dy = ev.clientY - this._dragStart.y;
    var ts = this.opts.tileSize;
    var z = this.zoom;
    var effZ = Math.min(Math.floor(z), this._maxZoom);
    var scale = Math.pow(2, z - effZ);
    var tsScaled = ts * scale;
    var halfH = (this.container ? (this.container.clientHeight || (this.container.getBoundingClientRect && this.container.getBoundingClientRect().height) || 600) : 600) / 2;
    var startTile = lonLatToTileXY(this._dragCenter[0], this._dragCenter[1], z);
    var n = Math.pow(2, z);
    var nx = startTile.x - dx / ts;
    var ny = startTile.y - dy / ts;
    var minNy = halfH / tsScaled;
    var maxNy = n - minNy;
    ny = clamp(ny, minNy, maxNy); // 垂直方向按视口高度限制，避免拖出空白
    var wrappedX = ((nx % n) + n) % n;
    var ll = tileXYToLonLat(wrappedX, ny, z);
    this.center = [wrapLon(ll.lon, this._dragCenter[0]), ll.lat];
    if (!this._dragRaf) {
      var self = this;
      this._dragRaf = requestAnimationFrame(function(){
        self._dragRaf = null;
        if (typeof self.opts.onPan === 'function') { self.opts.onPan(self.center.slice()); }
        self.render();
      });
    }
  };
  TileMap.prototype._onMouseUp = function(){
    this._dragging = false;
    this._dragStart = null;
    this._dragCenter = null;
    window.removeEventListener('mousemove', this._mouseMoveHandler);
    window.removeEventListener('mouseup', this._mouseUpHandler);
  };
  TileMap.prototype._onMouseLeave = function(){
    this._hoverLine = null;
    this._hoverPoint = null;
    if (typeof this.opts.onHoverNone === 'function') this.opts.onHoverNone();
  };
  TileMap.prototype._onMouseMoveHover = function(ev){
    if (!this._lastView) return;
    var view = this._lastView;
    var rect = this.overlayCanvas.getBoundingClientRect();
    var px = ev.clientX - rect.left;
    var py = ev.clientY - rect.top;
    var clickPt = { x: px, y: py };
    var shifts = [-360, 0, 360];
    var bestPoint = null;
    var bestPointDist = Infinity;
    var points = Array.isArray(this.overlay.points) ? this.overlay.points : [];
    points.forEach(function(pt){
      shifts.forEach(function(shift){
        var p = this._projectWithShift(pt.coord || pt.value, view, shift);
        if (!p) return;
        var dx = p.x - clickPt.x;
        var dy = p.y - clickPt.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < bestPointDist) {
          bestPointDist = dist;
          bestPoint = pt;
        }
      }, this);
    }, this);
    var bestLine = null;
    var bestLineDist = Infinity;
    var lines = Array.isArray(this.overlay.lines) ? this.overlay.lines : [];
    lines.forEach(function(line){
      if (!line || !Array.isArray(line.coords)) return;
      shifts.forEach(function(shift){
        var prev = null;
        line.coords.forEach(function(c){
          var p = this._projectWithShift(c, view, shift);
          if (!p) return;
          if (prev) {
            var d = this._distToSegment(clickPt, prev, p);
            if (d < bestLineDist) {
              bestLineDist = d;
              bestLine = line;
            }
          }
          prev = p;
        }, this);
      }, this);
    }, this);
    var pointThresh = 18;
    var lineThresh = 14;
    var nextHoverPoint = (bestPointDist <= pointThresh) ? bestPoint : null;
    var nextHoverLine = (!nextHoverPoint && bestLineDist <= lineThresh) ? bestLine : null;
    this._hoverPoint = nextHoverPoint;
    this._hoverLine = nextHoverLine;
    if (nextHoverPoint && typeof this.opts.onHoverPoint === 'function') {
      this.opts.onHoverPoint(nextHoverPoint, { x: ev.clientX, y: ev.clientY });
    } else if (nextHoverLine && typeof this.opts.onHoverLine === 'function') {
      this.opts.onHoverLine(nextHoverLine, { x: ev.clientX, y: ev.clientY });
    } else if (typeof this.opts.onHoverNone === 'function') {
      this.opts.onHoverNone();
    }
    if (typeof this.opts.onMouseMove === 'function') {
      var moveCoord = this._pixelToLonLat(px, py, view);
      this.opts.onMouseMove({ coord: [moveCoord.lon, moveCoord.lat] });
    }
  };
  TileMap.prototype._clear = function(){
    var children = Array.prototype.slice.call(this.layer.children||[]);
    children.forEach(function(ch){ try { ch.remove(); } catch(e){} });
  };
  TileMap.prototype._renderTiles = function(view){
    this._clear();
    var ts = view.ts;
    var n = Math.pow(2, view.effZ);
    var maxIdx = n - 1;
    for (var x = view.startX; x <= view.endX; x++){
      for (var y = view.startY; y <= view.endY; y++){
        if (y < 0 || y > maxIdx) continue;
        var left = Math.round(x*ts - view.pxX + view.halfW);
        var top  = Math.round(y*ts - view.pxY + view.halfH);
        var wrapX = ((x % n) + n) % n;
        var tileUrl = this.opts.basePath + '/' + view.effZ + '/' + wrapX + '/' + y + '.png'; // 新瓦片路径：z/x/y.png，源目录为 img/tiles_world_img
        var img = createEl('img');
        img.draggable = false;
        img.alt = 'tile '+view.effZ+'_'+wrapX+'_'+y;
        img.src = tileUrl;
        img.style.position = 'absolute';
        img.style.left = left + 'px';
        img.style.top = top + 'px';
        img.style.width = ts + 'px';
        img.style.height = ts + 'px';
        img.style.imageRendering = 'pixelated';
        this.layer.appendChild(img);
      }
    }
  };
  TileMap.prototype._project = function(coord, view){
    if (!coord || coord.length < 2) return null;
    var lon = wrapLon(Number(coord[0]) || 0, this.center[0]);
    var lat = Number(coord[1]) || 0;
    var frac = lonLatToTileXY(lon, lat, view.effZ);
    var px = frac.x * view.ts - view.pxX + view.halfW;
    var py = frac.y * view.ts - view.pxY + view.halfH;
    return { x: px, y: py };
  };
  TileMap.prototype._projectWithShift = function(coord, view, shiftLon){
    if (!coord || coord.length < 2) return null;
    var lon = (Number(coord[0]) || 0) + (shiftLon || 0);
    var lat = Number(coord[1]) || 0;
    var frac = lonLatToTileXY(lon, lat, view.effZ);
    var px = frac.x * view.ts - view.pxX + view.halfW;
    var py = frac.y * view.ts - view.pxY + view.halfH;
    return { x: px, y: py };
  };
  TileMap.prototype._distToSegment = function(p, a, b){
    var vx = b.x - a.x, vy = b.y - a.y;
    var wx = p.x - a.x, wy = p.y - a.y;
    var c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.sqrt((p.x - a.x)*(p.x - a.x) + (p.y - a.y)*(p.y - a.y));
    var c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.sqrt((p.x - b.x)*(p.x - b.x) + (p.y - b.y)*(p.y - b.y));
    var t = c1 / c2;
    var projX = a.x + t * vx;
    var projY = a.y + t * vy;
    return Math.sqrt((p.x - projX)*(p.x - projX) + (p.y - projY)*(p.y - projY));
  };
  TileMap.prototype._pixelToLonLat = function(px, py, view){
    var tileX = (view.pxX - view.halfW + px) / view.ts;
    var tileY = (view.pxY - view.halfH + py) / view.ts;
    var ll = tileXYToLonLat(tileX, tileY, view.effZ);
    return { lon: wrapLon(ll.lon, this.center[0]), lat: ll.lat };
  };
  TileMap.prototype._onClick = function(ev){
    if (!this._lastView) return;
    var view = this._lastView;
    var rect = this.overlayCanvas.getBoundingClientRect();
    var px = ev.clientX - rect.left;
    var py = ev.clientY - rect.top;
    var clickPt = { x: px, y: py };
    var clickCoord = this._pixelToLonLat(px, py, view);
    var shifts = [-360, 0, 360];
    var bestPoint = null;
    var bestPointDist = Infinity;
    var points = Array.isArray(this.overlay.points) ? this.overlay.points : [];
    points.forEach(function(pt){
      shifts.forEach(function(shift){
        var p = this._projectWithShift(pt.coord || pt.value, view, shift);
        if (!p) return;
        var dx = p.x - clickPt.x;
        var dy = p.y - clickPt.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < bestPointDist) {
          bestPointDist = dist;
          bestPoint = pt;
        }
      }, this);
    }, this);
    var bestLine = null;
    var bestLineDist = Infinity;
    var lines = Array.isArray(this.overlay.lines) ? this.overlay.lines : [];
    lines.forEach(function(line){
      if (!line || !Array.isArray(line.coords)) return;
      shifts.forEach(function(shift){
        var prev = null;
        line.coords.forEach(function(c){
          var p = this._projectWithShift(c, view, shift);
          if (!p) return;
          if (prev) {
            var d = this._distToSegment(clickPt, prev, p);
            if (d < bestLineDist) {
              bestLineDist = d;
              bestLine = line;
            }
          }
          prev = p;
        }, this);
      }, this);
    }, this);
    var pointThresh = 16;
    var lineThresh = 12;
    var handled = false;
    if (bestPoint && bestPointDist <= pointThresh && typeof this.opts.onPointClick === 'function') {
      handled = this.opts.onPointClick(bestPoint, clickCoord) === true;
    } else if (bestLine && bestLineDist <= lineThresh && typeof this.opts.onLineClick === 'function') {
      handled = this.opts.onLineClick(bestLine, clickCoord) === true;
    }
    if (typeof this.opts.onMapClick === 'function' && !handled) {
      this.opts.onMapClick({ coord: [clickCoord.lon, clickCoord.lat], point: bestPoint, line: bestLine });
    }
  };
  TileMap.prototype._renderOverlay = function(view, time){
    if (!this.overlayCanvas) return;
    var cvs = this.overlayCanvas;
    var W = view.W, H = view.H;
    if (cvs.width !== Math.round(W)) cvs.width = Math.round(W);
    if (cvs.height !== Math.round(H)) cvs.height = Math.round(H);
    var ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    var lines = Array.isArray(this.overlay.lines) ? this.overlay.lines : [];
    var shifts = [-360, 0, 360]; // 水平循环偏移，覆盖左右两侧
    var now = typeof time === 'number' ? time : performance.now();
    lines.forEach(function(line){
      if (!line || !Array.isArray(line.coords)) return;
      var color = line.color || 'rgba(0,180,255,0.6)';
      var width = line.width || 1.2;
      var opacity = (typeof line.opacity === 'number') ? line.opacity : 0.7;
      var dash = Array.isArray(line.dash) ? line.dash : [18, 14];
      var dashSpeed = (typeof line.dashSpeed === 'number') ? line.dashSpeed : 0.06;
      var haloColor = line.haloColor || null;
      var haloWidth = line.haloWidth || null;
      var glowColor = line.glowColor || null;
      var glowBlur = line.glowBlur || (line.fault ? 18 : 0);
      var innerColor = line.innerColor || null;
      var innerWidth = line.innerWidth || (line.width ? line.width * 0.55 : 0);
      var cap = line.cap || 'round';
      var hovered = (this._hoverLine === line);
      if (hovered) {
        opacity = 1;
        width = width * 1.2;
        if (haloWidth) haloWidth = haloWidth * 1.05;
        glowBlur = glowBlur * 1.1;
      }
      shifts.forEach(function(shift){
        var path = [];
        line.coords.forEach(function(pt){
          var p = this._projectWithShift(pt, view, shift);
          if (p) path.push(p);
        }, this);
        if (path.length < 2) return;
        var flowOffset = dash.length ? -((now * dashSpeed) % 320) : 0;
        var drawPath = function(style, lineWidth, alpha, dashArr, dashOffset, shadowColor, shadowBlur){
          ctx.save();
          ctx.strokeStyle = style;
          ctx.lineWidth = lineWidth;
          ctx.globalAlpha = alpha;
          ctx.lineCap = cap;
          ctx.lineJoin = 'round';
          if (Array.isArray(dashArr) && dashArr.length){
            ctx.setLineDash(dashArr);
            ctx.lineDashOffset = dashOffset;
          } else {
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
          }
          if (shadowBlur && shadowColor){
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
          }
          ctx.beginPath();
          path.forEach(function(p, idx){ if (idx===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
          ctx.stroke();
          ctx.restore();
        };
        if (haloColor && haloWidth){
          drawPath(haloColor, haloWidth, opacity * 0.68, [], 0, glowColor || haloColor, glowBlur ? glowBlur * 0.6 : 0);
        }
        if (innerColor) {
          drawPath(color, width, opacity * 0.75, dash, flowOffset, glowColor || color, glowBlur * 0.6);
          drawPath(innerColor, innerWidth, Math.min(1, opacity + 0.05), dash, flowOffset, glowColor || innerColor, glowBlur * 0.4);
        } else {
          drawPath(color, width, opacity, dash, flowOffset, glowColor || color, glowBlur);
        }
      }, this);
    }, this);
    var points = Array.isArray(this.overlay.points) ? this.overlay.points : [];
    points.forEach(function(pt){
      var r = Math.max(2, Number(pt.radius) || 3);
      var fill = pt.color || '#f9f9f9';
      var stroke = pt.stroke || 'rgba(0,0,0,0.18)';
      var label = (pt.label || '').toString();
      var showLabel = !!(label && label.trim());
      var labelColor = pt.labelColor || '#e8f7ff';
      var labelBg = pt.labelBg || 'rgba(8,15,30,0.6)';
      var labelOffset = Array.isArray(pt.labelOffset) ? pt.labelOffset : [10, -10];
      var labelFont = pt.labelFont || '12px sans-serif';
      var hovered = (this._hoverPoint === pt);
      var alpha = 1;
      var isLocator = pt.icon === 'locator';
      var shape = pt.shape || 'circle';
      if (isLocator && shape !== 'diamond') { r = r * 0.9; }
      if (hovered) r = r * 1.25;
      shifts.forEach(function(shift){
        var p = this._projectWithShift(pt.coord || pt.value, view, shift);
        if (!p) return;
        var enableRipple = pt.ripple !== false;
        // 绘制淡淡的涟漪（可关闭）
        if (enableRipple) {
          var phase = (now % 1200) / 1200;
          var rippleR = r + 6 * phase + 2;
          var rippleAlpha = isLocator ? 0.18 * (1 - phase) : 0.28 * (1 - phase);
          ctx.strokeStyle = fill;
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = rippleAlpha;
          ctx.beginPath();
          if (shape === 'diamond') {
            ctx.moveTo(p.x, p.y - rippleR);
            ctx.lineTo(p.x + rippleR, p.y);
            ctx.lineTo(p.x, p.y + rippleR);
            ctx.lineTo(p.x - rippleR, p.y);
            ctx.closePath();
          } else {
            ctx.arc(p.x, p.y, rippleR, 0, Math.PI * 2);
          }
          ctx.stroke();
        }
        // 主标记：定位点使用简单 pin，其他保持圆形
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (shape === 'diamond') {
          ctx.moveTo(p.x, p.y - r);
          ctx.lineTo(p.x + r, p.y);
          ctx.lineTo(p.x, p.y + r);
          ctx.lineTo(p.x - r, p.y);
          ctx.closePath();
        } else if (isLocator) {
          ctx.arc(p.x, p.y, r, Math.PI * 0.25, Math.PI * 1.75);
          ctx.lineTo(p.x, p.y + r * 1.4);
          ctx.closePath();
        } else {
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();
        if (showLabel) {
          ctx.font = labelFont;
          var text = label.trim();
          var metrics = ctx.measureText(text);
          var th = 16;
          var pad = 4;
          var lx = p.x + labelOffset[0];
          var ly = p.y + labelOffset[1];
          ctx.fillStyle = labelBg;
          ctx.beginPath();
          ctx.rect(lx - pad, ly - th + pad, metrics.width + pad * 2, th);
          ctx.fill();
          ctx.fillStyle = labelColor;
          ctx.fillText(text, lx, ly);
        }
      }, this);
      ctx.globalAlpha = 1;
    }, this);
  };
  TileMap.prototype.render = function(){
    if (!this.layer) return;
    var rect = this.container.getBoundingClientRect();
    var W = rect.width||this.container.clientWidth||800;
    var H = rect.height||this.container.clientHeight||600;
    var minAllowed = Math.max(this.opts.minZoom || 1, calcMinZoomByHeight(this.container, this.opts.tileSize || 256));
    this._minZoomDynamic = minAllowed;
    var maxExtra = Math.log2(Math.max(1.0001, Number(this.opts.overzoomFactor) || 1));
    var upper = this._maxZoom + maxExtra;
    if (this.zoom < minAllowed) this.zoom = minAllowed;
    if (this.zoom > upper) this.zoom = upper;
    var z = this.zoom;
    var effZ = Math.min(Math.floor(z), this._maxZoom);
    var scale = Math.pow(2, z - effZ); // 允许在最高层继续放大 overzoomFactor 倍
    var ts = this.opts.tileSize;
    var tsScaled = ts * scale;
    // 计算中心点在瓦片坐标系中的像素位置
    var frac = lonLatToTileXY(this.center[0], this.center[1], effZ);
    var pxX = frac.x * tsScaled;
    var pxY = frac.y * tsScaled;
    var n = Math.pow(2, effZ);
    var halfW = W/2, halfH = H/2;
    // 垂直方向根据视口高度动态夹紧，避免上下留白
    var minTileY = halfH / tsScaled;
    var maxTileY = n - minTileY;
    if (maxTileY < minTileY) { maxTileY = minTileY; }
    var clampedY = clamp(frac.y, minTileY, maxTileY);
    if (clampedY !== frac.y) {
      var llFix = tileXYToLonLat(frac.x, clampedY, effZ);
      this.center = [wrapLon(llFix.lon, this.center[0]), llFix.lat];
      frac.y = clampedY;
      pxY = frac.y * tsScaled;
    }
    // 计算需要覆盖视口的瓦片范围
    var startX = Math.floor((pxX - halfW) / tsScaled);
    var endX   = Math.floor((pxX + halfW) / tsScaled);
    var startY = Math.floor((pxY - halfH) / tsScaled);
    var endY   = Math.floor((pxY + halfH) / tsScaled);
    var view = { W: W, H: H, z: z, effZ: effZ, scale: scale, ts: tsScaled, pxX: pxX, pxY: pxY, halfW: halfW, halfH: halfH, startX: startX, endX: endX, startY: startY, endY: endY };
    this._lastView = view;
    this._renderTiles(view);
    this._renderOverlay(view, performance.now());
  };
  window.TileMap = TileMap;
})();
