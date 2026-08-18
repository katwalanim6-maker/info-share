/* ANIM OS — LIBRARY VISUAL / SHELF DEPTH FIX */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T || window.__animLibraryVisualFix) return;
  window.__animLibraryVisualFix = true;

  // Normal books: the shelf plank top is about 0.81 below the old
  // book bottom. Move the books down so their bottoms sit just above
  // the plank, while keeping them slightly behind the front lip.
  const originalSetMatrixAt = T.InstancedMesh.prototype.setMatrixAt;
  T.InstancedMesh.prototype.setMatrixAt = function (index, matrix) {
    const p = new T.Vector3();
    const q = new T.Quaternion();
    const s = new T.Vector3();
    matrix.decompose(p, q, s);
    if (!this.userData.__animLibraryAdjusted) {
      p.y -= 0.67;
      p.z = 0.48;
      matrix.compose(p, q, s);
    }
    return originalSetMatrixAt.call(this, index, matrix);
  };

  // Capture the library group and hero books while bookshelf-room.js builds them.
  const originalAdd = T.Object3D.prototype.add;
  let library = null;
  T.Object3D.prototype.add = function (...objects) {
    const result = originalAdd.apply(this, objects);
    for (const object of objects) {
      if (object && object.isGroup && Math.abs(object.position.z + 19) < 0.01) {
        library = object;
      }
    }
    return result;
  };

  const OriginalRenderer = T.WebGLRenderer;
  T.WebGLRenderer = class LibraryRenderer extends OriginalRenderer {
    constructor(...args) {
      super(...args);
      this.toneMappingExposure = 1.38;
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    #story-canvas {
      filter: brightness(1.16) contrast(0.96) saturate(1.06) !important;
    }
  `;
  document.head.appendChild(style);

  // The first and fourth hero books were too far toward the outer edges.
  // Bring them toward the centers of their shelf bays and keep all hero
  // books at the same forward shelf depth as the normal books.
  const fixHeroBooks = () => {
    if (!library) return false;
    const heroes = [];
    library.traverse(object => {
      if (!object.isGroup || object === library || object.children.length < 4) return;
      const hasLight = object.children.some(child => child.isPointLight);
      const hasFrontPivot = object.children.some(child => child.isGroup && child.children.some(x => x.isMesh));
      if (hasLight && hasFrontPivot) heroes.push(object);
    });
    if (!heroes.length) return false;

    heroes.forEach(hero => {
      if (hero.position.x < -8) hero.position.x = -7.15;
      if (hero.position.x > 8) hero.position.x = 7.15;
      hero.position.z = 0.82;
    });
    return heroes.length >= 4;
  };

  let tries = 0;
  const timer = setInterval(() => {
    if (fixHeroBooks() || ++tries > 120) {
      clearInterval(timer);
      T.Object3D.prototype.add = originalAdd;
    }
  }, 50);
})();
