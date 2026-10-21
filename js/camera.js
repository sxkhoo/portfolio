// Camera maths for the desk scene. Pure: no DOM.
//
// A camera is held in focus-point form { ox, oy, rotation, scale }: it maps the
// rest-pose screen point (ox, oy) to the viewport centre, rotated by `rotation`
// degrees and scaled by `scale`. Rest is the identity.

// screen px per SVG unit for a viewBox fitted with preserveAspectRatio slice|meet
export function svgScale(viewport, viewBox, mode) {
  const pick = mode === 'meet' ? Math.min : Math.max;
  return pick(viewport.w / viewBox[2], viewport.h / viewBox[3]);
}

// camera that makes a target cover the viewport. rect is the target's on-screen
// box measured at rest; size is its own (untilted) size in SVG units.
export function fitCamera({ rect, size, tilt, k, viewport, overscan = 1.015 }) {
  return {
    ox: rect.left + rect.width / 2,
    oy: rect.top + rect.height / 2,
    rotation: -tilt || 0,
    scale: Math.max(viewport.w / (size.w * k), viewport.h / (size.h * k)) * overscan,
  };
}

export function restCamera(viewport) {
  return { ox: viewport.w / 2, oy: viewport.h / 2, rotation: 0, scale: 1 };
}

// t is already eased; dip pulls the camera back mid-move (0 = straight zoom)
export function lerpCamera(a, b, t, dip = 0) {
  const lerp = (p, q) => p + (q - p) * t;
  const logS = lerp(Math.log(a.scale), Math.log(b.scale)) - dip * Math.sin(Math.PI * t) * Math.log(Math.max(a.scale, b.scale));
  return { ox: lerp(a.ox, b.ox), oy: lerp(a.oy, b.oy), rotation: lerp(a.rotation, b.rotation), scale: Math.exp(logS) };
}

// GSAP set() vars for a camera element whose box is the viewport
export function toTransform(cam, viewport) {
  return {
    x: viewport.w / 2 - cam.ox,
    y: viewport.h / 2 - cam.oy,
    rotation: cam.rotation,
    scale: cam.scale,
    transformOrigin: `${cam.ox}px ${cam.oy}px`,
  };
}
