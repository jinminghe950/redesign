// <dataset-area-map west east south north> — real slippy map (Leaflet + OpenStreetMap tiles).
const CSS = { href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', integrity: 'sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H' };
const JS = { src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', integrity: 'sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH' };

let ready;
function loadLeaflet() {
  if (ready) return ready;
  ready = new Promise((res, rej) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS.href;
      link.integrity = CSS.integrity;
      link.crossOrigin = 'anonymous';
      link.dataset.leaflet = '1';
      document.head.appendChild(link);
    }
    if (window.L) return res();
    let tag = document.querySelector('script[data-leaflet]');
    if (!tag) {
      tag = document.createElement('script');
      tag.src = JS.src;
      tag.integrity = JS.integrity;
      tag.crossOrigin = 'anonymous';
      tag.dataset.leaflet = '1';
      document.head.appendChild(tag);
    }
    tag.addEventListener('load', () => res());
    tag.addEventListener('error', rej);
  });
  return ready;
}

class DatasetAreaMap extends HTMLElement {
  static get observedAttributes() { return ['west', 'east', 'south', 'north']; }

  connectedCallback() {
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.height = '100%';
    if (!this._host) {
      this._host = document.createElement('div');
      this._host.style.cssText = 'width:100%;height:100%;background:var(--surf-2)';
      this.appendChild(this._host);
      this._ro = new ResizeObserver(() => { if (this._map) this._map.invalidateSize(); });
      this._ro.observe(this);
    }
    this.render();
  }
  disconnectedCallback() {
    if (this._ro) this._ro.disconnect();
    if (this._map) { this._map.remove(); this._map = null; }
  }
  attributeChangedCallback() { if (this._host) this.render(); }

  bounds() {
    const n = k => parseFloat(this.getAttribute(k));
    const b = { w: n('west'), e: n('east'), s: n('south'), n: n('north') };
    return [b.w, b.e, b.s, b.n].every(v => Number.isFinite(v)) ? b : null;
  }

  async render() {
    const b = this.bounds();
    if (!b) return;
    await loadLeaflet().catch(() => null);
    if (!window.L || !this.isConnected) return;
    const L = window.L;
    const bounds = L.latLngBounds([b.s, b.w], [b.n, b.e]);

    if (!this._map) {
      this._map = L.map(this._host, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
      }).addTo(this._map);
    }
    if (this._rect) this._rect.remove();
    this._rect = L.rectangle(bounds, {
      color: '#0b57d0', weight: 2, fillColor: '#0b57d0', fillOpacity: 0.16
    }).addTo(this._map);
    this._map.fitBounds(bounds, { padding: [26, 26], maxZoom: 11 });
    setTimeout(() => this._map && this._map.invalidateSize(), 60);
  }
}
customElements.define('dataset-area-map', DatasetAreaMap);
