/* ANIM OS — library geometry correction */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T) return;

  // Keep the ordinary library books sitting ON the shelf surface,
  // behind the front lip rather than intersecting the shelf below them.
  const originalSetMatrixAt = T.InstancedMesh.prototype.setMatrixAt;
  T.InstancedMesh.prototype.setMatrixAt = function (index, matrix) {
    const p = new T.Vector3();
    const q = new T.Quaternion();
    const s = new T.Vector3();
    matrix.decompose(p, q, s);

    // The bookshelf generator uses 2.45-unit row spacing and starts
    // each shelf at y=-4. Its old book center was based on a fixed
    // -3.05 value, which made the books sit in the wrong vertical band.
    // Move every generated library book down to the shelf surface.
    if (!this.userData.__animHero) {
      p.y -= 0.67;
      p.z = 0.48;
      matrix.compose(p, q, s);
    }
    return originalSetMatrixAt.call(this, index, matrix);
  };

  // Capture the library group while bookshelf-room.js is constructing it.
  const originalAdd = T.Object3D.prototype.add;
  let library = null;
  const captured = [];
  T.Object3D.prototype.add = function (...objects) {
    const result = originalAdd.apply(this, objects);
    for (const object of objects) {
      if (object && object.isGroup && Math.abs(object.position.z + 19) < 0.01) {
        library = object;
      }
      if (object && object.isInstancedMesh) object.userData.__animHero = false;
      captured.push(object);
    }
    return result;
  };

  // Once HeroBook objects have been fully constructed, place the first
  // and fourth hero books closer to the visual center of their bays and
  // put all hero books at the same shelf depth as the normal books.
  const fixHeroes = () => {
    if (!library) return false;
    const heroes = [];
    library.traverse(o => {
      if (!o.isGroup || o === library || o.children.length < 4) return;
      const hasLight = o.children.some(c => c.isPointLight);
      const hasPivot = o.children.some(c => c.isGroup && c.children.some(x => x.isMesh));
      if (hasLight && hasPivot) heroes.push(o);
    });
    if (heroes.length < 4) return false;

    heroes.sort((a,b) => a.position.y - b.position.y || a.position.x - b.position.x);
    // Identify by the known shelf positions rather than array order.
    for (const hero of heroes) {
      if (hero.position.x < -8) hero.position.x = -7.15;
      else if (hero.position.x > 8) hero.position.x = 7.15;
      hero.position.z = 0.82;
    }
    return true;
  };

  let tries = 0;
  const timer = setInterval(() => {
    if (fixHeroes() || ++tries > 120) {
      clearInterval(timer);
      T.Object3D.prototype.add = originalAdd;
    }
  }, 50);
})();
