/* ANIM OS — FINAL LIBRARY GEOMETRY FIX */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T || window.__animLibraryGeometryFix) return;
  window.__animLibraryGeometryFix = true;

  const originalRender = T.WebGLRenderer.prototype.render;
  let fixed = false;

  function fixLibrary(scene) {
    if (fixed) return;

    let library = null;
    scene.traverse(o => {
      if (o.isGroup && Math.abs(o.position.z + 19) < 0.01 && o.children.length > 20) {
        library = o;
      }
    });
    if (!library) return;

    // Normal books: the shelf plank is centred on shelfY and is .28 high.
    // Put each book's bottom directly on its top surface instead of leaving
    // it floating in the gap between shelves.
    library.traverse(o => {
      if (!o.isInstancedMesh || o.userData.animGeometryFixed) return;

      const matrix = new T.Matrix4();
      const position = new T.Vector3();
      const quaternion = new T.Quaternion();
      const scale = new T.Vector3();

      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, matrix);
        matrix.decompose(position, quaternion, scale);
        position.y -= 0.81;
        position.z = 0.12;
        matrix.compose(position, quaternion, scale);
        o.setMatrixAt(i, matrix);
      }

      o.instanceMatrix.needsUpdate = true;
      o.userData.animGeometryFixed = true;
    });

    // Hero books are deliberately large models but are stored at .38 scale,
    // making their closed size approximately 1.27 x 1.96 — a realistic book.
    // The first and fourth hero books belong in the centre of the second and
    // fourth bays, not outside the shelf system.
    const heroes = [];
    library.traverse(o => {
      if (!o.isGroup || o === library) return;
      const hasLight = o.children.some(c => c.isPointLight);
      const hasFrontPivot = o.children.some(
        c => c.isGroup && c.position.x < -1 && c.children.some(x => x.isMesh)
      );
      if (hasLight && hasFrontPivot) heroes.push(o);
    });

    for (const hero of heroes) {
      hero.scale.setScalar(0.38);
      hero.position.x = hero.position.x < 0 ? -7 : 7;
      hero.position.y += 1.12;
      hero.position.z = 0.12;
    }

    fixed = true;
  }

  T.WebGLRenderer.prototype.render = function(scene, camera) {
    this.toneMappingExposure = 1.38;
    fixLibrary(scene);
    return originalRender.call(this, scene, camera);
  };

  const style = document.createElement('style');
  style.textContent = `
    #story-canvas {
      filter: brightness(1.16) contrast(0.96) saturate(1.06) !important;
    }
  `;
  document.head.appendChild(style);
})();
