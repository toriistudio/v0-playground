import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import vertexShader from "@/shaders/vertex.glsl";
import fragmentShader from "@/shaders/fragment.glsl";

type CanvasParticlesProps = {
  pointSizeBase: number;
  displacementStrength: number;
  glowSizeFactor: number;
  intensityScale: number;
  color: string;
  pictureUrl: string;
};

export default function CanvasParticles({
  pointSizeBase,
  displacementStrength,
  glowSizeFactor,
  intensityScale,
  color,
  pictureUrl,
}: CanvasParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const canvasBounds = useRef<DOMRect | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const { size, gl, camera, scene } = useThree();
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  const OFFSCREEN_CURSOR = new THREE.Vector2(9999, 9999);

  const displacement = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    const glowImage = new Image();
    glowImage.src = "/glow.png";

    return {
      canvas,
      context,
      texture,
      glowImage,
      screenCursor: OFFSCREEN_CURSOR.clone(),
      canvasCursor: OFFSCREEN_CURSOR.clone(),
      canvasCursorPrevious: OFFSCREEN_CURSOR.clone(),
      raycaster: new THREE.Raycaster(),
      interactivePlane: new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
      ),
    };
  }, []);

  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(10, 10, 128, 128);
    geom.setIndex(null);
    geom.deleteAttribute("normal");

    const count = geom.attributes.position.count;
    const intensities = new Float32Array(count);
    const angles = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      intensities[i] = Math.random() * intensityScale;
      angles[i] = Math.random() * Math.PI * 2;
    }

    geom.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
    geom.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    return geom;
  }, [intensityScale]);

  const uniforms = useMemo(
    () => ({
      uResolution: {
        value: new THREE.Vector2(
          size.width * pixelRatio,
          size.height * pixelRatio
        ),
      },
      uPictureTexture: {
        value: new THREE.TextureLoader().load(pictureUrl),
      },
      uDisplacementTexture: {
        value: displacement.texture,
      },
      uPointSizeBase: { value: pointSizeBase },
      uDisplacementStrength: { value: displacementStrength },
      uColor: { value: new THREE.Color(color) },
    }),
    []
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value.set(color);
    }
  }, [color]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();

    // Handle base64 data URI or standard URL
    if (pictureUrl?.startsWith("data:image/")) {
      const img = new Image();
      img.onload = () => {
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        if (materialRef.current) {
          materialRef.current.uniforms.uPictureTexture.value = texture;
        }
      };
      img.src = pictureUrl;
    } else {
      loader.load(pictureUrl, (texture) => {
        if (materialRef.current) {
          materialRef.current.uniforms.uPictureTexture.value = texture;
        }
      });
    }
  }, [pictureUrl]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uPointSizeBase.value = pointSizeBase;
      materialRef.current.uniforms.uDisplacementStrength.value =
        displacementStrength;
    }
  }, [pointSizeBase, displacementStrength]);

  useEffect(() => {
    const updateBounds = () => {
      canvasBounds.current = gl.domElement.getBoundingClientRect();
    };
    updateBounds();

    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds, true);

    return () => {
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds, true);
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!canvasBounds.current) return;
      if (e.pointerType === "touch") e.preventDefault();
      const x = e.clientX - canvasBounds.current.left;
      const y = e.clientY - canvasBounds.current.top;
      displacement.screenCursor.x = (x / canvasBounds.current.width) * 2 - 1;
      displacement.screenCursor.y = -(y / canvasBounds.current.height) * 2 + 1;
    };

    const handleStart = (e: PointerEvent) => {
      if (e.pointerType === "touch") e.preventDefault();
      handleMove(e);
    };

    const handleEnd = () => {
      displacement.screenCursor.copy(OFFSCREEN_CURSOR);
    };

    window.addEventListener("pointerdown", handleStart, { passive: false });
    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointerdown", handleStart);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, []);

  useEffect(() => {
    scene.add(displacement.interactivePlane);
    Object.assign(displacement.canvas.style, {
      position: "fixed",
      width: "256px",
      height: "256px",
      top: "0px",
      left: "0px",
      opacity: "0",
      zIndex: "-1",
      visibility: "hidden",
    });
    document.body.appendChild(displacement.canvas);
    return () => {
      scene.remove(displacement.interactivePlane);
      document.body.removeChild(displacement.canvas);
    };
  }, []);

  useFrame(() => {
    displacement.raycaster.setFromCamera(displacement.screenCursor, camera);
    const hits = displacement.raycaster.intersectObject(
      displacement.interactivePlane
    );
    if (hits.length > 0) {
      const uv = hits[0].uv!;
      displacement.canvasCursor.x = uv.x * displacement.canvas.width;
      displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height;
    }

    const ctx = displacement.context;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.02;
    ctx.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height);

    const dist = displacement.canvasCursor.distanceTo(
      displacement.canvasCursorPrevious
    );
    displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
    const alpha = Math.min(dist * 0.1, 1);

    const glowSize = displacement.canvas.width * glowSizeFactor;
    ctx.globalCompositeOperation = "lighten";
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      displacement.glowImage,
      displacement.canvasCursor.x - glowSize * 0.5,
      displacement.canvasCursor.y - glowSize * 0.5,
      glowSize,
      glowSize
    );

    displacement.texture.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <primitive attach="geometry" object={geometry} />
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
