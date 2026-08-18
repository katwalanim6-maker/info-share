/* ANIM OS — LIBRARY VISUAL / SHELF DEPTH FIX */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T || window.__animLibraryVisualFix) return;
  window.__animLibraryVisualFix = true;

  // The original bookshelf books were placed behind the shelf depth.
  // Shift instanced library books forward so they visibly sit inside the bays.
  const originalSetMatrixAt = T.InstancedMesh.prototype.setMatrixAt;
  T.InstancedMesh.prototype.setMatrixAt = function (index, matrix) {
    const z = matrix.elements[14];
    if (z > -0.5 && z < 0.5) matrix.elements[14] = z + 0.48;
    return originalSetMatrixAt.call(this, index, matrix);
  };

  // Give the library a brighter cinematic exposure without flattening the colors.
  const OriginalRenderer = T.WebGLRenderer;
  T.WebGLRenderer = class LibraryRenderer extends OriginalRenderer {
    constructor(...args) {
      super(...args);
      this.toneMappingExposure = 1.38;
    }
  };

  // A subtle screen lift makes the shelves readable on phone displays too.
  const style = document.createElement('style');
  style.textContent = `
    #story-canvas {
      filter: brightness(1.16) contrast(0.96) saturate(1.06) !important;
    }
  `;
  document.head.appendChild(style);
})();
