append_str = """
// ─── GLOBE.GL ANIMATION ────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const globeContainer = document.getElementById('globeViz');
  if (globeContainer) {
    const globe = Globe()(globeContainer)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .backgroundColor('rgba(0,0,0,1)')
      .width(window.innerWidth)
      .height(window.innerHeight);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.controls().enableZoom = false; // Background locked
    globe.camera().position.z = 250; // Zoom in slightly

    window.addEventListener('resize', () => {
      globe.width(window.innerWidth);
      globe.height(window.innerHeight);
    });
  }
});
"""

with open(r'c:\Users\Shubham jain\OneDrive\Attachments\Desktop\NC3\script.js', 'a', encoding='utf-8') as f:
    f.write(append_str)
