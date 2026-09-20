/**
 * NG Global Manpower Services
 * High-Performance 3D WebGL Globe with Interactive Flight Arcs
 */
(function() {
  'use strict';

  function init3DGlobe() {
    const container = document.getElementById('globeCanvasContainer');
    if (!container || typeof THREE === 'undefined') return;

    let width = container.clientWidth || 480;
    let height = container.clientHeight || 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true, 
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 2. Base Sphere with Dark Sapphire Material
    const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x071536,
      emissive: 0x020716,
      specular: 0x2563eb,
      shininess: 30,
      transparent: true,
      opacity: 0.95
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(globeMesh);

    // 3. Glowing Atmosphere Outer Halo
    const atmosphereGeo = new THREE.SphereGeometry(1.08, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
          gl_FragColor = vec4(0.14, 0.45, 0.95, 1.0) * intensity * 0.9;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // 4. Dot Grid / Point Cloud representing Continental Surface
    const particleCount = 1800;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 1.012;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      if (i % 5 === 0) {
        particleColors[i * 3] = 0.95;
        particleColors[i * 3 + 1] = 0.78;
        particleColors[i * 3 + 2] = 0.25;
      } else {
        particleColors[i * 3] = 0.2;
        particleColors[i * 3 + 1] = 0.55;
        particleColors[i * 3 + 2] = 0.95;
      }
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.024,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(particleSystem);

    // 5. Connecting 3D Flight Arcs between Major Hubs
    function latLongToVector3(lat, lon, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    const hubOrigin = { lat: 19.0760, lon: 72.8777 }; // India / Mumbai
    const hubDestinations = [
      { lat: 25.2048, lon: 55.2708, name: 'Dubai UAE' },
      { lat: 24.7136, lon: 46.6753, name: 'Riyadh KSA' },
      { lat: 50.1109, lon: 8.6821, name: 'Frankfurt DE' },
      { lat: 52.2297, lon: 21.0122, name: 'Warsaw PL' },
      { lat: 32.7767, lon: -96.7970, name: 'USA' },
      { lat: -36.8485, lon: 174.7633, name: 'Auckland NZ' }
    ];

    const arcCurves = [];
    hubDestinations.forEach(dest => {
      const vStart = latLongToVector3(hubOrigin.lat, hubOrigin.lon, 1.01);
      const vEnd = latLongToVector3(dest.lat, dest.lon, 1.01);

      const midPoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
      const distance = vStart.distanceTo(vEnd);
      midPoint.normalize().multiplyScalar(1.0 + distance * 0.38);

      const curve = new THREE.QuadraticBezierCurve3(vStart, midPoint, vEnd);
      arcCurves.push(curve);

      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineBasicMaterial({
        color: 0xF59E0B,
        transparent: true,
        opacity: 0.65
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(arcLine);

      // Glowing Hub Beacon
      const beaconGeo = new THREE.SphereGeometry(0.024, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(vEnd);
      globeGroup.add(beaconMesh);
    });

    // Origin Beacon (India)
    const originGeo = new THREE.SphereGeometry(0.032, 16, 16);
    const originMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8 });
    const originMesh = new THREE.Mesh(originGeo, originMat);
    originMesh.position.copy(latLongToVector3(hubOrigin.lat, hubOrigin.lon, 1.01));
    globeGroup.add(originMesh);

    // 6. Flying Light Pulses across Arcs
    const pulses = arcCurves.map(curve => {
      const pulseGeo = new THREE.SphereGeometry(0.018, 12, 12);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
      const mesh = new THREE.Mesh(pulseGeo, pulseMat);
      globeGroup.add(mesh);
      return { mesh, curve, progress: Math.random() };
    });

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 1.5, 10);
    goldLight.position.set(-4, -2, 3);
    scene.add(goldLight);

    // 8. Interactive Drag Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    container.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      globeGroup.rotation.y += deltaMove.x * 0.005;
      globeGroup.rotation.x += deltaMove.y * 0.005;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Touch support for mobile devices
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => { isDragging = false; });

    container.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.x,
        y: e.touches[0].clientY - previousMousePosition.y
      };

      globeGroup.rotation.y += deltaMove.x * 0.006;
      globeGroup.rotation.x += deltaMove.y * 0.006;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    // 9. IntersectionObserver Optimization: pause rendering when off-screen
    let isVisible = true;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
      }, { threshold: 0.1 });
      observer.observe(container);
    }

    // 10. Animation Loop
    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      if (!isDragging) {
        globeGroup.rotation.y += 0.0022; // Smooth constant idle spin
      }

      // Move flight pulse beacons
      pulses.forEach(p => {
        p.progress += 0.006;
        if (p.progress > 1) p.progress = 0;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

      renderer.render(scene, camera);
    }
    animate();

    // 11. Debounced Resize Handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!container) return;
        const newW = container.clientWidth || 480;
        const newH = container.clientHeight || 480;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }, 150);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DGlobe);
  } else {
    init3DGlobe();
  }
})();
